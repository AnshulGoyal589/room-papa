import { UserRole } from "@/types";
import { getDb } from "..";
import { Collection } from "mongodb";

export interface BankDetails {
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
}

export interface User {
  _id?: string;
  clerkId: string;
  role: UserRole;
  email: string;
  createdAt: Date;
  status?: string | 'pending';
  updatedAt: Date;
  managerDetails?: {
    name?: string;
    contactNumber?: string;
    address?: string;
    bankDetails?: BankDetails;
  };
}

export function validateUser(userData: { clerkId: string; role: UserRole }): void {
  if (!userData.clerkId) {
    throw new Error('Clerk ID is required');
  }
  
  if (!['customer', 'manager', 'admin'].includes(userData.role)) {
    throw new Error('Invalid user role');
  }
}

export async function getUsersCollection(): Promise<Collection<User>> {
  const db = await getDb();
  return db.collection<User>('users');
}

export async function getAllUsersByRole(role: UserRole): Promise<User[]> {
  const users = await getUsersCollection();
  return users.find({ role }).toArray();
}

export async function getAllUserByClerkId(clerkId: string): Promise<User | null> {
  const users = await getUsersCollection();
  return users.findOne({ clerkId });
}

export async function checkManagerStatus(clerkId: string): Promise<boolean> {
  const users = await getUsersCollection();
  const user = await users.findOne({ clerkId, role: 'manager', status: 'approved' });
  return user ? true : false;
}