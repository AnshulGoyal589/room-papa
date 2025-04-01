// app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBookingRepository, BookingQueryFilters } from '@/lib/booking-db';
import { BookingInput } from '@/lib/mongodb/models/booking';
import { sendBookingConfirmationEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    // Parse booking data from request
    const bookingData = await request.json() as BookingInput;
    
    // Validate the booking data
    if (!bookingData.tripDetails || !bookingData.bookingDetails || !bookingData.guestDetails) {
      return NextResponse.json(
        { message: 'Invalid booking data' },
        { status: 400 }
      );
    }
    
    // Get repository and create booking
    const bookingRepo = await getBookingRepository();
    const { id, booking } = await bookingRepo.createBooking(bookingData);
    
    // Send confirmation email
    if (bookingData.recipients && bookingData.recipients.length > 0) {
      await sendBookingConfirmationEmail(booking);
    }
    
    return NextResponse.json(
      { 
        message: 'Booking created successfully', 
        bookingId: id,
        booking
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { message: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters: BookingQueryFilters = {
      userId: searchParams.get('userId') || undefined,
      tripId: searchParams.get('tripId') || undefined,
      status: searchParams.get('status') as 'pending' | 'confirmed' | 'cancelled' || undefined,
      type: searchParams.get('type') as 'property' | 'travelling' | 'trip' || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || undefined,
      limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      skip: searchParams.has('skip') ? parseInt(searchParams.get('skip')!) : undefined
    };
    
    // Get repository and query bookings
    const bookingRepo = await getBookingRepository();
    const bookings = await bookingRepo.queryBookings(filters);
    
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { message: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}