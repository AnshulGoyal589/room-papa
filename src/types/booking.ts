import { DiscountedPricingByMealPlan, PricingByMealPlan } from ".";
import { Property } from "@/lib/mongodb/models/Property";
import { Image } from "@/lib/mongodb/models/Components";

export interface RoomCategoryPricing {
  singleOccupancyAdultPrice: PricingByMealPlan;
  discountedSingleOccupancyAdultPrice?: DiscountedPricingByMealPlan;
  doubleOccupancyAdultPrice: PricingByMealPlan;
  discountedDoubleOccupancyAdultPrice?: DiscountedPricingByMealPlan;
  tripleOccupancyAdultPrice: PricingByMealPlan;
  discountedTripleOccupancyAdultPrice?: DiscountedPricingByMealPlan;
  child5to12Price: PricingByMealPlan;
  discountedChild5to12Price?: DiscountedPricingByMealPlan;
  // child12to18Price: PricingByMealPlan;
  // discountedChild12to18Price?: DiscountedPricingByMealPlan;
}

export interface StoredRoomCategory {
    id: string;
    _id?: string; // from your schema
    title: string;
    qty: number;
    currency: string;
    pricing: RoomCategoryPricing;
    unavailableDates: string[];
    // New fields for availability, activities, and facilities
    availabilityStartDate?: string;
    availabilityEndDate?: string;
    categoryActivities?: string[];
    categoryFacilities?: string[];
    categoryImages?: Image[];
    // Other fields from your schema
    size?: string;
    bedConfiguration?: string;
    maxOccupancy?: number;
    roomSpecificAmenities?: string[];
}

export type ExtendedProperty = Omit<Property, 'categoryRooms' | 'costing' | 'rooms' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'>;
// {
//     // _id?: ObjectId; 
//     type: PropertyType;
//     location: {
//         address: string;
//         state: string;
//         city: string;
//         country: string;
//     };
//     costing: { 
//         price: number; 
//         discountedPrice: number; 
//         currency: string;
//     };
//     rooms: number; 
//     categoryRooms: StoredRoomCategory[];
//     amenities: string[];
//     accessibility?: string[];
//     roomAccessibility?: string[];
//     popularFilters?: string[];
//     funThingsToDo?: string[];
//     meals?: string[];
//     facilities?: string[];
//     bedPreference?: string[];
//     reservationPolicy?: string[];
//     brands?: string[];
//     roomFacilities?: string[];
//     propertyRating?: number;
//     googleMaps?: string;

//     startDate?: string; 
//     endDate?: string;   
//     createdAt?: Date; 
//     updatedAt?: Date; 
//     userId?: string;
//     title?: string;
//     description?: string;
//     totalRating?: number;
//     review?: {
//         userId?: string;
//         userName?: string;
//         comment: string;
//         rating: number;
//         createdAt?: Date;
//     }[];
//     bannerImage?: Image;
//     detailImages?: Image[];
// }

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
    categoryAvailabilityEndDate?: string;
    categoryActivities?: string[];
    categoryFacilities?: string[];

}