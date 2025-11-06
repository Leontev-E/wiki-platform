import { api } from './api'; // Используем твой оригинальный импорт

/**
 * Получить список статей с пагинацией и поиском
 * @param {number} page - Номер страницы
 * @param {number} limit - Количество статей на странице
 * @param {string} [search=''] - Поисковый запрос
 * @returns {Promise<Array>} Список статей
 */
export const getArticles = async (page = 1, limit = 10, search = '') => {
    try {
        const response = await api.get('/articles', {
            params: { page, limit, q: search },
        });
        return response.data;
    } catch (error) {
        const message =
            error.response?.data?.message ||
            error.message ||
            'Ошибка при получении списка статей';
        throw new Error(message);
    }
};

/**
 * Получить статью по ID
 * @param {string} id - ID статьи
 * @returns {Promise<Object>} Данные статьи
 */
export const getArticleById = async (id) => {
    try {
        if (!id) throw new Error('ID статьи не указан');
        const response = await api.get(`/articles/${id}`);
        return response.data;
    } catch (error) {
        const message =
            error.response?.data?.message ||
            error.message ||
            'Ошибка при получении статьи';
        throw new Error(message);
    }
};

/**
 * Сохранить статью (создать или обновить)
 * @param {Object} article - Данные статьи
 * @param {boolean} isEditing - Флаг редактирования
 * @returns {Promise<Object>} Сохранённая статья
 */
export const saveArticle = async (article, isEditing) => {
    try {
        if (!article) throw new Error('Данные статьи не предоставлены');
        const response = isEditing
            ? await api.put(`/articles/${article.id}`, article)
            : await api.post('/articles', article);
        return response.data;
    } catch (error) {
        const message =
            error.response?.data?.message ||
            error.message ||
            `Ошибка при ${isEditing ? 'обновлении' : 'создании'} статьи`;
        throw new Error(message);
    }
};

/**
 * Удалить статью
 * @param {string} id - ID статьи
 * @returns {Promise<Object>} Результат удаления
 */
export const deleteArticle = async (id) => {
    try {
        if (!id) throw new Error('ID статьи не указан');
        const response = await api.delete(`/articles/${id}`);
        return response.data;
    } catch (error) {
        const message =
            error.response?.data?.message ||
            error.message ||
            'Ошибка при удалении статьи';
        throw new Error(message);
    }
};