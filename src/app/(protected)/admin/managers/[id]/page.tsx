import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ManagerDetails } from '@/lib/mongodb/models/Components';
import ManagerDetailsClientView from './ManagerDetailsClientView';
import { auth } from '@clerk/nextjs/server';
import { getAllUserByClerkId } from '@/lib/mongodb/models/User';
import { userRole } from '@/lib/data/auth';

async function fetchManagerDetails(managerId: string): Promise<ManagerDetails | null> {
  try {
    const managerData  = await getAllUserByClerkId(managerId);
    if (!managerData) {
      return null;
    }
    return managerData;
  } catch (error) {
    console.error('Error fetching manager details on server:', error);
    return null;
  }
}


export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const manager = await fetchManagerDetails(resolvedParams.id);

  if (!manager) {
    return { title: 'Manager Not Found | Room Papa Admin' };
  }

  return {
    title: `Manager: ${manager.name || manager.email} | Room Papa Admin`,
  };
}

export default async function ManagerDetailsPage({ params }: { params: Promise<{ id: string }> }) {

  const { userId } = await auth();
  const role = await userRole(userId ?? undefined);
  if (role !== 'admin') {
    redirect('/');
  }

  const resolvedParams = await params;

  const manager = await fetchManagerDetails(resolvedParams.id);
  if (!manager) {
    notFound();
  }
  
  const plainManager = JSON.parse(JSON.stringify(manager));

  return <ManagerDetailsClientView initialManager={plainManager} />;
}