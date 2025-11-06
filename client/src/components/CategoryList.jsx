import React, { useState, useEffect } from 'react';
import { getCategories } from '@/api/categories';
import Loader from '@/components/Loader';
import { toast } from 'react-toastify';

export function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        toast.error('Ошибка загрузки категорий');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader />
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return <div className="text-center text-gray-500 p-4 animate-fade-in">Категорий нет</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {categories.map((category) => (
        <div
          key={category.id}
          className="border border-gray-200 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/50 backdrop-blur-md"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900">{category.name}</h2>
          {category.description && (
            <p className="text-gray-700 text-sm">{category.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
