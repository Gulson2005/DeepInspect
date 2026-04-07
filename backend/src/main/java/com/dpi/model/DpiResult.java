package com.dpi.model;

import lombok.Data;
import java.util.*;

@Data
public class DpiResult {
    private String analysisId;
    private long processingTimeMs;
    private int totalPackets;
    private int forwarded;
    private int dropped;
    private int activeFlows;
    private Map<String, Integer> protocols  = new LinkedHashMap<>();
    private Map<String, Integer> applications = new LinkedHashMap<>();
    private Map<String, String>  domains    = new LinkedHashMap<>(); // domain -> app
    private List<BlockedEntry>   blockedDetails = new ArrayList<>();
    private List<String>         alerts     = new ArrayList<>();
    private String               outputFile;

    @Data
    public static class BlockedEntry {
        private String sourceIp;
        private String destIp;
        private String app;
        private String domain;
        private String reason;   // APP / DOMAIN / IP / PORT
        private String ruleValue;
    }
}
