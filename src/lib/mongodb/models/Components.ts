import { UserRole } from "@/types";
import { Property } from "./Property";
import { Travelling } from "./Travelling";
import { Trip } from "./Trip";
import { ReactNode } from "react";
import { DisplayableRoomOffer, HikePricingByOccupancy } from "@/types/booking";

export interface Location{
    address: string;
    state: string;
    city: string;
    country: string;
}

export interface SeasonalCoasting {
  startDate: string;
  endDate: string;
  hikePricing: HikePricingByOccupancy;
}

export interface Costing {
    price: number;
    discountedPrice: number;
    currency: string;
}

export interface CurrencyCosting {
    price: number;
    currency: string;
}

export interface Image {
  url: string;
  publicId?: string;
  alt?: string;
}

export type ReviewCategory = 'Service' | 'Value' | 'Location' | 'Cleanliness' | 'Comfort' | 'Facilities';

export interface Review{
  comment: string;
  rating: number;
  category?: ReviewCategory[];
  name?: string;
  userId : string;
  date?: Date;
  country?: string;
};

export interface Period{
  startDate: string;
  endDate: string;
}


export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  keywords?: string[];
}

export type ItemCategory = 'property' | 'trip' | 'travelling';

export interface BaseItem {
  _id?: string;
  title: string;
  description: string;
  category: ItemCategory;
  bannerImage?: {
    url: string;
  };
  createdAt: Date;
}


export interface TripFormProps {
  tripData: Trip;
  setTripData: React.Dispatch<React.SetStateAction<Trip>>;
}

export interface TravellingFormProps {
  travellingData: Travelling;
  setTravellingData: React.Dispatch<React.SetStateAction<Travelling>>;
}

export interface PropertyFormProps {
  propertyData: ExtendedProperty;
  setPropertyData: React.Dispatch<React.SetStateAction<ExtendedProperty>>;
}


export type ExtendedProperty = Omit<Property, 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'>;

export interface ManagerDetails {
  _id?: string;
  clerkId: string;
  role: UserRole;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  name?: string;
  properties?: number;
  trips?: number;
  travellings?: number;
}

export interface RequestBody {
  clerkId: string;
  role: 'customer' | 'manager';
  email: string;
}

export interface RoleProtectionProps {
  children: ReactNode;
  loadingComponent?: ReactNode;
}

export interface ReservationData {
    propertyId: string;
    checkInDate: string;
    checkOutDate: string;
    selectedBookingModel: 'perUnit' | 'perOccupancy';
    days: number;
    adultCount: number;
    childCount: number;
    globalGuestCount: number;
    totalSelectedPhysicalRooms: number;
    selectedOffers: Record<string, number>;
    selectedMealPlan: string;
    displayableRoomOffers: DisplayableRoomOffer[];
    pricingDetails: {
        subtotalNights: number;
        serviceCharge: number;
        taxesApplied: number;
        totalBookingPricing: number;
        currency: string;
        totalBookingPricePerNight: number;
    };
}

export interface SearchFormProps {
  defaultCategory?: 'stays' | 'flights' | 'flight+hotel' | 'car-rentals' | 'attractions' | 'airport-taxis';
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface RecentSearchItem {
  id: string; // Unique ID, can be a composite of search params
  title: string;
  checkIn: string; // YYYY-MM-DD format
  checkOut: string; // YYYY-MM-DD format
  adults: number;
  children: number;
  rooms: number;
  pets: boolean;
  timestamp: number; // For sorting
}