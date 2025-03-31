import { NextRequest, NextResponse } from 'next/server';
import { deleteTravelling, getTravellingById, updateTravelling } from '@/lib/mongodb/models/Travelling';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const {id} = await params;
    const travelling = await getTravellingById(id);
    
    if (!travelling) {
      return NextResponse.json({ error: 'Travelling not found' }, { status: 404 });
    }
    
    return NextResponse.json(travelling);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {id} = await params;
    const travellingData = await request.json();
    const travelling = await updateTravelling(id, travellingData);
    
    if (!travelling) {
      return NextResponse.json({ error: 'Travelling not found' }, { status: 404 });
    }
    
    return NextResponse.json(travelling);
  }catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const {id} = await params;
    const success = await deleteTravelling(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Travelling not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}