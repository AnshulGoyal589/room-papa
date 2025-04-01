// app/api/bookings/manager/count/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBookingRepository } from '@/lib/booking-db';

export async function GET(req: NextRequest) {
  try {
    
    // Initialize the booking repository
    const bookingRepository = await getBookingRepository();
    
    // Parse query parameters (optional)
    const url = new URL(req.url);
    const userId =  url.searchParams.get('ownerId');
    // const type = url.searchParams.get('type') as 'property' | 'travelling' | 'trip' | undefined;
    // const status = url.searchParams.get('status') as 'pending' | 'confirmed' | 'cancelled' | undefined;
    // const searchTerm = url.searchParams.get('searchTerm') || undefined;
    
    if( !userId ){
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }
    // Get total count of bookings matching the filters
    const count = await bookingRepository.getManagerBookingsCount({
      ownerId : userId
    //   type,
    //   status,
    //   searchTerm
    });
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error counting manager bookings:', error);
    return NextResponse.json(
      { error: 'Failed to count bookings' },
      { status: 500 }
    );
  }
}