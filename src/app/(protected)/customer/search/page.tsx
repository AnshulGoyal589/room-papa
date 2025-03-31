import { Suspense } from 'react';
import { Document, Filter, Sort } from 'mongodb';
import clientPromise from '@/lib/mongodb/client';
import SearchResults from '@/components/customer/search/SearchResults';
import SearchLoading from '@/components/customer/search/SearchLoading';
import SearchHeader from '@/components/customer/search/SearchHeader';

export const dynamic = 'force-dynamic';

// Define the PageProps interface for Next.js 15 compatibility
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Function to fetch initial search results based on searchParams
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

// Function to build the MongoDB query based on search parameters
function buildSearchQuery(params: { [key: string]: string }, category: string) {
  const query: Filter<Document> = {};
  
  if (params.query) {
    query.$text = { $search: params.query };
  }

  switch (category.toLowerCase()) {
    case 'property':
      if (params.minPrice || params.maxPrice) {
        query.pricePerNight = {};
        if (params.minPrice) query.pricePerNight.$gte = parseInt(params.minPrice);
        if (params.maxPrice) query.pricePerNight.$lte = parseInt(params.maxPrice);
      }
      if (params.bedrooms) query.bedrooms = { $gte: parseInt(params.bedrooms) };
      if (params.bathrooms) query.bathrooms = { $gte: parseInt(params.bathrooms) };
      if (params.guests) query.maximumGuests = { $gte: parseInt(params.guests) };
      if (params.propertyType) query.type = params.propertyType;
      if (params.amenities) {
        const amenitiesList = params.amenities.split(',');
        query.amenities = { $all: amenitiesList };
      }
      if (params.city) query['location.city'] = { $regex: params.city, $options: 'i' };
      if (params.country) query['location.country'] = { $regex: params.country, $options: 'i' };
      // query.active = true;
      break;

    case 'travelling':
      if (params.visibility) query.visibility = params.visibility;
      if (params.startDate || params.endDate) {
        query.days = { $elemMatch: {} };
        if (params.startDate) {
          query.days.$elemMatch.date = { $gte: new Date(params.startDate) };
        }
        if (params.endDate) {
          if (!query.days.$elemMatch.date) query.days.$elemMatch.date = {};
          query.days.$elemMatch.date.$lte = new Date(params.endDate);
        }
      }
      if (params.activityCategory) {
        query['days.activities.category'] = params.activityCategory;
      }
      if (params.tags) {
        const tagsList = params.tags.split(',');
        query.tags = { $in: tagsList };
      }
      break;

    case 'trip':
      if (params.status) query.status = params.status;
      if (params.startDate) query.startDate = { $gte: new Date(params.startDate) };
      if (params.endDate) query.endDate = { $lte: new Date(params.endDate) };
      if (params.city) query['destination.city'] = { $regex: params.city, $options: 'i' };
      if (params.country) query['destination.country'] = { $regex: params.country, $options: 'i' };
      if (params.minBudget || params.maxBudget) {
        query.budget = {};
        if (params.minBudget) query['budget.amount'].$gte = parseInt(params.minBudget);
        if (params.maxBudget) query['budget.amount'].$lte = parseInt(params.maxBudget);
      }
      if (params.transportationType) {
        query['transportation.type'] = params.transportationType;
      }
      break;
  }


  return query;
}

// Function to build the MongoDB sort object based on search parameters
function buildSortQuery(params: { [key: string]: string }): Sort {
  const sortField = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder === 'asc' ? 1 : -1;

  return { [sortField]: sortOrder } as Sort;
}

// Main SearchPage component
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
    // console.log("doc1: ",doc);
    const plainDoc = JSON.parse(JSON.stringify(doc));
    if (plainDoc._id) plainDoc._id = doc._id.toString();
    for (const key in plainDoc) {
      if (plainDoc[key] instanceof Date) plainDoc[key] = plainDoc[key].toISOString();
    }
    for (const key in plainDoc) {
      if (
        plainDoc[key] &&
        typeof plainDoc[key] === 'object' &&
        plainDoc[key]._id
      ) {
        plainDoc[key]._id = plainDoc[key]._id.toString();
      }
    }
    return plainDoc;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchHeader category={category} />
      
      <main className="container mx-auto px-4 py-8">
        
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
