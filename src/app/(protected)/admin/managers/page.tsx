'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { UserRole } from '@/types';

interface User {
  _id?: string;
  clerkId: string;
  role: UserRole;
  email: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function ManagerUsersPage() {
  const [managers, setManagers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchManagerUsers();
  }, []);

  const fetchManagerUsers = async () => {
    try {
      const response = await fetch('/api/manager');
      
      if (!response.ok) {
        throw new Error('Failed to fetch manager users');
      }

      const data = await response.json();
      setManagers(data);
    } catch (error) {
      console.error('Error fetching manager users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load manager users',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManagerClick = (clerkId: string) => {
    router.push(`/admin/managers/${clerkId}`);
  };

  const handleStatusUpdate = async (clerkId: string, status: string) => {
    try {
      const response = await fetch(`/api/manager/${clerkId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update manager status`);
      }

      // Update local state
      setManagers(managers.map(manager => 
        manager.clerkId === clerkId 
          ? { ...manager, status } 
          : manager
      ));

      toast({
        title: 'Success',
        description: `Manager status updated to ${status} successfully`,
        variant: 'default'
      });
    } catch (error) {
      console.error(`Error updating manager status:`, error);
      toast({
        title: 'Error',
        description: `Failed to update manager status`,
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-8">Loading managers...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Manager Users</CardTitle>
        </CardHeader>
        <CardContent>
          {managers.length === 0 ? (
            <p className="text-center text-gray-500">No managers found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Clerk ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.map((manager) => (
                  <TableRow 
                    key={manager._id || manager.clerkId}
                    onClick={() => handleManagerClick(manager.clerkId)}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <TableCell>{manager.email}</TableCell>
                    <TableCell>{manager.clerkId}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          manager.status === 'approved' 
                            ? 'default' 
                            : 'secondary'
                        }
                      >
                        {manager.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(manager.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(manager.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex space-x-2">
                        {/* Buttons to toggle between all possible statuses */}
                        {['pending', 'approved', 'rejected'].map((status) => (
                          status !== manager.status && (
                            <Button 
                              key={status}
                              size="sm" 
                              variant={
                                status === 'approved' ? 'default' :
                                status === 'rejected' ? 'destructive' : 'secondary'
                              }
                              onClick={() => handleStatusUpdate(manager.clerkId, status)}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Button>
                          )
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}