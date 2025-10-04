// 'use client';

// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import {
//     PricingByMealPlan,
//     DiscountedPricingByMealPlan
// } from '@/types';
// import {
//     Coffee as CoffeeIconLucide, CheckCircle, Users as UsersIcon, CalendarOff,
//     AlertTriangle, Bed,
//     Utensils,
//     UserCheck,
//     Sparkles,
//     Wrench,
//     X,
//     AlertCircleIcon,
//     XCircle,
//     HelpCircle,
// } from 'lucide-react';
// import Image from 'next/image';
// import { CldImage } from 'next-cloudinary'; 
// import { useRouter, useParams } from 'next/navigation';
// import { useUser, useClerk, SignedOut } from '@clerk/nextjs';
// import { Property } from '@/lib/mongodb/models/Property';
// import { DisplayableRoomOffer, HikePricingByOccupancy, StoredRoomCategory } from '@/types/booking';
// import { Image as PropertyImage } from '@/lib/mongodb/models/Components';
// import { GuestReviews } from './Reviews';
// import { HotelFacilities } from './HotelFacilities';
// import PropertyHeader from './PropertyHeader';
// import ImageGalleryAndMap from './ImageGalleryAndMap';
// import AboutProperty from './AboutProperty';

// const LOCAL_STORAGE_KEY = 'propertyBookingPreferences_v3';
// const RESERVATION_DATA_KEY = 'reservationData_v1';
// const MAX_COMBINED_ROOMS = 5;
// const MAX_OCCUPANTS_PER_ROOM = 3;
// const SERVICE_FEE_FIXED = 10;
// const TAX_RATE_PERCENTAGE = 0.05;

// interface ImageGalleryModalProps {
//   title: string;
//   images: PropertyImage[];
//   onClose: () => void;
// }

// const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({ title, images, onClose }) => {
//   const [activeImage, setActiveImage] = useState<PropertyImage | null>(images?.[0] || null);

//   useEffect(() => {
//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (event.key === 'Escape') {
//         onClose();
//       }
//     };
//     window.addEventListener('keydown', handleKeyDown);
//     return () => {
//       window.removeEventListener('keydown', handleKeyDown);
//     };
//   }, [onClose]);

//   if (!images || images.length === 0) {
//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
//             <div className="bg-white rounded-lg p-6 text-center" onClick={(e) => e.stopPropagation()}>
//                 <h3 className="text-xl font-semibold mb-2">{title}</h3>
//                 <p>No images available for this room category.</p>
//                 <button onClick={onClose} className="mt-4 px-4 py-2 bg-[#003c95] text-white rounded">Close</button>
//             </div>
//         </div>
//     );
//   }

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4" onClick={onClose}>
//       <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative" onClick={(e) => e.stopPropagation()}>
//         <div className="p-4 border-b flex justify-between items-center">
//           <h2 className="text-xl font-bold text-gray-800">{title} - Photo Gallery</h2>
//           <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors">
//             <X size={24} />
//           </button>
//         </div>

//         <div className="flex-grow p-4 overflow-y-auto">
//           {activeImage && (
//             <div className="relative w-full aspect-[16/10] mb-4 rounded-md overflow-hidden bg-gray-200">
//               <CldImage
//                 src={activeImage.publicId || activeImage.url}
//                 alt={activeImage.alt || `Image of ${title}`}
//                 layout="fill"
//                 objectFit="contain"
//                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                 onError={(e: any) => e.currentTarget.src = '/images/placeholder-property.png'}
//               />
//             </div>
//           )}
//           <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
//             {images.map((image, index) => (
//               <div
//                 key={image.publicId || index}
//                 className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${activeImage?.url === image.url ? 'border-[#003c95]' : 'border-transparent hover:border-[#003c95]'}`}
//                 onClick={() => setActiveImage(image)}
//               >
//                 <CldImage
//                   src={image.publicId || image.url}
//                   alt={image.alt || `Thumbnail ${index + 1}`}
//                   layout="fill"
//                   objectFit="cover"
//                   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                   onError={(e: any) => e.currentTarget.src = '/images/placeholder-property.png'}
//                 />
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const calculateDays = (start: Date | null, end: Date | null): number => {
//     if (!start || !end || end <= start) {
//         return 0;
//     }
//     const startMidnight = new Date(start); startMidnight.setHours(0, 0, 0, 0);
//     const endMidnight = new Date(end); endMidnight.setHours(0, 0, 0, 0);
//     const diffTime = Math.abs(endMidnight.getTime() - startMidnight.getTime());
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     return diffDays;
// };

// const getDatesInRange = (startDate: Date, endDate: Date): string[] => {
//     const dates: string[] = [];
//     const currentDate = new Date(startDate);
//     while (currentDate < endDate) {
//         dates.push(currentDate.toISOString().split('T')[0]);
//         currentDate.setDate(currentDate.getDate() + 1);
//     }
//     return dates;
// };

// const getPrice = (
//     priceGroup: PricingByMealPlan | DiscountedPricingByMealPlan | undefined,
//     mealPlan: keyof PricingByMealPlan
// ): number => {
//     if (priceGroup && typeof priceGroup === 'object' && mealPlan in priceGroup) {
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       const price = (priceGroup as any)[mealPlan];
//       return typeof price === 'number' ? price : 0;
//     }
//     return 0;
// };


// export default function PropertyDetailPage( { property }: { property: Property | null } ) {
//     const { openSignIn } = useClerk();
//     const router = useRouter();
//     const params = useParams();
//     const { isSignedIn, isLoaded } = useUser();

//     const [checkInDate, setCheckInDate] = useState<Date | null>(null);
//     const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);

//     const [adultCount, setAdultCount] = useState<number>(1);
//     const [childCount, setChildCount] = useState<number>(0);

//     const [selectedOffers, setSelectedOffers] = useState<Record<string, number>>({});
//     const [selectedMealPlan, setSelectedMealPlan] = useState<keyof PricingByMealPlan>('breakfastOnly');

//     const [totalSelectedPhysicalRooms, setTotalSelectedPhysicalRooms] = useState<number>(0);
//     const [totalBookingPricePerNight, setTotalBookingPricePerNight] = useState<number>(0);
//     const [subtotalNights, setSubtotalNights] = useState<number>(0);
//     const [serviceCharge, setServiceCharge] = useState<number>(0);
//     const [taxesApplied, setTaxesApplied] = useState<number>(0);
//     const [totalBookingPricing, setTotalBookingPricing] = useState<number>(0);
//     const [availabilityError, setAvailabilityError] = useState<string | null>(null);
//     const [bookingError, setBookingError] = useState<string | null>(null);

//     const [showReservePopover, setShowReservePopover] = useState(false);

//     const [modalData, setModalData] = useState<{ title: string; images: PropertyImage[] } | null>(null);


//     const globalGuestCount = useMemo(() => adultCount + childCount, [adultCount, childCount]);
//     const days = useMemo(() => calculateDays(checkInDate, checkOutDate), [checkInDate, checkOutDate]);

//     const handleCategoryTitleClick = (category: StoredRoomCategory) => {
//         setModalData({
//             title: category.title,
//             images: category.categoryImages || []
//         });
//     };
//     const handleCloseModal = () => {
//         setModalData(null);
//     };

//     const validateDate = (selectedDateStr: string, propertyStartDateStr?: string, propertyEndDateStr?: string): Date => {
//         const date = new Date(selectedDateStr); date.setHours(12, 0, 0, 0);
//         const minDate = new Date(propertyStartDateStr || Date.now()); minDate.setHours(0, 0, 0, 0);
//         const maxDate = propertyEndDateStr ? new Date(propertyEndDateStr) : new Date(Date.now() + 365 * 2 * 86400000); // Extended default max date
//         maxDate.setHours(23, 59, 59, 999);

//         if (date < minDate) return minDate;
//         if (date > maxDate) return maxDate;
//         return date;
//     };

//      const checkAvailabilityForSelection = useCallback((
//         startDate: Date | null,
//         endDate: Date | null,
//         currentSelectedOffers: Record<string, number>,
//         allCategories: StoredRoomCategory[] | undefined
//     ): { available: boolean; message: string | null } => {
//         if (!startDate || !endDate || endDate <= startDate || !allCategories || Object.keys(currentSelectedOffers).length === 0) {
//             return { available: true, message: null };
//         }

//         const dateRange = getDatesInRange(startDate, endDate);
//         if (dateRange.length === 0) return { available: true, message: null };

//         const involvedCategoryIds = new Set<string>();
//         Object.keys(currentSelectedOffers).forEach(offerId => {
//             if (currentSelectedOffers[offerId] > 0) {
//                 involvedCategoryIds.add(offerId.split('_')[0]);
//             }
//         });

//         for (const catId of Array.from(involvedCategoryIds)) {
//             const category = allCategories.find(c => c.id === catId || c._id === catId);
//             if (category) {
                
//                 // if (category.availabilityStartDate && new Date(startDate) < new Date(category.availabilityStartDate)) {
//                 //      return { available: false, message: `Room type "${category.title}" is not available before ${new Date(category.availabilityStartDate).toLocaleDateString()}.` };
//                 // }
//                 // if (category.availabilityEndDate && new Date(endDate) > new Date(new Date(category.availabilityEndDate).getTime() + 86400000)) { // Add one day to include the end date itself
//                 //      return { available: false, message: `Room type "${category.title}" is not available after ${new Date(category.availabilityEndDate).toLocaleDateString()}.` };
//                 // }
//                 if (category.availability && category.availability.length > 0) {
//                     const bookingStart = new Date(startDate); bookingStart.setHours(0, 0, 0, 0);
//                     const bookingEnd = new Date(endDate); bookingEnd.setHours(0, 0, 0, 0);

//                     const isAvailableInAnyPeriod = category.availability.some(period => {
//                         const periodStart = new Date(period.startDate); periodStart.setHours(0, 0, 0, 0);
//                         const periodEnd = new Date(period.endDate); periodEnd.setHours(0, 0, 0, 0);
                        
//                         // Add one day to periodEnd to make the range comparison inclusive of the last day
//                         const periodEndExclusive = new Date(periodEnd.getTime() + 86400000); 

//                         return bookingStart >= periodStart && bookingEnd <= periodEndExclusive;
//                     });

//                     if (!isAvailableInAnyPeriod) {
//                         return { available: false, message: `Room type "${category.title}" is not available for the selected dates. Please check its seasonal availability.` };
//                     }
//                 }
//                 if (category.unavailableDates && category.unavailableDates.length > 0) {
//                     for (const dateStr of dateRange) {
//                         if (category.unavailableDates.includes(dateStr)) {
//                             return {
//                                 available: false,
//                                 message: `Room type "${category.title}" is unavailable on ${new Date(dateStr + 'T00:00:00').toLocaleDateString()}. Please adjust dates or room selection.`
//                             };
//                         }
//                     }
//                 }
//             }
//         }
//         return { available: true, message: null };
//     }, []);

//     const getCheckInDateFromLocalStorage = () => {
//         if (typeof window === 'undefined') return null;
//         const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY);
//         const parsedValue = storedValue ? JSON.parse(storedValue) : null;
//         const checkInDate = localStorage.getItem('checkIn') || parsedValue?.checkInDate;
//         const date =  new Date(checkInDate);
//         if (date && !isNaN(date.getTime())) {
//             const year = date.getFullYear();
//             const month = date.getMonth() + 1;
//             const day = date.getDate();
//             const monthFormatted = month < 10 ? `0${month}` : month.toString();
//             const dayFormatted = day < 10 ? `0${day}` : day.toString();
//             return `${year}-${monthFormatted}-${dayFormatted}`;
//         }
//         return null;
//     };

//     const getCheckOutDateFromLocalStorage = () => {
//         if (typeof window === 'undefined') return null;
//         const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY);
//         const parsedValue = storedValue ? JSON.parse(storedValue) : null;
//         const checkOutDate = localStorage.getItem('checkOut') || parsedValue?.checkOutDate;
//         const date = new Date(checkOutDate);
//         if (date && !isNaN(date.getTime())) {
//             const year = date.getFullYear();
//             const month = date.getMonth() + 1;
//             const day = date.getDate();
//             const monthFormatted = month < 10 ? `0${month}` : month.toString();
//             const dayFormatted = day < 10 ? `0${day}` : day.toString();
//             return `${year}-${monthFormatted}-${dayFormatted}`;
//         }
//         return null;
//     };

//     useEffect(() => {
//         if (property && typeof window !== 'undefined') {
//             const storedPreferences = localStorage.getItem(LOCAL_STORAGE_KEY);
//             const localCheckIn = getCheckInDateFromLocalStorage();
//             const localCheckOut = getCheckOutDateFromLocalStorage();
//             const localAdultsString = localStorage.getItem('adults');
//             const localChildrenString = localStorage.getItem('children');

//             if (storedPreferences) {
//                 try {
//                     const parsedPrefs = JSON.parse(storedPreferences);

//                     if (localCheckIn) parsedPrefs.checkInDate = localCheckIn;
//                     if (localCheckOut) parsedPrefs.checkOutDate = localCheckOut;
//                     if (localAdultsString) parsedPrefs.adultCount = parseInt(localAdultsString, 10);
//                     if (localChildrenString) parsedPrefs.childCount = parseInt(localChildrenString, 10);

//                     if (parsedPrefs.propertyId === property._id?.toString()) {
//                         let tempCheckInDate: Date | null = null;
//                         if (parsedPrefs.checkInDate) {
//                             tempCheckInDate = validateDate(new Date(parsedPrefs.checkInDate).toISOString().split('T')[0], property.startDate, property.endDate);
//                         }

//                         let tempCheckOutDate: Date | null = null;
//                         if (parsedPrefs.checkOutDate) {
//                             const minValCO = tempCheckInDate ? new Date(tempCheckInDate.getTime() + 86400000).toISOString().split('T')[0] : property.startDate;
//                             let validatedCO = validateDate(new Date(parsedPrefs.checkOutDate).toISOString().split('T')[0], minValCO, property.endDate);
//                             if (tempCheckInDate && validatedCO <= tempCheckInDate) {
//                                 const nextDay = new Date(tempCheckInDate); nextDay.setDate(tempCheckInDate.getDate() + 1);
//                                 validatedCO = (nextDay <= new Date(property.endDate || Date.now())) ? nextDay : new Date(property.endDate || Date.now());
//                             }
//                             tempCheckOutDate = validatedCO;
//                         }

//                         let tempSelectedOffers: Record<string, number> = {};
//                         if (typeof parsedPrefs.selectedOffers === 'object' && parsedPrefs.selectedOffers !== null && property.categoryRooms) {
//                              tempSelectedOffers = parsedPrefs.selectedOffers;
//                         }

//                         setCheckInDate(tempCheckInDate);
//                         setCheckOutDate(tempCheckOutDate);

//                         if (typeof parsedPrefs.adultCount === 'number' && parsedPrefs.adultCount >= 1) setAdultCount(parsedPrefs.adultCount); else if (localAdultsString === null) setAdultCount(1);
//                         if (typeof parsedPrefs.childCount === 'number' && parsedPrefs.childCount >= 0) setChildCount(parsedPrefs.childCount); else if (localChildrenString === null) setChildCount(0);

//                         setSelectedOffers(tempSelectedOffers);
//                         if (parsedPrefs.selectedMealPlan && ['noMeal', 'breakfastOnly', 'allMeals'].includes(parsedPrefs.selectedMealPlan)) {
//                             setSelectedMealPlan(parsedPrefs.selectedMealPlan);
//                         } else { setSelectedMealPlan('breakfastOnly'); }

//                         const { available, message } = checkAvailabilityForSelection( tempCheckInDate, tempCheckOutDate, tempSelectedOffers, property.categoryRooms );
//                          if (!available) {
//                              setAvailabilityError(message);
//                          } else {
//                              setAvailabilityError(null);
//                          }
//                     } else {
//                          localStorage.removeItem(LOCAL_STORAGE_KEY);
//                          applyQueryParamData(property, localCheckIn, localCheckOut, localAdultsString, localChildrenString);
//                     }
//                 } catch (e) {
//                     console.error("Failed to parse booking preferences", e);
//                     localStorage.removeItem(LOCAL_STORAGE_KEY);
//                     applyQueryParamData(property, localCheckIn, localCheckOut, localAdultsString, localChildrenString);
//                 }
//             } else if (property) {
//                  applyQueryParamData(property, localCheckIn, localCheckOut, localAdultsString, localChildrenString);
//             }
//         }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [property, params?.id]);

//     const applyQueryParamData = (
//         prop: Property,
//         localCheckInStr: string | null,
//         localCheckOutStr: string | null,
//         localAdultsStr: string | null,
//         localChildrenStr: string | null
//     ) => {
//         let qCheckIn: Date | null = null;
//         let qCheckOut: Date | null = null;
//         let qAdults = 1;
//         let qChildren = 0;

//         if (localCheckInStr) qCheckIn = validateDate(localCheckInStr, prop.startDate || '', prop.endDate || '');
//         if (localCheckOutStr) {
//             const minCO = qCheckIn ? new Date(qCheckIn.getTime() + 86400000).toISOString().split('T')[0] : prop.startDate;
//             qCheckOut = validateDate(localCheckOutStr, minCO, prop.endDate);
//             if (qCheckIn && qCheckOut && qCheckOut <= qCheckIn) {
//                 const nextDay = new Date(qCheckIn); nextDay.setDate(qCheckIn.getDate() + 1);
//                 qCheckOut = (nextDay <= new Date(prop.endDate || Date.now())) ? nextDay : new Date(prop.endDate || Date.now());
//             }
//         }
//         if (localAdultsStr) qAdults = Math.max(1, parseInt(localAdultsStr, 10));
//         if (localChildrenStr) qChildren = Math.max(0, parseInt(localChildrenStr, 10));

//         setCheckInDate(qCheckIn);
//         setCheckOutDate(qCheckOut);
//         setAdultCount(qAdults);
//         setChildCount(qChildren);
//         setSelectedOffers({});
//         setSelectedMealPlan('breakfastOnly');
//     };

//     useEffect(() => {
//         if (property && typeof window !== 'undefined') {
//             const preferencesToSave = {
//                 propertyId: property._id?.toString(),
//                 checkInDate: checkInDate ? checkInDate.toISOString() : null,
//                 checkOutDate: checkOutDate ? checkOutDate.toISOString() : null,
//                 adultCount,
//                 childCount,
//                 selectedOffers,
//                 selectedMealPlan,
//             };
//             localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferencesToSave));
//         }
//     }, [checkInDate, checkOutDate, adultCount, childCount, selectedOffers, selectedMealPlan, property]);

//     const displayableRoomOffers = useMemo((): DisplayableRoomOffer[] => {
//         if (!property?.categoryRooms || !checkInDate || !checkOutDate || days <= 0) return [];
        
//         const offers: DisplayableRoomOffer[] = [];
//         const currentCheckInDateOnly = new Date(checkInDate); currentCheckInDateOnly.setHours(0,0,0,0);
//         const currentCheckOutDateOnly = new Date(checkOutDate); currentCheckOutDateOnly.setHours(0,0,0,0);

//         const bookingDateRange = getDatesInRange(checkInDate, checkOutDate);
//         const numberOfNights = bookingDateRange.length;
//         // console.log("Calculating offers for", numberOfNights, "nights over dates:", bookingDateRange);
//         if (numberOfNights === 0) return [];

//         // Helper to get the hike amount safely
//         const getHikeAmount = (
//             hikePricing: HikePricingByOccupancy,
//             occupancyType: keyof HikePricingByOccupancy,
//             mealPlan: keyof PricingByMealPlan
//         ): number => {
//             const hikeGroup = hikePricing?.[occupancyType];
//             if (hikeGroup && typeof hikeGroup === 'object' && mealPlan in hikeGroup) {
//                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                 const price = (hikeGroup as any)[mealPlan];
//                 return typeof price === 'number' ? price : 0;
//             }
//             return 0;
//         };

//             property.categoryRooms.forEach(cat => {
//                 if (cat.availability && cat.availability.length > 0) {
//                     const isAvailableInAnyPeriod = cat.availability.some(period => {
//                         const periodStart = new Date(period.startDate); periodStart.setHours(0, 0, 0, 0);
//                         const periodEnd = new Date(period.endDate); periodEnd.setHours(23, 59, 59, 999);
                        
//                         return currentCheckInDateOnly >= periodStart && currentCheckOutDateOnly <= periodEnd;
//                     });

//                     if (!isAvailableInAnyPeriod) {
//                         return; // Skip this category if the booking dates don't fall within any available period
//                     }
//                 }
//             // console.log("Pricing:", cat.pricing);
//             // REFACTORED PRICE CALCULATION LOGIC
//             const calculateOfferPrice = (numAdults: number): { price: number, originalPrice?: number, isDiscounted: boolean } => {
//                 let basePrice = 0, discountedPrice = 0;
//                 let occupancyType: keyof HikePricingByOccupancy | null = null;

//                 if (numAdults === 1) {
//                     basePrice = getPrice(cat.pricing.singleOccupancyAdultPrice, selectedMealPlan);
//                     discountedPrice = getPrice(cat.pricing.discountedSingleOccupancyAdultPrice, selectedMealPlan);
//                     occupancyType = 'singleOccupancyAdultHike';
//                 } else if (numAdults === 2) {
//                     basePrice = getPrice(cat.pricing.doubleOccupancyAdultPrice, selectedMealPlan);
//                     discountedPrice = getPrice(cat.pricing.discountedDoubleOccupancyAdultPrice, selectedMealPlan);
//                     occupancyType = 'doubleOccupancyAdultHike';
//                 } else if (numAdults == 3) {
//                     basePrice = getPrice(cat.pricing.tripleOccupancyAdultPrice, selectedMealPlan);
//                     discountedPrice = getPrice(cat.pricing.discountedTripleOccupancyAdultPrice, selectedMealPlan);
//                     occupancyType = 'tripleOccupancyAdultHike';
//                 }
                
//                 // Fallback to 'noMeal' if selected meal plan has no price
//                 if (basePrice === 0 && selectedMealPlan !== 'noMeal') {
//                     let fbBase = 0, fbDisc = 0;
//                     if (numAdults === 1) { fbBase = getPrice(cat.pricing.singleOccupancyAdultPrice, 'noMeal'); fbDisc = getPrice(cat.pricing.discountedSingleOccupancyAdultPrice, 'noMeal');}
//                     else if (numAdults === 2) { fbBase = getPrice(cat.pricing.doubleOccupancyAdultPrice, 'noMeal'); fbDisc = getPrice(cat.pricing.discountedDoubleOccupancyAdultPrice, 'noMeal');}
//                     else if (numAdults == 3) { fbBase = getPrice(cat.pricing.tripleOccupancyAdultPrice, 'noMeal'); fbDisc = getPrice(cat.pricing.discountedTripleOccupancyAdultPrice, 'noMeal');}
//                     basePrice = fbBase; discountedPrice = fbDisc;
//                 }
                
//                 const isDisc = discountedPrice > 0 && discountedPrice < basePrice;
//                 const finalBasePrice = isDisc ? discountedPrice : basePrice;
//                 const originalPriceForCalc = isDisc ? basePrice : undefined;

//                 // console.log(`Calculating price for category "${cat.title}" with ${numAdults} adults: Base Price = ${basePrice}, Discounted Price = ${discountedPrice}, Final Price = ${finalBasePrice}, Is Discounted = ${isDisc}`);
//                 // --- START: SEASONAL HIKE CALCULATION ---
//                 let totalStayPrice = 0;
//                 let totalOriginalStayPrice = 0;
                
//                 const hike = cat.seasonalHike;
//                 const hikeIsActive = hike && hike.startDate && hike.endDate && hike.hikePricing && occupancyType;

//                 if (hikeIsActive) {
//                     const hikeStartDate = new Date(hike.startDate + 'T00:00:00');
//                     const hikeEndDate = new Date(hike.endDate + 'T23:59:59');
//                     const hikeAmount = getHikeAmount(hike.hikePricing, occupancyType as keyof HikePricingByOccupancy, selectedMealPlan);

//                     for (const dateStr of bookingDateRange) {
//                         const currentDate = new Date(dateStr + 'T12:00:00'); // Use midday to avoid timezone issues
                        
//                         let dayPrice = finalBasePrice;
//                         let originalDayPrice = originalPriceForCalc;

//                         if (currentDate >= hikeStartDate && currentDate <= hikeEndDate) {
//                             dayPrice += hikeAmount;
//                             if(originalDayPrice !== undefined) {
//                                 originalDayPrice += hikeAmount;
//                             }
//                         }
//                         totalStayPrice += dayPrice;
//                         if(originalDayPrice !== undefined) {
//                             totalOriginalStayPrice += originalDayPrice;
//                         }
//                     }
//                 } else {
//                     // No active hike, calculate price normally
//                     totalStayPrice = finalBasePrice;
//                     if(originalPriceForCalc !== undefined) {
//                         totalOriginalStayPrice = originalPriceForCalc;
//                     }
//                 }
                
//                 const averagePricePerNight = totalStayPrice;
//                 const averageOriginalPricePerNight = totalOriginalStayPrice > 0 ? (totalOriginalStayPrice) : undefined;
//                 // --- END: SEASONAL HIKE CALCULATION ---

//                 return {
//                     price: averagePricePerNight,
//                     originalPrice: averageOriginalPricePerNight,
//                     isDiscounted: isDisc
//                 };
//             };

//             const offerConfigs = [
//                 { intendedAdults: 1, guestCapacityInOffer: 1, offerKeySuffix: '1guest' },
//                 { intendedAdults: 2, guestCapacityInOffer: 2, offerKeySuffix: '2guests' },
//                 { intendedAdults: 3, guestCapacityInOffer: 3, offerKeySuffix: '3guests' },
//             ];

//             offerConfigs.forEach(oc => {
//                 if (MAX_OCCUPANTS_PER_ROOM >= oc.guestCapacityInOffer) {
//                     const pricingExists =
//                         (oc.intendedAdults === 1 && cat.pricing.singleOccupancyAdultPrice) ||
//                         (oc.intendedAdults === 2 && cat.pricing.doubleOccupancyAdultPrice) ||
//                         (oc.intendedAdults === 3 && cat.pricing.tripleOccupancyAdultPrice);

//                     if (pricingExists) {
//                         // Pass the whole category object to the price calculation function
//                         const priceInfo = calculateOfferPrice(oc.intendedAdults);
//                         // console.log(`${oc.intendedAdults} adults: Calculated price info:`, priceInfo);
//                         if (priceInfo.price > 0) {
//                             offers.push({
//                                 offerId: `${cat._id || cat.id}_${oc.offerKeySuffix}`,
//                                 categoryId: cat._id?.toString() || cat.id,
//                                 categoryTitle: cat.title,
//                                 bedConfiguration: cat.bedConfiguration,
//                                 size: cat.size,
//                                 roomSpecificAmenities: cat.roomSpecificAmenities,
//                                 maxPhysicalRoomsForCategory: cat.qty,
//                                 intendedAdults: oc.intendedAdults,
//                                 intendedChildren: 0,
//                                 guestCapacityInOffer: oc.guestCapacityInOffer,
//                                 pricePerNight: priceInfo.price, // This is now an AVERAGE price per night
//                                 originalPricePerNight: priceInfo.originalPrice,
//                                 isDiscounted: priceInfo.isDiscounted,
//                                 currency: cat.currency,
//                                 roomSize: cat.roomSize || "Unknown",
//                                 // categoryAvailabilityStartDate: cat.availabilityStartDate,
//                                 // categoryAvailabilityEndDate: cat.availabilityEndDate,
//                                 categoryActivities: cat.categoryActivities,
//                                 categoryFacilities: cat.categoryFacilities,
//                             });
//                         }
//                     }
//                 }
//             });
//         });
//         return offers;
//     }, [property?.categoryRooms, selectedMealPlan, checkInDate, checkOutDate, days]);

//     useEffect(() => {
//         if (!property?.categoryRooms || !displayableRoomOffers || !checkInDate || !checkOutDate || days <= 0) {
//             setTotalBookingPricePerNight(0);
//             setSubtotalNights(0); setServiceCharge(0); setTaxesApplied(0); setTotalBookingPricing(0);
//             setBookingError(null);
//             return;
//         }

//         let newActualAdultCountBasedOnOffers = 0;
//         let calculatedPricePerNight = 0;
//         const currentBookedRoomInstances: {
//             category: StoredRoomCategory;
//             offer: DisplayableRoomOffer;
//             childrenAssigned: number;
//         }[] = [];

//         if (totalSelectedPhysicalRooms > 0 && displayableRoomOffers.length > 0) {
//             Object.entries(selectedOffers).forEach(([offerId, qty]) => {
//                 if (qty > 0) {
//                     const offer = displayableRoomOffers.find(o => o.offerId === offerId);
//                     const category = property.categoryRooms?.find(c => c.id === offer?.categoryId || c._id === offer?.categoryId);

//                     if (offer && category) {
//                         calculatedPricePerNight += offer.pricePerNight * qty;
//                         newActualAdultCountBasedOnOffers += offer.intendedAdults * qty;
//                         for (let i = 0; i < qty; i++) {
//                             currentBookedRoomInstances.push({
//                                 category,
//                                 offer,
//                                 childrenAssigned: 0,
//                             });
//                         }
//                     }
//                 }
//             });
//         }

//         const adultCountToSet = totalSelectedPhysicalRooms > 0 ? Math.max(1, newActualAdultCountBasedOnOffers) : adultCount;

//         if (totalSelectedPhysicalRooms > 0 && adultCount !== adultCountToSet) {
//             setAdultCount(adultCountToSet);
//         }

//         let remainingChildrenToPlace = childCount;
//         let childrenPriceComponent = 0;
//         let newErrorMessage: string | null = null;

//         if (remainingChildrenToPlace > 0 && currentBookedRoomInstances.length > 0) {
//             for (const instance of currentBookedRoomInstances) {
//                 if (remainingChildrenToPlace === 0) break;

//                 const { category, offer } = instance;
//                 const pricing = category.pricing;
//                 const adultsInThisRoomInstanceByOffer = offer.intendedAdults;
//                 const capacityForChildrenInInstance = Math.max(0, (category.maxOccupancy || MAX_OCCUPANTS_PER_ROOM) - adultsInThisRoomInstanceByOffer);

//                 const childrenToAssignToInstance = Math.min(remainingChildrenToPlace, capacityForChildrenInInstance);

//                 if (childrenToAssignToInstance > 0) {
//                     instance.childrenAssigned = childrenToAssignToInstance;
//                     remainingChildrenToPlace -= childrenToAssignToInstance;

//                     let pricePerChildForInstance = 0;
//                     let child5to12Base = getPrice(pricing.child5to12Price, selectedMealPlan);
//                     let child5to12Disc = getPrice(pricing.discountedChild5to12Price, selectedMealPlan);
//                     if (child5to12Base === 0 && selectedMealPlan !== 'noMeal') child5to12Base = getPrice(pricing.child5to12Price, 'noMeal');
//                     if (child5to12Disc === 0 && selectedMealPlan !== 'noMeal') child5to12Disc = getPrice(pricing.discountedChild5to12Price, 'noMeal');
//                     const calculatedChild5to12Price = (child5to12Disc > 0 && child5to12Disc < child5to12Base) ? child5to12Disc : child5to12Base;

//                     if (calculatedChild5to12Price > 0) {
//                         pricePerChildForInstance = calculatedChild5to12Price;
//                     }
//                     childrenPriceComponent += pricePerChildForInstance * childrenToAssignToInstance;
//                 }
//             }
//         }
//         calculatedPricePerNight += childrenPriceComponent;

//         if (remainingChildrenToPlace > 0) {
//             newErrorMessage = `Not enough room capacity for all ${childCount} children. ${remainingChildrenToPlace} children could not be assigned. Please adjust room selection or reduce child count.`;
//         }

//         const totalGuestCapacityInSelectedRooms = currentBookedRoomInstances.reduce((sum, inst) => sum + (inst.category.maxOccupancy || MAX_OCCUPANTS_PER_ROOM), 0);
//         const totalGuestsAttemptingToBook = adultCountToSet + childCount;

//         if (totalSelectedPhysicalRooms > 0 && totalGuestsAttemptingToBook > totalGuestCapacityInSelectedRooms && !newErrorMessage) {
//              newErrorMessage = `Total guests (${totalGuestsAttemptingToBook}) exceed capacity of selected rooms (${totalGuestCapacityInSelectedRooms}). Adjust selection.`;
//         }

//         setBookingError(newErrorMessage);
//         setTotalBookingPricePerNight(calculatedPricePerNight);

//         if (calculatedPricePerNight > 0 && days > 0 && !newErrorMessage) {
//             const currentSubtotalNights = calculatedPricePerNight * days;
//             setSubtotalNights(currentSubtotalNights);
//             const currentServiceCharge = SERVICE_FEE_FIXED * days;
//             setServiceCharge(currentServiceCharge);
//             const currentTaxes = (currentSubtotalNights + currentServiceCharge) * TAX_RATE_PERCENTAGE;
//             setTaxesApplied(currentTaxes);
//             setTotalBookingPricing(currentSubtotalNights + currentServiceCharge + currentTaxes);
//         } else {
//             setSubtotalNights(0); setServiceCharge(0); setTaxesApplied(0); setTotalBookingPricing(0);
//             if (calculatedPricePerNight <= 0 && totalSelectedPhysicalRooms > 0 && days > 0 && !newErrorMessage) {
//                 const adultCountIsStableOrNoRooms = !(totalSelectedPhysicalRooms > 0 && adultCount !== adultCountToSet);
//                 if (adultCountIsStableOrNoRooms) {
//                      setBookingError("Could not calculate a valid price. Check room rates or contact support.");
//                 }
//             }
//         }
//     }, [
//         selectedOffers, property, displayableRoomOffers, days,
//         adultCount, childCount, selectedMealPlan, checkInDate, checkOutDate,
//         totalSelectedPhysicalRooms,
//     ]);

//     const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         if (!property) return;
//         const selectedValue = e.target.value;
//         let validatedCheckIn: Date | null = null;

//         if (!selectedValue) {
//             setCheckInDate(null);
//             setCheckOutDate(null);
//         } else {
//             validatedCheckIn = validateDate(selectedValue, property.startDate, property.endDate);
//             // localStorage.setItem('checkInDate', validatedCheckIn.toISOString());
//             setCheckInDate(validatedCheckIn);

//             if (checkOutDate && validatedCheckIn >= checkOutDate) {
//                 const nextDay = new Date(validatedCheckIn);
//                 nextDay.setDate(validatedCheckIn.getDate() + 1);
//                 const maxEndDate = new Date(property.endDate ?? Date.now());
//                  const validNextDay = nextDay <= maxEndDate ? nextDay : maxEndDate;
//                  if (validNextDay > validatedCheckIn) {
//                     // localStorage.setItem('checkOutDate', validNextDay.toISOString());
//                     setCheckOutDate(validNextDay);
//                  } else {
//                     setCheckOutDate(null);
//                  }
//             } else if (!checkOutDate && validatedCheckIn) {
//                 const nextDay = new Date(validatedCheckIn);
//                 nextDay.setDate(validatedCheckIn.getDate() + 1);
//                 const maxEndDate = new Date(property.endDate || Date.now());
//                 if (nextDay <= maxEndDate) {
//                     // localStorage.setItem('checkOutDate', nextDay.toISOString());
//                     setCheckOutDate(nextDay);
//                 }
//             }
//         }
//          const { available, message } = checkAvailabilityForSelection(validatedCheckIn, checkOutDate, selectedOffers, property?.categoryRooms);
//          setAvailabilityError(available ? null : message);
//          setBookingError(null);
//     };

//     const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         if (!property || !checkInDate) return;
//         const selectedValue = e.target.value;
//          let validatedCheckOut: Date | null = null;

//         if (!selectedValue) {
//             setCheckOutDate(null);
//         } else {
//             const minCODateStr = new Date(checkInDate.getTime() + 86400000).toISOString().split('T')[0];
//             validatedCheckOut = validateDate(selectedValue, minCODateStr, property.endDate || '');

//              if (validatedCheckOut <= checkInDate) {
//                  const dayAfterCI = new Date(checkInDate);
//                  dayAfterCI.setDate(checkInDate.getDate() + 1);
//                  const maxEndDate = new Date(property.endDate || Date.now());
//                  validatedCheckOut = dayAfterCI <= maxEndDate ? dayAfterCI : null;
//              }
//             setCheckOutDate(validatedCheckOut);
//             // localStorage.setItem('checkOutDate', validatedCheckOut ? validatedCheckOut.toISOString() : '');
            
//         }
//          const { available, message } = checkAvailabilityForSelection(checkInDate, validatedCheckOut, selectedOffers, property.categoryRooms);
//          setAvailabilityError(available ? null : message);
//          setBookingError(null);
//     };

//     const handleOfferQuantityChange = (offerId: string, quantity: number) => {
//         if (!property?.categoryRooms) return;

//         const [categoryIdFromFile] = offerId.split('_');
//         const category = property.categoryRooms.find(cat => cat.id === categoryIdFromFile || cat._id === categoryIdFromFile);
//         if (!category) return;

//         const newQty = Math.max(0, quantity);
//         const tempSelectedOffers = { ...selectedOffers };

//         if (newQty === 0) delete tempSelectedOffers[offerId];
//         else tempSelectedOffers[offerId] = newQty;

//         let qtySumForThisCategory = 0;
//         Object.keys(tempSelectedOffers).forEach(currentOfferId => {
//             if (currentOfferId.startsWith(category.id + '_') || currentOfferId.startsWith(category._id + '_')) {
//                 qtySumForThisCategory += tempSelectedOffers[currentOfferId];
//             }
//         });

//         if (qtySumForThisCategory > category.qty) {
//             setBookingError(`Cannot select more than ${category.qty} rooms of type "${category.title}".`);
//             setTimeout(() => setBookingError(null), 3000);
//             return;
//         }

//         const newTotalSelectedPhysical = Object.values(tempSelectedOffers).reduce((sum, q) => sum + q, 0);
//         if (newTotalSelectedPhysical > MAX_COMBINED_ROOMS) {
//             setBookingError(`Maximum ${MAX_COMBINED_ROOMS} rooms allowed in total.`);
//             setTimeout(() => setBookingError(null), 3000);
//             return;
//         }

//         setSelectedOffers(tempSelectedOffers);
//         const { available, message } = checkAvailabilityForSelection(checkInDate, checkOutDate, tempSelectedOffers, property.categoryRooms);
//         setAvailabilityError(available ? null : message);
//         if (bookingError && (bookingError.startsWith("Not enough room capacity") || bookingError.startsWith("Your selection does not accommodate"))) {
//              setBookingError(null);
//         }
//     };

//     useEffect(() => {
//         setTotalSelectedPhysicalRooms(Object.values(selectedOffers).reduce((sum, qty) => sum + qty, 0));
//     }, [selectedOffers]);

//     const handleMealPlanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setSelectedMealPlan(e.target.value as keyof PricingByMealPlan);
//         setBookingError(null);
//         setAvailabilityError(null);
//     };
    
//     const handleBookNowOrReserveClick = () => {
//         if (!isLoaded || !property) return;
//         let localError: string | null = null;

//         if (!isSignedIn) {
//             openSignIn({ redirectUrl: window.location.href });
//             return;
//         }

//         if (!checkInDate || !checkOutDate) localError = "Please select check-in and check-out dates.";
//         else if (days <= 0) localError = "Check-out date must be after check-in date.";
//         else if (totalSelectedPhysicalRooms <= 0) localError = "Please select at least one room offer.";
//         else if (totalSelectedPhysicalRooms > MAX_COMBINED_ROOMS) localError = `Cannot book more than ${MAX_COMBINED_ROOMS} rooms.`;

//         const { available, message: availabilityMsg } = checkAvailabilityForSelection(checkInDate, checkOutDate, selectedOffers, property?.categoryRooms);
//         if (!available) {
//             setAvailabilityError(availabilityMsg);
//             return;
//         } else setAvailabilityError(null);

//         if (bookingError) return;
//         if (totalBookingPricing <= 0 && totalSelectedPhysicalRooms > 0 && days > 0) {
//             localError = "Calculated price is zero. Please check room rates or contact support.";
//         }
//         if (localError) {
//             setBookingError(localError);
//             return;
//         }
//         setBookingError(null);

//         const reservationData = {
//             propertyId: property._id, propertyTitle: property.title, propertyImage: property.bannerImage?.url,
//             propertyLocation: { address: property.location.address, city: property.location.city, country: property.location.country },
//             propertyRating: property.totalRating, checkInDate: checkInDate?.toISOString(), checkOutDate: checkOutDate?.toISOString(),
//             days, adultCount, childCount, globalGuestCount, totalSelectedPhysicalRooms, selectedOffers, selectedMealPlan, displayableRoomOffers,
//             pricingDetails: { subtotalNights, serviceCharge, taxesApplied, totalBookingPricing, currency: property.costing?.currency || 'USD', totalBookingPricePerNight },
//             ownerId: property.userId, propertyType: property.type,
//             reservationPolicy : property.reservationPolicy || [],
//         };
//         if (typeof window !== 'undefined') {
//             localStorage.setItem(RESERVATION_DATA_KEY, JSON.stringify(reservationData));
//             router.push(`/customer/book/${property._id}`);
//         }
//     };

//     if (!property) return <div className="container mx-auto px-4 py-16 text-center"><h2 className="text-2xl font-bold text-red-600 mb-4">{'Property details could not be loaded.'}</h2><p className="text-gray-600 mb-4">Please check the URL or try refreshing the page.</p><button onClick={() => router.push('/properties')} className="mt-4 px-6 py-2 bg-[#003c95] text-white rounded-md hover:bg-[#003c95] transition-colors">View Other Properties</button></div>;

//     const currencySymbol = property.costing?.currency === 'INR' ? '₹' : (property.costing?.currency === 'USD' ? '$' : (property.costing?.currency === 'EUR' ? '€' : (property.costing?.currency || '$')));

//     return (
//         <>
//             <div className="bg-gray-100">
//                 <div className="container mx-auto px-2 sm:px-4 lg:max-w-7xl py-16">
                    
//                     <PropertyHeader
//                         title={property.title ?? ''}
//                         type={property.type}
//                         totalRating={property.totalRating}
//                         propertyRating={property.propertyRating}
//                         address={property.location.address ?? ''}
//                         city={property.location.city ?? ''}
//                     />
                    
//                     <ImageGalleryAndMap 
//                         bannerImage={property.bannerImage}
//                         detailImages={property.detailImages}
//                         googleMaps={property.googleMaps}
//                         title={property.title}
//                         type={property.type}
//                         amenities={property.amenities}
//                         funThingsToDo={property.funThingsToDo}
//                         meals={property.meals}
//                     />

//                     <AboutProperty description={property.description} />

//                     <SignedOut>
//                         <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-md mb-6 flex flex-col sm:flex-row items-center sm:items-center justify-between text-center sm:text-left gap-4 sm:gap-2">
//                             <div className="flex-grow">
//                                 <h3 className="text-lg font-bold text-yellow-800">Sign in, save money</h3>
//                                 <p className="text-sm text-yellow-700">To see if you can save 10% or more at this property, sign in</p>
//                                 <div className="mt-3">
//                                     <button onClick={() => openSignIn({ redirectUrl: typeof window !== 'undefined' ? window.location.href : undefined})} className="bg-[#003c95] text-white text-sm px-4 py-2 rounded-md hover:bg-[#003c95] mr-2">Sign in</button>
//                                     <button onClick={() => openSignIn({ redirectUrl: typeof window !== 'undefined' ? window.location.href : undefined })} className="text-[#003c95] text-sm font-semibold hover:underline">Create an account</button>
//                                 </div>
//                             </div>
//                             <Image src="/images/gift.jpeg" alt="Genius Loyalty Program" width={80} height={80} className="mx-auto sm:mx-0 shrink-0" />
//                         </div>
//                     </SignedOut>

//                     <div className="bg-white rounded-md border border-gray-300 mb-6">
//                         <div className="bg-gray-50 p-4 border-b border-gray-200">
//                             <h2 className="text-xl font-bold text-gray-800 mb-3">Select your rooms</h2>
//                             <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
//                                 <div> <label htmlFor="checkin-date-table" className="block text-xs font-medium text-gray-500 mb-1">Check-in</label> <input id="checkin-date-table" type="date" value={checkInDate ? checkInDate.toISOString().split('T')[0] : ''} onChange={handleCheckInChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#003c95] focus:border-[#003c95] text-sm shadow-sm" min={property.startDate} max={property.endDate} required /> </div>
//                                 <div> <label htmlFor="checkout-date-table" className="block text-xs font-medium text-gray-500 mb-1">Check-out</label> <input id="checkout-date-table" type="date" value={checkOutDate ? checkOutDate.toISOString().split('T')[0] : ''} onChange={handleCheckOutChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#003c95] focus:border-[#003c95] text-sm shadow-sm" min={checkInDate ? new Date(checkInDate.getTime() + 86400000).toISOString().split('T')[0] : property.startDate} max={property.endDate} required disabled={!checkInDate} /> </div>
//                                 <div> <label htmlFor="adult-count-selector" className="block text-xs font-medium text-gray-500 mb-1">Adults</label> <select id="adult-count-selector" value={adultCount} onChange={e => {setAdultCount(parseInt(e.target.value)); setBookingError(null);}} className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#003c95] text-sm shadow-sm"> {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)} </select> </div>
//                                 <div> <label htmlFor="child-count-selector" className="block text-xs font-medium text-gray-500 mb-1">Children (0-17)</label> <select id="child-count-selector" value={childCount} onChange={e => {setChildCount(parseInt(e.target.value)); setBookingError(null);}} className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#003c95] text-sm shadow-sm"> {[...Array(6)].map((_, i) => <option key={i} value={i}>{i}</option>)} </select> </div>
//                             </div>
//                             <div className="mt-4">
//                                 <label className="block text-xs font-medium text-gray-500 mb-1.5">Preferred Meal Plan (for all rooms):</label>
//                                 <div className="flex flex-wrap gap-2"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(plan => { const labelText = { noMeal: 'Room Only', breakfastOnly: 'Breakfast', allMeals: 'All Meals'}[plan]; return ( <label key={`meal-plan-table-${plan}`} className={`flex items-center px-2.5 py-1 border rounded-md cursor-pointer transition-colors text-xs ${selectedMealPlan === plan ? 'bg-[#003c95] border-[#003c95] ring-1 ring-[#003c95]' : 'border-gray-300 hover:bg-gray-100'}`}> <input type="radio" name="mealPlanTable" value={plan} checked={selectedMealPlan === plan} onChange={handleMealPlanChange} className="h-3 w-3 text-[#white] border-gray-300 focus:ring-[#003c95] mr-1.5" /> <span className={`${selectedMealPlan === plan ? 'text-white font-semibold' : 'text-gray-600'}`}>{labelText}</span> </label> ); })} </div>
//                             </div>
//                             {availabilityError && <div className="mt-3 p-2 bg-yellow-100 text-yellow-800 text-xs rounded-md border border-yellow-300 flex items-start"><CalendarOff className='h-3.5 w-3.5 mr-1.5 shrink-0 text-yellow-600 mt-px'/><p>{availabilityError}</p></div>}
//                             {bookingError && <div id="main-page-booking-error" className="mt-3 p-2 bg-red-100 text-red-700 text-xs rounded-md border border-red-300 flex items-start"><AlertTriangle className='h-3.5 w-3.5 mr-1.5 shrink-0 text-red-500 mt-px'/><p>{bookingError}</p></div>}
//                         </div>

//                         <div className="overflow-x-auto">
//                             <table className="w-full  border-collapse">
//                                 <thead className="hidden lg:table-header-group bg-[#003c95] text-left text-base text-white uppercase">
//                                     <tr>
//                                         <th className="px-4 py-3 font-semibold w-[25%] border-r border-[#003c95]">Room type</th>
//                                         <th className="px-3 py-3 font-semibold text-center w-[10%] border-r border-[#003c95]">Number of guests</th>
//                                         <th className="px-3 py-3 font-semibold w-[15%] border-r border-[#003c95]">Today&apos;s price</th>
//                                         <th className="px-3 py-3 font-semibold w-[20%] border-r border-[#003c95]">Your choices</th>
//                                         <th className="px-3 py-3 font-semibold text-center w-[10%] border-r border-[#003c95]">Select rooms</th>
//                                         <th className="px-3 py-3 font-semibold text-center w-[20%]">Make Reservation</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody className="block lg:table-row-group lg:divide-y lg:divide-gray-200 border-b border-gray-300">
//                                     {displayableRoomOffers.length === 0 && property.categoryRooms && property.categoryRooms.length > 0 && (
//                                         <tr className="block lg:table-row"><td colSpan={6} className="block lg:table-cell text-center py-6 text-gray-500">No pricing options available for the selected meal plan or dates. Try another plan or adjust dates.</td></tr>
//                                     )}
//                                     {(!property.categoryRooms || property.categoryRooms.length === 0) && (
//                                             <tr className="block lg:table-row"><td colSpan={6} className="block lg:table-cell text-center py-8 text-gray-500">No room types available for this property.</td></tr>
//                                     )}

//                                     {displayableRoomOffers.map((offer, overallOfferIndex) => {
//                                         // console.log('Rendering offer:', offer);
//                                         const category = property.categoryRooms?.find(cat => cat.id === offer.categoryId || cat._id === offer.categoryId);
//                                         if (!category) return null;

//                                         const offersForThisCategory = displayableRoomOffers.filter(o => o.categoryId === category.id || o.categoryId === category._id);
//                                         const offerIndexInCategory = offersForThisCategory.findIndex(o => o.offerId === offer.offerId);

//                                         const currentQtySelected = selectedOffers[offer.offerId] || 0;
//                                         const totalPriceForOfferNights = offer.pricePerNight * (days > 0 ? days : 1);
//                                         const illustrativeTaxForOffer = totalPriceForOfferNights * TAX_RATE_PERCENTAGE;
//                                         let sumOfOtherOffersInCat = 0;
//                                         Object.keys(selectedOffers).forEach(oId => {
//                                             if ((oId.startsWith(category.id + '_') || oId.startsWith(category._id + '_')) && oId !== offer.offerId) {
//                                                 sumOfOtherOffersInCat += selectedOffers[oId];
//                                             }
//                                         });
//                                         const maxSelectableForThisOffer = Math.min(category.qty - sumOfOtherOffersInCat, MAX_COMBINED_ROOMS - (totalSelectedPhysicalRooms - currentQtySelected));

//                                         return (
//                                             <tr key={offer.offerId} className={`block p-4 border rounded-lg mb-4 lg:p-0 lg:table-row lg:border-none lg:mb-0 lg:rounded-none lg:shadow-none ${currentQtySelected > 0 ? 'bg-[#003c95]/50 lg:bg-[#003c95]/10' : 'bg-white'}`}>
//                                                 {offerIndexInCategory === 0 ? (
//                                                     <td className="block border-b pb-4 mb-4 lg:border-b-0 lg:pb-0 lg:mb-0 lg:table-cell lg:px-4 lg:py-3 lg:align-top lg:border-r lg:border-gray-300" rowSpan={offersForThisCategory.length}>
                                               
//                                                         <div
//                                                             className="relative w-full aspect-[4/3] rounded-lg overflow-hidden cursor-pointer group mb-3 shadow-sm"
//                                                             onClick={() => handleCategoryTitleClick(category)}
//                                                             role="button"
//                                                             tabIndex={0}
//                                                             onKeyDown={(e) => e.key === 'Enter' && handleCategoryTitleClick(category)}
//                                                             aria-label={`View photos for ${category.title}`}
//                                                         >
//                                                             <CldImage
//                                                                 src={category.categoryImages?.[0]?.publicId || category.categoryImages?.[0]?.url || '/images/placeholder-property.png'}
//                                                                 alt={`Image of ${category.title}`}
//                                                                 layout="fill"
//                                                                 objectFit="cover"
//                                                                 className="group-hover:scale-105 transition-transform duration-300"
//                                                                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                                                                 onError={(e: any) => e.currentTarget.src = '/images/placeholder-property.png'}
//                                                             />
//                                                             {category.categoryImages && category.categoryImages.length > 0 && (
//                                                                 <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1.5 transition-all group-hover:bg-white group-hover:shadow-xl">
//                                                                     <span>{category.categoryImages.length} PHOTOS</span>
//                                                                     <span className="font-mono text-sm leading-none">→</span>
//                                                                 </div>
//                                                             )}
//                                                         </div>

//                                                         <h3 className="font-bold text-gray-800 text-xl">{offer.categoryTitle}</h3>
                                                        
//                                                         {offer.size && (
//                                                             <div className="flex items-center text-sm text-gray-600 mt-1">
//                                                                 <div className="w-4 h-4 border border-gray-500 mr-2 flex-shrink-0"></div>
//                                                                 <span>{offer.size}</span>
//                                                             </div>
//                                                         )}
                                                        
//                                                         <div className="mt-3 p-1.5 bg-green-50 border border-green-200 rounded-sm text-xs text-green-700 flex items-center">
//                                                             <UserCheck size={14} className="mr-1.5 shrink-0"/> Recommended for {offer.intendedAdults} adult{offer.intendedAdults > 1 ? 's' : ''}
//                                                             {offer.guestCapacityInOffer > offer.intendedAdults ? ` (up to ${offer.guestCapacityInOffer - offer.intendedAdults} child${offer.guestCapacityInOffer - offer.intendedAdults > 1 ? 'ren' : ''})` : ''}
//                                                         </div>

//                                                         {category.qty > 0 && category.qty <= 5 && <p className="text-xs text-red-600 mt-1.5 flex items-center"><AlertCircleIcon size={14} className="mr-1 shrink-0"/>Only {category.qty} rooms left on our site</p>}

//                                                         {offer.bedConfiguration && <p className="text-xs text-gray-700 mt-1.5 flex items-center"><Bed size={14} className="mr-1.5 text-gray-500" />{offer.bedConfiguration}</p>}
                                                        
//                                                         {category.categoryActivities && category.categoryActivities.length > 0 && (
//                                                             <div className="mt-2">
//                                                                 <p className="text-xs font-semibold text-yellow-700 flex items-center"><Sparkles size={13} className="mr-1" />Activities:</p>
//                                                                 <div className="flex flex-wrap gap-1 mt-0.5">
//                                                                     {category.categoryActivities.slice(0).map(act => <span key={act} className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-sm">{act}</span>)}
//                                                                 </div>
//                                                             </div>
//                                                         )}

//                                                         {category.categoryFacilities && category.categoryFacilities.length > 0 && (
//                                                             <div className="mt-1.5">
//                                                                 <p className="text-xs font-semibold text-indigo-700 flex items-center"><Wrench size={13} className="mr-1" />Facilities:</p>
//                                                                     <div className="flex flex-wrap gap-1 mt-0.5">
//                                                                     {category.categoryFacilities.slice(0).map(fac => <span key={fac} className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-sm">{fac}</span>)}
//                                                                 </div>
//                                                             </div>
//                                                         )}
                                                        
//                                                     </td>
//                                                 ) : null }
                                                
//                                                 <td className="block py-2 border-b lg:border-b-0 lg:table-cell lg:px-3 lg:py-3 lg:align-top lg:text-center lg:border-r lg:border-gray-300">
//                                                     <span className="text-sm font-semibold text-gray-500 lg:hidden">Sleeps:</span>
//                                                     <div className="flex flex-col items-center justify-center mt-1 lg:mt-0">
//                                                         <div className="flex justify-start items-center lg:justify-center">
//                                                             {[...Array(offer.intendedAdults)].map((_, i) => (
//                                                                 <UsersIcon key={i} size={18} className={`text-gray-600 ${i > 0 ? '-ml-1' : ''}`} />
//                                                             ))}
//                                                         </div>
//                                                         <p className="text-sm font-bold text-gray-700 mt-1">
//                                                             {offer.intendedAdults} {offer.intendedAdults === 1 ? 'person' : 'people'}
//                                                         </p>
//                                                     </div>
//                                                 </td>

//                                                 <td className="block py-2 border-b lg:border-b-0 lg:table-cell lg:px-3 lg:py-3 lg:align-top lg:border-r lg:border-gray-300">
//                                                     <span className="text-sm font-semibold text-gray-500 lg:hidden">Price for {days > 0 ? `${days} night${days > 1 ? 's' : ''}` : 'selection'}:</span>
//                                                     <div className="mt-1 lg:mt-0">
//                                                         {days > 0 && offer.pricePerNight > 0 ? ( <> <p className="text-lg font-bold text-gray-800">{currencySymbol} {totalPriceForOfferNights.toLocaleString()}</p> <p className="text-[11px] text-gray-500">+ {currencySymbol} {illustrativeTaxForOffer.toFixed(0)} taxes and charges</p> </> ) : days > 0 ? ( <p className="text-sm text-red-500">Price not available</p> ) : ( <p className="text-sm text-gray-500">Select dates to see price</p> )}
//                                                     </div>
//                                                 </td>
                                                
//                                                 <td className="block py-2 border-b lg:border-b-0 lg:table-cell lg:px-3 lg:py-3 lg:align-top text-xs text-gray-700 space-y-1.5 lg:border-r lg:border-gray-300">
//                                                     <span className="text-sm font-semibold text-gray-500 lg:hidden">Your choices include:</span>
//                                                     <div className="mt-1 lg:mt-0">
//                                                         <p className="flex items-center font-semibold"> {selectedMealPlan === 'breakfastOnly' ? <CoffeeIconLucide size={14} className="mr-1.5 shrink-0 text-gray-600" /> : selectedMealPlan === 'allMeals' ? <Utensils size={14} className="mr-1.5 shrink-0 text-gray-600" /> : <Bed size={14} className="mr-1.5 shrink-0 text-gray-600" /> } <span className="flex-grow"> {selectedMealPlan === 'breakfastOnly' ? 'Very good breakfast included' : selectedMealPlan === 'allMeals' ? 'Breakfast & dinner included' : 'Room only accommodation'} </span> <HelpCircle size={13} className="ml-1 text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0" aria-label={`This offer is for ${selectedMealPlan === 'noMeal' ? 'room only' : selectedMealPlan === 'breakfastOnly' ? 'room with breakfast' : 'room with all meals'}.`} /> </p>
//                                                         {property.reservationPolicy?.some(p => ['Free Cancellation', 'Flexible', 'Moderate'].includes(p)) && ( <p className="flex items-center text-green-600"> <CheckCircle size={14} className="mr-1.5 shrink-0" /> Free cancellation <span className="text-gray-500 ml-1 text-[10px]">(before specific date/time - check details)</span> </p> )}
//                                                         {property.reservationPolicy?.includes('Pay at Property') && ( <p className="flex items-center text-green-600"> <CheckCircle size={14} className="mr-1.5 shrink-0" /> No prepayment needed <span className="text-gray-500 ml-1 text-[10px]"> – pay at the property</span> </p> )}
//                                                         {property.reservationPolicy?.some(p => ['Non-Refundable', 'Strict'].includes(p)) && !property.reservationPolicy?.some(p => ['Free Cancellation', 'Flexible', 'Moderate'].includes(p)) && ( <p className="flex items-center text-red-600 font-semibold"> <XCircle size={14} className="mr-1.5 shrink-0" /> Non-Refundable </p> )}
//                                                     </div>
//                                                 </td>
                                                
//                                                 <td className="block py-2 border-b lg:border-b-0 lg:table-cell lg:px-3 lg:py-3 lg:align-top lg:text-center lg:border-r lg:border-gray-300">
//                                                         <div className="flex items-center justify-between lg:justify-center">
//                                                         <span className="text-sm font-semibold text-gray-500 lg:hidden">Select rooms:</span>
//                                                         <select value={currentQtySelected} onChange={(e) => handleOfferQuantityChange(offer.offerId, parseInt(e.target.value))} className="p-1.5 border border-gray-400 rounded text-sm focus:ring-1 focus:ring-[#003c95] w-20" disabled={days <= 0 || maxSelectableForThisOffer < 0 || !!availabilityError} > {[...Array(Math.max(0, maxSelectableForThisOffer) + 1)].map((_, i) => ( <option key={i} value={i}>{i}</option> ))} </select>
//                                                     </div>
//                                                 </td>

//                                                 {overallOfferIndex === 0 && displayableRoomOffers.length > 0 && (
//                                                     <td className="lg:block pt-4 lg:pt-2 lg:table-cell lg:px-4 lg:py-3 lg:align-top lg:text-left relative hidden " rowSpan={displayableRoomOffers.length}>
//                                                         {totalSelectedPhysicalRooms > 0 && totalBookingPricing > 0 && days > 0 && ( <div className="mb-3 text-sm"> <p className="font-semibold text-md"> {totalSelectedPhysicalRooms} room{totalSelectedPhysicalRooms > 1 ? 's' : ''} for </p> <p className="text-2xl font-bold text-gray-800"> {currencySymbol} {totalBookingPricing.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} </p> <p className="text-xs text-gray-500"> for {days} night{days > 1 ? 's' : ''}, incl. taxes </p> </div> )}
//                                                         <button onClick={handleBookNowOrReserveClick} onMouseEnter={() => setShowReservePopover(true)} onMouseLeave={() => setShowReservePopover(false)} disabled={!checkInDate || !checkOutDate || days <= 0 || totalSelectedPhysicalRooms <= 0 || !!availabilityError || totalBookingPricing <=0 || !!bookingError} className="bg-[#003c95] text-white font-semibold py-2.5 px-5 rounded-md hover:bg-[#003c95] text-sm disabled:bg-gray-300 disabled:cursor-not-allowed w-full" > I&apos;ll reserve </button>
//                                                         <p className="text-xs text-gray-500 mt-1.5"><span className="inline-block mr-1">•</span>You&apos;ll be taken to the next step</p>
//                                                         <p className="text-xs text-green-600 mt-1"><span className="inline-block mr-1">•</span>Confirmation is immediate</p>
//                                                         {showReservePopover && checkInDate && checkOutDate && days > 0 && property && totalSelectedPhysicalRooms > 0 && ( <div className="hidden lg:block absolute top-0 right-full mr-4 w-[340px] p-4 bg-slate-800 text-white rounded-lg shadow-xl z-20" > <h3 className="text-xl font-bold mb-1">{property.title}</h3> <p className="text-sm font-normal text-gray-300 mb-3">Enhanced personal experience</p> <div className="text-sm space-y-1 mb-4"> <p><strong>Total length of stay:</strong> {days} {days === 1 ? 'night' : 'nights'}</p> <p><strong>Check-in:</strong> {checkInDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p> <p><strong>Check-out:</strong> {checkOutDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p> </div> <div className="bg-yellow-400 text-black text-sm font-semibold p-3 rounded-md text-center"> No account needed! Booking takes just 2 minutes. </div> </div> )}
//                                                     </td>
//                                                 )}
//                                             </tr>
//                                         );
//                                     })}
//                                 </tbody>
//                             </table>
//                         </div>
//                     </div>

//                     <GuestReviews reviews={property?.review ?? []} />

//                     <HotelFacilities
//                         hotelName={property.title ?? ''}
//                         facilities={property.facilities ?? []}
//                         amenities={property.amenities ?? []}
//                     />


//                 </div>
//             </div>
//             <div className="w-[96vw] m-2 fixed bottom-0 block lg:hidden">
//                 {totalSelectedPhysicalRooms > 0 && totalBookingPricing > 0 && days > 0 && ( <div className="mb-1 w-full bg-gray-200 p-2 text-sm">
//                 <p className="font-semibold text-md"> {totalSelectedPhysicalRooms} room{totalSelectedPhysicalRooms > 1 ? 's' : ''} for </p>
//                 <p className="text-2xl font-bold text-gray-800"> {currencySymbol} {totalBookingPricing.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} </p>
//                 <p className="text-xs text-gray-500"> for {days} night{days > 1 ? 's' : ''}, incl. taxes </p> </div> )}
//                 <button onClick={handleBookNowOrReserveClick} onMouseEnter={() => setShowReservePopover(true)} onMouseLeave={() => setShowReservePopover(false)} disabled={!checkInDate || !checkOutDate || days <= 0 || totalSelectedPhysicalRooms <= 0 || !!availabilityError || totalBookingPricing <=0 || !!bookingError} className="bg-[#003c95] text-white font-semibold py-3 px-5 border-3 border-black/40 rounded-md hover:bg-[#003c95] text-sm disabled:bg-gray-300 disabled:cursor-not-allowed w-full" > I&apos;ll reserve </button>
//                 {showReservePopover && checkInDate && checkOutDate && days > 0 && property && totalSelectedPhysicalRooms > 0 && ( <div className="hidden lg:block absolute top-0 right-full mr-4 w-[340px] p-4 bg-slate-800 text-white rounded-lg shadow-xl z-20" > <h3 className="text-xl font-bold mb-1">{property.title}</h3> <p className="text-sm font-normal text-gray-300 mb-3">Enhanced personal experience</p> <div className="text-sm space-y-1 mb-4"> <p><strong>Total length of stay:</strong> {days} {days === 1 ? 'night' : 'nights'}</p> <p><strong>Check-in:</strong> {checkInDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p> <p><strong>Check-out:</strong> {checkOutDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p> </div> <div className="bg-yellow-400 text-black text-sm font-semibold p-3 rounded-md text-center"> No account needed! Booking takes just 2 minutes. </div> </div> )}
//             </div>
                    
//             {modalData && (
//                 <ImageGalleryModal
//                     title={modalData.title}
//                     images={modalData.images}
//                     onClose={handleCloseModal}
//                 />
//             )}
//         </>
//     );
// }