'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Coffee as CoffeeIconLucide, CheckCircle, Users as UsersIcon, CalendarOff,
    AlertTriangle, Bed,
    Utensils,
    UserCheck,
    X,
    XCircle,
    HelpCircle,
} from 'lucide-react';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary'; 
import { useRouter } from 'next/navigation';
import { useUser, useClerk, SignedOut } from '@clerk/nextjs';
import { Property } from '@/lib/mongodb/models/Property';
import { DisplayableRoomOffer, HikePricingByOccupancy, StoredRoomCategory } from '@/types/booking';
import { Image as PropertyImage } from '@/lib/mongodb/models/Components';
import { GuestReviews } from './Reviews';
import { HotelFacilities } from './HotelFacilities';
import PropertyHeader from './PropertyHeader';
import ImageGalleryAndMap from './ImageGalleryAndMap';
import AboutProperty from './AboutProperty';
import { DiscountedPricingByMealPlan, PricingByMealPlan } from '@/types/property';
import { HouseRules } from './HouseRules';

const LOCAL_STORAGE_KEY = 'propertyBookingPreferences_v3';
const RESERVATION_DATA_KEY = 'reservationData_v1';
const MAX_COMBINED_ROOMS = 5;
const MAX_OCCUPANTS_PER_ROOM = 3;
const SERVICE_FEE_FIXED = 10;
const TAX_RATE_PERCENTAGE = 0.05;

// --- Helper Functions ---

const calculateDays = (start: Date | null, end: Date | null): number => {
    if (!start || !end || end <= start) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getDatesInRange = (startDate: Date, endDate: Date): string[] => {
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate < endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

const getPrice = (
    priceGroup: PricingByMealPlan | DiscountedPricingByMealPlan | undefined,
    mealPlan: keyof PricingByMealPlan
): number => {
    if (priceGroup && typeof priceGroup === 'object' && mealPlan in priceGroup) {
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
      const price = (priceGroup as any)[mealPlan];
      return typeof price === 'number' ? price : 0;
    }
    return 0;
};

// --- Child Components ---

const ImageGalleryModal: React.FC<{ title: string; images: PropertyImage[]; onClose: () => void; }> = ({ title, images, onClose }) => {
  const [activeImage, setActiveImage] = useState<PropertyImage | null>(images?.[0] || null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center"><h2 className="text-xl font-bold text-gray-800">{title} - Photo Gallery</h2><button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200"><X size={24} /></button></div>
        <div className="flex-grow p-4 overflow-y-auto">
          {activeImage && (
            <div className="relative w-full aspect-[16/10] mb-4 rounded-md overflow-hidden bg-gray-200">
              <CldImage src={activeImage.publicId || activeImage.url} alt={activeImage.alt || `Image of ${title}`} layout="fill" objectFit="contain" />
            </div>
          )}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {images.map((image, index) => (
              <div key={image.publicId || index} className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${activeImage?.url === image.url ? 'border-[#003c95]' : 'border-transparent hover:border-[#003c95]'}`} onClick={() => setActiveImage(image)}>
                <CldImage src={image.publicId || image.url} alt={image.alt || `Thumbnail ${index + 1}`} layout="fill" objectFit="cover" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main Page Component ---

export default function PropertyDetailPage({ property }: { property: Property | null }) {

    // console.log("Rendering PropertyDetailPage for property:", property); 

    const { openSignIn } = useClerk();
    const router = useRouter();
    const { isSignedIn } = useUser();

    // State declarations
    const [checkInDate, setCheckInDate] = useState<Date | null>(null);
    const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
    const [adultCount, setAdultCount] = useState<number>(localStorage.getItem('adults') ? parseInt(localStorage.getItem('adults')!) : 1);
    const [childCount, setChildCount] = useState<number>(localStorage.getItem('children') ? parseInt(localStorage.getItem('children')!) : 0);
    const [selectedOffers, setSelectedOffers] = useState<Record<string, number>>({});
    const [selectedMealPlan, setSelectedMealPlan] = useState<keyof PricingByMealPlan>('breakfastOnly');
    const [availabilityError, setAvailabilityError] = useState<string | null>(null);
    const [bookingError, setBookingError] = useState<string | null>(null);
    const [modalData, setModalData] = useState<{ title: string; images: PropertyImage[] } | null>(null);

    // Memoized calculations
    const days = useMemo(() => calculateDays(checkInDate, checkOutDate), [checkInDate, checkOutDate]);
    const totalSelectedPhysicalRooms = useMemo(() => Object.values(selectedOffers).reduce((sum, qty) => sum + qty, 0), [selectedOffers]);
    
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    const maxDateStr = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 2);
        return d.toISOString().split('T')[0];
    }, []);

    const handleCategoryTitleClick = (category: StoredRoomCategory) => {
        setModalData({ title: category.title, images: category.categoryImages || [] });
    };

    const validateDate = (selectedDateStr: string): Date => {
        const date = new Date(selectedDateStr); date.setHours(12, 0, 0, 0);
        const minDate = new Date(); minDate.setHours(0, 0, 0, 0);
        const maxDate = new Date(); maxDate.setFullYear(maxDate.getFullYear() + 2); maxDate.setHours(23, 59, 59, 999);
        if (date < minDate) return minDate;
        if (date > maxDate) return maxDate;
        return date;
    };

    const checkAvailabilityForSelection = useCallback((
        startDate: Date | null,
        endDate: Date | null,
        currentSelectedOffers: Record<string, number>,
        allCategories: StoredRoomCategory[] | undefined
    ): { available: boolean; message: string | null } => {
        if (!startDate || !endDate || endDate <= startDate || !allCategories || Object.keys(currentSelectedOffers).length === 0) {
            return { available: true, message: null };
        }

        const bookingDates = getDatesInRange(startDate, endDate);
        if (bookingDates.length === 0) return { available: true, message: null };
        
        const involvedCategoryIds = new Set(Object.keys(currentSelectedOffers).map(offerId => offerId.split('_')[0]));

        for (const catId of Array.from(involvedCategoryIds)) {
            const category = allCategories.find(c => c.id === catId || c._id === catId);
            if (!category) continue;

            // 1. Check if booking falls within any defined availability period
            if (category.availability && category.availability.length > 0) {
                const bookingStart = new Date(startDate); bookingStart.setHours(0, 0, 0, 0);
                const bookingEnd = new Date(endDate); bookingEnd.setHours(0, 0, 0, 0);

                const isAvailable = category.availability.some(period => {
                    const periodStart = new Date(period.startDate); periodStart.setHours(0, 0, 0, 0);
                    // Add one day to periodEnd to make the range inclusive for comparison
                    const periodEndExclusive = new Date(period.endDate); periodEndExclusive.setHours(23, 59, 59, 999);
                    return bookingStart >= periodStart && bookingEnd <= periodEndExclusive;
                });

                if (!isAvailable) {
                    return { available: false, message: `Room type "${category.title}" is not available for the selected dates. Please check its seasonal availability.` };
                }
            }

            // 2. Check for specific unavailable dates within the booking range
            if (category.unavailableDates && category.unavailableDates.length > 0) {
                for (const dateStr of bookingDates) {
                    if (category.unavailableDates.includes(dateStr)) {
                        return { available: false, message: `Room type "${category.title}" is unavailable on ${new Date(dateStr + 'T12:00:00').toLocaleDateString()}. Please adjust dates or selection.` };
                    }
                }
            }
        }
        return { available: true, message: null };
    }, []);

    // Effect for initializing state from localStorage or query params
    useEffect(() => {
        if (!property || typeof window === 'undefined') return;

        const storedPrefsStr = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedPrefsStr) {
            try {
                const parsedPrefs = JSON.parse(storedPrefsStr);
                if (parsedPrefs.propertyId === property._id?.toString()) {
                    setCheckInDate(parsedPrefs.checkInDate ? validateDate(parsedPrefs.checkInDate) : null);
                    setCheckOutDate(parsedPrefs.checkOutDate ? validateDate(parsedPrefs.checkOutDate) : null);
                    setAdultCount(parsedPrefs.adultCount || localStorage.getItem('adults') || 1);
                    setChildCount(parsedPrefs.childCount || localStorage.getItem('children') || 0);
                    setSelectedOffers(parsedPrefs.selectedOffers || {});
                    setSelectedMealPlan(parsedPrefs.selectedMealPlan || 'breakfastOnly');
                    return;
                }
            } catch (e) { console.error("Failed to parse stored preferences:", e); }
        }
        // Fallback for new visit or different property
        setCheckInDate(null);
        setCheckOutDate(null);
        setAdultCount(localStorage.getItem('adults') ? parseInt(localStorage.getItem('adults')!) : 1);
        setChildCount(localStorage.getItem('children') ? parseInt(localStorage.getItem('children')!) : 0);
        setSelectedOffers({});
    }, [property]);

    // Effect for saving state to localStorage
    useEffect(() => {
        if (property && typeof window !== 'undefined') {
            const preferencesToSave = {
                propertyId: property._id?.toString(),
                checkInDate: localStorage.getItem('checkIn') || checkInDate?.toISOString(),
                checkOutDate: localStorage.getItem('checkOut') || checkOutDate?.toISOString(),
                adultCount,
                childCount,
                selectedOffers,
                selectedMealPlan,
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferencesToSave));
        }
    }, [checkInDate, checkOutDate, adultCount, childCount, selectedOffers, selectedMealPlan, property]);
    
    const displayableRoomOffers = useMemo((): DisplayableRoomOffer[] => {
        if (!property?.categoryRooms || !checkInDate || !checkOutDate || days <= 0) return [];
        // console.log("Testing");
        const offers: DisplayableRoomOffer[] = [];
        const bookingDateRange = getDatesInRange(checkInDate, checkOutDate);
        if (bookingDateRange.length === 0) return [];

        const getHikeAmount = (hikePricing: HikePricingByOccupancy, occupancyType: keyof HikePricingByOccupancy, mealPlan: keyof PricingByMealPlan): number => {
            const hikeGroup = hikePricing?.[occupancyType];
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (hikeGroup && typeof hikeGroup === 'object' && mealPlan in hikeGroup) ? (hikeGroup as any)[mealPlan] : 0;
        };

        property.categoryRooms.forEach(cat => {
            // --- AVAILABILITY LOGIC ---
            // 1. Check against defined availability periods
            if (cat.availability && cat.availability.length > 0) {
                const bookingStart = new Date(checkInDate); bookingStart.setHours(0,0,0,0);
                const bookingEnd = new Date(checkOutDate); bookingEnd.setHours(0,0,0,0);
                const isAvailable = cat.availability.some(period => {
                    const periodStart = new Date(period.startDate); periodStart.setHours(0,0,0,0);
                    const periodEndExclusive = new Date(period.endDate); periodEndExclusive.setHours(23,59,59,999);
                    return bookingStart >= periodStart && bookingEnd <= periodEndExclusive;
                });
                if (!isAvailable) return;
            }
            if (cat.unavailableDates?.some(unavailableDate => bookingDateRange.includes(unavailableDate))) {
                return;
            }

            const calculateOfferPrice = (numAdults: number): { price: number, originalPrice?: number, isDiscounted: boolean } => {
                let basePrice = 0, discountedPrice = 0;
                let occupancyType: keyof HikePricingByOccupancy | null = null;
                
                if (numAdults === 1) { [basePrice, discountedPrice, occupancyType] = [getPrice(cat.pricing.singleOccupancyAdultPrice, selectedMealPlan), getPrice(cat.pricing.discountedSingleOccupancyAdultPrice, selectedMealPlan), 'singleOccupancyAdultHike']; }
                else if (numAdults === 2) { [basePrice, discountedPrice, occupancyType] = [getPrice(cat.pricing.doubleOccupancyAdultPrice, selectedMealPlan), getPrice(cat.pricing.discountedDoubleOccupancyAdultPrice, selectedMealPlan), 'doubleOccupancyAdultHike']; }
                else if (numAdults === 3) { [basePrice, discountedPrice, occupancyType] = [getPrice(cat.pricing.tripleOccupancyAdultPrice, selectedMealPlan), getPrice(cat.pricing.discountedTripleOccupancyAdultPrice, selectedMealPlan), 'tripleOccupancyAdultHike']; }
                
                if (basePrice === 0) return { price: 0, isDiscounted: false };

                const isDisc = discountedPrice > 0 && discountedPrice < basePrice;
                const finalBasePrice = isDisc ? discountedPrice : basePrice;
                const originalPriceForCalc = isDisc ? basePrice : undefined;

                let totalHikeAmount = 0;
                const hike = cat.seasonalHike;
                if (hike?.startDate && hike.endDate && hike.hikePricing && occupancyType) {
                    const hikeStartDate = new Date(hike.startDate + 'T00:00:00');
                    const hikeEndDate = new Date(hike.endDate + 'T23:59:59');
                    const hikeAmountPerNight = getHikeAmount(hike.hikePricing, occupancyType, selectedMealPlan);
                    bookingDateRange.forEach(dateStr => {
                        const currentDate = new Date(dateStr + 'T12:00:00');
                        if (currentDate >= hikeStartDate && currentDate <= hikeEndDate) {
                            totalHikeAmount += hikeAmountPerNight;
                        }
                    });
                }
                const averageHikePerNight = totalHikeAmount / bookingDateRange.length;
                
                return {
                    price: finalBasePrice + averageHikePerNight,
                    originalPrice: originalPriceForCalc ? originalPriceForCalc + averageHikePerNight : undefined,
                    isDiscounted: isDisc
                };
            };

            [1, 2, 3].forEach(numAdults => {
                if (MAX_OCCUPANTS_PER_ROOM >= numAdults) {
                    const priceInfo = calculateOfferPrice(numAdults);
                    if (priceInfo.price > 0) {
                        offers.push({
                            offerId: `${cat._id || cat.id}_${numAdults}guests`,
                            categoryId: cat._id?.toString() || cat.id,
                            categoryTitle: cat.title,
                            bedConfiguration: cat.bedConfiguration,
                            size: cat.size,
                            roomSpecificAmenities: cat.roomSpecificAmenities,
                            maxPhysicalRoomsForCategory: cat.qty,
                            intendedAdults: numAdults,
                            intendedChildren: 0,
                            guestCapacityInOffer: numAdults,
                            pricePerNight: priceInfo.price,
                            originalPricePerNight: priceInfo.originalPrice,
                            isDiscounted: priceInfo.isDiscounted,
                            currency: cat.currency,
                            roomSize: cat.roomSize || "Unknown",
                            categoryActivities: cat.categoryActivities,
                            categoryFacilities: cat.categoryFacilities,
                        });
                    }
                }
            });
        });
        return offers;
    }, [property?.categoryRooms, selectedMealPlan, checkInDate, checkOutDate, days]);
    
    const { totalBookingPricing, subtotalNights, serviceCharge, taxesApplied } = useMemo(() => {
        if (totalSelectedPhysicalRooms === 0 || days <= 0 || !property) {
            return { totalBookingPricing: 0, subtotalNights: 0, serviceCharge: 0, taxesApplied: 0 };
        }

        let pricePerNight = 0;
        // let adultCapacity = 0;
        const roomInstances: { category: StoredRoomCategory, offer: DisplayableRoomOffer }[] = [];

        Object.entries(selectedOffers).forEach(([offerId, qty]) => {
            const offer = displayableRoomOffers.find(o => o.offerId === offerId);
            const category = property.categoryRooms?.find(c => c.id === offer?.categoryId || c._id === offer?.categoryId);
            if (offer && category && qty > 0) {
                pricePerNight += offer.pricePerNight * qty;
                // adultCapacity += offer.intendedAdults * qty;
                for (let i = 0; i < qty; i++) roomInstances.push({ category, offer });
            }
        });

        let childrenPriceComponent = 0;
        let remainingChildren = childCount;
        if (remainingChildren > 0) {
            for (const instance of roomInstances) {
                if (remainingChildren === 0) break;
                const capacityForChildren = Math.max(0, (instance.category.maxOccupancy || MAX_OCCUPANTS_PER_ROOM) - instance.offer.intendedAdults);
                const childrenToAssign = Math.min(remainingChildren, capacityForChildren);
                
                if (childrenToAssign > 0) {
                    let childPrice = getPrice(instance.category.pricing.discountedChild5to12Price, selectedMealPlan);
                    if (childPrice === 0) childPrice = getPrice(instance.category.pricing.child5to12Price, selectedMealPlan);
                    childrenPriceComponent += childPrice * childrenToAssign;
                    remainingChildren -= childrenToAssign;
                }
            }
        }
        pricePerNight += childrenPriceComponent;

        const currentSubtotalNights = pricePerNight * days;
        const currentServiceCharge = SERVICE_FEE_FIXED * days;
        const currentTaxes = (currentSubtotalNights + currentServiceCharge) * TAX_RATE_PERCENTAGE;
        const currentTotal = currentSubtotalNights + currentServiceCharge + currentTaxes;
        
        return { totalBookingPricing: currentTotal, subtotalNights: currentSubtotalNights, serviceCharge: currentServiceCharge, taxesApplied: currentTaxes };

    }, [selectedOffers, displayableRoomOffers, days, childCount, property, totalSelectedPhysicalRooms, selectedMealPlan]);
    
    // Handlers
    const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedValue = e.target.value;
        const newCheckIn = selectedValue ? validateDate(selectedValue) : null;
        setCheckInDate(newCheckIn);

        if (newCheckIn && (!checkOutDate || newCheckIn >= checkOutDate)) {
            const nextDay = new Date(newCheckIn);
            nextDay.setDate(newCheckIn.getDate() + 1);
            setCheckOutDate(validateDate(nextDay.toISOString().split('T')[0]));
        }
        setAvailabilityError(null);
    };

    const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!checkInDate) return;
        const selectedValue = e.target.value;
        let newCheckOut = selectedValue ? validateDate(selectedValue) : null;

        if (newCheckOut && newCheckOut <= checkInDate) {
            const nextDay = new Date(checkInDate);
            nextDay.setDate(checkInDate.getDate() + 1);
            newCheckOut = validateDate(nextDay.toISOString().split('T')[0]);
        }
        setCheckOutDate(newCheckOut);
        setAvailabilityError(null);
    };

    const handleOfferQuantityChange = (offerId: string, quantity: number) => {
        const categoryId = offerId.split('_')[0];
        const category = property?.categoryRooms?.find(cat => cat.id === categoryId || cat._id === categoryId);
        if (!category) return;

        const newQty = Math.max(0, quantity);
        const newSelectedOffers = { ...selectedOffers };
        if (newQty === 0) delete newSelectedOffers[offerId];
        else newSelectedOffers[offerId] = newQty;

        const qtyForThisCategory = Object.keys(newSelectedOffers).filter(id => id.startsWith(categoryId)).reduce((sum, id) => sum + newSelectedOffers[id], 0);
        const totalRoomsOverall = Object.values(newSelectedOffers).reduce((sum, q) => sum + q, 0);

        if (qtyForThisCategory > category.qty || totalRoomsOverall > MAX_COMBINED_ROOMS) {
            setBookingError(qtyForThisCategory > category.qty ? `Max ${category.qty} rooms for "${category.title}".` : `Max ${MAX_COMBINED_ROOMS} rooms total.`);
            setTimeout(() => setBookingError(null), 3000);
            return;
        }
        
        setSelectedOffers(newSelectedOffers);
        const { available, message } = checkAvailabilityForSelection(checkInDate, checkOutDate, newSelectedOffers, property?.categoryRooms);
        setAvailabilityError(available ? null : message);
    };

    const handleBookNowOrReserveClick = () => {
        if (!isSignedIn) { openSignIn({ redirectUrl: window.location.href }); return; }
        if (!checkInDate || !checkOutDate || days <= 0) { setBookingError("Please select valid check-in and check-out dates."); return; }
        if (totalSelectedPhysicalRooms <= 0) { setBookingError("Please select at least one room."); return; }
        if (availabilityError) return;
        if (totalBookingPricing <= 0) { setBookingError("Could not calculate a valid price for the selection."); return; }
        
        setBookingError(null);
        
        const reservationData = {
            propertyId: property?._id, propertyTitle: property?.title, propertyImage: property?.bannerImage?.url,
            propertyLocation: property?.location, checkInDate: checkInDate?.toISOString(), checkOutDate: checkOutDate?.toISOString(),
            days, adultCount, childCount, selectedOffers, selectedMealPlan,
            pricingDetails: { subtotalNights, serviceCharge, taxesApplied, totalBookingPricing, currency: property?.costing?.currency || 'USD' },
            ownerId: property?.userId,
        };
        localStorage.setItem(RESERVATION_DATA_KEY, JSON.stringify(reservationData));
        router.push(`/customer/book/${property?._id}`);
    };

    if (!property) return <div className="container mx-auto px-4 py-16 text-center"><h2 className="text-2xl font-bold text-red-600">Property Not Found</h2><p>This property may no longer be available.</p></div>;

    const currencySymbol = property.costing?.currency === 'INR' ? '₹' : (property.costing?.currency === 'USD' ? '$' : (property.costing?.currency || '$'));
    
    return (
        <>
            <div className="bg-gray-100">
                <div className="container mx-auto px-2 sm:px-4 lg:max-w-7xl py-16">
                    
                    <PropertyHeader
                        title={property.title ?? ''}
                        type={property.type}
                        totalRating={property.totalRating}
                        propertyRating={property.propertyRating}
                        address={property.location.address ?? ''}
                        city={property.location.city ?? ''}
                    />
                    
                    <ImageGalleryAndMap
                        bannerImage={property.bannerImage}
                        detailImages={property.detailImages}
                        googleMaps={property.googleMaps}
                        title={property.title}
                        type={property.type}
                        amenities={property.amenities}
                        funThingsToDo={property.funThingsToDo}
                        meals={property.meals}
                    />
                    
                    <AboutProperty
                        description={property.description}
                    />

                    <SignedOut>
                        <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-md mb-6 flex flex-col sm:flex-row items-center sm:items-center justify-between text-center sm:text-left gap-4 sm:gap-2">
                            <div className="flex-grow">
                                <h3 className="text-lg font-bold text-yellow-800">Sign in, save money</h3>
                                <p className="text-sm text-yellow-700">To see if you can save 10% or more at this property, sign in</p>
                                <div className="mt-3">
                                    <button onClick={() => openSignIn({ redirectUrl: typeof window !== 'undefined' ? window.location.href : undefined})} className="bg-[#003c95] text-white text-sm px-4 py-2 rounded-md hover:bg-[#003c95] mr-2">Sign in</button>
                                    <button onClick={() => openSignIn({ redirectUrl: typeof window !== 'undefined' ? window.location.href : undefined })} className="text-[#003c95] text-sm font-semibold hover:underline">Create an account</button>
                                </div>
                            </div>
                            <Image src="/images/gift.jpeg" alt="Genius Loyalty Program" width={80} height={80} className="mx-auto sm:mx-0 shrink-0" />
                        </div>
                    </SignedOut>

                    <div className="bg-white rounded-md border border-gray-300 mb-6">
                        <div className="bg-gray-50 p-4 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800 mb-3">Select your rooms</h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                <div>
                                    <label htmlFor="checkin-date-table" className="block text-xs font-medium text-gray-500 mb-1">Check-in</label>
                                    <input id="checkin-date-table" type="date" value={checkInDate ? checkInDate.toISOString().split('T')[0] : ''} onChange={handleCheckInChange} className="w-full p-2 border rounded-md text-sm shadow-sm" min={todayStr} max={maxDateStr} />
                                </div>
                                <div>
                                    <label htmlFor="checkout-date-table" className="block text-xs font-medium text-gray-500 mb-1">Check-out</label>
                                    <input id="checkout-date-table" type="date" value={checkOutDate ? checkOutDate.toISOString().split('T')[0] : ''} onChange={handleCheckOutChange} className="w-full p-2 border rounded-md text-sm shadow-sm" min={checkInDate ? new Date(checkInDate.getTime() + 86400000).toISOString().split('T')[0] : todayStr} max={maxDateStr} disabled={!checkInDate} />
                                </div>
                                <div>
                                    <label htmlFor="adult-count-selector" className="block text-xs font-medium text-gray-500 mb-1">Adults</label>
                                    <select id="adult-count-selector" value={adultCount} onChange={e => setAdultCount(parseInt(e.target.value))} className="w-full p-2 border rounded-md text-sm"> {[...Array(10)].map((_, i) =>
                                        <option key={i+1} value={i+1}>{i+1}</option>
                                    )}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="child-count-selector" className="block text-xs font-medium text-gray-500 mb-1">Children</label>
                                    <select id="child-count-selector" value={childCount} onChange={e => setChildCount(parseInt(e.target.value))} className="w-full p-2 border rounded-md text-sm"> {[...Array(6)].map((_, i) =>
                                        <option key={i} value={i}>{i}</option>
                                    )} 
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Preferred Meal Plan (for all rooms):</label>
                                <div className="flex flex-wrap gap-2"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(plan => { const labelText = { noMeal: 'Room Only', breakfastOnly: 'Breakfast', allMeals: 'All Meals'}[plan]; return ( <label key={`meal-plan-table-${plan}`} className={`flex items-center px-2.5 py-1 border rounded-md cursor-pointer transition-colors text-xs ${selectedMealPlan === plan ? 'bg-[#003c95] border-[#003c95] ring-1 ring-[#003c95]' : 'border-gray-300 hover:bg-gray-100'}`}> <input type="radio" name="mealPlanTable" value={plan} checked={selectedMealPlan === plan} onChange={(e) => setSelectedMealPlan(e.target.value as keyof PricingByMealPlan)} className="h-3 w-3 text-[#white] border-gray-300 focus:ring-[#003c95] mr-1.5" /> <span className={`${selectedMealPlan === plan ? 'text-white font-semibold' : 'text-gray-600'}`}>{labelText}</span> </label> ); })} </div>
                            </div>
                            {availabilityError && <div className="mt-3 p-2 bg-yellow-100 text-yellow-800 text-xs rounded-md border border-yellow-300 flex items-start"><CalendarOff className='h-3.5 w-3.5 mr-1.5 shrink-0 text-yellow-600 mt-px'/><p>{availabilityError}</p></div>}
                            {bookingError && <div id="main-page-booking-error" className="mt-3 p-2 bg-red-100 text-red-700 text-xs rounded-md border border-red-300 flex items-start"><AlertTriangle className='h-3.5 w-3.5 mr-1.5 shrink-0 text-red-500 mt-px'/><p>{bookingError}</p></div>}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="hidden lg:table-header-group bg-[#003c95] text-left text-base text-white uppercase">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold w-[25%] border-r border-[#003c95]">Room type</th>
                                        <th className="px-3 py-3 font-semibold text-center w-[10%] border-r border-[#003c95]">Number of guests</th>
                                        <th className="px-3 py-3 font-semibold w-[15%] border-r border-[#003c95]">Today&apos;s price</th>
                                        <th className="px-3 py-3 font-semibold w-[20%] border-r border-[#003c95]">Your choices</th>
                                        <th className="px-3 py-3 font-semibold text-center w-[10%] border-r border-[#003c95]">Select rooms</th>
                                        <th className="px-3 py-3 font-semibold text-center w-[20%]">Make Reservation</th>
                                    </tr>
                                </thead>
                                <tbody className="block lg:table-row-group lg:divide-y lg:divide-gray-200 border-b border-gray-300">
                                    
                                    {(!checkInDate || !checkOutDate || days <= 0) && (
                                        <tr className="block lg:table-row"><td colSpan={6} className="block lg:table-cell text-center py-8 text-gray-500 font-semibold">Please select your dates to see available rooms and prices.</td></tr>
                                    )}

                                    {(checkInDate && checkOutDate && days > 0 && displayableRoomOffers.length === 0) && (
                                        <tr className="block lg:table-row"><td colSpan={6} className="block lg:table-cell text-center py-8 text-gray-500">No rooms available for the selected dates or meal plan. Please try different options.</td></tr>
                                    )}

                                    {displayableRoomOffers.map((offer, overallOfferIndex) => {
                                        const category = property.categoryRooms?.find(cat => cat.id === offer.categoryId || cat._id === offer.categoryId);
                                        if (!category) return null;

                                        const offersForThisCategory = displayableRoomOffers.filter(o => o.categoryId === offer.categoryId);
                                        const offerIndexInCategory = offersForThisCategory.findIndex(o => o.offerId === offer.offerId);

                                        const currentQtySelected = selectedOffers[offer.offerId] || 0;
                                        const totalPriceForOfferNights = offer.pricePerNight * days;

                                        const maxSelectableForThisOffer = Math.min(
                                            category.qty - Object.keys(selectedOffers).filter(id => id.startsWith(category._id! || category.id!) && id !== offer.offerId).reduce((sum, id) => sum + selectedOffers[id], 0),
                                            MAX_COMBINED_ROOMS - (totalSelectedPhysicalRooms - currentQtySelected)
                                        );

                                        return (
                                            <tr key={offer.offerId} className={`block p-4 border rounded-lg mb-4 lg:p-0 lg:table-row lg:border-none lg:mb-0 ${currentQtySelected > 0 ? 'bg-blue-50' : 'bg-white'}`}>
                                                {/* --- Category Info Cell (Row-spanned) --- */}
                                                {offerIndexInCategory === 0 && (
                                                    <td className="block border-b pb-4 mb-4 lg:border-b-0 lg:pb-0 lg:mb-0 lg:table-cell lg:px-4 lg:py-3 lg:align-top lg:border-r" rowSpan={offersForThisCategory.length}>
                                                        {/* ... Category image, title, and details JSX remains the same ... */}
                                                        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden cursor-pointer group mb-3 shadow-sm" onClick={() => handleCategoryTitleClick(category)}>
                                                            <CldImage src={category.categoryImages?.[0]?.publicId || '/images/placeholder-property.png'} alt={`Image of ${category.title}`} layout="fill" objectFit="cover" />
                                                            {category.categoryImages && category.categoryImages.length > 0 && <div className="absolute bottom-2 left-2 bg-white/90 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"> {category.categoryImages.length} PHOTOS </div>}
                                                        </div>
                                                        <h3 className="font-bold text-gray-800 text-xl">{offer.categoryTitle}</h3>
                                                        <div className="mt-3 p-1.5 bg-green-50 border border-green-200 rounded-sm text-xs text-green-700 flex items-center">
                                                            <UserCheck size={14} className="mr-1.5 shrink-0"/> Recommended for {offer.intendedAdults} adult{offer.intendedAdults > 1 ? 's' : ''}
                                                        </div>
                                                    </td>
                                                )}
                                                
                                                <td className="block py-2 border-b lg:border-b-0 lg:table-cell lg:px-3 lg:py-3 lg:align-top lg:text-center lg:border-r"> <div className="flex items-center lg:justify-center">{[...Array(offer.intendedAdults)].map((_, i) => <UsersIcon key={i} size={18} className="text-gray-600"/>)}</div> <p className="text-sm font-bold text-gray-700 mt-1">{offer.intendedAdults} {offer.intendedAdults === 1 ? 'person' : 'people'}</p> </td>
                                                <td className="block py-2 border-b lg:border-b-0 lg:table-cell lg:px-3 lg:py-3 lg:align-top lg:border-r"><p className="text-lg font-bold text-gray-800">{currencySymbol} {totalPriceForOfferNights.toLocaleString()}</p><p className="text-[11px] text-gray-500">+ taxes & charges</p></td>
                                                <td className="block py-2 border-b lg:border-b-0 lg:table-cell lg:px-3 lg:py-3 lg:align-top text-xs space-y-1.5 lg:border-r">
                                                    <span className="text-sm font-semibold text-gray-500 lg:hidden">Your choices include:</span>
                                                    <div className="mt-1 lg:mt-0">
                                                        <p className="flex items-center font-semibold"> {selectedMealPlan === 'breakfastOnly' ? <CoffeeIconLucide size={14} className="mr-1.5 shrink-0 text-gray-600" /> : selectedMealPlan === 'allMeals' ? <Utensils size={14} className="mr-1.5 shrink-0 text-gray-600" /> : <Bed size={14} className="mr-1.5 shrink-0 text-gray-600" /> } <span className="flex-grow"> {selectedMealPlan === 'breakfastOnly' ? 'Very good breakfast included' : selectedMealPlan === 'allMeals' ? 'Breakfast & dinner included' : 'Room only accommodation'} </span> <HelpCircle size={13} className="ml-1 text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0" aria-label={`This offer is for ${selectedMealPlan === 'noMeal' ? 'room only' : selectedMealPlan === 'breakfastOnly' ? 'room with breakfast' : 'room with all meals'}.`} /> </p>
                                                        {property.reservationPolicy?.some(p => ['Free Cancellation', 'Flexible', 'Moderate'].includes(p)) && ( <p className="flex items-center text-green-600"> <CheckCircle size={14} className="mr-1.5 shrink-0" /> Free cancellation <span className="text-gray-500 ml-1 text-[10px]">(before specific date/time - check details)</span> </p> )}
                                                        {property.reservationPolicy?.includes('Pay at Property') && ( <p className="flex items-center text-green-600"> <CheckCircle size={14} className="mr-1.5 shrink-0" /> No prepayment needed <span className="text-gray-500 ml-1 text-[10px]"> – pay at the property</span> </p> )}
                                                        {property.reservationPolicy?.some(p => ['Non-Refundable', 'Strict'].includes(p)) && !property.reservationPolicy?.some(p => ['Free Cancellation', 'Flexible', 'Moderate'].includes(p)) && ( <p className="flex items-center text-red-600 font-semibold"> <XCircle size={14} className="mr-1.5 shrink-0" /> Non-Refundable </p> )}
                                                    </div>
                                                </td>
                                                <td className="block py-2 border-b lg:border-b-0 lg:table-cell lg:px-3 lg:py-3 lg:align-top lg:text-center lg:border-r"><select value={currentQtySelected} onChange={(e) => handleOfferQuantityChange(offer.offerId, parseInt(e.target.value))} className="p-1.5 border rounded text-sm w-20" disabled={days <= 0 || maxSelectableForThisOffer < 0 || !!availabilityError}>{[...Array(Math.max(0, maxSelectableForThisOffer) + 1)].map((_, i) => <option key={i} value={i}>{i}</option>)}</select></td>

                                                {overallOfferIndex === 0 && (
                                                    <td className="lg:block pt-4 lg:pt-2 lg:table-cell lg:px-4 lg:py-3 lg:align-top hidden" rowSpan={displayableRoomOffers.length}>
                                                        {totalSelectedPhysicalRooms > 0 && <div className="mb-3 text-sm"><p className="font-semibold">{totalSelectedPhysicalRooms} room{totalSelectedPhysicalRooms > 1 && 's'}</p><p className="text-2xl font-bold">{currencySymbol} {totalBookingPricing.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p><p className="text-xs text-gray-500">for {days} night{days > 1 && 's'}</p></div>}
                                                        <button onClick={handleBookNowOrReserveClick} disabled={!checkInDate || !checkOutDate || days <= 0 || totalSelectedPhysicalRooms <= 0 || !!availabilityError || totalBookingPricing <=0 || !!bookingError} className="bg-[#003c95] text-white font-semibold py-2.5 px-5 rounded-md w-full disabled:bg-gray-300">I&apos;ll reserve</button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}

                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <GuestReviews
                        reviews={property?.review ?? []}
                    />

                    <HouseRules rules={property?.houseRules} />

                    <HotelFacilities
                        hotelName={property.title ?? ''}
                        facilities={property.facilities ?? []}
                        amenities={property.amenities ?? []}
                    />

                </div>
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 bg-white p-3 border-t shadow-lg lg:hidden z-40">
                {totalSelectedPhysicalRooms > 0 && days > 0 && (
                    <div className="text-right mb-2">
                        <span className="text-sm">Total for {days} night{days > 1 && 's'}: </span>
                        <span className="text-xl font-bold">{currencySymbol} {totalBookingPricing.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                )}
                <button onClick={handleBookNowOrReserveClick} disabled={!checkInDate || !checkOutDate || days <= 0 || totalSelectedPhysicalRooms <= 0 || !!availabilityError || totalBookingPricing <=0 || !!bookingError} className="bg-[#003c95] text-white font-bold py-3 rounded-md w-full disabled:bg-gray-400">Reserve</button>
            </div>
            {modalData && <ImageGalleryModal title={modalData.title} images={modalData.images} onClose={() => setModalData(null)} />}
        </>
    );
}