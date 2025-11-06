import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '@/context/AuthContext';
import { getCategories, addCategory, deleteCategory } from '@/api/categories';
import { getUsers, addUser, updateUser, deleteUser, updateUserPassword } from '@/api/users';
import { getServices } from '@/api/services';
import { getArticles } from '@/api/articles';
import Modal from '@/components/Modal';
import Loader from '@/components/Loader';
import { ROLES } from '@/constants/roles';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash, FaUsers, FaServer, FaFileAlt, FaFolder } from 'react-icons/fa';

function Admin() {
  const { user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [servicesCount, setServicesCount] = useState(0);
  const [articlesCount, setArticlesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: ROLES.JUNIOR });
  const [userFormErrors, setUserFormErrors] = useState({});
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [isEditCategoryModalOpen, setEditCategoryModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    children: null,
    onConfirm: null,
    showConfirmButton: false,
  });
  const [isPwdModalOpen, setPwdModalOpen] = useState(false);
  const [editPasswordUserId, setEditPasswordUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const nameInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const categoryInputRef = useRef(null);
  const hasFocusedRef = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fetchedCategories, fetchedUsers, servicesData, articlesData] = await Promise.all([
          getCategories(),
          getUsers(),
          getServices(1, 100),
          getArticles(1, 100),
        ]);
        console.log('Admin data fetched:', {
          categories: fetchedCategories.length,
          users: fetchedUsers.length,
          services: servicesData.length,
          articles: articlesData,
        });
        setCategories(fetchedCategories);
        setUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers);
        setServicesCount(servicesData.length);
        setArticlesCount(articlesData.total || articlesData.length || 0);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Ошибка при загрузке данных');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    console.log('Filtering users by role:', roleFilter);
    if (roleFilter) {
      setFilteredUsers(users.filter((u) => u.role === roleFilter));
    } else {
      setFilteredUsers(users);
    }
  }, [roleFilter, users]);

  useEffect(() => {
    if (isAddUserModalOpen && nameInputRef.current && !hasFocusedRef.current) {
      console.log('Setting focus on name input in add user modal');
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
          hasFocusedRef.current = true;
          console.log('Focus set on name input');
        }
      }, 0);
    }
    if (!isAddUserModalOpen) {
      hasFocusedRef.current = false;
    }
    if (isPwdModalOpen && passwordInputRef.current) {
      console.log('Focusing password input in password modal');
      passwordInputRef.current.focus();
    }
    if (isEditCategoryModalOpen && categoryInputRef.current) {
      console.log('Focusing category input in edit category modal');
      categoryInputRef.current.focus();
    }
  }, [isAddUserModalOpen, isPwdModalOpen, isEditCategoryModalOpen]);

  // Category handlers
  const handleAddCategory = useCallback(async (e) => {
    e.preventDefault();
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      toast.error('Введите название категории');
      return;
    }
    if (categories.some((cat) => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error('Категория уже существует');
      return;
    }
    try {
      const category = { id: uuidv4(), name: trimmedName };
      await addCategory(category);
      setCategories((prev) => [...prev, category]);
      setNewCategoryName('');
      toast.success('Категория добавлена');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error(error.message || 'Ошибка при добавлении категории');
    }
  }, [newCategoryName, categories]);

  const handleEditCategory = useCallback(async () => {
    if (!editCategory?.name.trim()) {
      toast.error('Введите название категории');
      return;
    }
    if (categories.some((cat) => cat.id !== editCategory.id && cat.name.toLowerCase() === editCategory.name.toLowerCase())) {
      toast.error('Категория уже существует');
      return;
    }
    try {
      await addCategory(editCategory); // Заменить на updateCategory, если API будет
      setCategories((prev) => prev.map((cat) => (cat.id === editCategory.id ? editCategory : cat)));
      setEditCategoryModalOpen(false);
      toast.success('Категория обновлена');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error(error.message || 'Ошибка при обновлении категории');
    }
  }, [editCategory, categories]);

  const handleDeleteCategory = useCallback((id) => {
    setModal({
      isOpen: true,
      title: 'Удаление категории',
      children: <p>Вы уверены, что хотите удалить категорию?</p>,
      onConfirm: async () => {
        try {
          await deleteCategory(id);
          setCategories((prev) => prev.filter((cat) => cat.id !== id));
          setModal((prev) => ({ ...prev, isOpen: false }));
          toast.success('Категория удалена');
        } catch (error) {
          console.error('Error deleting category:', error);
          toast.error(error.message || 'Ошибка при удалении категории');
        }
      },
      showConfirmButton: true,
    });
  }, []);

  // User handlers
  const validateUserForm = useCallback(() => {
    const errors = {};
    if (!newUser.name.trim()) errors.name = 'Имя обязательно';
    if (!newUser.email.trim()) {
      errors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email.trim())) {
      errors.email = 'Введите действительный email';
    }
    if (!newUser.password.trim()) {
      errors.password = 'Пароль обязателен';
    } else if (newUser.password.length < 6) {
      errors.password = 'Пароль должен содержать минимум 6 символов';
    }
    if (!newUser.role) errors.role = 'Выберите роль';
    return errors;
  }, [newUser]);

  const handleAddUser = useCallback(async () => {
    const errors = validateUserForm();
    if (Object.keys(errors).length > 0) {
      setUserFormErrors(errors);
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === newUser.email.toLowerCase())) {
      setUserFormErrors({ email: 'Пользователь с таким email уже существует' });
      return;
    }
    try {
      const userData = { ...newUser, id: uuidv4(), name: newUser.name.trim(), email: newUser.email.trim() };
      await addUser(userData);
      setUsers((prev) => [...prev, userData]);
      setFilteredUsers((prev) => [...prev, userData]);
      setNewUser({ name: '', email: '', password: '', role: ROLES.JUNIOR });
      setUserFormErrors({});
      setAddUserModalOpen(false);
      toast.success('Пользователь добавлен');
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error(error.message || 'Ошибка при добавлении пользователя');
    }
  }, [newUser, users, validateUserForm]);

  const handleUpdateRole = useCallback(async (userId, newRole) => {
    try {
      await updateUser(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      setFilteredUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      toast.success('Роль обновлена');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Ошибка при обновлении роли');
    }
  }, []);

  const handleDeleteUser = useCallback((id) => {
    setModal({
      isOpen: true,
      title: 'Удаление пользователя',
      children: <p>Вы уверены, что хотите удалить пользователя?</p>,
      onConfirm: async () => {
        try {
          await deleteUser(id);
          setUsers((prev) => prev.filter((u) => u.id !== id));
          setFilteredUsers((prev) => prev.filter((u) => u.id !== id));
          setModal((prev) => ({ ...prev, isOpen: false }));
          toast.success('Пользователь удалён');
        } catch (error) {
          console.error('Error deleting user:', error);
          toast.error(error.message || 'Ошибка при удалении пользователя');
        }
      },
      showConfirmButton: true,
    });
  }, []);

  const handleUpdatePassword = useCallback(async () => {
    if (!newPassword.trim()) {
      toast.error('Введите новый пароль');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов');
      return;
    }
    try {
      await updateUserPassword(editPasswordUserId, newPassword);
      setPwdModalOpen(false);
      setNewPassword('');
      toast.success('Пароль обновлён');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Ошибка при изменении пароля');
    }
  }, [editPasswordUserId, newPassword]);

  const handleUserFormChange = useCallback((field, value) => {
    console.log(`Changing user form field ${field} to ${value}`);
    setNewUser((prev) => ({ ...prev, [field]: value }));
    if (userFormErrors[field]) {
      setUserFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  }, [userFormErrors]);

  // Мемоизация обработчиков для модалки
  const handleAddUserModalClose = useCallback(() => {
    setAddUserModalOpen(false);
    setUserFormErrors({});
    setNewUser({ name: '', email: '', password: '', role: ROLES.JUNIOR });
  }, []);

  // Мемоизация содержимого модалки
  const addUserModalChildren = useMemo(() => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Имя*</label>
        <input
          type="text"
          value={newUser.name}
          onChange={(e) => handleUserFormChange('name', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
          onFocus={() => console.log('Name input focused')}
          onBlur={() => console.log('Name input blurred')}
          className={`w-full p-4 rounded-lg border ${
            userFormErrors.name ? 'border-red-500' : 'border-gray-300'
          } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
          ref={nameInputRef}
          placeholder="Имя"
        />
        {userFormErrors.name && (
          <p className="mt-1 text-sm text-red-500">{userFormErrors.name}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
        <input
          type="email"
          value={newUser.email}
          onChange={(e) => handleUserFormChange('email', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
          className={`w-full p-4 rounded-lg border ${
            userFormErrors.email ? 'border-red-500' : 'border-gray-300'
          } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
          placeholder="Email"
        />
        {userFormErrors.email && (
          <p className="mt-1 text-sm text-red-500">{userFormErrors.email}</p>
        )}
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Пароль*</label>
        <input
          type={showNewUserPassword ? 'text' : 'password'}
          value={newUser.password}
          onChange={(e) => handleUserFormChange('password', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
          className={`w-full p-4 rounded-lg border ${
            userFormErrors.password ? 'border-red-500' : 'border-gray-300'
          } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 transition-all duration-200`}
          placeholder="Пароль"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 translate-y-1/4 text-gray-500 hover:text-gray-700"
          onClick={() => setShowNewUserPassword((prev) => !prev)}
          aria-label={showNewUserPassword ? 'Скрыть пароль' : 'Показать пароль'}
        >
          {showNewUserPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
        </button>
        {userFormErrors.password && (
          <p className="mt-1 text-sm text-red-500">{userFormErrors.password}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Роль*</label>
        <select
          value={newUser.role}
          onChange={(e) => handleUserFormChange('role', e.target.value)}
          className={`w-full p-4 rounded-lg border ${
            userFormErrors.role ? 'border-red-500' : 'border-gray-300'
          } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
        >
          <option value="">Выберите роль</option>
          {Object.values(ROLES).map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        {userFormErrors.role && (
          <p className="mt-1 text-sm text-red-500">{userFormErrors.role}</p>
        )}
      </div>
    </div>
  ), [newUser, userFormErrors, showNewUserPassword, handleUserFormChange, handleAddUser]);

  if (!user || ![ROLES.OWNER, ROLES.LEAD, ROLES.TECH].includes(user.role)) {
    return (
      <div className="container max-w-7xl mx-auto text-center mt-12 text-gray-500 animate-fade-in">
        Нет доступа
      </div>
    );
  }

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="container max-w-7xl mx-auto mt-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white text-gray-900 rounded-xl shadow-lg p-6 sm:p-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Админ-панель
        </h1>

        {/* Statistics */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Статистика</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-lg shadow-md flex items-center gap-4 transition-transform duration-200 hover:scale-105">
              <FaUsers className="w-8 h-8" />
              <div>
                <p className="text-lg font-medium">Пользователи</p>
                <p className="text-3xl font-bold">{users.length}</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white p-6 rounded-lg shadow-md flex items-center gap-4 transition-transform duration-200 hover:scale-105">
              <FaServer className="w-8 h-8" />
              <div>
                <p className="text-lg font-medium">Сервисы</p>
                <p className="text-3xl font-bold">{servicesCount}</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-6 rounded-lg shadow-md flex items-center gap-4 transition-transform duration-200 hover:scale-105">
              <FaFileAlt className="w-8 h-8" />
              <div>
                <p className="text-lg font-medium">Статьи</p>
                <p className="text-3xl font-bold">{articlesCount}</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-lg shadow-md flex items-center gap-4 transition-transform duration-200 hover:scale-105">
              <FaFolder className="w-8 h-8" />
              <div>
                <p className="text-lg font-medium">Категории</p>
                <p className="text-3xl font-bold">{categories.length}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Категории</h2>
          <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-4 mb-8">
            <input
              type="text"
              placeholder="Новая категория"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 p-4 bg-gray-100 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md"
            >
              Добавить
            </button>
          </form>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Название</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-900">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm text-gray-900">{cat.name}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditCategory(cat);
                          setEditCategoryModalOpen(true);
                        }}
                        className="text-blue-500 hover:text-blue-700 mr-4 transition-colors duration-150"
                        aria-label={`Редактировать категорию ${cat.name}`}
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-red-500 hover:text-red-700 transition-colors duration-150"
                        aria-label={`Удалить категорию ${cat.name}`}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Users */}
        {(user.role === ROLES.OWNER || user.role === ROLES.LEAD || user.role === ROLES.TECH) && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">Пользователи</h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={() => setAddUserModalOpen(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md"
              >
                Добавить пользователя
              </button>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="p-3 bg-gray-100 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Все роли</option>
                {Object.values(ROLES).map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Имя</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Роль</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-900">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 text-sm text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          className="p-2 bg-gray-100 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          aria-label={`Роль пользователя ${u.name}`}
                        >
                          {Object.values(ROLES).map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditPasswordUserId(u.id);
                            setNewPassword('');
                            setShowEditPassword(false);
                            setPwdModalOpen(true);
                          }}
                          className="text-blue-500 hover:text-blue-700 mr-4 transition-colors duration-150"
                          aria-label={`Сменить пароль пользователя ${u.name}`}
                        >
                          Сменить пароль
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-150"
                          aria-label={`Удалить пользователя ${u.name}`}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Add User Modal */}
        <Modal
          isOpen={isAddUserModalOpen}
          onClose={handleAddUserModalClose}
          title="Добавить пользователя"
          showConfirmButton
          onConfirm={handleAddUser}
          confirmText="Добавить"
          cancelText="Отмена"
          focusFirstButton={false}
        >
          {addUserModalChildren}
        </Modal>

        {/* Edit Category Modal */}
        <Modal
          isOpen={isEditCategoryModalOpen}
          onClose={() => setEditCategoryModalOpen(false)}
          title="Редактировать категорию"
          showConfirmButton
          onConfirm={handleEditCategory}
          confirmText="Сохранить"
          cancelText="Отмена"
          focusFirstButton={false}
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название категории*</label>
              <input
                type="text"
                value={editCategory?.name || ''}
                onChange={(e) => setEditCategory((prev) => ({ ...prev, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleEditCategory()}
                className="w-full p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                ref={categoryInputRef}
                placeholder="Название категории"
              />
            </div>
          </div>
        </Modal>

        {/* Password Change Modal */}
        <Modal
          isOpen={isPwdModalOpen}
          onClose={() => setPwdModalOpen(false)}
          title="Изменить пароль"
          showConfirmButton
          onConfirm={handleUpdatePassword}
          confirmText="Подтвердить"
          cancelText="Отмена"
          focusFirstButton={false}
        >
          <div className="space-y-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль*</label>
              <input
                type={showEditPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdatePassword()}
                className="w-full p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 transition-all duration-200"
                ref={passwordInputRef}
                placeholder="Новый пароль"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 translate-y-1/4 text-gray-500 hover:text-gray-700"
                onClick={() => setShowEditPassword((prev) => !prev)}
                aria-label={showEditPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showEditPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </Modal>

        {/* Generic Deletion Modal */}
        <Modal
          isOpen={modal.isOpen}
          onClose={() => setModal((prev) => ({ ...prev, isOpen: false }))}
          title={modal.title}
          onConfirm={modal.onConfirm}
          showConfirmButton={modal.showConfirmButton}
          confirmText="Подтвердить"
          cancelText="Отмена"
        >
          {modal.children}
        </Modal>
      </div>
    </div>
  );
}

export default Admin;