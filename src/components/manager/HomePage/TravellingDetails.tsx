import React from 'react';
import { MapPin, Calendar, Banknote, Plane, Tag, Star, MessageSquare, Paperclip, ThermometerIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export type ItineraryVisibility = 'private' | 'shared' | 'public';
export type ItineraryDayWeather = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'unknown';
export type TransportationType = 'flight' | 'train' | 'bus' | 'car' | 'ferry' | 'other';

type TravellingItem = {
  id: string;
  tripId: string;
  userId: string;
  title: string;
  description: string;
  visibility: ItineraryVisibility;
  category: 'Travelling';
  status: string;
  createdAt: Date;
  updatedAt: Date;
  days: {
    date: Date;
    weather?: ItineraryDayWeather;
    temperature?: {
      min: number;
      max: number;
      unit: 'celsius' | 'fahrenheit';
    };
    activities: {
      title: string;
      startTime: Date;
      endTime: Date;
      location?: {
        name: string;
        address?: string;
        coordinates?: {
          latitude: number;
          longitude: number;
        }
      };
      category?: string;
      notes?: string;
      cost?: number;
      bookingReference?: string;
      completed?: boolean;
    }[];
    accommodation?: {
      propertyId: string;
      name: string;
      address?: string;
    };
    transportation?: {
      type: TransportationType;
      departureTime: Date;
      arrivalTime: Date;
      from: string;
      to: string;
      notes?: string;
    }[];
    notes?: string;
    dailyBudget?: {
      planned: number;
      actual?: number;
    };
  }[];
  tags?: string[];
  totalDistance?: number;
  estimatedCost?: number;
  currency?: string;
  attachments?: {
    name: string;
    fileUrl: string;
    type: string;
    uploadedAt: Date;
  }[];
  likes?: number;
  comments?: {
    userId: string;
    text: string;
    timestamp: Date;
  }[];
};

const getWeatherIcon = (weather: ItineraryDayWeather) => {
  switch (weather) {
    case 'sunny': return '☀️';
    case 'cloudy': return '☁️';
    case 'rainy': return '🌧️';
    case 'snowy': return '❄️';
    default: return '❓';
  }
};

const getTransportIcon = (type: TransportationType) => {
  switch (type) {
    case 'flight': return '✈️';
    case 'train': return '🚄';
    case 'bus': return '🚌';
    case 'car': return '🚗';
    case 'ferry': return '⛴️';
    default: return '🚩';
  }
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const TravellingDetails: React.FC<{ item: TravellingItem }> = ({ item }) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Itinerary Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="flex items-center">
          <div>
            <p className="text-sm text-gray-500">Trip ID</p>
            <p>{item.tripId}</p>
          </div>
        </div>
        <div className="flex items-center">
          <div>
            <p className="text-sm text-gray-500">Visibility</p>
            <Badge className={
              item.visibility === 'public' ? 'bg-green-100 text-green-800' : 
              item.visibility === 'shared' ? 'bg-blue-100 text-blue-800' : 
              'bg-yellow-100 text-yellow-800'
            }>
              {item.visibility}
            </Badge>
          </div>
        </div>
        {item.estimatedCost && (
          <div className="flex items-center">
            <Banknote className="w-4 h-4 mr-2 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Estimated Cost</p>
              <p>{item.currency || '$'}{item.estimatedCost.toLocaleString()}</p>
            </div>
          </div>
        )}
        {item.totalDistance && (
          <div className="flex items-center">
            <div>
              <p className="text-sm text-gray-500">Total Distance</p>
              <p>{item.totalDistance} km</p>
            </div>
          </div>
        )}
      </div>
      
      {item.tags && item.tags.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag, index) => (
              <Badge key={index} variant="outline">{tag}</Badge>
            ))}
          </div>
        </div>
      )}
      
      <Separator className="my-6" />
      
      <h3 className="text-lg font-medium mb-4">Daily Itinerary</h3>
      
      <Accordion type="single" collapsible className="w-full">
        {item.days.map((day, dayIndex) => (
          <AccordionItem key={dayIndex} value={`day-${dayIndex}`}>
            <AccordionTrigger className="text-left">
              <div className="flex items-center">
                <span className="font-medium">{new Date(day.date).toLocaleDateString()}</span>
                {day.weather && (
                  <span className="ml-2" title={day.weather}>
                    {getWeatherIcon(day.weather)}
                  </span>
                )}
                {day.temperature && (
                  <span className="ml-2 text-sm">
                    {day.temperature.min}° - {day.temperature.max}°{day.temperature.unit === 'celsius' ? 'C' : 'F'}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {/* Activities */}
              {day.activities.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Activities</h4>
                  <div className="space-y-3">
                    {day.activities.map((activity, actIndex) => (
                      <div key={actIndex} className="border rounded-md p-3">
                        <div className="flex justify-between">
                          <h5 className="font-medium">{activity.title}</h5>
                          {activity.completed !== undefined && (
                            <Badge variant={activity.completed ? "default" : "outline"}>
                              {activity.completed ? "Completed" : "Pending"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                        </p>
                        
                        {activity.location && (
                          <div className="flex items-start mt-2">
                            <MapPin className="w-4 h-4 mr-1 text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-sm">{activity.location.name}</p>
                              {activity.location.address && (
                                <p className="text-xs text-gray-500">{activity.location.address}</p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {activity.category && (
                          <div className="mt-2">
                            <Badge variant="outline">{activity.category}</Badge>
                          </div>
                        )}
                        
                        {activity.notes && (
                          <p className="mt-2 text-sm">{activity.notes}</p>
                        )}
                        
                        {activity.cost !== undefined && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-500">Cost: </span>
                            <span>{item.currency || '$'}{activity.cost.toLocaleString()}</span>
                          </div>
                        )}
                        
                        {activity.bookingReference && (
                          <div className="mt-1 text-sm">
                            <span className="text-gray-500">Booking Ref: </span>
                            <span>{activity.bookingReference}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Transportation */}
              {day.transportation && day.transportation.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Transportation</h4>
                  <div className="space-y-3">
                    {day.transportation.map((transport, transIndex) => (
                      <div key={transIndex} className="border rounded-md p-3">
                        <div className="flex items-center">
                          <span className="mr-2">{getTransportIcon(transport.type)}</span>
                          <h5 className="font-medium">{transport.type.charAt(0).toUpperCase() + transport.type.slice(1)}</h5>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <p className="text-xs text-gray-500">From</p>
                            <p className="text-sm">{transport.from}</p>
                            <p className="text-xs text-gray-500 mt-1">Departure</p>
                            <p className="text-sm">{formatTime(transport.departureTime)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">To</p>
                            <p className="text-sm">{transport.to}</p>
                            <p className="text-xs text-gray-500 mt-1">Arrival</p>
                            <p className="text-sm">{formatTime(transport.arrivalTime)}</p>
                          </div>
                        </div>
                        
                        {transport.notes && (
                          <p className="mt-2 text-sm">{transport.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Accommodation */}
              {day.accommodation && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Accommodation</h4>
                  <div className="border rounded-md p-3">
                    <h5 className="font-medium">{day.accommodation.name}</h5>
                    {day.accommodation.address && (
                      <p className="text-sm text-gray-500">{day.accommodation.address}</p>
                    )}
                    <p className="text-xs mt-1">Property ID: {day.accommodation.propertyId}</p>
                  </div>
                </div>
              )}
              
              {/* Budget */}
              {day.dailyBudget && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Daily Budget</h4>
                  <div className="border rounded-md p-3 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Planned</p>
                      <p className="text-sm">{item.currency || '$'}{day.dailyBudget.planned.toLocaleString()}</p>
                    </div>
                    {day.dailyBudget.actual !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500">Actual</p>
                        <p className="text-sm">{item.currency || '$'}{day.dailyBudget.actual.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Notes */}
              {day.notes && (
                <div className="mb-2">
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm">{day.notes}</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      {/* Attachments */}
      {item.attachments && item.attachments.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Attachments</h3>
          <div className="space-y-2">
            {item.attachments.map((attachment, index) => (
              <div key={index} className="flex items-center p-2 border rounded-md">
                <Paperclip className="w-4 h-4 mr-2 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{attachment.name}</p>
                  <p className="text-xs text-gray-500">
                    {attachment.type} • {new Date(attachment.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Social */}
      <div className="mt-6">
        {item.likes !== undefined && (
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-1 text-gray-500" />
            <span className="text-sm mr-4">{item.likes} likes</span>
            
            {item.comments && (
              <>
                <MessageSquare className="w-4 h-4 mr-1 text-gray-500" />
                <span className="text-sm">{item.comments.length} comments</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TravellingDetails;