package com.dpi.service;

import com.dpi.exception.EngineException;
import com.dpi.model.DpiResult;
import com.dpi.model.RuleStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class DpiService {

    private static final Logger log = LoggerFactory.getLogger(DpiService.class);

    @Value("${dpi.engine.path:./engine/dpi_engine}")
    private String enginePath;

    @Value("${dpi.storage.output:./storage/output/}")
    private String outputDir;

    @Value("${dpi.engine.timeout:120}")
    private int timeoutSeconds;

    @Autowired private OutputParserService parser;
    @Autowired private FileStorageService  storageService;
    @Autowired private RuleStore           ruleStore;

    // Latest result kept in memory for /stats endpoint
    private DpiResult lastResult;
    private String    lastOutputFile;

    public DpiResult analyze(Path inputPcap) {
        long   startTime  = System.currentTimeMillis();
        String analysisId = UUID.randomUUID().toString().substring(0, 8);

        Path outputPath = prepareOutputPath(analysisId);

        log.info("[{}] Analyzing: {}", analysisId, inputPcap.getFileName());

        try {
            if (!Files.exists(Paths.get(enginePath))) {
                throw new EngineException("Engine binary not found at: " + enginePath);
            }

            // Build command: engine input output [--block-xxx yyy ...]
            List<String> cmd = new ArrayList<>();
            cmd.add(enginePath);
            cmd.add(inputPcap.toAbsolutePath().toString());
            cmd.add(outputPath.toAbsolutePath().toString());
            cmd.addAll(ruleStore.getEnabledArgs());

            log.info("[{}] Command: {}", analysisId, String.join(" ", cmd));

            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectErrorStream(true);
            pb.environment().put("PATH", System.getenv("PATH"));

            Process process = pb.start();
            String  stdout  = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            if (!finished) { process.destroyForcibly(); throw new EngineException("Engine timed out after " + timeoutSeconds + "s"); }

            int exitCode = process.exitValue();
            log.debug("[{}] stdout:\n{}", analysisId, stdout);

            if (exitCode != 0) throw new EngineException("Engine failed (exit " + exitCode + "): " + stdout);

            DpiResult result = parser.parse(stdout);
            result.setAnalysisId(analysisId);
            result.setProcessingTimeMs(System.currentTimeMillis() - startTime);
            result.setOutputFile(outputPath.toAbsolutePath().toString());

            // Enrich blocked details with rule reason from ruleStore
            enrichBlockedReasons(result);

            lastResult     = result;
            lastOutputFile = outputPath.toAbsolutePath().toString();

            log.info("[{}] Done: {} packets, {}ms", analysisId, result.getTotalPackets(), result.getProcessingTimeMs());
            return result;

        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new EngineException("Engine error: " + e.getMessage());
        } finally {
            storageService.delete(inputPcap);
        }
    }

    private void enrichBlockedReasons(DpiResult result) {
        List<RuleStore.Rule> rules = ruleStore.getEnabled();
        for (DpiResult.BlockedEntry entry : result.getBlockedDetails()) {
            if (entry.getReason() != null) continue;
            for (RuleStore.Rule r : rules) {
                switch (r.type) {
                    case APP    -> { if (r.value.equalsIgnoreCase(entry.getApp()))    { entry.setReason("APP");    entry.setRuleValue(r.value); } }
                    case DOMAIN -> { if (entry.getDomain() != null && entry.getDomain().contains(r.value)) { entry.setReason("DOMAIN"); entry.setRuleValue(r.value); } }
                    case IP     -> { if (r.value.equals(entry.getSourceIp()))        { entry.setReason("IP");     entry.setRuleValue(r.value); } }
                    case PORT   -> { entry.setReason("PORT"); entry.setRuleValue(r.value); }
                }
            }
            if (entry.getReason() == null) { entry.setReason("APP"); entry.setRuleValue(entry.getApp()); }
        }
    }

    public DpiResult getLastResult()    { return lastResult; }
    public String    getLastOutputFile() { return lastOutputFile; }

    private Path prepareOutputPath(String id) {
        try {
            Path dir = Paths.get(outputDir);
            if (!Files.exists(dir)) Files.createDirectories(dir);
            return dir.resolve("out_" + id + ".pcap");
        } catch (IOException e) {
            throw new EngineException("Cannot prepare output dir: " + e.getMessage());
        }
    }
}
