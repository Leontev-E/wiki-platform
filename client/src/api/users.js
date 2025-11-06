import { api } from './api';

export const getUsers = async () => {
    try {
        const { data } = await api.get('/users');
        return data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Ошибка при получении пользователей');
    }
};

export const loginUser = async (email, password) => {
    try {
        const { data } = await api.post('/users/login', { email, password });
        return data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Ошибка при входе');
    }
};

export const addUser = async (user) => {
    try {
        const { data } = await api.post('/users', user);
        return data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Ошибка при создании пользователя');
    }
};

export const updateUser = async (id, role) => {
    try {
        const { data } = await api.put(`/users/${id}`, { role });
        return data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Ошибка при обновлении пользователя');
    }
};

export const deleteUser = async (id) => {
    try {
        const { data } = await api.delete(`/users/${id}`);
        return data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Ошибка при удалении пользователя');
    }
};

export const updateUserPassword = async (id, newPassword) => {
    try {
        const { data } = await api.put(`/users/${id}/password`, { password: newPassword });
        return data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Ошибка при смене пароля');
    }
};