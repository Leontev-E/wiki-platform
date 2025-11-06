import { api } from './api';

export const getCategories = async () => {
    try {
        const { data } = await api.get('/categories');
        return data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Ошибка при получении категорий');
    }
};

export const addCategory = async (category) => {
    try {
        const { data } = await api.post('/categories', category);
        return data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Ошибка при добавлении категории');
    }
};

export const deleteCategory = async (id) => {
    try {
        const { data } = await api.delete(`/categories/${id}`);
        return data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Ошибка при удалении категории');
    }
};