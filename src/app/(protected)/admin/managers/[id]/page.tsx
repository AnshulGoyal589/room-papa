'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Mail, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { UserRole } from '@/types';

interface ManagerDetails {
  _id?: string;
  clerkId: string;
  role: UserRole;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  name?: string;
  // Add any additional fields you want to display
  properties?: number;
  trips?: number;
  travellings?: number;
}

export default function ManagerDetailsPage() {
  const [manager, setManager] = useState<ManagerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchManagerDetails();
  }, [params?.id]);

  const fetchManagerDetails = async () => {
    try {
      const clerkId = params?.id as string;
      
      const response = await fetch(`/api/manager/${clerkId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch manager details');
      }

      const data = await response.json();
      setManager(data);
    } catch (error) {
      console.error('Error fetching manager details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load manager details',
        variant: 'destructive'
      });
      router.push('/admin/managers');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-8">Loading manager details...</div>
      </div>
    );
  }

  if (!manager) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-8">
          <p>Manager not found</p>
          <Button onClick={() => router.push('/admin/managers')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Managers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button 
        variant="outline" 
        onClick={() => router.push('/admin/managers')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Managers
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Manager Details</CardTitle>
            <Badge variant="secondary">{manager.role}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="mr-3 h-5 w-5 text-gray-500" />
                  <span>{manager.name || 'Name not provided'}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="mr-3 h-5 w-5 text-gray-500" />
                  <span>{manager.email}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Account Details</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="mr-3 h-5 w-5 text-gray-500" />
                  <span>Created: {new Date(manager.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-3 h-5 w-5 text-gray-500" />
                  <span>Last Updated: {new Date(manager.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div>
            <h3 className="text-lg font-semibold mb-4">Manager Activities</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Properties</p>
                    <p className="text-2xl font-bold">{manager.properties || 0}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Trips</p>
                    <p className="text-2xl font-bold">{manager.trips || 0}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Travelling</p>
                    <p className="text-2xl font-bold">{manager.travellings || 0}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}