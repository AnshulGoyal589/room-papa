import TravellingDetailPage from "@/components/customer/DetailPage/Travelling/TravellingDetail";
import SearchHeader from "@/components/customer/SearchHeader";

export default function TravellingPage() {
  return (
    <div className="min-h-screen bg-gray-50">   
      <SearchHeader/>
      <TravellingDetailPage/>
    </div>
  );
}
