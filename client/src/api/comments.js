import { api } from './api';

export const getComments = async (articleId, page = 1, limit = 20, retries = 2) => {
    try {
        const { data } = await api.get(`/comments/${articleId}`, {
            params: { page, limit },
        });
        return Array.isArray(data) ? data : data.comments || [];
    } catch (error) {
        if (retries > 0 && error.response?.status === 502) {
            console.warn(`Retrying getComments for article ${articleId}, retries left: ${retries}`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return getComments(articleId, page, limit, retries - 1);
        }
        const message = error.response?.data?.message || `Ошибка при получении комментариев для статьи ${articleId}`;
        console.error('getComments error:', error);
        throw new Error(message);
    }
};

export const addComment = async (commentData, files = [], retries = 2) => {
    try {
        const formData = new FormData();
        formData.append('articleId', commentData.articleId);
        formData.append('userId', commentData.userId);
        formData.append('userName', commentData.userName);
        formData.append('text', commentData.text);
        if (commentData.parentId) formData.append('parentId', commentData.parentId);
        files.forEach((file) => formData.append('files', file));

        const { data } = await api.post('/comments', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    } catch (error) {
        if (retries > 0 && error.response?.status === 502) {
            console.warn(`Retrying addComment, retries left: ${retries}`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return addComment(commentData, files, retries - 1);
        }
        const message = error.response?.data?.message || 'Ошибка при добавлении комментария';
        console.error('addComment error:', error);
        throw new Error(message);
    }
};

export const deleteComment = async (id, retries = 2) => {
    try {
        const { data } = await api.delete(`/comments/${id}`);
        return data;
    } catch (error) {
        if (retries > 0 && error.response?.status === 502) {
            console.warn(`Retrying deleteComment for id ${id}, retries left: ${retries}`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return deleteComment(id, retries - 1);
        }
        const message = error.response?.data?.message || `Ошибка при удалении комментария ${id}`;
        console.error('deleteComment error:', error);
        throw new Error(message);
    }
};