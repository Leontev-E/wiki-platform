import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  getServices,
  getServiceCategories,
  createService,
  createServiceCategory,
} from '../api/services';
import ServiceFilters from '../components/ServiceFilters';
import ServiceCard from '../components/ServiceCard';
import Loader from '../components/Loader';
import Modal from '../components/Modal';

function Services() {
  const { user } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    newCategoryName: '',
    url: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const nameInputRef = useRef(null);
  const hasFocusedRef = useRef(false);
  const activeInputRef = useRef(null); // Для отслеживания активного поля

  const servicesPerPage = 16;

  if (!user) {
    return <Navigate to="/login" />;
  }

  const fetchData = async (bustCache = false) => {
    setIsLoading(true);
    try {
      const [servicesData, cats] = await Promise.all([
        getServices(1, 100, search, bustCache),
        getServiceCategories(),
      ]);
      console.log('getServices response:', servicesData);
      const enriched = servicesData.map((service) => {
        const cat = cats.find((c) => c.id === service.categoryId);
        return {
          ...service,
          categoryName: cat ? cat.name : 'Без категории',
        };
      });
      setServices(enriched);
      setFilteredServices(enriched);
      setCategories(cats);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  useEffect(() => {
    let updated = [...services];
    if (categoryId) {
      updated = updated.filter((service) => service.categoryId === categoryId);
    }
    setFilteredServices(updated);
    setCurrentPage(1);
  }, [categoryId, services]);

  useEffect(() => {
    if (isModalOpen && nameInputRef.current && !hasFocusedRef.current) {
      console.log('Setting focus on name input');
      nameInputRef.current.focus();
      hasFocusedRef.current = true;
      activeInputRef.current = nameInputRef.current;
    }
    if (!isModalOpen) {
      hasFocusedRef.current = false;
      activeInputRef.current = null;
    }
  }, [isModalOpen]);

  // Восстановление фокуса после ререндера
  useEffect(() => {
    if (isModalOpen && activeInputRef.current) {
      console.log('Restoring focus to:', activeInputRef.current);
      activeInputRef.current.focus();
    }
  }, [isModalOpen, formData, formErrors]);

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryId('');
    setFilteredServices(services);
    setCurrentPage(1);
  };

  const indexOfLastService = currentPage * servicesPerPage;
  const indexOfFirstService = indexOfLastService - servicesPerPage;
  const currentServices = filteredServices.slice(
    indexOfFirstService,
    indexOfLastService
  );
  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);

  const getPaginationRange = () => {
    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: '',
      categoryId: '',
      newCategoryName: '',
      url: '',
      description: '',
    });
    setFormErrors({});
    setSubmitMessage('');
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Название сервиса обязательно';
    if (!formData.categoryId && !formData.newCategoryName.trim()) {
      errors.category = 'Выберите категорию или введите новую';
    }
    if (formData.categoryId === 'new' && !formData.newCategoryName.trim()) {
      errors.newCategoryName = 'Название новой категории обязательно';
    }
    if (!formData.url.trim()) {
      errors.url = 'Ссылка обязательна';
    } else {
      try {
        new URL(formData.url);
      } catch {
        errors.url = 'Введите действительный URL';
      }
    }
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setIsSubmitting(true);
    setSubmitMessage('');
    try {
      let catId = formData.categoryId;
      if (formData.categoryId === 'new') {
        const { id } = await createServiceCategory({ name: formData.newCategoryName });
        catId = id;
      }
      let url = formData.url;
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }
      await createService({
        title: formData.name,
        url,
        description: formData.description,
        categoryId: catId,
      });
      setSubmitMessage('Сервис успешно добавлен!');
      setTimeout(() => {
        closeModal();
        fetchData(true);
      }, 1000);
    } catch (error) {
      console.error('Ошибка при добавлении сервиса:', error);
      setSubmitMessage('Ошибка при добавлении сервиса: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormChange = useCallback((field, value) => {
    console.log(`Changing field ${field} to ${value}`);
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  const handleFocus = (ref) => {
    activeInputRef.current = ref.current;
    console.log('Focused input:', activeInputRef.current);
  };

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Полезные сервисы</h1>
        {(user.role === 'owner' || user.role === 'lead' || user.role === 'tech') && (
          <button
            onClick={openModal}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 animate-fade-in"
          >
            Добавить сервис
          </button>
        )}
      </div>

      <ServiceFilters
        categories={categories}
        search={search}
        onSearch={handleSearch}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        onClearFilters={clearFilters}
      />

      {isLoading ? (
        <div className="flex justify-center">
          <Loader />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {currentServices.length === 0 ? (
            <p className="text-center text-gray-600 col-span-full">Сервисы не найдены</p>
          ) : (
            currentServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))
          )}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex justify-center items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 hover:bg-blue-600 transition-all duration-200"
          >
            Назад
          </button>
          {getPaginationRange().map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                currentPage === page
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 hover:bg-blue-600 transition-all duration-200"
          >
            Далее
          </button>
        </nav>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Добавить сервис"
        showConfirmButton
        onConfirm={handleSubmit}
        confirmText="Добавить"
        cancelText="Отмена"
        isSubmitting={isSubmitting}
        focusFirstButton={false}
      >
        <div className="space-y-6">
          {submitMessage && (
            <div
              className={`p-4 rounded-lg ${
                submitMessage.includes('успешно')
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {submitMessage}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название сервиса*
            </label>
            <input
              type="text"
              key="service-name-input"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              onFocus={() => handleFocus(nameInputRef)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className={`w-full p-4 rounded-lg border ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
              ref={nameInputRef}
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория*
            </label>
            <select
              key="service-category-select"
              value={formData.categoryId}
              onChange={(e) => handleFormChange('categoryId', e.target.value)}
              onFocus={() => handleFocus({ current: document.activeElement })}
              className={`w-full p-4 rounded-lg border ${
                formErrors.category ? 'border-red-500' : 'border-gray-300'
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
            >
              <option value="">Выберите категорию</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
              <option value="new">+ Добавить новую категорию</option>
            </select>
            {formErrors.category && (
              <p className="mt-1 text-sm text-red-500">{formErrors.category}</p>
            )}
          </div>
          {formData.categoryId === 'new' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Новая категория*
              </label>
              <input
                type="text"
                key="new-category-input"
                value={formData.newCategoryName}
                onChange={(e) => handleFormChange('newCategoryName', e.target.value)}
                onFocus={() => handleFocus({ current: document.activeElement })}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className={`w-full p-4 rounded-lg border ${
                  formErrors.newCategoryName ? 'border-red-500' : 'border-gray-300'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
              />
              {formErrors.newCategoryName && (
                <p className="mt-1 text-sm text-red-500">{formErrors.newCategoryName}</p>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ссылка*
            </label>
            <input
              type="url"
              key="service-url-input"
              value={formData.url}
              onChange={(e) => handleFormChange('url', e.target.value)}
              onFocus={() => handleFocus({ current: document.activeElement })}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className={`w-full p-4 rounded-lg border ${
                formErrors.url ? 'border-red-500' : 'border-gray-300'
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
              placeholder="https://example.com"
            />
            {formErrors.url && (
              <p className="mt-1 text-sm text-red-500">{formErrors.url}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              key="service-description-textarea"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              onFocus={() => handleFocus({ current: document.activeElement })}
              className="w-full p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              rows="4"
              placeholder="Краткое описание сервиса..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Services;