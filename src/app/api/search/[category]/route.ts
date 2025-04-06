import { NextRequest, NextResponse } from 'next/server';
import { Document, Filter, Sort } from 'mongodb';
import clientPromise from '@/lib/mongodb/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const client = await clientPromise;
    const db = client.db('travel-app');
    const { searchParams } = request.nextUrl;

    const {category} = await params;
    // const category = params.category;

    const query = buildCategoryQuery(searchParams, category);
    const sort = buildSortQuery(searchParams);

    const pageSize = 10;
    const page = parseInt(searchParams.get('page') || '1');

    let collection: string;
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
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildCategoryQuery(searchParams: URLSearchParams, category: string): Filter<Document> {
  const query: Filter<Document> = {};

  // General search term
  const searchQuery = searchParams.get('query');
  if (searchQuery) {
    query.$text = { $search: searchQuery };
  }

  switch (category.toLowerCase()) {
    case 'property':
      // Property-specific filters
      if (searchParams.has('minPrice') || searchParams.has('maxPrice')) {
        query.pricePerNight = {};
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');

        if (minPrice) {
          query.pricePerNight.$gte = parseInt(minPrice);
        }
        if (maxPrice) {
          query.pricePerNight.$lte = parseInt(maxPrice);
        }
      }

      const rooms = searchParams.get('rooms');
      if (rooms) {
        query.rooms = { $gte: parseInt(rooms) };
      }

      const propertyType = searchParams.get('propertyType');
      if (propertyType) {
        query.type = propertyType;
      }

      const city = searchParams.get('city');
      if (city) {
        query['location.city'] = {
          $regex: city,
          $options: 'i',
        };
      }
      break;

    case 'travelling':
      // Travelling-specific filters
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      if (startDate || endDate) {
        query.days = { $elemMatch: {} };
        if (startDate) {
          (query.days.$elemMatch as Filter<Document>).date = {
            $gte: new Date(startDate),
          };
        }
        if (endDate) {
          (query.days.$elemMatch as Filter<Document>).date = {
            ...(query.days.$elemMatch as Filter<Document>).date,
            $lte: new Date(endDate),
          };
        }
      }
      break;

    case 'trip':
      // Trip-specific filters
      const minBudget = searchParams.get('minBudget');
      const maxBudget = searchParams.get('maxBudget');
      if (minBudget || maxBudget) {
        query.budget = {
          amount: {
            ...(minBudget && { $gte: parseInt(minBudget) }),
            ...(maxBudget && { $lte: parseInt(maxBudget) }),
          },
        };
      }
      break;
  }

  return query;
}

function buildSortQuery(searchParams: URLSearchParams): Sort {
  const sortField = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

  return { [sortField]: sortOrder } as Sort;
}
