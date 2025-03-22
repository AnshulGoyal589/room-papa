import { clerkClient } from '@clerk/nextjs/server';
import { UserRole } from '@/types';

export async function setUserRole(userId: string, role: UserRole) {
  try {
    const clerk = await clerkClient();
    await clerk.users.updateUser(userId, {
      publicMetadata: {
        role
      }
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error };
  }
}