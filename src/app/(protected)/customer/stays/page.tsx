
import Stays from '@/components/customer/HomePage/HeroSection/Stays';
import InitialRender from '@/components/customer/HomePage/InitialRender';


export default async function Dashboard() {

  
  return (
    <div className="min-h-screen bg-gray-50">
      
      <Stays/>
      <InitialRender/>
      
    </div>
  );
}