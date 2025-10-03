// lib/booking-db.ts
import { Collection, Db, Filter, ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import {
  Booking,
  BookingInputData, // Changed from BookingInput
  PropertyBooking,
  PropertyBookingInputData, // For explicit casting, assuming Travelling/Trip inputs follow similar .details structure
  TravellingBooking,
  // TravellingBookingInputData, // Assuming similar structure if fully defined
  TripBooking,
  // TripBookingInputData, // Assuming similar structure if fully defined
  BaseDetails, // Imported for constructing tripDetails
} from '@/lib/mongodb/models/Booking';

export class BookingRepository {
  private db: Db;
  private collection: Collection<Booking>;

  constructor(db: Db) {
    this.db = db;
    this.collection = this.db.collection<Booking>('bookings');
  }

  async createBooking(bookingData: BookingInputData): Promise<{ id: string; booking: Booking }> {
    const now = new Date();
    let newBooking!: Booking; // Definite assignment assertion

    // Common transformation for details -> tripDetails
    // This assumes all variants of BookingInputData have a 'details' field
    // and other relevant fields like bookingDetails, guestDetails, recipients.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { details, ...restOfInput } = bookingData as any; // Use 'as any' for generic access, then type specifics
    // console.log("rest of input: ",restOfInput);
    // console.log("details: ",bookingData);
    // console.log("bookingData: ",bookingData);
    const tripDetailsPayload: BaseDetails & { ownerId?: string } = {
      id: details.id,
      title: details.title,
      locationFrom: details.locationFrom,
      locationTo: details.locationTo,
      reservationPolicy: details.reservationPolicy, // Ensure this is included if relevant
      type: details.type, // This is the sub-type like 'Hotel', 'Flight'
      ownerId: details.ownerId, // Ensure ownerId from input details is mapped
    };

    if (bookingData.type === 'property') {
      const propertyInput = bookingData as PropertyBookingInputData;
      newBooking = {
        type: 'property',
        tripDetails: tripDetailsPayload,
        bookingDetails: {
          ...propertyInput.bookingDetails,
          pricePerNight: propertyInput.bookingDetails.totalPrice / propertyInput.bookingDetails.numberOfNights, 
          payment : {
            provider: 'razorpay'
          }
        },
        guestDetails: propertyInput.guestDetails,
        userId: restOfInput.userId || 'some-user-id', // Placeholder if userId is not in input, ensure it's handled
        recipients: propertyInput.recipients,
        status: 'confirmed', // Or 'pending' based on your flow
        createdAt: now,
        updatedAt: now,
      } as PropertyBooking; // Cast after ensuring structure matches
    } else if (bookingData.type === 'travelling') {
      // Assuming TravellingBookingInputData has similar structure to PropertyBookingInputData
      // You might need to adjust this based on the actual definition of TravellingBookingInputData
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const travellingInput = bookingData as any; // Cast to any or specific input type
      newBooking = {
        type: 'travelling',
        tripDetails: tripDetailsPayload,
        bookingDetails: travellingInput.bookingDetails,
        guestDetails: travellingInput.guestDetails,
        userId: restOfInput.userId || 'some-user-id',
        recipients: travellingInput.recipients,
        status: 'confirmed',
        createdAt: now,
        updatedAt: now,
      } as TravellingBooking;
    } else if (bookingData.type === 'trip') {
      // Assuming TripBookingInputData has similar structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tripInput = bookingData as any; // Cast to any or specific input type
      newBooking = {
        type: 'trip',
        tripDetails: tripDetailsPayload,
        bookingDetails: tripInput.bookingDetails,
        guestDetails: tripInput.guestDetails,
        userId: restOfInput.userId || 'some-user-id',
        recipients: tripInput.recipients,
        status: 'confirmed',
        createdAt: now,
        updatedAt: now,
      } as TripBooking;
    } else {
      // Fallback for exhaustiveness, though TS should catch unknown types
      const _exhaustiveCheck: never = bookingData;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      throw new Error(`Invalid booking type: ${(_exhaustiveCheck as any).type}`);
    }

    const result = await this.collection.insertOne(newBooking);
    // console.log("New booking created with ID:", newBooking);
    // console.log("Insert result:", result);

    return {
      id: result.insertedId.toString(),
      booking: {
        ...newBooking,
        _id: result.insertedId,
      },
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
            updatedAt: new Date(),
          },
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatePayload: any = { // Use 'any' or add cancellationReason to Booking types
        status: 'cancelled',
        updatedAt: new Date(),
      };
      if (reason) {
        updatePayload.cancellationReason = reason;
      }
      const result = await this.collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: updatePayload,
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
      // Assuming userId refers to the user who made the booking, which is at the root level
      query.userId = filters.userId;
    }

    if (filters.tripId) {
      query['tripDetails.id'] = filters.tripId; // ID of the item booked
    }

    if (filters.status) {
      if (filters.status !== 'all') {
        query.status = filters.status;
      }
    }

    if (filters.type) {
      if (filters.type !== 'all') {
        query.type = filters.type;
      }
    }

    if (filters.dateFrom || filters.dateTo) {
      query.bookingDetails = query.bookingDetails || {};

      if (filters.dateFrom) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (query.bookingDetails as any).checkIn = { $gte: new Date(filters.dateFrom) };
      }

      if (filters.dateTo) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (query.bookingDetails as any).checkOut = { $lte: new Date(filters.dateTo) };
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

  async getManagerBookings(filters: ManagerBookingQueryFilters): Promise<Booking[]> {
    const query: Filter<Booking> = {};

    if (!filters.ownerId) {
      throw new Error('ownerId is required for manager bookings query');
    }

    // Query for items where the item's ownerId matches the manager's ID
    query['tripDetails.ownerId'] = filters.ownerId;

    // Optional filters
    if (filters.type && filters.type !== 'all') { // Ensure 'all' is not treated as a type
      query.type = filters.type;
    }

    if (filters.status && filters.status !== 'all') { // Ensure 'all' is not treated as a status
       query.status = filters.status;
    }


    if (filters.dateFrom || filters.dateTo) {
      query.bookingDetails = query.bookingDetails || {};
      if (filters.dateFrom) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (query.bookingDetails as any).checkIn = { $gte: new Date(filters.dateFrom) };
      }
      if (filters.dateTo) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (query.bookingDetails as any).checkOut = { $lte: new Date(filters.dateTo) };
      }
    }

    // Handle search term
    if (filters.searchTerm) {
      const searchRegex = new RegExp(filters.searchTerm, 'i');
      query.$or = [
        { 'tripDetails.title': searchRegex },
        { 'tripDetails.locationFrom': searchRegex },
        { 'tripDetails.locationTo': searchRegex },
        { 'guestDetails.firstName': searchRegex },
        { 'guestDetails.lastName': searchRegex },
        { 'guestDetails.email': searchRegex },
        { 'type': searchRegex }, // Searching by type might be broad but kept as is
      ];
    }

    let bookingsQuery = this.collection.find(query);

    // Apply sorting (Uncommented and applied)
    if (filters.sortBy) {
      const sortDirection = filters.sortOrder === 'desc' ? -1 : 1;
      bookingsQuery = bookingsQuery.sort({ [filters.sortBy]: sortDirection });
    } else {
      // Default sort by update date for manager view, or as required
      bookingsQuery = bookingsQuery.sort({ updatedAt: -1 });
    }

    // Apply pagination (Uncommented and applied)
    if (filters.limit) {
      bookingsQuery = bookingsQuery.limit(filters.limit);
      if (filters.skip) {
        bookingsQuery = bookingsQuery.skip(filters.skip);
      }
    }
    return bookingsQuery.toArray();
  }

  async getManagerBookingsCount(filters: ManagerBookingQueryFilters): Promise<number> {
    const query: Filter<Booking> = {};

    if (!filters.ownerId) {
      throw new Error('ownerId is required for manager bookings count');
    }
    // Count items where the item's ownerId matches the manager's ID
    query['tripDetails.ownerId'] = filters.ownerId;

    // Optional filters
    if (filters.type && filters.type !== 'all') {
      query.type = filters.type;
    }

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.bookingDetails = query.bookingDetails || {};
      if (filters.dateFrom) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (query.bookingDetails as any).checkIn = { $gte: new Date(filters.dateFrom) };
      }
      if (filters.dateTo) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (query.bookingDetails as any).checkOut = { $lte: new Date(filters.dateTo) };
      }
    }

    if (filters.searchTerm) {
      const searchRegex = new RegExp(filters.searchTerm, 'i');
      query.$or = [
        { 'tripDetails.title': searchRegex },
        { 'tripDetails.locationFrom': searchRegex },
        { 'tripDetails.locationTo': searchRegex },
        { 'guestDetails.firstName': searchRegex },
        { 'guestDetails.lastName': searchRegex },
        { 'guestDetails.email': searchRegex },
        { 'type': searchRegex },
      ];
    }

    return this.collection.countDocuments(query);
  }

  // Get upcoming manager bookings (today onwards)
  async getUpcomingManagerBookings(ownerId: string, limit: number = 5): Promise<Booking[]> {
    const today = new Date(); // Use Date object for comparison
    today.setHours(0, 0, 0, 0); // Set to start of today

    return this.getManagerBookings({
      ownerId,
      dateFrom: today.toISOString(), // Pass ISO string as filter expects string
      status: 'confirmed',
      sortBy: 'bookingDetails.checkIn',
      sortOrder: 'asc',
      limit,
    });
  }

  // Get recent manager bookings (past first, limited number)
  async getRecentManagerBookings(ownerId: string, limit: number = 10): Promise<Booking[]> {
    return this.getManagerBookings({
      ownerId,
      sortBy: 'updatedAt', // or 'createdAt'
      sortOrder: 'desc',
      limit,
    });
  }
}

// Interface for query filters
export interface BookingQueryFilters {
  userId?: string;
  tripId?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'all';
  type?: 'property' | 'travelling' | 'trip' | 'all';
  dateFrom?: string; // ISO Date string
  dateTo?: string;   // ISO Date string
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}

export interface ManagerBookingQueryFilters {
  ownerId: string;
  type?: 'property' | 'travelling' | 'trip' | 'all'; // Added 'all'
  status?: 'pending' | 'confirmed' | 'cancelled' | 'all'; // Added 'all'
  dateFrom?: string; // ISO Date string
  dateTo?: string;   // ISO Date string
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