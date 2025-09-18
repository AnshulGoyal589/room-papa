import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Plus, Minus, Search, Users, CalendarDays, MapPin } from 'lucide-react';
import { DateRange, RecentSearchItem } from '@/lib/mongodb/models/Components';


const MAX_RECENT_SEARCHES = 3;
const RECENT_SEARCHES_KEY = 'recentStaysSearches';


// Helper function to save a search to recent searches list
const saveSearchToRecentList = (searchData: Omit<RecentSearchItem, 'id' | 'timestamp'>) => {
  try {
    const existingSearchesString = localStorage.getItem(RECENT_SEARCHES_KEY);
    let searches: RecentSearchItem[] = existingSearchesString ? JSON.parse(existingSearchesString) : [];

    const newSearchItem: RecentSearchItem = {
      ...searchData,
      // Create a simple composite ID to identify unique searches
      id: `${searchData.title}-${searchData.checkIn}-${searchData.checkOut}-${searchData.adults}-${searchData.children}-${searchData.rooms}-${searchData.pets}`,
      timestamp: Date.now(),
    };

    // Remove any existing search with the same composite ID to avoid duplicates and refresh timestamp
    searches = searches.filter(s => s.id !== newSearchItem.id);

    // Add the new search to the beginning of the list
    searches.unshift(newSearchItem);

    // Keep only the top MAX_RECENT_SEARCHES
    searches = searches.slice(0, MAX_RECENT_SEARCHES);

    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch (error) {
    console.error("Error saving recent search to list:", error);
  }
};


// Helper to check if two dates are the same calendar day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
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


  // Format date for URL parameters AND localStorage (YYYY-MM-DD)
  const formatDateForURL = React.useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; 
    const day = date.getDate();      

    const monthFormatted = month < 10 ? `0${month}` : month.toString();
    const dayFormatted = day < 10 ? `0${day}` : day.toString();

    return `${year}-${monthFormatted}-${dayFormatted}`;
  }, []);

  // Parse date from URL parameter OR localStorage (YYYY-MM-DD string)
  const parseDateFromURL = React.useCallback((dateString: string): Date => {
    const parts = dateString.split('-');
    if (parts.length !== 3) return new Date(NaN); // Invalid format

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); 
    const day = parseInt(parts[2], 10);
    
    // Check if parts are valid numbers
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return new Date(NaN);
    }
    // Create date in local timezone. Month is 0-indexed for Date constructor.
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }, []);


  // Get initial values from URL parameters or localStorage
  const setDefaultsFromURL = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const today = new Date();
      today.setHours(0, 0, 0, 0); 

      let effectiveStartDate: Date;
      let effectiveEndDate: Date;

      const defaultStartDate = new Date(today);
      const defaultEndDate = new Date(today);
      defaultEndDate.setDate(today.getDate() + 7);

      let urlStartDate: Date | null = null;
      let urlEndDate: Date | null = null;

      const checkInParam = urlParams.get('checkIn');
      if (checkInParam) {
        const parsed = parseDateFromURL(checkInParam);
        if (!isNaN(parsed.getTime())) urlStartDate = parsed;
      }

      const checkOutParam = urlParams.get('checkOut');
      if (checkOutParam) {
        const parsed = parseDateFromURL(checkOutParam);
        if (!isNaN(parsed.getTime())) urlEndDate = parsed;
      }

      let storedStartDate: Date | null = null;
      let storedEndDate: Date | null = null;

      const storedCheckInString = localStorage.getItem('checkIn'); // Expect YYYY-MM-DD
      if (storedCheckInString) {
        const parsed = parseDateFromURL(storedCheckInString);
        if (!isNaN(parsed.getTime())) storedStartDate = parsed;
      }

      const storedCheckOutString = localStorage.getItem('checkOut'); // Expect YYYY-MM-DD
      if (storedCheckOutString) {
        const parsed = parseDateFromURL(storedCheckOutString);
        if (!isNaN(parsed.getTime())) storedEndDate = parsed;
      }

      if (urlStartDate && urlStartDate.getTime() >= today.getTime()) {
        effectiveStartDate = urlStartDate;
      } else if (storedStartDate && storedStartDate.getTime() >= today.getTime()) {
        effectiveStartDate = storedStartDate;
      } else {
        effectiveStartDate = defaultStartDate;
      }

      if (urlEndDate && urlEndDate.getTime() >= effectiveStartDate.getTime()) {
        effectiveEndDate = urlEndDate;
      } else if (storedEndDate && storedEndDate.getTime() >= effectiveStartDate.getTime()) {
        effectiveEndDate = storedEndDate;
      } else {
        effectiveEndDate = new Date(effectiveStartDate);
        effectiveEndDate.setDate(effectiveStartDate.getDate() + 7);
      }
      
      if (effectiveEndDate.getTime() < effectiveStartDate.getTime()) {
          effectiveEndDate = new Date(effectiveStartDate);
          effectiveEndDate.setDate(effectiveStartDate.getDate() + 7);
      }

      setDateRange({ startDate: effectiveStartDate, endDate: effectiveEndDate });
      localStorage.setItem('checkIn', formatDateForURL(effectiveStartDate));
      localStorage.setItem('checkOut', formatDateForURL(effectiveEndDate));

      setSelectedMonth(effectiveStartDate.getMonth());
      setSelectedYear(effectiveStartDate.getFullYear());
      
      const titleParam = urlParams.get('title');
      const storedTitle = localStorage.getItem('title');
      let currentTitle = '';
      if (titleParam !== null) {
          currentTitle = titleParam;
      } else if (storedTitle !== null) {
          currentTitle = storedTitle;
      }
      setLocation(currentTitle);
      localStorage.setItem('title', currentTitle);

      let currentAdults = 2;
      const adultsParam = urlParams.get('adults');
      const storedAdults = localStorage.getItem('adults');
      if (adultsParam !== null) currentAdults = parseInt(adultsParam, 10);
      else if (storedAdults !== null) currentAdults = parseInt(storedAdults, 10);
      currentAdults = (isNaN(currentAdults) || currentAdults < 1) ? 2 : currentAdults;
      setAdults(currentAdults);
      localStorage.setItem('adults', currentAdults.toString());

      let currentChildren = 0;
      const childrenParam = urlParams.get('children');
      const storedChildren = localStorage.getItem('children');
      if (childrenParam !== null) currentChildren = parseInt(childrenParam, 10);
      else if (storedChildren !== null) currentChildren = parseInt(storedChildren, 10);
      currentChildren = (isNaN(currentChildren) || currentChildren < 0) ? 0 : currentChildren;
      setChildren(currentChildren);
      localStorage.setItem('children', currentChildren.toString());

      let currentRooms = 1;
      const roomsParam = urlParams.get('rooms');
      const storedRooms = localStorage.getItem('rooms');
      if (roomsParam !== null) currentRooms = parseInt(roomsParam, 10);
      else if (storedRooms !== null) currentRooms = parseInt(storedRooms, 10);
      currentRooms = (isNaN(currentRooms) || currentRooms < 1) ? 1 : currentRooms;
      setRooms(currentRooms); 
      localStorage.setItem('rooms', currentRooms.toString());

      let currentHasPets = false;
      const petsParam = urlParams.get('pets');
      const storedPets = localStorage.getItem('pets');
      if (petsParam !== null) currentHasPets = petsParam === 'true';
      else if (storedPets !== null) currentHasPets = storedPets === 'true';
      setHasPets(currentHasPets);
      localStorage.setItem('pets', currentHasPets.toString());

    } catch (error) {
      console.error("Error initializing from URL/localStorage:", error);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(today.getDate() + 7);
      
      setDateRange({ startDate: today, endDate: sevenDaysLater });
      setSelectedMonth(today.getMonth());
      setSelectedYear(today.getFullYear());
      setLocation(''); setAdults(2); setChildren(0); setRooms(1); setHasPets(false);

      localStorage.removeItem('checkIn'); localStorage.removeItem('checkOut');
      localStorage.removeItem('title'); localStorage.removeItem('adults');
      localStorage.removeItem('children'); localStorage.removeItem('rooms');
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
    
    const checkInStr = formatDateForURL(dateRange.startDate);
    const checkOutStr = formatDateForURL(dateRange.endDate);

    params.set('checkIn', checkInStr);
    params.set('checkOut', checkOutStr);
    
    params.set('adults', adults.toString());
    params.set('children', children.toString());
    params.set('rooms', rooms.toString());
    
    if (hasPets) params.set('pets', 'true');

    // Save to recent searches list
    const currentSearchData = {
      title: title,
      checkIn: checkInStr,
      checkOut: checkOutStr,
      adults: adults,
      children: children,
      rooms: rooms,
      pets: hasPets,
    };
    saveSearchToRecentList(currentSearchData);

    window.location.href = `/search?${params.toString()}`;
  };

  const handleDateClick = (day: number, month: number, year: number) => {
    const newDate = new Date(year, month, day, 0, 0, 0, 0);

    if (selectionPhase === 0) {
      setDateRange({ 
        startDate: newDate,
        endDate: newDate 
      });
      setSelectedMonth(newDate.getMonth()); 
      setSelectedYear(newDate.getFullYear());
      setSelectionPhase(1);
      // Don't save to localStorage yet, wait for end date
    } else if (selectionPhase === 1) {
      const currentStartDate = dateRange.startDate;
      let finalStartDate = currentStartDate;
      let finalEndDate = newDate;
      
      if (newDate.getTime() < currentStartDate.getTime()) { 
        finalStartDate = newDate;
        finalEndDate = currentStartDate;
      }
      
      setDateRange({ 
        startDate: finalStartDate,
        endDate: finalEndDate
      });
      localStorage.setItem('checkIn', formatDateForURL(finalStartDate));
      localStorage.setItem('checkOut', formatDateForURL(finalEndDate));
      
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
  const nextMonthIdx = selectedMonth === 11 ? 0 : selectedMonth + 1;
  const nextYearVal = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
  const { days: nextDays, monthName: nextMonthName } = generateCalendar(
    nextMonthIdx, 
    nextYearVal
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
          // If only start date was picked and calendar closed, finalize with stored/default end date
          const storedCheckIn = localStorage.getItem('checkIn');
          const storedCheckOut = localStorage.getItem('checkOut');
          const sDate = dateRange.startDate; // Keep the picked start date
          let eDate = dateRange.startDate; // Default end date to start date

          if(storedCheckIn && storedCheckOut){
             const parsedStoredCheckIn = parseDateFromURL(storedCheckIn);
             const parsedStoredCheckOut = parseDateFromURL(storedCheckOut);
             if(!isNaN(parsedStoredCheckIn.getTime()) && !isNaN(parsedStoredCheckOut.getTime()) && parsedStoredCheckOut.getTime() >= sDate.getTime()){
                eDate = parsedStoredCheckOut;
             } else {
                // If stored checkout is invalid or before picked start date, set it same as start date or +7 days
                eDate = new Date(sDate);
                eDate.setDate(sDate.getDate() + 7); // Default to 7 days if closing mid-pick
             }
          } else {
             eDate = new Date(sDate);
             eDate.setDate(sDate.getDate() + 7);
          }
          
          setDateRange({startDate: sDate, endDate: eDate});
          localStorage.setItem('checkIn', formatDateForURL(sDate));
          localStorage.setItem('checkOut', formatDateForURL(eDate));
          setSelectionPhase(0);
        }
      }
      if (guestsRef.current && !guestsRef.current.contains(event.target as Node)) {
        setShowGuests(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectionPhase, dateRange.startDate, parseDateFromURL, formatDateForURL]); // Added dependencies

  const adjustGuests = (type: 'adults' | 'children' | 'rooms', operation: 'add' | 'subtract') => {
    let currentAdults = adults;
    let currentChildren = children;
    let currentRooms = rooms;

    if (operation === 'add') {
      if (type === 'adults') currentAdults++;
      if (type === 'children') currentChildren++;
      if (type === 'rooms') currentRooms++;
    } else { 
      if (type === 'adults' && adults > 1) currentAdults--;
      if (type === 'children' && children > 0) currentChildren--;
      if (type === 'rooms' && rooms > 1) {
        const minRoomsForAdults = Math.ceil(adults / 3);
        if (rooms -1 >= minRoomsForAdults) {
            currentRooms--;
        }
      }
    }
    
    if (type === 'adults') {
        const requiredRoomsForNewAdults = Math.ceil(currentAdults / 3);
        if (currentRooms < requiredRoomsForNewAdults) {
            currentRooms = requiredRoomsForNewAdults;
        }
    }
    
    setAdults(currentAdults);
    setChildren(currentChildren);
    setRooms(currentRooms);

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
    <div className="relative z-10 w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl p-3 md:p-4 border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Location Input */}
        <div className="flex items-center bg-gray-50 rounded-lg px-4 py-3 border border-transparent has-[:focus]:border-[#001d2c] transition-all duration-200">
          <MapPin className="text-gray-500 mr-3 h-5 w-5" />
          <input
            type="text"
            placeholder="Where are you going?"
            className="flex-1 outline-none text-sm bg-transparent placeholder-gray-400 text-gray-800"
            value={title}
            onChange={(e) => {
              setLocation(e.target.value);
              localStorage.setItem('title', e.target.value);
            }}
          />
          {title && (
            <button className="text-gray-400 hover:text-gray-600 ml-2" onClick={() => {
              setLocation('');
              localStorage.removeItem('title');
            }}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Date Range */}
        <div className="relative col-span-1 md:col-span-1">
          <div
            className={`date-range-input bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between transition-all duration-200 cursor-pointer ${showCalendar ? 'border-[#001d2c] border' : 'border border-transparent hover:border-gray-200'}`}
            onClick={() => {
              if (!showCalendar) {
                const currentStartDate = dateRange.startDate;
                setSelectedMonth(currentStartDate.getMonth());
                setSelectedYear(currentStartDate.getFullYear());
                setSelectionPhase(0);
              }
              setShowCalendar(!showCalendar);
              setShowGuests(false);
            }}
          >
            <div className="flex items-center flex-1">
              <CalendarDays className="text-gray-500 mr-3 h-5 w-5" />
              <div className="flex flex-col text-sm flex-1">
                {dateRange.startDate && dateRange.endDate && !isSameDay(dateRange.startDate, dateRange.endDate) ? (
                  <div className="flex justify-between w-full">
                    <div className="text-gray-800 font-medium">Check-in: <span className="text-[#001d2c]">{formatDisplayDate(dateRange.startDate)}</span></div>
                    <div className="text-gray-800 font-medium">Check-out: <span className="text-[#001d2c]">{formatDisplayDate(dateRange.endDate)}</span></div>
                  </div>
                ) : (
                  <span className="text-gray-400 font-medium">Add Dates</span>
                )}
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${showCalendar ? 'rotate-180' : ''}`} />
          </div>

          {showCalendar && (
            <div
              ref={calendarRef}
              className="absolute left-0 right-0 mt-2 bg-white shadow-xl rounded-xl p-6 z-20 border border-gray-100 animate-fade-in-down origin-top-left w-full md:w-[680px] mx-auto md:left-1/2 md:-translate-x-1/2"
            >
              <div className="mb-6 text-center">
                <h4 className="font-semibold text-xl text-gray-800 mb-1">
                  {selectionPhase === 1 && isSameDay(dateRange.startDate, dateRange.endDate)
                    ? 'Select your check-out date'
                    : 'Select your travel dates'}
                </h4>
                <p className="text-sm text-gray-500">
                  {dateRange.startDate && dateRange.endDate && !isSameDay(dateRange.startDate, dateRange.endDate)
                    ? `Selected: ${formatDisplayDate(dateRange.startDate)} – ${formatDisplayDate(dateRange.endDate)}`
                    : 'Choose your check-in and check-out dates'}
                </p>
              </div>

              <div className="flex flex-col space-y-8 md:flex-row md:space-x-10 md:space-y-0">
                {/* Current Month */}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={prevMonth}
                      className={`text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors ${isPrevMonthDisabled() ? 'opacity-40 cursor-not-allowed' : ''}`}
                      disabled={isPrevMonthDisabled()}
                      aria-label="Previous month"
                    >
                      <ChevronDown className="h-4 w-4 rotate-90" />
                    </button>
                    <h3 className="font-bold text-gray-800">{currentMonthName} {selectedYear}</h3>
                    <div className="w-8"></div> {/* Placeholder for alignment */}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                      <div key={i} className="text-center text-xs py-1 text-gray-500 font-medium">{day}</div>
                    ))}

                    {currentDays.map((day, i) => {
                      const disabled = isDateDisabled(day, selectedMonth, selectedYear);
                      const inRange = isDateInRange(day, selectedMonth, selectedYear);
                      const isStart = isStartDate(day, selectedMonth, selectedYear);
                      const isEnd = isEndDate(day, selectedMonth, selectedYear);
                      const isSingleDaySelection = isStart && isEnd;

                      let cellClass = `text-center py-2.5 text-sm leading-none transition-all duration-150 ease-in-out`;
                      if (!day) {
                        cellClass += ' text-transparent';
                      } else if (disabled) {
                        cellClass += ' text-gray-300 cursor-not-allowed';
                      } else {
                        cellClass += ' cursor-pointer rounded-full';
                        if (isSingleDaySelection) {
                          cellClass += ' bg-[#001d2c] text-white shadow-md';
                        } else if (isStart) {
                          cellClass += ' bg-[#001d2c] text-white rounded-r-none';
                        } else if (isEnd) {
                          cellClass += ' bg-[#001d2c] text-white rounded-l-none';
                        } else if (inRange) {
                          cellClass += ' bg-[#001d2c] text-[#001d2c] rounded-none';
                        } else {
                          cellClass += ' text-gray-800 hover:bg-[#001d2c]';
                        }
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
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-8"></div> {/* Placeholder for alignment */}
                    <h3 className="font-bold text-gray-800">
                      {nextMonthName} {nextYearVal}
                    </h3>
                    <button onClick={nextMonth} className="text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Next month">
                      <ChevronDown className="h-4 w-4 -rotate-90" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                      <div key={i} className="text-center text-xs py-1 text-gray-500 font-medium">{day}</div>
                    ))}

                    {nextDays.map((day, i) => {
                      const nextActualMonth = nextMonthIdx;
                      const nextActualYear = nextYearVal;
                      const disabled = isDateDisabled(day, nextActualMonth, nextActualYear);
                      const inRange = isDateInRange(day, nextActualMonth, nextActualYear);
                      const isStart = isStartDate(day, nextActualMonth, nextActualYear);
                      const isEnd = isEndDate(day, nextActualMonth, nextActualYear);
                      const isSingleDaySelection = isStart && isEnd;

                      let cellClass = `text-center py-2.5 text-sm leading-none transition-all duration-150 ease-in-out`;
                      if (!day) {
                        cellClass += ' text-transparent';
                      } else if (disabled) {
                        cellClass += ' text-gray-300 cursor-not-allowed';
                      } else {
                        cellClass += ' cursor-pointer rounded-full';
                        if (isSingleDaySelection) {
                          cellClass += ' bg-[#001d2c] text-white shadow-md';
                        } else if (isStart) {
                          cellClass += ' bg-[#001d2c] text-white rounded-r-none';
                        } else if (isEnd) {
                          cellClass += ' bg-[#001d2c] text-white rounded-l-none';
                        } else if (inRange) {
                          cellClass += ' bg-[#001d2c] text-[#001d2c] rounded-none';
                        } else {
                          cellClass += ' text-gray-800 hover:bg-[#001d2c]';
                        }
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
        <div className="relative">
          <div
            className={`guests-input bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between transition-all duration-200 cursor-pointer ${showGuests ? 'border-[#001d2c] border' : 'border border-transparent hover:border-gray-200'}`}
            onClick={() => {
              setShowGuests(!showGuests);
              setShowCalendar(false);
            }}
          >
            <div className="flex items-center flex-1">
              <Users className="text-gray-500 mr-3 h-5 w-5" />
              <div className="text-sm text-gray-800 flex-1 font-medium">
                {adults} adult{adults !== 1 ? 's' : ''} · {children} child{children !== 1 ? 'ren' : ''} · {rooms} room{rooms !== 1 ? 's' : ''}
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${showGuests ? 'rotate-180' : ''}`} />
          </div>

          {showGuests && (
            <div
              ref={guestsRef}
              className="absolute right-0 md:left-0 mt-2 bg-white shadow-xl rounded-xl p-6 z-20 border border-gray-100 w-72 md:w-80 animate-fade-in-down origin-top-right"
            >
              <div className="space-y-5">
                {/* Adults */}
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <div>
                    <span className="font-semibold text-gray-800">Adults</span>
                    <p className="text-xs text-gray-500 mt-0.5">Ages 18+</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      className={`w-7 h-7 flex items-center justify-center rounded-full border ${adults > 1 ? 'border-[#001d2c] text-[#001d2c] hover:bg-[#001d2c]' : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}
                      onClick={() => adjustGuests('adults', 'subtract')}
                      disabled={adults <= 1}
                      aria-label="Decrease adults"
                    ><Minus className="h-4 w-4" /></button>
                    <span className="w-6 text-center text-gray-800 font-medium">{adults}</span>
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-full border border-[#001d2c] text-[#001d2c] hover:bg-[#001d2c] transition-colors"
                      onClick={() => adjustGuests('adults', 'add')}
                      aria-label="Increase adults"
                    ><Plus className="h-4 w-4" /></button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <div>
                    <span className="font-semibold text-gray-800">Children</span>
                    <p className="text-xs text-gray-500 mt-0.5">Ages 0-17</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      className={`w-7 h-7 flex items-center justify-center rounded-full border ${children > 0 ? 'border-[#001d2c] text-[#001d2c] hover:bg-[#001d2c]' : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}
                      onClick={() => adjustGuests('children', 'subtract')}
                      disabled={children <= 0}
                      aria-label="Decrease children"
                    ><Minus className="h-4 w-4" /></button>
                    <span className="w-6 text-center text-gray-800 font-medium">{children}</span>
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-full border border-[#001d2c] text-[#001d2c] hover:bg-[#001d2c] transition-colors"
                      onClick={() => adjustGuests('children', 'add')}
                      aria-label="Increase children"
                    ><Plus className="h-4 w-4" /></button>
                  </div>
                </div>

                {/* Rooms */}
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <div>
                    <span className="font-semibold text-gray-800">Rooms</span>
                    {Math.ceil(adults / 3) > rooms && (
                      <p className="text-xs text-red-500 mt-0.5">Min {Math.ceil(adults / 3)} rooms suggested</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      className={`w-7 h-7 flex items-center justify-center rounded-full border ${rooms > 1 && rooms > Math.ceil(adults / 3) ? 'border-[#001d2c] text-[#001d2c] hover:bg-[#001d2c]' : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}
                      onClick={() => adjustGuests('rooms', 'subtract')}
                      disabled={rooms <= 1 || rooms <= Math.ceil(adults / 3)}
                      aria-label="Decrease rooms"
                    ><Minus className="h-4 w-4" /></button>
                    <span className="w-6 text-center text-gray-800 font-medium">{rooms}</span>
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-full border border-[#001d2c] text-[#001d2c] hover:bg-[#001d2c] transition-colors"
                      onClick={() => adjustGuests('rooms', 'add')}
                      aria-label="Increase rooms"
                    ><Plus className="h-4 w-4" /></button>
                  </div>
                </div>

                {/* Pets Toggle */}
                <div className="flex justify-between items-center pt-2">
                  <div>
                    <span className="font-semibold text-gray-800">Travelling with pets?</span>
                    <p className="text-xs text-gray-500 mt-0.5">Assistance animals aren&apos;t considered pets.</p>
                  </div>
                  <label htmlFor="pets-toggle" className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="pets-toggle"
                      className="sr-only peer"
                      checked={hasPets}
                      onChange={() => {
                        const newHasPets = !hasPets;
                        setHasPets(newHasPets);
                        localStorage.setItem('pets', newHasPets.toString());
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#001d2c] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-200 peer-checked:bg-[#001d2c]"></div>
                  </label>
                </div>

                <button
                  className="w-full py-3 bg-[#001d2c] text-white rounded-lg font-semibold hover:bg-[#001d2c] transition-colors duration-200 shadow-md mt-4"
                  onClick={() => setShowGuests(false)}
                >Done</button>
              </div>
            </div>
          )}
        </div>

        {/* Search Button */}
        <div className="col-span-1">
          <button
            className="bg-[#001d2c] hover:bg-[#001d2c] text-white w-full text-lg py-3.5 rounded-lg font-semibold flex items-center justify-center transition-colors duration-200 shadow-md"
            onClick={handleSearch}
          >
            <Search className="h-5 w-5 mr-2" />
            Search
          </button>
        </div>
      </div>
    </div>
  );
}