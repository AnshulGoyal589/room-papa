// components/MultipleImageUpload.tsx
import React, { useState } from 'react';
import { CldImage } from 'next-cloudinary';
import { Button } from '@/components/ui/button';
import { Image } from '@/lib/mongodb/models/Components';

interface MultipleImageUploadProps {
  label: string;
  onChange: (images: Image[]) => void;
  value: Image[];
  maxImages?: number;
  minImages?: number;
  className?: string;
}

const MultipleImageUpload: React.FC<MultipleImageUploadProps> = ({ 
  label, 
  onChange, 
  value = [],
  maxImages = 5,
  minImages = 0,
  className
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (value.length + files.length > maxImages) {
      setError(`You can only upload a maximum of ${maxImages} images. Currently ${value.length}.`);
      return;
    }
    
    try {
      setIsUploading(true);
      setError(null);
      
      const uploadedImages: Image[] = [...value];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.includes('image')) {
          continue;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        const data = await response.json();
        
        uploadedImages.push({
          url: data.secure_url,
          publicId: data.public_id,
          alt: file.name
        });
      }
      
      onChange(uploadedImages);
    } catch (error) {
      console.error('Error uploading images:', error);
      setError('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemove = (index: number) => {
    const newImages = [...value];
    newImages.splice(index, 1);
    onChange(newImages);
  };
  
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2">
        {label} {minImages > 0 && `(Min: ${minImages})`} {maxImages > 0 && `(Max: ${maxImages})`}
      </label>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {value.map((image, index) => (
          <div key={image.publicId || `${image.url}-${index}`} className="relative rounded-md overflow-hidden">
            <CldImage
              src={image.publicId || image.url}
              width={150}
              height={100}
              crop="fill"
              alt={image.alt || `Image ${index + 1}`}
              className="w-full h-24 object-cover"
            />
            <Button 
              variant="destructive" 
              size="sm" 
              className="absolute top-1 right-1 w-6 h-6 p-0"
              onClick={() => handleRemove(index)}
            >
              ×
            </Button>
          </div>
        ))}
      </div>
      
      {value.length < maxImages && (
        <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
          <input
            type="file"
            id={`upload-${label}`}
            className="hidden"
            onChange={handleUpload}
            accept="image/*"
            multiple
          />
          <label
            htmlFor={`upload-${label}`}
            className="cursor-pointer text-[#001d2c] hover:text-[#001d2c]"
          >
            {isUploading ? (
              <p>Uploading...</p>
            ) : (
              <p>Click to upload {label} ({value.length}/{maxImages})</p>
            )}
          </label>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
          {minImages > 0 && value.length < minImages && (
            <p className="text-amber-500 mt-2 text-sm">
              Please upload at least {minImages} images (currently {value.length})
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MultipleImageUpload;