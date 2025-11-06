import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Loader from '@/components/Loader';

const KEITARO_API_BASE_URL = import.meta.env.VITE_KEITARO_API_URL || 'https://your-keitaro-instance.com/api/v1'; // Set VITE_KEITARO_API_URL in client/.env when deploying // ����������� VITE_KEITARO_API_URL � client/.env ��� ���� ��������

// Заглушки для API-функций (замени на реальные эндпоинты)
const addDomainToCloudflare = async ({ domain, cloudflareApiToken, zoneId, trackerIp }) => {
  // Пример запроса к Cloudflare API для добавления A-записи
  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cloudflareApiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'A',
      name: domain,
      content: trackerIp,
      ttl: 1,
      proxied: true, // Включаем Cloudflare proxy
    }),
  });
  if (!response.ok) throw new Error('Ошибка добавления домена в Cloudflare');
  return response.json();
};

const bindDomainToKeitaro = async ({ domain, keitaroApiToken, trackerIp }) => {
  // Пример запроса к Keitaro API для привязки домена
  const response = await fetch(`${KEITARO_API_BASE_URL}/domains`, {
    method: 'POST',
    headers: {
      'Api-Key': keitaroApiToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      domain: domain,
      ip: trackerIp,
      cloudflare_proxy: true,
    }),
  });
  if (!response.ok) throw new Error('Ошибка привязки домена к Keitaro');
  return response.json();
};

function DomainBinding() {
  const [formData, setFormData] = useState({
    domain: '',
    cloudflareApiToken: '',
    zoneId: '',
    keitaroApiToken: '',
    trackerIp: '',
  });
  const [errors, setErrors] = useState({});

  // Мутация для Cloudflare
  const cloudflareMutation = useMutation({
    mutationFn: addDomainToCloudflare,
    onSuccess: () => {
      toast.success('Домен успешно добавлен в Cloudflare');
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  // Мутация для Keitaro
  const keitaroMutation = useMutation({
    mutationFn: bindDomainToKeitaro,
    onSuccess: () => {
      toast.success('Домен успешно привязан к Keitaro');
      setFormData({
        domain: '',
        cloudflareApiToken: '',
        zoneId: '',
        keitaroApiToken: '',
        trackerIp: '',
      });
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.domain) newErrors.domain = 'Введите домен';
    if (!formData.cloudflareApiToken) newErrors.cloudflareApiToken = 'Введите API-токен Cloudflare';
    if (!formData.zoneId) newErrors.zoneId = 'Введите ID зоны Cloudflare';
    if (!formData.keitaroApiToken) newErrors.keitaroApiToken = 'Введите API-токен Keitaro';
    if (!formData.trackerIp) newErrors.trackerIp = 'Введите IP трекера';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      // Сначала добавляем домен в Cloudflare
      await cloudflareMutation.mutateAsync({
        domain: formData.domain,
        cloudflareApiToken: formData.cloudflareApiToken,
        zoneId: formData.zoneId,
        trackerIp: formData.trackerIp,
      });
      // Затем привязываем домен к Keitaro
      await keitaroMutation.mutateAsync({
        domain: formData.domain,
        keitaroApiToken: formData.keitaroApiToken,
        trackerIp: formData.trackerIp,
      });
    } catch (error) {
      console.error('Ошибка при привязке домена:', error);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto p-6 animate-slide-up">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
        Привязка нового домена
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white/90 dark:bg-gray-800/90 p-8 rounded-lg shadow-md glass"
      >
        <div className="mb-6">
          <label
            htmlFor="domain"
            className="block text-gray-700 dark:text-gray-200 font-medium mb-2"
          >
            Домен
          </label>
          <input
            type="text"
            id="domain"
            name="domain"
            value={formData.domain}
            onChange={handleChange}
            className={`w-full p-4 rounded-lg border ${
              errors.domain ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600`}
            placeholder="example.com"
          />
          {errors.domain && (
            <p className="text-red-500 text-sm mt-1">{errors.domain}</p>
          )}
        </div>
        <div className="mb-6">
          <label
            htmlFor="cloudflareApiToken"
            className="block text-gray-700 dark:text-gray-200 font-medium mb-2"
          >
            API-токен Cloudflare
          </label>
          <input
            type="text"
            id="cloudflareApiToken"
            name="cloudflareApiToken"
            value={formData.cloudflareApiToken}
            onChange={handleChange}
            className={`w-full p-4 rounded-lg border ${
              errors.cloudflareApiToken ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600`}
            placeholder="Ваш API-токен Cloudflare"
          />
          {errors.cloudflareApiToken && (
            <p className="text-red-500 text-sm mt-1">{errors.cloudflareApiToken}</p>
          )}
        </div>
        <div className="mb-6">
          <label
            htmlFor="zoneId"
            className="block text-gray-700 dark:text-gray-200 font-medium mb-2"
          >
            ID зоны Cloudflare
          </label>
          <input
            type="text"
            id="zoneId"
            name="zoneId"
            value={formData.zoneId}
            onChange={handleChange}
            className={`w-full p-4 rounded-lg border ${
              errors.zoneId ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600`}
            placeholder="ID зоны Cloudflare"
          />
          {errors.zoneId && (
            <p className="text-red-500 text-sm mt-1">{errors.zoneId}</p>
          )}
        </div>
        <div className="mb-6">
          <label
            htmlFor="keitaroApiToken"
            className="block text-gray-700 dark:text-gray-200 font-medium mb-2"
          >
            API-токен Keitaro
          </label>
          <input
            type="text"
            id="keitaroApiToken"
            name="keitaroApiToken"
            value={formData.keitaroApiToken}
            onChange={handleChange}
            className={`w-full p-4 rounded-lg border ${
              errors.keitaroApiToken ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600`}
            placeholder="Ваш API-токен Keitaro"
          />
          {errors.keitaroApiToken && (
            <p className="text-red-500 text-sm mt-1">{errors.keitaroApiToken}</p>
          )}
        </div>
        <div className="mb-6">
          <label
            htmlFor="trackerIp"
            className="block text-gray-700 dark:text-gray-200 font-medium mb-2"
          >
            IP трекера
          </label>
          <input
            type="text"
            id="trackerIp"
            name="trackerIp"
            value={formData.trackerIp}
            onChange={handleChange}
            className={`w-full p-4 rounded-lg border ${
              errors.trackerIp ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600`}
            placeholder="IP-адрес сервера трекера"
          />
          {errors.trackerIp && (
            <p className="text-red-500 text-sm mt-1">{errors.trackerIp}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={cloudflareMutation.isLoading || keitaroMutation.isLoading}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:scale-[1.02] transition-all duration-200 shadow-md neon-hover disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {cloudflareMutation.isLoading || keitaroMutation.isLoading ? (
            <Loader />
          ) : (
            'Привязать домен'
          )}
        </button>
      </form>
    </div>
  );
}

export default DomainBinding;