let users = [
    { id: '1', name: 'Admin', email: 'admin@example.com', role: 'owner', password: 'admin' },
    { id: '2', name: 'User', email: 'user@example.com', role: 'junior', password: 'user' },
];

export const getUsers = () => users;

export const addUser = (user) => {
    users.push(user);
};

export const updateUser = (updatedUser) => {
    users = users.map((user) => (user.id === updatedUser.id ? updatedUser : user));
};

export const deleteUser = (id) => {
    users = users.filter((user) => user.id !== id);
};
