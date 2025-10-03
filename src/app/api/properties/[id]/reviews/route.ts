import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBookingRepository } from '@/lib/booking-db';
import { ObjectId } from 'mongodb';
import { addPropertyReview } from '@/lib/mongodb/models/Property';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const {id:propertyId} = await params; 

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
        

        if (!booking) {
            return NextResponse.json({ message: 'Booking not found.' }, { status: 404 });
        }
        if (booking.userId !== userId) {
            return NextResponse.json({ message: 'You are not authorized to review this booking.' }, { status: 403 });
        }
        if (booking?.tripDetails?.id?.toString() !== propertyId) {
            return NextResponse.json({ message: 'This booking does not match the property.' }, { status: 400 });
        }
        if (booking.isReviewed) {
             return NextResponse.json({ message: 'A review has already been submitted for this booking.' }, { status: 409 }); // 409 Conflict
        }
        
        const response  = await addPropertyReview(propertyId, {
            rating,
            comment,
            name: "testing",
            date: new Date()
        });

        return NextResponse.json({ message: 'Review submitted successfully.' }, { status: 201 });

    } catch (error) {
        console.error("Failed to submit review:", error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}