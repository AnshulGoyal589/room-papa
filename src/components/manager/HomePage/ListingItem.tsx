import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, ArrowRightIcon } from 'lucide-react';
import Image from 'next/image';

type Item = {
  _id?: string;
  title: string;
  description: string;
  category: 'Property' | 'Trip' | 'Travelling';
  createdAt: Date;
  bannerImage?: {
    url: string;
  }
};

type ListingItemProps = {
  item: Item;
  onClick: () => void;
};

const ListingItem: React.FC<ListingItemProps> = ({ item, onClick }) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden group"
      onClick={onClick}
    >
      <div className="relative h-56">
        <Image
          src={item.bannerImage?.url || '/default-banner.jpg'}
          alt={item.title}
          layout="fill"
          objectFit="cover"
          className="group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4 z-10">
          <Badge variant="secondary" className="text-sm font-semibold px-3 py-1">
            {item.category}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold line-clamp-1">{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 line-clamp-3">{item.description}</p>
      </CardContent>
      <CardFooter className="pt-4 flex justify-between items-center border-t">
        <div className="flex items-center text-sm text-gray-500">
          <CalendarIcon className="w-4 h-4 mr-2" />
          {new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
        <div className="text-sm font-semibold text-[#001d2c] hover:text-[#001d2c] transition-colors flex items-center group">
          View Details
          <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </CardFooter>
    </Card>
  );
};

export default ListingItem;
