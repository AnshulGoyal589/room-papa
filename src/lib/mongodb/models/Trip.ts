import { Collection ,ObjectId} from 'mongodb';
import { getDb } from '..';
import { TripType } from '@/types';
import { Costing, Image, Period, Review } from './Components';

export interface Destination{
  address?: string;
  city: string;
  state: string;
  country: string;
}

export type WithClientId<T> = T & { clientId: string };

export interface PlaceToVisit {
  name: string;
  description?: string;
  duration?: string; // e.g., "2 hours"
  location?: Destination;
  image?: Image;
}

export interface TransportSegment {
  mode?: string; // e.g., "Private Car", "Flight", "Train"
  details?: string; // e.g., "Toyota Innova", "Flight SG-123"
  departureTime?: string;
  arrivalTime?: string;
}

export interface Accommodation {
  hotelId?: ObjectId; // Link to your Hotels collection
  name?: string;      // Manual entry if not in your DB
  address?: string;
  image?: Image;
}

export interface ItineraryDay {
  dayNumber: number;
  date?: Date;
  title?: string;
  overview?: string;
  activities?: string[];
  placesToVisit?: WithClientId<PlaceToVisit>[]; 
  meals?: string[];
  transport?: WithClientId<TransportSegment>[];
  accommodation?: Accommodation | null;
  images?: Image[];
  notes?: string;
}

export interface Trip {
  _id?: ObjectId;
  accessibility?: string[];
  activities: string[];
  amenities?: string[];
  availability?: Period[];
  bannerImage?: Image;
  brands?: string[];
  costing: Costing;
  createdAt?: Date;
  description?: string;
  destination: Destination;
  detailImages?: Image[];
  domain?: string;
  facilities?: string[];
  funThingsToDo?: string[];
  meals?: string[];
  popularFilters?: string[];
  pickupService?: boolean;
  reservationPolicy?: string[];
  review?: Review[];
  title?: string;
  totalRating?: number;
  type: string; // Domestic or International
  updatedAt?: Date;
  userId?: string;
  hotels: ObjectId[];
  daysCount?: number;
  itinerary?: ItineraryDay[];
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
  
  export async function getAllTrips(): Promise<Trip[]> {
    const trips = await getTripsCollection();
    return trips.find({}).toArray();
  }

    export async function getAllUploaderTrips(userId: string): Promise<Trip[]> {
      const trips = await getTripsCollection();
      if(!userId){
        return trips.find({}).toArray();
      }
      return trips.find({ userId }).toArray();
    }
  
  export async function getTripById(id: string): Promise<Trip | null> {
    const trips = await getTripsCollection();
    return trips.findOne({ _id: new ObjectId(id) });
  }
  
  export async function updateTrip(id: string, tripData: Partial<Trip>): Promise<Trip | null> {
    
    if (!ObjectId.isValid(id)) {
      console.error("Invalid ID format provided:", id);
      return null;
    }
    
    const trips = await getTripsCollection();

    const updatePayload = { ...tripData };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (updatePayload as any)._id; 
    
     try {
        const result = await trips.findOneAndUpdate(
          { _id: new ObjectId(id) },
          {
            $set: {
              ...updatePayload,
              updatedAt: new Date()
            }
          },
          {
            returnDocument: 'after' 
          }
        );
        return result;

      } catch (error) {
        console.error("Failed to update property:", error);
        throw new Error("Database update failed.");
      }
  }
  
  export async function deleteTrip(id: string): Promise<boolean> {
    const trips = await getTripsCollection();
    const result = await trips.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }