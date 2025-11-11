// /components/trip-form/ItineraryDayList.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ItineraryDay } from '@/lib/mongodb/models/Trip';

interface ItineraryDayListProps {
  days: ItineraryDay[];
  onRemoveDay: (dayNumber: number) => void;
}

const ItineraryDayList: React.FC<ItineraryDayListProps> = ({ days, onRemoveDay }) => {
  if (!days || days.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4 border-dashed border rounded-md">
        No itinerary days have been added yet. Use the form below to add the first day.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-md font-medium text-foreground">Added Itinerary Days:</h4>
      {days.map((day) => (
        <div key={day.dayNumber} className="p-4 bg-white border rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-foreground text-lg">
                Day {day.dayNumber}: {day.title}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{day.overview}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              type="button" 
              onClick={() => onRemoveDay(day.dayNumber)} 
              className="text-destructive hover:text-destructive/80 -mt-2 -mr-2"
              aria-label={`Remove Day ${day.dayNumber}`}
            >
              <X size={18} />
            </Button>
          </div>
          {/* We could render more details here like activities, places, etc. */}
        </div>
      ))}
    </div>
  );
};

export default ItineraryDayList;