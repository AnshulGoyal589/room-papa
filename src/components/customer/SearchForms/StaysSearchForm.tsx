import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Plus, Minus, Search } from 'lucide-react';
import { DateRange, RecentSearchItem } from '@/lib/mongodb/models/Components';


const MAX_RECENT_SEARCHES = 3;
const RECENT_SEARCHES_KEY = 'recentStaysSearches';


// Helper function to save a search to recent searches list (LOGIC UNCHANGED)
const saveSearchToRecentList = (searchData: Omit<RecentSearchItem, 'id' | 'timestamp'>) => {
  try {
    const existingSearchesString = localStorage.getItem(RECENT_SEARCHES_KEY);
    let searches: RecentSearchItem[] = existingSearchesString ? JSON.parse(existingSearchesString) : [];

    const newSearchItem: RecentSearchItem = {
      ...searchData,
      id: `${searchData.title}-${searchData.checkIn}-${searchData.checkOut}-${searchData.adults}-${searchData.children}-${searchData.rooms}-${searchData.pets}`,
      timestamp: Date.now(),
    };

    searches = searches.filter(s => s.id !== newSearchItem.id);
    searches.unshift(newSearchItem);
    searches = searches.slice(0, MAX_RECENT_SEARCHES);

    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch (error) {
    console.error("Error saving recent search to list:", error);
  }
};


// Helper to check if two dates are the same calendar day (LOGIC UNCHANGED)
function isSameDay(date1: Date, date2: Date): boolean {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export default function StaysSearchForm() {
  // --- STATE AND REFS (LOGIC UNCHANGED) ---
  const [title, setLocation] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7))
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
  const [activeSection, setActiveSection] = useState<'location' | 'dates' | 'guests' | null>(null);

  const calendarRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // --- HELPER FUNCTIONS (LOGIC UNCHANGED) ---
  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateForURL = React.useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const monthFormatted = month < 10 ? `0${month}` : month.toString();
    const dayFormatted = day < 10 ? `0${day}` : day.toString();
    return `${year}-${monthFormatted}-${dayFormatted}`;
  }, []);

  const parseDateFromURL = React.useCallback((dateString: string): Date => {
    const parts = dateString.split('-');
    if (parts.length !== 3) return new Date(NaN);
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return new Date(NaN);
    }
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }, []);

  // --- EFFECTS (LOGIC UNCHANGED, added formRef handling) ---
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

      const storedCheckInString = localStorage.getItem('checkIn');
      if (storedCheckInString) {
        const parsed = parseDateFromURL(storedCheckInString);
        if (!isNaN(parsed.getTime())) storedStartDate = parsed;
      }

      const storedCheckOutString = localStorage.getItem('checkOut');
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

      if (urlEndDate && urlEndDate.getTime() > effectiveStartDate.getTime()) {
        effectiveEndDate = urlEndDate;
      } else if (storedEndDate && storedEndDate.getTime() > effectiveStartDate.getTime()) {
        effectiveEndDate = storedEndDate;
      } else {
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

      localStorage.clear();
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
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
          setActiveSection(null);
          setShowCalendar(false);
          setShowGuests(false);
          if (selectionPhase === 1) { // Finalize date if selection was in progress
              const sDate = dateRange.startDate;
              const eDate = new Date(sDate);
              eDate.setDate(sDate.getDate() + 7);
              setDateRange({startDate: sDate, endDate: eDate});
              localStorage.setItem('checkIn', formatDateForURL(sDate));
              localStorage.setItem('checkOut', formatDateForURL(eDate));
              setSelectionPhase(0);
          }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectionPhase, dateRange.startDate, parseDateFromURL, formatDateForURL]);

  // --- EVENT HANDLERS (LOGIC UNCHANGED) ---
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
      setDateRange({ startDate: newDate, endDate: newDate });
      setSelectedMonth(newDate.getMonth());
      setSelectedYear(newDate.getFullYear());
      setSelectionPhase(1);
    } else if (selectionPhase === 1) {
      const currentStartDate = dateRange.startDate;
      let finalStartDate = currentStartDate;
      let finalEndDate = newDate;
      if (newDate.getTime() < currentStartDate.getTime()) {
        finalStartDate = newDate;
        finalEndDate = currentStartDate;
      }
      setDateRange({ startDate: finalStartDate, endDate: finalEndDate });
      localStorage.setItem('checkIn', formatDateForURL(finalStartDate));
      localStorage.setItem('checkOut', formatDateForURL(finalEndDate));
      setSelectionPhase(0);
      setTimeout(() => {
        setShowCalendar(false);
        setActiveSection(null);
      }, 300);
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
    if (currentCalendarDate.getFullYear() === today.getFullYear() && currentCalendarDate.getMonth() === today.getMonth()) return;
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

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
        if (rooms - 1 >= minRoomsForAdults) {
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


  // --- CALENDAR LOGIC (LOGIC UNCHANGED) ---
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
  const { days: nextDays, monthName: nextMonthName } = generateCalendar(nextMonthIdx, nextYearVal);

  const isDateDisabled = (day: number | null, month: number, year: number): boolean => {
    if (!day) return true;
    const date = new Date(year, month, day, 0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
  };

  const isDateInRange = (day: number | null, month: number, year: number): boolean => {
    if (!day || isDateDisabled(day, month, year) || isSameDay(dateRange.startDate, dateRange.endDate)) return false;
    const date = new Date(year, month, day, 0, 0, 0, 0);
    const time = date.getTime();
    const startTime = new Date(dateRange.startDate).setHours(0, 0, 0, 0);
    const endTime = new Date(dateRange.endDate).setHours(0, 0, 0, 0);
    return time > startTime && time < endTime;
  };

  const isStartDate = (day: number | null, month: number, year: number): boolean => {
    if (!day) return false;
    return isSameDay(new Date(year, month, day), dateRange.startDate);
  };
  
  const isEndDate = (day: number | null, month: number, year: number): boolean => {
    if (!day) return false;
    return isSameDay(new Date(year, month, day), dateRange.endDate);
  };
  
  const isPrevMonthDisabled = () => {
    const today = new Date();
    const firstOfSelectedMonth = new Date(selectedYear, selectedMonth, 1);
    const firstOfCurrentRealMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstOfSelectedMonth.getTime() <= firstOfCurrentRealMonth.getTime();
  };
  
  const totalGuests = adults + children;

  // --- JSX & RENDER ---
  return (
    <div className="relative w-full max-w-5xl mx-auto p-4 md:p-0" ref={formRef}>
      <div className={`relative flex flex-col md:flex-row items-center bg-white rounded-3xl md:rounded-full transition-all duration-300 ${activeSection ? 'shadow-2xl' : 'shadow-lg'}`}>

        {/* Location Section */}
        <div className="relative w-full md:flex-grow">
          <button
            onClick={() => { setActiveSection('location'); setShowCalendar(false); setShowGuests(false); }}
            className={`w-full text-left p-4 rounded-t-3xl md:rounded-t-none md:rounded-l-full transition-all duration-300
                       ${activeSection === 'location' ? 'bg-white shadow-md md:scale-100 z-10' : 'hover:bg-gray-50'}`}
          >
            <label className="block text-xs font-bold text-gray-800 uppercase">Location</label>
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Where are you going?"
                className="w-full text-base text-gray-600 bg-transparent outline-none truncate"
                value={title}
                onChange={(e) => {
                  setLocation(e.target.value);
                  localStorage.setItem('title', e.target.value);
                }}
              />
              {title && (
                <X className="h-4 w-4 text-gray-400 hover:text-gray-700 cursor-pointer" onClick={(e) => { e.stopPropagation(); setLocation(''); localStorage.removeItem('title'); }}/>
              )}
            </div>
          </button>
        </div>

        <div className="w-full md:w-px h-px md:h-8 border-b md:border-b-0 md:border-l border-gray-200"></div>

        {/* Dates Section */}
        <div className="relative w-full md:flex-shrink-0 md:w-auto">
          <button
            onClick={() => {
              setActiveSection('dates');
              setShowGuests(false);
              if (!showCalendar) {
                const currentStartDate = dateRange.startDate;
                setSelectedMonth(currentStartDate.getMonth());
                setSelectedYear(currentStartDate.getFullYear());
                setSelectionPhase(0);
              }
              setShowCalendar(true);
            }}
            className={`flex flex-col md:flex-row items-center w-full rounded-none transition-all duration-300
                       ${activeSection === 'dates' ? 'bg-white shadow-md md:scale-100 z-10' : 'hover:bg-gray-50'}`}
          >
            <div className="p-4 text-left w-full md:w-auto">
              <label className="block text-xs font-bold text-gray-800 uppercase">Check in</label>
              <span className="text-base text-gray-600">{formatDisplayDate(dateRange.startDate)}</span>
            </div>
            <div className="p-4 text-left w-full md:w-auto">
              <label className="block text-xs font-bold text-gray-800 uppercase">Check out</label>
              <span className="text-base text-gray-600">{formatDisplayDate(dateRange.endDate)}</span>
            </div>
          </button>
        </div>

        <div className="w-full md:w-px h-px md:h-8 border-b md:border-b-0 md:border-l border-gray-200"></div>

        {/* Guests Section - For Mobile & Laptop */}
        <div className="relative w-full md:flex-grow flex items-center">
          <div
            role="button"
            tabIndex={0}
            onClick={() => { setActiveSection('guests'); setShowGuests(true); setShowCalendar(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setActiveSection('guests'); setShowGuests(true); setShowCalendar(false);
              }
            }}
            // Apply scale-105 only on mobile (not md screens)
            className={`flex-grow flex justify-between items-center text-left p-4 rounded-b-3xl md:rounded-b-none transition-all duration-300 cursor-pointer
                       ${activeSection === 'guests' ? 'bg-white shadow-md md:scale-100 z-10' : 'hover:bg-gray-50'}
                       md:rounded-r-none`}
          >
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase">Guests</label>
              <span className="text-base text-gray-600 truncate">{totalGuests} guest{totalGuests !== 1 ? 's' : ''}, {rooms} room{rooms !== 1 ? 's' : ''}</span>
            </div>
            {/* Search Button (Hidden on larger screens in this section) */}
            <div className="md:hidden pl-4">
              <button
                className="w-14 h-14 flex items-center justify-center bg-gradient-to-r from-[#002a42] to-[#001d2c] text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                onClick={(e) => { e.stopPropagation(); handleSearch(); }}
                aria-label="Search"
              >
                <Search className="h-6 w-6" />
              </button>
            </div>
          </div>
          {/* Search Button for Laptop View - integrated into the main bar */}
          <div className="hidden md:block h-full">
            <button
              className="w-full h-full md:w-16 md:h-16 flex items-center justify-center bg-gradient-to-r from-[#002a42] to-[#001d2c] text-white rounded-r-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              onClick={(e) => { e.stopPropagation(); handleSearch(); }}
              aria-label="Search"
            >
              <Search className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
      {/* --- POPOVERS --- */}
      {showCalendar && (
        <div ref={calendarRef} className="absolute left-1/2 -translate-x-1/2 mt-4 bg-white shadow-2xl rounded-3xl p-6 z-20 border border-gray-100 animate-fade-in-down origin-top w-[calc(100%-2rem)] md:w-[720px]">
          <div className="mb-4 text-center">
             <h4 className="font-semibold text-lg text-gray-800">
               {selectionPhase === 1 && isSameDay(dateRange.startDate, dateRange.endDate) ? 'Select your check-out date' : 'Select your travel dates'}
             </h4>
          </div>
          <div className="flex flex-col md:flex-row">
            {/* Current Month */}
            <div className="flex-1 pr-0 md:pr-4 mb-8 md:mb-0">
              <div className="flex justify-between items-center mb-4">
                <button onClick={prevMonth} disabled={isPrevMonthDisabled()} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronDown className="h-5 w-5 rotate-90" /></button>
                <h3 className="font-bold text-gray-800">{currentMonthName} {selectedYear}</h3>
                <div className="w-9"></div> {/* Spacer */}
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={`day-h-c-${i}`} className="text-center text-xs text-gray-400 font-medium">{d}</div>)}
                {currentDays.map((day, i) => {
                    const disabled = isDateDisabled(day, selectedMonth, selectedYear);
                    const inRange = isDateInRange(day, selectedMonth, selectedYear);
                    const isStart = isStartDate(day, selectedMonth, selectedYear);
                    const isEnd = isEndDate(day, selectedMonth, selectedYear);
                    const isSelection = isStart || isEnd;

                    return (
                        <div key={`curr-${i}`} className={`relative flex items-center justify-center h-10 ${inRange ? 'bg-[#e0f2fe]': ''} ${isStart && !isEnd ? 'bg-[#e0f2fe] rounded-l-full' : ''} ${isEnd && !isStart ? 'bg-[#e0f2fe] rounded-r-full' : ''}`}>
                          <button
                            disabled={disabled}
                            onClick={() => day && handleDateClick(day, selectedMonth, selectedYear)}
                            className={`w-10 h-10 flex items-center justify-center text-sm rounded-full transition-colors duration-200 
                              ${disabled ? 'text-gray-300 cursor-not-allowed' : ''} 
                              ${!disabled && !isSelection ? 'hover:bg-gray-200' : ''}
                              ${isSelection ? 'bg-[#001d2c] text-white font-bold shadow-md' : 'text-gray-800'}`}
                          >{day}</button>
                        </div>
                    );
                })}
              </div>
            </div>
             <div className="w-full md:w-px h-px md:h-auto border-b md:border-b-0 md:border-l border-gray-200 my-4 md:my-0"></div>
            {/* Next Month */}
            <div className="flex-1 pl-0 md:pl-4">
              <div className="flex justify-between items-center mb-4">
                <div className="w-9"></div> {/* Spacer */}
                <h3 className="font-bold text-gray-800">{nextMonthName} {nextYearVal}</h3>
                <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><ChevronDown className="h-5 w-5 -rotate-90" /></button>
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={`day-h-n-${i}`} className="text-center text-xs text-gray-400 font-medium">{d}</div>)}
                {nextDays.map((day, i) => {
                    const disabled = isDateDisabled(day, nextMonthIdx, nextYearVal);
                    const inRange = isDateInRange(day, nextMonthIdx, nextYearVal);
                    const isStart = isStartDate(day, nextMonthIdx, nextYearVal);
                    const isEnd = isEndDate(day, nextMonthIdx, nextYearVal);
                    const isSelection = isStart || isEnd;

                    return (
                        <div key={`next-${i}`} className={`relative flex items-center justify-center h-10 ${inRange ? 'bg-[#e0f2fe]': ''} ${isStart && !isEnd ? 'bg-[#e0f2fe] rounded-l-full' : ''} ${isEnd && !isStart ? 'bg-[#e0f2fe] rounded-r-full' : ''}`}>
                          <button
                            disabled={disabled}
                            onClick={() => day && handleDateClick(day, nextMonthIdx, nextYearVal)}
                            className={`w-10 h-10 flex items-center justify-center text-sm rounded-full transition-colors duration-200 
                              ${disabled ? 'text-gray-300 cursor-not-allowed' : ''} 
                              ${!disabled && !isSelection ? 'hover:bg-gray-200' : ''}
                              ${isSelection ? 'bg-[#001d2c] text-white font-bold shadow-md' : 'text-gray-800'}`}
                          >{day}</button>
                        </div>
                    );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {showGuests && (
        <div ref={guestsRef} className="absolute right-1/2 translate-x-1/2 md:right-0 md:translate-x-0 mt-4 bg-white shadow-2xl rounded-3xl p-6 z-20 border border-gray-100 w-[calc(100%-2rem)] md:w-[360px] animate-fade-in-down origin-top-right">
          <div className="space-y-6">
              {[
                { type: 'adults', title: 'Adults', subtitle: 'Ages 18+', value: adults, min: 1 },
                { type: 'children', title: 'Children', subtitle: 'Ages 0-17', value: children, min: 0 },
                { type: 'rooms', title: 'Rooms', subtitle: null, value: rooms, min: 1, dynamicMin: Math.ceil(adults / 3) }
              ].map(item => (
                <div key={item.type} className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-gray-800">{item.title}</span>
                    {item.subtitle && <p className="text-xs text-gray-500">{item.subtitle}</p>}
                    {item.dynamicMin && item.dynamicMin > item.value && (
                        <p className="text-xs text-red-500 mt-0.5">Min {item.dynamicMin} rooms needed</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                    //eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onClick={() => adjustGuests(item.type as any, 'subtract')}
                      disabled={item.value <= (item.dynamicMin || item.min)}
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#001d2c] hover:text-[#001d2c] transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center">{item.value}</span>
                    <button
                    //eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onClick={() => adjustGuests(item.type as any, 'add')}
                      disabled={item.value >= 100}
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#001d2c] hover:text-[#001d2c] transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">Pets</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only" />
                  <div className="w-10 h-6 bg-gray-200 rounded-full shadow-inner"></div>
                  <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow transition"></div>
                </label>
              </div>  
              <style>{`
                input:checked + div {
                  background-color: #001d2c;
                }
                input:checked + div + .dot {
                  transform: translateX(100%);
                  background-color: #fff;
                }
              `}</style>
              <div className="text-right">
                <button
                  onClick={() => { setShowGuests(false); setActiveSection(null); }}
                  className="px-4 py-2 bg-gradient-to-r from-[#002a42] to-[#001d2c] text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  Apply
                </button>
              </div>  
          </div>
        </div>
      )}
    </div>
  );
}