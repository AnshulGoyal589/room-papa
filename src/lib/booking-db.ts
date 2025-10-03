import { Collection, Db, Filter, ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { BaseDetails, BookingDetails, BookingQueryFilters, ManagerBookingQueryFilters } from '@/lib/mongodb/models/Booking';

export class BookingRepository {
  private db: Db;
  private collection: Collection<BookingDetails>;

  constructor(db: Db) {
    this.db = db;
    this.collection = this.db.collection<BookingDetails>('bookings');
  }

  async createBooking(bookingData: BookingDetails): Promise<{ id: string; booking: BookingDetails }> {
    const now = new Date();
    let newBooking!: BookingDetails;
    // console.log("Creating booking with data:", bookingData);
    // return
    const { infoDetails, ...restOfInput } = bookingData as BookingDetails;
    const infoDetailsPayload: BaseDetails = {
      id: infoDetails.id,
      title: infoDetails.title,
      locationFrom: infoDetails.locationFrom,
      locationTo: infoDetails.locationTo,
      reservationPolicy: infoDetails.reservationPolicy,
      type: infoDetails.type,
      ownerId: infoDetails.ownerId,
    };

    if (bookingData.type === 'property') {
      const propertyInput = bookingData as BookingDetails;
      newBooking = {
        type: 'property',
        infoDetails: infoDetailsPayload,
        bookingDetails: {
          ...propertyInput.bookingDetails,
          pricePerNight: propertyInput.bookingDetails.totalPrice / propertyInput.bookingDetails.numberOfNights, 
          payment : {
            provider: 'razorpay'
          }
        },
        guestDetails: propertyInput.guestDetails,
        isReviewed: false,
        userId: restOfInput.userId || 'some-user-id',
        recipients: propertyInput.recipients,
        status: 'confirmed',
        createdAt: now,
        updatedAt: now,
      } as BookingDetails;
    } else if (bookingData.type === 'travelling') {
      const travellingInput = bookingData as BookingDetails;
      newBooking = {
        type: 'travelling',
        infoDetails: infoDetailsPayload,
        isReviewed: false,
        bookingDetails: travellingInput.bookingDetails,
        guestDetails: travellingInput.guestDetails,
        userId: restOfInput.userId || 'some-user-id',
        recipients: travellingInput.recipients,
        status: 'confirmed',
        createdAt: now,
        updatedAt: now,
      } as BookingDetails;
    } else if (bookingData.type === 'trip') {
      const tripInput = bookingData as BookingDetails;
      newBooking = {
        type: 'trip',
        infoDetails: infoDetailsPayload,
        isReviewed: false,
        bookingDetails: tripInput.bookingDetails,
        guestDetails: tripInput.guestDetails,
        userId: restOfInput.userId || 'some-user-id',
        recipients: tripInput.recipients,
        status: 'confirmed',
        createdAt: now,
        updatedAt: now,
      } as BookingDetails;
    } else {
        throw new Error(`Invalid booking type`);
    }

    const result = await this.collection.insertOne(newBooking);

    return {
      id: result.insertedId.toString(),
      booking: {
        ...newBooking,
        _id: result.insertedId,
      },
    };
  }

  async getBookingById(id: string): Promise<BookingDetails | null> {
    try {
      return await this.collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error(`Error fetching booking with ID ${id}:`, error);
      return null;
    }
  }

  async updateBooking(id: string, updateData: Partial<BookingDetails>): Promise<boolean> {
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

  async cancelBooking(id: string, reason?: string): Promise<boolean> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatePayload: any = {
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

  async queryBookings(filters: BookingQueryFilters): Promise<BookingDetails[]> {
    const query: Filter<BookingDetails> = {};

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.tripId) {
      query['infoDetails.id'] = filters.tripId;
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
        (query.bookingDetails).checkIn = { $gte: new Date(filters.dateFrom) };
      }

      if (filters.dateTo) {
        (query.bookingDetails).checkOut = { $lte: new Date(filters.dateTo) };
      }
    }

    let bookingsQuery = this.collection.find(query);

    if (filters.sortBy) {
      const sortDirection = filters.sortOrder === 'desc' ? -1 : 1;
      bookingsQuery = bookingsQuery.sort({ [filters.sortBy]: sortDirection });
    } else {
      bookingsQuery = bookingsQuery.sort({ createdAt: -1 });
    }

    if (filters.limit) {
      bookingsQuery = bookingsQuery.limit(filters.limit);

      if (filters.skip) {
        bookingsQuery = bookingsQuery.skip(filters.skip);
      }
    }

    return bookingsQuery.toArray();
  }

  async getPropertyBookings(filters: BookingQueryFilters = {}): Promise<BookingDetails[]> {
    return this.queryBookings({ ...filters, type: 'property' }) as Promise<BookingDetails[]>;
  }

  async getTravellingBookings(filters: BookingQueryFilters = {}): Promise<BookingDetails[]> {
    return this.queryBookings({ ...filters, type: 'travelling' }) as Promise<BookingDetails[]>;
  }

  async getTripBookings(filters: BookingQueryFilters = {}): Promise<BookingDetails[]> {
    return this.queryBookings({ ...filters, type: 'trip' }) as Promise<BookingDetails[]>;
  }

  async getManagerBookings(filters: ManagerBookingQueryFilters): Promise<BookingDetails[]> {
    const query: Filter<BookingDetails> = {};

    if (!filters.ownerId) {
      throw new Error('ownerId is required for manager bookings query');
    }

    query['infoDetails.ownerId'] = filters.ownerId;

    if (filters.type && filters.type !== 'all') {
      query.type = filters.type;
    }

    if (filters.status && filters.status !== 'all') {
       query.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.bookingDetails = query.bookingDetails || {};
      if (filters.dateFrom) {
        (query.bookingDetails).checkIn = { $gte: new Date(filters.dateFrom) };
      }
      if (filters.dateTo) {
        (query.bookingDetails).checkOut = { $lte: new Date(filters.dateTo) };
      }
    }

    if (filters.searchTerm) {
      const searchRegex = new RegExp(filters.searchTerm, 'i');
      query.$or = [
        { 'infoDetails.title': searchRegex },
        { 'infoDetails.locationFrom': searchRegex },
        { 'infoDetails.locationTo': searchRegex },
        { 'guestDetails.firstName': searchRegex },
        { 'guestDetails.lastName': searchRegex },
        { 'guestDetails.email': searchRegex },
        { 'type': searchRegex },
      ];
    }

    let bookingsQuery = this.collection.find(query);

    if (filters.sortBy) {
      const sortDirection = filters.sortOrder === 'desc' ? -1 : 1;
      bookingsQuery = bookingsQuery.sort({ [filters.sortBy]: sortDirection });
    } else {
      bookingsQuery = bookingsQuery.sort({ updatedAt: -1 });
    }

    if (filters.limit) {
      bookingsQuery = bookingsQuery.limit(filters.limit);
      if (filters.skip) {
        bookingsQuery = bookingsQuery.skip(filters.skip);
      }
    }
    return bookingsQuery.toArray();
  }

  async getManagerBookingsCount(filters: ManagerBookingQueryFilters): Promise<number> {
    const query: Filter<BookingDetails> = {};

    if (!filters.ownerId) {
      throw new Error('ownerId is required for manager bookings count');
    }
    query['infoDetails.ownerId'] = filters.ownerId;

    if (filters.type && filters.type !== 'all') {
      query.type = filters.type;
    }

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.bookingDetails = query.bookingDetails || {};
      if (filters.dateFrom) {
        (query.bookingDetails).checkIn = { $gte: new Date(filters.dateFrom) };
      }
      if (filters.dateTo) {
        
        (query.bookingDetails).checkOut = { $lte: new Date(filters.dateTo) };
      }
    }

    if (filters.searchTerm) {
      const searchRegex = new RegExp(filters.searchTerm, 'i');
      query.$or = [
        { 'infoDetails.title': searchRegex },
        { 'infoDetails.locationFrom': searchRegex },
        { 'infoDetails.locationTo': searchRegex },
        { 'guestDetails.firstName': searchRegex },
        { 'guestDetails.lastName': searchRegex },
        { 'guestDetails.email': searchRegex },
        { 'type': searchRegex },
      ];
    }

    return this.collection.countDocuments(query);
  }

  async getUpcomingManagerBookings(ownerId: string, limit: number = 5): Promise<BookingDetails[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.getManagerBookings({
      ownerId,
      dateFrom: today.toISOString(),
      status: 'confirmed',
      sortBy: 'bookingDetails.checkIn',
      sortOrder: 'asc',
      limit,
    });
  }

  async getRecentManagerBookings(ownerId: string, limit: number = 10): Promise<BookingDetails[]> {
    return this.getManagerBookings({
      ownerId,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      limit,
    });
  }
}

export async function getBookingRepository(): Promise<BookingRepository> {
  const db = await getDb();
  return new BookingRepository(db);
}
