package com.dpi.service;

import com.dpi.model.DpiResult;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.*;

@Service
public class OutputParserService {

    public DpiResult parse(String rawOutput) {
        DpiResult result = new DpiResult();
        Map<String, Integer> protocols    = new LinkedHashMap<>();
        Map<String, Integer> applications = new LinkedHashMap<>();
        Map<String, String>  domains      = new LinkedHashMap<>();
        List<DpiResult.BlockedEntry> blocked = new ArrayList<>();
        List<String> alerts = new ArrayList<>();

        for (String line : rawOutput.split("\\n")) {
            // Strip non-ASCII box-drawing chars, trailing # bars, trim
            String clean = line
                .replaceAll("[^\\x00-\\x7F]", "")
                .replaceAll("#+\\s*$", "")
                .trim();
            if (clean.isEmpty()) continue;

            // ── Stats ──
            if (clean.startsWith("Total Packets:"))  { result.setTotalPackets(extractInt(clean)); continue; }
            if (clean.startsWith("Forwarded:"))       { result.setForwarded(extractInt(clean)); continue; }
            if (clean.startsWith("Dropped:"))         { result.setDropped(extractInt(clean)); continue; }
            if (clean.startsWith("Active Flows:"))    { result.setActiveFlows(extractInt(clean)); continue; }

            // ── Blocked lines: [BLOCKED] 1.2.3.4 -> 5.6.7.8 (YouTube: youtube.com) ──
            if (clean.startsWith("[BLOCKED]")) {
                alerts.add(clean);
                DpiResult.BlockedEntry entry = parseBlockedLine(clean);
                if (entry != null) blocked.add(entry);
                continue;
            }

            // ── Rules confirmation lines from engine ──
            if (clean.startsWith("[Rules] Blocked")) {
                alerts.add("⚠ Rule applied: " + clean.replace("[Rules] ", ""));
                continue;
            }

            // ── Application breakdown lines ──
            // Format: "YouTube        14  18.2%"
            Matcher appMatcher = Pattern.compile(
                "^([A-Za-z][A-Za-z0-9_\\-/]*)\\s+(\\d+)\\s+[\\d.]+%"
            ).matcher(clean);
            if (appMatcher.find()) {
                String name  = appMatcher.group(1).trim();
                int    count = Integer.parseInt(appMatcher.group(2));
                if (isProtocol(name))      protocols.put(name, protocols.getOrDefault(name, 0) + count);
                else if (!isNoise(name))   applications.put(name, count);
                continue;
            }

            // ── Detected domains section: "  - zoom.us -> Zoom" ──
            Matcher sniMatcher = Pattern.compile("-\\s+(.+?)\\s+->\\s+(.+)$").matcher(clean);
            if (sniMatcher.find()) {
                String domain = sniMatcher.group(1).trim();
                String app    = sniMatcher.group(2).trim();
                if (!isProtocol(app) && !isNoise(app)) {
                    domains.put(domain, app);
                    applications.merge(app, 1, Integer::sum);
                }
            }
        }

        result.setProtocols(protocols);
        result.setApplications(applications);
        result.setDomains(domains);
        result.setBlockedDetails(blocked);
        result.setAlerts(alerts);
        return result;
    }

    private DpiResult.BlockedEntry parseBlockedLine(String line) {
        // [BLOCKED] 192.168.1.1 -> 8.8.8.8 (YouTube: youtube.com)
        Pattern p = Pattern.compile(
            "\\[BLOCKED\\]\\s+(\\S+)\\s+->\\s+(\\S+)\\s+\\(([^:)]+)(?::\\s*([^)]+))?\\)"
        );
        Matcher m = p.matcher(line);
        if (!m.find()) return null;

        DpiResult.BlockedEntry e = new DpiResult.BlockedEntry();
        e.setSourceIp(m.group(1));
        e.setDestIp(m.group(2));
        e.setApp(m.group(3).trim());
        e.setDomain(m.group(4) != null ? m.group(4).trim() : "");

        // Determine reason
        if (line.contains("--block-ip"))     { e.setReason("IP");     e.setRuleValue(e.getSourceIp()); }
        else if (line.contains("--block-app")) { e.setReason("APP");   e.setRuleValue(e.getApp()); }
        else if (!e.getDomain().isEmpty())   { e.setReason("DOMAIN"); e.setRuleValue(e.getDomain()); }
        else                                  { e.setReason("APP");   e.setRuleValue(e.getApp()); }
        return e;
    }

    private boolean isProtocol(String n) {
        return Set.of("TCP","UDP","ICMP","HTTP","HTTPS","DNS","TLS").contains(n.toUpperCase());
    }
    private boolean isNoise(String n) {
        return Set.of("UNKNOWN","Unknown","Forwarded","Dropped","Active","Packets",
                      "Processing","Application","Detected","Breakdown","Report","DPI","ENGINE").contains(n);
    }
    private int extractInt(String s) {
        Matcher m = Pattern.compile("\\d+").matcher(s);
        return m.find() ? Integer.parseInt(m.group()) : 0;
    }
}
