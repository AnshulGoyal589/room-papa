// app/api/manager/profile/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDb, getUsersCollection } from '@/lib/mongodb';

/**
 * GET handler to fetch the current manager's profile.
 */
export async function GET() {
  try {
    await getDb();
    
    const { userId: clerkId } = await auth();
    console.log(clerkId);
    if (!clerkId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const users = await getUsersCollection();
    const user = await users.findOne({ clerkId });

    if (!user) {
      return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
    }
    
    return NextResponse.json(user);

  } catch (error) {
    console.error('Failed to get manager profile:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await getDb();

    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, contactNumber, address, bankDetails } = body;

    // Basic validation
    if (!name || !contactNumber) {
        return NextResponse.json({ message: 'Name and Contact Number are required.' }, { status: 400 });
    }
    const users = await getUsersCollection();
    const userToUpdate = await users.findOneAndUpdate(
      { clerkId },
      {
        $set: {
          'managerDetails.name': name,
          'managerDetails.contactNumber': contactNumber,
          'managerDetails.address': address,
          'managerDetails.bankDetails': bankDetails,
        }
      },
      { returnDocument: 'after' } // Return the updated document
    );

    if (!userToUpdate) {
      return NextResponse.json({ message: 'User not found to update' }, { status: 404 });
    }
    
    return NextResponse.json(userToUpdate);

  } catch (error) {
    console.error('Failed to update manager profile:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}