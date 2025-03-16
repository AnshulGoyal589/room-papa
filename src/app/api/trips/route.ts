import { NextRequest, NextResponse } from 'next/server';
import { getAllTrips, Trip } from '@/lib/mongodb/models/Trip';
import clientPromise from '@/lib/mongodb/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    const trips = await getAllTrips(userId || undefined);
    return NextResponse.json(trips);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('travel-app');
    
    const tripData = await req.json();
    
    const trip: Trip = {
      ...tripData,
      createdAt: tripData.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    const result = await db.collection('trips').insertOne(trip);
    
    return NextResponse.json({ 
      message: 'Trip created successfully',
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