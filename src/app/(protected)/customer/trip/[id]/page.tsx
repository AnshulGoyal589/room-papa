import TripDetailPage from "@/components/customer/DetailPage/Trips/TripDetail";
import SearchHeader from "@/components/customer/SearchHeader";

export default function TripPage() {
  return (
    
    <div className="min-h-screen bg-gray-50">   
      <SearchHeader/>
      <TripDetailPage />
    </div>
  );
}
