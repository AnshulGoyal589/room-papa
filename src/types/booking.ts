import { Property } from "@/lib/mongodb/models/Property";
import { PricingByMealPlan } from "./property";

export interface HikePricingByOccupancy {
  singleOccupancyAdultHike: PricingByMealPlan;
  doubleOccupancyAdultHike: PricingByMealPlan;
  tripleOccupancyAdultHike: PricingByMealPlan;
  totalOccupancyHike?: Partial<PricingByMealPlan>;
}

export type ExtendedProperty = Omit<Property, 'categoryRooms' | 'costing' | 'rooms' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'>;

export interface DisplayableRoomOffer {
    offerId: string;
    categoryId: string;
    categoryTitle: string;
    bedConfiguration?: string;
    size?: string;
    roomSpecificAmenities?: string[];
    maxPhysicalRoomsForCategory: number; // category.qty

    // Offer-specific configuration
    intendedAdults: number; // e.g., 1 for single, 2 for double, 3 for triple pricing basis
    intendedChildren: number; // For this specific offer, usually 0 for base offers
    guestCapacityInOffer: number; // Max guests this specific offer type is for (e.g. 2 for a "2 adult" offer)

    // Pricing (for display, per night for this specific offer configuration)
    pricePerNight: number;
    originalPricePerNight?: number;
    isDiscounted: boolean;
    currency: string;
    categoryAvailabilityStartDate ?: string;
    roomSize: string;
    categoryAvailabilityEndDate?: string;
    categoryActivities?: string[];
    categoryFacilities?: string[];

    isPerUnitOffer?: boolean;

}