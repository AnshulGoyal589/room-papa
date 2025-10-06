import { NextRequest, NextResponse } from 'next/server';
import {  Property } from '@/lib/mongodb/models/Property';
import getClient from '@/lib/mongodb/client';


export async function POST(req: NextRequest) {
  try {
    const client = await getClient();
    const db = client.db('travel-app');
    
    const propertyData = await req.json();
    
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
