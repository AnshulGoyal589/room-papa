import nodemailer from 'nodemailer';
import { Booking } from '@/lib/mongodb/models/Booking';

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
      to: process.env.ADMIN_EMAIL || 'roompapa7@gmail.com',
      subject: subject,
      html: emailHtml,
    });
    // console.log(`Role approval email sent successfully from ${email}`);
  } catch (error) {
    console.error(`Error sending role confirmation email to ${email}:`, error);
    // Re-throw the error so the API route can catch it and send a 500 response
    throw new Error('Failed to send role confirmation email.');
  }
}


export async function sendBookingConfirmationEmail(bookingData: Booking) { 
  const { infoDetails, bookingDetails, guestDetails, recipients, _id : bookingId, createdAt } = bookingData;

  // --- Helper Functions ---
  const formatDate = (date: string | Date, options: Intl.DateTimeFormatOptions): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', options);
  };

  const formatDateTime = (date: string | Date): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).replace(',', '');
  };

  const generateStars = (rating: number): string => {
    let stars = '';
    const totalStars = 5;
    for (let i = 1; i <= totalStars; i++) {
      stars += i <= rating ? '★' : '☆';
    }
    return stars;
  };
  
  const formatCurrency = (amount: number, currency: string): string => {
    // Use INR for display as per PDF example
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
  };
  
  // --- Data Preparation ---
  const checkInDate = formatDate(bookingDetails.checkIn, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const checkOutDate = formatDate(bookingDetails.checkOut, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const bookedOnDate = formatDate(createdAt || new Date(), { day: 'numeric', month: 'short', year: 'numeric' });
  
  // Using 24 hours before check-in as a fallback cancellation deadline, but ideally this would come from the booking data.
  const cancellationDeadline = new Date(new Date(bookingDetails.checkIn).getTime() - 24 * 60 * 60 * 1000); 

  const guestFullName = `Ms. ${guestDetails.firstName} ${guestDetails.lastName}`;
  
  const roomsSummary = bookingDetails.roomsDetail.map(room => `${room.qty} x ${room.title}`).join(', ');

  const calculatedTotalBeforeDiscount = bookingDetails.subtotal + bookingDetails.serviceFee + bookingDetails.taxes;
  const discount = calculatedTotalBeforeDiscount - bookingDetails.totalPrice;

  // --- New Email Template ---
  const emailHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation</title>
    <style>
      body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; }
      .container { max-width: 650px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; }
      .content { padding: 20px 30px; }
      .card { border: 1px solid #e0e0e0; border-radius: 6px; margin-bottom: 20px; }
      .card-header { background-color: #f9f9f9; padding: 12px 15px; border-bottom: 1px solid #e0e0e0; font-weight: 500; font-size: 16px; color: #333; }
      .card-content { padding: 15px; }
      h1, h2, h3, p { margin: 0; }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" class="container" border="0" cellpadding="0" cellspacing="0" width="650" style="max-width: 650px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
            <!-- Header -->
            <tr>
              <td style="padding: 20px 30px; border-bottom: 1px solid #e0e0e0;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td valign="middle">
                      <p style="font-size: 18px; font-weight: bold; color: #333;"><span style="color: #007bff;">RoomPapa</span></p>
                    </td>
                    <td valign="middle" align="right" style="font-size: 12px; color: #555; line-height: 1.6;">
                      <b>Booking ID:</b> ${bookingId || 'N/A'}<br>
                      <b>PNR:</b> ${bookingDetails.payment.orderId || 'N/A'}<br>
                      (Booked on ${bookedOnDate})
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Main Content -->
            <tr>
              <td class="content" style="padding: 20px 30px;">
                <!-- Hotel Details Card -->
                <div class="card" style="border: 1px solid #e0e0e0; border-radius: 6px; margin-bottom: 20px;">
                  <div class="card-content" style="padding: 15px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td valign="top" style="line-height: 1.5;">
                          <h2 style="font-size: 20px; color: #333; margin-bottom: 5px;">${infoDetails.title}</h2>
                          <p style="font-size: 18px; color: #ffab00; margin-bottom: 15px;">${generateStars(infoDetails.propertyRating || 0)}</p>
                          <p style="font-size: 14px; color: #555;"><b>${checkInDate}</b> - <b>${checkOutDate}</b></p>
                          <p style="font-size: 14px; color: #555;">${bookingDetails.totalRoomsSelected} Room • ${bookingDetails.adults} Adult (${guestFullName})</p>
                        </td>
                        <td width="150" align="right" valign="top">
                          <img src="${infoDetails.bannerImage?.url || 'https://via.placeholder.com/150x100'}" alt="Hotel Image" style="width: 150px; border-radius: 6px;">
                        </td>
                      </tr>
                    </table>
                  </div>
                </div>
                <!-- Room Type Card -->
                <div class="card" style="border: 1px solid #e0e0e0; border-radius: 6px; margin-bottom: 20px;">
                  <div class="card-header" style="background-color: #f9f9f9; padding: 12px 15px; border-bottom: 1px solid #e0e0e0; font-weight: 500; font-size: 16px; color: #333;">Room Type and Amenities</div>
                  <div class="card-content" style="padding: 15px;">
                    <h3 style="font-size: 15px; font-weight: 600; color: #333; margin-bottom: 10px;">${roomsSummary}</h3>
                    <p style="font-size: 13px; color: #666; line-height: 1.8;">
                      <span style="display: inline-block; margin-right: 15px;">✓ Room Only</span>
                      <span style="display: inline-block; margin-right: 15px;">✓ ${infoDetails.bedPreference?.[0] || '1 Queen Bed'}</span>
                      <span style="display: inline-block;">✓ ${bookingDetails.adults} Adult(s)</span>
                    </p>
                    <p style="font-size: 13px; color: #666; line-height: 1.6; margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 10px;">
                      TV, Bathroom, Hot & Cold Water, Daily Housekeeping, Wi-Fi, Closet, Hairdryer, Work Desk, Mini Fridge, Air Conditioning, In-room Dining.
                    </p>
                  </div>
                </div>
                <!-- Cancellation Policy Card -->
                <div class="card" style="border: 1px solid #e0e0e0; border-radius: 6px; margin-bottom: 20px;">
                  <div class="card-header" style="background-color: #f9f9f9; padding: 12px 15px; border-bottom: 1px solid #e0e0e0; font-weight: 500; font-size: 16px; color: #333;">Cancellation Policy</div>
                  <div class="card-content" style="padding: 15px;">
                    <p style="font-size: 14px; color: #333; margin-bottom: 15px;">Free Cancellation (100% refund) till <b>${formatDateTime(cancellationDeadline)}</b>.</p>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 12px; text-align: center;">
                      <tr>
                        <td width="40%" style="background-color: #28a745; color: white; padding: 8px; border-radius: 4px 0 0 4px;">Free Cancellation before ${formatDate(cancellationDeadline, {day: 'numeric', month: 'short'})}</td>
                        <td width="30%" style="background-color: #e9ecef; padding: 8px;">Check-in Day</td>
                        <td width="30%" style="background-color: #e9ecef; padding: 8px; border-radius: 0 4px 4px 0;">During Stay</td>
                      </tr>
                    </table>
                  </div>
                </div>
                <!-- Price Break-up Card -->
                <div class="card" style="border: 1px solid #e0e0e0; border-radius: 6px; margin-bottom: 20px;">
                  <div class="card-header" style="background-color: #f9f9f9; padding: 12px 15px; border-bottom: 1px solid #e0e0e0; font-weight: 500; font-size: 16px; color: #333;">Booking Price Break-up</div>
                  <div class="card-content" style="padding: 15px; font-size: 14px; color: #555;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr style="line-height: 2;">
                        <td>Accommodation charges (incl. applicable Hotel taxes)</td>
                        <td align="right">${formatCurrency(bookingDetails.subtotal, bookingDetails.currency)}</td>
                      </tr>
                      <tr style="line-height: 2;">
                        <td>MMT Service Fee</td>
                        <td align="right">${formatCurrency(bookingDetails.serviceFee, bookingDetails.currency)}</td>
                      </tr>
                      <tr style="line-height: 2; border-bottom: 1px solid #e0e0e0;">
                        <td>Taxes & Fees</td>
                        <td align="right">${formatCurrency(bookingDetails.taxes, bookingDetails.currency)}</td>
                      </tr>
                      ${discount > 0 ? `
                      <tr style="line-height: 2; color: #28a745;">
                        <td>Hotelier Discount</td>
                        <td align="right">- ${formatCurrency(discount, bookingDetails.currency)}</td>
                      </tr>
                      ` : ''}
                      <tr style="line-height: 2;">
                        <td style="padding-top: 10px;"><b>TOTAL</b></td>
                        <td align="right" style="padding-top: 10px;"><b>${formatCurrency(bookingDetails.totalPrice, bookingDetails.currency)}</b></td>
                      </tr>
                    </table>
                  </div>
                </div>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="text-align: center; padding: 20px 30px; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0;">
                <p>For any assistance, please contact our support at +0124 6280411.</p>
                <p style="margin-top: 5px;">This is an automated email. Please do not reply.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;

  try {
    // Send the email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"MyPartner Bookings" <no-reply@mypartner.com>',
      to: recipients.join(', '),
      subject: `Booking Confirmed: ${infoDetails.title} for ${checkInDate}`,
      html: emailHtml,
    });
    
    console.log('Booking confirmation email sent successfully to:', recipients.join(', '));
    return { success: true };
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    // Avoid failing the entire API response if only the email fails
    return { success: false, error: 'Failed to send confirmation email.' };
  }
}
