export type PropertyType = 'hotel' | 'apartment' | 'villa' | 'hostel' | 'resort';
export type PropertyAmenities = 'wifi' | 'pool' | 'gym' | 'spa' | 'restaurant' | 'parking' | 'airConditioning' | 'breakfast';
export type ItineraryVisibility = 'private' | 'shared' | 'public';
export type ItineraryDayWeather = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'unknown';
export type TransportationType = 'flight' | 'train' | 'bus' | 'car' | 'ferry' | 'other';
export type TripStatus = 'planned' | 'booked' | 'ongoing' | 'completed' | 'cancelled';


export type UserRole = 'customer' | 'manager' | 'admin';

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

// types/index.ts
import { ObjectId } from 'mongodb';

// Enums
// export enum TripStatus {
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
  [key: string]: any;
}

export interface TripSearchParams extends SearchParams {
  status?: TripStatus;
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
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
}