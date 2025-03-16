import clientPromise from './client';
import { Collection, Db } from 'mongodb';
import { User } from './models/User';
import { UserRole } from '@/types';

const dbName = process.env.MONGODB_DB || 'travel-app';

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  // console.log(client);
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

export async function getUserDetails(clerkId: string | undefined): Promise<User | null> {
  if (!clerkId) {
    return null;
  }
  
  const users = await getUsersCollection();
  return users.findOne({ clerkId });
}

export async function getUsersByRole(role: UserRole): Promise<User[]> {
  const users = await getUsersCollection();
  return users.find({ role }).toArray();
}

export async function getAllUsers(): Promise<User[]> {
  const users = await getUsersCollection();
  return users.find({}).toArray();
}