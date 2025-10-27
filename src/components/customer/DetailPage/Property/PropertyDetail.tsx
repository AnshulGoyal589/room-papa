'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Coffee as CoffeeIconLucide, CheckCircle, Users as UsersIcon, CalendarOff,
    AlertTriangle, Bed,
    Utensils,
    UserCheck,
    Home,
    X,
    HelpCircle,
} from 'lucide-react';
import { CldImage } from 'next-cloudinary';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { Property } from '@/lib/mongodb/models/Property';
import { DisplayableRoomOffer, HikePricingByOccupancy } from '@/types/booking';
import { Image as PropertyImage } from '@/lib/mongodb/models/Components';
import { GuestReviews } from './Reviews';
import { HotelFacilities } from './HotelFacilities';
import PropertyHeader from './PropertyHeader';
import ImageGalleryAndMap from './ImageGalleryAndMap';
import AboutProperty from './AboutProperty';
import { PricingByMealPlan, RoomCategory } from '@/types/property';
import { HouseRules } from './HouseRules';
import { ImageGalleryModal } from './ImageModal';
import { calculateDays, getDatesInRange, getPrice, validateDate } from './Helper';

const LOCAL_STORAGE_KEY = process.env.NEXT_LOCAL_STORAGE_KEY || "propertyBookingPreferences_v3";
const RESERVATION_DATA_KEY = process.env.NEXT_RESERVATION_DATA_KEY || "reservationData_v1";
const MAX_COMBINED_ROOMS = parseInt(process.env.NEXT_MAX_COMBINED_ROOMS || '5', 10);
const MAX_OCCUPANTS_PER_ROOM = parseInt(process.env.NEXT_MAX_OCCUPANTS_PER_ROOM || '3', 10);
const SERVICE_FEE_FIXED = parseFloat(process.env.NEXT_SERVICE_FEE_FIXED || '10');
const TAX_RATE_PERCENTAGE = parseFloat(process.env.NEXT_TAX_RATE_PERCENTAGE || '0.05');

// Helper to safely extract price from potentially partial meal plan pricing (used for Per Unit)
const getPricePerUnit = (pricing: PricingByMealPlan | Partial<PricingByMealPlan> | undefined, mealPlan: keyof PricingByMealPlan): number => {
    if (!pricing) return 0;
    return pricing[mealPlan] || 0;
};

export default function PropertyDetailPage({ property }: { property: Property | null }) {

    const { openSignIn } = useClerk();
    const router = useRouter();
    const { isSignedIn } = useUser();

    const [selectedBookingModel, setSelectedBookingModel] = useState<'perOccupancy' | 'perUnit'>('perOccupancy');

    const [checkInDate, setCheckInDate] = useState<Date | null>(null);
    const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
    const [adultCount, setAdultCount] = useState<number>(localStorage.getItem('adults') ? parseInt(localStorage.getItem('adults')!) : 1);
    const [childCount, setChildCount] = useState<number>(localStorage.getItem('children') ? parseInt(localStorage.getItem('children')!) : 0);
    const [selectedOffers, setSelectedOffers] = useState<Record<string, number>>({});
    const [selectedMealPlan, setSelectedMealPlan] = useState<keyof PricingByMealPlan>('breakfastOnly');
    const [availabilityError, setAvailabilityError] = useState<string | null>(null);
    const [bookingError, setBookingError] = useState<string | null>(null);
    const [modalData, setModalData] = useState<{ title: string; images: PropertyImage[] } | null>(null);

    const days = useMemo(() => calculateDays(checkInDate, checkOutDate), [checkInDate, checkOutDate]);
    const totalSelectedPhysicalRooms = useMemo(() => Object.values(selectedOffers).reduce((sum, qty) => sum + qty, 0), [selectedOffers]);
    
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    
    const maxDateStr = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 2);
        return d.toISOString().split('T')[0];
    }, []);

    const handleCategoryTitleClick = (category: RoomCategory) => {
        setModalData({ title: category.title, images: category.categoryImages || [] });
    };

    const availableBookingModels = useMemo(() => {
        const models = new Set<RoomCategory['pricingModel']>();
        property?.categoryRooms?.forEach(cat => {
            models.add(cat.pricingModel || 'perOccupancy');
        });
        return Array.from(models);
    }, [property?.categoryRooms]);

    // --- State Initialization and Persistence Effects ---
    useEffect(() => {
        if (!property || typeof window === 'undefined') return;

        const storedPrefsStr = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedPrefsStr) {
            try {
                const parsedPrefs = JSON.parse(storedPrefsStr);
                const storedCheckIn = localStorage.getItem('checkIn');
                const storedCheckOut = localStorage.getItem('checkOut');
                
                if( storedCheckIn ) setCheckInDate( new Date(storedCheckIn) );
                if( storedCheckOut ) setCheckOutDate( new Date(storedCheckOut) );
                
                if (parsedPrefs.propertyId === property._id?.toString()) {
                    setCheckInDate( parsedPrefs.checkInDate ? validateDate(parsedPrefs.checkInDate) : null );
                    setCheckOutDate( parsedPrefs.checkOutDate ? validateDate(parsedPrefs.checkOutDate) : null );
                    setAdultCount(parsedPrefs.adultCount || localStorage.getItem('adults') || 1);
                    setChildCount(parseInt(parsedPrefs.childCount) || parseInt(localStorage.getItem('children') || '0', 10) || 0);
                    setSelectedOffers(parsedPrefs.selectedOffers || {});
                    setSelectedMealPlan(parsedPrefs.selectedMealPlan || 'breakfastOnly');
                    
                    let preferredModel = parsedPrefs.selectedBookingModel as 'perOccupancy' | 'perUnit' || 'perOccupancy';
                    if (availableBookingModels.length === 1) {
                         preferredModel = availableBookingModels[0] || 'perOccupancy';
                    } else if (!availableBookingModels.includes(preferredModel)) {
                        preferredModel = 'perOccupancy';
                    }
                    setSelectedBookingModel(preferredModel);

                    return;
                }
            } catch (e) { console.error("Failed to parse stored preferences:", e); }
        } else if (availableBookingModels.length === 1) {
            setSelectedBookingModel(availableBookingModels[0] || 'perOccupancy');
        }
    }, [property, availableBookingModels]);

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
                selectedBookingModel, 
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferencesToSave));
        }
    }, [checkInDate, checkOutDate, adultCount, childCount, selectedOffers, selectedMealPlan, property, selectedBookingModel]);
    
    // --- Availability Check (MODIFIED) ---
    const checkAvailabilityForSelection = useCallback((
        startDate: Date | null,
        endDate: Date | null,
        currentSelectedOffers: Record<string, number>,
        allCategories: RoomCategory[] | undefined
    ): { available: boolean; message: string | null } => {
        if (!startDate || !endDate || endDate <= startDate || !allCategories || Object.keys(currentSelectedOffers).length === 0) {
            return { available: true, message: null };
        }

        const bookingDates = getDatesInRange(startDate, endDate);
        if (bookingDates.length === 0) return { available: true, message: null };
        
        const involvedCategoryIds = new Set(Object.keys(currentSelectedOffers).map(offerId => offerId.split('_')[0]));

        for (const catId of Array.from(involvedCategoryIds)) {
            const category = allCategories.find(c => c.id === catId);
            if (!category) continue;

            const bookingStart = new Date(startDate); bookingStart.setHours(0, 0, 0, 0);
            const bookingEnd = new Date(endDate); bookingEnd.setHours(0, 0, 0, 0);

            if (category.availability && category.availability.length > 0) {
                const isAvailable = category.availability.some(period => {
                    const periodStart = new Date(period.startDate); periodStart.setHours(0, 0, 0, 0);
                    const periodEndExclusive = new Date(period.endDate); periodEndExclusive.setHours(23, 59, 59, 999);
                    return bookingStart >= periodStart && bookingEnd <= periodEndExclusive;
                });
                if (!isAvailable) {
                    return { available: false, message: `Room type "${category.title}" is not available for the selected dates. Please check its seasonal availability.` };
                }
            }

            // --- MODIFIED LOGIC FOR UNAVAILABLE PERIODS ---
            if (category.unavailableDates && category.unavailableDates.length > 0) {
                for (const dateStr of bookingDates) {
                    const currentDate = new Date(dateStr);
                    currentDate.setUTCHours(12); // Normalize to midday to avoid timezone shifts

                    const isBlocked = category.unavailableDates.some(period => {
                        const periodStart = new Date(period.startDate);
                        periodStart.setUTCHours(12);
                        const periodEnd = new Date(period.endDate);
                        periodEnd.setUTCHours(12);
                        return currentDate >= periodStart && currentDate <= periodEnd;
                    });

                    if (isBlocked) {
                        return { available: false, message: `Room type "${category.title}" is unavailable during your selected dates due to a blackout period.` };
                    }
                }
            }
        }
        return { available: true, message: null };
    }, []);

    // --- Displayable Room Offers Calculation (MODIFIED) ---
    const displayableRoomOffers = useMemo((): DisplayableRoomOffer[] => {
        if (!property?.categoryRooms || !checkInDate || !checkOutDate || days <= 0) return [];
        
        const currentModel = selectedBookingModel;
        const categoriesToProcess = property.categoryRooms.filter(
            cat => (cat.pricingModel) === currentModel
        );

        const offers: DisplayableRoomOffer[] = [];
        const bookingDateRange = getDatesInRange(checkInDate, checkOutDate);
        if (bookingDateRange.length === 0) return [];

        const getHikeAmount = (hikePricing: HikePricingByOccupancy, occupancyType: keyof HikePricingByOccupancy, mealPlan: keyof PricingByMealPlan): number => {
            const hikeGroup = hikePricing?.[occupancyType];
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (hikeGroup && typeof hikeGroup === 'object' && mealPlan in hikeGroup) ? (hikeGroup as any)[mealPlan] : 0;
        };

        categoriesToProcess.forEach(cat => {            
            const bookingStart = new Date(checkInDate); bookingStart.setHours(0,0,0,0);
            const bookingEnd = new Date(checkOutDate); bookingEnd.setHours(0,0,0,0);
            
            if (cat.availability && cat.availability.length > 0) {
                const isAvailable = cat.availability.some(period => {
                    const periodStart = new Date(period.startDate); periodStart.setHours(0,0,0,0);
                    const periodEndExclusive = new Date(period.endDate); periodEndExclusive.setHours(23,59,59,999);
                    return bookingStart >= periodStart && bookingEnd <= periodEndExclusive;
                });
                if (!isAvailable) return;
            }
            
            if (cat.unavailableDates && cat.unavailableDates.length > 0) {
                const isBlocked = bookingDateRange.some(dateStr => {
                    const currentDate = new Date(dateStr);
                    currentDate.setUTCHours(12); // Normalize to midday

                    return cat.unavailableDates.some(period => {
                        const periodStart = new Date(period.startDate);
                        periodStart.setUTCHours(12);
                        const periodEnd = new Date(period.endDate);
                        periodEnd.setUTCHours(12);
                        return currentDate >= periodStart && currentDate <= periodEnd;
                    });
                });
    
                if (isBlocked) {
                    return; // Skip creating an offer for this category
                }
            }

            // --- PER UNIT LOGIC ---
            if (currentModel === 'perUnit') {
                const totalOccupancy = cat.totalOccupancy || 1;
                
                const basePrice = getPricePerUnit(cat.totalOccupancyPrice, selectedMealPlan);
                const discountedPrice = getPricePerUnit(cat.discountedTotalOccupancyPrice, selectedMealPlan);
                const occupancyType: keyof HikePricingByOccupancy | null = null;
                
                if (basePrice === 0) return;

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
                

                offers.push({
                    offerId: `${cat.id}_unit`,
                    categoryId: cat.id,
                    categoryTitle: cat.title,
                    bedConfiguration: cat.bedConfiguration,
                    roomSpecificAmenities: cat.roomSpecificAmenities,
                    maxPhysicalRoomsForCategory: 1, 
                    intendedAdults: totalOccupancy, 
                    intendedChildren: 0,
                    guestCapacityInOffer: totalOccupancy,
                    pricePerNight: finalBasePrice + averageHikePerNight,
                    originalPricePerNight: originalPriceForCalc ? originalPriceForCalc + averageHikePerNight : undefined,
                    isDiscounted: isDisc,
                    currency: cat.currency,
                    roomSize: cat.roomSize || "Unknown",
                    categoryActivities: cat.categoryActivities,
                    categoryFacilities: cat.categoryFacilities,
                });
                return; 
            }

            // --- PER OCCUPANCY LOGIC (Default) ---
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
                            offerId: `${cat.id}_${numAdults}guests`,
                            categoryId: cat.id,
                            categoryTitle: cat.title,
                            bedConfiguration: cat.bedConfiguration,
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
    }, [property?.categoryRooms, selectedMealPlan, checkInDate, checkOutDate, days, selectedBookingModel]);
    
    // --- Total Booking Pricing Calculation ---
    const { totalBookingPricing, subtotalNights, serviceCharge, taxesApplied, totalCapacityNeeded } = useMemo(() => {
        if (totalSelectedPhysicalRooms === 0 || days <= 0 || !property) {
            return { totalBookingPricing: 0, subtotalNights: 0, serviceCharge: 0, taxesApplied: 0, totalCapacityNeeded: 0 };
        }

        let pricePerNight = 0;
        let capacityAvailable = 0;
        const totalGuests = adultCount + childCount;
        const currentModel = selectedBookingModel;
        
        const roomInstances: { category: RoomCategory, offer: DisplayableRoomOffer }[] = [];

        Object.entries(selectedOffers).forEach(([offerId, qty]) => {
            const offer = displayableRoomOffers.find(o => o.offerId === offerId);
            const category = property.categoryRooms?.find(c => c.id === offer?.categoryId);
            if (offer && category && qty > 0) {
                pricePerNight += offer.pricePerNight * qty;
                capacityAvailable += offer.guestCapacityInOffer * qty;
                for (let i = 0; i < qty; i++) roomInstances.push({ category, offer });
            }
        });

        // 1. Capacity Check for Per Unit
        if (currentModel === 'perUnit' && totalGuests > capacityAvailable) {
             setTimeout(() => {
                 setBookingError(`Capacity Error: The selected unit capacity (${capacityAvailable} guests) is less than the total guests (${totalGuests}).`);
             }, 0);
             return { totalBookingPricing: 0, subtotalNights: 0, serviceCharge: 0, taxesApplied: 0, totalCapacityNeeded: 0 };
        }
        
        let childrenPriceComponent = 0;
        let remainingChildren = childCount;

        if (currentModel === 'perOccupancy') {
            
            if (remainingChildren > 0) {
                for (const instance of roomInstances) {
                    if (remainingChildren === 0) break;
                    const capacityForChildren = MAX_OCCUPANTS_PER_ROOM - instance.offer.intendedAdults;
                    const childrenToAssign = Math.min(remainingChildren, capacityForChildren);
                    
                    if (childrenToAssign > 0) {
                        let childPrice = getPrice(instance.category.pricing.discountedChild5to12Price, selectedMealPlan);
                        if (childPrice === 0) childPrice = getPrice(instance.category.pricing.child5to12Price, selectedMealPlan);
                        
                        childrenPriceComponent += childPrice * childrenToAssign;
                        remainingChildren -= childrenToAssign;
                    }
                }
            }
            // If children cannot be assigned
            if (remainingChildren > 0) {
                 setTimeout(() => {
                    setBookingError(`Occupancy Error: Cannot assign all ${childCount} children to the selected rooms due to occupancy limits.`);
                 }, 0);
                 return { totalBookingPricing: 0, subtotalNights: 0, serviceCharge: 0, taxesApplied: 0, totalCapacityNeeded: 0 };
            }
        }
        
        pricePerNight += childrenPriceComponent;
        
        if (pricePerNight <= 0 && totalSelectedPhysicalRooms > 0) {
            setTimeout(() => {
                setBookingError("Price Calculation Error: Could not determine a valid nightly rate for the selection.");
            }, 0);
             return { totalBookingPricing: 0, subtotalNights: 0, serviceCharge: 0, taxesApplied: 0, totalCapacityNeeded: 0 };
        }

        const currentSubtotalNights = pricePerNight * days;
        const currentServiceCharge = SERVICE_FEE_FIXED * days;
        const currentTaxes = (currentSubtotalNights + currentServiceCharge) * TAX_RATE_PERCENTAGE;
        const currentTotal = currentSubtotalNights + currentServiceCharge + currentTaxes;
        
        return { totalBookingPricing: currentTotal, subtotalNights: currentSubtotalNights, serviceCharge: currentServiceCharge, taxesApplied: currentTaxes, totalCapacityNeeded: capacityAvailable };

    }, [selectedOffers, displayableRoomOffers, days, adultCount, childCount, property, totalSelectedPhysicalRooms, selectedMealPlan, selectedBookingModel]);


    // Cleanup capacity/pricing errors if booking becomes valid
    useEffect(() => {
        if (totalBookingPricing > 0 && bookingError && bookingError.includes('Error:')) {
            setBookingError(null);
        }
    }, [totalBookingPricing, bookingError]);


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
        setBookingError(null); 
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
        setBookingError(null); 
    };

    const handleOfferQuantityChange = (offerId: string, quantity: number) => {
        
        if (selectedBookingModel === 'perUnit') {
            const isSelecting = quantity > 0;
            
            // Per Unit: Only allow selection if no unit is currently selected, or if we are deselecting the current one.
            if (isSelecting) {
                if (totalSelectedPhysicalRooms > 0 && !selectedOffers[offerId]) {
                    setBookingError("Selection Error: You can only select one entire property unit at a time.");
                    setTimeout(() => setBookingError(null), 3000);
                    return;
                }
            }
            
            const newSelectedOffers = isSelecting ? { [offerId]: 1 } : {};
            
            setSelectedOffers(newSelectedOffers);
            if (!bookingError?.includes('Error:')) setBookingError(null); 

            const { available, message } = checkAvailabilityForSelection(checkInDate, checkOutDate, newSelectedOffers, property?.categoryRooms);
            setAvailabilityError(available ? null : message);
            return; 
        }

        // --- PER OCCUPANCY LOGIC ---
        const categoryId = offerId.split('_')[0];
        const category = property?.categoryRooms?.find(cat => cat.id === categoryId);
        if (!category) return;

        const newQty = Math.max(0, quantity);
        const newSelectedOffers = { ...selectedOffers };
        if (newQty === 0) delete newSelectedOffers[offerId];
        else newSelectedOffers[offerId] = newQty;

        const qtyForThisCategory = Object.keys(newSelectedOffers).filter(id => id.startsWith(categoryId)).reduce((sum, id) => sum + newSelectedOffers[id], 0);
        const totalRoomsOverall = Object.values(newSelectedOffers).reduce((sum, q) => sum + q, 0);
        
        if (qtyForThisCategory > category.qty || totalRoomsOverall > MAX_COMBINED_ROOMS) {
            setBookingError(qtyForThisCategory > category.qty 
                ? `Max ${category.qty} rooms for "${category.title}".` 
                : `Max ${MAX_COMBINED_ROOMS} rooms total.`);
            setTimeout(() => setBookingError(null), 3000);
            return;
        }
        
        setSelectedOffers(newSelectedOffers);
        if (!bookingError?.includes('Error:')) setBookingError(null); 
        
        const { available, message } = checkAvailabilityForSelection(checkInDate, checkOutDate, newSelectedOffers, property?.categoryRooms);
        setAvailabilityError(available ? null : message);
    };
    
    const handleBookingModelSwitch = (model: 'perOccupancy' | 'perUnit') => {
        setSelectedOffers({}); 
        setSelectedBookingModel(model);
        setBookingError(null);
        setAvailabilityError(null);
    };

    const handleBookNowOrReserveClick = () => {
        if (!isSignedIn) { openSignIn({ redirectUrl: window.location.href }); return; }
        if (!checkInDate || !checkOutDate || days <= 0) { setBookingError("Please select valid check-in and check-out dates."); return; }
        if (totalSelectedPhysicalRooms <= 0) { setBookingError("Please select at least one room/unit."); return; }
        if (availabilityError) return;
        
        if (totalBookingPricing <= 0) { 
             if (!bookingError) setBookingError("Could not calculate a valid price for the selection. Please check dates and selections.");
             return; 
        }

        const totalGuests = adultCount + childCount;

        if (selectedBookingModel === 'perUnit' && totalGuests > totalCapacityNeeded) {
             setBookingError(`The selected unit(s) can only accommodate ${totalCapacityNeeded} guests, but you selected ${totalGuests}.`);
             return;
        }
        
        setBookingError(null);
        
        const reservationData = {
            propertyId: property?._id,
            checkInDate: checkInDate?.toISOString(),
            checkOutDate: checkOutDate?.toISOString(),
            days,
            adultCount,
            childCount,
            selectedOffers,
            selectedMealPlan,
            selectedBookingModel, 
            pricingDetails: { subtotalNights, serviceCharge, taxesApplied, totalBookingPricing, currency: property?.costing?.currency || 'INR' },
        };
        localStorage.setItem(RESERVATION_DATA_KEY, JSON.stringify(reservationData));
        router.push(`/customer/book/${property?._id}`);
    };

    if (!property) return <div className="container mx-auto px-4 py-16 text-center"><h2 className="text-2xl font-bold text-red-600">Property Not Found</h2><p>This property may no longer be available.</p></div>;

    const currencySymbol = property.costing?.currency === 'INR' ? '₹' : (property.costing?.currency === 'USD' ? '$' : (property.costing?.currency || '$'));
    
    const needsModelSwitch = availableBookingModels.length > 1;

    const occupancyHeader = selectedBookingModel === 'perUnit' ? 'Total Unit Capacity' : 'Number of guests';
    const selectionLabel = selectedBookingModel === 'perUnit' ? 'Select Unit' : 'Select rooms';
    const roomTypeLabel = selectedBookingModel === 'perUnit' ? 'Unit/Villa Type' : 'Room type';
    const roomCountLabel = totalSelectedPhysicalRooms === 1 && selectedBookingModel === 'perUnit' ? '1 entire unit' : `${totalSelectedPhysicalRooms} room${totalSelectedPhysicalRooms > 1 ? 's' : ''}`;

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
                    
                    <AboutProperty description={property.description} />

                    <div className="bg-white rounded-md border border-gray-300 mb-6">
                        
                        {needsModelSwitch && (
                            <div className="p-4 border-b border-gray-200 bg-blue-50">
                                <h3 className="text-md font-bold mb-3 text-gray-800 flex items-center"><HelpCircle size={16} className="mr-2 text-[#003c95]" /> Choose Booking Style</h3>
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => handleBookingModelSwitch('perOccupancy')}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors border ${selectedBookingModel === 'perOccupancy' ? 'bg-[#003c95] text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        <UsersIcon size={14} className="inline mr-1 mb-0.5" /> Book by Occupancy
                                    </button>
                                    <button
                                        onClick={() => handleBookingModelSwitch('perUnit')}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors border ${selectedBookingModel === 'perUnit' ? 'bg-[#003c95] text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        <Home size={14} className="inline mr-1 mb-0.5" /> Book the Entire Unit/Property
                                    </button>
                                </div>
                                {selectedBookingModel === 'perUnit' && (
                                    <p className="text-xs mt-2 p-2 bg-yellow-50 text-gray-700 rounded-md flex items-center"><AlertTriangle size={14} className="mr-1 text-yellow-500 shrink-0" /> This mode reserves the entire selected unit/property. You will be reserving the whole property.</p>
                                )}
                            </div>
                        )}


                        <div className="bg-gray-50 p-4 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800 mb-3">
                                {selectedBookingModel === 'perUnit' ? 'Select your unit' : 'Select your rooms'}
                            </h2>
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
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Preferred Meal Plan (for all {selectedBookingModel === 'perUnit' ? 'units' : 'rooms'}):</label>
                                <div className="flex flex-wrap gap-2"> {(['noMeal', 'breakfastOnly', 'allMeals'] as (keyof PricingByMealPlan)[]).map(plan => { const labelText = { noMeal: 'Room Only', breakfastOnly: 'Breakfast', allMeals: 'All Meals'}[plan]; return ( <label key={`meal-plan-table-${plan}`} className={`flex items-center px-2.5 py-1 border rounded-md cursor-pointer transition-colors text-xs ${selectedMealPlan === plan ? 'bg-[#003c95] border-[#003c95] ring-1 ring-[#003c95]' : 'border-gray-300 hover:bg-gray-100'}`}> <input type="radio" name="mealPlanTable" value={plan} checked={selectedMealPlan === plan} onChange={(e) => setSelectedMealPlan(e.target.value as keyof PricingByMealPlan)} className="h-3 w-3 text-[#white] border-gray-300 focus:ring-[#003c95] mr-1.5" /> <span className={`${selectedMealPlan === plan ? 'text-white font-semibold' : 'text-gray-600'}`}>{labelText}</span> </label> ); })} </div>
                            </div>
                            {availabilityError && <div className="mt-3 p-2 bg-yellow-100 text-yellow-800 text-xs rounded-md border border-yellow-300 flex items-start"><CalendarOff className='h-3.5 w-3.5 mr-1.5 shrink-0 text-yellow-600 mt-px'/><p>{availabilityError}</p></div>}
                            {bookingError && <div id="main-page-booking-error" className="mt-3 p-2 bg-red-100 text-red-700 text-xs rounded-md border border-red-300 flex items-start"><AlertTriangle className='h-3.5 w-3.5 mr-1.5 shrink-0 text-red-500 mt-px'/><p>{bookingError}</p></div>}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="hidden lg:table-header-group bg-[#003c95] text-left text-base text-white uppercase">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold w-[25%] border-r border-[#003c95]">{roomTypeLabel}</th>
                                        <th className="px-3 py-3 font-semibold text-center w-[10%] border-r border-[#003c95]">{occupancyHeader}</th>
                                        <th className="px-3 py-3 font-semibold w-[15%] border-r border-[#003c95]">Today&apos;s price</th>
                                        <th className="px-3 py-3 font-semibold w-[20%] border-r border-[#003c95]">Your choices</th>
                                        <th className="px-3 py-3 font-semibold text-center w-[10%] border-r border-[#003c95]">{selectionLabel}</th>
                                        <th className="px-3 py-3 font-semibold text-center w-[20%]">Make Reservation</th>
                                    </tr>
                                </thead>
                                <tbody className="block lg:table-row-group lg:divide-y lg:divide-gray-200 border-b border-gray-300">
                                    
                                    {(!checkInDate || !checkOutDate || days <= 0) && (
                                        <tr className="block lg:table-row"><td colSpan={6} className="block lg:table-cell text-center py-8 text-gray-500 font-semibold">Please select your dates to see available rooms and prices.</td></tr>
                                    )}

                                    {(checkInDate && checkOutDate && days > 0 && displayableRoomOffers.length === 0) && (
                                        <tr className="block lg:table-row"><td colSpan={6} className="block lg:table-cell text-center py-8 text-gray-500">No {selectedBookingModel === 'perUnit' ? 'units' : 'rooms'} available for the selected dates or meal plan in this model. Please try different options.</td></tr>
                                    )}

                                    {displayableRoomOffers.map((offer, overallOfferIndex) => {
                                        const category = property.categoryRooms?.find(cat => cat.id === offer.categoryId);
                                        if (!category) return null;

                                        const offersForThisCategory = displayableRoomOffers.filter(o => o.categoryId === offer.categoryId);
                                        const offerIndexInCategory = offersForThisCategory.findIndex(o => o.offerId === offer.offerId);

                                        const currentQtySelected = selectedOffers[offer.offerId] || 0;
                                        const totalPriceForOfferNights = offer.pricePerNight * days;
                                        
                                        const maxSelectableForThisOffer = offer.maxPhysicalRoomsForCategory; // Simplified, used only for perOccupancy UI

                                        return (
                                            <tr key={offer.offerId} className={`block p-4 border rounded-lg mb-4 lg:p-0 lg:table-row lg:border-none lg:mb-0 ${currentQtySelected > 0 ? 'bg-blue-50' : 'bg-white'}`}>
                                                
                                                {(selectedBookingModel === 'perUnit' || offerIndexInCategory === 0) && (
                                                    <td className="block border-b pb-4 mb-4 lg:border-b-0 lg:pb-0 lg:mb-0 lg:table-cell lg:px-4 lg:py-3 lg:align-top lg:border-r" rowSpan={selectedBookingModel === 'perOccupancy' ? offersForThisCategory.length : 1}>
                                                        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden cursor-pointer group mb-3 shadow-sm" onClick={() => handleCategoryTitleClick(category)}>
                                                            <CldImage src={category.categoryImages?.[0]?.url || '/images/placeholder-property.png'} alt={`Image of ${category.title}`} layout="fill" objectFit="cover" />
                                                            {category.categoryImages && category.categoryImages.length > 0 && <div className="absolute bottom-2 left-2 bg-white/90 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"> {category.categoryImages.length} PHOTOS </div>}
                                                        </div>
                                                        <h3 className="font-bold text-gray-800 text-xl">{offer.categoryTitle}</h3>
                                                        <div className="mt-3 p-1.5 bg-green-50 border border-green-200 rounded-sm text-xs text-green-700 flex items-center">
                                                            {selectedBookingModel === 'perUnit' ? (
                                                                <><Home size={14} className="mr-1.5 shrink-0"/> Unit capacity: {offer.guestCapacityInOffer} guests</>
                                                            ) : (
                                                                <><UserCheck size={14} className="mr-1.5 shrink-0"/> Recommended for {offer.intendedAdults} adult{offer.intendedAdults > 1 ? 's' : ''}</>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                                
                                                <td className="block py-2 border-b lg:border-b-0 lg:table-cell lg:px-3 lg:py-3 lg:align-top lg:text-center lg:border-r"> 
                                                    {selectedBookingModel === 'perUnit' ? (
                                                        <p className="text-lg font-bold text-gray-700 mt-1">{offer.guestCapacityInOffer}</p>
                                                    ) : (
                                                        <div className="flex items-center lg:justify-center">{[...Array(offer.intendedAdults)].map((_, i) => <UsersIcon key={i} size={18} className="text-gray-600"/>)}</div>
                                                    )}
                                                </td>

                                                <td className="block py-2 border-b lg:border-b-0 lg:table-cell lg:px-3 lg:py-3 lg:align-top lg:border-r"><p className="text-lg font-bold text-gray-800">{currencySymbol} {totalPriceForOfferNights.toLocaleString()}</p><p className="text-[11px] text-gray-500">+ taxes & charges</p></td>
                                                
                                                <td className="block py-2 border-b lg:border-b-0 lg:table-cell lg:px-3 lg:py-3 lg:align-top text-xs space-y-1.5 lg:border-r">
                                                    <span className="text-sm font-semibold text-gray-500 lg:hidden">Your choices include:</span>
                                                    <div className="mt-1 lg:mt-0">
                                                        <p className="flex items-center font-semibold"> {selectedMealPlan === 'breakfastOnly' ? <CoffeeIconLucide size={14} className="mr-1.5 shrink-0 text-gray-600" /> : selectedMealPlan === 'allMeals' ? <Utensils size={14} className="mr-1.5 shrink-0 text-gray-600" /> : <Bed size={14} className="mr-1.5 shrink-0 text-gray-600" /> } <span className="flex-grow"> {selectedMealPlan === 'breakfastOnly' ? 'Very good breakfast included' : selectedMealPlan === 'allMeals' ? 'Breakfast & dinner included' : 'Room only accommodation'} </span> <HelpCircle size={13} className="ml-1 text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0" aria-label={`This offer is for ${selectedMealPlan === 'noMeal' ? 'room only' : selectedMealPlan === 'breakfastOnly' ? 'room with breakfast' : 'room with all meals'}.`} /> </p>
                                                        {property.reservationPolicy?.some(p => ['Free Cancellation', 'Flexible', 'Moderate'].includes(p)) && ( <p className="flex items-center text-green-600"> <CheckCircle size={14} className="mr-1.5 shrink-0" /> Free cancellation <span className="text-gray-500 ml-1 text-[10px]">(before specific date/time - check details)</span> </p> )}
                                                        {property.reservationPolicy?.includes('Pay at Property') && ( <p className="flex items-center text-green-600"> <CheckCircle size={14} className="mr-1.5 shrink-0" /> No prepayment needed <span className="text-gray-500 ml-1 text-[10px]"> – pay at the property</span> </p> )}
                                                        {property.reservationPolicy?.some(p => ['Non-Refundable', 'Strict'].includes(p)) && !property.reservationPolicy?.some(p => ['Free Cancellation', 'Flexible', 'Moderate'].includes(p)) && ( <p className="flex items-center text-red-600 font-semibold"> <UsersIcon size={14} className="mr-1.5 shrink-0" /> Non-Refundable </p> )}
                                                    </div>
                                                </td>

                                                {/* Select Quantity / Select Unit Button (CRUCIAL CHANGE) */}
                                                <td className="block py-2 border-b lg:border-b-0 lg:table-cell lg:px-3 lg:py-3 lg:align-top lg:text-center lg:border-r">
                                                    {selectedBookingModel === 'perUnit' ? (
                                                        currentQtySelected > 0 ? (
                                                            <button 
                                                                onClick={() => handleOfferQuantityChange(offer.offerId, 0)}
                                                                className="bg-red-500 text-white font-semibold py-1.5 px-3 rounded text-sm hover:bg-red-600 flex items-center justify-center mx-auto"
                                                                disabled={!!availabilityError}
                                                            >
                                                                <X size={16} className="mr-1"/> Remove Unit
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleOfferQuantityChange(offer.offerId, 1)}
                                                                // Disabled if dates are bad OR availability is bad OR another unit is already selected
                                                                className={`font-semibold py-1.5 px-3 rounded text-sm mx-auto ${days <= 0 || !!availabilityError || totalSelectedPhysicalRooms > 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
                                                                disabled={days <= 0 || !!availabilityError || totalSelectedPhysicalRooms > 0}
                                                            >
                                                                Select Unit
                                                            </button>
                                                        )
                                                    ) : (
                                                        // Per Occupancy: Standard room quantity selector
                                                        <select value={currentQtySelected} onChange={(e) => handleOfferQuantityChange(offer.offerId, parseInt(e.target.value))} className="p-1.5 border rounded text-sm w-20" disabled={days <= 0 || maxSelectableForThisOffer < 0 || !!availabilityError}>
                                                            {[...Array(Math.max(0, maxSelectableForThisOffer) + 1)].map((_, i) => 
                                                                <option key={i} value={i}>{i}</option>
                                                            )}
                                                        </select>
                                                    )}
                                                </td>

                                                {/* Reservation Button (Spanned) */}
                                                {overallOfferIndex === 0 && (
                                                    <td className="lg:block pt-4 lg:pt-2 lg:table-cell lg:px-4 lg:py-3 lg:align-top hidden" rowSpan={displayableRoomOffers.length}>
                                                        {totalSelectedPhysicalRooms > 0 && days > 0 && <div className="mb-3 text-sm"><p className="font-semibold">{roomCountLabel}</p><p className="text-2xl font-bold">{currencySymbol} {totalBookingPricing.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p><p className="text-xs text-gray-500">for {days} night{days > 1 && 's'}</p></div>}
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
                    
                    <GuestReviews reviews={property?.review ?? []} />
                    <HouseRules rules={property?.houseRules} />
                    <HotelFacilities hotelName={property.title ?? ''} facilities={property.facilities ?? []} amenities={property.amenities ?? []} />

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