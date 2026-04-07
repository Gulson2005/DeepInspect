import React, { useState } from 'react';
import { addRuleIp, addRuleDomain, addRuleApp, addRulePort, deleteRule, toggleRule, clearRules } from '../api/dpiApi';

const APPS = ['YouTube','Facebook','Instagram','TikTok','Twitter/X','Netflix','Spotify','Discord','Zoom','Telegram','Amazon','Google','GitHub','Cloudflare','Apple','Microsoft'];

export default function RulesPanel({ rules, onRefresh }) {
    const [tab,   setTab]   = useState('APP');
    const [input, setInput] = useState('');
    const [msg,   setMsg]   = useState(null);

    const flash = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

    const handleAdd = async () => {
        if (!input.trim()) return;
        try {
            const fn = { APP: addRuleApp, IP: addRuleIp, DOMAIN: addRuleDomain, PORT: addRulePort }[tab];
            await fn(input.trim());
            setInput('');
            flash(`✓ Rule added: ${tab} → ${input.trim()}`);
            onRefresh();
        } catch (e) {
            flash(e.response?.data?.message || 'Failed to add rule', false);
        }
    };

    const handleDelete = async id => {
        await deleteRule(id);
        flash('Rule removed');
        onRefresh();
    };

    const handleToggle = async id => {
        await toggleRule(id);
        onRefresh();
    };

    const handleClear = async () => {
        if (!window.confirm('Clear all rules?')) return;
        await clearRules();
        flash('All rules cleared');
        onRefresh();
    };

    const ruleTypeColor = type => ({ IP: '#60a5fa', DOMAIN: '#34d399', APP: '#f472b6', PORT: '#fb923c' }[type] || '#94a3b8');
    const ruleTypeBg   = type => ({ IP: '#0c1f3a', DOMAIN: '#0a2a1a', APP: '#2a0a1a', PORT: '#2a1a0a' }[type] || '#1e293b');

    return (
        <div style={s.wrap}>
            <div style={s.header}>
                <div>
                    <h2 style={s.title}>🛡 Rule Management</h2>
                    <p style={s.sub}>Rules are applied when you upload a PCAP file</p>
                </div>
                {rules.length > 0 && (
                    <button style={s.clearBtn} onClick={handleClear}>Clear All</button>
                )}
            </div>

            {/* Offline notice */}
            <div style={s.notice}>
                <span>⚠️</span>
                <span>These rules only affect packet analysis within uploaded PCAP files. They do <strong>NOT</strong> block real internet traffic on your device.</span>
            </div>

            {/* Add Rule */}
            <div style={s.addCard}>
                <h3 style={s.addTitle}>Add New Rule</h3>
                <div style={s.tabs}>
                    {['APP','IP','DOMAIN','PORT'].map(t => (
                        <button key={t} style={{ ...s.tab, ...(tab === t ? { ...s.tabActive, borderBottomColor: ruleTypeColor(t) } : {}) }} onClick={() => { setTab(t); setInput(''); }}>
                            {t}
                        </button>
                    ))}
                </div>

                <div style={s.inputRow}>
                    {tab === 'APP' ? (
                        <select style={s.select} value={input} onChange={e => setInput(e.target.value)}>
                            <option value="">Select application...</option>
                            {APPS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    ) : (
                        <input
                            style={s.input}
                            placeholder={{ IP: '192.168.1.10', DOMAIN: 'facebook.com', PORT: '443' }[tab]}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        />
                    )}
                    <button style={{ ...s.addBtn, background: ruleTypeColor(tab) + '33', color: ruleTypeColor(tab), border: `1px solid ${ruleTypeColor(tab)}44` }} onClick={handleAdd}>
                        + Block {tab}
                    </button>
                </div>

                {msg && <div style={{ ...s.flash, background: msg.ok ? '#0a2a1a' : '#2a0a0a', color: msg.ok ? '#34d399' : '#f87171', border: `1px solid ${msg.ok ? '#15533a' : '#7f1d1d'}` }}>{msg.text}</div>}
            </div>

            {/* Active Rules */}
            <div style={s.rulesCard}>
                <h3 style={s.rulesTitle}>Active Rules ({rules.length})</h3>
                {rules.length === 0 ? (
                    <div style={s.empty}>No rules configured — all traffic will be forwarded</div>
                ) : (
                    <table style={s.table}>
                        <thead>
                            <tr>{['Type','Value','Status','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {rules.map(r => (
                                <tr key={r.id} style={{ ...s.tr, opacity: r.enabled ? 1 : 0.45 }}>
                                    <td style={s.td}>
                                        <span style={{ ...s.typeBadge, background: ruleTypeBg(r.type), color: ruleTypeColor(r.type) }}>{r.type}</span>
                                    </td>
                                    <td style={{ ...s.td, fontWeight: 600, color: '#e2e8f0' }}>{r.value}</td>
                                    <td style={s.td}>
                                        <span style={{ ...s.statusDot, background: r.enabled ? '#22c55e' : '#64748b' }} />
                                        <span style={{ color: r.enabled ? '#22c55e' : '#64748b', fontSize: 12 }}>{r.enabled ? 'Active' : 'Disabled'}</span>
                                    </td>
                                    <td style={s.td}>
                                        <button style={s.iconBtn} onClick={() => handleToggle(r.id)} title={r.enabled ? 'Disable' : 'Enable'}>
                                            {r.enabled ? '⏸' : '▶'}
                                        </button>
                                        <button style={{ ...s.iconBtn, color: '#f87171' }} onClick={() => handleDelete(r.id)} title="Remove">✕</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Rule explanation */}
            <div style={s.explainer}>
                <h4 style={s.expTitle}>How rules work</h4>
                <div style={s.expGrid}>
                    {[
                        { type: 'APP', color: '#f472b6', desc: 'Blocks all packets from a specific application (e.g. YouTube, TikTok)' },
                        { type: 'DOMAIN', color: '#34d399', desc: 'Blocks packets matching a domain name (substring match)' },
                        { type: 'IP', color: '#60a5fa', desc: 'Blocks all packets from a specific source IP address' },
                        { type: 'PORT', color: '#fb923c', desc: 'Blocks all packets on a specific port number' },
                    ].map(({ type, color, desc }) => (
                        <div key={type} style={{ ...s.expCard, borderLeft: `3px solid ${color}` }}>
                            <span style={{ ...s.expType, color }}>{type}</span>
                            <span style={s.expDesc}>{desc}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const s = {
    wrap: { padding: '8px 0' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    title: { color: '#f1f5f9', fontSize: 18, fontWeight: 700, margin: '0 0 4px' },
    sub: { color: '#64748b', fontSize: 13, margin: 0 },
    clearBtn: { background: '#2a0a0a', color: '#f87171', border: '1px solid #7f1d1d', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12 },
    notice: { background: '#0d1f0a', border: '1px solid #15532a', borderRadius: 10, padding: '10px 16px', marginBottom: 20, color: '#86efac', fontSize: 12, display: 'flex', gap: 8, lineHeight: 1.5 },
    addCard: { background: '#111827', borderRadius: 14, padding: '20px 22px', border: '1px solid #1e293b', marginBottom: 16 },
    addTitle: { color: '#e2e8f0', fontSize: 14, fontWeight: 600, margin: '0 0 14px' },
    tabs: { display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid #1e293b' },
    tab: { background: 'transparent', border: 'none', borderBottom: '2px solid transparent', color: '#64748b', padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' },
    tabActive: { color: '#e2e8f0' },
    inputRow: { display: 'flex', gap: 10 },
    input: { flex: 1, background: '#0d1525', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0', padding: '10px 14px', fontSize: 13, outline: 'none' },
    select: { flex: 1, background: '#0d1525', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0', padding: '10px 14px', fontSize: 13, outline: 'none' },
    addBtn: { borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' },
    flash: { marginTop: 12, borderRadius: 8, padding: '8px 14px', fontSize: 13 },
    rulesCard: { background: '#111827', borderRadius: 14, padding: '20px 22px', border: '1px solid #1e293b', marginBottom: 16 },
    rulesTitle: { color: '#e2e8f0', fontSize: 14, fontWeight: 600, margin: '0 0 16px' },
    empty: { color: '#475569', fontSize: 13, background: '#0d1525', borderRadius: 8, padding: '16px', textAlign: 'center' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { color: '#64748b', fontSize: 11, fontWeight: 700, textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' },
    tr: { borderBottom: '1px solid #1e293b', transition: 'opacity 0.2s' },
    td: { color: '#cbd5e1', fontSize: 13, padding: '12px 12px', verticalAlign: 'middle' },
    typeBadge: { borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 },
    statusDot: { display: 'inline-block', width: 7, height: 7, borderRadius: '50%', marginRight: 6 },
    iconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 15, color: '#94a3b8', padding: '2px 6px', borderRadius: 4 },
    explainer: { background: '#111827', borderRadius: 14, padding: '18px 22px', border: '1px solid #1e293b' },
    expTitle: { color: '#e2e8f0', fontSize: 13, fontWeight: 600, margin: '0 0 14px' },
    expGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
    expCard: { background: '#0d1525', borderRadius: 8, padding: '10px 14px' },
    expType: { fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 4 },
    expDesc: { color: '#64748b', fontSize: 12, lineHeight: 1.4 },
};
