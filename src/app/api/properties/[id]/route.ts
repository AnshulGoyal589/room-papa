import { NextRequest, NextResponse } from 'next/server';
import { deleteProperty, getPropertyById, updateProperty } from '@/lib/mongodb/models/Property';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {

    const { id } = await context.params;
    const property = await getPropertyById(id);
    // console.log("jurrah: ",property);
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    return NextResponse.json(property);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propertyData = await request.json();
    const property = await updateProperty(params.id, propertyData);
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    return NextResponse.json(property);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deleteProperty(params.id);
    
    if (!success) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}