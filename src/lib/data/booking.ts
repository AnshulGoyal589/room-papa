import { getBookingRepository } from "../booking-db";
import { Booking } from "../mongodb/models/Booking";
import { checkReviewStatus } from "../mongodb/models/Property";

const enrichBookingsWithStatus = async (userBookings : Booking[] , userId:string) => {

  const bookingPromises = userBookings.map(async (booking) => {
    const propertyId = booking.tripDetails?.id;
    if (!propertyId) {
        return { ...booking, status: 'Invalid Property ID' };
    }
    // console.log("PropertyId: ", propertyId);

    try {
      const result = await checkReviewStatus(propertyId, userId);
    //   console.log(result);
      return {
        ...booking,
        status: result ? 'Reviewed' : 'Not Reviewed',
      };
    } catch (error) {
      console.error(`Failed to fetch status for property ${propertyId}:`, error);
      return { ...booking, status: 'Error Fetching Status' };
    }
  });
  const bookingsWithStatus = await Promise.all(bookingPromises);

  return bookingsWithStatus;
};

export async function fetchUserBookings(userId: string) {
    try {
        const bookingRepository = await getBookingRepository();
        const userBookings = await bookingRepository.queryBookings({
            userId: userId,
            sortBy: 'bookingDetails.checkIn',
            sortOrder: 'desc',
        });
       const updatedBookings = await enrichBookingsWithStatus(userBookings, userId);
       return JSON.parse(JSON.stringify(updatedBookings));
    } catch (error) {
        console.error("Failed to fetch user bookings:", error);
        return [];
    }
}


export async function fetchManagerBookings(userId: string , type?: string , searchTerm?: string) {
    try {
        const bookingRepository = await getBookingRepository();
        const managerBookings = await bookingRepository.getManagerBookings({
            ownerId: userId,
            sortBy: 'updatedAt',
            sortOrder: 'desc',
            type: type as 'property' | 'travelling' | 'trip' | undefined,
            searchTerm: searchTerm || undefined
        });
        return JSON.parse(JSON.stringify(managerBookings));
    } catch (error) {
        console.error("Failed to fetch manager bookings:", error);
        return [];
    }
}