import { auth } from '@clerk/nextjs/server';
import { getUsersCollection } from '@/lib/mongodb';
import { User } from '@/lib/mongodb/models/User';

export async function getAuthenticatedUserProfile(): Promise<User | null> {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return null;
    }

    const users = await getUsersCollection();
    const user = await users.findOne({ clerkId });

    if (!user) {
      return null;
    }
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error("Failed to get user profile:", error);
    return null;
  }
}

export async function userRole( userId: string | undefined ): Promise<string | null> {
  try {
    if (!userId) {
      return null;
    }
    const users = await getUsersCollection();
    const user = await users.findOne({ clerkId: userId });
    return user?.role || null;
  } catch (error) {
    console.error("Failed to get user role:", error);
    return null;
  }
}