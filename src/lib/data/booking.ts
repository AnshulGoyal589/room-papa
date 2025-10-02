import { getBookingRepository } from "../booking-db";

export async function fetchUserBookings(userId: string) {
    try {
        const bookingRepository = await getBookingRepository();
        const userBookings = await bookingRepository.queryBookings({
            userId: userId,
            sortBy: 'bookingDetails.checkIn',
            sortOrder: 'desc',
        });
        return JSON.parse(JSON.stringify(userBookings));
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