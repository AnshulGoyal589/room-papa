// models/booking.ts
import { PropertyType } from '@/types/property';
import { ObjectId } from 'mongodb';

// --- Common Base Interfaces ---

// Details about the item being booked (Property, Flight, Trip etc.)
export interface BaseDetails {
  id: string;           // ID of the specific Property, Flight listing, Trip package etc.
  title: string;        // Title of the item
  locationFrom: string; // Starting point (can be 'NA' for properties)
  locationTo: string;   // Destination or Property address
  reservationPolicy?: string[]; // Reservation policy (e.g., 'flexible', 'strict')
  // ownerId removed from here, will be added to specific booking types if needed
  type: string;         // Sub-type (e.g., 'Hotel', 'Villa', 'Flight', 'Train', 'Package')
}

// Common details related to the booking timing, cost, and guests
// NOTE: Fields like price, guests are removed as they are too generic.
//       Specific types will add more detailed fields.
interface BaseBookingCoreDetails {
  checkIn: string;        // Start date/time of the booking (ISO format)
  checkOut: string;       // End date/time of the booking (ISO format)
  currency: string;       // Currency used for pricing
  totalPrice: number;   
  payment : {
    provider: string; // Payment provider (e.g., 'razorpay')
  }  // The final calculated total price for the entire booking
}

// Details about the primary guest making the booking
interface BaseGuestDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  arrivalTime?: string; // Optional: Time of arrival, if applicable
  travelingFor?: string; // Optional: Reason for travel, if applicable
  addOns?: {
    wantsAirportShuttle : boolean; // Optional: Whether the guest wants an airport shuttle
    wantsCarRental: boolean; // Optional: Whether the guest wants a car rental
  }; // Optional: Any additional services or add-ons selected
  // passengers removed, use adults/children in specific booking types
  specialRequests?: string; // Changed to optional based on frontend form
}

// --- Specific Booking Type Definitions ---

// Interface for the details of each selected room category in a property booking
export interface PropertyRoomDetail {
    categoryId: string;         // The unique ID (e.g., 'deluxe-room-123') of the StoredRoomCategory
    title: string;              // Title of the room category (e.g., "Deluxe Room")
    qty: number;                // How many rooms of this specific category were booked
    estimatedPricePerRoomNight: number; // Optional: Price per night for *this specific room type* at time of booking (for reference)
    currency: string;           // Currency for this room's price
}

// Property Booking Specific Structure
export interface PropertyBooking {
  _id?: ObjectId;
  type: 'property';
  propertyId?: ObjectId;
  isReviewed?: boolean;
  tripDetails: BaseDetails & {
      ownerId: string;
  };
  bookingDetails: BaseBookingCoreDetails & { // Extends the core timing/total price info
      adults: number;           // Number of adults
      children: number;         // Number of children
      totalGuests: number;      // Total guests (adults + children)
      totalRoomsSelected: number; // Total number of physical rooms booked across all categories
      selectedMealPlan: 'noMeal' | 'breakfastOnly' | 'allMeals'; // The chosen meal plan
      pricePerNight: number;    // The *calculated* average price per night based on selection
      numberOfNights: number;   // Duration of the stay
      subtotal: number;         // Calculated pricePerNight * numberOfNights
      serviceFee: number;       // Applied service fee
      taxes: number;            // Applied taxes
      roomsDetail: PropertyRoomDetail[]; // Array detailing each room category booked
  };
  // ownerId of the *user who made the booking* (can be different from property owner)
  // Keep this top-level if it represents the booking user ID.
  // If it's meant to be the property owner ID, it should only be in tripDetails.
  // Let's assume this top-level one is the **booking user's ID**.
  userId: string; // Renamed from ownerId for clarity if it's the booking user
  guestDetails: BaseGuestDetails; // Primary guest contact info
  recipients: string[];           // Email recipients for confirmation
  status: 'pending' | 'confirmed' | 'cancelled'; // Booking status
  createdAt: Date;
  updatedAt: Date;
}

// --- Travelling Booking (Unchanged) ---
export interface TravellingBooking {
  _id?: ObjectId;
  type: 'travelling';
  propertyId?: ObjectId;
  isReviewed?: boolean;
  tripDetails: BaseDetails & {
    transportType: 'flight' | 'train' | 'bus';
    ownerId: string; // ID of the transport listing owner/provider
  };
  // Using BaseBookingCoreDetails + specifics
  bookingDetails: BaseBookingCoreDetails & {
    adults: number; // Explicit guest count
    children: number;
    totalGuests: number;
    pricePerPerson?: number; // More relevant for travel
    seatPreference?: string;
    class?: string;
  };
  userId: string; // User who booked
  guestDetails: BaseGuestDetails;
  recipients: string[];
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// --- Trip Booking (Unchanged) ---
export interface TripBooking {
  _id?: ObjectId;
  type: 'trip';
  propertyId?: ObjectId;
  isReviewed?: boolean;
  tripDetails: BaseDetails & {
    itinerary: string[];
    ownerId: string; // ID of the trip package owner/provider
  };
  // Using BaseBookingCoreDetails + specifics
  bookingDetails: BaseBookingCoreDetails & {
    adults: number; // Explicit guest count
    children: number;
    totalGuests: number;
    pricePerPerson?: number; // More relevant for trips
    activities: string[];
    guide?: boolean;
  };
  userId: string; // User who booked
  guestDetails: BaseGuestDetails;
  recipients: string[];
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Union Type for all possible booking structures
export type Booking = PropertyBooking | TravellingBooking | TripBooking;

// --- Input Type Definition (Crucial for API Endpoint) ---
// This defines the shape of the data expected by your POST /api/bookings endpoint

// Define the expected structure for roomsDetail in the input
interface BookingInputRoomDetail {
    categoryId: string;
    title: string;
    qty: number;
    estimatedPricePerRoomNight: number;
    currency: string;
}

export interface PropertyBookingInputData {
    type: 'property';
    details: {                 // Matches frontend 'details' object
        id: string;            // Property ID
        title: string;
        ownerId: string;       // Property Owner ID
        locationFrom: string;  // Should be 'NA' or similar from frontend
        locationTo: string;    // Property Address
        type: PropertyType;    // e.g., 'Hotel', 'Villa'
        reservationPolicy: string[]; // Added reservation policy
    };
    bookingDetails: {          // Matches frontend 'bookingDetails' object
        checkIn: string;       // ISO Date string
        checkOut: string;      // ISO Date string
        adults: number;
        children: number;
        totalGuests: number;
        totalRoomsSelected: number;
        selectedMealPlan: 'noMeal' | 'breakfastOnly' | 'allMeals';
        roomsDetail: BookingInputRoomDetail[]; // Array of selected rooms
        calculatedPricePerNight: number; // Renamed for clarity matching frontend
        currency: string;
        numberOfNights: number;
        subtotal: number;
        serviceFee: number;
        taxes: number;
        totalPrice: number;     // Final total price
    };
    guestDetails: {            // Matches frontend 'guestDetails' object
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        specialRequests?: string; // Optional
        // 'passengers' is not needed here if adults/children are provided
    };
    recipients: string[];      // Email recipients
    userId : string;
}

// Define input types for other bookings if needed (keeping them simple here)
export interface TravellingBookingInputData { type: 'travelling'; /* ... other fields */ }
export interface TripBookingInputData { type: 'trip'; /* ... other fields */ }

// This is the type your API endpoint should expect for the request body
export type BookingInputData = PropertyBookingInputData | TravellingBookingInputData | TripBookingInputData;


// --- Deprecated/Original Input Type (Can likely be removed if using BookingInputData) ---

export interface BookingDetails {
  type: 'property' | 'travelling' | 'trip';
  tripDetails: {
    id: string;
    title: string;
    locationFrom?: string; // Optional for property bookings
    locationTo: string;
    type: string; // Subtype like 'Hotel'
    ownerId: string; // Added ownerId
  };
  bookingDetails: { // This needs significant updates to match frontend payload
    checkIn: string;
    checkOut: string;
    // guests: number; // Replaced by adults/children
    adults: number; // ADDED
    children: number; // ADDED
    totalGuests: number; // ADDED
    rooms?: number; // Replaced by totalRoomsSelected and roomsDetail
    totalRoomsSelected: number; // ADDED
    selectedMealPlan: 'noMeal' | 'breakfastOnly' | 'allMeals'; // ADDED
    roomsDetail: PropertyRoomDetail[]; // ADDED
    // price: number; // Replaced by detailed pricing
    pricePerNight: number; // ADDED
    numberOfNights: number; // ADDED
    subtotal: number; // ADDED
    serviceFee: number; // ADDED
    taxes: number; // ADDED
    currency: string;
    totalPrice: number;
  };
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    // passengers: number; // Removed
    specialRequests?: string;
  };
  recipients: string[];
}
