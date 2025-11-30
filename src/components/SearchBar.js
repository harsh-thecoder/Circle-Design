import React, { useState } from 'react';

export default function SearchBar({ onSearch, onFilter }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleSort = (e) => {
    const value = e.target.value;
    setSortBy(value);
    onFilter(value);
  };

  return (
    <div className="search-filter-container">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>
      
      <div className="filter-box">
        <label htmlFor="sort">Sort by:</label>
        <select id="sort" value={sortBy} onChange={handleSort} className="filter-select">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
}
