
import type { Metadata } from 'next';
import { seoMetadata } from '@/seo-metadata';
import PropertyDetailPage from "@/components/customer/DetailPage/Property/PropertyDetail";
import SearchHeader from "@/components/customer/SearchHeader";

export const metadata: Metadata = seoMetadata.propertyDetail;


export default function PropertyPage() {
  return (
    <div className="min-h-screen bg-gray-50">   
      <SearchHeader/>
      <PropertyDetailPage/>
    </div>
  );
}
