import React, { useState, useRef, useEffect, useMemo, ChangeEvent, KeyboardEvent } from 'react';
import { ChevronDown, X, Plus, Minus } from 'lucide-react';
import { DateRange, RecentSearchItem } from '@/lib/mongodb/models/Components';
import { STAYS_KEYWORD_LIST } from '@/lib/data/staysKeywords';
import { SuggestionText } from './Suggestion';


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


export default function StaysSearchForm() {
  // State variables with proper typing
  const [title, setLocation] = useState<string>('');

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const locationInputRef = useRef<HTMLInputElement>(null);

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
      
      if (effectiveEndDate.getTime() <= effectiveStartDate.getTime()) {
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

  const filteredSuggestions = useMemo(() => {
    if (title.length === 0) {
        return [];
    }
    const lowerInput = title.toLowerCase();

    return STAYS_KEYWORD_LIST
        .filter(keyword => keyword.toLowerCase().includes(lowerInput))
        .slice(0, 8); // Limit suggestions for performance/UI
}, [title]);

  // Handler to select a keyword (used for click and Enter key)
  const handleSelectSuggestion = (keyword: string) => {
      setLocation(keyword);
      localStorage.setItem('title', keyword);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      locationInputRef.current?.focus(); // Keep focus after selection
  };

  // Handler for input change
  const handleLocationChange = (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocation(value);
      localStorage.setItem('title', value);
      
      // Only show suggestions if there's input and matches exist
      if (value.length > 0) {
          setShowSuggestions(true);
          setActiveSuggestionIndex(-1);
      } else {
          setShowSuggestions(false);
      }
  };

  // Handler for keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || filteredSuggestions.length === 0) return;

      if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveSuggestionIndex(prev => 
              (prev < filteredSuggestions.length - 1) ? prev + 1 : 0
          );
      } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveSuggestionIndex(prev => 
              (prev > 0) ? prev - 1 : filteredSuggestions.length - 1
          );
      } else if (e.key === 'Enter') {
          e.preventDefault(); // Prevent form submission
          if (activeSuggestionIndex >= 0) {
              handleSelectSuggestion(filteredSuggestions[activeSuggestionIndex]);
          } else {
              // If nothing is highlighted, just accept the current input value
              setShowSuggestions(false);
          }
      } else if (e.key === 'Escape') {
          setShowSuggestions(false);
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
      } else if (newDate.getTime() === currentStartDate.getTime()) {
        // If selected same date for start and end, make end date 1 day after start date
        finalEndDate = new Date(currentStartDate);
       finalEndDate.setDate(currentStartDate.getDate() + 1);
      }
      setDateRange({ 
        startDate: finalStartDate,
        endDate: finalEndDate
      });
      localStorage.setItem('checkIn', formatDateForURL(finalStartDate));
      localStorage.setItem('checkOut', formatDateForURL(finalEndDate));
      setShowGuests(true);
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
          setShowGuests(true); // Open guests selector after date selection
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
    <div className=" text-black shadow-lg border-yellow-400 border-1 p-0.5 pl-1 pr-1 bg-yellow-400 rounded-lg">
      <div className="flex flex-wrap ">
        {/* Location Input */}
        <div className="w-full md:w-1/3 relative">
            <div className="bg-white text-black h-full p-4 rounded-md flex items-center border-yellow-400 border-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bed-double-icon lucide-bed-double">
                    <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" /><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" /><path d="M12 4v6" /><path d="M2 18h20" />
                </svg>
                <input
                    ref={locationInputRef} // <-- ATTACH REF
                    type="text"
                    placeholder="Where are you going?"
                    className="flex-1 outline-none text-sm ml-4"
                    value={title}
                    onChange={handleLocationChange} // <-- USE NEW HANDLER
                    onKeyDown={handleKeyDown}     // <-- USE NEW KEYBOARD HANDLER
                    onFocus={() => {
                        // Show suggestions if input is present when focused
                        if (title.length > 0 && filteredSuggestions.length > 0) {
                            setShowSuggestions(true);
                        }
                    }}
                    onBlur={() => {
                        // Delay hiding to allow click events on suggestions to register
                        setTimeout(() => setShowSuggestions(false), 150);
                    }}
                />
                {title && (
                    <button className="text-gray-400" onClick={() => {
                        setLocation('');
                        localStorage.removeItem('title');
                        setShowSuggestions(false); // Hide suggestions on clear
                        setActiveSuggestionIndex(-1);
                        locationInputRef.current?.focus();
                    }}>
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Autocomplete Suggestions Dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-30 max-h-80 overflow-y-auto transform transition duration-300 ease-out origin-top">
                    
                    {/* Optional: Add a subtle header for context */}
                    <div className="p-3 pt-4 text-xs font-semibold uppercase text-gray-500 tracking-wider border-b border-gray-100 sticky top-0 bg-white">
                        Matching Destinations ({filteredSuggestions.length})
                    </div>

                    <ul className="divide-y divide-gray-100">
                        {filteredSuggestions.map((suggestion, index) => {
                            const isActive = index === activeSuggestionIndex;
                            
                            return (
                                <li
                                    key={suggestion}
                                    className={`
                                        flex items-center p-3 sm:p-4 text-base cursor-pointer transition-colors duration-150
                                        ${isActive 
                                            ? 'bg-[#003c95] text-white' // Active/Selected style
                                            : 'hover:bg-gray-50 text-gray-800' // Hover style
                                        }
                                    `}
                                    // Use mousedown to prevent onBlur from firing before onClick
                                    onMouseDown={(e) => { 
                                        e.preventDefault(); 
                                        handleSelectSuggestion(suggestion);
                                    }}
                                >
                                    {/* Optional Icon: Pin icon adds visual relevance */}
                                    <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        width="20" height="20" viewBox="0 0 24 24" fill="none" 
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        className={`mr-3 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`}
                                    >
                                        <path d="M12 21.7c-4.4-4.4-8-7.7-8-10.7a8 8 0 0 1 16 0c0 3-3.6 6.3-8 10.7z"/><circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    
                                    {/* Highlight the matching text */}
                                    <SuggestionText 
                                        suggestion={suggestion} 
                                        query={title} 
                                        isActive={isActive}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>

        {/* Date Range */}
        <div className="w-full md:w-1/3 relative">
          <div 
            className="bg-white text-black p-4 h-full rounded-md flex items-center justify-between border-yellow-400 border-3 cursor-pointer"
            onClick={() => {
              if (!showCalendar) { 
                const currentStartDate = dateRange.startDate;
                setSelectedMonth(currentStartDate.getMonth());
                setSelectedYear(currentStartDate.getFullYear());
                if(selectionPhase === 1){
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
              className="absolute left-0 lg:-top-20 -top-100  mt-2 bg-white shadow-lg rounded-lg p-4 z-20 border border-gray-200 w-full md:w-[650px]"
            >
              <div className="flex justify-between items-center mb-4">
                 <button className="text-[#003c95]">
                  {selectionPhase === 1 ? 'Select end date' : 'Select your dates'}
                </button>
              </div>
              
              <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <button 
                      onClick={prevMonth} 
                      className={`text-gray-500 p-1 hover:bg-gray-100 rounded-full ${isPrevMonthDisabled() ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isPrevMonthDisabled()}
                    >
                      {'<'}
                    </button>
                    <h3 className="font-bold text-center">{currentMonthName} {selectedYear}</h3>
                    <div className="w-6"></div> 
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
                      if (disabled) cellClass += ' text-gray-300 cursor-not-allowed';
                      else if (isSingleDaySelection) cellClass += ' bg-[#003c95] text-white !rounded-full';
                      else if (isStart) cellClass += ' bg-[#003c95] text-white rounded-l-full rounded-r-none';
                      else if (isEnd) cellClass += ' bg-[#003c95] text-white rounded-r-full rounded-l-none';
                      else if (inRange) cellClass += ' bg-[#003c95] text-[#003c95] rounded-none';
                      else cellClass += ' hover:bg-[#003c95]';

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
                
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                     <div className="w-6"></div>
                    <h3 className="font-bold text-center">
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
                      if (disabled) cellClass += ' text-gray-300 cursor-not-allowed';
                      else if (isSingleDaySelection) cellClass += ' bg-[#003c95] text-white !rounded-full';
                      else if (isStart) cellClass += ' bg-[#003c95] text-white rounded-l-full rounded-r-none';
                      else if (isEnd) cellClass += ' bg-[#003c95] text-white rounded-r-full rounded-l-none';
                      else if (inRange) cellClass += ' bg-[#003c95] text-[#003c95] rounded-none';
                      else cellClass += ' hover:bg-[#003c95]';
                      
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
              className="absolute lg:right-0 left-5 -top-70 lg:-top-20 mt-2 bg-white shadow-lg rounded-lg p-4 z-20 border border-gray-200 w-72"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">Adults</span>
                    <p className="text-xs text-gray-500">Max 3 per room</p>
                  </div>
                  <div className="flex items-center space-x-4 border-2 p-1 border-gray-400 rounded">
                    <button 
                      className={`p-1 rounded-full ${adults > 1 ? 'text-[#003c95] hover:bg-[#003c95]' : 'text-gray-300 cursor-not-allowed'}`}
                      onClick={() => adjustGuests('adults', 'subtract')}
                      disabled={adults <= 1}
                    ><Minus className="h-5 w-5" /></button>
                    <span className="w-8 text-center">{adults}</span>
                    <button 
                      className="p-1 rounded-full text-[#003c95] hover:bg-[#003c95]"
                      onClick={() => adjustGuests('adults', 'add')}
                    ><Plus className="h-5 w-5" /></button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Children</span>
                  <div className="flex items-center space-x-4 border-2 p-1 border-gray-400 rounded">
                    <button 
                      className={`p-1 rounded-full ${children > 0 ? 'text-[#003c95] hover:bg-[#003c95]' : 'text-gray-300 cursor-not-allowed'}`}
                      onClick={() => adjustGuests('children', 'subtract')}
                      disabled={children <= 0}
                    ><Minus className="h-5 w-5" /></button> {/* Corrected icon */}
                    <span className="w-8 text-center">{children}</span>
                    <button 
                      className="p-1 rounded-full text-[#003c95] hover:bg-[#003c95]"
                      onClick={() => adjustGuests('children', 'add')}
                    ><Plus className="h-5 w-5" /></button> {/* Corrected icon */}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">Rooms</span>
                    {Math.ceil(adults / 3) > rooms && (
                      <p className="text-xs text-red-500">Min {Math.ceil(adults / 3)} rooms needed</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 border-2 p-1 border-gray-400 rounded">
                    <button 
                      className={`p-1 rounded-full ${rooms > 1 && rooms > Math.ceil(adults / 3) ? 'text-[#003c95] hover:bg-[#003c95]' : 'text-gray-300 cursor-not-allowed'}`}
                      onClick={() => adjustGuests('rooms', 'subtract')}
                      disabled={rooms <= 1 || rooms <= Math.ceil(adults / 3)}
                    ><Minus className="h-5 w-5" /></button>
                    <span className="w-8 text-center">{rooms}</span>
                    <button 
                      className="p-1 rounded-full text-[#003c95] hover:bg-[#003c95]"
                      onClick={() => adjustGuests('rooms', 'add')}
                    ><Plus className="h-5 w-5" /></button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Travelling with pets?</div>
                    <div className="text-xs ">
                      <span>Assistance animals aren&apos;t considered pets.</span>
                      <div><a href="#" className="text-[#003c95] hover:underline">Read more...</a></div>
                    </div>
                  </div>
                  <div className="relative inline-block w-10 align-middle select-none">
                    <input 
                      type="checkbox" name="pets" id="pets" 
                      className="opacity-0 absolute peer block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                      checked={hasPets}
                      onChange={() => {
                        const newHasPets = !hasPets;
                        setHasPets(newHasPets);
                        localStorage.setItem('pets', newHasPets.toString());
                      }}
                    />
                    <label htmlFor="pets" className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-[#003c95] transition-colors duration-200 ease-in-out">
                      <span className={`block w-6 h-6 rounded-full bg-white shadow transform peer-checked:translate-x-4 transition-transform duration-200 ease-in-out`}></span>
                    </label>
                  </div>
                </div>
                
                <button 
                  className="w-full py-3 bg-[#003c95] text-white rounded-md font-medium hover:bg-[#003c95]"
                  onClick={() => setShowGuests(false)}
                >Done</button>
              </div>
            </div>
          )}
        </div>
        
        {/* Search Button */}
        <div className="w-full md:w-1/12">
          <button 
            className="bg-[#003c95] hover:bg-[#003c95] text-white w-full text-xl py-4 rounded-md font-bold flex items-center justify-center h-full"
            onClick={handleSearch}
          >Search</button>
        </div>
      </div>
    </div>
  );
}