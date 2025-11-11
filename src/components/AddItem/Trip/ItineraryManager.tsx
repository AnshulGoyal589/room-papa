"use client";

import React, { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { ListCollapse, PlusCircle } from 'lucide-react';
import ItineraryDayForm from './ItineraryDayForm';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ItineraryDay, Trip } from '@/lib/mongodb/models/Trip';
import { SectionHeader } from '../Property/SharedUI';

const ItineraryManager: React.FC = () => {
  const { control } = useFormContext<Trip>();
  
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "itinerary",
  });

  const [editingDayNumber, setEditingDayNumber] = useState<number | null>(null);

  const handleSaveDay = (dayData: ItineraryDay) => {
    const dayIndex = fields.findIndex(day => (day as ItineraryDay).dayNumber === dayData.dayNumber);

    if (dayIndex > -1) {
      update(dayIndex, dayData);
    } else {
      append(dayData);
    }
    setEditingDayNumber(null);
  };

  const handleRemoveDay = (index: number) => {
    const dayNumber = (fields[index] as ItineraryDay).dayNumber;
    if (confirm(`Are you sure you want to remove Day ${dayNumber}?`)) {
      remove(index);
    }
  };

  const handleAddNewDay = () => {
    const newDayNumber = (fields.length || 0) + 1;
    setEditingDayNumber(newDayNumber);
  };
  
  const handleCancelEdit = () => {
    setEditingDayNumber(null);
  }

  return (
    <div className="space-y-4 pt-6 border-t p-4 border rounded-lg bg-slate-50">
      <SectionHeader title="Manage Daily Itinerary" icon={ListCollapse} />

      <Accordion type="single" collapsible className="w-full">
         {fields.map((field, index) => {
           const day = field as ItineraryDay & { id: string };
           return editingDayNumber === day.dayNumber ? (
             <ItineraryDayForm
                key={day.id}
                dayData={day}
                onSave={handleSaveDay}
                onCancel={handleCancelEdit}
             />
           ) : (
             <AccordionItem value={`day-${day.dayNumber}`} key={day.id}>
              <AccordionTrigger>
                <div className="flex justify-between w-full pr-4 items-center">
                  <span className="font-semibold text-left">Day {day.dayNumber}: {day.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-sm text-muted-foreground pl-2 space-y-2">
                  <p><strong>Overview:</strong> {day.overview}</p>
                  <div className="flex gap-2 items-center pt-2">
                     <Button variant="outline" size="sm" onClick={() => setEditingDayNumber(day.dayNumber)}>Edit</Button>
                    
                     <Button variant="destructive" size="sm" onClick={() => handleRemoveDay(index)}>Remove</Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
           )
         })}
      </Accordion>
      
      {editingDayNumber && !fields.some(d => (d as ItineraryDay).dayNumber === editingDayNumber) && (
        <ItineraryDayForm
          key={editingDayNumber}
          dayData={{ dayNumber: editingDayNumber, title: '', overview: '' }}
          onSave={handleSaveDay}
          onCancel={handleCancelEdit}
        />
      )}

      {!editingDayNumber && (
        <Button onClick={handleAddNewDay} className="w-full mt-4">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Day {fields.length + 1}
        </Button>
      )}
    </div>
  );
};

export default ItineraryManager;