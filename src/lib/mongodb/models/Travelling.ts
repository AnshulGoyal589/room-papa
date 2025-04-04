import { Collection , ObjectId } from 'mongodb';
import { getDb } from '..';
import { ItineraryDayWeather, ItineraryVisibility, TransportationType } from '@/types';
import { Image } from './Image';

export interface Travelling {
  _id?: ObjectId;
  userId: string;
  title: string;
  rat ?: number | '1';
  description?: string;
  transportation: {
    type: TransportationType;
    arrivalTime: string;
    departureTime: string;
    from: string;
    to: string;
  };
  costing: {
    price: number;
    discountedPrice: number;
    currency: string;
  };
  totalRating?: number; 
  review?: {
    comment: string;
    rating: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
  
  bannerImage: Image;
  detailImages: Image[];
}

interface TravellingValidationInput {
  tripId: string;
  userId: string;
  title: string;
  visibility: string;
  days: {
    date: string | Date;
    activities: {
      title: string;
      startTime: string | Date;
      endTime: string | Date;
      [key: string]: unknown;
    }[];
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

export function validateTravelling(travellingData: TravellingValidationInput): boolean {
  const requiredFields = ['tripId', 'userId', 'title', 'visibility', 'days'];
  
  for (const field of requiredFields) {
    if (!travellingData[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Validate visibility
  const validVisibilityOptions: ItineraryVisibility[] = ['private', 'shared', 'public'];
  if (!validVisibilityOptions.includes(travellingData.visibility as ItineraryVisibility)) {
    throw new Error(`Invalid visibility option. Must be one of: ${validVisibilityOptions.join(', ')}`);
  }
  
  // Validate days array is not empty
  if (!Array.isArray(travellingData.days) || travellingData.days.length === 0) {
    throw new Error('Itinerary must include at least one day');
  }
  
  // Validate each day
  for (const [index, day] of travellingData.days.entries()) {
    // Check required day fields
    if (!day.date) {
      throw new Error(`Day ${index + 1} is missing date`);
    }
    
    // Validate day date
    const dayDate = new Date(day.date);
    if (isNaN(dayDate.getTime())) {
      throw new Error(`Day ${index + 1} has invalid date`);
    }
    
    // Validate activities
    if (!Array.isArray(day.activities)) {
      throw new Error(`Day ${index + 1} activities must be an array`);
    }
    
    // Validate each activity
    for (const [actIndex, activity] of day.activities.entries()) {
      if (!activity.title) {
        throw new Error(`Activity ${actIndex + 1} on day ${index + 1} is missing title`);
      }
      
      if (!activity.startTime) {
        throw new Error(`Activity ${actIndex + 1} on day ${index + 1} is missing start time`);
      }
      
      if (!activity.endTime) {
        throw new Error(`Activity ${actIndex + 1} on day ${index + 1} is missing end time`);
      }
      
      // Validate activity times
      const startTime = new Date(activity.startTime);
      const endTime = new Date(activity.endTime);
      
      if (isNaN(startTime.getTime())) {
        throw new Error(`Activity ${actIndex + 1} on day ${index + 1} has invalid start time`);
      }
      
      if (isNaN(endTime.getTime())) {
        throw new Error(`Activity ${actIndex + 1} on day ${index + 1} has invalid end time`);
      }
      
      if (startTime > endTime) {
        throw new Error(`Activity ${actIndex + 1} on day ${index + 1} start time must be before end time`);
      }
    }
    
    // Validate weather if present
    if (day.weather) {
      const validWeatherOptions: ItineraryDayWeather[] = ['sunny', 'cloudy', 'rainy', 'snowy', 'unknown'];
      if (!validWeatherOptions.includes(day.weather as ItineraryDayWeather)) {
        throw new Error(`Day ${index + 1} has invalid weather. Must be one of: ${validWeatherOptions.join(', ')}`);
      }
    }
  }
  
  return true;
}

export async function getTravellingsCollection(): Promise<Collection<Travelling>> {
    const db = await getDb();
    return db.collection<Travelling>('travellings');
  }
  
  export async function getAllTravellings(userId?: string): Promise<Travelling[]> {
    const travellings = await getTravellingsCollection();
    
    const query: Partial<Travelling> = {};
    if (userId) query.userId = userId;
    
    return travellings.find(query).toArray();
  }
  
  export async function getTravellingById(id: string): Promise<Travelling | null> {
    const travellings = await getTravellingsCollection();
    return travellings.findOne({_id: new ObjectId(id) });
  }
  
  
  export async function updateTravelling(id: string, travellingData: Partial<Travelling>): Promise<Travelling | null> {
    const travellings = await getTravellingsCollection();
    
    await travellings.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...travellingData,
          updatedAt: new Date()
        } 
      }
    );
    
    return getTravellingById(id);
  }
  
  export async function deleteTravelling(id: string): Promise<boolean> {
    const travellings = await getTravellingsCollection();
    const result = await travellings.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }