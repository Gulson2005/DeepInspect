import React, { useState } from 'react';

export default function BlockedTrafficPanel({ result }) {
    const [search, setSearch] = useState('');
    const [page,   setPage]   = useState(1);
    const PER_PAGE = 10;

    if (!result) return null;

    const blocked = result.blockedDetails || [];
    const dropped = result.dropped || 0;

    const filtered = blocked.filter(e =>
        !search || [e.sourceIp, e.app, e.domain, e.reason, e.ruleValue]
            .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    );

    const pages   = Math.ceil(filtered.length / PER_PAGE) || 1;
    const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const reasonColor  = r => ({ APP: '#f472b6', DOMAIN: '#34d399', IP: '#60a5fa', PORT: '#fb923c' }[r] || '#94a3b8');
    const reasonBg     = r => ({ APP: '#2a0a1a', DOMAIN: '#0a2a1a', IP: '#0c1f3a', PORT: '#2a1a0a' }[r] || '#1e293b');

    return (
        <div style={s.wrap}>
            <div style={s.header}>
                <div>
                    <h2 style={s.title}>🔴 Blocked Traffic</h2>
                    <p style={s.sub}>Packets that were blocked based on your rules</p>
                </div>
                <div style={s.statRow}>
                    <div style={s.stat}><span style={{ color: '#ef4444', fontSize: 22, fontWeight: 700 }}>{dropped}</span><span style={s.statLbl}>Dropped</span></div>
                    <div style={s.stat}><span style={{ color: '#22c55e', fontSize: 22, fontWeight: 700 }}>{result.forwarded || 0}</span><span style={s.statLbl}>Forwarded</span></div>
                </div>
            </div>

            {dropped === 0 && blocked.length === 0 ? (
                <div style={s.empty}>
                    <div style={s.emptyIcon}>🟢</div>
                    <div style={s.emptyTitle}>No packets were blocked</div>
                    <div style={s.emptySub}>All traffic was forwarded. Add blocking rules and re-upload to block traffic.</div>
                </div>
            ) : (
                <>
                    {/* Summary badges */}
                    <div style={s.summaryRow}>
                        {Object.entries(
                            blocked.reduce((acc, e) => { acc[e.reason] = (acc[e.reason] || 0) + 1; return acc; }, {})
                        ).map(([reason, count]) => (
                            <div key={reason} style={{ ...s.summaryBadge, background: reasonBg(reason), color: reasonColor(reason), border: `1px solid ${reasonColor(reason)}33` }}>
                                {reason} BLOCK: {count}
                            </div>
                        ))}
                    </div>

                    {/* Search */}
                    <div style={s.searchRow}>
                        <input style={s.search} placeholder="🔍 Search by IP, app, domain, reason..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                        <span style={s.count}>{filtered.length} entries</span>
                    </div>

                    {/* Table */}
                    <div style={s.tableWrap}>
                        <table style={s.table}>
                            <thead>
                                <tr>{['Source IP','Dest IP','Application','Domain','Block Reason','Rule'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {visible.length > 0 ? visible.map((e, i) => (
                                    <tr key={i} style={s.tr}>
                                        <td style={s.td}><code style={s.code}>{e.sourceIp || '—'}</code></td>
                                        <td style={s.td}><code style={s.code}>{e.destIp   || '—'}</code></td>
                                        <td style={s.td}><span style={s.appName}>{e.app    || '—'}</span></td>
                                        <td style={s.td}><span style={s.domain}>{e.domain  || '—'}</span></td>
                                        <td style={s.td}>
                                            <span style={{ ...s.reasonBadge, background: reasonBg(e.reason), color: reasonColor(e.reason) }}>
                                                🔴 {e.reason} BLOCK
                                            </span>
                                        </td>
                                        <td style={s.td}><code style={s.code}>{e.ruleValue || '—'}</code></td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: '#475569' }}>No results match your search</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pages > 1 && (
                        <div style={s.pagination}>
                            <button style={s.pageBtn} onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>‹ Prev</button>
                            <span style={s.pageInfo}>Page {page} of {pages}</span>
                            <button style={s.pageBtn} onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages}>Next ›</button>
                        </div>
                    )}
                </>
            )}

            {/* How blocking works */}
            <div style={s.explainer}>
                <strong style={{ color: '#f1f5f9' }}>How to read this table:</strong>
                <div style={s.explainerGrid}>
                    <span style={{ color: '#f472b6' }}>🔴 APP BLOCK</span><span style={s.expDesc}>Blocked because the app matched a blocked application rule</span>
                    <span style={{ color: '#34d399' }}>🔴 DOMAIN BLOCK</span><span style={s.expDesc}>Blocked because the domain matched a blocked domain rule</span>
                    <span style={{ color: '#60a5fa' }}>🔴 IP BLOCK</span><span style={s.expDesc}>Blocked because the source IP matched a blocked IP rule</span>
                    <span style={{ color: '#fb923c' }}>🔴 PORT BLOCK</span><span style={s.expDesc}>Blocked because the port matched a blocked port rule</span>
                </div>
            </div>
        </div>
    );
}

const s = {
    wrap: { padding: '4px 0' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    title: { color: '#f1f5f9', fontSize: 18, fontWeight: 700, margin: '0 0 4px' },
    sub: { color: '#64748b', fontSize: 13, margin: 0 },
    statRow: { display: 'flex', gap: 16 },
    stat: { background: '#111827', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
    statLbl: { color: '#64748b', fontSize: 11 },
    empty: { background: '#0d1f0a', border: '1px solid #15532a', borderRadius: 14, padding: '40px 24px', textAlign: 'center' },
    emptyIcon: { fontSize: 36, marginBottom: 10 },
    emptyTitle: { color: '#86efac', fontSize: 16, fontWeight: 600, marginBottom: 6 },
    emptySub: { color: '#4ade80', fontSize: 13 },
    summaryRow: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
    summaryBadge: { borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700 },
    searchRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
    search: { flex: 1, background: '#111827', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0', padding: '9px 14px', fontSize: 13, outline: 'none' },
    count: { color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' },
    tableWrap: { background: '#111827', borderRadius: 12, border: '1px solid #1e293b', overflow: 'hidden', marginBottom: 12 },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { color: '#64748b', fontSize: 11, fontWeight: 700, textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid #1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#0d1117' },
    tr: { borderBottom: '1px solid #1a2234' },
    td: { color: '#cbd5e1', fontSize: 13, padding: '11px 14px', verticalAlign: 'middle' },
    code: { background: '#0d1525', color: '#93c5fd', borderRadius: 4, padding: '2px 7px', fontSize: 12, fontFamily: 'monospace' },
    appName: { color: '#f1f5f9', fontWeight: 600 },
    domain: { color: '#94a3b8', fontSize: 12 },
    reasonBadge: { borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 },
    pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 },
    pageBtn: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13 },
    pageInfo: { color: '#64748b', fontSize: 13 },
    explainer: { background: '#0d1117', borderRadius: 10, padding: '14px 18px', border: '1px solid #1e293b', fontSize: 13 },
    explainerGrid: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', marginTop: 10, alignItems: 'center' },
    expDesc: { color: '#64748b', fontSize: 12 },
};
