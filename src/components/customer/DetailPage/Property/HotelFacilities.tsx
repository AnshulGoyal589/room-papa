
import { allPropertyFacilities, FacilityCategory, FacilityDetail } from '@/types/property';
import React from 'react';
import { FaUtensils, FaWifi, FaParking, FaSwimmingPool, FaConciergeBell, FaBed, FaBath, FaDesktop, FaBicycle, FaBriefcase, FaInfoCircle, FaGlobe, FaAccessibleIcon, FaChartBar, FaCheck } from 'react-icons/fa';


const FACILITY_CATEGORIES: Record<FacilityCategory, { icon: React.ReactNode; order: number }> = {
  'Most Popular': { icon: <FaChartBar />, order: 1 },
  'Food & Drink': { icon: <FaUtensils />, order: 2 },
  'Pool & Spa': { icon: <FaSwimmingPool />, order: 3 },
  'Internet': { icon: <FaWifi />, order: 4 },
  'Parking': { icon: <FaParking />, order: 5 },
  'Services': { icon: <FaConciergeBell />, order: 6 },
  'General': { icon: <FaInfoCircle />, order: 7 },
  'Activities': { icon: <FaBicycle />, order: 8 },
  'Business': { icon: <FaBriefcase />, order: 9 },
  'Bathroom': { icon: <FaBath />, order: 10 },
  'Bedroom': { icon: <FaBed />, order: 11 },
  'Media & Technology': { icon: <FaDesktop />, order: 12 },
  'Accessibility': { icon: <FaAccessibleIcon />, order: 13 },
  'Languages': { icon: <FaGlobe />, order: 14 },
};



const normalizeFacilityName = (name: string): string => {
    const firstChar = name.charAt(0).toLowerCase();
    const rest = name.slice(1).replace(/\s+/g, '');
    return `${firstChar}${rest}`;
};

const FacilityListItem: React.FC<{ name: string }> = ({ name }) => (
    <li className="flex items-start text-sm text-gray-700">
        <FaCheck className="text-green-600 w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
        <span>{name}</span>
    </li>
);

const FacilityCategoryCard: React.FC<{ title: string; icon: React.ReactNode; items: FacilityDetail[] }> = ({ title, icon, items }) => (
    <div>
        <div className="flex items-center mb-3">
            <div className="text-gray-600 text-xl mr-3">{icon}</div>
            <h3 className="font-bold text-gray-800">{title}</h3>
        </div>
        <ul className="space-y-2">
            {items.map(item => <FacilityListItem key={item.id} name={item.displayName} />)}
        </ul>
    </div>
);


interface HotelFacilitiesProps {
    hotelName: string;
    facilities: string[];
    amenities: string[];
}

export const HotelFacilities: React.FC<HotelFacilitiesProps> = ({ hotelName, facilities, amenities }) => {
    const availableFacilityIds = new Set([
        ...facilities,
        ...amenities.map(normalizeFacilityName)
    ]);

    const availableFacilities = allPropertyFacilities.filter(facility => availableFacilityIds.has(facility.id));

    const topItems = availableFacilities.filter(f => f.isTopFeature);
    const popularItems = availableFacilities.filter(f => f.isPopular);
    
    const facilitiesByCategory = availableFacilities.reduce<Record<string, FacilityDetail[]>>((acc, facility) => {
        if (!acc[facility.category]) {
            acc[facility.category] = [];
        }
        acc[facility.category].push(facility);
        return acc;
    }, {});

    const sortedCategoryKeys = Object.keys(facilitiesByCategory).sort(
      (a, b) => FACILITY_CATEGORIES[a as FacilityCategory].order - FACILITY_CATEGORIES[b as FacilityCategory].order
    );

    return (
        <div className="w-full mx-auto p-4 sm:p-6 font-sans bg-white">
            <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
                 <div>
                    <h1 className="text-2xl font-bold text-gray-900">Facilities of {hotelName}</h1>
                </div>
                <button className="mt-4 sm:mt-0 w-full sm:w-auto bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                    See availability
                </button>
            </header>

            {topItems.length > 0 && (
                 <div className="border-b border-gray-200 pb-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Great for your stay</h2>
                    <div className="flex flex-wrap gap-x-6 gap-y-3">
                        {topItems.map(item => (
                            <div key={item.id} className="flex items-center text-gray-700">
                                <span className="text-green-600 mr-2">{FACILITY_CATEGORIES[item.category].icon}</span>
                                <span>{item.displayName}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                {popularItems.length > 0 && (
                     <FacilityCategoryCard 
                        title="Most popular facilities"
                        icon={FACILITY_CATEGORIES['Most Popular'].icon}
                        items={popularItems}
                     />
                )}
                {sortedCategoryKeys.map(categoryName => {
                    const categoryInfo = FACILITY_CATEGORIES[categoryName as FacilityCategory];
                    const items = facilitiesByCategory[categoryName];
                    if (!items || items.length === 0) return null;

                    return (
                        <FacilityCategoryCard
                            key={categoryName}
                            title={categoryName}
                            icon={categoryInfo.icon}
                            items={items}
                        />
                    );
                })}
            </div>
        </div>
    );
};