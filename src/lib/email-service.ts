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
  const { infoDetails, bookingDetails, guestDetails, recipients, _id : bookingId } = bookingData;


  const formatDate = (date: string | Date, options: Intl.DateTimeFormatOptions): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', options);
  };

  const formatDateTime = (date: string | Date): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
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
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount);
  };

  
  const checkInDate = formatDate(bookingDetails.checkIn, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const checkOutDate = formatDate(bookingDetails.checkOut, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  // const bookedOnDate = formatDate(createdAt || new Date(), { day: 'numeric', month: 'short', year: 'numeric' });
  
  // 24 hours before check-in as a fallback cancellation deadline
  const cancellationDeadline = new Date(new Date(bookingDetails.checkIn).getTime() - 24 * 60 * 60 * 1000); 

  const guestFullName = `${guestDetails.firstName} ${guestDetails.lastName}`;
  const fullAddress = [
    infoDetails.location?.address,
    infoDetails.location?.city,
    infoDetails.location?.state,
    infoDetails.location?.country,
  ].filter(Boolean).join(', ');

  const roomDetailsHtml = bookingDetails.roomsDetail.map(room => `
    <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eeeeee;">
        <p style="margin: 0; font-weight: bold; color: #333;">${room.qty} x ${room.title}</p>
        <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">
            Guests: ${bookingDetails.adults} Adult(s)${bookingDetails.children > 0 ? `, ${bookingDetails.children} Child(ren)` : ''}
        </p>
    </div>
  `).join('');

  const reservationPolicyHtml = infoDetails.reservationPolicy && infoDetails.reservationPolicy.length > 0 
    ? `<ul>${infoDetails.reservationPolicy.map(policy => `<li style="margin-bottom: 5px; font-size: 13px; color: #555;">${policy}</li>`).join('')}</ul>`
    : `<p style="margin: 15px 0; font-size: 13px; color: #555;">Please refer to the property's terms and conditions for detailed cancellation rules.</p>`;

  
  const emailHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation</title>
      <style>
              body { margin: 0; padding: 0; background-color: #f6f9fc; font-family: Arial, sans-serif; }
              .container { width: 100%; max-width: 650px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
              .header { background-color: #003366; color: #ffffff; padding: 25px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
              .content { padding: 30px; }
              .section { margin-bottom: 25px; padding-bottom: 25px; border-bottom: 1px solid #eeeeee; }
              .section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
              h2 { font-size: 18px; color: #333; margin: 0 0 15px 0; font-weight: 500; }
              p, li { color: #555; font-size: 14px; line-height: 1.6; }
              .price-table td { padding: 10px 0; font-size: 14px; }
              .total-row td { font-weight: bold; font-size: 16px; border-top: 2px solid #003366; padding-top: 15px; color: #003366; }
              .button { display: inline-block; background-color: #ff6600; color: #ffffff; padding: 12px 25px; text-align: center; text-decoration: none; border-radius: 5px; font-weight: bold; }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
      </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: Arial, sans-serif;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                      <td align="center">
                              <table role="presentation" class="container" border="0" cellpadding="0" cellspacing="0" width="650">
                                      
                                      <!-- Header -->
                                      <tr>
                                              <td class="header" style="background-color: #003366; color: #ffffff; padding: 25px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                                                      <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Your Booking is Confirmed!</h1>
                                                      <p style="margin: 5px 0 0 0; font-size: 16px; color: #ffffff; opacity: 0.9;">Booking ID: ${bookingId || 'N/A'}</p>
                                              </td>
                                      </tr>

                                      <!-- Main Content -->
                                      <tr>
                                              <td class="content" style="padding: 30px;">
                                                      <p style="font-size: 16px;">Dear ${guestFullName},</p>
                                                      <p>Thank you for booking with us. Your reservation for <strong>${infoDetails.title}</strong> is confirmed. Please find the details of your booking below.</p>
                                                      
                                                      <!-- Hotel Details Section -->
                                                      <div class="section">
                                                              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                                      <tr>
                                                                              <td valign="top" width="70%">
                                                                                      <h2 style="margin: 0 0 5px 0; font-size: 22px; color: #003366;">${infoDetails.title}</h2>
                                                                                      <p style="margin: 0 0 10px 0; font-size: 20px; color: #ffab00;">${generateStars(infoDetails.propertyRating || 0)}</p>
                                                                                      <p style="margin: 0; font-size: 14px; color: #555;">
                                                                                              📍 ${fullAddress || 'Address not available'}
                                                                                      </p>
                                                                              </td>
                                                                              <td valign="top" width="30%" align="right">
                                                                                      <img src="${infoDetails.bannerImage?.url || 'https://via.placeholder.com/150x100'}" alt="Hotel Image" width="150" style="border-radius: 8px; border: 1px solid #eee;">
                                                                              </td>
                                                                      </tr>
                                                              </table>
                                                      </div>

                                                      <!-- Booking Summary Section -->
                                                      <div class="section">
                                                              <h2>Your Stay</h2>
                                                              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                                      <tr>
                                                                              <td width="50%" valign="top" style="padding-right: 10px;">
                                                                                      <p style="margin: 0 0 5px 0; font-weight: 500; color: #333;">Check-in</p>
                                                                                      <p style="margin: 0; font-size: 16px;">${checkInDate}</p>
                                                                                      <p style="margin: 0; font-size: 13px; color: #666;">From 02:00 PM</p>
                                                                              </td>
                                                                              <td width="50%" valign="top" style="padding-left: 10px;">
                                                                                      <p style="margin: 0 0 5px 0; font-weight: 500; color: #333;">Check-out</p>
                                                                                      <p style="margin: 0; font-size: 16px;">${checkOutDate}</p>
                                                                                      <p style="margin: 0; font-size: 13px; color: #666;">Until 12:00 PM</p>
                                                                              </td>
                                                                      </tr>
                                                                      <tr><td colspan="2" style="padding-top: 20px;">
                                                                              <p style="margin: 0 0 5px 0; font-weight: 500; color: #333;">Duration</p>
                                                                              <p style="margin: 0;">${bookingDetails.numberOfNights} Night(s)</p>
                                                                      </td></tr>
                                                              </table>
                                                      </div>

                                                      <!-- Room & Guest Details Section -->
                                                      <div class="section">
                                                              <h2>Room and Guest Details</h2>
                                                              ${roomDetailsHtml}
                                                              <div style="margin-top: 20px;">
                                                                      <p style="margin: 0 0 5px 0; font-weight: 500; color: #333;">Primary Guest</p>
                                                                      <p style="margin: 0;">${guestFullName}</p>
                                                                      <p style="margin: 0;">${guestDetails.email}</p>
                                                                      <p style="margin: 0;">${guestDetails.phone}</p>
                                                              </div>
                                                      </div>
                                                      
                                                      <!-- Price Break-up Section -->
                                                      <div class="section">
                                                              <h2>Price Break-up</h2>
                                                              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="price-table">
                                                                      <tr>
                                                                              <td>Room Charges (${bookingDetails.numberOfNights} night(s) x ${bookingDetails.totalRoomsSelected} room(s))</td>
                                                                              <td align="right">${formatCurrency(bookingDetails.subtotal, bookingDetails.currency)}</td>
                                                                      </tr>
                                                                      <tr>
                                                                              <td>Service Fee</td>
                                                                              <td align="right">${formatCurrency(bookingDetails.serviceFee, bookingDetails.currency)}</td>
                                                                      </tr>
                                                                      <tr>
                                                                              <td>Taxes & Fees</td>
                                                                              <td align="right">${formatCurrency(bookingDetails.taxes, bookingDetails.currency)}</td>
                                                                      </tr>
                                                                      <tr class="total-row">
                                                                              <td>TOTAL AMOUNT PAID</td>
                                                                              <td align="right">${formatCurrency(bookingDetails.totalPrice, bookingDetails.currency)}</td>
                                                                      </tr>
                                                              </table>
                                                      </div>

                                                      <!-- Cancellation Policy Section -->
                                                      <div class="section">
                                                              <h2>Cancellation Policy</h2>
                                                              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                                      <tr>
                                                                              <td style="background-color: #e6f7ff; padding: 15px; border: 1px solid #91d5ff; border-radius: 5px; color: #0050b3; text-align: center; font-weight: 500;">
                                                                                      Free Cancellation before ${formatDateTime(cancellationDeadline)}
                                                                              </td>
                                                                      </tr>
                                                              </table>
                                                              ${reservationPolicyHtml}
                                                      </div>
                                                      
                                                      <!-- Action Buttons -->
                                                    <!-- Action Buttons -->
                                                      <div style="text-align: center; margin-top: 20px;">
                                                          <a href="https://example.com/some-booking-url" class="button" style="display: inline-block; background-color: #ff6600; color: #ffffff; padding: 12px 25px; text-align: center; text-decoration: none; border-radius: 5px; font-weight: bold;">Manage My Booking</a>
                                                            
                                                          </div>
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