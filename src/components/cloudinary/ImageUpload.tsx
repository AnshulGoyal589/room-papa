// components/ImageUpload.tsx
import React, { useState } from 'react';
import { CldImage } from 'next-cloudinary';
import { Button } from '@/components/ui/button';
import { Image } from '@/lib/mongodb/models/Components';

interface ImageUploadProps {
  label: string;
  onChange: (image: Image | null) => void;
  value: Image | null;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  label, 
  onChange, 
  value,
  className
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.includes('image')) {
      setError('The file must be an image');
      return;
    }
    
    try {
      setIsUploading(true);
      setError(null);
      
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
      
      onChange({
        url: data.secure_url,
        publicId: data.public_id,
        alt: file.name
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemove = () => {
    onChange(null);
  };
  
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2">
        {label}
      </label>
      
      {value ? (
        <div className="relative w-full rounded-md overflow-hidden">
          <CldImage
            src={value.publicId || ""}
            width={300}
            height={200}
            crop="fill"
            alt={value.alt || "Uploaded image"}
            className="w-full h-48 object-cover"
          />
          <Button 
            variant="destructive" 
            size="sm" 
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            Remove
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
          <input
            type="file"
            id={`upload-${label}`}
            className="hidden"
            onChange={handleUpload}
            accept="image/*"
          />
          <label
            htmlFor={`upload-${label}`}
            className="cursor-pointer text-[#003c95] hover:text-[#003c95]"
          >
            {isUploading ? (
              <p>Uploading...</p>
            ) : (
              <p>Click to upload {label}</p>
            )}
          </label>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;