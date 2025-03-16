import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { Document, Sort } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('travel-app');
    const { searchParams } = request.nextUrl;
    
    const category = searchParams.get('category') || 'property';
    
    // Ensure text indexes exist before querying
    await ensureTextIndexes(db, category);
    
    const query = buildSearchQuery(searchParams);
    const sort = buildSortQuery(searchParams, query);
    
    const pageSize = 10;
    const page = parseInt(searchParams.get('page') || '1');

    let results: Document[] = [];
    let total = 0;
    
    switch (category.toLowerCase()) {
      case 'property':
        total = await db.collection('properties').countDocuments(query);
        results = await db.collection('properties')
          .find(query)
          .sort(sort)
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .toArray();
        break;
      case 'travelling':
        total = await db.collection('travellings').countDocuments(query);
        results = await db.collection('travellings')
          .find(query)
          .sort(sort)
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .toArray();
        break;
      case 'trip':
        total = await db.collection('trips').countDocuments(query);
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
    
    // Convert MongoDB documents to plain objects before sending the response
    const plainResults = results.map(doc => {
      const plainDoc = JSON.parse(JSON.stringify(doc));
      
      if (plainDoc._id) {
        plainDoc._id = doc._id.toString();
      }
      
      for (const key in plainDoc) {
        if (plainDoc[key] && plainDoc[key]._id) {
          plainDoc[key]._id = plainDoc[key]._id.toString();
        }
      }
      
      for (const key in plainDoc) {
        if (plainDoc[key] instanceof Date) {
          plainDoc[key] = plainDoc[key].toISOString();
        }
      }
      
      return plainDoc;
    });
    
    return NextResponse.json({ results: plainResults, total });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
  }
}

// Function to ensure text indexes exist
async function ensureTextIndexes(db: any, category: string) {
  try {
    switch (category.toLowerCase()) {
      case 'property':
        await db.collection('properties').createIndex(
          { 
            name: "text", 
            description: "text", 
            "location.city": "text", 
            "location.country": "text" 
          }
        );
        break;
      case 'travelling':
        await db.collection('travellings').createIndex(
          { 
            title: "text", 
            description: "text", 
            "days.description": "text", 
            "days.activities.name": "text", 
            "days.activities.description": "text" 
          }
        );
        break;
      case 'trip':
        await db.collection('trips').createIndex(
          { 
            title: "text", 
            description: "text", 
            "destination.city": "text", 
            "destination.country": "text" 
          }
        );
        break;
    }
  } catch (error) {
    console.error('Error creating text index:', error);
    // Continue execution even if index creation fails
    // The index might already exist or there might be other issues
  }
}

function buildSearchQuery(searchParams: URLSearchParams) {
  const query: any = {};
  const category = searchParams.get('category') || 'property';

  // General search term
  if (searchParams.has('query') && searchParams.get('query')) {
    const searchText = searchParams.get('query') as string;
    // Only add text search if there's actual text to search for
    if (searchText.trim() !== '') {
      query.$text = { $search: searchText };
    }
  }
  
  switch (category.toLowerCase()) {
    case 'property':
      // Property-specific filters
      try {
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
      } catch (error) {
        console.warn('Invalid price parameter');
      }
      
      try {
        if (searchParams.has('bedrooms')) {
          const bedrooms = parseInt(searchParams.get('bedrooms') as string);
          if (!isNaN(bedrooms)) query.bedrooms = { $gte: bedrooms };
        }
      } catch (error) {
        console.warn('Invalid bedrooms parameter');
      }
      
      try {
        if (searchParams.has('bathrooms')) {
          const bathrooms = parseInt(searchParams.get('bathrooms') as string);
          if (!isNaN(bathrooms)) query.bathrooms = { $gte: bathrooms };
        }
      } catch (error) {
        console.warn('Invalid bathrooms parameter');
      }
      
      try {
        if (searchParams.has('guests')) {
          const guests = parseInt(searchParams.get('guests') as string);
          if (!isNaN(guests)) query.maximumGuests = { $gte: guests };
        }
      } catch (error) {
        console.warn('Invalid guests parameter');
      }
      
      if (searchParams.has('propertyType')) {
        query.type = searchParams.get('propertyType');
      }
      
      if (searchParams.has('amenities')) {
        const amenitiesList = (searchParams.get('amenities') as string).split(',');
        query.amenities = { $all: amenitiesList };
      }
      
      if (searchParams.has('city')) {
        const locationQuery = searchParams.get('city');
        query.$or = [
          { 'location.city': { $regex: locationQuery, $options: 'i' } },
          { 'location.country': { $regex: locationQuery, $options: 'i' } }
        ];
      }
      
      // Filter for active properties only
      query.active = true;
      break;
      
    case 'travelling':
      // Travelling-specific filters
      if (searchParams.has('visibility')) {
        query.visibility = searchParams.get('visibility');
      }
      
      if (searchParams.has('startDate') || searchParams.has('endDate')) {
        try {
          if (searchParams.has('startDate') && searchParams.has('endDate')) {
            const startDate = new Date(searchParams.get('startDate') as string);
            const endDate = new Date(searchParams.get('endDate') as string);
            
            query.$or = [
              { 'days.date': { $gte: startDate, $lte: endDate } },
              { 
                $and: [
                  { 'days.date': { $lte: startDate } },
                  { 'days.date': { $gte: endDate } }
                ]
              }
            ];
          } else if (searchParams.has('startDate')) {
            query['days.date'] = { $gte: new Date(searchParams.get('startDate') as string) };
          } else if (searchParams.has('endDate')) {
            query['days.date'] = { $lte: new Date(searchParams.get('endDate') as string) };
          }
        } catch (error) {
          console.warn('Invalid date parameter for travelling');
        }
      }
      
      if (searchParams.has('activityCategory')) {
        query['days.activities.category'] = searchParams.get('activityCategory');
      }
      
      if (searchParams.has('tags')) {
        const tagsList = (searchParams.get('tags') as string).split(',');
        query.tags = { $in: tagsList };
      }
      
      if (searchParams.has('city')) {
        const locationQuery = searchParams.get('city');
        query.$or = [
          { 'location.city': { $regex: locationQuery, $options: 'i' } },
          { 'location.country': { $regex: locationQuery, $options: 'i' } }
        ];
      }
      break;
      
    case 'trip':
      // Trip-specific filters
      if (searchParams.has('status')) {
        query.status = searchParams.get('status');
      }
      
      try {
        if (searchParams.has('startDate') && searchParams.has('endDate')) {
          const startDate = new Date(searchParams.get('startDate') as string);
          const endDate = new Date(searchParams.get('endDate') as string);
          
          query.$or = [
            { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
            { startDate: { $gte: startDate, $lte: endDate } },
            { endDate: { $gte: startDate, $lte: endDate } }
          ];
        } else if (searchParams.has('startDate')) {
          query.startDate = { $gte: new Date(searchParams.get('startDate') as string) };
        } else if (searchParams.has('endDate')) {
          query.endDate = { $lte: new Date(searchParams.get('endDate') as string) };
        }
      } catch (error) {
        console.warn('Invalid date parameter for trip');
      }
      
      if (searchParams.has('city')) {
        const locationQuery = searchParams.get('city');
        query.$or = [
          { 'destination.city': { $regex: locationQuery, $options: 'i' } },
          { 'destination.country': { $regex: locationQuery, $options: 'i' } }
        ];
      }
      
      try {
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
      } catch (error) {
        console.warn('Invalid budget parameter');
      }
      
      if (searchParams.has('transportationType')) {
        query['transportation.type'] = searchParams.get('transportationType');
      }
      break;
  }
  
  return query;
}

function buildSortQuery(searchParams: URLSearchParams, query: any): Sort {
  const sortField = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
  
  // If using text search, prioritize results by text score
  if (query.$text) {
    return { score: { $meta: "textScore" }, [sortField]: sortOrder };
  }
  
  return { [sortField]: sortOrder };
}
