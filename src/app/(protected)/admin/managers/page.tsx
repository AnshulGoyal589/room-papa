import type { Metadata } from 'next';
import { getAllUsersByRole, User } from '@/lib/mongodb/models/User';
import ManagerUsersClientView from './ManagerUsersClientView';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { userRole } from '@/lib/data/auth';

export const metadata: Metadata = {
  title: 'Manage Managers | Room Papa Admin',
  description: 'Approve, reject, and view all manager users.',
};

async function fetchManagerUsers(): Promise<User[]> {
  try {
    const managers = await getAllUsersByRole('manager');
    if (!managers) {
      return [];
    }
    return managers;

  } catch (error) {
    console.error('Error fetching manager users:', error);
    return [];
  }
}

export default async function ManagerUsersPage() {

  const { userId } = await auth();
  const role = await userRole(userId ?? undefined);
  if (role !== 'admin') {
    redirect('/');
  }

  const initialManagers = await fetchManagerUsers();
  const plainManagers = JSON.parse(JSON.stringify(initialManagers));

  return <ManagerUsersClientView initialManagers={plainManagers} />;
}