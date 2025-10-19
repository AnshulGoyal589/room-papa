import { Heart, MapPin, Share2, StarIcon } from 'lucide-react'
import React from 'react'

interface PropertyHeaderProps {
    title: string;
    type?: string;
    totalRating?: number;
    propertyRating?: number;
    address: string;
    city: string;
}

const PropertyHeader: React.FC<PropertyHeaderProps> = ({title,type,totalRating,propertyRating,address,city}) => {

    const renderRatingStars = (rating: number, starSize: string = "w-4 h-4") => (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map(star => (
                <StarIcon key={star} className={`${starSize} ${star <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            ))}
        </div>
    );
  return (
    <div className="mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
                {type && <span className="text-xs bg-yellow-400 text-yellow-900 font-semibold px-2 py-0.5 rounded-sm mr-2 uppercase">{type}</span>}
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 inline">{title || 'Property Title N/A'}</h1>
           </div>
            <div className="flex items-center space-x-2 mt-1 sm:mt-0">
                <button className="p-1.5 rounded-full hover:bg-gray-200"><Heart size={18} className="text-[#003c95]" /></button>
                <button className="p-1.5 rounded-full hover:bg-gray-200"><Share2 size={18} className="text-[#003c95]" /></button>
            </div>
        </div>
        <div className="flex items-center text-xs text-gray-600 mt-1">
            {(totalRating != null && totalRating > 0) && (
                <div className="flex items-center mr-2">{renderRatingStars(totalRating, "w-3.5 h-3.5")}<span className="ml-1 bg-[#003c95] text-white text-[10px] font-bold px-1 py-0.5 rounded-sm">{totalRating.toFixed(1)}</span></div>
            )}
            {propertyRating && propertyRating > 0 && (
            <span className="mr-2">{renderRatingStars(propertyRating, "w-3 h-3")} <span className="text-[10px] align-super">({propertyRating}-star)</span></span>
            )}
            <MapPin size={12} className="mr-1 text-gray-500" />
            <span>{address}, {city}</span>
        </div>
    </div>
  )
}

export default PropertyHeader