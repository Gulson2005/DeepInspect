import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ProtocolChart({ protocols }) {
    const data = Object.entries(protocols || {}).map(([name, value]) => ({ name, value }));

    if (!data.length) return <div style={styles.empty}>No protocol data</div>;

    return (
        <div style={styles.wrapper}>
            <h3 style={styles.title}>Protocol Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        innerRadius={50}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                        formatter={(val) => [`${val} packets`, 'Count']}
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }}
                    />
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 13 }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

const styles = {
    wrapper: { background: '#1a1d27', borderRadius: 12, padding: '20px 24px' },
    title: { color: '#e2e8f0', fontSize: 15, fontWeight: 600, margin: '0 0 16px' },
    empty: { color: '#64748b', fontSize: 13, padding: 24, textAlign: 'center' },
};
