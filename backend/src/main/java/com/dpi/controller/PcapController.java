package com.dpi.controller;

import com.dpi.exception.InvalidFileException;
import com.dpi.model.DpiResult;
import com.dpi.model.RuleStore;
import com.dpi.service.DpiService;
import com.dpi.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Path;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class PcapController {

    @Autowired private DpiService        dpiService;
    @Autowired private FileStorageService storageService;
    @Autowired private RuleStore          ruleStore;

    // ── Upload & Analyze ──────────────────────────────────────────────────────
    @PostMapping("/pcap/upload")
    public ResponseEntity<DpiResult> upload(@RequestParam("file") MultipartFile file) {
        String name = Objects.requireNonNull(file.getOriginalFilename());
        if (!name.toLowerCase().endsWith(".pcap"))
            throw new InvalidFileException("Only .pcap files are accepted");
        if (file.isEmpty())
            throw new InvalidFileException("Uploaded file is empty");

        Path saved = storageService.save(file);
        return ResponseEntity.ok(dpiService.analyze(saved));
    }

    // ── Stats (last result) ───────────────────────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        DpiResult r = dpiService.getLastResult();
        if (r == null) return ResponseEntity.status(404).body(Map.of("message", "No analysis run yet"));
        return ResponseEntity.ok(r);
    }

    // ── Download filtered PCAP ────────────────────────────────────────────────
    @GetMapping("/download")
    public ResponseEntity<Resource> download() {
        String path = dpiService.getLastOutputFile();
        if (path == null) return ResponseEntity.notFound().build();
        File f = new File(path);
        if (!f.exists()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"filtered.pcap\"")
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .body(new FileSystemResource(f));
    }

    // ── Rules ─────────────────────────────────────────────────────────────────
    @GetMapping("/rules")
    public ResponseEntity<List<Map<String, Object>>> getRules() {
        return ResponseEntity.ok(ruleStore.getAll().stream().map(RuleStore.Rule::toMap).toList());
    }

    @PostMapping("/rules/ip")
    public ResponseEntity<?> addIp(@RequestBody Map<String, String> body) {
        return addRule(RuleStore.RuleType.IP, body.get("value"));
    }

    @PostMapping("/rules/domain")
    public ResponseEntity<?> addDomain(@RequestBody Map<String, String> body) {
        return addRule(RuleStore.RuleType.DOMAIN, body.get("value"));
    }

    @PostMapping("/rules/app")
    public ResponseEntity<?> addApp(@RequestBody Map<String, String> body) {
        return addRule(RuleStore.RuleType.APP, body.get("value"));
    }

    @PostMapping("/rules/port")
    public ResponseEntity<?> addPort(@RequestBody Map<String, String> body) {
        return addRule(RuleStore.RuleType.PORT, body.get("value"));
    }

    @DeleteMapping("/rules/{id}")
    public ResponseEntity<?> deleteRule(@PathVariable String id) {
        boolean removed = ruleStore.removeRule(id);
        return removed
            ? ResponseEntity.ok(Map.of("message", "Rule removed"))
            : ResponseEntity.notFound().build();
    }

    @PatchMapping("/rules/{id}/toggle")
    public ResponseEntity<?> toggleRule(@PathVariable String id) {
        boolean toggled = ruleStore.toggleRule(id);
        return toggled
            ? ResponseEntity.ok(Map.of("message", "Rule toggled"))
            : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/rules")
    public ResponseEntity<?> clearRules() {
        ruleStore.clearAll();
        return ResponseEntity.ok(Map.of("message", "All rules cleared"));
    }

    // ── Health ────────────────────────────────────────────────────────────────
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "DPI Engine API"));
    }

    private ResponseEntity<?> addRule(RuleStore.RuleType type, String value) {
        if (value == null || value.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Value is required"));
        RuleStore.Rule rule = ruleStore.addRule(type, value.trim());
        if (rule == null)
            return ResponseEntity.status(409).body(Map.of("message", "Rule already exists"));
        return ResponseEntity.ok(rule.toMap());
    }
}
