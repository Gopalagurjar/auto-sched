import React, { useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Topbar() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Yahan aap apni search logic laga sakte ho – abhi sirf alert hai
    alert(`Searching for: ${searchQuery}`);
    // Example: navigate to search results page, filter table, etc.
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="h-16 bg-gray-900/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
      <div className="flex-1" />
      <div className="flex items-center space-x-4">
        <form onSubmit={handleSearch} className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="pl-10 pr-10 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}