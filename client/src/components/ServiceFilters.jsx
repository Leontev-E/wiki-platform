import React from 'react';
import SearchBar from './SearchBar';

function ServiceFilters({ categories, search, onSearch, categoryId, onCategoryChange, onClearFilters }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      <SearchBar search={search} onSearch={onSearch} placeholder="Поиск сервисов..." />
      <select
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 animate-fade-in"
      >
        <option value="">Все категории</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
      <button
        onClick={onClearFilters}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 animate-fade-in"
      >
        Очистить
      </button>
    </div>
  );
}

export default ServiceFilters;