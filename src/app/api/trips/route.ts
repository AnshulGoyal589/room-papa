import { NextRequest, NextResponse } from 'next/server';
import {  Trip } from '@/lib/mongodb/models/Trip';
import getClient from '@/lib/mongodb/client';


export async function POST(req: NextRequest) {
  try {
    const client = await getClient();
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
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
