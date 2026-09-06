import React from 'react';
import { Search } from 'lucide-react';
import SelectField from './SelectField';

export default function ManagementFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  className = '',
}) {
  return (
    <div className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur p-2 sm:p-3 rounded-md border border-slate-200 dark:border-gray-700 flex flex-row flex-wrap gap-2 items-center shadow-sm ${className}`}>

      {(onSearchChange !== undefined || searchValue !== undefined) && (
        <div className="relative flex-[1_1_100%] sm:flex-[1_1_auto] sm:max-w-xs order-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-gray-200 text-xs sm:text-sm rounded-md pl-9 pr-3 py-1.5 sm:py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      )}

      {filters.length > 0 && (
        <div className="flex flex-row flex-wrap gap-2 flex-[1_1_auto] order-2 sm:order-2">
          {filters.map((filter, index) => (
            <div
              key={filter.key || filter.placeholder || index}
              className={`min-w-[140px] sm:min-w-[160px] ${filter.isMulti ? 'flex-[1_1_200px] sm:flex-[1_1_220px]' : 'flex-1 sm:flex-none'}`}
            >
              <SelectField
                value={filter.value}
                onChange={filter.onChange}
                options={filter.options}
                placeholder={filter.placeholder}
                isClearable={filter.isClearable}
                isMulti={Boolean(filter.isMulti)}
                compactMulti={Boolean(filter.compactMulti)}
                isDisabled={Boolean(filter.isDisabled)}
                closeMenuOnSelect={filter.closeMenuOnSelect ?? !filter.isMulti}
                hideSelectedOptions={filter.hideSelectedOptions ?? false}
                className="text-xs sm:text-sm"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
