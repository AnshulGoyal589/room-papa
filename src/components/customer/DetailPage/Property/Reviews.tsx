import { Review } from '@/lib/mongodb/models/Components';
import React, { useRef } from 'react';

interface ReviewsProps {
    reviews: Review[];
}

const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
    const { name = 'Anonymous', country, comment } = review;
    const initial = name.charAt(0).toUpperCase();

    const getCountryFlagSwitch = (countryName: string): string => {
    switch (countryName.toLowerCase()) {
        case 'eurozone':
            return '🇪🇺';
        case 'india':
            return '🇮🇳';
        case 'united states':
            return '🇺🇸';
        case 'united kingdom':
            return '🇬🇧';
        case 'japan':
            return '🇯🇵';
        case 'australia':
            return '🇦🇺';
        case 'canada':
            return '🇨🇦';
        case 'switzerland':
            return '🇨🇭';
        case 'china':
            return '🇨🇳';
        case 'sweden':
            return '🇸🇪';
        case 'new zealand':
            return '🇳🇿';
        case 'mexico':
            return '🇲🇽';
        case 'singapore':
            return '🇸🇬';
        case 'hong kong':
            return '🇭🇰';
        case 'norway':
            return '🇳🇴';
        case 'south korea':
            return '🇰🇷';
        case 'turkey':
            return '🇹🇷';
        case 'russia':
            return '🇷🇺';
        case 'brazil':
            return '🇧🇷';
        case 'south africa':
            return '🇿🇦';
        case 'united arab emirates':
            return '🇦🇪';
        case 'thailand':
            return '🇹🇭';
        case 'argentina':
            return '🇦🇷';
        case 'chile':
            return '🇨🇱';
        case 'colombia':
            return '🇨🇴';
        case 'egypt':
            return '🇪🇬';
        // Add your previous ones if needed
        case 'poland':
            return '🇵🇱';
        default:
            return '🏳️';
    }
};

    return (
        <div className="flex-shrink-0 w-full sm:w-[380px] p-6 border border-gray-200 rounded-xl space-y-4 bg-white">
            <header className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white text-xl font-bold">
                    {initial}
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">{name}</h3>
                    <p className="text-sm text-gray-600 flex items-center">
                        <span className="mr-2">{getCountryFlagSwitch(country ?? '')}</span>
                        {country}
                    </p>
                </div>
            </header>
            <p className="text-gray-700">&apos;{comment}&apos;</p>
            <a href="#" className="text-blue-600 font-medium hover:underline">
                Read more
            </a>
        </div>
    );
};



export const GuestReviews: React.FC<ReviewsProps> = ({ reviews }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
            scrollContainerRef.current.scrollBy({
                left: scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <section className="w-full  mx-auto py-4 sm:py-6 font-sans">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Guests who stayed here loved
            </h2>
            <div className="relative">
                <div
                    ref={scrollContainerRef}
                    className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide"
                >
                    {reviews.map((review, index) => (
                        <ReviewCard key={review.name ? `${review.name}-${index}` : index} review={review} />
                    ))}
                </div>

                {/* Arrow Button */}
                <button
                    onClick={handleScroll}
                    aria-label="Next reviews"
                    className="absolute top-1/2 -right-0 sm:-right-5 transform -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </section>
    );
};

