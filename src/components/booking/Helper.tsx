import { CheckCircle, StarIcon } from "lucide-react";

export const renderRatingStars = (rating: number) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <StarIcon key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
        ))}
    </div>
);

export const Stepper = () => (
    <div className="flex items-center justify-between max-w-lg mx-auto mb-6">
        <div className="flex items-center text-[#003c95]">
            <CheckCircle className="w-6 h-6 mr-2" />
            <span className="font-semibold">Your Selection</span>
        </div>
        <div className="flex-1 border-t-2 border-gray-300 mx-4"></div>
        <div className="flex items-center text-[#003c95] font-bold">
            <span className="flex items-center justify-center w-6 h-6 mr-2 border-2 border-[#003c95] rounded-full text-sm">2</span>
            <span>Your Details</span>
        </div>
        <div className="flex-1 border-t-2 border-gray-300 mx-4"></div>
        <div className="flex items-center text-gray-400">
            <span className="flex items-center justify-center w-6 h-6 mr-2 border-2 border-gray-400 rounded-full text-sm">3</span>
            <span>Finish booking</span>
        </div>
    </div>
);
