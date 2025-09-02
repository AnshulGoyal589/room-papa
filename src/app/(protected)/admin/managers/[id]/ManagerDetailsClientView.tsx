'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Mail, Calendar } from 'lucide-react';
import { ManagerDetails } from '@/lib/mongodb/models/Components';

// Define the props this component receives from the server page.
interface ManagerDetailsClientViewProps {
  initialManager: ManagerDetails;
}

export default function ManagerDetailsClientView({ initialManager }: ManagerDetailsClientViewProps) {
  const manager = initialManager;
  const router = useRouter();

  
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