import React, { useMemo, useState } from 'react'
import {Image as PropertyImage} from '@/lib/mongodb/models/Components';
import Image from 'next/image';
import {
    Wifi, Coffee as CoffeeIconLucide, Image as ImageIconLucide,
    Utensils,
    Award,
} from 'lucide-react';

interface ImageGalleryAndMapProps {
    bannerImage?: { url: string; alt?: string; publicId?: string };
    detailImages?: { url: string; alt?: string; publicId?: string }[];
    googleMaps?: string;
    title?: string;
    type?: string;
    amenities?: string[];
    funThingsToDo?: string[];
    meals?: string[];

}

const ImageGalleryAndMap = ({ bannerImage, detailImages , googleMaps, title , type , amenities , funThingsToDo , meals }: ImageGalleryAndMapProps) => {

    const [activeImage, setActiveImage] = useState<string | null>(null);

    const allImages = useMemo(() => {
        const images: PropertyImage[] = [];
        if (bannerImage?.url) images.push({ ...bannerImage, publicId: bannerImage.publicId || 'banner', url: bannerImage.url });
        detailImages?.forEach(img => {
            if (img.url && img.url !== bannerImage?.url) images.push({ ...img, publicId: img.publicId || img.url, url: img.url });
        });
        return images.filter(img => img.url).map(img => ({...img, alt: img.alt || 'Property image'}));
    }, [bannerImage, detailImages]);

    const mainGalleryImage = allImages[0];
    const sideGalleryImages = allImages.slice(1, 3);

    const handleImageClick = (imageUrl: string) => { setActiveImage(imageUrl); };

    const formatAmenityName = (amenity: string): string => {
        let name = amenity.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        if (name.toLowerCase() === 'wifi') return 'Wi-Fi';
        if (name.startsWith("Is ")) name = name.substring(3);
        if (name.startsWith("Has ")) name = name.substring(4);
        return name;
    };

    const renderPropertyHighlights = () => {
        const highlights = [];
        if (type) highlights.push({ icon: <Award className="text-[#003c95]" />, title: 'Property Type', text: [type] });
        const viewAmenity = amenities?.find(a => a.toLowerCase().includes('view') || a.toLowerCase().includes('balcony') || a.toLowerCase().includes('terrace'));
        if (viewAmenity) highlights.push({ icon: <ImageIconLucide className="text-[#003c95]" />, title: 'Featured Amenity', text: [formatAmenityName(viewAmenity)] });
        else if (funThingsToDo?.some(ft => ft.toLowerCase().includes('view'))) {
            highlights.push({ icon: <ImageIconLucide className="text-[#003c95]" />, title: 'Scenic Surroundings', text: ["Beautiful views often reported"] });
        }
        const mealTexts: string[] = [];
        const breakfastMeal = meals?.find(m => m.toLowerCase().includes('breakfast'));
        if (breakfastMeal) mealTexts.push(formatAmenityName(breakfastMeal));
        const lunchMeal = meals?.find(m => m.toLowerCase().includes('lunch'));
        if (lunchMeal) mealTexts.push(formatAmenityName(lunchMeal));
        const dinnerMeal = meals?.find(m => m.toLowerCase().includes('dinner'));
        if (dinnerMeal) mealTexts.push(formatAmenityName(dinnerMeal));
        if (mealTexts.length > 0) highlights.push({ icon: <CoffeeIconLucide className="text-[#003c95]" />, title: 'Meal Options', text: [mealTexts.join(', ')] });
        else if (amenities?.find(a => a.toLowerCase().includes('breakfast'))) highlights.push({ icon: <CoffeeIconLucide className="text-[#003c95]" />, title: 'Breakfast Available', text: ['Breakfast amenity offered'] });
        const kitchenAmenity = amenities?.find(a => a.toLowerCase().includes('kitchen'));
        if (kitchenAmenity) highlights.push({ icon: <Utensils className="text-[#003c95]" />, title: 'Kitchen Facilities', text: [formatAmenityName(kitchenAmenity)] });
        const wifiAmenity = amenities?.find(a => a.toLowerCase().includes('wifi') || a.toLowerCase().includes('internet'));
        if (wifiAmenity) highlights.push({ icon: <Wifi className="text-[#003c95]" />, title: 'Wi-Fi Available', text: [formatAmenityName(wifiAmenity)] });
        return (
            <div className="bg-white p-4 rounded-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Property highlights</h3>
                {highlights.length > 0 ? (
                    <div className="space-y-3">
                        {highlights.slice(0).map((item, index) => (
                            <div key={index} className="flex items-start">
                                <span className="mr-2 mt-0.5 shrink-0">{React.cloneElement(item.icon, { size: 20 })}</span>
                                <div><p className="text-sm font-semibold text-gray-700">{item.title}</p><p className="text-xs text-gray-500">{item.text.join(', ')}</p></div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-sm text-gray-500">No specific highlights available.</p>}
            </div>
        );
    };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-5">
        <div className="md:col-span-8">
            <div className="grid grid-cols-3 grid-rows-3 gap-1.5 h-[300px] md:h-[420px] rounded-lg overflow-hidden">
                {mainGalleryImage && (
                    <div className="col-span-2 row-span-3 relative cursor-pointer group" onClick={() => handleImageClick(mainGalleryImage.url)}>
                        <Image src={activeImage || mainGalleryImage.url} alt={mainGalleryImage.alt || title || 'Main property view'} layout="fill" objectFit="cover" priority className="transition-opacity hover:opacity-90" onError={(e) => e.currentTarget.src = '/images/placeholder-property.png'} />
                    </div>
                )}
                {!mainGalleryImage && <div className="col-span-2 row-span-3 bg-gray-200 flex items-center justify-center text-gray-500">No Image</div>}
                {sideGalleryImages.map((image, index) => (
                    <div key={`side-img-${index}`} className={`col-span-1 ${index === 0 ? 'row-span-2' : 'row-span-1'} relative cursor-pointer group`} onClick={() => handleImageClick(image.url)}>
                        <Image src={image.url} alt={image.alt || `Property view ${index + 2}`} layout="fill" objectFit="cover" sizes="25vw" className="transition-opacity hover:opacity-90" onError={(e) => e.currentTarget.src = '/images/placeholder-property.png'} />
                    </div>
                ))}
                {mainGalleryImage && sideGalleryImages.length < 1 && <div className="col-span-1 row-span-2 bg-gray-200"></div>}
                {mainGalleryImage && sideGalleryImages.length < 2 && <div className="col-span-1 row-span-1 bg-gray-200"></div>}
            </div>
            {allImages.length > 1 && (
                <div className="flex space-x-1.5 mt-1.5 overflow-x-auto pb-1">
                    {allImages.map((img, idx) => (
                        <div key={`thumb-${idx}`} className={`relative w-20 h-14 rounded-sm overflow-hidden cursor-pointer border-2 shrink-0 ${activeImage === img.url ? 'border-[#003c95]' : 'border-transparent hover:border-gray-400'}`} onClick={() => handleImageClick(img.url)}>
                            <Image src={img.url} alt={img.alt || `Thumbnail ${idx+1}`} layout="fill" objectFit="cover" />
                        </div>
                    ))}
                </div>
            )}
        </div>
        <div className="md:col-span-4 space-y-4">
            {googleMaps && (
                <div id="map-section" className="bg-white rounded-md h-48 md:h-56 overflow-hidden border border-gray-200 shadow-sm">
                    {googleMaps.startsWith('<iframe') ? (
                        <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: googleMaps.replace(/width=".*?"/, 'width="100%"').replace(/height=".*?"/, 'height="100%"')}} />
                    ) : (
                        <iframe title={`${title} location map`} src={googleMaps} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                    )}
                </div>
            )}
            {renderPropertyHighlights()}
        </div>
    </div>
  )
}

export default ImageGalleryAndMap