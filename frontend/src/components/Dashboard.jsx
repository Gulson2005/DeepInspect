import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import BlockedTrafficPanel from './BlockedTrafficPanel';
import RulesPanel from './RulesPanel';
import { downloadPcap } from '../api/dpiApi';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16','#f97316'];

const APP_ICONS = { YouTube:'▶', Facebook:'📘', Google:'🔍', 'Twitter/X':'𝕏', Instagram:'📷', TikTok:'🎵', Discord:'💬', Zoom:'📹', Spotify:'🎧', Amazon:'📦', GitHub:'💻', Telegram:'✈', Netflix:'🎬', Apple:'🍎', Cloudflare:'☁', Microsoft:'🪟' };

export default function Dashboard({ result, rules, onReset, onRefreshRules }) {
    const [tab, setTab] = useState('overview');

    const protoData = Object.entries(result.protocols || {}).map(([name, value]) => ({ name, value }));
    const appData   = Object.entries(result.applications || {}).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
    const totalProto = protoData.reduce((a, b) => a + b.value, 0);

    const handleDownload = async () => {
        try {
            const res = await downloadPcap();
            const url = URL.createObjectURL(new Blob([res.data]));
            const a   = document.createElement('a'); a.href = url; a.download = 'filtered.pcap'; a.click();
            URL.revokeObjectURL(url);
        } catch { alert('No filtered file available yet.'); }
    };

    const TABS = [
        { id: 'overview', label: '📊 Overview' },
        { id: 'apps',     label: '📱 Applications' },
        { id: 'blocked',  label: `🔴 Blocked (${result.dropped || 0})` },
        { id: 'domains',  label: '🌐 Domains' },
        { id: 'rules',    label: `🛡 Rules (${rules.length})` },
    ];

    return (
        <div style={s.page}>
            {/* Top Bar */}
            <div style={s.topbar}>
                <div>
                    <h1 style={s.heading}>🔬 DPI Analysis Dashboard</h1>
                    <div style={s.metaRow}>
                        <span style={s.metaBadge}>ID: {result.analysisId}</span>
                        <span style={s.metaBadge}>⏱ {result.processingTimeMs}ms</span>
                        <span style={{ ...s.metaBadge, background: '#0a2a1a', color: '#34d399' }}>✓ Complete</span>
                    </div>
                </div>
                <div style={s.topActions}>
                    <button style={s.downloadBtn} onClick={handleDownload}>⬇ Download Filtered PCAP</button>
                    <button style={s.newBtn} onClick={onReset}>+ New Analysis</button>
                </div>
            </div>

            {/* Offline notice */}
            <div style={s.notice}>
                <span>ℹ️</span>
                <span>This analysis is <strong>offline only</strong>. Blocked packets are removed from the filtered PCAP output. Real internet traffic on your device is <strong>not affected</strong>.</span>
            </div>

            {/* Stat Cards */}
            <div style={s.statGrid}>
                <StatCard icon="📦" label="Total Packets"  value={result.totalPackets?.toLocaleString()} color="#3b82f6" />
                <StatCard icon="🟢" label="Forwarded"      value={result.forwarded?.toLocaleString()}    color="#22c55e" />
                <StatCard icon="🔴" label="Dropped"        value={result.dropped?.toLocaleString()}      color={result.dropped > 0 ? '#ef4444' : '#64748b'} />
                <StatCard icon="🔗" label="Active Flows"   value={result.activeFlows?.toLocaleString()}  color="#8b5cf6" />
                <StatCard icon="📱" label="Apps Detected"  value={Object.keys(result.applications||{}).length} color="#f59e0b" />
                <StatCard icon="🚨" label="Alerts"         value={result.alerts?.length || 0}            color={result.alerts?.length ? '#ef4444' : '#64748b'} />
            </div>

            {/* Alerts */}
            {result.alerts?.length > 0 && (
                <div style={s.alertBox}>
                    <div style={s.alertHeader}>🚨 Alerts ({result.alerts.length})</div>
                    {result.alerts.slice(0, 5).map((a, i) => (
                        <div key={i} style={s.alertRow}><span style={s.alertDot}/>{a}</div>
                    ))}
                    {result.alerts.length > 5 && <div style={s.alertMore}>+{result.alerts.length - 5} more alerts</div>}
                </div>
            )}

            {/* Tabs */}
            <div style={s.tabBar}>
                {TABS.map(t => (
                    <button key={t.id} style={{ ...s.tabBtn, ...(tab === t.id ? s.tabActive : {}) }} onClick={() => setTab(t.id)}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div style={s.tabContent}>
                {tab === 'overview' && (
                    <div>
                        <div style={s.chartGrid}>
                            {/* Protocol Pie */}
                            <div style={s.chartCard}>
                                <div style={s.chartHeader}><span style={s.chartTitle}>Protocol Distribution</span></div>
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie data={protoData} cx="50%" cy="50%" outerRadius={95} innerRadius={50} dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                                            {protoData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={v => [`${v} packets`]} contentStyle={tooltipStyle} />
                                        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* App Bar */}
                            <div style={s.chartCard}>
                                <div style={s.chartHeader}><span style={s.chartTitle}>Top Applications</span></div>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={appData.slice(0, 8)} margin={{ left: -10, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} angle={-30} textAnchor="end" />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <Tooltip formatter={v => [`${v} packets`]} contentStyle={tooltipStyle} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {appData.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Protocol Table */}
                        <div style={s.tableCard}>
                            <div style={s.chartHeader}><span style={s.chartTitle}>Protocol Breakdown</span></div>
                            <table style={s.table}>
                                <thead><tr>{['Protocol','Packets','Share','Distribution'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                                <tbody>
                                    {protoData.sort((a,b) => b.value - a.value).map(({ name, value }, i) => {
                                        const pct = ((value / (totalProto || 1)) * 100).toFixed(1);
                                        const col = COLORS[i % COLORS.length];
                                        return (
                                            <tr key={name} style={s.tr}>
                                                <td style={s.td}><span style={{ display:'flex', alignItems:'center', gap:8 }}><span style={{ width:10, height:10, borderRadius:'50%', background:col, display:'inline-block' }}/>{name}</span></td>
                                                <td style={s.td}>{value.toLocaleString()}</td>
                                                <td style={s.td}><span style={{ background: col+'22', color: col, borderRadius:6, padding:'2px 10px', fontSize:12, fontWeight:600 }}>{pct}%</span></td>
                                                <td style={{ ...s.td, width:'38%' }}><div style={s.barTrack}><div style={{ ...s.barFill, width:`${pct}%`, background:col }} /></div></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'apps' && (
                    <div style={s.appsGrid}>
                        {appData.map(({ name, value }, i) => (
                            <div key={name} style={s.appCard}>
                                <div style={s.appIcon}>{APP_ICONS[name] || '🌐'}</div>
                                <div style={s.appName}>{name}</div>
                                <div style={{ ...s.appCount, color: COLORS[i % COLORS.length] }}>{value}</div>
                                <div style={s.appLabel}>packets</div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'blocked' && <BlockedTrafficPanel result={result} />}

                {tab === 'domains' && (
                    <div style={s.tableCard}>
                        <div style={s.chartHeader}>
                            <span style={s.chartTitle}>Detected Domains / SNI</span>
                            <span style={s.chartSub}>{Object.keys(result.domains||{}).length} unique domains</span>
                        </div>
                        <table style={s.table}>
                            <thead><tr>{['Domain','Application','Status'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                            <tbody>
                                {Object.entries(result.domains || {}).map(([domain, app]) => {
                                    const isBlocked = (result.blockedDetails || []).some(e => e.domain === domain);
                                    return (
                                        <tr key={domain} style={s.tr}>
                                            <td style={s.td}><code style={s.code}>{domain}</code></td>
                                            <td style={s.td}><span style={s.appChip}>{APP_ICONS[app] || '🌐'} {app}</span></td>
                                            <td style={s.td}>
                                                {isBlocked
                                                    ? <span style={s.blockedStatus}>🔴 Blocked</span>
                                                    : <span style={s.allowedStatus}>🟢 Allowed</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === 'rules' && <RulesPanel rules={rules} onRefresh={onRefreshRules} />}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    return (
        <div style={{ ...s.statCard, borderTop: `3px solid ${color}` }}>
            <div style={s.statIcon}>{icon}</div>
            <div style={{ ...s.statValue, color }}>{value ?? '—'}</div>
            <div style={s.statLabel}>{label}</div>
        </div>
    );
}

const tooltipStyle = { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' };

const s = {
    page: { minHeight: '100vh', background: '#0a0d14', padding: '24px 28px', fontFamily: 'system-ui,-apple-system,sans-serif' },
    topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    heading: { color: '#f1f5f9', fontSize: 22, fontWeight: 800, margin: '0 0 8px' },
    metaRow: { display: 'flex', gap: 8 },
    metaBadge: { background: '#1e293b', color: '#94a3b8', borderRadius: 6, padding: '3px 10px', fontSize: 12 },
    topActions: { display: 'flex', gap: 10 },
    downloadBtn: { background: '#0a2a1a', color: '#34d399', border: '1px solid #15532a', borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
    newBtn: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
    notice: { background: '#0d1f3c', border: '1px solid #1e3a5f', borderRadius: 10, padding: '10px 16px', marginBottom: 20, color: '#93c5fd', fontSize: 12, display: 'flex', gap: 10, lineHeight: 1.5 },
    statGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 18 },
    statCard: { background: '#111827', borderRadius: 12, padding: '16px 18px', border: '1px solid #1e293b' },
    statIcon: { fontSize: 18, marginBottom: 8 },
    statValue: { fontSize: 24, fontWeight: 800, marginBottom: 4, lineHeight: 1 },
    statLabel: { color: '#64748b', fontSize: 11 },
    alertBox: { background: '#1a0808', border: '1px solid #7f1d1d', borderRadius: 12, padding: '14px 18px', marginBottom: 18 },
    alertHeader: { color: '#fca5a5', fontSize: 13, fontWeight: 700, marginBottom: 8 },
    alertRow: { display: 'flex', alignItems: 'center', gap: 8, color: '#fca5a5', fontSize: 12, padding: '4px 0', borderBottom: '1px solid #2d1515' },
    alertDot: { width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 },
    alertMore: { color: '#f87171', fontSize: 12, marginTop: 6 },
    tabBar: { display: 'flex', gap: 4, borderBottom: '1px solid #1e293b', marginBottom: 20 },
    tabBtn: { background: 'transparent', border: 'none', borderBottom: '2px solid transparent', color: '#64748b', padding: '10px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' },
    tabActive: { color: '#f1f5f9', borderBottomColor: '#3b82f6' },
    tabContent: {},
    chartGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
    chartCard: { background: '#111827', borderRadius: 14, padding: '18px 20px', border: '1px solid #1e293b' },
    chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    chartTitle: { color: '#f1f5f9', fontSize: 14, fontWeight: 700 },
    chartSub: { color: '#64748b', fontSize: 12, background: '#1e293b', borderRadius: 6, padding: '2px 10px' },
    tableCard: { background: '#111827', borderRadius: 14, padding: '18px 20px', border: '1px solid #1e293b', marginBottom: 16 },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { color: '#64748b', fontSize: 11, fontWeight: 700, textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #1e293b', textTransform: 'uppercase', letterSpacing: '0.06em' },
    tr: { borderBottom: '1px solid #1a2234' },
    td: { color: '#cbd5e1', fontSize: 13, padding: '11px 12px', verticalAlign: 'middle' },
    barTrack: { background: '#1e293b', borderRadius: 6, height: 7, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 6, transition: 'width 0.8s ease' },
    appsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 },
    appCard: { background: '#111827', borderRadius: 12, padding: '20px 14px', border: '1px solid #1e293b', textAlign: 'center' },
    appIcon: { fontSize: 28, marginBottom: 8 },
    appName: { color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 4 },
    appCount: { fontSize: 22, fontWeight: 800, marginBottom: 2 },
    appLabel: { color: '#64748b', fontSize: 11 },
    code: { background: '#0d1525', color: '#93c5fd', borderRadius: 4, padding: '2px 7px', fontSize: 12, fontFamily: 'monospace' },
    appChip: { background: '#1e293b', color: '#e2e8f0', borderRadius: 6, padding: '3px 10px', fontSize: 12 },
    blockedStatus: { color: '#f87171', fontSize: 12, fontWeight: 600 },
    allowedStatus: { color: '#34d399', fontSize: 12, fontWeight: 600 },
};
