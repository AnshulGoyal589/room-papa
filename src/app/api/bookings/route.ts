import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import nodemailer from 'nodemailer';

// Define types for booking details
export interface BookingDetails {
  type: 'property' | 'travelling' | 'trip';
  details: {
    id: string;
    title: string;
    locationFrom?: string; // Optional for property bookings
    locationTo: string;
    type: string;
  };
  bookingDetails: {
    checkIn: string;
    checkOut: string;
    guests: number;
    price: number;
    currency: string;
    totalPrice: number;
  };
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    passengers?: number; // Optional for property bookings
    specialRequests?: string; // Optional
  };
  recipients: string[];
}

// Configure email transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// POST handler for creating a booking
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    
    const bookingData = await request.json() as BookingDetails;

    // console.log("Booking Data:", bookingData);
    
    if (!bookingData.bookingDetails || !bookingData.guestDetails) {
      return NextResponse.json(
        { message: 'Invalid booking data' },
        { status: 400 }
      );
    }
    
    // Create a new booking record in the database
    const bookingsCollection = db.collection('bookings');
    const result = await bookingsCollection.insertOne({
      ...bookingData,
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Send confirmation email
    if (bookingData.recipients && bookingData.recipients.length > 0) {
      await sendBookingConfirmationEmail(bookingData);
    }
    
    return NextResponse.json(
      { 
        message: 'Booking created successfully', 
        bookingId: result.insertedId 
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

// GET handler for fetching bookings
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const id = searchParams.get('id'); // Universal ID filter for trip/property/travelling
    const status = searchParams.get('status');
    const bookingType = searchParams.get('type'); // Filter by booking type
    
    // Build query based on parameters
    const query: Record<string, string> = {};
    
    if (userId) {
      query['guestDetails.userId'] = userId;
    }
    
    if (id) {
      query['details.id'] = id; // Universal ID search
    }
    
    if (status) {
      query.status = status;
    }
    
    if (bookingType) {
      query.type = bookingType; // Filter by type
    }
    
    // Fetch bookings from the database
    const bookingsCollection = db.collection('bookings');
    const bookings = await bookingsCollection.find(query).toArray();
    
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { message: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// Helper function to send booking confirmation email
async function sendBookingConfirmationEmail(bookingData: BookingDetails) {
  const { details, bookingDetails, guestDetails, recipients } = bookingData;

  // Format dates for email content
  const checkInDate = new Date(bookingDetails.checkIn).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const checkOutDate = new Date(bookingDetails.checkOut).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Create dynamic email content based on booking type
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin:auto;">
    <h2>Booking Confirmation</h2>
    <p>Dear ${guestDetails.firstName} ${guestDetails.lastName},</p>
    <p>Your ${bookingData.type} booking for <strong>${details.title}</strong> has been confirmed!</p>
    <div style="background-color:#f8f9fa;padding15px;border-radius5px;margin20px">
    <h3>Booking Details:</h3>
    <p><strong>Booking Type:</strong>${bookingData.type.charAt(0).toUpperCase()+bookingData.type.slice(1)}</p>
    <p><strong>Destination:</strong>${details.locationTo}</p>
    <p><strong>Check-in:</strong>${checkInDate}</p>
    <p><strong>Check-out:</strong>${checkOutDate}</p>
    <p><strong>Total Price:</strong> ${bookingDetails.currency} ${bookingDetails.totalPrice.toFixed(2)}</p>
    </div>

    ${guestDetails.specialRequests ? `
      <div style="margin: 20px 0;">
        <h3>Special Requests:</h3>
        <p>${guestDetails.specialRequests}</p>
      </div>
    ` : ''}

    <p>If you have any questions about your booking, please feel free to contact us.</p>

    <p>Thank you for choosing our service!</p>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
    </div>
    `;

  // Send email to all recipients
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'bookings@example.com',
      to: recipients.join(', '),
      subject: `${bookingData.type.charAt(0).toUpperCase() + bookingData.type.slice(1)} Booking Confirmation - ${details.title}`,
      html: emailHtml,
    });
    
    console.log('Booking confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    // We don't throw here to avoid failing the API response if only the email fails
  }
}

