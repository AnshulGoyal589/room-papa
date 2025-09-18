import React from 'react';
import { Plane, Calendar, MapPin } from 'lucide-react';

export default function WhyChooseUs() {
  const features = [
    { 
      title: 'Best Price Guarantee', 
      description: 'Find lower prices? We will match it!',
      icon: <Plane className="w-12 h-12 text-[#005A9C]" />
    },
    { 
      title: 'Free Cancellation', 
      description: 'Flexible booking with no hidden fees',
      icon: <Calendar className="w-12 h-12 text-[#005A9C]" />
    },
    { 
      title: 'Wide Selection', 
      description: 'Thousands of destinations worldwide',
      icon: <MapPin className="w-12 h-12 text-[#005A9C]" />
    }
  ];

  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Why Choose Our Platform</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div 
              key={feature.title} 
              className="text-center bg-gray-50 p-6 rounded-lg hover:shadow-md transition"
            >
              <div className="flex justify-center mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}