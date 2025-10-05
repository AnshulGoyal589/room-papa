// "use client"

// import Image from 'next/image';
// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';

// interface Destination {
//   _id: string;
//   title: string;
//   bannerImage:{
//     url : string;
//   }
// }

// export default function PopularDestinations() {
//   const router = useRouter();
//   const [popularDestinations, setPopularDestinations] = useState<Destination[]>(
//     [
//           // { title: 'Paris', bannerImage: '/images/popular1.avif' },
//           // { title: 'Maldives', bannerImage: '/images/popular2.avif' },
//           // { title: 'Tokyo', bannerImage: '/images/popular3.avif' },
//           // { title: 'New York', bannerImage: '/images/popular4.avif' }
//         ]
//   );

//   useEffect(() => {
//     const fetchDestinations = async () => {
//       try {
//         const response = await fetch('/api/trips');
//         // console.log(response);
//         if (!response.ok) {
//           throw new Error('Failed to fetch destinations');
//         }
//         const data: Destination[] = await response.json();
//         setPopularDestinations(data);
//       } catch (error) {
//         console.error('Error fetching destinations:', error);
//       }
//     };

//     fetchDestinations();
//   }, []);
//   const handleSearch = (id: string) => {
//     router.push(`/customer/trip/${id}`);
//   };

//   return (
//     <div className="container mx-auto py-16 px-4">
//       <h2 className="text-3xl font-bold mb-8 text-center">Popular Destinations</h2>
//       <div className="grid md:grid-cols-4 gap-6">
//         {popularDestinations.map((destination) => (
//           <div 
//             key={destination.title} 
//             className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition duration-300"
//             onClick={() => handleSearch(destination._id)}
//           >
//             <Image 
//               src={destination?.bannerImage.url} 
//               width={500}
//               height={500}
//               alt={destination.title} 
//               className="w-full h-48 object-cover"
//             />
//             <div className="p-4">
//               <h3 className="text-xl font-semibold">{destination.title}</h3>
//               <p className="text-gray-500">Discover amazing experiences</p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
