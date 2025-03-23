import { NextRequest, NextResponse } from 'next/server';
import { getAllTravellings, Travelling } from '@/lib/mongodb/models/Travelling';
import clientPromise from '@/lib/mongodb/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const tripId = searchParams.get('tripId');
    
    const travellings = await getAllTravellings(userId || undefined, tripId || undefined);
    return NextResponse.json(travellings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('travel-app');
    
    const travellingData = await req.json();
    
    const travelling: Travelling = {
      ...travellingData,
      createdAt: travellingData.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    const result = await db.collection('travellings').insertOne(travelling);
    
    return NextResponse.json({ 
      message: 'Travelling created successfully',
      id: result.insertedId,
    });
  } catch (error) {
    console.error('Error saving item to MongoDB:', error);
    return NextResponse.json(
      { error: 'Error saving item' },
      { status: 500 }
    );
  }
}