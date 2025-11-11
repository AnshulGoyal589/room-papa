"use client";

import React, { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Briefcase } from 'lucide-react';
import { Trip } from '@/lib/mongodb/models/Trip';

import TripDetailsSection from './TripDetailsSection';
import ItineraryManager from './ItineraryManager';
import TripFeaturesSection from './TripFeaturesSection';

const TripForm = () => {

  const { control, setValue } = useFormContext<Trip>();

  const itinerary = useWatch({
    control,
    name: 'itinerary',
  });

  useEffect(() => {
    const newDaysCount = itinerary?.length || 0;
    setValue('daysCount', newDaysCount, { shouldValidate: true });
  }, [itinerary, setValue]);

  return (
    <div className="space-y-8 p-16">
      <h2 className="text-2xl font-bold flex items-center">
        <Briefcase className="mr-3 h-7 w-7 text-primary"/> Create Trip Package
      </h2>
      <TripDetailsSection />
      <ItineraryManager />
      <TripFeaturesSection />
    </div>
  );
};

export default TripForm;