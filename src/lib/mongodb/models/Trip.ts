import { Collection ,ObjectId} from 'mongodb';
import { getDb } from '..';
import { TripType } from '@/types';
import { Image } from './Image';

export interface Trip {
  _id?: ObjectId;
  userId?: string; // Reference to the user who created the trip i.e. manager ID
  title?: string; // Tagline of the Trip
  description?: string; // Description of the trip
  domain?: string;
  destination: {
    city: string;
    state : string;
    country: string;
  };
  startDate: string;
  endDate: string;
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
  activities:string[];
  rat ?: number | '1';
  createdAt?: Date;
  updatedAt?: Date;
  bannerImage?: Image; // Main featured image
  detailImages?: Image[]; // Trip gallery images
  type : string; // Domestic or International
  amenities: string[];

  accessibility : string[];
  // roomAccessibility : string[];
  popularFilters : string[];
  funThingsToDo : string[];
  meals : string[];
  facilities : string[];
  rating : Number;
  // bedPreference : string[];
  reservationPolicy : string[];
  brands : string[];
  // roomFacilities : string[];
}

interface TripValidationInput {
  userId: string;
  title: string;
  destination: {
    city: string;
    country: string;
    [key: string]: unknown;
  };
  startDate: string | Date;
  endDate: string | Date;
  status: string;
  [key: string]: unknown;
}

export function validateTrip(tripData: TripValidationInput): boolean {
  const requiredFields = ['userId', 'title', 'destination', 'startDate', 'endDate', 'status'];
  
  for (const field of requiredFields) {
    if (!tripData[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Validate destination sub-fields
  const requiredDestinationFields = ['city', 'country'];
  for (const field of requiredDestinationFields) {
    if (!tripData.destination[field]) {
      throw new Error(`Missing required destination field: ${field}`);
    }
  }
  
  // Validate trip status
  const validTripTypees: TripType[] = ['Domestic', 'International'];
  if (!validTripTypees.includes(tripData.status as TripType)) {
    throw new Error(`Invalid trip status. Must be one of: ${validTripTypees.join(', ')}`);
  }
  
  // Validate dates
  const startDate = new Date(tripData.startDate);
  const endDate = new Date(tripData.endDate);
  
  if (isNaN(startDate.getTime())) {
    throw new Error('Invalid start date');
  }
  
  if (isNaN(endDate.getTime())) {
    throw new Error('Invalid end date');
  }
  
  if (startDate > endDate) {
    throw new Error('Start date must be before end date');
  }
  
  return true;
}

export async function getTripsCollection(): Promise<Collection<Trip>> {
    const db = await getDb();
    return db.collection<Trip>('trips');
  }
  
  export async function getAllTrips(userId?: string): Promise<Trip[]> {
    const trips = await getTripsCollection();
    
    const query = userId ? { userId } : {};
    return trips.find(query).toArray();
  }
  
  export async function getTripById(id: string): Promise<Trip | null> {
    const trips = await getTripsCollection();
    return trips.findOne({ _id: new ObjectId(id) });
  }
  
  // export async function createTrip(tripData: Omit<Trip, '_id' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
  //   try {
  //     // Validate trip data
  //     validateTrip(tripData as any);
      
  //     const trips = await getTripsCollection();
      
  //     const newTrip: Trip = {
  //       ...tripData,
  //       accommodations: tripData.accommodations || [],
  //       transportation: tripData.transportation || [],
  //       activities: tripData.activities || [],
  //       createdAt: new Date(),
  //       updatedAt: new Date()
  //     };
      
  //     const result = await trips.insertOne(newTrip as any);
      
  //     return {
  //       ...newTrip,
  //       _id: result.insertedId.toString()
  //     };
  //   } catch (error) {
  //     console.error('Error creating trip:', error);
  //     throw error;
  //   }
  // }
  
  export async function updateTrip(id: string, tripData: Partial<Trip>): Promise<Trip | null> {
    const trips = await getTripsCollection();
    
    await trips.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...tripData,
          updatedAt: new Date()
        } 
      }
    );
    
    return getTripById(id);
  }
  
  export async function deleteTrip(id: string): Promise<boolean> {
    const trips = await getTripsCollection();
    const result = await trips.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }