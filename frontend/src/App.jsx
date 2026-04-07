import React, { useState, useEffect } from 'react';
import UploadPage from './components/UploadPage';
import Dashboard  from './components/Dashboard';
import { getRules } from './api/dpiApi';

export default function App() {
    const [result, setResult] = useState(null);
    const [rules,  setRules]  = useState([]);

    const fetchRules = async () => {
        try { const { data } = await getRules(); setRules(data); } catch {}
    };

    useEffect(() => { fetchRules(); }, []);

    return result
        ? <Dashboard result={result} rules={rules} onReset={() => setResult(null)} onRefreshRules={fetchRules} />
        : <UploadPage rules={rules} onResult={r => { setResult(r); fetchRules(); }} />;
}
