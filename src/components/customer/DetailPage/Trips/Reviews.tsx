import React from 'react';
import { formatDistanceToNow, subDays } from 'date-fns';
import { Review } from '@/lib/mongodb/models/Components';


const reviewComments = [
  "Absolutely incredible experience! The guides were knowledgeable and friendly.",
  "Really enjoyed this trip. Beautiful location and great activities.",
  "Amazing value for money. The itinerary was well-planned.",
  "The best vacation we've had in years! Our kids loved every minute of it.",
  "Breathtaking scenery and unforgettable experiences.",
  "Perfect combination of adventure and relaxation."
];

const guestNames = [
  "Alex", "Blake", "Casey", "Dana", 
  "Ellis", "Fran", "Gerry", "Harper"
];

const generateDummyReview = (): Review => {
  // Generate random date within the last 60 days
  const date = subDays(new Date(), Math.floor(Math.random() * 60));
  
  // Pick a random comment
  const comment = reviewComments[Math.floor(Math.random() * reviewComments.length)];
  
  // Generate weighted rating (mostly 4-5 stars)
  const rand = Math.random();
  const rating = rand < 0.6 ? 5 : rand < 0.9 ? 4 : 3;
  
  // Pick a random name
  const name = guestNames[Math.floor(Math.random() * guestNames.length)];
  
  return { comment, rating, name, date };
};

const renderRatingStars = (rating: number) => {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

const ReviewCard = ({ review }: { review: Review }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="bg-[#005A9C] rounded-full h-8 w-8 flex items-center justify-center mr-2">
            <span className="font-bold text-[#005A9C] text-sm">
              {review.name?.charAt(0)}
            </span>
          </div>
          <div>
            <div className="font-medium text-sm">{review.name}</div>
            <div className="text-xs text-gray-500">
              {formatDistanceToNow(review.date as Date, { addSuffix: true })}
            </div>
          </div>
        </div>
        <div>{renderRatingStars(review.rating)}</div>
      </div>
      <p className="text-gray-700 text-sm flex-grow">{review.comment}</p>
    </div>
  );
};

const HorizontalReviewCards = () => {
  const reviews = Array.from({ length: 4 }).map(() => generateDummyReview());
  
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold text-center mb-6">What Our Customers Say</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reviews.map((review, index) => (
          <ReviewCard key={index} review={review} />
        ))}
      </div>
    </div>
  );
};

export default HorizontalReviewCards;