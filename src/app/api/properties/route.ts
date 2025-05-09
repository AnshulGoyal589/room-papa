import { NextRequest, NextResponse } from 'next/server';
import { getAllProperties, Property } from '@/lib/mongodb/models/Property';
import clientPromise from '@/lib/mongodb/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const properties = await getAllProperties(userId || undefined);
    return NextResponse.json(properties);
  }catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('travel-app');
    
    const propertyData = await req.json();

    // propertyData.startDate = new Date(propertyData.startDate);
    // propertyData.endDate = new Date(propertyData.endDate);

    // console.log(new Date(propertyData.startDate));
    // console.log(typeof(new Date(propertyData.startDate)));

    
    const property: Property = {
      ...propertyData,
      createdAt: propertyData.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    const result = await db.collection('properties').insertOne(property);
    
    return NextResponse.json({ 
      message: 'Property created successfully',
      id: result.insertedId,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
