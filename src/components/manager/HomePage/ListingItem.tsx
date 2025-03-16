// components/ListingItem.tsx
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon } from 'lucide-react';

type Item = {
  id: string;
  title: string;
  description: string;
  category: 'Property' | 'Trip' | 'Travelling';
  status: string;
  createdAt: Date;
};

type ListingItemProps = {
  item: Item;
  onClick: () => void;
};

const ListingItem: React.FC<ListingItemProps> = ({ item, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge variant="outline">{item.category}</Badge>
          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
        </div>
        <CardTitle className="text-lg">{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex items-center text-xs text-gray-500">
          <CalendarIcon className="w-3 h-3 mr-1" />
          {new Date(item.createdAt).toLocaleDateString()}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ListingItem;