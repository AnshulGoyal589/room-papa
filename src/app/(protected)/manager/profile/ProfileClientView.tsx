// app/manager/profile/ProfileClientView.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/components/ui/use-toast";
import { User } from '@/lib/mongodb/models/User';

type ManagerDetailsFormData = {
  name: string;
  contactNumber: string;
  address: string;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
};

interface ProfileClientViewProps {
  initialUser: User;
}

export default function ProfileClientView({ initialUser }: ProfileClientViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<ManagerDetailsFormData>({
    name: initialUser.managerDetails?.name || '',
    contactNumber: initialUser.managerDetails?.contactNumber || '',
    address: initialUser.managerDetails?.address || '',
    bankDetails: {
      accountNumber: initialUser.managerDetails?.bankDetails?.accountNumber || '',
      ifscCode: initialUser.managerDetails?.bankDetails?.ifscCode || '',
      bankName: initialUser.managerDetails?.bankDetails?.bankName || '',
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('bankDetails.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [key]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/manager/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile.');
      }

      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });

      // router.refresh() tells Next.js to re-fetch the data for the current route
      // on the server, which re-renders the server component with fresh data.
      router.refresh();
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <div className="space-y-8">
        {/* Personal Information Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input id="contactNumber" name="contactNumber" type="tel" value={formData.contactNumber} onChange={handleChange} placeholder="+1 234 567 890" required />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" value={formData.address} onChange={handleChange} placeholder="123 Main St, Anytown, USA" rows={3} />
            </div>
          </div>
        </div>

        {/* Bank Details Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Bank Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input id="bankName" name="bankDetails.bankName" value={formData.bankDetails.bankName} onChange={handleChange} placeholder="Global Bank" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input id="accountNumber" name="bankDetails.accountNumber" value={formData.bankDetails.accountNumber} onChange={handleChange} placeholder="1234567890" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code / Routing Number</Label>
              <Input id="ifscCode" name="bankDetails.ifscCode" value={formData.bankDetails.ifscCode} onChange={handleChange} placeholder="GBIN0001234" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}