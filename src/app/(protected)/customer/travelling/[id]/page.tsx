import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SearchHeader from '@/components/customer/SearchHeader';
import { Travelling } from '@/lib/mongodb/models/Travelling';
import TravellingClientView from './TravellingClientView';

// --- SERVER-SIDE DATA FETCHING FUNCTION ---
async function fetchTravellingData(id: string): Promise<Travelling | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/travellings/${id}`, {
      // Use revalidation (ISR) for a great balance of performance and freshness.
      next: { revalidate: 3600 }, // Re-fetch data every hour
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error(`Failed to fetch travelling data for id ${id}:`, error);
    return null;
  }
}

// --- DYNAMIC METADATA GENERATION (CRUCIAL FOR SEO) ---
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const travelling = await fetchTravellingData(resolvedParams.id);

  if (!travelling) {
    return {
      title: 'Travel Offering Not Found',
    };
  }

  return {
    title: `${travelling.title} | Room Papa`,
    description: (travelling.description ?? '').substring(0, 160), // Use first 160 chars for description
    openGraph: {
      title: travelling.title,
      description: (travelling.description ?? '').substring(0, 160),
      images: [
        {
          url: travelling.bannerImage?.url ?? '',
          width: 1200,
          height: 630,
          alt: travelling.title,
        },
      ],
      type: 'website',
    },
  };
}

// --- THE MAIN PAGE COMPONENT (SERVER) ---
export default async function TravellingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const travellingData = await fetchTravellingData(resolvedParams.id);

  // If data is not found, render a proper 404 page.
  if (!travellingData) {
    notFound();
  }

  // Data from the DB contains non-serializable objects (like ObjectId, Date).
  // We MUST serialize it before passing it to a Client Component.
  const serializedTravellingData = JSON.parse(JSON.stringify(travellingData));

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchHeader />
      {/* Pass the server-fetched, serialized data as a prop */}
      <TravellingClientView initialTravellingData={serializedTravellingData} />
    </div>
  );
}