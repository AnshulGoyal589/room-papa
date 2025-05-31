import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Plus, Minus } from 'lucide-react';

// Define types for our component
interface DateRange {
  startDate: Date;
  endDate: Date;
}

export default function StaysSearchForm() {
  // State variables with proper typing
  const [title, setLocation] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now()),
    endDate: new Date(Date.now()+  7 * 24 * 60 * 60 * 1000 )  
  });
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [rooms, setRooms] = useState<number>(1);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [showGuests, setShowGuests] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(3); // Initial state April (was 4, month is 0-indexed)
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
  const year = date.getFullYear(); // Gets the year according to local time
  const month = date.getMonth() + 1; // Gets the month (0-11) according to local time, so add 1
  const day = date.getDate();       // Gets the day of the month according to local time

  // Pad month and day with a leading zero if they are single digit
  const monthFormatted = month < 10 ? `0${month}` : month.toString();
  const dayFormatted = day < 10 ? `0${day}` : day.toString();

  return `${year}-${monthFormatted}-${dayFormatted}`;
};

  // Parse date from URL parameter (YYYY-MM-DD string)
  const parseDateFromURL = (dateString: string): Date => {
    // dateString is in 'YYYY-MM-DD' format.
    // Splitting and using new Date(year, monthIndex, day) ensures it's local midnight.
    const parts = dateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // This month is 1-indexed (1 for Jan, 12 for Dec)
    const day = parseInt(parts[2], 10);
    
    // Month for Date constructor is 0-indexed (0 for Jan, 11 for Dec)
    return new Date(year, month - 1, day, 0, 0, 0, 0); // Explicitly set time to midnight local
  };

  // Get initial values from URL parameters
  const setDefaultsFromURL = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      
      const titleParam = urlParams.get('title');
      if (titleParam) setLocation(titleParam);
      
      const checkInParam = urlParams.get('checkIn');
      const checkOutParam = urlParams.get('checkOut');
      
      // Default dates: today at midnight and 7 days from today at midnight
      const defaultStartDate = new Date(localStorage.getItem('checkIn')  as string) || new Date();
    
      defaultStartDate.setHours(0, 0, 0, 0);

      const defaultEndDate = new Date(localStorage.getItem('checkOut')  as string) || new Date(defaultStartDate);
      // defaultEndDate.setDate(defaultStartDate.getDate() + 7);
      
      const startDate = checkInParam ? parseDateFromURL(checkInParam) : defaultStartDate;
      const endDate = checkOutParam ? parseDateFromURL(checkOutParam) : defaultEndDate;
      
      setDateRange({ startDate, endDate });
      localStorage.setItem('checkIn', startDate.toISOString()); // Store as ISO string (UTC)
      localStorage.setItem('checkOut', endDate.toISOString()); // Store as ISO string (UTC)
      
      setSelectedMonth(startDate.getMonth());
      setSelectedYear(startDate.getFullYear());
      
      const adultsParam = urlParams.get('adults') || localStorage.getItem('adults') || '2'; // Default to '2' if not set
      if (adultsParam){
        setAdults(parseInt(adultsParam, 10));
        localStorage.setItem('adults', adultsParam); // Removed default '2' here to rely on state default
      }
      
      const childrenParam = urlParams.get('children') || localStorage.getItem('children') || '0'; // Default to '0' if not set
      if (childrenParam){
        setChildren(parseInt(childrenParam, 10));
        localStorage.setItem('children', childrenParam); // Removed default '0'
      }
      
      const roomsParam = urlParams.get('rooms') || localStorage.getItem('rooms') || '1'; // Default to '1' if not set
      if (roomsParam) {
        setRooms(parseInt(roomsParam, 10));
        localStorage.setItem('rooms', roomsParam); // Removed default '1'
      }
      
      const petsParam = urlParams.get('pets');
      if (petsParam){
        setHasPets(petsParam === 'true');
        localStorage.setItem('pets', petsParam); // Removed default 'false'
      }
    } catch (error) {
      console.error("Error parsing URL parameters:", error);
      // Component will use its useState initial defaults if this fails.
    }
  };
  
  useEffect(() => {
    setDefaultsFromURL();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const requiredRooms = Math.ceil(adults / 3);
    if (rooms < requiredRooms) {
      setRooms(requiredRooms);
      // No need to set localStorage here, adjustGuests handles it.
      // Or, if this effect is crucial for direct adults changes elsewhere:
      // localStorage.setItem('rooms', requiredRooms.toString());
    }
  }, [adults, rooms]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (title) params.set('title', title);

    console.log(" dateRange.startDate:",dateRange.startDate);
    console.log(" dateRange.endDate:", formatDateForURL(dateRange.startDate));
    
    params.set('checkIn', formatDateForURL(dateRange.startDate));
    params.set('checkOut', formatDateForURL(dateRange.endDate));
    
    params.set('adults', adults.toString());
    params.set('children', children.toString());
    params.set('rooms', rooms.toString());
    
    if (hasPets) params.set('pets', 'true');

    window.location.href = `/customer/search?${params.toString()}`;
  };

  const handleDateClick = (day: number, month: number, year: number) => {
    const newDate = new Date(year, month, day, 0, 0, 0, 0); // Ensure midnight local time

    if (selectionPhase === 0) {
      setDateRange({ 
        startDate: newDate,
        endDate: newDate 
      });
      setSelectionPhase(1);
    } else if (selectionPhase === 1) {
      const currentStartDate = dateRange.startDate; // Get from state before update
      
      if (newDate.getTime() > currentStartDate.getTime()) {
        setDateRange({ 
          startDate: currentStartDate,
          endDate: newDate
        });
        localStorage.setItem('checkIn', currentStartDate.toISOString());
        localStorage.setItem('checkOut', newDate.toISOString());
      } else { // newDate is on or before currentStartDate; newDate becomes startDate, currentStartDate becomes endDate
        setDateRange({
          startDate: newDate,
          endDate: currentStartDate 
        });
        localStorage.setItem('checkIn', newDate.toISOString());
        localStorage.setItem('checkOut', currentStartDate.toISOString());
      }
      setSelectionPhase(0); // Selection is complete
      setTimeout(() => setShowCalendar(false), 300); // Close calendar
    }
  };
  
  // Calendar navigation (no changes needed)
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

  // Generate calendar data (no changes needed)
  const generateCalendar = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Array<number | null> = [];
    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return { days, monthName };
  };

  const { days: currentDays, monthName: currentMonthName } = generateCalendar(selectedMonth, selectedYear);
  const { days: nextDays, monthName: nextMonthName } = generateCalendar(
    selectedMonth === 11 ? 0 : selectedMonth + 1, 
    selectedMonth === 11 ? selectedYear + 1 : selectedYear
  );

  // Date helpers for UI (no changes needed, assuming Date objects are consistently local midnight)
  const isDateInRange = (day: number | null, month: number, year: number): boolean => {
    if (!day) return false;
    const date = new Date(year, month, day, 0,0,0,0); // Compare with local midnight
    const time = date.getTime();
    // Ensure dateRange start/end are also effectively midnight for comparison
    const startDateMidnight = new Date(dateRange.startDate);
    startDateMidnight.setHours(0,0,0,0);
    const endDateMidnight = new Date(dateRange.endDate);
    endDateMidnight.setHours(0,0,0,0);

    return time >= startDateMidnight.getTime() && time <= endDateMidnight.getTime();
  };

  const isStartDate = (day: number | null, month: number, year: number): boolean => {
    if (!day) return false;
    const date = new Date(year, month, day, 0,0,0,0);
    const startDateMidnight = new Date(dateRange.startDate);
    startDateMidnight.setHours(0,0,0,0);
    return date.getTime() === startDateMidnight.getTime();
  };

  const isEndDate = (day: number | null, month: number, year: number): boolean => {
    if (!day) return false;
    const date = new Date(year, month, day, 0,0,0,0);
    const endDateMidnight = new Date(dateRange.endDate);
    endDateMidnight.setHours(0,0,0,0);
    return date.getTime() === endDateMidnight.getTime();
  };
  
  // Close dropdowns (no changes needed for the bug)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
        if (selectionPhase === 1) { // If user closes calendar mid-selection
           // Optionally reset to last confirmed range or clear selection phase.
           // For simplicity, just closing is fine. If they reopen, phase might be 0 or 1.
           // Let's reset phase if calendar closes and selection wasn't completed.
          setSelectionPhase(0);
        }
      }
      if (guestsRef.current && !guestsRef.current.contains(event.target as Node)) {
        setShowGuests(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectionPhase]); // Added selectionPhase to dependencies

  // Handle guest adjustments (minor tweak to localStorage calls for consistency)
  const adjustGuests = (type: 'adults' | 'children' | 'rooms', operation: 'add' | 'subtract') => {
    let newAdults = adults, newChildren = children, newRooms = rooms;

    if (operation === 'add') {
      if (type === 'adults') newAdults = adults + 1;
      if (type === 'children') newChildren = children + 1;
      if (type === 'rooms') newRooms = rooms + 1;
    } else { // subtract
      if (type === 'adults' && adults > 1) newAdults = adults - 1;
      if (type === 'children' && children > 0) newChildren = children - 1;
      if (type === 'rooms' && rooms > 1) {
        const minRoomsRequired = Math.ceil(adults / 3); // Use current adults, not potentially newAdults
        if (rooms > minRoomsRequired) newRooms = rooms - 1;
      }
    }
    
    // Auto-adjust rooms if adults changed
    if (type === 'adults') {
        const requiredRoomsForNewAdults = Math.ceil(newAdults / 3);
        if (newRooms < requiredRoomsForNewAdults) { // newRooms is still old rooms value here
            newRooms = requiredRoomsForNewAdults;
        }
    }
    
    // Update state
    if (newAdults !== adults) {
        setAdults(newAdults);
        localStorage.setItem('adults', newAdults.toString());
    }
    if (newChildren !== children) {
        setChildren(newChildren);
        localStorage.setItem('children', newChildren.toString());
    }
    // Ensure rooms doesn't go below minimum for current adults
    // This logic is a bit complex when intertwined. The useEffect for adults/rooms handles one aspect.
    // Let's simplify: set the primary type, then let useEffect handle consequential room adjustments.
    if (type === 'adults') {
        setAdults(newAdults);
        localStorage.setItem('adults', newAdults.toString());
        // The useEffect for [adults, rooms] will handle room adjustment if needed.
    } else if (type === 'children') {
        setChildren(newChildren);
        localStorage.setItem('children', newChildren.toString());
    } else if (type === 'rooms') {
        // When adjusting rooms directly, ensure it's valid
        const minRoomsRequired = Math.ceil(adults / 3);
        if (operation === 'add' || (operation === 'subtract' && newRooms >= minRoomsRequired && rooms > 1) ) {
            if (newRooms !== rooms) {
                setRooms(newRooms);
                localStorage.setItem('rooms', newRooms.toString());
            }
        }
    }
  };
  
  // Initial selectedMonth fix: use dateRange.startDate after it's potentially set by URL
  // The setDefaultsFromURL already sets selectedMonth and selectedYear.
  // The initial useState for selectedMonth should align with initial dateRange or be generic.
  // Initial `useState` for `selectedMonth` was `4` (May), but `dateRange` starts April 18.
  // Fixed initial `selectedMonth` to `3` for April.

  return (
    // JSX remains the same
    <div className="bg-white text-black shadow-lg p-4 rounded-lg">
      <div className="flex flex-wrap -mx-1">
        {/* Location Input */}
        <div className="w-full md:w-1/3 p-1">
          <div className="relative">
            <div className="bg-white text-black p-4 rounded-md flex items-center border-2 border-blue-600 hover:border-blue-700">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bed-double-icon lucide-bed-double"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/></svg>
              <input 
                type="text" 
                placeholder="Where are you going?" 
                className="flex-1 outline-none text-sm ml-4"
                value={title}
                onChange={(e) => setLocation(e.target.value)}
              />
              {title && (
                <button className="text-gray-400" onClick={() => setLocation('')}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Date Range */}
        <div className="w-full md:w-1/3 p-1 relative">
          <div 
            className="bg-white text-black p-4 rounded-md flex items-center justify-between border-2 border-blue-600 hover:border-blue-700 cursor-pointer"
            onClick={() => {
              // When opening calendar, if a range is already selected, prime for new selection.
              // If no date is "in progress" (selectionPhase === 0), start new selection process.
              if (selectionPhase === 0 && showCalendar === false) { // Only reset phase if opening, not closing
                // Reset selection phase to start picking a new range.
                // User expects to pick start date first.
                // setSelectionPhase(0); // Already 0 or will be handled by handleClickOutside
              }
              setShowCalendar(!showCalendar);
            }}
          >
            <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-days-icon lucide-calendar-days"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg> 
            <div className="text-sm ml-4">
                <div>
                  {selectionPhase === 1 
                    ? `Selecting: ${formatDisplayDate(dateRange.startDate)} - ???` // Clearer prompt
                    : `${formatDisplayDate(dateRange.startDate)} — ${formatDisplayDate(dateRange.endDate)}`}
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
          
          {showCalendar && (
            <div 
              ref={calendarRef}
              className="absolute left-0 mt-2 bg-white shadow-lg rounded-lg p-4 z-20 border border-gray-200"
              style={{ width: '650px' }}
            >
              <div className="flex justify-between items-center mb-4">
                 <button className="text-blue-600" onClick={() => { /* setShowCalendar(false); setSelectionPhase(0); // Not needed, handled by handleClickOutside or Done button */ }}>
                  {selectionPhase === 1 ? 'Select end date' : 'Calendar'}
                </button>
              </div>
              
              <div className="flex space-x-4">
                {/* Current Month */}
                <div className="flex-1">
                  <div className="flex justify-start items-center mb-2">
                    <div className="flex space-x-2">
                      <button onClick={prevMonth} className="text-gray-500 p-1 hover:bg-gray-100 rounded-full disabled:text-gray-300">{'<'}</button>
                    </div>
                    <div className='flex-1 flex justify-center items-center' >
                      <h3 className="font-bold">{currentMonthName} {selectedYear}</h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                      <div key={i} className="text-center text-sm py-1 text-gray-500">{day}</div>
                    ))}
                    
                    {currentDays.map((day, i) => (
                      <div 
                        key={i} 
                        className={`text-center py-2 rounded-full ${!day ? 'text-transparent' : 'cursor-pointer'} ${ // Added rounded-full and text-transparent for empty
                          isDateInRange(day, selectedMonth, selectedYear) 
                            ? (isStartDate(day, selectedMonth, selectedYear) && isEndDate(day, selectedMonth, selectedYear) ? 'bg-blue-600 text-white rounded-full' : 
                               isStartDate(day, selectedMonth, selectedYear) ? 'bg-blue-600 text-white rounded-l-full' :
                               isEndDate(day, selectedMonth, selectedYear) ? 'bg-blue-600 text-white rounded-r-full' :
                               'bg-blue-300 text-blue-800') // In range but not start/end
                               : 'hover:bg-blue-100'
                        } ${ // Specific styling for start/end if they are the same day
                          isStartDate(day, selectedMonth, selectedYear) && dateRange.startDate.getTime() === dateRange.endDate.getTime() ? '!rounded-full' :
                          isStartDate(day, selectedMonth, selectedYear) ? 'rounded-l-full' : ''
                        } ${
                          isEndDate(day, selectedMonth, selectedYear) && dateRange.startDate.getTime() === dateRange.endDate.getTime() ? '!rounded-full' :
                          isEndDate(day, selectedMonth, selectedYear) ? 'rounded-r-full' : ''
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
                  <div className="flex justify-start items-center mb-2">
                    <h3 className="font-bold flex-1 flex justify-center items-center">
                      {nextMonthName} {selectedMonth === 11 ? selectedYear + 1 : selectedYear}
                    </h3>
                    <div className='space-x-2' >
                      <button onClick={nextMonth} className="text-gray-500 p-1 hover:bg-gray-100 rounded-full">{'>'}</button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                      <div key={i} className="text-center text-sm py-1 text-gray-500">{day}</div>
                    ))}
                    
                    {nextDays.map((day, i) => {
                      const nextActualMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
                      const nextActualYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
                      
                      return (
                        <div 
                          key={i} 
                          className={`text-center py-2 rounded-full ${!day ? 'text-transparent' : 'cursor-pointer'} ${
                            isDateInRange(day, nextActualMonth, nextActualYear) 
                              ? (isStartDate(day, nextActualMonth, nextActualYear) && isEndDate(day, nextActualMonth, nextActualYear) ? 'bg-blue-600 text-white rounded-full' :
                                 isStartDate(day, nextActualMonth, nextActualYear) ? 'bg-blue-600 text-white rounded-l-full' :
                                 isEndDate(day, nextActualMonth, nextActualYear) ? 'bg-blue-600 text-white rounded-r-full' :
                                 'bg-blue-300 text-blue-800')
                              : 'hover:bg-blue-100'
                          } ${
                            isStartDate(day, nextActualMonth, nextActualYear) && dateRange.startDate.getTime() === dateRange.endDate.getTime() ? '!rounded-full' :
                            isStartDate(day, nextActualMonth, nextActualYear) ? 'rounded-l-full' : ''
                          } ${
                            isEndDate(day, nextActualMonth, nextActualYear) && dateRange.startDate.getTime() === dateRange.endDate.getTime() ? '!rounded-full' :
                            isEndDate(day, nextActualMonth, nextActualYear) ? 'rounded-r-full' : ''
                          }`}
                          onClick={() => day && handleDateClick(day, nextActualMonth, nextActualYear)}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Guests */}
        <div className="w-full md:w-1/4 p-1 relative">
          <div 
            className="bg-white text-black p-4 rounded-md flex items-center justify-between border-2 border-blue-600 hover:border-blue-700 cursor-pointer"
            onClick={() => setShowGuests(!showGuests)}
          >
            <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-round-icon lucide-user-round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
              <div className="text-sm flex-1 ml-2">
                <div>{adults} adults · {children} children · {rooms} room{rooms > 1 ? 's' : ''}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </div>
          </div>
          
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
                  <div className="flex items-center space-x-4 border-2 p-1 border-gray-400 rounded">
                    <button 
                      className={`p-1 rounded-full ${adults > 1 ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-300 cursor-not-allowed'}`}
                      onClick={() => adjustGuests('adults', 'subtract')}
                      disabled={adults <= 1}
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-8 text-center">{adults}</span>
                    <button 
                      className="p-1 rounded-full text-blue-600 hover:bg-blue-100"
                      onClick={() => adjustGuests('adults', 'add')}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Children */}
                <div className="flex justify-between items-center">
                  <span className="font-medium">Children</span>
                  <div className="flex items-center space-x-4 border-2 p-1 border-gray-400 rounded">
                    <button 
                      className={`p-1 rounded-full ${children > 0 ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-300 cursor-not-allowed'}`}
                      onClick={() => adjustGuests('children', 'subtract')}
                      disabled={children <= 0}
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-8 text-center">{children}</span>
                    <button 
                      className="p-1 rounded-full text-blue-600 hover:bg-blue-100"
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
                  <div className="flex items-center space-x-4 border-2 p-1 border-gray-400 rounded">
                    <button 
                      className={`p-1 rounded-full ${rooms > 1 && rooms > Math.ceil(adults / 3) ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-300 cursor-not-allowed'}`}
                      onClick={() => adjustGuests('rooms', 'subtract')}
                      disabled={rooms <= 1 || rooms <= Math.ceil(adults / 3)}
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-8 text-center">{rooms}</span>
                    <button 
                      className="p-1 rounded-full text-blue-600 hover:bg-blue-100"
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
                        <a href="#" className="text-blue-600 hover:underline">Read more...</a>
                      </div>
                    </div>
                  </div>
                  <div className="relative inline-block w-10 align-middle select-none">
                    <input 
                      type="checkbox" 
                      name="pets" 
                      id="pets" 
                      className="opacity-0 absolute peer block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                      checked={hasPets}
                      onChange={() => {
                        const newHasPets = !hasPets;
                        setHasPets(newHasPets);
                        localStorage.setItem('pets', newHasPets.toString());
                      }}
                    />
                    <label 
                      htmlFor="pets" 
                      className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-blue-600 transition-colors duration-200 ease-in-out"
                    >
                      <span className={`block w-6 h-6 rounded-full bg-white shadow transform peer-checked:translate-x-4 transition-transform duration-200 ease-in-out`}></span>
                    </label>
                  </div>
                </div>
                
                <button 
                  className="w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
                  onClick={() => setShowGuests(false)}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Search Button */}
        <div className="w-full md:w-1/12 p-1">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-4 rounded-md font-bold flex items-center justify-center h-full" // Added h-full
            onClick={handleSearch}
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}