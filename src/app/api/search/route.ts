import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { Document, Sort } from 'mongodb';
import { QueryType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('travel-app');
    const { searchParams } = request.nextUrl;
    
    const category = searchParams.get('category') || 'property';
    
    const validationResult = validateSearchParams(searchParams);
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error }, 
        { status: 400 }
      );
    }

    const query = buildSearchQuery(searchParams);
    const sort = buildSortQuery(searchParams);
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    const collectionName = getCategoryCollection(category);
    if (!collectionName) {
      return NextResponse.json(
        { error: 'Invalid category' }, 
        { status: 400 }
      );
    }
    // console.log("Query: ",query);
    const total = await db.collection(collectionName).countDocuments(query);
    const results = await db.collection(collectionName)
      .find(query)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

      
    const plainResults = serializeDocuments(results);
    // console.log("Results: ",plainResults);
    
    return NextResponse.json({ 
      results: plainResults, 
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

function getCategoryCollection(category: string): string | null {
  const collections: Record<string, string> = {
    'property': 'properties',
    'travelling': 'travellings',
    'trip': 'trips'
  };
  return collections[category.toLowerCase()] || null;
}

function validateSearchParams(searchParams: URLSearchParams) {
  // Validate date inputs
  if (searchParams.has('arrivalTime') || searchParams.has('departureTime')) {
    try {
      if (searchParams.has('arrivalTime')) new Date(searchParams.get('arrivalTime') as string);
      if (searchParams.has('departureTime')) new Date(searchParams.get('departureTime') as string);
    } catch (_error) {
      console.error(_error);
      return { valid: false, error: 'Invalid date format for arrival/departure time' };
    }
  }
  
  // Validate numeric params
  const numericParams = ['minPrice', 'maxPrice', 'totalRating', 'propertyRating', 'travellingRating'];
  
  for (const param of numericParams) {
    if (searchParams.has(param) && isNaN(parseFloat(searchParams.get(param) as string))) {
      return { valid: false, error: `Invalid numeric value for ${param}` };
    }
  }
  
  return { valid: true };
}

function buildSearchQuery(searchParams: URLSearchParams): QueryType {
  const query: QueryType = {};
  const category = searchParams.get('category') || 'property';

  // Basic text search for general search input
  if (searchParams.has('title')) {
    const titleQuery = searchParams.get('title') as string;
    query.$or = [
      { 'title': { $regex: titleQuery, $options: 'i' } },
      { 'destination.city': { $regex: titleQuery, $options: 'i' } },
      { 'destination.state': { $regex: titleQuery, $options: 'i' } },
      { 'destination.country': { $regex: titleQuery, $options: 'i' } },
      { 'location.city': { $regex: titleQuery, $options: 'i' } },
      { 'location.address': { $regex: titleQuery, $options: 'i' } },
      { 'location.state': { $regex: titleQuery, $options: 'i' } },
      { 'location.country': { $regex: titleQuery, $options: 'i' } },
      { 'transportation.from': { $regex: titleQuery, $options: 'i' } },
      { 'activities': { $elemMatch: { $regex: titleQuery, $options: 'i' } } },
    ];
  }
  if (searchParams.has('title2')) {
    const titleQuery2 = searchParams.get('title2') as string;
    query.$or = [
      { 'title': { $regex: titleQuery2, $options: 'i' } },
      { 'destination.city': { $regex: titleQuery2, $options: 'i' } },
      { 'destination.state': { $regex: titleQuery2, $options: 'i' } },
      { 'destination.country': { $regex: titleQuery2, $options: 'i' } },
      { 'location.city': { $regex: titleQuery2, $options: 'i' } },
      { 'location.address': { $regex: titleQuery2, $options: 'i' } },
      { 'location.state': { $regex: titleQuery2, $options: 'i' } },
      { 'location.country': { $regex: titleQuery2, $options: 'i' } },
      { 'transportation.to': { $regex: titleQuery2, $options: 'i' } },
      { 'activities': { $elemMatch: { $regex: titleQuery2, $options: 'i' } } },
    ];
  }
  // Common filters across all categories
  addPriceRangeFilter(query, searchParams);
  // addCurrencyFilter(query, searchParams);
  // addRatingFilter(query, searchParams);
  
  // Apply category-specific filters
  const filterFunctions: Record<string, (q: QueryType, sp: URLSearchParams) => void> = {
    'property': addPropertyFilters,
    'travelling': addTravellingFilters,
    'trip': addTripFilters
  };

  if (filterFunctions[category.toLowerCase()]) {
    filterFunctions[category.toLowerCase()](query, searchParams);
  }
  
  // Add common category filters for all modes
  addCommonCategoryFilters(query, searchParams);
  
  return query;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addPriceRangeFilter(query: Record<string, any>, searchParams: URLSearchParams): void {

  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  if (minPrice || maxPrice) {
    query['costing.discountedPrice'] = {};

    if (minPrice && !isNaN(parseFloat(minPrice))) {
      query['costing.discountedPrice'].$gte = parseFloat(minPrice);
    }

    if (maxPrice && !isNaN(parseFloat(maxPrice))) {
      query['costing.discountedPrice'].$lte = parseFloat(maxPrice);
    }
  }
}



function addPropertyFilters(query: QueryType, searchParams: URLSearchParams) {
  // Property type filter
  const propertyType = searchParams.get('propertyType');
  if (propertyType) {
    query['type'] = propertyType;
  }
  
  // Property rating filter
  const propertyRating = searchParams.get('propertyRating');
  if (propertyRating && !isNaN(parseFloat(propertyRating))) {
    query['propertyRating'] = { $gte: parseFloat(propertyRating) };
  }
  
  // Property-specific category filters
  addArrayFilterIfExists(query, searchParams, 'propertyAccessibility');
  addArrayFilterIfExists(query, searchParams, 'roomAccessibility');
  addArrayFilterIfExists(query, searchParams, 'bedPreference');
  addArrayFilterIfExists(query, searchParams, 'roomFacilities');
}

function addTravellingFilters(query: QueryType, searchParams: URLSearchParams) {
  // Transportation type filter
  const transportationType = searchParams.get('transportationType');
  if (transportationType) {
    query['transportation.type'] = transportationType;
  }
  
  // Travel rating filter
  const travellingRating = searchParams.get('travellingRating');
  if (travellingRating && !isNaN(parseFloat(travellingRating))) {
    query['travellingRating'] = { $gte: parseFloat(travellingRating) };
  }
  
  // Time filters
  const arrivalTime = searchParams.get('arrivalTime');
  if (arrivalTime) {
    query['transportation.arrivalTime'] = arrivalTime;
  }
  
  const departureTime = searchParams.get('departureTime');
  if (departureTime) {
    query['transportation.departureTime'] = departureTime;
  }
  
  // Location filters
  const fromLocation = searchParams.get('fromLocation');
  if (fromLocation) {
    query['transportation.from'] = { $regex: fromLocation, $options: 'i' };
  }
  
  const toLocation = searchParams.get('toLocation');
  if (toLocation) {
    query['transportation.to'] = { $regex: toLocation, $options: 'i' };
  }
  
  // Travelling-specific category filters
  addArrayFilterIfExists(query, searchParams, 'travellingAccessibility');
}

function addTripFilters(query: QueryType, searchParams: URLSearchParams) {
  // Trip type filter (Domestic/International)
  const tripType = searchParams.get('tripType');
  if (tripType) {
    query['type'] = tripType;
  }
  
  // Destination filters
  const city = searchParams.get('city');
  if (city) {
    query['destination.city'] = { $regex: city, $options: 'i' };
  }
  
  const state = searchParams.get('state');
  if (state) {
    query['destination.state'] = { $regex: state, $options: 'i' };
  }
  
  const country = searchParams.get('country');
  if (country) {
    query['destination.country'] = { $regex: country, $options: 'i' };
  }
}

function addCommonCategoryFilters(query: QueryType, searchParams: URLSearchParams) {
  // Add all common category filters
  addArrayFilterIfExists(query, searchParams, 'amenities');
  addArrayFilterIfExists(query, searchParams, 'accessibility');
  addArrayFilterIfExists(query, searchParams, 'popularFilters');
  addArrayFilterIfExists(query, searchParams, 'funThingsToDo');
  addArrayFilterIfExists(query, searchParams, 'meals');
  addArrayFilterIfExists(query, searchParams, 'facilities');
  addArrayFilterIfExists(query, searchParams, 'reservationPolicy');
  addArrayFilterIfExists(query, searchParams, 'brands');
}

function addArrayFilterIfExists(query: QueryType, searchParams: URLSearchParams, field: string) {
  const value = searchParams.get(field);
  // console.log("Value: ",value);
  if (value) {
    const items = value.split(',').filter(item => item.trim() !== '');
    if (items.length > 0) {
      query[field] = { $all: items };
    }
  }
}

function buildSortQuery(searchParams: URLSearchParams): Sort {
  const sortField = searchParams.get('sortBy') || 'costing.discountedPrice';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
  return { [sortField]: sortOrder };
}

function serializeDocuments(documents: Document[]) {
  return documents.map(serializeDocument);
}

function serializeDocument(doc: Document): Document {
  if (doc === null || doc === undefined) return doc;
  if (Array.isArray(doc)) return doc.map(item => serializeDocument(item));
  if (typeof doc === 'object') {
    const plainDoc = JSON.parse(JSON.stringify(doc));
    if (doc._id) plainDoc._id = doc._id.toString();
    for (const key in plainDoc) {
      if (plainDoc[key] && typeof plainDoc[key] === 'object' && plainDoc[key]._id) {
        plainDoc[key]._id = plainDoc[key]._id.toString();
      }
      if (doc[key] instanceof Date) {
        plainDoc[key] = doc[key].toISOString();
      }
      if (plainDoc[key] && typeof plainDoc[key] === 'object') {
        plainDoc[key] = serializeDocument(doc[key]);
      }
    }
    return plainDoc;
  }
  return doc;
}