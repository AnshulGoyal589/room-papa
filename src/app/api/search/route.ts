import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { Document, Sort } from 'mongodb';

// ==============================
// Main API handler function
// ==============================
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('travel-app');
    const { searchParams } = request.nextUrl;
    
    const category = searchParams.get('category') || 'travelling';
    
    // Validate search parameters
    const validationResult = validateSearchParams(searchParams, category);
    if (!validationResult.valid) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }
    
    const query = buildSearchQuery(searchParams);
    const sort = buildSortQuery(searchParams, query);
    
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    let results: Document[] = [];
    let total = 0;
    
    const collectionName = getCategoryCollection(category);
    if (!collectionName) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    
    // Execute query
    total = await db.collection(collectionName).countDocuments(query);
    results = await db.collection(collectionName)
      .find(query)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();
    
    // Serialize results to plain objects
    const plainResults = serializeDocuments(results);
    
    return NextResponse.json({ 
      results: plainResults, 
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
  }
}

// ==============================
// Helper functions
// ==============================

// Get collection name based on category
function getCategoryCollection(category: string): string | null {
  switch (category.toLowerCase()) {
    case 'property':
      return 'properties';
    case 'travelling':
      return 'travellings';
    case 'trip':
      return 'trips';
    default:
      return null;
  }
}

// Validate search parameters
function validateSearchParams(searchParams: URLSearchParams, category: string): { valid: boolean, error?: string } {
  // Check for valid date parameters
  if (searchParams.has('startDate') || searchParams.has('endDate')) {
    try {
      if (searchParams.has('startDate')) {
        new Date(searchParams.get('startDate') as string);
      }
      if (searchParams.has('endDate')) {
        new Date(searchParams.get('endDate') as string);
      }
    } catch (error) {
      return { valid: false, error: 'Invalid date format' };
    }
  }
  
  // Validate numeric parameters based on category
  const numericParams: Record<string, string[]> = {
    'property': ['minPrice', 'maxPrice', 'bedrooms', 'bathrooms', 'guests'],
    'trip': ['minBudget', 'maxBudget']
  };
  
  if (numericParams[category.toLowerCase()]) {
    for (const param of numericParams[category.toLowerCase()]) {
      if (searchParams.has(param)) {
        const value = parseInt(searchParams.get(param) as string);
        if (isNaN(value)) {
          return { valid: false, error: `Invalid value for ${param}` };
        }
      }
    }
  }
  
  return { valid: true };
}

// Build search query based on parameters
function buildSearchQuery(searchParams: URLSearchParams) {
  const query: any = {};
  const category = searchParams.get('category') || 'travelling';

  // General search term
  if (searchParams.has('query') && searchParams.get('query')) {
    const searchText = searchParams.get('query') as string;
    
    if (searchText.trim() !== '') {
      query.$text = { $search: searchText };
    }
  }
  
  // Add universal location filter, with consistent implementation across categories
  if (searchParams.has('city')) {
    const locationQuery = searchParams.get('city') as string;
    
    switch (category.toLowerCase()) {
      case 'property':
        query.$or = [
          { 'location.city': { $regex: locationQuery, $options: 'i' } },
          { 'location.country': { $regex: locationQuery, $options: 'i' } }
        ];
        break;
      case 'travelling':
        query.$or = [
          { 'location.city': { $regex: locationQuery, $options: 'i' } },
          { 'location.country': { $regex: locationQuery, $options: 'i' } }
        ];
        break;
      case 'trip':
        query.$or = [
          { 'destination.city': { $regex: locationQuery, $options: 'i' } },
          { 'destination.country': { $regex: locationQuery, $options: 'i' } }
        ];
        break;
    }
  }
  
  // Add category-specific filters
  switch (category.toLowerCase()) {
    case 'property':
      addPropertyFilters(query, searchParams);
      break;
    case 'travelling':
      addTravellingFilters(query, searchParams);
      break;
    case 'trip':
      addTripFilters(query, searchParams);
      break;
  }
  
  return query;
}

// Property-specific query filters
function addPropertyFilters(query: any, searchParams: URLSearchParams) {
  // Price range
  if (searchParams.has('minPrice') || searchParams.has('maxPrice')) {
    query.pricePerNight = {};
    
    if (searchParams.has('minPrice')) {
      const minPrice = parseInt(searchParams.get('minPrice') as string);
      if (!isNaN(minPrice)) query.pricePerNight.$gte = minPrice;
    }
    
    if (searchParams.has('maxPrice')) {
      const maxPrice = parseInt(searchParams.get('maxPrice') as string);
      if (!isNaN(maxPrice)) query.pricePerNight.$lte = maxPrice;
    }
  }
  
  // Bedrooms
  if (searchParams.has('bedrooms')) {
    const bedrooms = parseInt(searchParams.get('bedrooms') as string);
    if (!isNaN(bedrooms)) query.bedrooms = { $gte: bedrooms };
  }
  
  // Bathrooms
  if (searchParams.has('bathrooms')) {
    const bathrooms = parseInt(searchParams.get('bathrooms') as string);
    if (!isNaN(bathrooms)) query.bathrooms = { $gte: bathrooms };
  }
  
  // Guest capacity
  if (searchParams.has('guests')) {
    const guests = parseInt(searchParams.get('guests') as string);
    if (!isNaN(guests)) query.maximumGuests = { $gte: guests };
  }
  
  // Property type
  if (searchParams.has('propertyType')) {
    query.type = searchParams.get('propertyType');
  }
  
  // Amenities (filter for properties containing ALL specified amenities)
  if (searchParams.has('amenities')) {
    const amenitiesList = (searchParams.get('amenities') as string).split(',');
    query.amenities = { $all: amenitiesList };
  }
  
  // Filter for active properties only
  query.active = true;
}

// Travelling-specific query filters
function addTravellingFilters(query: any, searchParams: URLSearchParams) {
  // Visibility
  if (searchParams.has('visibility')) {
    query.visibility = searchParams.get('visibility');
  }
  
  // Date range - Fixed to use a consistent pattern
  if (searchParams.has('startDate') || searchParams.has('endDate')) {
    const dateQuery: any = {};
    
    if (searchParams.has('startDate')) {
      const startDate = new Date(searchParams.get('startDate') as string);
      dateQuery.$gte = startDate;
    }
    
    if (searchParams.has('endDate')) {
      const endDate = new Date(searchParams.get('endDate') as string);
      dateQuery.$lte = endDate;
    }
    
    query['days.date'] = dateQuery;
  }
  
  // Activity category
  if (searchParams.has('activityCategory')) {
    query['days.activities.category'] = searchParams.get('activityCategory');
  }
  
  // Tags (filter for itineraries containing ANY of the specified tags)
  if (searchParams.has('tags')) {
    const tagsList = (searchParams.get('tags') as string).split(',');
    query.tags = { $in: tagsList };
  }
}

// Trip-specific query filters
function addTripFilters(query: any, searchParams: URLSearchParams) {
  // Trip status
  if (searchParams.has('status')) {
    query.status = searchParams.get('status');
  }
  
  // Date range - standardized approach
  if (searchParams.has('startDate') || searchParams.has('endDate')) {
    // For trips, we need to handle date range overlap scenarios
    if (searchParams.has('startDate') && searchParams.has('endDate')) {
      const startDate = new Date(searchParams.get('startDate') as string);
      const endDate = new Date(searchParams.get('endDate') as string);
      
      // Find trips that overlap with the selected date range
      query.$or = [
        // Case 1: Trip starts before search end date AND ends after search start date
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
        // Case 2: Trip starts within the search range
        { startDate: { $gte: startDate, $lte: endDate } },
        // Case 3: Trip ends within the search range
        { endDate: { $gte: startDate, $lte: endDate } }
      ];
    } else if (searchParams.has('startDate')) {
      // Find trips that start on or after the specified date
      query.startDate = { $gte: new Date(searchParams.get('startDate') as string) };
    } else if (searchParams.has('endDate')) {
      // Find trips that end on or before the specified date
      query.endDate = { $lte: new Date(searchParams.get('endDate') as string) };
    }
  }
  
  // Budget range
  if (searchParams.has('minBudget') || searchParams.has('maxBudget')) {
    query['budget.amount'] = {};
    
    if (searchParams.has('minBudget')) {
      const minBudget = parseInt(searchParams.get('minBudget') as string);
      if (!isNaN(minBudget)) query['budget.amount'].$gte = minBudget;
    }
    
    if (searchParams.has('maxBudget')) {
      const maxBudget = parseInt(searchParams.get('maxBudget') as string);
      if (!isNaN(maxBudget)) query['budget.amount'].$lte = maxBudget;
    }
  }
  
  // Transportation type
  if (searchParams.has('transportationType')) {
    query['transportation.type'] = searchParams.get('transportationType');
  }
}

// Build sort query
function buildSortQuery(searchParams: URLSearchParams, query: any): Sort {
  const sortField = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
  
  // If using text search, prioritize results by text score
  if (query.$text) {
    return { score: { $meta: "textScore" }, [sortField]: sortOrder };
  }
  
  return { [sortField]: sortOrder };
}

// Serialize MongoDB documents to plain objects
function serializeDocuments(documents: Document[]): any[] {
  return documents.map(serializeDocument);
}

// Recursively serialize a MongoDB document to a plain object
function serializeDocument(doc: any): any {
  // Handle null or undefined
  if (doc === null || doc === undefined) {
    return doc;
  }
  
  // Handle arrays by recursively serializing each item
  if (Array.isArray(doc)) {
    return doc.map(item => serializeDocument(item));
  }
  
  // Handle objects
  if (typeof doc === 'object') {
    // Convert to plain object first
    const plainDoc = JSON.parse(JSON.stringify(doc));
    
    // Handle MongoDB ObjectId
    if (doc._id) {
      plainDoc._id = doc._id.toString();
    }
    
    // Process each property
    for (const key in plainDoc) {
      // Handle nested ObjectIds
      if (plainDoc[key] && typeof plainDoc[key] === 'object' && plainDoc[key]._id) {
        plainDoc[key]._id = plainDoc[key]._id.toString();
      }
      
      // Handle dates
      if (doc[key] instanceof Date) {
        plainDoc[key] = doc[key].toISOString();
      }
      
      // Handle nested objects and arrays recursively
      if (plainDoc[key] && typeof plainDoc[key] === 'object') {
        plainDoc[key] = serializeDocument(doc[key]);
      }
    }
    
    return plainDoc;
  }
  
  // Return primitives as-is
  return doc;
}