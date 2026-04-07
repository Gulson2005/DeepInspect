import React, { useState, useRef } from 'react';
import { uploadPcap } from '../api/dpiApi';

export default function UploadPage({ onResult, rules }) {
    const [progress, setProgress] = useState(0);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState(null);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef();

    const handleFile = async file => {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.pcap')) { setError('Only .pcap files are supported.'); return; }
        setError(null); setLoading(true); setProgress(0);
        try {
            const { data } = await uploadPcap(file, setProgress);
            onResult(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Analysis failed. Is the backend running on port 8080?');
        } finally { setLoading(false); }
    };

    return (
        <div style={s.page}>
            {/* Info Banner */}
            <div style={s.infoBanner}>
                <span style={s.infoIcon}>ℹ️</span>
                <span>This system analyzes <strong>.pcap files</strong> only. It does <strong>NOT</strong> block real internet traffic — only packets within the uploaded file.</span>
            </div>

            <div style={s.layout}>
                {/* Upload Card */}
                <div style={s.card}>
                    <div style={s.logo}>🔬</div>
                    <h1 style={s.title}>DPI Engine Analyzer</h1>
                    <p style={s.sub}>Deep Packet Inspection · Protocol Detection · App Classification</p>

                    <div
                        style={{ ...s.zone, ...(dragging ? s.zoneActive : {}), ...(loading ? s.zoneLoading : {}) }}
                        onDragOver={e => { e.preventDefault(); if (!loading) setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={e => { e.preventDefault(); setDragging(false); if (!loading) handleFile(e.dataTransfer.files[0]); }}
                        onClick={() => !loading && inputRef.current.click()}
                    >
                        <input ref={inputRef} type="file" accept=".pcap" onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />
                        {loading ? (
                            <div>
                                <div style={s.spinner} />
                                <p style={s.progLabel}>Analyzing traffic...</p>
                                <div style={s.progTrack}><div style={{ ...s.progFill, width: `${progress}%` }} /></div>
                                <p style={s.progPct}>{progress}% uploaded · Running DPI engine...</p>
                            </div>
                        ) : (
                            <>
                                <div style={s.uploadIcon}>📂</div>
                                <p style={s.dropMain}>Drop your .pcap file here</p>
                                <p style={s.dropSub}>or click to browse</p>
                                <div style={s.badge}>.pcap only · max 100MB</div>
                            </>
                        )}
                    </div>

                    {error && <div style={s.error}>⚠ {error}</div>}

                    <div style={s.features}>
                        {['TCP/UDP/ICMP Detection', 'SNI Extraction', 'App Classification', 'Rule-based Blocking'].map(f => (
                            <div key={f} style={s.feat}>✓ {f}</div>
                        ))}
                    </div>
                </div>

                {/* Active Rules Summary */}
                <div style={s.rulesCard}>
                    <h3 style={s.rulesTitle}>🛡 Active Blocking Rules</h3>
                    <p style={s.rulesSub}>These rules will be applied to your next upload</p>
                    {rules.length === 0 ? (
                        <div style={s.noRules}>No rules set — all traffic will be forwarded</div>
                    ) : (
                        <div style={s.ruleList}>
                            {rules.filter(r => r.enabled).map(r => (
                                <div key={r.id} style={s.ruleItem}>
                                    <span style={{ ...s.ruleTypeBadge, ...ruleColor(r.type) }}>{r.type}</span>
                                    <span style={s.ruleVal}>{r.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <p style={s.rulesHint}>Manage rules from the Dashboard → Rules tab</p>
                </div>
            </div>
        </div>
    );
}

const ruleColor = type => {
    const map = { IP: { background: '#1a2a4a', color: '#60a5fa' }, DOMAIN: { background: '#1a3a2a', color: '#34d399' }, APP: { background: '#3a1a2a', color: '#f472b6' }, PORT: { background: '#3a2a1a', color: '#fb923c' } };
    return map[type] || {};
};

const s = {
    page: { minHeight: '100vh', background: '#0a0d14', fontFamily: 'system-ui,-apple-system,sans-serif', padding: '20px 28px' },
    infoBanner: { background: '#0d1f3c', border: '1px solid #1e3a5f', borderRadius: 10, padding: '12px 18px', marginBottom: 24, color: '#93c5fd', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, lineHeight: 1.5 },
    infoIcon: { fontSize: 18, flexShrink: 0 },
    layout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, maxWidth: 960, margin: '0 auto' },
    card: { background: '#111827', borderRadius: 18, padding: '40px 44px', border: '1px solid #1e293b', textAlign: 'center' },
    logo: { fontSize: 44, marginBottom: 10 },
    title: { color: '#f1f5f9', fontSize: 26, fontWeight: 800, margin: '0 0 8px' },
    sub: { color: '#64748b', fontSize: 13, margin: '0 0 28px' },
    zone: { border: '2px dashed #1e3a5f', borderRadius: 14, padding: '44px 20px', cursor: 'pointer', transition: 'all 0.2s', background: '#0d1525', marginBottom: 16 },
    zoneActive: { borderColor: '#3b82f6', background: '#0d1f3c' },
    zoneLoading: { cursor: 'default' },
    uploadIcon: { fontSize: 40, marginBottom: 10 },
    dropMain: { color: '#cbd5e1', fontSize: 15, fontWeight: 600, margin: '0 0 4px' },
    dropSub: { color: '#64748b', fontSize: 13, margin: '0 0 14px' },
    badge: { display: 'inline-block', background: '#1e293b', color: '#475569', borderRadius: 8, padding: '3px 12px', fontSize: 11 },
    spinner: { width: 30, height: 30, border: '3px solid #1e293b', borderTop: '3px solid #3b82f6', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' },
    progLabel: { color: '#cbd5e1', fontSize: 14, fontWeight: 600, margin: '0 0 10px' },
    progTrack: { background: '#1e293b', borderRadius: 8, height: 8, overflow: 'hidden', marginBottom: 6 },
    progFill: { background: '#3b82f6', height: '100%', borderRadius: 8, transition: 'width 0.3s' },
    progPct: { color: '#64748b', fontSize: 12, margin: 0 },
    error: { background: '#1a0808', border: '1px solid #7f1d1d', color: '#fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14, textAlign: 'left' },
    features: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
    feat: { background: '#0d1525', color: '#475569', borderRadius: 8, padding: '8px 12px', fontSize: 12, textAlign: 'left', border: '1px solid #1e293b' },
    rulesCard: { background: '#111827', borderRadius: 18, padding: '24px 22px', border: '1px solid #1e293b', alignSelf: 'start' },
    rulesTitle: { color: '#f1f5f9', fontSize: 15, fontWeight: 700, margin: '0 0 4px' },
    rulesSub: { color: '#64748b', fontSize: 12, margin: '0 0 16px' },
    noRules: { color: '#475569', fontSize: 13, background: '#0d1525', borderRadius: 8, padding: '12px', textAlign: 'center' },
    ruleList: { display: 'flex', flexDirection: 'column', gap: 8 },
    ruleItem: { display: 'flex', alignItems: 'center', gap: 8, background: '#0d1525', borderRadius: 8, padding: '8px 12px' },
    ruleTypeBadge: { borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700 },
    ruleVal: { color: '#e2e8f0', fontSize: 13 },
    rulesHint: { color: '#334155', fontSize: 11, marginTop: 14, textAlign: 'center' },
};
