import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { Document, Sort } from 'mongodb';
import { QueryType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('travel-app');
    const { searchParams } = request.nextUrl;
    
    const category = searchParams.get('category') || 'travelling';
    
    const validationResult = validateSearchParams(searchParams, category);
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

    const total = await db.collection(collectionName).countDocuments(query);
    const results = await db.collection(collectionName)
      .find(query)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    // console.log("results: ", results);
    
    const plainResults = serializeDocuments(results);
    
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

function validateSearchParams(searchParams: URLSearchParams, category: string) {
  if (searchParams.has('startDate') || searchParams.has('endDate')) {
    try {
      if (searchParams.has('startDate')) new Date(searchParams.get('startDate') as string);
      if (searchParams.has('endDate')) new Date(searchParams.get('endDate') as string);
    } catch (_error) { // Added underscore for unused var
      console.error(_error);
      return { valid: false, error: 'Invalid date format' };
    }
  }
  
  const numericParams: Record<string, string[]> = {
    'property': ['price', 'discountedPrice', 'children', 'adults', 'rooms'],
    'trip': ['price', 'discountedPrice', 'priority'],
    'travelling': ['price', 'discountedPrice']
  };
  
  if (numericParams[category.toLowerCase()]) {
    for (const param of numericParams[category.toLowerCase()]) {
      if (searchParams.has(param) && isNaN(parseFloat(searchParams.get(param) as string))) {
        return { valid: false, error: `Invalid value for ${param}` };
      }
    }
  }
  
  return { valid: true };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addDateRangeFilter(query: Record<string, any>, searchParams: URLSearchParams, schemaType: 'Property' | 'Travelling' | 'Trip') {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (startDate || endDate) {
    query.$and = query.$and || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateFilter: Record<string, any> = {};

    // Determine the correct field based on schemaType
    let dateField: string;
    switch (schemaType) {
      case 'Property':
        dateField = 'startDate' as string; // For filtering properties by their start date
        break;
      case 'Travelling':
        dateField = 'transportation.arrivalTime'; // For filtering travelling documents
        break;
      case 'Trip':
        dateField = 'startDate' as string; // For filtering trips by their start date
        break;
      default:
        throw new Error('Invalid schema type');
    }

    // Apply filters for startDate and endDate
    if (startDate) {
      dateFilter[dateField] = { $gte: startDate }; // Compare as strings
    }
    if (endDate) {
      dateFilter[dateField] = {
        ...dateFilter[dateField],
        $lte: endDate, // Compare as strings
      };
    }

    
    query.$and.push(dateFilter);
  }
}




function buildSearchQuery(searchParams: URLSearchParams) : QueryType {
  const query: QueryType = {};
  const category = searchParams.get('category') || 'travelling';

  
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
      { 'transportation.to': { $regex: titleQuery, $options: 'i' } },
      { 'activities': { $elemMatch: { $regex: titleQuery, $options: 'i' } } },
    ];
  }
  if (searchParams.has('location')) {
    const locationQuery = searchParams.get('location') as string;
    query.$or = [
      { 'destination.city': { $regex: locationQuery, $options: 'i' } },
      { 'destination.state': { $regex: locationQuery, $options: 'i' } },
      { 'destination.country': { $regex: locationQuery, $options: 'i' } },
      { 'location.city': { $regex: locationQuery, $options: 'i' } },
      { 'location.address': { $regex: locationQuery, $options: 'i' } },
      { 'location.state': { $regex: locationQuery, $options: 'i' } },
      { 'location.country': { $regex: locationQuery, $options: 'i' } },
      { 'transportation.from': { $regex: locationQuery, $options: 'i' } },
      { 'transportation.to': { $regex: locationQuery, $options: 'i' } },
    ];
  }
  if (searchParams.has('tripStatus')) {
    const locationQuery = searchParams.get('tripStatus') as string;
    query.$or = [
      { 'type': { $regex: locationQuery, $options: 'i' } },
    ];
  }
  
  const filterFunctions: Record<string, (q: QueryType, sp: URLSearchParams) => void> = {
    'property': addPropertyFilters,
    'travelling': addTravellingFilters,
    'trip': addTripFilters
  };

  if (filterFunctions[category.toLowerCase()]) {
    filterFunctions[category.toLowerCase()](query, searchParams);
  }
  
  return query;
}

function addPropertyFilters(query: QueryType, searchParams: URLSearchParams) {
  addRangeFilter(query, searchParams, 'costing.discountedPrice', 'minPrice', 'maxPrice');
  addMinFilter(query, searchParams, 'adults');
  addMinFilter(query, searchParams, 'children');
  addMinFilter(query, searchParams, 'rooms');
  addExactFilter(query, searchParams, 'type');
  addArrayFilter(query, searchParams, 'amenities');
  addDateRangeFilter(query, searchParams , "Property");
}

function addTravellingFilters(query:QueryType, searchParams: URLSearchParams) {

  addRangeFilter(query, searchParams, 'costing.discountedPrice', 'minPrice', 'maxPrice');
  addExactFilter(query, searchParams, 'transportation.type');
  addDateRangeFilter(query, searchParams , "Travelling");
  // addRangeFilter(query, searchParams, 'costing.discountedPrice', 'minPrice', 'maxPrice');
}

function addTripFilters(query:QueryType, searchParams: URLSearchParams) {
  addRangeFilter(query, searchParams, 'costing.discountedPrice', 'minPrice', 'maxPrice');
  addExactFilter(query, searchParams, 'type');
  addDateRangeFilter(query, searchParams , "Trip");
  // addRangeFilter(query, searchParams, 'costing.discountedPrice', 'minBudget', 'maxBudget');
  addArrayFilter(query, searchParams, 'activities');
  addExactFilter(query, searchParams, 'domain');
}

function addRangeFilter(query: QueryType, searchParams: URLSearchParams, field: string, minParam: string, maxParam: string) {
  const rangeQuery: Record<string, number> = {};
  if (searchParams.has(minParam)) {
    rangeQuery.$gte = parseFloat(searchParams.get(minParam) as string);
  }
  if (searchParams.has(maxParam)) {
    rangeQuery.$lte = parseFloat(searchParams.get(maxParam) as string);
  }
  if (Object.keys(rangeQuery).length > 0) {
    query[field] = rangeQuery;
  }
}

function addMinFilter(query: QueryType, searchParams: URLSearchParams, field: string) {
  if (searchParams.has(field)) {
    const value = parseFloat(searchParams.get(field) as string);
    if (!isNaN(value)) query[field] = { $gte: value };
  }
}

function addExactFilter(query: QueryType, searchParams: URLSearchParams, field: string) {
  if (searchParams.has(field)) {
    query[field] = searchParams.get(field);
  }
}

function addArrayFilter(query: QueryType, searchParams: URLSearchParams, field: string) {
  if (searchParams.has(field)) {
    const list = (searchParams.get(field) as string).split(',');
    query[field] = { $all: list };
  }
}





function buildSortQuery(searchParams: URLSearchParams): Sort {
  const sortField = searchParams.get('sortBy') || 'createdAt';
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
