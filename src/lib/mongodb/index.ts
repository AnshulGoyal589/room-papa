import getClient from './client';
import { Collection, Db } from 'mongodb';
import { User } from './models/User';
import { UserRole } from '@/types';
import { clerkClient } from "@clerk/nextjs/server";

const dbName = process.env.MONGODB_DB || 'travel-app';


export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(dbName);
}


export async function getUsersCollection(): Promise<Collection<User>> {
  const db = await getDb();
  return db.collection<User>('users');
}


export async function saveUserRole(
  clerkId: string, 
  role: UserRole, 
  email: string
): Promise<void> {
  const users = await getUsersCollection();
  
  await users.updateOne(
    { clerkId },
    { 
      $set: { 
        clerkId,
        role,
        email,
        updatedAt: new Date()
      },
      $setOnInsert: { 
        createdAt: new Date() 
      }
    },
    { upsert: true }
  );
}


export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  const users = await getUsersCollection();
  return users.findOne({ clerkId });
}


export async function getUserRole(clerkId: string | undefined): Promise<UserRole | 'guest'> {
  if (!clerkId) {
    return 'guest';
  }
  const users = await getUsersCollection();
  const user = await users.findOne({ clerkId });
  
  
  return user ? user.role : 'guest';
}
export async function getManagerStatus(clerkId: string | undefined): Promise<UserRole | 'guest'> {
  if (!clerkId) {
    return 'guest';
  }
  const users = await getUsersCollection();
  const user = await users.findOne({ clerkId , role: 'manager' , status: 'approved' });
  
  
  return user ? 'manager' : 'guest';
}


export async function updateManagerStatus(clerkId: string | undefined , status: string ): Promise<UserRole | 'guest'> {
  if (!clerkId) {
    return 'guest';
  }
  const users = await getUsersCollection();
  await users.updateOne(
    { clerkId, role: 'manager' }, 
    { 
      $set: {
        status,
        updatedAt: new Date()
      }
    }
  );
  
  
  
  return 'guest';
}


export async function getUsersByRole(role: UserRole): Promise<User[]> {
  const users = await getUsersCollection();
  return users.find({ role }).toArray();
}

export async function getUserDetailsById(clerkUserId: string) {
  try {
    // Correctly use clerkClient to fetch user
    const ck = await clerkClient();
    const user = await ck.users.getUser(clerkUserId);

    return {
      id: user.id,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      primaryEmailAddress: user.primaryEmailAddress?.emailAddress,
      username: user.username,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      
      // Additional useful information
      emailAddresses: user.emailAddresses.map(email => ({
        email: email.emailAddress,
        verified: email.verification?.status === 'verified'
      })),
      
      // Phone numbers if available
      phoneNumbers: user.phoneNumbers.map(phone => phone.phoneNumber)
    };
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
}
