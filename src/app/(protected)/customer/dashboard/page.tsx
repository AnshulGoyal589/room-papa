import InitialRender from '@/components/customer/HomePage/InitialRender';
import SearchHeader from '@/components/customer/SearchHeader';


export default async function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">   
      <SearchHeader/>
      <InitialRender/>
    </div>
  );
}