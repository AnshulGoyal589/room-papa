import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBookingRepository } from '@/lib/booking-db';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const param = await params;
        // 1. Authenticate the user
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        
        const bookingId = param.id;
        if (!bookingId) {
            return new NextResponse("Booking ID is required", { status: 400 });
        }
        
        // 2. Get the booking and verify ownership
        const bookingRepository = await getBookingRepository();
        const booking = await bookingRepository.getBookingById(bookingId);

        if (!booking) {
            return new NextResponse("Booking not found", { status: 404 });
        }

        // Security check: Ensure the person cancelling is the one who booked it
        if (booking.guestDetails.userId !== userId) {
            return new NextResponse("Forbidden: You are not authorized to cancel this booking.", { status: 403 });
        }
        
        // 3. Check if the booking can be cancelled
        if (booking.status === 'cancelled') {
             return new NextResponse("This booking has already been cancelled.", { status: 400 });
        }
        
        // Optional: Add business logic, e.g., prevent cancellation after check-in
        const checkInDate = new Date(booking.bookingDetails.checkIn);
        if (new Date() > checkInDate) {
            return new NextResponse("Cannot cancel a booking after the check-in date has passed.", { status: 400 });
        }

        // 4. Perform the cancellation using the repository
        const reason = "Cancelled by user."; // You could pass a reason from the frontend if needed
        const success = await bookingRepository.cancelBooking(bookingId, reason);

        if (!success) {
            throw new Error("Failed to update booking status in the database.");
        }

        // 5. Return the updated booking
        const updatedBooking = await bookingRepository.getBookingById(bookingId);

        return NextResponse.json(updatedBooking);

    } catch (error) {
        console.error("[BOOKING_CANCEL_ERROR]", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return new NextResponse(`Internal Server Error: ${errorMessage}`, { status: 500 });
    }
}