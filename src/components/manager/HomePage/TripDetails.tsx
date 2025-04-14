import React from 'react';
import { MapPin, Calendar, Banknote, Star, Globe, Clock, Check,  Tag,  Utensils, Wifi,  FileText, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trip } from '@/lib/mongodb/models/Trip';
import Image from 'next/image';

const TripDetails: React.FC<{ item: Trip }> = ({ item }) => {
  // Calculate trip duration in days
  const tripDuration = Math.ceil((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24));

  // Get the currency to use
  const currency = item.costing.currency;


  // Helper to render a section with array of items
  const renderArraySection = (title: string, items: string[] | undefined, icon: React.ReactNode) => {
    if (!items || items.length === 0 || (items.length === 1 && !items[0].trim())) {
      return null;
    }

    return (
      <div className="mb-6">
        <div className="flex items-center mb-2">
          {icon}
          <h4 className="text-md font-medium ml-2">{title}</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <Badge key={index} variant="outline">
              {item}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center mb-4">
        {/* <Badge className={getStatusColor(item.typdomaine)}>
          {item.type}
        </Badge> */}
        {item.rat && (
          <Badge className="ml-2 bg-purple-100 text-purple-800">
            RAT: {item.rat}
          </Badge>
        )}
      </div>
      
      {/* Banner Image */}
      {item.bannerImage && (
        <div className="mb-6 relative rounded-md overflow-hidden h-64">
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
            <Image 
              src={item.bannerImage.url} 
              alt={item.bannerImage.alt || "Trip banner image" }
              fill 
              className="object-cover"
            />
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Destination</p>
            <p>{item.destination.city}, {item.destination.state}, {item.destination.country}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p>{new Date(item.startDate).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">End Date</p>
            <p>{new Date(item.endDate).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p>{tripDuration} days</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <Banknote className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Price</p>
            <p>
              {item.costing.price.toLocaleString()} {currency}
              {item.costing.discountedPrice < item.costing.price && (
                <span className="text-sm text-green-500 ml-2">
                  (Discount: {(item.costing.price - item.costing.discountedPrice).toLocaleString()} {currency})
                </span>
              )}
            </p>
          </div>
        </div>

        
        {item.updatedAt && (
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p>{new Date(item.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}
        
        {item.domain && (
          <div className="flex items-center">
            <Globe className="w-4 h-4 mr-2 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Domain</p>
              <p>{item.domain}</p>
            </div>
          </div>
        )}
      </div>

      <Separator className="my-6" />

      {/* Activities section */}
      {renderArraySection('Activities', item.activities, <Tag className="w-4 h-4 text-gray-500" />)}

      {/* Amenities section */}
      {renderArraySection('Amenities', item.amenities, <Check className="w-4 h-4 text-gray-500" />)}

      {/* Property Accessibility */}
      {renderArraySection('Property Accessibility', item.accessibility, <Building className="w-4 h-4 text-gray-500" />)}

      {/* Popular Filters */}
      {renderArraySection('Popular Filters', item.popularFilters, <Tag className="w-4 h-4 text-gray-500" />)}

      {/* Fun Things To Do */}
      {renderArraySection('Fun Things To Do', item.funThingsToDo, <Tag className="w-4 h-4 text-gray-500" />)}

      {/* Meals */}
      {renderArraySection('Meals', item.meals, <Utensils className="w-4 h-4 text-gray-500" />)}

      {/* Facilities */}
      {renderArraySection('Facilities', item.facilities, <Wifi className="w-4 h-4 text-gray-500" />)}

      {/* Reservation Policy */}
      {renderArraySection('Reservation Policy', item.reservationPolicy, <FileText className="w-4 h-4 text-gray-500" />)}

      {/* Brands */}
      {renderArraySection('Brands', item.brands, <Building className="w-4 h-4 text-gray-500" />)}

      {/* Detail Images Gallery - Enhanced version */}
      {item.detailImages && item.detailImages.length > 0 && (
        <div className="mb-8">
          <h3 className="text-md font-medium mb-4">Trip Gallery</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {item.detailImages.map((image, index) => (
              <div 
                key={index} 
                className="relative aspect-square overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <Image 
                  src={image.url} 
                  fill={true}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  priority={index < 4}
                  alt={image.alt || `Trip image ${index + 1}`}
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews section */}
      {item.review && item.review.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium mb-2">Reviews</h4>
          <div className="space-y-4">
            {item.review.map((review, index) => (
              <div key={index} className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost summary section */}
      <div className="bg-gray-100 p-4 rounded-md">
        <div className="flex justify-between font-medium">
          <span>Total Trip Cost</span>
          <span>{item.costing.discountedPrice.toLocaleString()} {currency}</span>
        </div>
        {item.costing.discountedPrice < item.costing.price && (
          <div className="flex justify-between mt-2 text-sm">
            <span>You Save</span>
            <span className="text-green-500">
              {(item.costing.price - item.costing.discountedPrice).toLocaleString()} {currency}
              {' '}({Math.round((1 - item.costing.discountedPrice / item.costing.price) * 100)}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetails;