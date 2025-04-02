
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getManagerStatus } from '@/lib/mongodb';

export async function GET() {
  try {
    const { userId } = await auth();
    // console.log('User role:', userId);
    if (!userId) {
      return NextResponse.json({ role: 'guest' });
    }
    const role = await getManagerStatus(userId);

    // console.log('User role:', role); 
    
    return NextResponse.json({ isManager : role === 'manager' });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user role' }, 
      { status: 500 }
    );
  }
}