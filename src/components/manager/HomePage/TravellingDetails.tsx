import React from 'react';
import { MapPin, Calendar, Banknote, Plane, Tag, Star, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Travelling } from '@/lib/mongodb/models/Travelling';
import Image from 'next/image';

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString();
};

const TravellingDetails: React.FC<{ item: Travelling }> = ({ item }) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">{item.title}</h3>
      
      {item.description && (
        <p className="text-sm text-gray-700 mb-4">{item.description}</p>
      )}
      
      {item.bannerImage && (
        <div className="mb-6 relative rounded-md overflow-hidden h-64">
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
            <Image src={item.bannerImage.url} alt={item.bannerImage.alt || "banner image" } fill className=" text-gray-400" />
            <span className="ml-2 text-gray-500">Banner Image</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p>{formatDate(item.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Updated</p>
            <p>{formatDate(item.updatedAt)}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Banknote className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Price</p>
            <p>
              {item.costing.currency} {item.costing.price.toLocaleString()}
              {item.costing.discountedPrice < item.costing.price && (
                <span className="ml-2 line-through text-gray-400">
                  {item.costing.currency} {item.costing.discountedPrice.toLocaleString()}
                </span>
              )}
            </p>
          </div>
        </div>
        {item.totalRating !== undefined && (
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-2 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Rating</p>
              <p>{item.totalRating.toFixed(1)} / 5</p>
            </div>
          </div>
        )}
      </div>
      
      <Separator className="my-6" />
      
      <h3 className="text-lg font-medium mb-4">Transportation Details</h3>
      
      <div className="border rounded-md p-4 mb-6">
        <div className="flex items-center mb-3">
          <Plane className="w-5 h-5 mr-2" />
          <h4 className="font-medium">
            {item.transportation.type.charAt(0).toUpperCase() + item.transportation.type.slice(1)}
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-start">
              <MapPin className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">From</p>
                <p>{item.transportation.from}</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm text-gray-500">Departure</p>
              <p>{formatDate(item.transportation.departureTime)} {formatTime(item.transportation.departureTime)}</p>
            </div>
          </div>
          <div>
            <div className="flex items-start">
              <MapPin className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">To</p>
                <p>{item.transportation.to}</p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm text-gray-500">Arrival</p>
              <p>{formatDate(item.transportation.arrivalTime)} {formatTime(item.transportation.arrivalTime)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {item.detailImages && item.detailImages.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Gallery</h3>
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
                  alt={image.alt || `Product detail ${index + 1}`}
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {item.review && item.review.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Reviews ({item.review.length})</h3>
          <div className="space-y-4">
            {item.review.map((review, index) => (
              <div key={index} className="border rounded-md p-4">
                <div className="flex justify-between mb-2">
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
    </div>
  );
};

export default TravellingDetails;