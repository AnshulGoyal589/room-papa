import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { getBookingRepository } from '@/lib/booking-db';
import { Booking } from '@/lib/mongodb/models/Booking';
import { getPropertiesCollection } from '@/lib/mongodb/models/Property';
import { sendBookingConfirmationEmail } from '@/lib/email-service';

const getDatesInRange = (startDate: Date, endDate: Date): string[] => {
    const dates: string[] = [];
    const currentDate = new Date(startDate.toISOString().split('T')[0]);
    while (currentDate < endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingPayload } = body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingPayload) {
            return NextResponse.json({ message: "Missing payment or booking details for confirmation." }, { status: 400 });
        }

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
            console.warn(`Invalid payment signature received. Expected: ${expectedSignature}, Got: ${razorpay_signature}`);
            return NextResponse.json({ message: "Payment verification failed: Invalid signature." }, { status: 400 });
        }
        
        const bookingInput: Booking = {
            type: bookingPayload.type,
            infoDetails: bookingPayload.infoDetails,
            bookingDetails: {
                ...bookingPayload.bookingDetails,
                payment: {
                    provider: 'razorpay',
                    orderId: razorpay_order_id,
                    paymentId: razorpay_payment_id,
                    status: 'succeeded',
                },
            },
            guestDetails: bookingPayload.guestDetails,
            recipients: bookingPayload.recipients
        };

        const bookingRepository = await getBookingRepository();
        const { id: newBookingId } = await bookingRepository.createBooking(bookingInput);

        if (bookingPayload.type === 'property') {
            const datesToBlock = getDatesInRange(
                new Date(bookingPayload.bookingDetails.checkIn),
                new Date(bookingPayload.bookingDetails.checkOut)
            );

            const validRoomsToUpdate = bookingPayload.bookingDetails.roomsDetail.filter(
                (room: { categoryId: string }) => room.categoryId && ObjectId.isValid(room.categoryId)
            );

            if (validRoomsToUpdate.length > 0) {
                const categoryObjectIdsToUpdate = validRoomsToUpdate.map(
                    (room: { categoryId: string }) => new ObjectId(room.categoryId)
                );
                
                const propertiesCollection = await getPropertiesCollection();

                await propertiesCollection.updateMany(
                    { 
                        _id: new ObjectId(bookingPayload.infoDetails.id),
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
        
        await sendBookingConfirmationEmail(bookingInput);

        return NextResponse.json({
            success: true,
            message: "Booking confirmed successfully!",
            bookingId: newBookingId,
        }, { status: 201 });

    } catch (error) {
        console.error("CONFIRM_BOOKING_API_ERROR", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
        return NextResponse.json({ message: `Error confirming booking: ${errorMessage}` }, { status: 500 });
    }
}
