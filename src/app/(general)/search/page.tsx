
"use client";

import { useEffect, useRef, useState } from 'react';
import SearchResults from '@/components/customer/search/SearchResults';
import SearchHeader from '@/components/customer/SearchHeader';
import SearchFilter from '@/components/customer/search/SearchFilter';
import { Filter as FilterIcon, X as XIcon } from 'lucide-react'; // Import icons

export default function SearchPage() {
  const scrollPositionRef = useRef<number>(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false); // State for mobile filter visibility

  // Save scroll position
  useEffect(() => {
    const handleScrollSave = () => {
      scrollPositionRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScrollSave, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScrollSave);
    };
  }, []);

  // Restore scroll position
  useEffect(() => {
    if (!isFilterOpen) {
      window.scrollTo(0, scrollPositionRef.current);
    }
  });

  // Lock body scroll when filter is open on mobile
  useEffect(() => {
    if (isFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isFilterOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchHeader />

      {/* Filter Toggle Button (Visible on Mobile) */}
      <div className="md:hidden sticky top-0 z-20 bg-gray-50 p-4 shadow-sm">
        <button
          onClick={() => setIsFilterOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#001d2c] text-white rounded-md font-medium hover:bg-[#001d2c] transition-colors"
          aria-expanded={isFilterOpen}
          aria-controls="search-filter-panel"
        >
          <FilterIcon size={20} />
          Show Filters
        </button>
      </div>

      <main className="container mx-auto max-w-7xl mt-12">
        <div className="flex flex-col md:flex-row relative">
          
          {/* Overlay for mobile when filter is open */}
          {isFilterOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              onClick={() => setIsFilterOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Filter Section - Drawer on mobile, fixed sidebar on desktop */}
          <div
            id="search-filter-panel"
            className={`
              fixed top-0 left-0 h-full w-full max-w-xs sm:max-w-sm z-40 bg-white shadow-xl
              transform transition-transform duration-300 ease-in-out 
              ${isFilterOpen ? 'translate-x-0' : '-translate-x-full'}
              md:translate-x-0
              md:static md:h-auto md:w-1/4 md:max-w-none md:transform-none md:shadow-none md:bg-transparent md:z-auto
              overflow-y-auto md:overflow-y-visible
            `}
          >
            <div className="p-4 md:p-0 h-full">
              {/* Close button for mobile filter drawer */}
              <div className="flex justify-end md:hidden mb-4">
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  aria-label="Close filters"
                >
                  <XIcon size={24} />
                </button>
              </div>
              <SearchFilter />
            </div>
          </div>

          {/* Results Section */}
          <div className=" w-full md:w-3/4">
            <SearchResults />
          </div>
        </div>
      </main>
    </div>
  );
}