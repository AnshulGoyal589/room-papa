import { PropertyType } from '@/types/property';
import { ItemCategory } from './Components';
import { ObjectId } from 'mongodb';

export interface BaseDetails {
  id: string;
  title: string;
  locationFrom: string;
  locationTo: string;
  reservationPolicy?: string[];
  type: PropertyType;
  ownerId: string;
}


interface BaseGuestDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  arrivalTime?: string;
  travelingFor?: string;
  addOns?: {
    wantsAirportShuttle : boolean;
    wantsCarRental: boolean;
  };
  specialRequests?: string;
}

export interface PropertyRoomDetail {
    categoryId: string;
    title: string;
    qty: number;
    estimatedPricePerRoomNight: number;
    currency: string;
}

// export interface PropertyBooking {
//   _id?: ObjectId;
//   type: 'property';
//   propertyId?: ObjectId;
//   isReviewed?: boolean;
//   infoDetails: BaseDetails;
//   bookingDetails: BaseBookingCoreDetails & {
//       adults: number;
//       children: number;
//       totalGuests: number;
//       totalRoomsSelected: number;
//       selectedMealPlan: 'noMeal' | 'breakfastOnly' | 'allMeals';
//       pricePerNight: number;
//       numberOfNights: number;
//       subtotal: number;
//       serviceFee: number;
//       taxes: number;
//       roomsDetail: PropertyRoomDetail[];
//   };
//   userId: string;
//   status: 'pending' | 'confirmed' | 'cancelled';
//   guestDetails: BaseGuestDetails;
//   recipients: string[];
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface TravellingBooking {
//   _id?: ObjectId;
//   type: 'travelling';
//   propertyId?: ObjectId;
//   isReviewed?: boolean;
//   infoDetails: BaseDetails & {
//     transportType: 'flight' | 'train' | 'bus';
//   };
//   bookingDetails: BaseBookingCoreDetails & {
//     adults: number;
//     children: number;
//     totalGuests: number;
//     pricePerPerson?: number;
//     seatPreference?: string;
//     class?: string;
//   };
//   userId: string;
//   guestDetails: BaseGuestDetails;
//   recipients: string[];
//   status: 'pending' | 'confirmed' | 'cancelled';
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface TripBooking {
//   _id?: ObjectId;
//   type: 'trip';
//   propertyId?: ObjectId;
//   isReviewed?: boolean;
//   infoDetails: BaseDetails & {
//     itinerary: string[];
//   };
//   bookingDetails: BaseBookingCoreDetails & {
//     adults: number;
//     children: number;
//     totalGuests: number;
//     pricePerPerson?: number;
//     activities: string[];
//     guide?: boolean;
//   };
//   userId: string;
//   guestDetails: BaseGuestDetails;
//   recipients: string[];
//   status: 'pending' | 'confirmed' | 'cancelled';
//   createdAt: Date;
//   updatedAt: Date;
// }

// export type Booking = PropertyBooking | TravellingBooking | TripBooking;

export interface BookingDetails {
  _id?: ObjectId;
  type: ItemCategory;
  isReviewed?: boolean;
  infoDetails: BaseDetails;
  bookingDetails: {
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
    }
  };
  guestDetails: BaseGuestDetails;
  status?: 'pending' | 'confirmed' | 'cancelled';
  recipients: string[];
  userId?: string;
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