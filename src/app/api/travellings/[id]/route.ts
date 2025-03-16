import { NextRequest, NextResponse } from 'next/server';
import { deleteTravelling, getTravellingById, updateTravelling } from '@/lib/mongodb/models/Travelling';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {

    const { id } = await context.params;
    const travelling = await getTravellingById(id);
    
    if (!travelling) {
      return NextResponse.json({ error: 'Travelling not found' }, { status: 404 });
    }
    
    return NextResponse.json(travelling);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const travellingData = await request.json();
    const travelling = await updateTravelling(params.id, travellingData);
    
    if (!travelling) {
      return NextResponse.json({ error: 'Travelling not found' }, { status: 404 });
    }
    
    return NextResponse.json(travelling);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deleteTravelling(params.id);
    
    if (!success) {
      return NextResponse.json({ error: 'Travelling not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}