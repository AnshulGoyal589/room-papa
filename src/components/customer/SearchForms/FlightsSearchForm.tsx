import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Plus, Minus } from 'lucide-react';
import { DateRange } from '@/lib/mongodb/models/Components';

// Define types for our component


export default function FlightsSearchForm() {
  // State variables with proper typing
  const [title, setLocation] = useState<string>('');
  const [title2, setLocation2] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(2025, 3, 18), // April 18, 2025
    endDate: new Date(2025, 4, 23)    // May 23, 2025
  });
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [rooms, setRooms] = useState<number>(1);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [showGuests, setShowGuests] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(4); // April (0-indexed)
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [hasPets, setHasPets] = useState<boolean>(false);
  const [selectionPhase, setSelectionPhase] = useState<number>(0); // 0: no selection, 1: start date selected
  
  const calendarRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef<HTMLDivElement>(null);

  // Format date for display
  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).replace(',', '');
  };

  // Format date for URL parameters (YYYY-MM-DD)
  const formatDateForURL = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Parse date from URL parameter
  const parseDateFromURL = (dateString: string): Date => {
    if (!dateString) return new Date();
    return new Date(dateString);
  };

  // Get initial values from URL parameters
  const setDefaultsFromURL = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Get title
      const titleParam = urlParams.get('title');
      if (titleParam) setLocation(titleParam);



      const titleParam2 = urlParams.get('title2');
      if (titleParam2) setLocation2(titleParam2);
      
      // Get dates
      const checkInParam = urlParams.get('checkIn');
      const checkOutParam = urlParams.get('checkOut');
      
      const startDate = checkInParam ? parseDateFromURL(checkInParam) : new Date(2025, 3, 18);
      const endDate = checkOutParam ? parseDateFromURL(checkOutParam) : new Date(2025, 4, 23);
      
      setDateRange({ startDate, endDate });
      
      // Set initial calendar view to check-in month
      setSelectedMonth(startDate.getMonth());
      setSelectedYear(startDate.getFullYear());
      
      // Get guest information
      const adultsParam = urlParams.get('adults');
      if (adultsParam) setAdults(parseInt(adultsParam, 10));
      
      const childrenParam = urlParams.get('children');
      if (childrenParam) setChildren(parseInt(childrenParam, 10));
      
      const roomsParam = urlParams.get('rooms');
      if (roomsParam) setRooms(parseInt(roomsParam, 10));
      
      const petsParam = urlParams.get('pets');
      if (petsParam) setHasPets(petsParam === 'true');
    } catch (error) {
      console.error("Error parsing URL parameters:", error);
      // Use defaults if there's an error
    }
  };
  
  // Initialize from URL parameters
  useEffect(() => {
    setDefaultsFromURL();
 // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure minimum rooms based on adults count (max 3 adults per room)
  useEffect(() => {
    const requiredRooms = Math.ceil(adults / 3);
    if (rooms < requiredRooms) {
      setRooms(requiredRooms);
    }
  }, [adults, rooms ]);

  // Handle search button click
  const handleSearch = () => {
    const params = new URLSearchParams();
    
    // Only add parameters that have values
    if (title) params.set('title', title);
    if (title2) params.set('title2', title2);

    params.set('category',"travelling");
    
    // Format dates consistently for URL parameters
    params.set('checkIn', formatDateForURL(dateRange.startDate));
    params.set('checkOut', formatDateForURL(dateRange.endDate));
    
    params.set('adults', adults.toString());
    params.set('children', children.toString());
    params.set('rooms', rooms.toString());
    
    if (hasPets) params.set('pets', 'true');

    // Redirect to the search page with params
    window.location.href = `/search?${params.toString()}`;
  };

  // Handle date selection in calendar
  const handleDateClick = (day: number, month: number, year: number) => {
    const newDate = new Date(year, month, day);

    if (selectionPhase === 0) {
      // Start new selection
      setDateRange({ 
        startDate: newDate,
        endDate: new Date(year, month, day) // Initially set end date same as start date
      });
      setSelectionPhase(1);
    } else if (selectionPhase === 1) {
      // Complete the selection
      if (newDate.getTime() > dateRange.startDate.getTime()) {
        setDateRange({ 
          startDate: dateRange.startDate,
          endDate: newDate
        });
        setSelectionPhase(0);
        setTimeout(() => setShowCalendar(false), 300);
      } else {
        // If clicked date is before the start date, make it the new start date
        setDateRange({
          startDate: newDate,
          endDate: dateRange.endDate
        });
        setSelectionPhase(1);
      }
    }
  };

  // Calendar navigation
  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  // Generate calendar data
  const generateCalendar = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<number | null> = [];
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

    // Add empty cells for beginning of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return { days, monthName };
  };

  const { days: currentDays, monthName: currentMonthName } = generateCalendar(selectedMonth, selectedYear);
  const { days: nextDays, monthName: nextMonthName } = generateCalendar(
    selectedMonth === 11 ? 0 : selectedMonth + 1, 
    selectedMonth === 11 ? selectedYear + 1 : selectedYear
  );

  // Date helpers for UI
  const isDateInRange = (day: number | null, month: number, year: number): boolean => {
    if (!day) return false;
    
    const date = new Date(year, month, day);
    const time = date.getTime();
    
    return (
      time >= dateRange.startDate.getTime() && 
      time <= dateRange.endDate.getTime()
    );
  };

  const isStartDate = (day: number | null, month: number, year: number): boolean => {
    if (!day) return false;
    const date = new Date(year, month, day);
    return date.getTime() === dateRange.startDate.getTime();
  };

  const isEndDate = (day: number | null, month: number, year: number): boolean => {
    if (!day) return false;
    const date = new Date(year, month, day);
    return date.getTime() === dateRange.endDate.getTime();
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
        // Reset selection phase if calendar is closed
        if (selectionPhase === 1) {
          setSelectionPhase(0);
        }
      }
      if (
        guestsRef.current &&
        !guestsRef.current.contains(event.target as Node)
      ) {
        setShowGuests(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectionPhase]);

  // Handle guest adjustments
  const adjustGuests = (type: 'adults' | 'children' | 'rooms', operation: 'add' | 'subtract') => {
    if (operation === 'add') {
      if (type === 'adults') {
        const newAdults = adults + 1;
        setAdults(newAdults);
        
        // Auto-adjust rooms if needed (max 3 adults per room)
        const requiredRooms = Math.ceil(newAdults / 3);
        if (rooms < requiredRooms) {
          setRooms(requiredRooms);
        }
      }
      if (type === 'children') setChildren(children + 1);
      if (type === 'rooms') setRooms(rooms + 1);
    } else {
      if (type === 'adults' && adults > 1) {
        setAdults(adults - 1);
      }
      if (type === 'children' && children > 0) setChildren(children - 1);
      if (type === 'rooms' && rooms > 1) {
        // Check if reducing rooms would violate the 3 adults per room rule
        const minRoomsRequired = Math.ceil(adults / 3);
        if (rooms > minRoomsRequired) {
          setRooms(rooms - 1);
        }
      }
    }
  };

  return (
    <div className=" text-black shadow-lg border-yellow-400 border-1 p-0.5 pl-1 pr-1 bg-yellow-400 rounded-lg">
      <div className="flex flex-wrap items-center">
        {/* Location Input */}
        <div className="w-full md:w-1/3 relative">
            <div className="bg-white text-black  h-full p-4 rounded-md flex items-center border-yellow-400 border-3">
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 0 1 3 0l7.5 4.33a2 2 0 0 1 1 1.732V21a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-6h-3v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.577a2 2 0 0 1 1-1.732l7.5-4.33z"/>
              </svg>
              <input 
                type="text" 
                placeholder="Where are you going?" 
                className="flex-1 outline-none text-sm"
                value={title}
                onChange={(e) => setLocation(e.target.value)}
              />
              {title && (
                <button className="text-gray-400" onClick={() => setLocation('')}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          {/* </div> */}
        </div>
        {/* <div className="w-full md:w-1/5 p-1">
          <div className="relative">
            <div className="bg-white text-black p-4 rounded-md flex items-center border-2 border-[#005A9C] hover:border-[#005A9C]">
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 0 1 3 0l7.5 4.33a2 2 0 0 1 1 1.732V21a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-6h-3v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.577a2 2 0 0 1 1-1.732l7.5-4.33z"/>
              </svg>
              <input 
                type="text" 
                placeholder="Where are you going?" 
                className="flex-1 outline-none text-sm"
                value={title2}
                onChange={(e) => setLocation2(e.target.value)}
              />
              {title2 && (
                <button className="text-gray-400" onClick={() => setLocation2('')}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div> */}
        
        {/* Date Range */}
        <div className="w-full md:w-1/3 relative">
          <div 
            className="bg-white text-black p-4 h-full rounded-md flex items-center justify-between border-yellow-400 border-3 cursor-pointer"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 9h-2V7h-2v2h-2v2h2v2h2v-2h2V9zm-4 9H2V6a2 2 0 0 1 2-2h3v2H4v12h14v-2zM6 2v2H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-6V2H6z"/>
              </svg>
              <div className="text-sm">
                <div>
                  {selectionPhase === 1 
                    ? 'Select end date' 
                    : `${formatDisplayDate(dateRange.startDate)} — ${formatDisplayDate(dateRange.endDate)}`}
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
          
          {/* Calendar Dropdown */}
          {showCalendar && (
            <div 
              ref={calendarRef}
              className="absolute left-0 mt-2 bg-white shadow-lg rounded-lg p-4 z-20 border border-gray-200"
              style={{ width: '650px' }}
            >
              <div className="flex justify-between items-center mb-4">
                <button className="text-[#005A9C]" onClick={() => {setShowCalendar(false); setSelectionPhase(0);}}>
                  {selectionPhase === 1 ? 'Select end date' : 'Calendar'}
                </button>
                {/* <button className="text-gray-400">I&apos;m flexible</button> */}
              </div>
              
              <div className="flex space-x-4">
                {/* Current Month */}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">{currentMonthName} {selectedYear}</h3>
                    <div className="flex space-x-2">
                      <button onClick={prevMonth} className="text-gray-500">&lt;</button>
                      <button onClick={nextMonth} className="text-gray-500">&gt;</button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                      <div key={i} className="text-center text-sm py-1 text-gray-500">{day}</div>
                    ))}
                    
                    {currentDays.map((day, i) => (
                      <div 
                        key={i} 
                        className={`text-center py-2 ${!day ? '' : 'cursor-pointer'} ${
                          isDateInRange(day, selectedMonth, selectedYear) 
                            ? 'bg-[#005A9C] text-white' 
                            : 'hover:bg-[#005A9C]'
                        } ${
                          isStartDate(day, selectedMonth, selectedYear) 
                            ? 'rounded-l-full' 
                            : ''
                        } ${
                          isEndDate(day, selectedMonth, selectedYear) 
                            ? 'rounded-r-full' 
                            : ''
                        }`}
                        onClick={() => day && handleDateClick(day, selectedMonth, selectedYear)}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Next Month */}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">
                      {nextMonthName} {selectedMonth === 11 ? selectedYear + 1 : selectedYear}
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                      <div key={i} className="text-center text-sm py-1 text-gray-500">{day}</div>
                    ))}
                    
                    {nextDays.map((day, i) => {
                      const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
                      const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
                      
                      return (
                        <div 
                          key={i} 
                          className={`text-center py-2 ${!day ? '' : 'cursor-pointer'} ${
                            isDateInRange(day, nextMonth, nextYear) 
                              ? 'bg-[#005A9C] text-white' 
                              : 'hover:bg-[#005A9C]'
                          } ${
                            isStartDate(day, nextMonth, nextYear) 
                              ? 'rounded-l-full' 
                              : ''
                          } ${
                            isEndDate(day, nextMonth, nextYear) 
                              ? 'rounded-r-full' 
                              : ''
                          }`}
                          onClick={() => day && handleDateClick(day, nextMonth, nextYear)}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* <div className="flex justify-between mt-4">
                <div className="flex space-x-2">
                  <button className="px-4 py-2 border border-[#005A9C] text-[#005A9C] rounded-full">Exact dates</button>
                  <button className="px-4 py-2 border border-gray-300 rounded-full">1 day</button>
                  <button className="px-4 py-2 border border-gray-300 rounded-full">2 days</button>
                  <button className="px-4 py-2 border border-gray-300 rounded-full">3 days</button>
                  <button className="px-4 py-2 border border-gray-300 rounded-full">7 days</button>
                </div>
              </div> */}
            </div>
          )}
        </div>
        
        {/* Guests */}
        <div className="w-full md:w-1/4 relative">
          <div 
            className="bg-white text-black p-4 rounded-md flex items-center justify-between border-yellow-400 border-3 cursor-pointer"
            onClick={() => setShowGuests(!showGuests)}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 6a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zM18 6A6 6 0 1 0 6 6a6 6 0 0 0 12 0zM3 23v-6.839A1.5 1.5 0 0 1 4.5 14.5h15a1.5 1.5 0 0 1 1.5 1.661V23h1.5v2H1.5v-2H3zm13.5-6.5h-9a.5.5 0 0 0-.5.5V21h10v-4a.5.5 0 0 0-.5-.5zm1.5 0v4h2v-3.5a.5.5 0 0 0-.5-.5H18zm-15 0h2v4H4v-3.5a.5.5 0 0 0-.5-.5z"/>
              </svg>
              <div className="text-sm flex-1">
                <div>{adults} adults · {children} children · {rooms} room{rooms > 1 ? 's' : ''}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </div>
          </div>
          
          {/* Guests Dropdown */}
          {showGuests && (
            <div 
              ref={guestsRef}
              className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg p-4 z-20 border border-gray-200 w-72"
            >
              <div className="space-y-4">
                {/* Adults */}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">Adults</span>
                    <p className="text-xs text-gray-500">Max 3 per room</p>
                  </div>
                  <div className="flex items-center space-x-4 border-2 p-1 border-gray-400">
                    <button 
                      className={`p-1 rounded-full ${adults > 1 ? 'text-[#005A9C]' : 'text-gray-300'}`}
                      onClick={() => adjustGuests('adults', 'subtract')}
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-8 text-center">{adults}</span>
                    <button 
                      className="p-1 rounded-full text-[#005A9C]"
                      onClick={() => adjustGuests('adults', 'add')}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Children */}
                <div className="flex justify-between items-center">
                  <span className="font-medium">Children</span>
                  <div className="flex items-center space-x-4 border-2 p-1 border-gray-400">
                    <button 
                      className={`p-1 rounded-full ${children > 0 ? 'text-[#005A9C]' : 'text-gray-300'}`}
                      onClick={() => adjustGuests('children', 'subtract')}
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-8 text-center">{children}</span>
                    <button 
                      className="p-1 rounded-full text-[#005A9C]"
                      onClick={() => adjustGuests('children', 'add')}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Rooms */}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">Rooms</span>
                    {Math.ceil(adults / 3) > rooms && (
                      <p className="text-xs text-red-500">Min {Math.ceil(adults / 3)} rooms needed</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 border-2 p-1 border-gray-400">
                    <button 
                      className={`p-1 rounded-full ${rooms > 1 && rooms > Math.ceil(adults / 3) ? 'text-[#005A9C]' : 'text-gray-300'}`}
                      onClick={() => adjustGuests('rooms', 'subtract')}
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-8 text-center">{rooms}</span>
                    <button 
                      className="p-1 rounded-full text-[#005A9C]"
                      onClick={() => adjustGuests('rooms', 'add')}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Pets */}
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Travelling with pets?</div>
                    <div className="text-xs ">
                      <span>Assistance animals aren&apos;t considered pets.</span>
                      <div>
                        <a href="#" className="text-[#005A9C]">Read more about travelling with assistance animals</a>
                      </div>
                    </div>
                  </div>
                  <div className="relative inline-block w-10 align-middle select-none">
                    <input 
                      type="checkbox" 
                      name="pets" 
                      id="pets" 
                      className="opacity-0 absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                      checked={hasPets}
                      onChange={() => setHasPets(!hasPets)}
                    />
                    <label 
                      htmlFor="pets" 
                      className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${hasPets ? 'bg-[#005A9C]' : ''}`}
                    >
                      <span className={`block w-6 h-6 rounded-full bg-white shadow transform ${hasPets ? 'translate-x-4' : 'translate-x-0'} transition-transform duration-200 ease-in-out`}></span>
                    </label>
                  </div>
                </div>
                
                <button 
                  className="w-full py-3 bg-[#005A9C] text-white rounded-md font-medium"
                  onClick={() => setShowGuests(false)}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Search Button */}
        <div className="w-full md:w-1/12 pl-1">
        <button 
            className="bg-[#005A9C] hover:bg-[#005A9C] text-white w-full text-xl py-4 rounded-md font-bold flex items-center justify-center h-full"
            onClick={handleSearch}
          >
            Search
            {/* <Search className="h-5 w-5" /> */}
          </button>
        </div>
      </div>
    </div>
  );
}