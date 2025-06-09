import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Plus, Minus } from 'lucide-react';

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
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); 
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
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
    const year = date.getFullYear();
    const month = date.getMonth() + 1; 
    const day = date.getDate();      

    const monthFormatted = month < 10 ? `0${month}` : month.toString();
    const dayFormatted = day < 10 ? `0${day}` : day.toString();

    return `${year}-${monthFormatted}-${dayFormatted}`;
  };

  // Parse date from URL parameter (YYYY-MM-DD string)
  const parseDateFromURL = (dateString: string): Date => {
    const parts = dateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); 
    const day = parseInt(parts[2], 10);
    
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };

  // Get initial values from URL parameters
  const setDefaultsFromURL = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Today at midnight

      let effectiveStartDate: Date;
      let effectiveEndDate: Date;

      // Default values
      const defaultStartDate = new Date(today);
      const defaultEndDate = new Date(today);
      defaultEndDate.setDate(today.getDate() + 7);

      // Attempt to load from URL
      let urlStartDate: Date | null = null;
      let urlEndDate: Date | null = null;

      const checkInParam = urlParams.get('checkIn');
      if (checkInParam) {
        const parsed = parseDateFromURL(checkInParam);
        if (!isNaN(parsed.getTime())) {
          urlStartDate = parsed;
        }
      }

      const checkOutParam = urlParams.get('checkOut');
      if (checkOutParam) {
        const parsed = parseDateFromURL(checkOutParam);
        if (!isNaN(parsed.getTime())) {
          urlEndDate = parsed;
        }
      }

      // Attempt to load from localStorage
      let storedStartDate: Date | null = null;
      let storedEndDate: Date | null = null;

      const storedCheckInString = localStorage.getItem('checkIn');
      if (storedCheckInString) {
        const parsed = new Date(storedCheckInString);
        if (!isNaN(parsed.getTime())) {
          parsed.setHours(0, 0, 0, 0); // Normalize
          storedStartDate = parsed;
        }
      }

      const storedCheckOutString = localStorage.getItem('checkOut');
      if (storedCheckOutString) {
        const parsed = new Date(storedCheckOutString);
        if (!isNaN(parsed.getTime())) {
          parsed.setHours(0, 0, 0, 0); // Normalize
          storedEndDate = parsed;
        }
      }

      // Determine effectiveStartDate:
      // Priority: URL > localStorage > Default. Must be >= today.
      if (urlStartDate && urlStartDate.getTime() >= today.getTime()) {
        effectiveStartDate = urlStartDate;
      } else if (storedStartDate && storedStartDate.getTime() >= today.getTime()) {
        effectiveStartDate = storedStartDate;
      } else {
        effectiveStartDate = defaultStartDate; // Today
      }

      // Determine effectiveEndDate:
      // Priority: URL > localStorage > Default. Must be >= effectiveStartDate.
      if (urlEndDate && urlEndDate.getTime() >= effectiveStartDate.getTime()) {
        effectiveEndDate = urlEndDate;
      } else if (storedEndDate && storedEndDate.getTime() >= effectiveStartDate.getTime()) {
        effectiveEndDate = storedEndDate;
      } else {
        // If no valid URL/stored end date, or if they are before start date,
        // calculate default duration from effectiveStartDate.
        effectiveEndDate = new Date(effectiveStartDate);
        effectiveEndDate.setDate(effectiveStartDate.getDate() + 7);
      }
      
      // Final safeguard: If endDate somehow ended up before startDate (should be prevented by above logic)
      if (effectiveEndDate.getTime() < effectiveStartDate.getTime()) {
          effectiveEndDate = new Date(effectiveStartDate);
          effectiveEndDate.setDate(effectiveStartDate.getDate() + 7);
      }

      // Set state and update localStorage for dates
      setDateRange({ startDate: effectiveStartDate, endDate: effectiveEndDate });
      localStorage.setItem('checkIn', effectiveStartDate.toISOString());
      localStorage.setItem('checkOut', effectiveEndDate.toISOString());

      setSelectedMonth(effectiveStartDate.getMonth());
      setSelectedYear(effectiveStartDate.getFullYear());
      
      // --- Location ---
      const titleParam = urlParams.get('title');
      const storedTitle = localStorage.getItem('title');
      let currentTitle = ''; // Default if nothing else
      if (titleParam !== null) { // URL param takes precedence, even if empty string
          currentTitle = titleParam;
      } else if (storedTitle !== null) { // Fallback to localStorage
          currentTitle = storedTitle;
      }
      setLocation(currentTitle);
      localStorage.setItem('title', currentTitle); // Store the determined value

      // --- Adults ---
      let currentAdults = 2; // Default
      const adultsParam = urlParams.get('adults');
      const storedAdults = localStorage.getItem('adults');
      if (adultsParam !== null) {
          currentAdults = parseInt(adultsParam, 10);
      } else if (storedAdults !== null) {
          currentAdults = parseInt(storedAdults, 10);
      }
      currentAdults = (isNaN(currentAdults) || currentAdults < 1) ? 2 : currentAdults;
      setAdults(currentAdults);
      localStorage.setItem('adults', currentAdults.toString());

      // --- Children ---
      let currentChildren = 0; // Default
      const childrenParam = urlParams.get('children');
      const storedChildren = localStorage.getItem('children');
      if (childrenParam !== null) {
          currentChildren = parseInt(childrenParam, 10);
      } else if (storedChildren !== null) {
          currentChildren = parseInt(storedChildren, 10);
      }
      currentChildren = (isNaN(currentChildren) || currentChildren < 0) ? 0 : currentChildren;
      setChildren(currentChildren);
      localStorage.setItem('children', currentChildren.toString());

      // --- Rooms ---
      let currentRooms = 1; // Default
      const roomsParam = urlParams.get('rooms');
      const storedRooms = localStorage.getItem('rooms');
      if (roomsParam !== null) {
          currentRooms = parseInt(roomsParam, 10);
      } else if (storedRooms !== null) {
          currentRooms = parseInt(storedRooms, 10);
      }
      currentRooms = (isNaN(currentRooms) || currentRooms < 1) ? 1 : currentRooms;
      // The useEffect for rooms will adjust it based on adults later if needed, and update localStorage.
      // Setting state here first, then useEffect might re-evaluate.
      setRooms(currentRooms); 
      localStorage.setItem('rooms', currentRooms.toString()); // Initial set, might be overridden by useEffect

      // --- Pets ---
      let currentHasPets = false; // Default
      const petsParam = urlParams.get('pets');
      const storedPets = localStorage.getItem('pets');
      if (petsParam !== null) {
          currentHasPets = petsParam === 'true';
      } else if (storedPets !== null) {
          currentHasPets = storedPets === 'true';
      }
      setHasPets(currentHasPets);
      localStorage.setItem('pets', currentHasPets.toString());

    } catch (error) {
      console.error("Error initializing from URL/localStorage:", error);
      // Fallback to hardcoded defaults if any error occurs
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(today.getDate() + 7);
      
      setDateRange({ startDate: today, endDate: sevenDaysLater });
      setSelectedMonth(today.getMonth());
      setSelectedYear(today.getFullYear());
      setLocation('');
      setAdults(2);
      setChildren(0);
      setRooms(1);
      setHasPets(false);

      // Clear potentially problematic localStorage items to prevent recurring issues
      localStorage.removeItem('checkIn');
      localStorage.removeItem('checkOut');
      localStorage.removeItem('title');
      localStorage.removeItem('adults');
      localStorage.removeItem('children');
      localStorage.removeItem('rooms');
      localStorage.removeItem('pets');
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
      localStorage.setItem('rooms', requiredRooms.toString());
    }
  }, [adults, rooms]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (title) params.set('title', title);
    
    params.set('checkIn', formatDateForURL(dateRange.startDate));
    params.set('checkOut', formatDateForURL(dateRange.endDate));
    
    params.set('adults', adults.toString());
    params.set('children', children.toString());
    params.set('rooms', rooms.toString());
    
    if (hasPets) params.set('pets', 'true');

    window.location.href = `/customer/search?${params.toString()}`;
  };

  const handleDateClick = (day: number, month: number, year: number) => {
    const newDate = new Date(year, month, day, 0, 0, 0, 0);

    if (selectionPhase === 0) {
      setDateRange({ 
        startDate: newDate,
        endDate: newDate // Temporarily set end date to new date
      });
      setSelectedMonth(newDate.getMonth()); // Update calendar view to month of startDate
      setSelectedYear(newDate.getFullYear());
      setSelectionPhase(1);
    } else if (selectionPhase === 1) {
      const currentStartDate = dateRange.startDate;
      
      if (newDate.getTime() >= currentStartDate.getTime()) { // Allow same day selection for start and end
        setDateRange({ 
          startDate: currentStartDate,
          endDate: newDate
        });
        localStorage.setItem('checkIn', currentStartDate.toISOString());
        localStorage.setItem('checkOut', newDate.toISOString());
      } else { 
        setDateRange({
          startDate: newDate,
          endDate: currentStartDate 
        });
        localStorage.setItem('checkIn', newDate.toISOString());
        localStorage.setItem('checkOut', currentStartDate.toISOString());
      }
      setSelectionPhase(0); 
      setTimeout(() => setShowCalendar(false), 300);
    }
  };
  
  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const prevMonth = () => {
    const today = new Date();
    const currentCalendarDate = new Date(selectedYear, selectedMonth, 1);
    // Prevent navigating to months before the current real-world month
    if (currentCalendarDate.getFullYear() === today.getFullYear() && currentCalendarDate.getMonth() === today.getMonth()) {
      return; 
    }

    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

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

  const isDateDisabled = (day: number | null, month: number, year: number): boolean => {
    if (!day) return true;
    const date = new Date(year, month, day, 0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    return date.getTime() < today.getTime();
  };

  const isDateInRange = (day: number | null, month: number, year: number): boolean => {
    if (!day || isDateDisabled(day, month, year)) return false;
    const date = new Date(year, month, day, 0,0,0,0);
    const time = date.getTime();
    
    const startDateMidnight = new Date(dateRange.startDate);
    startDateMidnight.setHours(0,0,0,0);
    const endDateMidnight = new Date(dateRange.endDate);
    endDateMidnight.setHours(0,0,0,0);

    return time >= startDateMidnight.getTime() && time <= endDateMidnight.getTime();
  };

  const isStartDate = (day: number | null, month: number, year: number): boolean => {
    if (!day || isDateDisabled(day, month, year)) return false;
    const date = new Date(year, month, day, 0,0,0,0);
    const startDateMidnight = new Date(dateRange.startDate);
    startDateMidnight.setHours(0,0,0,0);
    return date.getTime() === startDateMidnight.getTime();
  };

  const isEndDate = (day: number | null, month: number, year: number): boolean => {
    if (!day || isDateDisabled(day, month, year)) return false;
    const date = new Date(year, month, day, 0,0,0,0);
    const endDateMidnight = new Date(dateRange.endDate);
    endDateMidnight.setHours(0,0,0,0);
    return date.getTime() === endDateMidnight.getTime();
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
        if (selectionPhase === 1) {
          // If mid-selection and calendar closes, reset to a valid range or clear.
          // Here, we'll reset to the last confirmed dateRange if only startDate was picked.
          // Or simply reset selectionPhase.
          const today = new Date(); today.setHours(0,0,0,0);
          const sevenDaysLater = new Date(today); sevenDaysLater.setDate(today.getDate()+7); sevenDaysLater.setHours(0,0,0,0);
          
          const lastCheckIn = localStorage.getItem('checkIn');
          const lastCheckOut = localStorage.getItem('checkOut');

          let sDate = today;
          let eDate = sevenDaysLater;

          if(lastCheckIn && lastCheckOut){
            sDate = new Date(lastCheckIn); sDate.setHours(0,0,0,0);
            eDate = new Date(lastCheckOut); eDate.setHours(0,0,0,0);
          }
          
          setDateRange({startDate: sDate, endDate: eDate}); // Revert to last saved/default
          setSelectionPhase(0);
        }
      }
      if (guestsRef.current && !guestsRef.current.contains(event.target as Node)) {
        setShowGuests(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectionPhase]);

  const adjustGuests = (type: 'adults' | 'children' | 'rooms', operation: 'add' | 'subtract') => {
    let currentAdults = adults;
    let currentChildren = children;
    let currentRooms = rooms;

    if (operation === 'add') {
      if (type === 'adults') currentAdults++;
      if (type === 'children') currentChildren++;
      if (type === 'rooms') currentRooms++;
    } else { // subtract
      if (type === 'adults' && adults > 1) currentAdults--;
      if (type === 'children' && children > 0) currentChildren--;
      if (type === 'rooms' && rooms > 1) {
         // Prevent reducing rooms below what's needed for current adults
        const minRoomsForAdults = Math.ceil(adults / 3);
        if (rooms -1 >= minRoomsForAdults) {
            currentRooms--;
        }
      }
    }
    
    // Auto-adjust rooms if adults changed
    if (type === 'adults') {
        const requiredRoomsForNewAdults = Math.ceil(currentAdults / 3);
        if (currentRooms < requiredRoomsForNewAdults) {
            currentRooms = requiredRoomsForNewAdults;
        }
    }
    
    setAdults(currentAdults);
    setChildren(currentChildren);
    setRooms(currentRooms); // This will trigger the useEffect for rooms if adults changed it

    localStorage.setItem('adults', currentAdults.toString());
    localStorage.setItem('children', currentChildren.toString());
    localStorage.setItem('rooms', currentRooms.toString());
  };

  const isPrevMonthDisabled = () => {
    const today = new Date();
    const firstOfSelectedMonth = new Date(selectedYear, selectedMonth, 1);
    const firstOfCurrentRealMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstOfSelectedMonth.getTime() <= firstOfCurrentRealMonth.getTime();
  };
  
  return (
    <div className=" text-black shadow-lg border-yellow-400 border-1 p-0.5 pl-1 pr-1 bg-yellow-400 rounded-lg">
      <div className="flex flex-wrap ">
        {/* Location Input */}
        <div className="w-full md:w-1/3 relative">
            <div className="bg-white text-black  h-full p-4 rounded-md flex items-center border-yellow-400 border-3">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bed-double-icon lucide-bed-double"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/></svg>
              <input 
                type="text" 
                placeholder="Where are you going?" 
                className="flex-1 outline-none text-sm ml-4"
                value={title}
                onChange={(e) => {
                  setLocation(e.target.value);
                  localStorage.setItem('title', e.target.value);
                }}
              />
              {title && (
                <button className="text-gray-400" onClick={() => {
                  setLocation('');
                  localStorage.removeItem('title');
                }}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
        </div>
        
        {/* Date Range */}
        <div className="w-full md:w-1/3 relative">
          <div 
            className="bg-white text-black p-4 h-full rounded-md flex items-center justify-between border-yellow-400 border-3 cursor-pointer"
            onClick={() => {
              if (!showCalendar) { // Opening calendar
                const currentStartDate = dateRange.startDate;
                setSelectedMonth(currentStartDate.getMonth());
                setSelectedYear(currentStartDate.getFullYear());
                 // If no selection is in progress, set phase to 0, ready for start date.
                if(selectionPhase === 1 && dateRange.startDate.getTime() === dateRange.endDate.getTime()){
                  // If only start date was selected, keep phase 1
                } else {
                   setSelectionPhase(0); 
                }
              }
              setShowCalendar(!showCalendar);
            }}
          >
            <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-days-icon lucide-calendar-days"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg> 
            <div className="text-sm ml-4">
                <div>
                  {selectionPhase === 1 && dateRange.startDate.getTime() === dateRange.endDate.getTime()
                    ? `Picking end: ${formatDisplayDate(dateRange.startDate)}`
                    : `${formatDisplayDate(dateRange.startDate)} — ${formatDisplayDate(dateRange.endDate)}`}
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
          
          {showCalendar && (
            <div 
              ref={calendarRef}
              className="absolute left-0 mt-2 bg-white shadow-lg rounded-lg p-4 z-20 border border-gray-200 w-full md:w-[650px]" // Responsive width
            >
              <div className="flex justify-between items-center mb-4">
                 <button className="text-blue-600">
                  {selectionPhase === 1 ? 'Select end date' : 'Select your dates'}
                </button>
              </div>
              
              {/* Container for months with responsive flex direction */}
              <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
                {/* Current Month */}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2"> {/* Changed justify-start to justify-between */}
                    <button 
                      onClick={prevMonth} 
                      className={`text-gray-500 p-1 hover:bg-gray-100 rounded-full ${isPrevMonthDisabled() ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isPrevMonthDisabled()}
                    >
                      {'<'}
                    </button>
                    <h3 className="font-bold text-center">{currentMonthName} {selectedYear}</h3> {/* Added text-center */}
                    <div className="w-6"></div> {/* Spacer to balance the layout if next button is not here */}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                      <div key={i} className="text-center text-sm py-1 text-gray-500">{day}</div>
                    ))}
                    
                    {currentDays.map((day, i) => {
                      const disabled = isDateDisabled(day, selectedMonth, selectedYear);
                      const inRange = isDateInRange(day, selectedMonth, selectedYear);
                      const isStart = isStartDate(day, selectedMonth, selectedYear);
                      const isEnd = isEndDate(day, selectedMonth, selectedYear);
                      const isSingleDaySelection = isStart && isEnd;
                      
                      let cellClass = `text-center py-2 rounded-full ${!day ? 'text-transparent' : 'cursor-pointer'}`;
                      if (disabled) {
                        cellClass += ' text-gray-300 cursor-not-allowed';
                      } else if (isSingleDaySelection) {
                        cellClass += ' bg-blue-600 text-white !rounded-full';
                      } else if (isStart) {
                        cellClass += ' bg-blue-600 text-white rounded-l-full rounded-r-none';
                      } else if (isEnd) {
                        cellClass += ' bg-blue-600 text-white rounded-r-full rounded-l-none';
                      } else if (inRange) {
                        cellClass += ' bg-blue-300 text-blue-800 rounded-none'; // No rounding for mid-range dates
                      } else {
                        cellClass += ' hover:bg-blue-100';
                      }

                      return (
                        <div 
                          key={i} 
                          className={cellClass}
                          onClick={() => day && !disabled && handleDateClick(day, selectedMonth, selectedYear)}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Next Month */}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2"> {/* Changed justify-start to justify-between */}
                     <div className="w-6"></div> {/* Spacer to balance the layout */}
                    <h3 className="font-bold text-center"> {/* Added text-center */}
                      {nextMonthName} {selectedMonth === 11 ? selectedYear + 1 : selectedYear}
                    </h3>
                    <button onClick={nextMonth} className="text-gray-500 p-1 hover:bg-gray-100 rounded-full">{'>'}</button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                      <div key={i} className="text-center text-sm py-1 text-gray-500">{day}</div>
                    ))}
                    
                    {nextDays.map((day, i) => {
                      const nextActualMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
                      const nextActualYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
                      const disabled = isDateDisabled(day, nextActualMonth, nextActualYear);
                      const inRange = isDateInRange(day, nextActualMonth, nextActualYear);
                      const isStart = isStartDate(day, nextActualMonth, nextActualYear);
                      const isEnd = isEndDate(day, nextActualMonth, nextActualYear);
                      const isSingleDaySelection = isStart && isEnd;

                      let cellClass = `text-center py-2 rounded-full ${!day ? 'text-transparent' : 'cursor-pointer'}`;
                      if (disabled) {
                        cellClass += ' text-gray-300 cursor-not-allowed';
                      } else if (isSingleDaySelection) {
                        cellClass += ' bg-blue-600 text-white !rounded-full';
                      } else if (isStart) {
                        cellClass += ' bg-blue-600 text-white rounded-l-full rounded-r-none';
                      } else if (isEnd) {
                        cellClass += ' bg-blue-600 text-white rounded-r-full rounded-l-none';
                      } else if (inRange) {
                        cellClass += ' bg-blue-300 text-blue-800 rounded-none';
                      } else {
                        cellClass += ' hover:bg-blue-100';
                      }
                      
                      return (
                        <div 
                          key={i} 
                          className={cellClass}
                          onClick={() => day && !disabled && handleDateClick(day, nextActualMonth, nextActualYear)}
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
        <div className="w-full md:w-1/4 relative">
          <div 
            className="bg-white text-black p-4 rounded-md flex items-center justify-between border-yellow-400 border-3 cursor-pointer"
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
                      <Plus className="h-5 w-5" />
                    </button>
                    <span className="w-8 text-center">{children}</span>
                    <button 
                      className="p-1 rounded-full text-blue-600 hover:bg-blue-100"
                      onClick={() => adjustGuests('children', 'add')}
                    >
                      <Minus className="h-5 w-5" />
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
        <div className="w-full md:w-1/12">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white w-full text-xl py-4 rounded-md font-bold flex items-center justify-center h-full"
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