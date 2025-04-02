import { UserRole } from "@/types";

export interface User {
  _id?: string;
  clerkId: string;
  role: UserRole;
  email: string;
  createdAt: Date;
  status?: string | 'pending';
  updatedAt: Date;
}

export function validateUser(userData: { clerkId: string; role: UserRole }): void {
  if (!userData.clerkId) {
    throw new Error('Clerk ID is required');
  }
  
  if (!['customer', 'manager', 'admin'].includes(userData.role)) {
    throw new Error('Invalid user role');
  }
}