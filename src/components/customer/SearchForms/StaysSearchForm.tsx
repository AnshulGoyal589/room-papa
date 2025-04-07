import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Plus, Minus } from 'lucide-react';

export default function StaysSearchForm() {
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('18 Apr 2025');
  const [endDate, setEndDate] = useState('23 May 2025');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(4); // April (0-indexed)
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedDates, setSelectedDates] = useState([new Date(2025, 3, 18), new Date(2025, 4, 23)]); // [start, end]
  const [hasPets, setHasPets] = useState(false);
  const [selectionPhase, setSelectionPhase] = useState(0); // 0: no selection, 1: start date selected
  
  const calendarRef = useRef(null);
  const guestsRef = useRef(null);

  // Ensure minimum rooms based on adults count (max 3 adults per room)
  useEffect(() => {
    const requiredRooms = Math.ceil(adults / 3);
    if (rooms < requiredRooms) {
      setRooms(requiredRooms);
    }
  }, [adults, rooms]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    
    // Format dates in ISO format (YYYY-MM-DD)
    const isoStartDate = selectedDates[0].toISOString().split('T')[0];
    const isoEndDate = selectedDates[1].toISOString().split('T')[0];
    
    params.set('checkIn', isoStartDate);
    params.set('checkOut', isoEndDate);
    params.set('adults', adults.toString());
    params.set('children', children.toString());
    params.set('rooms', rooms.toString());
    if (hasPets) params.set('pets', 'true');

    // Redirect to the customer search page with params
    window.location.href = `/customer/search?${params.toString()}`;
  };

  const handleDateClick = (date, month, year) => {
    const newDate = new Date(year, month, date);
    
    if (selectionPhase === 0 || selectedDates.length === 2) {
      // Start new selection
      setSelectedDates([newDate]);
      setSelectionPhase(1);
    } else if (selectionPhase === 1) {
      // Complete the selection
      if (newDate.getTime() > selectedDates[0].getTime()) {
        setSelectedDates([selectedDates[0], newDate]);
        setSelectionPhase(0);
        
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        setStartDate(selectedDates[0].toLocaleDateString('en-US', options).replace(',', ''));
        setEndDate(newDate.toLocaleDateString('en-US', options).replace(',', ''));
        setTimeout(() => setShowCalendar(false), 300);
      } else {
        // If clicked date is before the start date, make it the new start date
        setSelectedDates([newDate]);
        setSelectionPhase(1);
      }
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
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const generateCalendar = (month, year) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
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

  const isDateSelected = (day, month, year) => {
    if (!day) return false;
    
    const date = new Date(year, month, day);
    
    if (selectedDates.length === 1) {
      return date.getTime() === selectedDates[0].getTime();
    }
    
    if (selectedDates.length === 2) {
      const time = date.getTime();
      return (
        time === selectedDates[0].getTime() || 
        time === selectedDates[1].getTime() ||
        (time > selectedDates[0].getTime() && time < selectedDates[1].getTime())
      );
    }
    
    return false;
  };

  const isStartDate = (day, month, year) => {
    if (!day) return false;
    const date = new Date(year, month, day);
    return selectedDates.length > 0 && date.getTime() === selectedDates[0].getTime();
  };

  const isEndDate = (day, month, year) => {
    if (!day) return false;
    const date = new Date(year, month, day);
    return selectedDates.length === 2 && date.getTime() === selectedDates[1].getTime();
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
      if (guestsRef.current && !guestsRef.current.contains(event.target)) {
        setShowGuests(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const adjustGuests = (type, operation) => {
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
        // No need to adjust rooms down automatically
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
    <div className="bg-white text-black shadow-lg p-4 rounded-lg">
      <div className="flex flex-wrap -mx-1">
        {/* Location Input */}
        <div className="w-full md:w-1/3 p-1">
          <div className="relative">
            <div className="bg-white text-black p-4 rounded-md flex items-center border-2 border-blue-600 hover:border-blue-700">
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 0 1 3 0l7.5 4.33a2 2 0 0 1 1 1.732V21a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-6h-3v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.577a2 2 0 0 1 1-1.732l7.5-4.33z"/>
              </svg>
              <input 
                type="text" 
                placeholder="Where are you going?" 
                className="flex-1 outline-none text-sm"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              {location && (
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
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 9h-2V7h-2v2h-2v2h2v2h2v-2h2V9zm-4 9H2V6a2 2 0 0 1 2-2h3v2H4v12h14v-2zM6 2v2H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-6V2H6z"/>
              </svg>
              <div className="text-sm">
                <div>
                  {selectionPhase === 1 ? 'Select end date' : `${startDate} — ${endDate}`}
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
                <button className="text-blue-600" onClick={() => {setShowCalendar(false); setSelectionPhase(0);}}>
                  {selectionPhase === 1 ? 'Select end date' : 'Calendar'}
                </button>
                <button className="text-gray-400">I'm flexible</button>
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
                          isDateSelected(day, selectedMonth, selectedYear) 
                            ? 'bg-blue-600 text-white' 
                            : 'hover:bg-blue-100'
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
                            isDateSelected(day, nextMonth, nextYear) 
                              ? 'bg-blue-600 text-white' 
                              : 'hover:bg-blue-100'
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
              
              <div className="flex justify-between mt-4">
                <div className="flex space-x-2">
                  <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-full">Exact dates</button>
                  <button className="px-4 py-2 border border-gray-300 rounded-full">1 day</button>
                  <button className="px-4 py-2 border border-gray-300 rounded-full">2 days</button>
                  <button className="px-4 py-2 border border-gray-300 rounded-full">3 days</button>
                  <button className="px-4 py-2 border border-gray-300 rounded-full">7 days</button>
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
                  <div className="flex items-center space-x-4">
                    <button 
                      className={`p-1 rounded-full ${adults > 1 ? 'text-blue-600' : 'text-gray-300'}`}
                      onClick={() => adjustGuests('adults', 'subtract')}
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-8 text-center">{adults}</span>
                    <button 
                      className="p-1 rounded-full text-blue-600"
                      onClick={() => adjustGuests('adults', 'add')}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Children */}
                <div className="flex justify-between items-center">
                  <span className="font-medium">Children</span>
                  <div className="flex items-center space-x-4">
                    <button 
                      className={`p-1 rounded-full ${children > 0 ? 'text-blue-600' : 'text-gray-300'}`}
                      onClick={() => adjustGuests('children', 'subtract')}
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-8 text-center">{children}</span>
                    <button 
                      className="p-1 rounded-full text-blue-600"
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
                  <div className="flex items-center space-x-4">
                    <button 
                      className={`p-1 rounded-full ${rooms > 1 && rooms > Math.ceil(adults / 3) ? 'text-blue-600' : 'text-gray-300'}`}
                      onClick={() => adjustGuests('rooms', 'subtract')}
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-8 text-center">{rooms}</span>
                    <button 
                      className="p-1 rounded-full text-blue-600"
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
                    <div className="text-xs text-blue-600">
                      <span>Assistance animals aren't considered pets.</span>
                      <div>
                        <a href="#" className="text-blue-600">Read more about travelling with assistance animals</a>
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
                      className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${hasPets ? 'bg-blue-600' : ''}`}
                    >
                      <span className={`block w-6 h-6 rounded-full bg-white shadow transform ${hasPets ? 'translate-x-4' : 'translate-x-0'} transition-transform duration-200 ease-in-out`}></span>
                    </label>
                  </div>
                </div>
                
                <button 
                  className="w-full py-3 bg-blue-600 text-white rounded-md font-medium"
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
            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-4 rounded-md font-bold flex items-center justify-center"
            onClick={handleSearch}
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}