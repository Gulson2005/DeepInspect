import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8080/api' });

export const uploadPcap    = (file, onProgress) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/pcap/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => onProgress && onProgress(Math.round((e.loaded * 100) / e.total))
    });
};

export const getStats      = ()       => api.get('/stats');
export const downloadPcap  = ()       => api.get('/download', { responseType: 'blob' });
export const getRules      = ()       => api.get('/rules');
export const addRuleIp     = value    => api.post('/rules/ip',     { value });
export const addRuleDomain = value    => api.post('/rules/domain', { value });
export const addRuleApp    = value    => api.post('/rules/app',    { value });
export const addRulePort   = value    => api.post('/rules/port',   { value });
export const deleteRule    = id       => api.delete(`/rules/${id}`);
export const toggleRule    = id       => api.patch(`/rules/${id}/toggle`);
export const clearRules    = ()       => api.delete('/rules');
