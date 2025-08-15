import { ObjectId } from "mongodb";
import { RoomCategoryPricing } from "./booking";

export type PropertyType = 'hotel' | 'apartment' | 'villa' | 'hostel' | 'resort';
export type PropertyAmenities = 'wifi' | 'pool' | 'gym' | 'spa' | 'restaurant' | 'parking' | 'airConditioning' | 'breakfast';
export type PopularFilters = 'Free cancellation' | 'No prepayment' | 'Book without credit card' | 'Breakfast & dinner included' | 'Swimming Pool';
export type RoomAccessibility = 'Entire unit located on ground floor' | 'Upper floors accessible by elevator' | 'Entire unit wheelchair accessible' | 'Toilet with grab rails' | 'Adapted bath' | 'Roll-in shower' | 'Walk-in shower' | 'Raised toilet' | 'Lowered sink' | 'Emergency cord in bathroom' | 'Shower chair';
export type PropertyAccessibility = 'Toilet with grab rails' | 'Higher level toilet' | 'gyLower bathroom sinkm' | 'Emergency cord in bathroom' | 'Auditory guidance';
export type ItineraryVisibility = 'private' | 'shared' | 'public';
export type ItineraryDayWeather = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'unknown';
export type TransportationType = 'flight' | 'train' | 'bus' | 'car' | 'ferry' | 'other';
export type TripType = 'Domestic' | 'International';

export interface SearchHeaderProps {
  category: string;
  initialSearchParams?: { [key: string]: string };
}


export interface PricingByMealPlan {
  noMeal: number;
  breakfastOnly: number;
  allMeals: number; // Represents Breakfast + Lunch/Dinner
}

export interface DiscountedPricingByMealPlan {
  noMeal?: number;        // Use optional if discount might not exist
  breakfastOnly?: number;
  allMeals?: number;
}



export interface RoomCategory {
  id: string; // Essential: Unique identifier for the category (frontend relies on this)
  _id?: string | ObjectId; // Optional: Mongoose/DB ID if different from frontend 'id'
  title: string;
  qty: number;
  currency: string;
  pricing: RoomCategoryPricing; // Use the detailed pricing structure above
  unavailableDates: string[]; // Array of dates in 'YYYY-MM-DD' format
}

export type DateFilter2 = {
  [key: string]: unknown;
  transportation: {
      arrivalTime?: {
          $gte?: Date;
          $lte?: Date;
      };
  };
}

export type UserRole = 'customer' | 'manager' | 'admin' ;

export interface QueryType {
  [key: string]: unknown;
  $or?: Array<Record<string, unknown>>;
  $and?: Array<Record<string, unknown>>;
}

export type ErrorResponse = {
  error: string;
};

export interface DateFilter {
  transportation: {
    arrivalTime?: {
      $gte?: Date;
      $lte?: Date;
    }
  };
}


// Define general item type
export interface GeneralItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  category: 'Property' | 'Trip' | 'Travelling';
}


export interface BookingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passengers: number;
  rooms?: number;
  specialRequests: string;
}


export interface RoleRouteConfig {
  allowedRoutes: string[];
  redirectTo: string;
  defaultRoute: string;
}

export interface RouteConfig {
  publicRoutes: string[];
  roleRoutes: {
    [key in UserRole]: RoleRouteConfig;
  };
}

export interface UserWithRole {
  id: string;
  role: UserRole;
}

// Enums
// export enum TripType {
//   PLANNED = 'planned',
//   ACTIVE = 'active',
//   COMPLETED = 'completed',
//   CANCELLED = 'cancelled'
// }

// export enum TransportationType {
//   FLIGHT = 'flight',
//   TRAIN = 'train',
//   BUS = 'bus',
//   CAR = 'car',
//   FERRY = 'ferry',
//   TAXI = 'taxi',
//   OTHER = 'other'
// }

// export enum ItineraryVisibility {
//   PUBLIC = 'public',
//   PRIVATE = 'private',
//   FRIENDS = 'friends'
// }

// export enum PropertyType {
//   HOUSE = 'house',
//   APARTMENT = 'apartment',
//   VILLA = 'villa',
//   HOTEL = 'hotel',
//   CABIN = 'cabin',
//   HOSTEL = 'hostel',
//   OTHER = 'other'
// }

// export type PropertyAmenities = 
//   'wifi' | 
//   'pool' | 
//   'parking' | 
//   'ac' | 
//   'kitchen' | 
//   'washer' | 
//   'tv' | 
//   'gym' | 
//   'breakfast' | 
//   'workspace' | 
//   'heating' | 
//   'pets' |
//   'beach' |
//   'bbq';

// export type ItineraryDayWeather = 
//   'sunny' | 
//   'cloudy' | 
//   'rainy' | 
//   'stormy' | 
//   'snowy' | 
//   'windy' | 
//   'foggy' | 
//   'partly_cloudy';

// Common interfaces
export interface Image {
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

// Search parameter interfaces
export interface SearchParams {
  category?: 'Trip' | 'Travelling' | 'Property';
  city?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: unknown;
}

export interface TripSearchParams extends SearchParams {
  status?: TripType;
  minBudget?: number;
  maxBudget?: number;
  hasAccommodation?: boolean;
  hasTransportation?: boolean;
}

export interface TravellingSearchParams extends SearchParams {
  visibility?: ItineraryVisibility;
  tags?: string[];
}

export interface PropertySearchParams extends SearchParams {
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  amenities?: PropertyAmenities[];
  rooms?: number;
}