package com.dpi.model;

import org.springframework.stereotype.Component;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class RuleStore {

    public enum RuleType { IP, DOMAIN, APP, PORT }

    public static class Rule {
        public final String id;
        public final RuleType type;
        public final String value;
        public boolean enabled;

        public Rule(RuleType type, String value) {
            this.id = UUID.randomUUID().toString().substring(0, 8);
            this.type = type;
            this.value = value;
            this.enabled = true;
        }

        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", id);
            m.put("type", type.name());
            m.put("value", value);
            m.put("enabled", enabled);
            return m;
        }
    }

    private final List<Rule> rules = new CopyOnWriteArrayList<>();

    public Rule addRule(RuleType type, String value) {
        // Avoid duplicates
        boolean exists = rules.stream()
            .anyMatch(r -> r.type == type && r.value.equalsIgnoreCase(value));
        if (exists) return null;
        Rule rule = new Rule(type, value);
        rules.add(rule);
        return rule;
    }

    public boolean removeRule(String id) {
        return rules.removeIf(r -> r.id.equals(id));
    }

    public boolean toggleRule(String id) {
        return rules.stream()
            .filter(r -> r.id.equals(id))
            .findFirst()
            .map(r -> { r.enabled = !r.enabled; return true; })
            .orElse(false);
    }

    public void clearAll() { rules.clear(); }

    public List<Rule> getAll() { return Collections.unmodifiableList(rules); }

    public List<Rule> getEnabled() {
        return rules.stream().filter(r -> r.enabled).toList();
    }

    public List<String> getEnabledArgs() {
        List<String> args = new ArrayList<>();
        for (Rule r : getEnabled()) {
            switch (r.type) {
                case IP     -> { args.add("--block-ip");     args.add(r.value); }
                case DOMAIN -> { args.add("--block-domain"); args.add(r.value); }
                case APP    -> { args.add("--block-app");    args.add(r.value); }
                case PORT   -> { args.add("--block-port");   args.add(r.value); }
            }
        }
        return args;
    }
}
