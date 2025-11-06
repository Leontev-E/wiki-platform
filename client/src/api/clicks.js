import { api } from './api';

export const getClicks = async (page = 1, limit = 50, retries = 2) => {
    try {
        const { data } = await api.get('/clicks', {
            params: { page, limit },
        });
        return Array.isArray(data) ? data : data.clicks || [];
    } catch (error) {
        if (retries > 0 && error.response?.status === 502) {
            console.warn(`Retrying getClicks, page ${page}, retries left: ${retries}`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return getClicks(page, limit, retries - 1);
        }
        const message = error.response?.data?.message || 'Ошибка при получении данных кликов';
        console.error('getClicks error:', error);
        throw new Error(message);
    }
};