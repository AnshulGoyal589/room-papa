import { PropertyType } from '@/types/property';
import { ItemCategory, Location } from './Components';
import { ObjectId } from 'mongodb';
import { Image } from '@/types';

export interface BookingInfoDetails {
  id: string;
  accessibility?: string[];
  amenities?: string[];
  bannerImage?: Image;
  bedPreference?: string[];
  brands?: string[];
  description?: string;
  detailImages?: Image[];
  facilities?: string[];
  funThingsToDo?: string[];
  googleMaps?: string;
  houseRules?: string[];
  location?: Location;
  propertyRating?: number;
  reservationPolicy?: string[];
  roomAccessibility?: string[];
  roomFacilities?: string[];
  title: string;
  totalRating?: number;
  type: PropertyType;
  userId: string;
}

export interface BookingDetails {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  totalGuests: number;
  rooms?: number;
  totalRoomsSelected: number;
  selectedMealPlan: 'noMeal' | 'breakfastOnly' | 'allMeals';
  roomsDetail: PropertyRoomDetail[];
  pricePerNight: number;
  numberOfNights: number;
  subtotal: number;
  serviceFee: number;
  taxes: number;
  currency: string;
  totalPrice: number;
  payment: {
    provider: string;
    orderId?: string;
    paymentId?: string;
    status?: 'pending' | 'succeeded' | 'failed';
  },
  specialRequests?: string;
}

export interface BookingGuestDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  countryCode: string;
  clerkId?: string;
  bookingFor?: 'self' | 'someoneElse';
  travellingFor?: string;
  gstDetails?: number;
  addOns?: {
    wantsAirportShuttle : boolean;
    wantsCarRental: boolean;
  };
  arrivalTime?: string;
  roomGuests?: {
    [roomId: string]: {
      guestName: string;
    };
  };
  userId: string;
}

export interface PropertyRoomDetail {
    categoryId: string;
    title: string;
    qty: number;
    estimatedPricePerRoomNight: number;
    currency: string;
}



export interface Booking {
  _id?: ObjectId;
  type: ItemCategory;
  isReviewed?: boolean;
  infoDetails: BookingInfoDetails;
  bookingDetails: BookingDetails;
  guestDetails: BookingGuestDetails;
  status?: 'pending' | 'confirmed' | 'cancelled';
  recipients: string[];
  createdAt?: Date;
  updatedAt?: Date;
}


export interface BookingQueryFilters {
  userId?: string;
  tripId?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'all';
  type?: 'property' | 'travelling' | 'trip' | 'all';
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}

export interface ManagerBookingQueryFilters {
  ownerId: string;
  type?: 'property' | 'travelling' | 'trip' | 'all';
  status?: 'pending' | 'confirmed' | 'cancelled' | 'all';
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}