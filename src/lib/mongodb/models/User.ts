import { UserRole } from "@/types";

export interface User {
  _id?: string;
  clerkId: string;
  role: UserRole;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserValidationInput {
  clerkId: string;
  role: string;
  [key: string]: any;
}

export function validateUser(userData: UserValidationInput): boolean {
  const requiredFields = ['clerkId', 'role'];
  
  for (const field of requiredFields) {
    if (!userData[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  if (!['customer', 'manager'].includes(userData.role)) {
    throw new Error('Role must be either "customer" or "manager"');
  }
  
  return true;
}