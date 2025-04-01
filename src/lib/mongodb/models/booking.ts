// models/booking.ts
import { ObjectId } from 'mongodb';

// Common interfaces
interface BaseDetails {
  id: string;
  title: string;
  locationFrom: string;
  locationTo: string;
  ownerId : string,
  type: string;
}

interface BaseBookingDetails {
  checkIn: string;
  checkOut: string;
  guests: number;
  price: number;
  currency: string;
  totalPrice: number;
}

interface BaseGuestDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passengers: number;
  specialRequests: string;
}

// Specific booking types
export interface PropertyBooking {
  _id?: ObjectId;
  type: 'property';
  tripDetails: BaseDetails;
  bookingDetails: BaseBookingDetails & {
    propertyType: string;
    bedrooms: number;
  };
  ownerId : string;
  guestDetails: BaseGuestDetails;
  recipients: string[];
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface TravellingBooking {
  _id?: ObjectId;
  type: 'travelling';
  tripDetails: BaseDetails & {
    transportType: 'flight' | 'train' | 'bus';
  };
  bookingDetails: BaseBookingDetails & {
    seatPreference?: string;
    class?: string;
  };
  ownerId : string;
  guestDetails: BaseGuestDetails;
  recipients: string[];
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface TripBooking {
  _id?: ObjectId;
  type: 'trip';
  tripDetails: BaseDetails & {
    itinerary: string[];
  };
  bookingDetails: BaseBookingDetails & {
    activities: string[];
    guide?: boolean;
  };
  ownerId : string;
  guestDetails: BaseGuestDetails;
  recipients: string[];
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export type Booking = PropertyBooking | TravellingBooking | TripBooking;

// Input types for creating bookings
export type BookingInput = Omit<Booking, '_id' | 'status' | 'createdAt' | 'updatedAt'>;