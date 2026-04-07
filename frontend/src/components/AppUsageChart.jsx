import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function AppUsageChart({ applications }) {
    const data = Object.entries(applications || {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    if (!data.length) return <div style={styles.empty}>No application data detected</div>;

    return (
        <div style={styles.wrapper}>
            <h3 style={styles.title}>Application Usage</h3>
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <XAxis
                        dataKey="name"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'packets', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
                    />
                    <Tooltip
                        formatter={(val) => [`${val} packets`, 'Count']}
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }}
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

const styles = {
    wrapper: { background: '#1a1d27', borderRadius: 12, padding: '20px 24px' },
    title: { color: '#e2e8f0', fontSize: 15, fontWeight: 600, margin: '0 0 16px' },
    empty: { color: '#64748b', fontSize: 13, padding: 24, textAlign: 'center' },
};
