"use client";

import { useEffect, useRef, useState } from 'react';
import SearchResults from '@/components/customer/search/SearchResults';
import SearchHeader from '@/components/customer/SearchHeader';
import SearchFilter from '@/components/customer/search/SearchFilter';
import { Filter as FilterIcon, X as XIcon } from 'lucide-react'; // Import icons

export default function SearchPage() {
  const scrollPositionRef = useRef<number>(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false); // State for mobile filter visibility
  const searchResultsRef = useRef<HTMLDivElement>(null); // Ref for the search results section

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

  // Restore scroll position when filter closes
  useEffect(() => {
    if (!isFilterOpen) {
      window.scrollTo(0, scrollPositionRef.current);
    }
  }, [isFilterOpen]); // Only run when isFilterOpen changes

  // Lock body scroll and handle auto-scroll when filter is open on mobile
  useEffect(() => {
    if (isFilterOpen) {
      document.body.style.overflow = 'hidden';

      // Use a setTimeout to ensure the DOM has updated and the filter animation has started/completed
      const timer = setTimeout(() => {
        if (searchResultsRef.current) {
          // Calculate the target scroll position.
          // We want to scroll to the top of the search results,
          // plus an offset, to reveal the first item properly.
          // `offsetTop` gives the position relative to the nearest positioned ancestor.
          // For a full page scroll, we often want `getBoundingClientRect().top + window.scrollY`.
          // Let's re-evaluate the target based on the main content container.
          
          // A safer approach is to scroll relative to the `main` container, 
          // or directly to the `searchResultsRef` with a bit of offset.
          // Let's try scrolling to the top of the searchResultsRef with an added buffer.
          const topOfSearchResults = searchResultsRef.current.getBoundingClientRect().top + window.scrollY;
          const targetScrollPosition = topOfSearchResults + 100; // Adjust '100' for desired offset

          window.scrollTo({ 
            top: targetScrollPosition, 
            behavior: 'smooth' 
          });
        }
      }, 350); // A small delay (e.g., 350ms) to allow the filter drawer to start opening

      return () => clearTimeout(timer); // Cleanup the timer if component unmounts or effect re-runs
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Cleanup function for body overflow
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isFilterOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchHeader />

      {/* Filter Toggle Button (Visible on Mobile) */}
      <div className="md:hidden sticky mt-12 lg:mt-0 top-0 z-20 bg-gray-50 p-4 shadow-sm">
        <button
          onClick={() => setIsFilterOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#003c95] text-white rounded-md font-medium hover:bg-[#003c95] transition-colors"
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
          <div ref={searchResultsRef} className=" w-full md:w-3/4">
            <SearchResults />
          </div>
        </div>
      </main>
    </div>
  );
}