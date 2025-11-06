let categories = [
    { id: '1', name: 'Технологии' },
    { id: '2', name: 'Наука' },
];

export const getCategories = () => categories;

export const addCategory = (category) => {
    categories.push(category);
};

export const deleteCategory = (id) => {
    categories = categories.filter((cat) => cat.id !== id);
};