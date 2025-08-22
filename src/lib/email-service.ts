// lib/email-service.ts
import nodemailer from 'nodemailer';
import { BookingDetails } from './mongodb/models/Booking';
// import { Booking } from '@/lib/mongodb/models/Booking';
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

export async function sendRoleConfirmationEmail(email: string) {
  const subject = 'New User Registration on Room Papa';

  // Create email content
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #333;">User Approval</h2>
      <p>Hello,</p>
      <p>Please visit admin portal to verify new user with email id ${email}.</p>
      <p>Thank you,</p>
      <p><strong>The Team</strong></p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
        <p>This is an automated email. Please do not reply to this message.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: email,
      to: process.env.admin_mail || 'roompapa7@gmail.com' ,
      subject: subject,
      html: emailHtml,
    });
    console.log(`Role approval email sent successfully from ${email}`);
  } catch (error) {
    console.error(`Error sending role confirmation email to ${email}:`, error);
    // Re-throw the error so the API route can catch it and send a 500 response
    throw new Error('Failed to send role confirmation email.');
  }
}

// Helper function to send booking confirmation email
export async function sendBookingConfirmationEmail(booking: BookingDetails) {
  const { details, bookingDetails, guestDetails, recipients } = booking;
  
  // Format dates for email
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
  
  // Get booking type specific details
  let bookingTypeSpecificDetails = '';
  
  if (booking.type === 'property') {
    const propertyBooking = booking;
    bookingTypeSpecificDetails = `
      <p><strong>Property Type:</strong> ${propertyBooking.details.type}</p>
      <p><strong>Guests:</strong> ${propertyBooking.bookingDetails.totalGuests}</p>
      <p><strong>Rooms:</strong> ${propertyBooking.bookingDetails.rooms}</p>
    `;
  } else if (booking.type === 'travelling') {
    const travellingBooking = booking;
    bookingTypeSpecificDetails = `
      <p><strong>Transport Type:</strong> ${travellingBooking.details.type}</p>
    `;
  } else if (booking.type === 'trip') {
    const tripBooking = booking;
    bookingTypeSpecificDetails = `
      <h4>Destination:</h4>
  
        ${tripBooking.details.locationFrom ? `<li>From: ${tripBooking.details.locationFrom}</li>` : ''}
        <li>To: ${tripBooking.details.locationTo}</li>
 }
    `;
  }
  
  // Create email content
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${booking.type.charAt(0).toUpperCase() + booking.type.slice(1)} Booking Confirmation</h2>
      
      <p>Dear ${guestDetails.firstName} ${guestDetails.lastName},</p>
      
      <p>Your ${booking.type} booking for <strong>${details.title}</strong> has been confirmed!</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Booking Details:</h3>
        <p><strong>Booking Type:</strong> ${booking.type.charAt(0).toUpperCase() + booking.type.slice(1)}</p>
        <p><strong>Destination:</strong> ${details.locationTo}</p>
        <p><strong>Check-in:</strong> ${checkInDate}</p>
        <p><strong>Check-out:</strong> ${checkOutDate}</p>
        <p><strong>Guests:</strong> ${guestDetails.firstName} ${guestDetails.lastName}</p>
        <p><strong>Total Price:</strong> ${bookingDetails.currency} ${bookingDetails.totalPrice.toFixed(2)}</p>
        
        ${bookingTypeSpecificDetails}
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
      subject: `${booking.type.charAt(0).toUpperCase() + booking.type.slice(1)} Booking Confirmation - ${details.title}`,
      html: emailHtml,
    });
    
    // console.log('Booking confirmation email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    // We don't throw here to avoid failing the API response if only the email fails
    return false;
  }
}