import { Suspense } from 'react';
import { Document, Filter, Sort } from 'mongodb';
import clientPromise from '@/lib/mongodb/client';
import SearchResults from '@/components/customer/search/SearchResults';
import SearchLoading from '@/components/customer/search/SearchLoading';
import SearchHeader from '@/components/customer/SearchHeader';
import SearchFilter from '@/components/customer/search/SearchFilter';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Fetching initial search results based on searchParams
async function getInitialSearchResults(searchParams: { [key: string]: string }) {
  const client = await clientPromise;
  const db = client.db('travel-app');
  const category = searchParams.category || 'property';
  const query = buildSearchQuery(searchParams, category);
  const sort = buildSortQuery(searchParams);

  let results: Document[] = [];
  const pageSize = 10;
  const page = parseInt(searchParams?.page || '1');

  switch (category.toLowerCase()) {
    case 'property':
      results = await db.collection('properties')
        .find(query)
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray();
      break;

    case 'travelling':
      results = await db.collection('travellings')
        .find(query)
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray();
      break;

    case 'trip':
      results = await db.collection('trips')
        .find(query)
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray();
      break;

    default:
      results = [];
  }

  return { results, category };
}


function buildSearchQuery(params: { [key: string]: string }, category: string) {
  const query: Filter<Document> = {};

  if (params.query) {
    query.$text = { $search: params.query }; // Full-text search for all categories
  }

  switch (category.toLowerCase()) {
    case 'property':
      if (params.minPrice || params.maxPrice) {
        query['costing.price'] = {};
        if (params.minPrice) query['costing.price'].$gte = parseInt(params.minPrice);
        if (params.maxPrice) query['costing.price'].$lte = parseInt(params.maxPrice);
      }
      if (params.rooms) query.rooms = { $gte: parseInt(params.rooms) };
      if (params.propertyType) query.type = params.propertyType;
      if (params.amenities) {
        const amenitiesList = params.amenities.split(',');
        query.amenities = { $all: amenitiesList };
      }
      if (params.city) query['location.city'] = { $regex: params.city, $options: 'i' };
      if (params.country) query['location.country'] = { $regex: params.country, $options: 'i' };
      if (params.startDate || params.endDate) {
        query.startDate = {};
        if (params.startDate) query.startDate.$gte = params.startDate;
        if (params.endDate) query.startDate.$lte = params.endDate;
      }
      break;

    case 'travelling':
      if (params.transportationType)
        query['transportation.type'] = params.transportationType;
      if (params.startDate || params.endDate) {
        query['transportation.arrivalTime'] = {};
        if (params.startDate)
          query['transportation.arrivalTime'].$gte = params.startDate;
        if (params.endDate)
          query['transportation.arrivalTime'].$lte = params.endDate;
      }
      if (params.departureCity)
        query['transportation.from'] = { $regex: params.departureCity, $options: 'i' };
      if (params.destinationCity)
        query['transportation.to'] = { $regex: params.destinationCity, $options: 'i' };
      break;

    case 'trip':
      // if (params.status) query.status = params.status;
      if (params.startDate || params.endDate) {
        query.startDate = {};
        if (params.startDate) query.startDate.$gte = params.startDate;
        if (params.endDate) query.endDate.$lte = params.endDate;
      }
      if (params.city)
        query['destination.city'] = { $regex: params.city, $options: 'i' };
      if (params.country)
        query['destination.country'] = { $regex: params.country, $options: 'i' };
      break;

    default:
      throw new Error('Invalid category');
  }

  return query;
}


function buildSortQuery(params: { [key: string]: string }): Sort {
  const sortField =
    params.sortBy ||
    'createdAt'; // Default sort field for all schemas
  const sortOrder =
    params.sortOrder === 'asc' ? 1 : -1; // Ascending or descending order

  return { [sortField]: sortOrder } as Sort;
}

export default async function SearchPage({ searchParams }: PageProps) {
  // Resolve the searchParams promise and convert values to strings
  const resolvedParams = await searchParams;
  const stringParams: { [key: string]: string } =
    Object.fromEntries(
      Object.entries(resolvedParams).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(',') : value?.toString() || ''
      ])
    );

  // Fetch initial search results
  const { results, category } = await getInitialSearchResults(stringParams);

  // Convert MongoDB documents to plain objects for rendering
  const plainResults = results.map(doc => {
    const plainDoc = JSON.parse(JSON.stringify(doc));
    if (plainDoc._id) plainDoc._id = doc._id.toString();
    for (const key in plainDoc) {
      if (plainDoc[key] instanceof Date)
        plainDoc[key] = plainDoc[key].toISOString();
    }
    return plainDoc;
  });

  return (
    <div className="min-h-screen bg-gray-50">

      <SearchHeader/>
      
      <main className="container mx-auto px-4 py-8 flex gap-8 ">

        <SearchFilter />

          <Suspense fallback={<SearchLoading />}>
            <SearchResults 
              initialResults={plainResults} 
              category={category} 
              searchParams={stringParams} 
            />
          </Suspense>
        
      </main>
    </div>
  );
}


