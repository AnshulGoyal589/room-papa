// src/app/api/properties/[propertyId]/reviews/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBookingRepository } from '@/lib/booking-db';
import { ObjectId } from 'mongodb';

export async function POST(
    request: NextRequest
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const propertyId = (await request.json()).propertyId;
        const body = await request.json();
        const { bookingId, rating, comment } = body;

        if (!ObjectId.isValid(propertyId) || !ObjectId.isValid(bookingId)) {
            return NextResponse.json({ message: 'Invalid property or booking ID.' }, { status: 400 });
        }
        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ message: 'Rating must be between 1 and 5.' }, { status: 400 });
        }
        if (!comment || comment.trim().length < 10) {
            return NextResponse.json({ message: 'Comment must be at least 10 characters long.' }, { status: 400 });
        }

        const bookingRepository = await getBookingRepository();
        const booking = await bookingRepository.getBookingById(bookingId);

        // --- Security & Business Logic Checks ---
        if (!booking) {
            return NextResponse.json({ message: 'Booking not found.' }, { status: 404 });
        }
        if (booking.userId !== userId) {
            return NextResponse.json({ message: 'You are not authorized to review this booking.' }, { status: 403 });
        }
        if (booking?.propertyId?.toString() !== propertyId) {
            return NextResponse.json({ message: 'This booking does not match the property.' }, { status: 400 });
        }
        if (new Date(booking.bookingDetails.checkOut) > new Date()) {
             return NextResponse.json({ message: 'You can only review bookings after the check-out date.' }, { status: 400 });
        }
        if (booking.isReviewed) {
             return NextResponse.json({ message: 'A review has already been submitted for this booking.' }, { status: 409 }); // 409 Conflict
        }

        // --- Get User Name for the Review ---
        // Option 1: From Clerk's session (simpler)
        // const { user } = auth();
        // const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Anonymous';

        // // Option 2: From your own User model (if you store more profile data)
        // // const userRepository = await getUserRepository();
        // // const appUser = await userRepository.findUserById(userId);
        // // const userName = appUser ? `${appUser.firstName} ${appUser.lastName}` : 'Anonymous';

        // const review = {
        //     _id: new ObjectId(), // Generate a new ID for the embedded review doc
        //     userId,
        //     bookingId: new ObjectId(bookingId),
        //     name: userName,
        //     rating,
        //     comment,
        //     date: new Date(),
        // };

        // const propertyRepository = await getPropertyRepository();
        
        // // --- Database Update ---
        // // Use a transaction here in a real production app to ensure both updates succeed or fail together.
        
        // // 1. Add the review to the property
        // const propertyUpdateResult = await propertyRepository.addReview(propertyId, review);
        // if (!propertyUpdateResult.modifiedCount) {
        //      throw new Error('Failed to add review to the property.');
        // }
        
        // // 2. Mark the booking as reviewed
        // const bookingUpdateResult = await bookingRepository.updateBooking(bookingId, { isReviewed: true });
        //  if (!bookingUpdateResult.modifiedCount) {
        //      // You might want to handle this case, e.g., by trying to revert the property update.
        //      console.warn(`Booking ${bookingId} was not marked as reviewed, but the review was added.`);
        // }
        
        // You could also recalculate the property's average rating here.

        // return NextResponse.json(review, { status: 201 });

    } catch (error) {
        console.error("Failed to submit review:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}