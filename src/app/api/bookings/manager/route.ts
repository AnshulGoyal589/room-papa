import { NextRequest, NextResponse } from 'next/server';
import { getBookingRepository } from '@/lib/booking-db';

export async function GET(req: NextRequest) {
  try {
  
    const bookingRepository = await getBookingRepository();

    // console.log("Booking Repository: ", bookingRepository);
    
    // Parse query parameters (optional)
    const url = new URL(req.url);

    // console.log("URL:", url);

    const userId =  url.searchParams.get('ownerId');
    const type = url.searchParams.get('type') as 'property' | 'travelling' | 'trip';
    const searchTerm = url.searchParams.get('searchTerm') || '';
    // const status = url.searchParams.get('status') as 'pending' | 'confirmed' | 'cancelled' | undefined;
    const sortBy = url.searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined;
    const skip = url.searchParams.get('skip') ? parseInt(url.searchParams.get('skip')!) : undefined;
    
    if(!userId){
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }
    
    const bookings = await bookingRepository.getManagerBookings({ 
      ownerId: userId,
      type,
      // status,
      sortBy,
      sortOrder,
      searchTerm,
      limit,
      skip
    });

    // console.log("Bookings: ",bookings);
    
    // Convert MongoDB ObjectIds to strings for JSON serialization
    const formattedBookings = bookings.map(booking => ({
      ...booking,
      _id: booking._id?.toString()
    }));
    
    return NextResponse.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching manager bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}