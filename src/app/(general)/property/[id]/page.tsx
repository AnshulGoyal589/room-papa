
import type { Metadata } from 'next';
import { seoMetadata } from '@/seo-metadata';
import PropertyDetailPage from "@/components/customer/DetailPage/Property/PropertyDetail";
import SearchHeader from "@/components/customer/SearchHeader";
import { getPropertyById } from '@/lib/mongodb/models/Property';

export const metadata: Metadata = seoMetadata.propertyDetail;

async function fetchPropertyData(id: string){
  try{
    const property = await getPropertyById(id);
    return property;
  }catch(error){
    console.error("Error fetching property data:", error);
    return null;
  }
}


export default async function PropertyPage( { params }: { params: Promise<{ id: string }> } ) {
  const property = await fetchPropertyData((await params).id);
  const plainProperty = property ? JSON.parse(JSON.stringify(property)) : null;
  console.log("Property Data:", plainProperty);
  return (
    <div className="min-h-screen bg-gray-50">   
      <SearchHeader/>
      <PropertyDetailPage property={plainProperty}/>
    </div>
  );
}
