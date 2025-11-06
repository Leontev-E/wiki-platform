import { api } from './api';

export const getServices = async (page, limit, search, bustCache = false) => {
    const params = { page, limit, search };
    if (bustCache) {
        params._ = Date.now(); // Cache-bust параметр
    }
    const { data } = await api.get('/services', { params });
    return data.services;
};

export const getServiceCategories = async () => {
    const { data } = await api.get('/services/service-categories');
    return data;
};

export const createService = async (serviceData) => {
    const { data } = await api.post('/services', serviceData);
    return data;
};

export const createServiceCategory = async (categoryData) => {
    const { data } = await api.post('/services/service-categories', categoryData);
    return data;
};

export const updateService = async (id, serviceData) => {
    const { data } = await api.put(`/services/${id}`, serviceData);
    return data;
};

export const deleteService = async (id) => {
    await api.delete(`/services/${id}`);
};