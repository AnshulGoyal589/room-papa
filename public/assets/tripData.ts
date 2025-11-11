export const tripTypes = ['Domestic', 'International'] as const;

// Options for multi-select dropdowns in the Trip form
export const tripCategoryOptions = {
  activities: ['Hiking', 'Sightseeing', 'Cultural Tours', 'Adventure Sports', 'Beach Relaxation', 'Wildlife Safari'],
  amenities: ['Tour Guide', 'Private Vehicle', 'Daily Breakfast', 'Airport Transfers', 'Travel Insurance'],
  accessibility: ['Wheelchair Accessible Vehicles', 'Accessible Accommodations', 'Sign Language Guide'],
  brands: ['Luxury Escapes', 'Adventure Seekers', 'Budget Travelers'],
  facilities: ['24/7 Support', 'Visa Assistance', 'Forex Services'],
  funThingsToDo: ['Local Shopping', 'Cooking Classes', 'Wine Tasting', 'Hot Air Ballooning'],
  meals: ['Breakfast Included', 'Half Board (B+D)', 'Full Board (B+L+D)', 'All-Inclusive'],
  popularFilters: ['Family Friendly', 'Solo Traveler', 'Honeymoon', 'Group Tour'],
  reservationPolicy: ['Free Cancellation', 'Book Now, Pay Later', 'Non-Refundable'],
};