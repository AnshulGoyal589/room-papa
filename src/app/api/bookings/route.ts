import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import nodemailer from 'nodemailer';
import { BookingDetails } from '@/lib/mongodb/models/Booking';


// Configure email transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_ADMIN,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// // POST handler for creating a booking
// export async function POST(request: NextRequest) {
//   try {

//     const db = await getDb();
    
//     const bookingData = await request.json() as BookingDetails;
    
//     if (!bookingData.bookingDetails || !bookingData.guestDetails) {
//       return NextResponse.json(
//         { message: 'Invalid booking data' },
//         { status: 400 }
//       );
//     }

    
//     const bookingsCollection = db.collection('bookings');
//     const result = await bookingsCollection.insertOne({
//       ...bookingData,
//       status: 'confirmed',
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });
    
//     if (bookingData.recipients && bookingData.recipients.length > 0) {
//       await sendBookingConfirmationEmail(bookingData);
//     }
    
//     return NextResponse.json(
//       { 
//         message: 'Booking created successfully', 
//         bookingId: result.insertedId 
//       },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error('Error creating booking:', error);
//     return NextResponse.json(
//       { message: 'Failed to create booking' },
//       { status: 500 }
//     );
//   }
// }

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

export async function sendBookingConfirmationEmail(bookingData: BookingDetails) { 
  const { infoDetails, bookingDetails, guestDetails, recipients } = bookingData;

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
  
//   const emailHtml = `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Booking Confirmation</title>
//     <style>
//         /* Basic responsive styles */
//         @media screen and (max-width: 600px) {
//             .container {
//                 width: 100% !important;
//             }
//             .content {
//                 padding: 20px !important;
//             }
//         }
//     </style>
// </head>
// <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
//     <table border="0" cellpadding="0" cellspacing="0" width="100%">
//         <tr>
//             <td style="padding: 20px 0; background-color: #f4f4f4;" align="center">
//                 <!-- Main Container Table -->
//                 <table class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-collapse: collapse;">
                    
//                     <!-- Header with Logo -->
//                     <tr>
//                         <td align="center" style="padding: 30px 20px 20px 20px; background-color: #007BFF; color: #ffffff;">
//                             <!-- Replace with your logo URL -->
//                             <img src="https://your-logo-url.com/logo-white.png" alt="Your Company Logo" width="150" style="display: block;">
//                             <h1 style="margin: 10px 0 0 0; font-family: Arial, sans-serif;">Booking Confirmed!</h1>
//                         </td>
//                     </tr>

//                     <!-- Main Content -->
//                     <tr>
//                         <td class="content" style="padding: 40px 30px; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333;">
//                             <h2 style="margin: 0 0 20px 0;">Dear ${guestDetails.firstName} ${guestDetails.lastName},</h2>
//                             <p>Thank you for your booking! We're excited to confirm your ${bookingData.type} reservation for <strong>${details.title}</strong>.</p>
                            
//                             <!-- Booking Details Card -->
//                             <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0; border: 1px solid #dddddd; border-radius: 5px;">
//                                 <tr>
//                                     <td style="padding: 20px;">
//                                         <h3 style="margin: 0 0 15px 0; font-family: Arial, sans-serif; color: #007BFF;">Your Booking Details</h3>
//                                         <p style="margin: 5px 0;"><strong>Type:</strong> ${bookingData.type.charAt(0).toUpperCase() + bookingData.type.slice(1)}</p>
//                                         <p style="margin: 5px 0;"><strong>Destination:</strong> ${details.locationTo}</p>
//                                         <p style="margin: 5px 0;"><strong>Check-in:</strong> ${checkInDate}</p>
//                                         <p style="margin: 5px 0;"><strong>Check-out:</strong> ${checkOutDate}</p>
//                                         <p style="margin: 15px 0 0 0; font-size: 18px;"><strong>Total Price:</strong> ${bookingDetails.currency} ${bookingDetails.totalPrice.toFixed(2)}</p>
//                                     </td>
//                                 </tr>
//                             </table>

//                             <!-- Special Requests (Conditional) -->
//                             ${guestDetails.specialRequests ? `
//                                 <div style="margin: 30px 0;">
//                                     <h3 style="margin: 0 0 10px 0; font-family: Arial, sans-serif;">Your Special Requests:</h3>
//                                     <p style="margin: 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007BFF;"><em>${guestDetails.specialRequests}</em></p>
//                                 </div>
//                             ` : ''}

//                             <p>If you have any questions or need to make changes to your booking, please don't hesitate to contact our support team.</p>
                            
//                             <!-- Call to Action Button -->
//                             <table border="0" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
//                                 <tr>
//                                     <td align="center" style="border-radius: 5px;" bgcolor="#007BFF">
//                                         <a href="https://your-website.com/manage-booking" target="_blank" style="font-size: 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 5px; padding: 12px 25px; border: 1px solid #007BFF; display: inline-block;">Manage Your Booking</a>
//                                     </td>
//                                 </tr>
//                             </table>

//                         </td>
//                     </tr>

//                     <!-- Footer -->
//                     <tr>
//                         <td style="padding: 20px 30px; background-color: #eeeeee; font-family: Arial, sans-serif; font-size: 12px; color: #777777; text-align: center;">
//                             <p>Thank you for choosing our service!</p>
//                             <p>This is an automated email. Please do not reply directly to this message.</p>
//                             <p>&copy; ${new Date().getFullYear()} Your Company Name | 123 Street, City, Country</p>
//                         </td>
//                     </tr>
//                 </table>
//             </td>
//         </tr>
//     </table>
// </body>
// </html>
// `;

// const emailHtml = `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Your Booking Confirmation</title>
// </head>
// <body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', Times, serif; background-color: #f9f9f9;">
//     <table border="0" cellpadding="0" cellspacing="0" width="100%">
//         <tr>
//             <td align="center" style="padding: 20px 0;">
//                 <!-- Main Container Table -->
//                 <table border="0" cellpadding="0" cellspacing="0" width="600" style="border: 1px solid #dcdcdc; background-color: #ffffff; border-collapse: collapse;">
                    
//                     <!-- Header -->
//                     <tr>
//                         <td align="center" style="padding: 20px 0; border-bottom: 1px solid #dcdcdc;">
//                             <!-- Replace with your logo URL -->
//                             <img src="https://your-logo-url.com/logo-dark.png" alt="Your Company Logo" width="180" style="display: block;">
//                         </td>
//                     </tr>

//                     <!-- Main Content -->
//                     <tr>
//                         <td style="padding: 30px 40px; color: #444444; font-size: 16px; line-height: 1.7;">
//                             <h2 style="font-family: Georgia, serif; color: #222222; margin: 0 0 15px 0;">Your Booking is Confirmed</h2>
//                             <p>Dear ${guestDetails.firstName} ${guestDetails.lastName},</p>
//                             <p>We are pleased to confirm your ${bookingData.type} reservation for <strong>${details.title}</strong>. Your itinerary is detailed below.</p>
                            
//                             <div style="border-top: 2px solid #eeeeee; margin: 30px 0;"></div>

//                             <!-- Booking Details Section -->
//                             <h3 style="font-family: Georgia, serif; color: #222222; margin: 0 0 20px 0;">Reservation Details</h3>
                            
//                             <table border="0" cellpadding="0" cellspacing="0" width="100%">
//                                 <tr>
//                                     <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Booking Type:</strong></td>
//                                     <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: right;">${bookingData.type.charAt(0).toUpperCase() + bookingData.type.slice(1)}</td>
//                                 </tr>
//                                 <tr>
//                                     <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Destination:</strong></td>
//                                     <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: right;">${details.locationTo}</td>
//                                 </tr>
//                                 <tr>
//                                     <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Check-in Date:</strong></td>
//                                     <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: right;">${checkInDate}</td>
//                                 </tr>
//                                 <tr>
//                                     <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Check-out Date:</strong></td>
//                                     <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: right;">${checkOutDate}</td>
//                                 </tr>
//                                  <tr>
//                                     <td style="padding: 15px 0 10px 0;"><strong>Total Price:</strong></td>
//                                     <td style="padding: 15px 0 10px 0; text-align: right; font-size: 18px; font-weight: bold; color: #222222;">${bookingDetails.currency} ${bookingDetails.totalPrice.toFixed(2)}</td>
//                                 </tr>
//                             </table>

//                             <!-- Special Requests (Conditional) -->
//                             ${guestDetails.specialRequests ? `
//                                 <div style="margin: 30px 0;">
//                                     <h3 style="font-family: Georgia, serif; color: #222222; margin: 0 0 10px 0;">Special Requests</h3>
//                                     <p style="margin: 0; font-style: italic;">${guestDetails.specialRequests}</p>
//                                 </div>
//                             ` : ''}
                            
//                             <p style="margin-top: 30px;">For any questions or assistance, please reply to this email or call us at [Your Phone Number]. We look forward to serving you!</p>
//                         </td>
//                     </tr>

//                     <!-- Footer -->
//                     <tr>
//                         <td style="padding: 20px 30px; background-color: #f1f1f1; font-family: Arial, sans-serif; font-size: 12px; color: #888888; text-align: center;">
//                             <p style="margin: 0;">This email was sent to you as a confirmation of your booking.</p>
//                             <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Your Company, Inc. All Rights Reserved.</p>
//                         </td>
//                     </tr>
//                 </table>
//             </td>
//         </tr>
//     </table>
// </body>
// </html>
// `;

const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', Times, serif; background-color: #f9f9f9;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <!-- Main Container Table -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="border: 1px solid #dcdcdc; background-color: #ffffff; border-collapse: collapse;">
                    
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 20px 0; border-bottom: 1px solid #dcdcdc;">
                            <!-- Replace with your logo URL (a full-color logo works great here) -->
                            <img src="https://roompapa.com/_next/image?url=%2Fassets%2Flogo.jpg&w=256&q=75" alt="Your Company Logo" width="180" style="display: block;">
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 30px 40px; color: #444444; font-size: 16px; line-height: 1.7;">
                            <h2 style="font-family: Georgia, serif; color: #0056b3; margin: 0 0 15px 0;">Your Booking is Confirmed</h2>
                            <p>Dear ${guestDetails.firstName} ${guestDetails.lastName},</p>
                            <p>We are pleased to confirm your ${bookingData.type} reservation for <strong>${infoDetails.title}</strong>. Your itinerary is detailed below.</p>
                            
                            <div style="border-top: 2px solid #0056b3; margin: 30px 0;"></div>

                            <!-- Booking Details Section -->
                            <h3 style="font-family: Georgia, serif; color: #0056b3; margin: 0 0 20px 0;">Reservation Details</h3>
                            
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Booking Type:</strong></td>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: right;">${bookingData.type.charAt(0).toUpperCase() + bookingData.type.slice(1)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Destination:</strong></td>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: right;">${infoDetails.locationTo}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Check-in Date:</strong></td>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: right;">${checkInDate}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Check-out Date:</strong></td>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: right;">${checkOutDate}</td>
                                </tr>
                                 <tr>
                                    <td style="padding: 15px 0 10px 0;"><strong>Total Price:</strong></td>
                                    <td style="padding: 15px 0 10px 0; text-align: right; font-size: 18px; font-weight: bold; color: #0056b3;">${bookingDetails.currency} ${bookingDetails.totalPrice.toFixed(2)}</td>
                                </tr>
                            </table>

                            <!-- Special Requests (Conditional) -->
                            ${guestDetails.specialRequests ? `
                                <div style="margin: 30px 0;">
                                    <h3 style="font-family: Georgia, serif; color: #0056b3; margin: 0 0 10px 0;">Special Requests</h3>
                                    <p style="margin: 0; font-style: italic;">${guestDetails.specialRequests}</p>
                                </div>
                            ` : ''}
                            
                            <p style="margin-top: 30px;">For any questions or assistance, please reply to this email or call us at <a href="tel:YOUR-PHONE-NUMBER" style="color: #0056b3; text-decoration: none;">[Your Phone Number]</a>. We look forward to serving you!</p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; background-color: #f1f1f1; font-family: Arial, sans-serif; font-size: 12px; color: #888888; text-align: center;">
                            <p style="margin: 0;">This email was sent to you as a confirmation of your booking.</p>
                            <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Your Company, Inc. All Rights Reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'roompapa7@gmail.com',
      to: recipients.join(', '),
      subject: `${bookingData.type.charAt(0).toUpperCase() + bookingData.type.slice(1)} Booking Confirmation - ${infoDetails.title}`,
      html: emailHtml,
    });
    
    // console.log('Booking confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    // We don't throw here to avoid failing the API response if only the email fails
  }
}

