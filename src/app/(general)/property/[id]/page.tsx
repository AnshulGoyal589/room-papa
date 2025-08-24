import PropertyDetailPage from "@/components/customer/DetailPage/Property/PropertyDetail";
import SearchHeader from "@/components/customer/SearchHeader";


export default function PropertyPage() {
  return (
    <div className="min-h-screen bg-gray-50">   
      <SearchHeader/>
      <PropertyDetailPage/>
    </div>
  );
}
