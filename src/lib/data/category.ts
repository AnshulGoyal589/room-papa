import { getPropertyById } from "../mongodb/models/Property";
import { getTravellingById } from "../mongodb/models/Travelling";
import { getTripById } from "../mongodb/models/Trip";


export async function fetchCategoryData(itemId: string) {
    try {
        const property = await getPropertyById(itemId);
        if (property) {
            return { category: 'Property', data: property };
        }
        const trip = await getTripById(itemId);
        if (trip) {
            return { category: 'Trip', data: trip };
        }
        const travelling = await getTravellingById(itemId);
        if (travelling) {
            return { category: 'Travelling', data: travelling };
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch user bookings:", error);
        return null;
    }
}
