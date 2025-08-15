'use client';

import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { SearchFormProps } from '@/lib/mongodb/models/Components';



export default function Stays() {
  const [activeTab, setActiveTab] = useState<SearchFormProps['defaultCategory']>('stays');

  return (
    <div className="bg-[#003b95] text-white">
      {/* Main content */}
      <div className="container mx-auto px-4 py-10 md:py-16">
        {/* Navigation tabs */}
        <div className="flex overflow-x-auto no-scrollbar mb-6 pb-1">
          <button 
            onClick={() => setActiveTab('stays')}
            className={`flex items-center px-4 py-2 mr-1 rounded-full whitespace-nowrap ${
              activeTab === 'stays' 
                ? 'bg-[#0071c2] text-white' 
                : 'bg- bg-opacity-30 text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 0 1 3 0l7.5 4.33a2 2 0 0 1 1 1.732V21a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-6h-3v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.577a2 2 0 0 1 1-1.732l7.5-4.33z"/>
            </svg>
            Stays
          </button>
          
          <button 
            onClick={() => setActiveTab('flights')}
            className={`flex items-center px-4 py-2 mr-1 rounded-full whitespace-nowrap ${
              activeTab === 'flights' 
                ? 'bg-[#0071c2] text-white' 
                : 'bg- bg-opacity-30 text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10.5 15.5h3v-3h2l1.5-3h-3.5L16 2h-2l-3.5 7H6l-1.5 3h3.5z"/>
              <path d="M8 18v-7.5H4L5.5 8h7L14 5H7L3 14h3.5v7.5z"/>
            </svg>
            Flights
          </button>
          
          <button 
            onClick={() => setActiveTab('flight+hotel')}
            className={`flex items-center px-4 py-2 mr-1 rounded-full whitespace-nowrap ${
              activeTab === 'flight+hotel' 
                ? 'bg-[#0071c2] text-white' 
                : 'bg- bg-opacity-30 text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 11v8h1.5v-8H2zm19 7.5H7.5V20H22v-9h-1v7.5z"/>
              <path d="M11 8V4.5a2.5 2.5 0 0 1 5 0V8h1.5V4.5a4 4 0 1 0-8 0V8H11z"/>
              <path d="M19.5 10.5v-6h-1v6h-14v-6h-1v6h-2v8h20v-8h-2z"/>
            </svg>
            Flight + Hotel
          </button>
          
          <button 
            onClick={() => setActiveTab('car-rentals')}
            className={`flex items-center px-4 py-2 mr-1 rounded-full whitespace-nowrap ${
              activeTab === 'car-rentals' 
                ? 'bg-[#0071c2] text-white' 
                : 'bg- bg-opacity-30 text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.492 10.342l-1.533-4.6C17.627 4.687 16.623 4 15.5 4h-7c-1.123 0-2.127.687-2.459 1.742l-1.533 4.6A3.001 3.001 0 0 0 4 13v2c0 .729.195 1.412.535 2 .34.588.535 1.271.535 2v1c0 1.1.9 2 2 2h1c1.1 0 2-.9 2-2v-1h4v1c0 1.1.9 2 2 2h1c1.1 0 2-.9 2-2v-1c0-.729.195-1.412.535-2 .34-.588.535-1.271.535-2v-2c0-1.088-.373-2.09-1-2.894zM7.45 7.268C7.615 6.876 7.969 6.6 8.375 6.6h7.25c.406 0 .76.275.925.668L17.88 11H6.12l1.33-3.732zM7 15.5c-.552 0-1-.448-1-1s.448-1 1-1 1 .448 1 1-.448 1-1 1zm10 0c-.552 0-1-.448-1-1s.448-1 1-1 1 .448 1 1-.448 1-1 1z"/>
            </svg>
            Car rentals
          </button>
          
          <button 
            onClick={() => setActiveTab('attractions')}
            className={`flex items-center px-4 py-2 mr-1 rounded-full whitespace-nowrap ${
              activeTab === 'attractions' 
                ? 'bg-[#0071c2] text-white' 
                : 'bg- bg-opacity-30 text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11 6v4.074L8.857 8.937l-.714.713L11 12.5l2.857-2.85-.714-.713L11 10.074V6h5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3zm9.192 3.416a1 1 0 1 0-1.414-1.414c.658-.658 1.689-.985 2.485-.182.797.797.476 1.827-.182 2.485a1 1 0 0 0 1.414 1.414c1.122-1.122 1.536-2.985.03-4.498-1.509-1.498-3.37-1.083-4.498.037a1 1 0 0 0 1.414 1.414c.658-.658 1.689-.986 2.485-.182.276.276.43.556.454.812a.212.212 0 0 1-.088.213c-.108.082-.31.106-.526.106-.216 0-.417-.024-.526-.106a.212.212 0 0 1-.087-.213c.024-.256.178-.536.454-.812a1 1 0 0 0-1.414-1.414c-1.13 1.12-1.544 2.981-.038 4.494 1.506 1.513 3.37 1.1 4.498-.022 1.122-1.122 1.536-2.985.03-4.498-.276-.275-.574-.43-.845-.452a.79.79 0 0 0-.645.24z"/>
            </svg>
            Attractions
          </button>
          
          <button 
            onClick={() => setActiveTab('airport-taxis')}
            className={`flex items-center px-4 py-2 mr-1 rounded-full whitespace-nowrap ${
              activeTab === 'airport-taxis' 
                ? 'bg-[#0071c2] text-white' 
                : 'bg- bg-opacity-30 text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.5 12v4.5S19.167 16 17.5 16s-4 .5-4 .5v-4.5h8zM12.5 16v4.5h-1V16H3L1.342 7.778l1.176-.359L4 13h15l1.482-5.581 1.176.359L20 16h-7.5zm-6 3.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
            </svg>
            Airport taxis
          </button>
        </div>
        
        {/* Main heading */}
        <h1 className="text-3xl md:text-5xl font-bold mb-2">Find your next stay</h1>
        <p className="text-lg mb-6">Search low prices on hotels, homes and much more...</p>
        
        {/* Search form */}
        <div className="bg- bg-opacity-30 p-4 rounded-lg">
          <div className="flex flex-wrap -mx-1">
            <div className="w-full md:w-1/3 p-1">
              <div className="relative">
                <div className="bg-white text-black p-3 rounded-md flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 0 1 3 0l7.5 4.33a2 2 0 0 1 1 1.732V21a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-6h-3v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.577a2 2 0 0 1 1-1.732l7.5-4.33z"/>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Where are you going?" 
                    className="flex-1 outline-none text-sm"
                  />
                  <button className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/3 p-1">
              <div className="bg-white text-black p-3 rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 9h-2V7h-2v2h-2v2h2v2h2v-2h2V9zm-4 9H2V6a2 2 0 0 1 2-2h3v2H4v12h14v-2zM6 2v2H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-6V2H6z"/>
                  </svg>
                  <div className="text-sm">
                    <div>Fri 18 Apr — Fri 23 May</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/4 p-1">
              <div className="bg-white text-black p-3 rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 6a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zM18 6A6 6 0 1 0 6 6a6 6 0 0 0 12 0zM3 23v-6.839A1.5 1.5 0 0 1 4.5 14.5h15a1.5 1.5 0 0 1 1.5 1.661V23h1.5v2H1.5v-2H3zm13.5-6.5h-9a.5.5 0 0 0-.5.5V21h10v-4a.5.5 0 0 0-.5-.5zm1.5 0v4h2v-3.5a.5.5 0 0 0-.5-.5H18zm-15 0h2v4H4v-3.5a.5.5 0 0 0-.5-.5z"/>
                  </svg>
                  <div className="text-sm flex-1">
                    <div>2 adults · 0 children · 1 room</div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/12 p-1">
              <button className="bg-[#0071c2] hover:bg-[#005ea6] text-white w-full py-3 rounded-md font-bold flex items-center justify-center">
                <Search className="h-5 w-5" />
                <span className="ml-1">Search</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Checkbox */}
        <div className="mt-4 flex items-center">
          <input type="checkbox" id="workTrip" className="h-4 w-4 text-blue-600" />
          <label htmlFor="workTrip" className="ml-2 text-sm">I&apos;m traveling for work</label>
        </div>
      </div>
    </div>
  );
}