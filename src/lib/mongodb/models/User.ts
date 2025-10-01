import { UserRole } from "@/types";

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