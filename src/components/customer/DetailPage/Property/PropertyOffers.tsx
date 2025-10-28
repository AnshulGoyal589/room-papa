import { Tag } from 'lucide-react';
import React from 'react'

interface PropertOffers {
    offers?: string[];
}

const PropertyOffers: React.FC<PropertOffers> = ({ offers }) => {
  return (
    <>
        {offers && offers.length > 0 && (
             <div className="mt-8 mb-8 p-6 bg-green-50 border border-green-200 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Tag className="mr-3 h-6 w-6 text-green-600" />
                Special Offers & Promotions
              </h3>
              <ul className="space-y-2 pl-5 list-disc text-gray-700">
                {offers.map((offer, index) => (
                  <li key={index} className="text-base">
                    {offer}
                  </li>
                ))}
              </ul>
            </div>
        )}
    </>
  )
}

export default PropertyOffers;