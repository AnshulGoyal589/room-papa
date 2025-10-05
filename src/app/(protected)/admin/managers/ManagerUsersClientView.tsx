'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { User } from '@/lib/mongodb/models/User';

// Define the props this component receives from the server page.
interface ManagerUsersClientViewProps {
  initialManagers: User[];
}

export default function ManagerUsersClientView({ initialManagers }: ManagerUsersClientViewProps) {
  // Initialize state with the data passed from the server.
  const [managers, setManagers] = useState<User[]>(initialManagers);
  
  // No need for `isLoading` for the initial render.
  
  const { toast } = useToast();
  const router = useRouter();

  // The initial useEffect to fetch data is no longer needed.

  const handleManagerClick = (clerkId: string) => {
    router.push(`/admin/managers/${clerkId}`);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/manager/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update manager status`);
      }

      setManagers(currentManagers => 
        currentManagers.map(manager => 
          manager.clerkId === id ? { ...manager, status } : manager
        )
      );

      toast({
        title: 'Success',
        description: `Manager status updated to ${status}.`,
      });
    } catch (error) {
      console.error(`Error updating manager status:`, error);
      toast({
        title: 'Error',
        description: `Failed to update manager status.`,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Manager Users</CardTitle>
        </CardHeader>
        <CardContent>
          {/* The initial loading state is gone. The page renders with data instantly. */}
          {managers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No managers found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.map((manager) => (
                  <TableRow 
                    key={manager._id || manager.clerkId}
                    onClick={() => handleManagerClick(manager.clerkId)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <TableCell className="font-medium">{manager.email}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          manager.status === 'approved' ? 'default' :
                          manager.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {manager.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(manager.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(manager.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end space-x-2">
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