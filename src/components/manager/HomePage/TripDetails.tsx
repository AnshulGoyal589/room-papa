import React from 'react';
import { MapPin, Calendar, Banknote, Users, Clipboard, Map } from 'lucide-react';

// Updated TripItem type to match the updated schema
type TripItem = {
  id: string;
  title: string;
  description: string;
  category: 'Trip';
  status: string;
  createdAt: Date;
  userId: string;
  destination: {
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    }
  };
  startDate: Date;
  endDate: Date;
  budget?: {
    amount: number;
    currency: string;
    spent?: number;
  };
  accommodations: {
    propertyId: string;
    checkIn: Date;
    checkOut: Date;
    confirmationCode?: string;
    price: number;
  }[];
  transportation: {
    type: string;
    departureLocation: string;
    arrivalLocation: string;
    departureTime: Date;
    arrivalTime: Date;
    confirmationCode?: string;
    price?: number;
    provider?: string;
  }[];
  activities: {
    name: string;
    date: Date;
    location: string;
    duration?: number;
    price?: number;
    booked: boolean;
    confirmationCode?: string;
  }[];
  totalCost?: number;
  notes?: string;
  sharedWith?: string[];
  updatedAt: Date;
};

const TripDetails: React.FC<{ item: TripItem }> = ({ item }) => {
  // Calculate trip duration in days
  const tripDuration = Math.ceil((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate total accommodations cost
  const accommodationsCost = item.accommodations.reduce((sum, acc) => sum + acc.price, 0);
  
  // Calculate total transportation cost
  const transportationCost = item.transportation.reduce((sum, trans) => sum + (trans.price || 0), 0);
  
  // Calculate total activities cost
  const activitiesCost = item.activities.reduce((sum, act) => sum + (act.price || 0), 0);

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Trip Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Destination</p>
            <p>{item.destination.city}, {item.destination.country}</p>
          </div>
        </div>
        {item.budget && (
          <div className="flex items-center">
            <Banknote className="w-4 h-4 mr-2 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Budget</p>
              <p>
                {item.budget.amount.toLocaleString()} {item.budget.currency}
                {item.budget.spent !== undefined && (
                  <span className="text-sm text-gray-500 ml-2">
                    (Spent: {item.budget.spent.toLocaleString()} {item.budget.currency})
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
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
          <div className="w-4 h-4 mr-2 text-gray-500">📅</div>
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p>{tripDuration} days</p>
          </div>
        </div>
        {item.totalCost !== undefined && (
          <div className="flex items-center">
            <Banknote className="w-4 h-4 mr-2 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Total Cost</p>
              <p>{item.totalCost.toLocaleString()} {item.budget?.currency || 'USD'}</p>
            </div>
          </div>
        )}
        {item.sharedWith && item.sharedWith.length > 0 && (
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Shared With</p>
              <p>{item.sharedWith.length} people</p>
            </div>
          </div>
        )}
      </div>

      {/* Display accommodations if available */}
      {item.accommodations.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium mb-2">Accommodations</h4>
          <div className="bg-gray-50 p-4 rounded-md">
            {item.accommodations.map((acc, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Property ID: {acc.propertyId}</p>
                    <p className="text-sm">
                      {new Date(acc.checkIn).toLocaleDateString()} - {new Date(acc.checkOut).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{acc.price.toLocaleString()} {item.budget?.currency || 'USD'}</p>
                    {acc.confirmationCode && (
                      <p className="text-sm text-gray-500">Confirmation: {acc.confirmationCode}</p>
                    )}
                  </div>
                </div>
                {index < item.accommodations.length - 1 && <hr className="my-2" />}
              </div>
            ))}
            <div className="mt-2 text-right">
              <p className="text-sm font-medium">Total: {accommodationsCost.toLocaleString()} {item.budget?.currency || 'USD'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Display transportation if available */}
      {item.transportation.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium mb-2">Transportation</h4>
          <div className="bg-gray-50 p-4 rounded-md">
            {item.transportation.map((trans, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{trans.type.charAt(0).toUpperCase() + trans.type.slice(1)}</p>
                    <p className="text-sm">{trans.departureLocation} → {trans.arrivalLocation}</p>
                    <p className="text-sm">
                      {new Date(trans.departureTime).toLocaleString()} - {new Date(trans.arrivalTime).toLocaleString()}
                    </p>
                    {trans.provider && <p className="text-sm text-gray-500">Provider: {trans.provider}</p>}
                  </div>
                  <div className="text-right">
                    {trans.price !== undefined && (
                      <p className="font-medium">{trans.price.toLocaleString()} {item.budget?.currency || 'USD'}</p>
                    )}
                    {trans.confirmationCode && (
                      <p className="text-sm text-gray-500">Confirmation: {trans.confirmationCode}</p>
                    )}
                  </div>
                </div>
                {index < item.transportation.length - 1 && <hr className="my-2" />}
              </div>
            ))}
            {transportationCost > 0 && (
              <div className="mt-2 text-right">
                <p className="text-sm font-medium">Total: {transportationCost.toLocaleString()} {item.budget?.currency || 'USD'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Display activities if available */}
      {item.activities.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium mb-2">Activities</h4>
          <div className="bg-gray-50 p-4 rounded-md">
            {item.activities.map((activity, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{activity.name}</p>
                    <p className="text-sm">{new Date(activity.date).toLocaleDateString()}</p>
                    <p className="text-sm">{activity.location}</p>
                    {activity.duration && (
                      <p className="text-sm">{Math.floor(activity.duration / 60)}h {activity.duration % 60}m</p>
                    )}
                  </div>
                  <div className="text-right">
                    {activity.price !== undefined && (
                      <p className="font-medium">{activity.price.toLocaleString()} {item.budget?.currency || 'USD'}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {activity.booked ? 'Booked' : 'Not booked'}
                      {activity.booked && activity.confirmationCode && ` • ${activity.confirmationCode}`}
                    </p>
                  </div>
                </div>
                {index < item.activities.length - 1 && <hr className="my-2" />}
              </div>
            ))}
            {activitiesCost > 0 && (
              <div className="mt-2 text-right">
                <p className="text-sm font-medium">Total: {activitiesCost.toLocaleString()} {item.budget?.currency || 'USD'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes section */}
      {item.notes && (
        <div className="mb-6">
          <h4 className="text-md font-medium mb-2">Notes</h4>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="whitespace-pre-line">{item.notes}</p>
          </div>
        </div>
      )}

      {/* Summary section */}
      <div className="bg-gray-100 p-4 rounded-md">
        <div className="flex justify-between font-medium">
          <span>Total Trip Cost</span>
          <span>{(accommodationsCost + transportationCost + activitiesCost).toLocaleString()} {item.budget?.currency || 'USD'}</span>
        </div>
        {item.budget && (
          <div className="flex justify-between mt-2 text-sm">
            <span>Budget Remaining</span>
            <span className={`${item.budget.amount - (item.budget.spent || 0) < 0 ? 'text-red-500' : 'text-green-500'}`}>
              {(item.budget.amount - (item.budget.spent || 0)).toLocaleString()} {item.budget.currency}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetails;