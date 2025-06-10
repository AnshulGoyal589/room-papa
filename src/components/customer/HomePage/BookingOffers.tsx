'use client'

import { SignedIn, SignedOut, useClerk } from '@clerk/nextjs';
import Image from 'next/image';

const BookingOffers = () => {
  const { openSignIn } = useClerk();
  return (
    <section className="bg-white py-8 font-sans mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Offers</h2>
          <p className="mt-1 text-slate-600">
            Promotions, deals and special offers for you
          </p>
        </div>

        {/* Cards Grid Container */}
          
          {/* Card 1: Genius Loyalty Program */}
          <SignedOut>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-300 rounded-md p-4 flex justify-between items-center shadow-sm">
                <div className="flex-grow pr-4">
                  <h3 className="font-bold text-xl text-slate-800">Sign in, save money</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Save 10% or more at participating properties. Just look for the blue Genius label.
                  </p>
                  <div className="mt-4 flex items-center flex-wrap gap-2">
                    <button 
                      onClick={() => openSignIn()}
                      className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors">
                      Sign in
                    </button>
                    <button className="border border-blue-600 text-blue-600 font-bold py-2 px-4 rounded-md text-sm hover:bg-blue-50 transition-colors">
                      Register
                    </button>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Image 
                    src="/images/gift.jpeg"
                    alt="Genius loyalty program gift icon" 
                    width={120} 
                    height={110} 
                    className="object-contain"
                  />
                </div>
              </div>

            {/* Card 2: Getaway Deals */}
            <div className="bg-white border border-gray-300 rounded-md p-4 flex justify-between items-center shadow-sm">
              <div className="flex-grow pr-4">
                <h3 className="font-bold text-xl text-slate-800">Quick escape, quality time</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Save up to 20% with a Getaway Deal
                </p>
                <div className="mt-4">
                  <button className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm">
                    Save on stays
                  </button>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Image 
                  src="/images/escape.jpeg" 
                  alt="Couple on a boat enjoying a getaway" 
                  width={150} 
                  height={120}
                  className="rounded-md object-cover"
                />
              </div>
            </div>
        </div>
          </SignedOut>
          <SignedIn>
          <div className="grid grid-cols-1">
           

            <div className="bg-white border border-gray-300 rounded-md p-4 flex justify-between items-center shadow-sm">
              <div className="flex-grow pr-4">
                <h3 className="font-bold text-xl text-slate-800">Quick escape, quality time</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Save up to 20% with a Getaway Deal
                </p>
                <div className="mt-4">
                  <button className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm">
                    Save on stays
                  </button>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Image 
                  src="/images/escape.jpeg" 
                  alt="Couple on a boat enjoying a getaway" 
                  width={150} 
                  height={120}
                  className="rounded-md object-cover"
                />
              </div>
            </div>
        </div>
          </SignedIn>
      </div>
    </section>
  );
};

export default BookingOffers;