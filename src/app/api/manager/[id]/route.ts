import { NextRequest, NextResponse } from 'next/server';
import { getDb as connectToDatabase, getDb, getUserByClerkId, updateManagerStatus } from '@/lib/mongodb';

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Connect to database
    await connectToDatabase();

    // Fetch manager details by Clerk ID
    const clerkId = params.id;
    const managerDetails = await getUserByClerkId(clerkId);

    if (!managerDetails) {
      return NextResponse.json(
        { message: 'Manager not found' }, 
        { status: 404 }
      );
    }

    // Optionally, fetch additional details like number of properties, trips, etc.
    const additionalDetails = await fetchManagerActivities(clerkId);

    // Merge details
    const fullManagerDetails = {
      ...managerDetails,
      ...additionalDetails
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
  { params }: { params: { clerkId: string } }
) {
  try {
    
    // Connect to MongoDB
    await getDb();
    const {status}  = await request.json();
    // console.log("status: ", status);

    // Extract clerkId from params and status from request body
    const reponse = await updateManagerStatus(params.clerkId, status);


    // Return updated user
    return NextResponse.json("Successful", { status: 200 });

  } catch (error) {
    console.error('Error updating manager status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

// Helper function to fetch manager's activities
async function fetchManagerActivities(clerkId: string) {
  // Implement logic to count manager's properties, trips, etc.
  // This is a placeholder implementation
  return {
    properties: 5,
    trips: 3,
    travellings: 2
  };
}