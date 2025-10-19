import { getBookingRepository } from "../booking-db";
// import { BookingDetails } from "../mongodb/models/Booking";
// import { checkReviewStatus } from "../mongodb/models/Property";

// const enrichBookingsWithStatus = async (userBookings : BookingDetails[] , userId:string) => {

//   const bookingPromises = userBookings.map(async (booking) => {
//     const propertyId = booking.infoDetails?.id;
//     if (!propertyId) {
//         return { ...booking, status: 'Invalid Property ID' };
//     }
//     // console.log("PropertyId: ", propertyId);

//     try {
//       const result = await checkReviewStatus(propertyId, userId);
//     //   console.log(result);
//       return {
//         ...booking,
//         status: result ? 'Reviewed' : 'Not Reviewed',
//       };
//     } catch (error) {
//       console.error(`Failed to fetch status for property ${propertyId}:`, error);
//       return { ...booking, status: 'Error Fetching Status' };
//     }
//   });
//   const bookingsWithStatus = await Promise.all(bookingPromises);

//   return bookingsWithStatus;
// };

export async function fetchUserBookings(userId: string) {
    try {
        const bookingRepository = await getBookingRepository();
        const bookings = await bookingRepository.getPropertyBookings({
            userId
        });
       return JSON.parse(JSON.stringify(bookings));
    } catch (error) {
        console.error("Failed to fetch user bookings:", error);
        return [];
    }
}

export async function markBookingAsReviewed(bookingId: string) {
    try {
        const bookingRepository = await getBookingRepository();
        await bookingRepository.updateBooking(bookingId, { isReviewed: true });
    } catch (error) {
        console.error("Failed to mark booking as reviewed:", error);
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

export async function fetchAdminBookings(type?: string , searchTerm?: string) {
    try {
        const bookingRepository = await getBookingRepository();
        const adminBookings = await bookingRepository.getAdminBookings({
            sortBy: 'updatedAt',
            sortOrder: 'desc',
            type: type as 'property' | 'travelling' | 'trip' | undefined,
            searchTerm: searchTerm || undefined
        });
        return JSON.parse(JSON.stringify(adminBookings));
    } catch (error) {
        console.error("Failed to fetch admin bookings:", error);
        return [];
    }
}