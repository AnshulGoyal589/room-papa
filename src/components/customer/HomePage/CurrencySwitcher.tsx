"use client";

import React, { useState, useEffect, useRef } from 'react';
import { allCurrencies, suggestedCurrencies, Currency } from '@/lib/data/currencies';
import { Check, X } from 'lucide-react';;

const CurrencySwitcher = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('INR');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Effect to load currency from localStorage on initial client-side render
  useEffect(() => {
    const storedCurrency = localStorage.getItem('currency');
    if (storedCurrency) {
      setSelectedCurrency(storedCurrency);
    }
  }, []);

  // Effect to handle closing modal with Escape key or outside click
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectCurrency = (currencyCode: string) => {
    setSelectedCurrency(currencyCode);
    localStorage.setItem('currency', currencyCode);
    setIsOpen(false);
  };

  // Reusable function to render a list of currencies in a grid
  const renderCurrencyGrid = (currencies: Currency[]) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {currencies.map((currency) => {
        const isSelected = selectedCurrency === currency.code;
        return (
          <button
            key={currency.code}
            onClick={() => handleSelectCurrency(currency.code)}
            className={`flex items-center justify-between w-full p-3 text-left rounded-md transition-colors text-sm
              ${isSelected
                ? 'bg-blue-50' // Light blue background for selected
                : 'hover:bg-gray-100' // Gray background on hover for others
              }`}
          >
            <div>
              <span className={`block ${isSelected ? 'text-blue-700 font-semibold' : 'text-gray-800'}`}>
                {currency.name}
              </span>
              <span className={`${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                {currency.code}
              </span>
            </div>
            {isSelected && <Check className="w-5 h-5 text-blue-700" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="relative">
      {/* Trigger Button: Shows current currency */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-2 font-semibold text-white rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-label={`Select currency, current is ${selectedCurrency}`}
      >
        {selectedCurrency}
      </button>

      {/* Currency Selection Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 bg-opacity-40">
          <div
            ref={modalRef}
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="currency-modal-title"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b">
              <div>
                <h2 id="currency-modal-title" className="text-2xl font-bold text-gray-800">
                  Select your currency
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Where applicable prices will be converted to, and shown in, the currency that you select. The currency you pay in may differ based on your reservation, and a service fee may also apply.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 rounded-full hover:bg-gray-200 hover:text-gray-600"
                aria-label="Close currency selection"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto">
              <h3 className="mb-4 text-base font-bold text-gray-700">Suggested for you</h3>
              {renderCurrencyGrid(suggestedCurrencies)}

              <h3 className="mt-8 mb-4 text-base font-bold text-gray-700">All currencies</h3>
              {renderCurrencyGrid(allCurrencies)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySwitcher;