import { NextRequest, NextResponse } from 'next/server';
import { getDb as connectToDatabase, getDb, getUserByClerkId, updateManagerStatus } from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Connect to database
    await connectToDatabase();

    // Await and destructure the dynamic route parameter
    const { id } = await params;

    const managerDetails = await getUserByClerkId(id);

    if (!managerDetails) {
      return NextResponse.json(
        { message: 'Manager not found' },
        { status: 404 }
      );
    }

    // Optionally, fetch additional details
    const additionalDetails = await fetchManagerActivities();

    // Merge details
    const fullManagerDetails = {
      ...managerDetails,
      ...additionalDetails,
    };

    return NextResponse.json(fullManagerDetails);
  } catch (error) {
    console.error('Error fetching manager details:', error);
    return NextResponse.json(
      { message: 'Failed to fetch manager details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Connect to MongoDB
    await getDb();

    const { id } = await params; // Await the dynamic route parameter
    const { status } = await request.json();

    // Update manager status in the database
    await updateManagerStatus(id, status);

    return NextResponse.json("Successful", { status: 200 });
  } catch (error) {
    console.error('Error updating manager status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function fetchManagerActivities() {
  return {
    properties: 5,
    trips: 3,
    travellings: 2,
  };
}
