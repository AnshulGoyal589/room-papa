"use client";

import { useEffect, useRef } from 'react';
import SearchResults from '@/components/customer/search/SearchResults';
import SearchHeader from '@/components/customer/SearchHeader';
import SearchFilter from '@/components/customer/search/SearchFilter';

export default function SearchPage() {
  const scrollPositionRef = useRef<number>(0); // Store scroll position

  
  useEffect(() => {
    const handleScrollSave = () => {
      scrollPositionRef.current = window.scrollY;
    };

    window.addEventListener('scroll', handleScrollSave);

    return () => {
      window.removeEventListener('scroll', handleScrollSave);
    };
  }, []);

  
  useEffect(() => {
    window.scrollTo(0, scrollPositionRef.current);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchHeader />
      <main className="container mx-auto px-4 py-8 flex gap-8">
        <div className="w-1/5">
          <SearchFilter/>
        </div>
        <div className="w-4/5">
          <SearchResults />
        </div>
      </main>
    </div>
  );
}
