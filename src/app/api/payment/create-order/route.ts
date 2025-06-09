import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { v4 as uuidv4 } from 'uuid';

// Initialize Razorpay client
// It's best practice to use environment variables for keys
const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
    try {
        const { amount, currency } = await request.json();

        if (!amount || !currency) {
            return NextResponse.json({ message: "Amount and currency are required" }, { status: 400 });
        }
        
        // Razorpay expects amount in the smallest currency unit (e.g., paise for INR)
        // The frontend should already be sending it this way (amountInSubunits)
        const options = {
            amount: amount,
            currency: currency,
            receipt: `${uuidv4()}`, // Generate a unique receipt ID
        };

        const order = await razorpay.orders.create(options);

        if (!order) {
            return NextResponse.json({ message: "Failed to create order with Razorpay" }, { status: 500 });
        }
        
        // Return the order details to the frontend
        return NextResponse.json(order, { status: 200 });

    } catch (error) {
        console.error("RAZORPAY_CREATE_ORDER_ERROR", error);
        // It's good to check the error type if possible
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ message: `Error creating order: ${errorMessage}` }, { status: 500 });
    }
}