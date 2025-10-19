import { propertyAmenitiesArray } from "@/types/property";

export const categoryOptions = {
    accessibility: ['Wheelchair Accessible', 'Elevator', 'Accessible Parking', 'Braille Signage', 'Accessible Bathroom', 'Roll-in Shower'],
    roomAccessibility: ['Grab Bars', 'Lowered Amenities', 'Visual Alarms', 'Wide Doorways', 'Accessible Shower'],
    popularFilters: ['Pet Friendly', 'Free Cancellation', 'Free Breakfast', 'Pool', 'Hot Tub', 'Ocean View', 'Family Friendly', 'Business Facilities'],
    funThingsToDo: ['Beach', 'Hiking', 'Shopping', 'Nightlife', 'Local Tours', 'Museums', 'Theme Parks', 'Water Sports'],
    meals: ['Breakfast', 'Lunch', 'Dinner', 'All-Inclusive', 'Buffet', 'À la carte', 'Room Service', 'Special Diets'],
    facilities: propertyAmenitiesArray,
    bedPreference: ['King', 'Queen', 'Twin', 'Double', 'Single', 'Sofa Bed', 'Bunk Bed'],
    reservationPolicy: ['Free Cancellation', 'Flexible', 'Moderate', 'Strict', 'Non-Refundable', 'Pay at Property', 'Pay Now'],
    brands: ['Hilton', 'Marriott', 'Hyatt', 'Best Western', 'Accor', 'IHG', 'Wyndham', 'Choice Hotels'],
    roomFacilities: ['Air Conditioning', 'TV', 'Mini Bar', 'Coffee Maker', 'Safe', 'Desk', 'Balcony', 'Bathtub', 'Shower']
  };


  export const tripOptions = {
    accessibility: ['Wheelchair Accessible', 'Stroller Friendly', 'Elevator Access', 'Senior Friendly'],
    amenities: ['Wi-Fi Included', 'Tour Guide', 'Transportation', 'Travel Insurance', 'Entry Tickets'],
    brands: ['MakeMyTrip', 'Goibibo', 'Trafalgar', 'Contiki', 'Viator', 'GetYourGuide'],
    facilities: ['First-Aid Kit', 'Restroom on Vehicle', 'Snacks Provided', 'Water Bottle'],
    funThingsToDo: ['Sightseeing', 'Hiking', 'Boating', 'Shopping', 'Museums', 'Adventure Sports', 'Cultural Shows'],
    meals: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Vegetarian Option', 'Vegan Option', 'Jain Meal'],
    popularFilters: ['Family Friendly', 'Solo Traveler', 'Couples', 'Budget Friendly', 'Luxury Trip', 'Adventure'],
    reservationPolicy: ['Free Cancellation', 'Instant Confirmation', 'Book Now, Pay Later', 'Non-refundable'],
  };
  
  export const propertyTypes = [
    'Hotel',
    'Apartment',
    'Villa',
    'Hostel',
    'Resort',
    'Cottage',
    'Homestay'
  ] as const;

  export const singleAndMultipleOccupancyPropertyTypes = [
    'Cottage',
    'Villa'
  ] as const;

  export const singleOccupancyPropertyTypes = [
    'Homestay'
  ] as const;
