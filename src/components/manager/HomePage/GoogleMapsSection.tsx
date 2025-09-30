
import { useState } from 'react';
import { Star } from 'lucide-react';

interface Item {
  googleMaps?: string; // This should be the HTML string for the Google Maps iframe
  totalRating?: number; // From your commented-out code
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  review?: any[];      
}

interface GoogleMapsSectionProps {
  item: Item;
}

const GoogleMapsSection: React.FC<GoogleMapsSectionProps> = ({ item }) => {
  const [showMapPreview, setShowMapPreview] = useState(false);

  const hasGoogleMapsEmbed = !!item.googleMaps;

  const toggleMapPreview = () => {
    setShowMapPreview(prev => !prev);
  };

  return (
    <div> {/* Main container for this section */}
      <div className="flex items-center">
        <Star className="w-4 h-4 mr-2 text-gray-500 shrink-0" /> {/* Added shrink-0 */}
        <div>
          <p className="text-sm text-gray-500">Google Maps</p>

          {hasGoogleMapsEmbed ? (
            <button
              onClick={toggleMapPreview}
              className="text-sm text-[#003c95] hover:underline focus:outline-none py-1"
            >
              {showMapPreview ? 'Hide Map Preview' : 'Show Map Preview'}
            </button>
          ) : (
            <p className="text-sm text-gray-400">Location data not available.</p>
          )}
        </div>
      </div>

      {/* Conditionally render the Google Maps iframe preview */}
      {hasGoogleMapsEmbed && showMapPreview && (
        <div className="mt-4"> {/* Added margin-top for spacing */}

          <div className="text-gray-700 text-sm font-medium mb-2 text-center sm:text-left">
            Location
          </div>
          <div
            className="w-full sm:w-[35vw] max-w-full h-64 md:h-80 rounded-lg overflow-hidden border border-gray-200 shadow-sm"
            dangerouslySetInnerHTML={{ __html: item.googleMaps! }} // Non-null assertion because we checked hasGoogleMapsEmbed
          />
        </div>
      )}
    </div>
  );
};

export default GoogleMapsSection;

