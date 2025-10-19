import { SearchParams } from ".";

export const propertyAmenitiesArray = [
    'wifi', 'pool', 'gym', 'spa', 'restaurant', 'parking', 'airConditioning', 'breakfast', 'petFriendly', 'roomService', 'laundryService', 'conferenceRoom', 'barLounge', 'familyRooms', 'nonSmokingRooms', 'airportShuttle', 'bar', 'fitnessCenter', 'breakfastIncluded', 'laundry', 'kitchen', 'tv', 'heating', 'workspace', 'pets', 'beach', 'bbq'
] as const;

export type PropertyAmenities = typeof propertyAmenitiesArray[number];

export type FacilityCategory = 'Most Popular' | 'Food & Drink' | 'General' | 'Services' | 'Bathroom' | 'Bedroom' | 'Media & Technology' | 'Internet' | 'Parking' | 'Pool & Spa' | 'Activities' | 'Business' | 'Accessibility' | 'Languages';


export interface FacilityDetail {
  id: PropertyAmenities;
  displayName: string;
  category: FacilityCategory;
  isTopFeature?: boolean;
  isPopular?: boolean;
}

export const allPropertyFacilities: FacilityDetail[] = [
    { id: 'wifi', displayName: 'WiFi', category: 'Internet', isTopFeature: true, isPopular: true },
    { id: 'pool', displayName: 'Swimming Pool', category: 'Pool & Spa', isPopular: true },
    { id: 'gym', displayName: 'Fitness Center', category: 'Activities', isPopular: true },
    { id: 'spa', displayName: 'Spa', category: 'Pool & Spa' },
    { id: 'restaurant', displayName: 'Restaurant', category: 'Food & Drink', isPopular: true },
    { id: 'parking', displayName: 'Parking', category: 'Parking', isTopFeature: true },
    { id: 'airConditioning', displayName: 'Air conditioning', category: 'General', isTopFeature: true, isPopular: true },
    { id: 'breakfast', displayName: 'Breakfast', category: 'Food & Drink', isPopular: true },
    { id: 'petFriendly', displayName: 'Pet friendly', category: 'General' },
    { id: 'roomService', displayName: 'Room service', category: 'Services', isTopFeature: true, isPopular: true },
    { id: 'laundryService', displayName: 'Laundry service', category: 'Services' },
    { id: 'conferenceRoom', displayName: 'Conference Room', category: 'Business' },
    { id: 'barLounge', displayName: 'Bar/Lounge', category: 'Food & Drink', isPopular: true },
    { id: 'familyRooms', displayName: 'Family rooms', category: 'General', isTopFeature: true },
    { id: 'nonSmokingRooms', displayName: 'Non-smoking rooms', category: 'General', isTopFeature: true },
    { id: 'airportShuttle', displayName: 'Airport shuttle', category: 'Services', isTopFeature: true },
    { id: 'bar', displayName: 'Bar', category: 'Food & Drink' },
    { id: 'fitnessCenter', displayName: 'Fitness Center', category: 'Activities' },
    { id: 'breakfastIncluded', displayName: 'Breakfast included', category: 'Food & Drink', isPopular: true },
    { id: 'laundry', displayName: 'Laundry', category: 'Services' },
    { id: 'kitchen', displayName: 'Kitchen', category: 'General' },
    { id: 'tv', displayName: 'TV', category: 'Media & Technology' },
    { id: 'heating', displayName: 'Heating', category: 'General' },
    { id: 'workspace', displayName: 'Workspace', category: 'Business' },
    { id: 'pets', displayName: 'Pets allowed', category: 'General' },
    { id: 'beach', displayName: 'Beach access', category: 'Activities' },
    { id: 'bbq', displayName: 'BBQ facilities', category: 'Food & Drink' },
];



export type PropertyType = 'hotel' | 'apartment' | 'villa' | 'hostel' | 'resort' | 'cottage' | 'homestay';


export interface PropertySearchParams extends SearchParams {
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  amenities?: PropertyAmenities[];
  rooms?: number;
}

export interface RoomCategoryPricing {
  singleOccupancyAdultPrice: PricingByMealPlan;
  discountedSingleOccupancyAdultPrice: DiscountedPricingByMealPlan;
  doubleOccupancyAdultPrice: PricingByMealPlan;
  discountedDoubleOccupancyAdultPrice: DiscountedPricingByMealPlan;
  tripleOccupancyAdultPrice: PricingByMealPlan;
  discountedTripleOccupancyAdultPrice: DiscountedPricingByMealPlan;
  child5to12Price: PricingByMealPlan;
  discountedChild5to12Price: DiscountedPricingByMealPlan;
}

export interface DiscountedPricingByMealPlan {
  noMeal: number;       
  breakfastOnly: number;
  allMeals: number;
}

export interface PricingByMealPlan {
  noMeal: number;
  breakfastOnly: number;
  allMeals: number;
}

export interface HouseRules {
  checkInTime?: string;  
  checkOutTime?: string; 
  smokingAllowed?: boolean; 
  petsAllowed?: boolean;   
  partiesAllowed?: boolean; 
  additionalRules?: string[];
}