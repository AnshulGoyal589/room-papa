import { NextRequest, NextResponse } from 'next/server';
import { Document, Sort } from 'mongodb';
import clientPromise from '@/lib/mongodb/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    // const { db } = await connectToDatabase();
    const client = await clientPromise;
    const db = client.db('travel-app');
    const { searchParams } = request.nextUrl;
    const category = params.category;
    
    const query = buildCategoryQuery(searchParams, category);
    const sort = buildSortQuery(searchParams);

    // console.log('Category search query:', query);
    
    const pageSize = 10;
    const page = parseInt(searchParams.get('page') || '1');
    
    let collection;
    switch (category) {
      case 'property':
        collection = 'properties';
        break;
      case 'travelling':
        collection = 'travellings';
        break;
      case 'trip':
        collection = 'trips';
        break;
      default:
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    
    const total = await db.collection(collection).countDocuments(query);

    const results = await db.collection(collection)
      .find(query)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();
    
    return NextResponse.json({ results, total });
  } catch (error) {
    console.error('Category search API error:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}

function buildCategoryQuery(searchParams: URLSearchParams, category: string) {
  // Reuse the filtering logic from the main search API
  const query: any = {};
  
  // General search term
  if (searchParams.has('query')) {
    query.$text = { $search: searchParams.get('query') as string };
  }
  
  switch (category.toLowerCase()) {
    case 'property':
      // Property-specific filters (same as in buildSearchQuery)
      if (searchParams.has('minPrice') || searchParams.has('maxPrice')) {
        query.pricePerNight = {};
        if (searchParams.has('minPrice')) {
          query.pricePerNight.$gte = parseInt(searchParams.get('minPrice') as string);
        }
        if (searchParams.has('maxPrice')) {
          query.pricePerNight.$lte = parseInt(searchParams.get('maxPrice') as string);
        }
      }
      
      // Add more property filters (same as in buildSearchQuery)
      // ...
      break;
      
    case 'travelling':
      // Travelling-specific filters (same as in buildSearchQuery)
      // ...
      break;
      
    case 'trip':
      // Trip-specific filters (same as in buildSearchQuery)
      // ...
      break;
  }
  
  return query;
}

function buildSortQuery(searchParams: URLSearchParams) : Sort {
  const sortField = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
  
  return { [sortField]: sortOrder };
}