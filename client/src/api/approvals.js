import { api } from './api';

export const getApprovals = async (start_date, end_date, retries = 2) => {
    try {
        const { data } = await api.get('/approvals', {
            params: { start_date, end_date },
        });
        return Array.isArray(data) ? data : data.approvals || [];
    } catch (error) {
        if (retries > 0 && error.response?.status === 502) {
            console.warn(`Retrying getApprovals, start_date ${start_date}, end_date ${end_date}, retries left: ${retries}`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return getApprovals(start_date, end_date, retries - 1);
        }
        const message = error.response?.data?.message || 'Ошибка при получении данных апрувов';
        console.error('getApprovals error:', error);
        throw new Error(message);
    }
};