import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';

// Your custom repository and type imports
import { getBookingRepository } from '@/lib/booking-db';
import { BookingInputData } from '@/lib/mongodb/models/Booking';
import { getPropertiesCollection } from '@/lib/mongodb/models/Property';

/**
 * Helper function to get an array of date strings (YYYY-MM-DD) between two dates.
 * @param startDate - The start date of the range.
 * @param endDate - The end date of the range (exclusive).
 * @returns An array of date strings.
 */
const getDatesInRange = (startDate: Date, endDate: Date): string[] => {
    const dates: string[] = [];
    // Clone the date to avoid modifying the original
    const currentDate = new Date(startDate.toISOString().split('T')[0]);
    
    while (currentDate < endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

/**
 * API Route to confirm a Razorpay payment and finalize a booking.
 * 
 * This route performs three critical actions:
 * 1. Verifies the authenticity of the payment using a cryptographic signature.
 * 2. Creates a new booking record in the database using the BookingRepository.
 * 3. Updates the property's availability to block the booked dates for the selected rooms.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingPayload } = body;

        // --- 0. Initial Validation ---
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingPayload) {
            return NextResponse.json({ message: "Missing payment or booking details for confirmation." }, { status: 400 });
        }

        // --- 1. Verify Razorpay Signature ---
        const key_secret = process.env.RAZORPAY_KEY_SECRET;
        if (!key_secret) {
            console.error("RAZORPAY_KEY_SECRET is not set in environment variables.");
            throw new Error("Server payment configuration error.");
        }

        const expectedSignature = crypto
            .createHmac('sha256', key_secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            // Signature mismatch - payment is not authentic.
            console.warn(`Invalid payment signature received. Expected: ${expectedSignature}, Got: ${razorpay_signature}`);
            return NextResponse.json({ message: "Payment verification failed: Invalid signature." }, { status: 400 });
        }
        
        // --- 2. Construct Booking Data & Create Booking via Repository ---
        // At this point, the payment is confirmed to be authentic.
        
        // Map the payload from the frontend to the structure your repository's createBooking method expects.
        // console.log("hurrah: ", bookingPayload);
        const bookingInput: BookingInputData = {
            type: bookingPayload.type, // 'property', 'travelling', etc.
            details: {
                id: bookingPayload.details.id,
                title: bookingPayload.details.title,
                locationFrom: bookingPayload.details.locationFrom,
                locationTo: bookingPayload.details.locationTo,
                type: bookingPayload.details.type, // e.g., 'Hotel', 'Apartment'
                ownerId: bookingPayload.details.ownerId,
                reservationPolicy : bookingPayload.details.reservationPolicy, // e.g., 'flexible', 'strict'
            },
            bookingDetails: {
                ...bookingPayload.bookingDetails,
                // Embed payment information directly into the booking record for auditing.
                payment: {
                    provider: 'razorpay',
                    orderId: razorpay_order_id,
                    paymentId: razorpay_payment_id,
                    status: 'succeeded',
                },
            },
            guestDetails: {
                ...bookingPayload.guestDetails,
                // Ensure userId from Clerk is correctly mapped.
                userId: bookingPayload.userId, 
            },
            recipients: bookingPayload.recipients,
            userId: bookingPayload.userId, // Top-level userId for easy querying
        };

        const bookingRepository = await getBookingRepository();

        // console.log("Creating booking with input:", bookingPayload);
        
        // The repository handles the creation logic.
        const { id: newBookingId } = await bookingRepository.createBooking(bookingInput);

        // --- 3. Update Property Availability to Prevent Double Booking ---
        // This is a critical side-effect of a successful booking.
        if (bookingPayload.type === 'property') {
            const datesToBlock = getDatesInRange(
                new Date(bookingPayload.bookingDetails.checkIn),
                new Date(bookingPayload.bookingDetails.checkOut)
            );

            // Convert string IDs from the payload into MongoDB ObjectIds for the query.
            const validRoomsToUpdate = bookingPayload.bookingDetails.roomsDetail.filter(
                (room: { categoryId: string }) => room.categoryId && ObjectId.isValid(room.categoryId)
            );

            // If there are no valid rooms to update, we can skip this step.
            if (validRoomsToUpdate.length > 0) {
                const categoryObjectIdsToUpdate = validRoomsToUpdate.map(
                    (room: { categoryId: string }) => new ObjectId(room.categoryId)
                );
                
                const propertiesCollection = await getPropertiesCollection();

                await propertiesCollection.updateMany(
                    { 
                        _id: new ObjectId(bookingPayload.details.id),
                        "categoryRooms._id": { $in: categoryObjectIdsToUpdate }
                    },
                    { 
                        $addToSet: { 
                            "categoryRooms.$[elem].unavailableDates": { $each: datesToBlock }
                        } 
                    },
                    { 
                        arrayFilters: [{ "elem._id": { $in: categoryObjectIdsToUpdate } }] 
                    }
                );
            } else {
                console.warn("No valid room categories found in the payload to update availability.");
            }
        }
        
        // --- 4. Send Success Response ---
        // The frontend will receive this and can then redirect the user to a success page.
        // You could also trigger other post-booking actions here, like sending a confirmation email.
        
        return NextResponse.json({
            success: true,
            message: "Booking confirmed successfully!",
            bookingId: newBookingId,
        }, { status: 201 }); // 201 Created is an appropriate status code here.

    } catch (error) {
        console.error("CONFIRM_BOOKING_API_ERROR", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
        
        // Return a generic but helpful error message to the client.
        return NextResponse.json({ message: `Error confirming booking: ${errorMessage}` }, { status: 500 });
    }
}