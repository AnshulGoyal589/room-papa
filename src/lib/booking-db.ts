// lib/booking-db.ts
import { Collection, Db, Filter, ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { Booking, BookingInput, PropertyBooking, TravellingBooking, TripBooking } from '@/lib/mongodb/models/booking';

export class BookingRepository {
  private db: Db;
  private collection: Collection<Booking>;

  constructor(db: Db) {
    this.db = db;
    this.collection = this.db.collection<Booking>('bookings');
  }

async createBooking(bookingData: BookingInput): Promise<{ id: string; booking: Booking }> {
  const now = new Date();
  
  // Create a properly typed booking based on the input type
  let newBooking: Booking;
  
  if (bookingData.type === 'property') {
    newBooking = {
      ...bookingData,
      status: 'confirmed',
      createdAt: now,
      updatedAt: now
    } as PropertyBooking;
  } else if (bookingData.type === 'travelling') {
    newBooking = {
      ...bookingData,
      status: 'confirmed',
      createdAt: now,
      updatedAt: now
    } as TravellingBooking;
  } else if (bookingData.type === 'trip') {
    newBooking = {
      ...bookingData,
      status: 'confirmed',
      createdAt: now,
      updatedAt: now
    } as TripBooking;
  } else {
    throw new Error(`Invalid booking type: ${(bookingData).type}`);
  }
  
  const result = await this.collection.insertOne(newBooking);
  
  return {
    id: result.insertedId.toString(),
    booking: {
      ...newBooking,
      _id: result.insertedId
    }
  };
}

  // Get a booking by ID
  async getBookingById(id: string): Promise<Booking | null> {
    try {
      return await this.collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error(`Error fetching booking with ID ${id}:`, error);
      return null;
    }
  }

  // Update a booking
  async updateBooking(id: string, updateData: Partial<Booking>): Promise<boolean> {
    try {
      const result = await this.collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error(`Error updating booking with ID ${id}:`, error);
      return false;
    }
  }

  // Cancel a booking
  async cancelBooking(id: string, reason?: string): Promise<boolean> {
    try {
      const result = await this.collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: {
            status: 'cancelled',
            cancellationReason: reason,
            updatedAt: new Date()
          }
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error(`Error cancelling booking with ID ${id}:`, error);
      return false;
    }
  }

  // Query bookings with filters
  async queryBookings(filters: BookingQueryFilters): Promise<Booking[]> {
    const query: Filter<Booking> = {};
    
    if (filters.userId) {
      query['guestDetails.userId'] = filters.userId;
    }
    
    if (filters.tripId) {
      query['tripDetails.id'] = filters.tripId;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.bookingDetails = query.bookingDetails || {};
      
      if (filters.dateFrom) {
        query['bookingDetails.checkIn'] = { $gte: filters.dateFrom };
      }
      
      if (filters.dateTo) {
        query['bookingDetails.checkOut'] = { $lte: filters.dateTo };
      }
    }
    
    let bookingsQuery = this.collection.find(query);
    
    // Apply sorting
    if (filters.sortBy) {
      const sortDirection = filters.sortOrder === 'desc' ? -1 : 1;
      bookingsQuery = bookingsQuery.sort({ [filters.sortBy]: sortDirection });
    } else {
      // Default sort by creation date, newest first
      bookingsQuery = bookingsQuery.sort({ createdAt: -1 });
    }
    
    // Apply pagination
    if (filters.limit) {
      bookingsQuery = bookingsQuery.limit(filters.limit);
      
      if (filters.skip) {
        bookingsQuery = bookingsQuery.skip(filters.skip);
      }
    }
    
    return bookingsQuery.toArray();
  }
  
  // Get property bookings specifically
  async getPropertyBookings(filters: BookingQueryFilters = {}): Promise<PropertyBooking[]> {
    return this.queryBookings({ ...filters, type: 'property' }) as Promise<PropertyBooking[]>;
  }
  
  // Get travelling bookings specifically
  async getTravellingBookings(filters: BookingQueryFilters = {}): Promise<TravellingBooking[]> {
    return this.queryBookings({ ...filters, type: 'travelling' }) as Promise<TravellingBooking[]>;
  }
  
  // Get trip bookings specifically
  async getTripBookings(filters: BookingQueryFilters = {}): Promise<TripBooking[]> {
    return this.queryBookings({ ...filters, type: 'trip' }) as Promise<TripBooking[]>;
  }

  async getManagerBookings(filters: ManagerBookingQueryFilters ): Promise<Booking[]> {

    const query: Filter<Booking> = {};
    
    if (!filters.ownerId) {
      throw new Error('ownerId is required for manager bookings query');
    }
    
    query['details.ownerId'] = filters.ownerId;
    
    // Optional filters
    if (filters.type) {
      query.type = filters.type;
    }
    
    // if (filters.status) {
    //   query.status = filters.status;
    // }
    
    if (filters.dateFrom || filters.dateTo) {
      query.bookingDetails = query.bookingDetails || {};
      
      if (filters.dateFrom) {
        query['bookingDetails.checkIn'] = { $gte: filters.dateFrom };
      }
      
      if (filters.dateTo) {
        query['bookingDetails.checkOut'] = { $lte: filters.dateTo };
      }
    }
    
    // Handle search term (search in title, locations, or guest name/email)
    if (filters.searchTerm) {
      const searchRegex = new RegExp(filters.searchTerm, 'i');
      query['$or'] = [
        { 'details.title': searchRegex },
        { 'details.locationFrom': searchRegex },
        { 'details.locationTo': searchRegex },
        { 'details.firstName': searchRegex },
        { 'details.lastName': searchRegex },
        { 'type': searchRegex },
      ];
    }

    // console.log("Query: ",query);

    
    // console.log("this: ",this.collection);
    
    const bookingsQuery = this.collection.find(query);


    // console.log("Bookings Query: ",bookingsQuery.toArray());
    
    // Apply sorting
    // if (filters.sortBy) {
    //   const sortDirection = filters.sortOrder === 'desc' ? -1 : 1;
    //   bookingsQuery = bookingsQuery.sort({ [filters.sortBy]: sortDirection });
    // } else {
    //   // Default sort by creation date, newest first
    //   bookingsQuery = bookingsQuery.sort({ createdAt: -1 });
    // }
    
    // Apply pagination
    // if (filters.limit) {
    //   bookingsQuery = bookingsQuery.limit(filters.limit);
      
    //   if (filters.skip) {
    //     bookingsQuery = bookingsQuery.skip(filters.skip);
    //   }
    // }

    // console.log("Bookings Query: ",  bookingsQuery.toArray());
    
    return bookingsQuery.toArray();
  }
  
  // Get the count of manager bookings with filters
  async getManagerBookingsCount(filters: ManagerBookingQueryFilters ): Promise<number> {
    const query: Filter<Booking> = {};
    
    // Required filter: owner ID must match the current user's ID
    if (!filters.ownerId) {
      throw new Error('ownerId is required for manager bookings count');
    }
    query['tripDetails.userId'] = filters.ownerId;
    query['travellingDetails.userId'] = filters.ownerId;
    query['propertyDetails.userId'] = filters.ownerId;;
    
    // Optional filters
    if (filters.type) {
      query.type = filters.type;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.dateFrom || filters.dateTo) {
      query.bookingDetails = query.bookingDetails || {};
      
      if (filters.dateFrom) {
        query['bookingDetails.checkIn'] = { $gte: filters.dateFrom };
      }
      
      if (filters.dateTo) {
        query['bookingDetails.checkOut'] = { $lte: filters.dateTo };
      }
    }
    
    // Handle search term (search in title, locations, or guest name/email)
    if (filters.searchTerm) {
      const searchRegex = new RegExp(filters.searchTerm, 'i');
      query['$or'] = [
        { 'tripDetails.title': searchRegex },
        { 'tripDetails.locationFrom': searchRegex },
        { 'tripDetails.locationTo': searchRegex },
        { 'guestDetails.firstName': searchRegex },
        { 'guestDetails.lastName': searchRegex },
        { 'guestDetails.email': searchRegex }
      ];
    }
    
    return this.collection.countDocuments(query);
  }
  
  // Get upcoming manager bookings (today onwards)
  async getUpcomingManagerBookings(ownerId: string, limit: number = 5): Promise<Booking[]> {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    return this.getManagerBookings({
      ownerId,
      dateFrom: today,
      status: 'confirmed',
      sortBy: 'bookingDetails.checkIn',
      sortOrder: 'asc',
      limit
    });
  }
  
  // Get recent manager bookings (past first, limited number)
  async getRecentManagerBookings(ownerId: string, limit: number = 10): Promise<Booking[]> {
    return this.getManagerBookings({
      ownerId,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      limit
    });
  }
}



// Interface for query filters
export interface BookingQueryFilters {
  userId?: string;
  tripId?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
  type?: 'property' | 'travelling' | 'trip';
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}

export interface ManagerBookingQueryFilters {
  ownerId : string;
  type?: 'property' | 'travelling' | 'trip';
  status?: 'pending' | 'confirmed' | 'cancelled';
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}


// Factory function to get a repository instance
export async function getBookingRepository(): Promise<BookingRepository> {
  const db = await getDb();
  return new BookingRepository(db);
}


