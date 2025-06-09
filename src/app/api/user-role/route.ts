
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { saveUserRole } from '@/lib/mongodb';
import { validateUser } from '@/lib/mongodb/models/User';
import { getUserRole } from '@/lib/mongodb';

interface RequestBody {
  clerkId: string;
  role: 'customer' | 'manager';
  email: string;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // console.log("hurrah check pint 1");
    const body = await request.json() as RequestBody;
    const { clerkId, role, email } = body;
    // console.log(clerkId , role , email);
    if (userId !== clerkId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      validateUser({ clerkId, role });
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
    }

    await saveUserRole(clerkId, role, email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ role: 'guest' });
    }
    const role = await getUserRole(userId);

    // console.log('User role:', role); 
    
    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user role' }, 
      { status: 500 }
    );
  }
}