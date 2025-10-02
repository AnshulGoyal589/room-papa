import { NextRequest, NextResponse } from 'next/server';
import { getAllTravellings, Travelling } from '@/lib/mongodb/models/Travelling';
import getClient from '@/lib/mongodb/client';

export async function GET() {
  try {
    // const { searchParams } = new URL(request.url);
    // const userId = searchParams.get('userId');
    
    const travellings = await getAllTravellings();
    return NextResponse.json(travellings);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const client = await getClient();
    const db = client.db('travel-app');
    
    const travellingData = await req.json();


    // travellingData.transportation.startDate = new Date(travellingData.transportation.startDate);
    // travellingData.transportation.endDate = new Date(travellingData.transportation.endDate);

    
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
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
