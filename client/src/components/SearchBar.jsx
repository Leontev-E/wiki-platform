import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

function SearchBar({ onSearch }) {
  const [search, setSearch] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    onSearch(value);
  };

  return (
    <div className="relative flex-1">
      <input
        type="text"
        placeholder="Поиск по заголовку или содержимому..."
        value={search}
        onChange={handleChange}
        className="w-full p-4 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 animate-fade-in"
      />
      <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
    </div>
  );
}

export default SearchBar;