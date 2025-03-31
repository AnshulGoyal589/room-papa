import { NextResponse } from 'next/server';
import { getDb, getUsersByRole } from '@/lib/mongodb';

export async function GET() {
  try {
    await getDb();
    const managers = await getUsersByRole('manager');    
    return NextResponse.json(managers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users', managers: [] }, 
      { status: 500 }
    );
  }
}