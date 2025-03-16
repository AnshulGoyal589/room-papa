import { Suspense } from 'react';
import { Document, Sort } from 'mongodb';

import clientPromise from '@/lib/mongodb/client';
import SearchResults from '@/components/customer/search/SearchResults';
import SearchLoading from '@/components/customer/search/SearchLoading';
import SearchFilters from '@/components/customer/search/SearchFilters';
import SearchHeader from '@/components/customer/search/SearchHeader';

export const dynamic = 'force-dynamic';

// interface Property extends Document {
//   // property-specific fields
// }

// interface Travelling extends Document {
//   // travelling-specific fields
// }

// interface Trip extends Document {
//   // trip-specific fields
// }

// let results: Property[] | Travelling[] | Trip[] = [];

async function getInitialSearchResults(searchParams: { [key: string]: string }) {
  
  const client = await clientPromise;
  const db = client.db('travel-app');
  

  // console.log("hurrah: ",searchParams);

  const category = searchParams.category || 'property';
  const query = buildSearchQuery(searchParams, category);
  const sort = buildSortQuery(searchParams);


  
  let results: Document[] = [];
  // let results: Property[] | Travelling[] | Trip[] = [];
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
  const query: any = {};
  
  // General search term
  if (params.query) {
    query.$text = { $search: params.query };
  }
  
  switch (category.toLowerCase()) {
    case 'property':
      // Property-specific filters
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
      
      // Filter for active properties only
      query.active = true;
      break;
      
    case 'travelling':
      // Travelling-specific filters
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
      // Trip-specific filters
      if (params.status) query.status = params.status;
      
      if (params.startDate) query.startDate = { $gte: new Date(params.startDate) };
      if (params.endDate) query.endDate = { $lte: new Date(params.endDate) };
      
      if (params.city) query['destination.city'] = { $regex: params.city, $options: 'i' };
      if (params.country) query['destination.country'] = { $regex: params.country, $options: 'i' };
      
      if (params.minBudget || params.maxBudget) {
        query.budget = query.budget || {};
        if (params.minBudget) query['budget.amount'] = { $gte: parseInt(params.minBudget) };
        if (params.maxBudget) query['budget.amount'] = { $lte: parseInt(params.maxBudget) };
      }
      
      if (params.transportationType) {
        query['transportation.type'] = params.transportationType;
      }
      break;
  }
  
  return query;
}

function buildSortQuery(params: { [key: string]: string }): Sort {
  const sortField = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder === 'asc' ? 1 : -1;
  
  return { [sortField]: sortOrder } as Sort;
}

export default async function SearchPage({ searchParams }: { searchParams: { [key: string]: string } }) {
  const data = await searchParams;
  const { results, category } = await getInitialSearchResults(data);

  // Convert MongoDB documents to plain objects before passing to client component
  const plainResults = results.map(doc => {
    const plainDoc = JSON.parse(JSON.stringify(doc));
    
    // Convert ObjectId to string
    if (plainDoc._id) {
      plainDoc._id = doc._id.toString();
    }
    
    // Handle Date objects
    for (const key in plainDoc) {
      if (plainDoc[key] instanceof Date) {
        plainDoc[key] = plainDoc[key].toISOString();
      }
    }
    
    // Handle nested ObjectIds (basic approach)
    for (const key in plainDoc) {
      if (plainDoc[key] && typeof plainDoc[key] === 'object' && plainDoc[key]._id) {
        plainDoc[key]._id = plainDoc[key]._id.toString();
      }
    }
    
    return plainDoc;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchHeader category={category} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Suspense fallback={<div>Loading filters...</div>}>
              <SearchFilters 
                initialCategory={category} 
                searchParams={data} 
              />
            </Suspense>
          </div>
          
          <div className="lg:col-span-3">
            <Suspense fallback={<SearchLoading />}>
              <SearchResults 
                initialResults={plainResults} 
                category={category} 
                searchParams={data} 
              />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}