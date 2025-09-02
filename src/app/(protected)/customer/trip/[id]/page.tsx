import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SearchHeader from '@/components/customer/SearchHeader';
import { Trip } from '@/lib/mongodb/models/Trip';
import TripClientView from './TripClientView';

// --- SERVER-SIDE DATA FETCHING FUNCTION ---
async function fetchTripData(id: string): Promise<Trip | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/trips/${id}`, {
      // Use revalidation (ISR) for a great balance of performance and freshness for public pages.
      next: { revalidate: 3600 }, // Re-fetch data from the API every hour
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error(`Failed to fetch trip data for id ${id}:`, error);
    return null;
  }
}

// --- DYNAMIC METADATA GENERATION (CRUCIAL FOR SEO) ---
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const trip = await fetchTripData(resolvedParams.id);

  if (!trip) {
    return {
      title: 'Trip Not Found',
    };
  }

  return {
    title: `${trip.title} | Room Papa`,
    description: (trip.description ?? '').substring(0, 160), // Use the first 160 characters for a meta description
    openGraph: {
      title: trip.title,
      description: (trip.description ?? '').substring(0, 160),
      images: [
        {
          url: trip.bannerImage?.url ?? '',
          width: 1200,
          height: 630,
          alt: trip.title,
        },
      ],
      type: 'website',
    },
  };
}

// --- THE MAIN PAGE COMPONENT (SERVER) ---
export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const tripData = await fetchTripData(resolvedParams.id);

  // If data is not found on the server, render a proper 404 page.
  if (!tripData) {
    notFound();
  }

  // Data from the database contains non-serializable objects (like ObjectId, Date).
  // We MUST serialize it before passing it to a Client Component.
  const serializedTripData = JSON.parse(JSON.stringify(tripData));

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchHeader />
      {/* Pass the server-fetched, serialized data as a prop to the client view */}
      <TripClientView initialTripData={serializedTripData} />
    </div>
  );
}