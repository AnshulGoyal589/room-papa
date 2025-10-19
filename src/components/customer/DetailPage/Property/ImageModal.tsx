
import { Image as PropertyImage } from '@/lib/mongodb/models/Components';
import { X } from 'lucide-react';
import { CldImage } from 'next-cloudinary';
import { useEffect, useState } from 'react';

export const ImageGalleryModal: React.FC<{ title: string; images: PropertyImage[]; onClose: () => void; }> = ({ title, images, onClose }) => {
  const [activeImage, setActiveImage] = useState<PropertyImage | null>(images?.[0] || null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center"><h2 className="text-xl font-bold text-gray-800">{title} - Photo Gallery</h2><button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200"><X size={24} /></button></div>
        <div className="flex-grow p-4 overflow-y-auto">
          {activeImage && (
            <div className="relative w-full aspect-[16/10] mb-4 rounded-md overflow-hidden bg-gray-200">
              <CldImage src={activeImage.publicId || activeImage.url} alt={activeImage.alt || `Image of ${title}`} layout="fill" objectFit="contain" />
            </div>
          )}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {images.map((image, index) => (
              <div key={image.publicId || index} className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${activeImage?.url === image.url ? 'border-[#003c95]' : 'border-transparent hover:border-[#003c95]'}`} onClick={() => setActiveImage(image)}>
                <CldImage src={image.publicId || image.url} alt={image.alt || `Thumbnail ${index + 1}`} layout="fill" objectFit="cover" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};