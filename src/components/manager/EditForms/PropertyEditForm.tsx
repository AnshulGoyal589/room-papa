import React, { useState, useEffect } from "react";
import { Property } from "@/lib/mongodb/models/Property"; // Assuming Review is part of Property model/type
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import ImageUpload from "@/components/cloudinary/ImageUpload";
import MultipleImageUpload from "@/components/cloudinary/MultipleImageUpload";
import { 
 
  RoomCategory as StoredRoomCategory, // This should be your updated type with detailed pricing and id
  RoomCategoryPricing, 
  PropertyType 
} from "@/types"; // Ensure these types are correctly defined and imported
import { 
  X, 
  Plus, 
  Edit, 
  Check, 
  AlertCircle, 
  Users, 
  Baby, 
  DollarSign, 
  Home, 
  MapPin, 
  BedDouble, 
  ListChecks, 
  // ShieldCheck,
  Image as ImageIcon,
  // MessageSquare
} from "lucide-react";

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Initial state for the form to add/edit a new room category
const initialNewCategoryState = {
  id: '', // Will be set when editing
  title: "",
  qty: 1,
  currency: "USD", // Default, can be updated
  pricing: {
    singleOccupancyAdultPrice: 0,
    discountedSingleOccupancyAdultPrice: 0, // Use 0 or undefined for no discount
    doubleOccupancyAdultPrice: 0,
    discountedDoubleOccupancyAdultPrice: 0,
    tripleOccupancyAdultPrice: 0,
    discountedTripleOccupancyAdultPrice: 0,
    child5to12Price: 0,
    discountedChild5to12Price: 0,
    child12to18Price: 0,
    discountedChild12to18Price: 0,
  }
};

interface PropertyEditFormProps {
  item: Property; // This item should conform to the Property type with StoredRoomCategory[]
  onSave: (updatedProperty: Property) => void;
}

const PropertyEditForm: React.FC<PropertyEditFormProps> = ({ item, onSave }) => {
  const [formData, setFormData] = useState<Property>(item);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [newCategory, setNewCategory] = useState<{
    id?: string;
    title: string;
    qty: number;
    currency: string;
    pricing: RoomCategoryPricing;
  }>({
    ...initialNewCategoryState,
    currency: item.costing?.currency || "USD"
  });
  
  const [isEditMode, setIsEditMode] = useState(false); 
  
  // Define options for various property features
  // const amenitiesOptions = ["wifi", "pool", "gym", "spa", "restaurant", "parking", "airConditioning", "breakfastIncluded", "petFriendly", "roomService", "barLounge", "laundryService"];
  const accessibilityOptions = ['Wheelchair Accessible', 'Elevator', 'Accessible Parking', 'Braille Signage', 'Accessible Bathroom', 'Roll-in Shower'];
  const roomAccessibilityOptionsList = ['Grab Bars', 'Lowered Amenities', 'Visual Alarms', 'Wide Doorways', 'Accessible Shower'];
  const popularFiltersOptions = ['Pet Friendly', 'Free Cancellation', 'Free Breakfast', 'Pool', 'Hot Tub', 'Ocean View', 'Family Friendly', 'Business Facilities'];
  const funThingsToDoOptions = ['Beach', 'Hiking', 'Shopping', 'Nightlife', 'Local Tours', 'Museums', 'Theme Parks', 'Water Sports'];
  const mealsOptionsList = ['Breakfast', 'Lunch', 'Dinner', 'All-Inclusive', 'Buffet', 'À la carte', 'Room Service', 'Special Diets'];
  const facilitiesOptionsList = ['Parking', 'WiFi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Bar', 'Spa', 'Conference Room'];
  const bedPreferenceOptionsList = ['King', 'Queen', 'Twin', 'Double', 'Single', 'Sofa Bed', 'Bunk Bed'];
  const reservationPolicyOptionsList =  ['Free Cancellation', 'Flexible', 'Moderate', 'Strict', 'Non-Refundable', 'Pay at Property', 'Pay Now'];
  const brandsOptionsList =  ['Hilton', 'Marriott', 'Hyatt', 'Best Western', 'Accor', 'IHG', 'Wyndham', 'Choice Hotels'];
  const roomFacilitiesOptionsList = ['Air Conditioning', 'TV', 'Mini Bar', 'Coffee Maker', 'Safe', 'Desk', 'Balcony', 'Bathtub', 'Shower'];


  useEffect(() => {
    // Deep clone item to prevent direct mutation if item is complex
    const clonedItem = JSON.parse(JSON.stringify(item));
    setFormData(clonedItem);
    if (!isEditMode) {
        setNewCategory(prev => ({ ...prev, currency: clonedItem.costing?.currency || "USD" }));
    }
  }, [item, isEditMode]);

  useEffect(() => {
    if (formData.categoryRooms && formData.categoryRooms.length > 0) {
      let minOverallPrice = Infinity;
      let minOverallDiscountedPrice = Infinity;
      let leadCurrency = formData.categoryRooms[0].currency || "USD";

      formData.categoryRooms.forEach(cat => {
        const prices: number[] = [];
        const discountedPrices: number[] = [];

        prices.push(cat.pricing.singleOccupancyAdultPrice);
        discountedPrices.push(cat.pricing.discountedSingleOccupancyAdultPrice && cat.pricing.discountedSingleOccupancyAdultPrice > 0 ? cat.pricing.discountedSingleOccupancyAdultPrice : cat.pricing.singleOccupancyAdultPrice);

        if (cat.pricing.doubleOccupancyAdultPrice > 0) {
          prices.push(cat.pricing.doubleOccupancyAdultPrice / 2);
          discountedPrices.push(cat.pricing.discountedDoubleOccupancyAdultPrice && cat.pricing.discountedDoubleOccupancyAdultPrice > 0 ? cat.pricing.discountedDoubleOccupancyAdultPrice / 2 : cat.pricing.doubleOccupancyAdultPrice / 2);
        }
        
        if (cat.pricing.tripleOccupancyAdultPrice > 0) {
          prices.push(cat.pricing.tripleOccupancyAdultPrice / 3);
          discountedPrices.push(cat.pricing.discountedTripleOccupancyAdultPrice && cat.pricing.discountedTripleOccupancyAdultPrice > 0 ? cat.pricing.discountedTripleOccupancyAdultPrice / 3 : cat.pricing.tripleOccupancyAdultPrice / 3);
        }
        
        const currentCatMinPrice = Math.min(...prices.filter(p => p > 0 && isFinite(p)));
        const currentCatMinDiscountedPrice = Math.min(...discountedPrices.filter(p => p > 0 && isFinite(p)));

        if (currentCatMinPrice < minOverallPrice) {
          minOverallPrice = currentCatMinPrice;
          leadCurrency = cat.currency;
        }
        if (currentCatMinDiscountedPrice < minOverallDiscountedPrice) {
          minOverallDiscountedPrice = currentCatMinDiscountedPrice;
        }
      });
      
      const totalRooms = formData.categoryRooms.reduce((sum, category) => sum + (category.qty || 0), 0);
      
      // Use functional update to avoid stale closures if other effects modify formData
      setFormData(prev => ({
        ...prev,
        costing: {
          price: minOverallPrice === Infinity ? 0 : parseFloat(minOverallPrice.toFixed(2)),
          discountedPrice: minOverallDiscountedPrice === Infinity ? 0 : parseFloat(minOverallDiscountedPrice.toFixed(2)),
          currency: leadCurrency
        },
        rooms: totalRooms
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        costing: { price: 0, discountedPrice: 0, currency: prev.costing?.currency || 'USD' },
        rooms: 0
      }));
    }
  }, [formData.categoryRooms]); // Only re-run if categoryRooms changes

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => {
      const keys = field.split(".");
      const updated = JSON.parse(JSON.stringify(prev)) as Property; // Deep copy
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current: any = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = keys[i + 1].match(/^\d+$/) ? [] : {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };
  
  const handleNewCategoryFieldChange = (field: keyof Omit<typeof newCategory, 'pricing' | 'id'>, value: string | number) => {
    setNewCategory(prev => ({ ...prev, [field]: value }));
  };

  const handleNewCategoryPricingChange = (field: keyof RoomCategoryPricing, value: string | number) => {
    const numericValue = Number(value);
    setNewCategory(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [field]: numericValue < 0 ? 0 : numericValue
      }
    }));
  };

  const handleAddOrUpdateCategory = () => {
    if (!newCategory.title.trim()) { alert('Category title is required.'); return; }
    if (newCategory.qty <= 0) { alert('Quantity must be greater than 0.'); return; }
    if (newCategory.pricing.singleOccupancyAdultPrice <= 0 && newCategory.pricing.doubleOccupancyAdultPrice <= 0 && newCategory.pricing.tripleOccupancyAdultPrice <=0) { 
        alert('At least one adult occupancy price must be greater than 0.'); return; 
    }
    // Example discount validation
    if (newCategory.pricing.discountedSingleOccupancyAdultPrice && newCategory.pricing.discountedSingleOccupancyAdultPrice > newCategory.pricing.singleOccupancyAdultPrice) {
        alert('Discounted price for 1 Adult cannot be greater than regular price.'); return;
    } // Add more for other occupancies and children

    const categoryData: StoredRoomCategory = {
      id: isEditMode && newCategory.id ? newCategory.id : generateId(),
      title: newCategory.title,
      qty: newCategory.qty,
      currency: newCategory.currency,
      pricing: { ...newCategory.pricing }
    };

    if (isEditMode && newCategory.id) {
      setFormData(prev => ({
        ...prev,
        categoryRooms: (prev.categoryRooms || []).map(cat => cat.id === newCategory.id ? categoryData : cat)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        categoryRooms: [...(prev.categoryRooms || []), categoryData]
      }));
    }
    handleCancelEditCategory();
  };

  const handleEditCategory = (category: StoredRoomCategory) => {
    // Deep copy category to avoid mutating the one in formData directly
    const categoryToEdit = JSON.parse(JSON.stringify(category));
    setNewCategory({ ...categoryToEdit }); 
    setIsEditMode(true);
  };

  const handleCancelEditCategory = () => {
    setNewCategory({
        ...initialNewCategoryState,
        currency: formData.costing?.currency || "USD"
    });
    setIsEditMode(false);
  };

  const handleRemoveCategory = (id: string) => {
    if (isEditMode && newCategory.id === id) {
      handleCancelEditCategory();
    }
    setFormData(prev => ({
      ...prev,
      categoryRooms: prev.categoryRooms?.filter(cat => cat.id !== id)
    }));
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title?.trim()) newErrors.title = "Title is required";
    if (!formData.description?.trim()) newErrors.description = "Description is required";
    if (!formData.type) newErrors.type = "Property type is required";
    if (!formData.location?.address?.trim()) newErrors.address = "Address is required";
    if (!formData.location?.city?.trim()) newErrors.city = "City is required";
    if (!formData.location?.state?.trim()) newErrors.state = "State/Province is required";
    if (!formData.location?.country?.trim()) newErrors.country = "Country is required";
    if (!formData.categoryRooms || formData.categoryRooms.length === 0) {
      newErrors.categoryRooms = "At least one room category is required.";
    } else {
        const invalidCategory = formData.categoryRooms.some(cat => 
            cat.pricing.singleOccupancyAdultPrice <= 0 && 
            cat.pricing.doubleOccupancyAdultPrice <= 0 && 
            cat.pricing.tripleOccupancyAdultPrice <= 0
        );
        if (invalidCategory) {
            newErrors.categoryRooms = "One or more room categories has no valid adult pricing.";
        }
    }
    if (!formData.bannerImage?.url) newErrors.bannerImage = "Banner image is required";
    if (!formData.detailImages || formData.detailImages.length < 3 || formData.detailImages.some(img => !img.url)) {
      newErrors.detailImages = "At least 3 detail images are required";
    }
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        newErrors.endDate = "End date cannot be before start date.";
    }
    if (!formData.amenities || formData.amenities.length === 0) newErrors.amenities = "At least one amenity must be selected";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData); // formData is already up-to-date due to useEffect
    } else {
        alert("Please correct the errors in the form.");
    }
  };

  const CheckboxGroup: React.FC<{ 
    options: string[], 
    value: string[], 
    onChange: (field: string, value: string[]) => void, 
    label: string,
    fieldName: string
  }> = ({ options, value = [], onChange, label, fieldName }) => (
    <div className="mb-4">
      <label className="block mb-1.5 font-medium text-gray-700">{label}</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <input type="checkbox" id={`${fieldName}-${option.replace(/\s+/g, '-')}`} checked={value.includes(option)}
              onChange={(e) => {
                const newValues = e.target.checked ? [...value, option] : value.filter((item) => item !== option);
                onChange(fieldName, newValues);
              }} className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"/>
            <label htmlFor={`${fieldName}-${option.replace(/\s+/g, '-')}`} className="text-sm text-gray-600 capitalize cursor-pointer">
              {option.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-6 bg-white shadow-xl rounded-lg">
      {/* Section: Basic Information */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><Home className="mr-3 h-6 w-6 text-primary"/>Basic Information</h2>
        <div>
          <label className="font-medium text-gray-700">Title</label>
          <Input value={formData.title || ''} onChange={(e) => handleChange("title", e.target.value)} placeholder="Property Title" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>
        <div>
          <label className="font-medium text-gray-700">Description</label>
          <Textarea value={formData.description || ''} onChange={(e) => handleChange("description", e.target.value)} placeholder="Detailed description of the property" rows={5} />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>
        <div>
          <label className="font-medium text-gray-700">Property Type</label>
          <Select value={formData.type || ''} onValueChange={(value) => handleChange("type", value as PropertyType)}>
            <SelectTrigger><SelectValue placeholder="Select property type" /></SelectTrigger>
            <SelectContent>{['Hotel', 'Apartment', 'Villa', 'Hostel', 'Resort'].map(type => <SelectItem key={type} value={type.toLowerCase() as PropertyType}>{type}</SelectItem>)}</SelectContent>
          </Select>
          {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
        </div>
      </div>

      {/* Section: Location */}
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><MapPin className="mr-3 h-6 w-6 text-primary"/>Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <label className="font-medium text-gray-700">Address</label>
            <Input value={formData.location?.address || ''} onChange={(e) => handleChange("location.address", e.target.value)} placeholder="Full Address" />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>
            <div>
            <label className="font-medium text-gray-700">City</label>
            <Input value={formData.location?.city || ''} onChange={(e) => handleChange("location.city", e.target.value)} placeholder="City" />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>
            <div>
            <label className="font-medium text-gray-700">State/Province</label>
            <Input value={formData.location?.state || ''} onChange={(e) => handleChange("location.state", e.target.value)} placeholder="State or Province" />
            {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
            </div>
            <div>
            <label className="font-medium text-gray-700">Country</label>
            <Input value={formData.location?.country || ''} onChange={(e) => handleChange("location.country", e.target.value)} placeholder="Country" />
            {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
            </div>
        </div>
      </div>
      
      {/* Section: Property Pricing & Room Overview (Read-only) */}
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><DollarSign className="mr-3 h-6 w-6 text-primary"/>Property Pricing & Room Overview</h2>
         <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2 mb-3">
            <AlertCircle size={20} className="text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-700">
                The following values are automatically calculated based on your room categories. Ensure each category has valid pricing.
            </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Starting Price (per adult)</label>
                <Input value={`${formData.costing?.currency || 'N/A'} ${formData.costing?.price.toLocaleString() || '0'}`} disabled className="bg-gray-100 font-bold text-gray-800 mt-1" />
            </div>
            {(formData.costing?.discountedPrice ?? 0) > 0 && formData.costing.discountedPrice < formData.costing.price && (
                <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Discounted Start Price</label>
                <Input value={`${formData.costing.currency} ${formData.costing.discountedPrice.toLocaleString()}`} disabled className="bg-gray-100 font-bold text-green-600 mt-1" />
                </div>
            )}
            <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Rooms</label>
                <Input value={formData.rooms || 0} type="number" disabled className="bg-gray-100 font-bold text-gray-800 mt-1" />
            </div>
            </div>
        </div>
      </div>

      {/* Section: Property Details */}
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3">Other Property Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="font-medium text-gray-700">Property Rating (Stars)</label>
                <Input type="number" value={formData.propertyRating || 0} onChange={(e) => handleChange("propertyRating", parseFloat(e.target.value) || 0)} min={0} max={5} step={0.5} />
            </div>
            <div>
                <label className="font-medium text-gray-700">Google Maps Link (Optional)</label>
                <Input value={formData.googleMaps || ""} onChange={(e) => handleChange("googleMaps", e.target.value || "")} placeholder="https://maps.app.goo.gl/..." />
            </div>
            <div>
                <label className="font-medium text-gray-700">Availability Start Date</label>
                <Input type="date" value={formData.startDate || ''} onChange={(e) => handleChange("startDate", e.target.value)} />
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>
            <div>
                <label className="font-medium text-gray-700">Availability End Date</label>
                <Input type="date" value={formData.endDate || ''} onChange={(e) => handleChange("endDate", e.target.value)} />
                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
            </div>
        </div>
      </div>

      {/* Section: Room Categories */}
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><BedDouble className="mr-3 h-6 w-6 text-primary"/>Manage Room Categories</h2>
        {errors.categoryRooms && <div className="my-2 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">{errors.categoryRooms}</div>}
        
        {(formData.categoryRooms || []).length > 0 && (
          <div className="mb-6 space-y-4">
            <h3 className="text-xl font-medium text-gray-700">Current Room Categories:</h3>
            {(formData.categoryRooms || []).map((cat) => (
              <div key={cat.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-800 text-xl">{cat.title} <span className="text-base text-gray-500 font-normal">({cat.qty} rooms)</span></p>
                    <p className="text-sm text-gray-500">Currency: {cat.currency}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon" type="button" onClick={() => handleEditCategory(cat)} disabled={isEditMode && newCategory.id === cat.id} aria-label={`Edit ${cat.title}`}>
                      <Edit size={18} />
                    </Button>
                    <Button variant="destructive" size="icon" type="button" onClick={() => handleRemoveCategory(cat.id)} aria-label={`Remove ${cat.title}`}>
                      <X size={18} />
                    </Button>
                  </div>
                </div>
                 <div className="space-y-3 text-sm text-gray-600">
                  <div>
                    <p className="font-semibold text-gray-700 flex items-center"><Users className="inline h-4 w-4 mr-1.5"/>Adult Pricing (Total Room Price):</p>
                    <ul className="list-disc list-inside pl-6 mt-1 space-y-0.5">
                      <li>1 Adult: {cat.currency} {cat.pricing.singleOccupancyAdultPrice.toLocaleString()}
                          {cat.pricing.discountedSingleOccupancyAdultPrice && cat.pricing.discountedSingleOccupancyAdultPrice > 0 && cat.pricing.discountedSingleOccupancyAdultPrice < cat.pricing.singleOccupancyAdultPrice ? <span className="text-green-600 font-medium"> (Disc: {cat.pricing.discountedSingleOccupancyAdultPrice.toLocaleString()})</span> : ''}
                      </li>
                      <li>2 Adults: {cat.currency} {cat.pricing.doubleOccupancyAdultPrice.toLocaleString()}
                          {cat.pricing.discountedDoubleOccupancyAdultPrice && cat.pricing.discountedDoubleOccupancyAdultPrice > 0 && cat.pricing.discountedDoubleOccupancyAdultPrice < cat.pricing.doubleOccupancyAdultPrice ? <span className="text-green-600 font-medium"> (Disc: {cat.pricing.discountedDoubleOccupancyAdultPrice.toLocaleString()})</span> : ''}
                      </li>
                      <li>3 Adults: {cat.currency} {cat.pricing.tripleOccupancyAdultPrice.toLocaleString()}
                          {cat.pricing.discountedTripleOccupancyAdultPrice && cat.pricing.discountedTripleOccupancyAdultPrice > 0 && cat.pricing.discountedTripleOccupancyAdultPrice < cat.pricing.tripleOccupancyAdultPrice ? <span className="text-green-600 font-medium"> (Disc: {cat.pricing.discountedTripleOccupancyAdultPrice.toLocaleString()})</span> : ''}
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 flex items-center mt-2"><Baby className="inline h-4 w-4 mr-1.5"/>Child Pricing (Per Child, Sharing):</p>
                    <ul className="list-disc list-inside pl-6 mt-1 space-y-0.5">
                      <li>5-12 yrs: {cat.currency} {cat.pricing.child5to12Price.toLocaleString()}
                           {cat.pricing.discountedChild5to12Price && cat.pricing.discountedChild5to12Price > 0 && cat.pricing.discountedChild5to12Price < cat.pricing.child5to12Price ? <span className="text-green-600 font-medium"> (Disc: {cat.pricing.discountedChild5to12Price.toLocaleString()})</span> : ''}
                      </li>
                      <li>12-18 yrs: {cat.currency} {cat.pricing.child12to18Price.toLocaleString()}
                          {cat.pricing.discountedChild12to18Price && cat.pricing.discountedChild12to18Price > 0 && cat.pricing.discountedChild12to18Price < cat.pricing.child12to18Price ? <span className="text-green-600 font-medium"> (Disc: {cat.pricing.discountedChild12to18Price.toLocaleString()})</span> : ''}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg space-y-6 shadow">
          <h3 className="text-xl font-semibold text-gray-700">{isEditMode ? `Editing: ${newCategory.title || 'Category Details'}` : "Add New Room Category"}</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="font-medium text-gray-700">Category Title</label>
              <Input value={newCategory.title} onChange={(e) => handleNewCategoryFieldChange('title', e.target.value)} placeholder="e.g., Deluxe Double Room" />
            </div>
            <div>
              <label className="font-medium text-gray-700">Quantity (No. of these rooms)</label>
              <Input type="number" value={newCategory.qty} onChange={(e) => handleNewCategoryFieldChange('qty', Number(e.target.value))} min={1} />
            </div>
            <div>
              <label className="font-medium text-gray-700">Currency for this Category</label>
              <Select value={newCategory.currency} onValueChange={(value) => handleNewCategoryFieldChange('currency', value)}>
                <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
                <SelectContent>{['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-300">
            <label className="text-lg font-semibold text-gray-700 mb-3 block flex items-center"><Users className="inline h-5 w-5 mr-2"/>Adult Pricing (Total Room Price)</label>
            {[
              { occupancy: 1, base: 'singleOccupancyAdultPrice', disc: 'discountedSingleOccupancyAdultPrice', label: '1 Adult' },
              { occupancy: 2, base: 'doubleOccupancyAdultPrice', disc: 'discountedDoubleOccupancyAdultPrice', label: '2 Adults' },
              { occupancy: 3, base: 'tripleOccupancyAdultPrice', disc: 'discountedTripleOccupancyAdultPrice', label: '3 Adults' },
            ].map(p => (
              <div key={p.occupancy} className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mb-4 items-end">
                <div>
                  <label className="text-sm font-medium text-gray-600">{p.label} - Base Price</label>
                  <Input type="number" value={newCategory.pricing[p.base as keyof RoomCategoryPricing]} onChange={(e) => handleNewCategoryPricingChange(p.base as keyof RoomCategoryPricing, e.target.value)} placeholder="0.00" min="0" step="0.01" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">{p.label} - Discounted Price (Optional)</label>
                  <Input type="number" value={newCategory.pricing[p.disc as keyof RoomCategoryPricing] || ''} onChange={(e) => handleNewCategoryPricingChange(p.disc as keyof RoomCategoryPricing, e.target.value)} placeholder="0.00 (if any)" min="0" step="0.01" />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-300">
            <label className="text-lg font-semibold text-gray-700 mb-3 block flex items-center"><Baby className="inline h-5 w-5 mr-2"/>Child Pricing (Per Child, when sharing)</label>
            <p className="text-xs text-gray-500 mb-3">Note: Max 3 occupants (adults + paying children) per room. Children below 5 are usually free if not taking an extra bed.</p>
            {[
              { age: '5-12 yrs', base: 'child5to12Price', disc: 'discountedChild5to12Price' },
              { age: '12-18 yrs', base: 'child12to18Price', disc: 'discountedChild12to18Price' },
            ].map(p => (
              <div key={p.age} className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mb-4 items-end">
                <div>
                  <label className="text-sm font-medium text-gray-600">Child ({p.age}) - Base Price</label>
                  <Input type="number" value={newCategory.pricing[p.base as keyof RoomCategoryPricing]} onChange={(e) => handleNewCategoryPricingChange(p.base as keyof RoomCategoryPricing, e.target.value)} placeholder="0.00" min="0" step="0.01" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Child ({p.age}) - Discounted Price (Optional)</label>
                  <Input type="number" value={newCategory.pricing[p.disc as keyof RoomCategoryPricing] || ''} onChange={(e) => handleNewCategoryPricingChange(p.disc as keyof RoomCategoryPricing, e.target.value)} placeholder="0.00 (if any)" min="0" step="0.01" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
            <Button type="button" onClick={handleAddOrUpdateCategory} className="flex-1 py-2.5">
              {isEditMode ? <><Check size={18} className="mr-2" /> Update Category</> : <><Plus size={18} className="mr-2" /> Add This Category</>}
            </Button>
            {isEditMode && (
              <Button type="button" variant="outline" onClick={handleCancelEditCategory} className="flex-1 py-2.5">
                <X size={18} className="mr-2" /> Cancel Edit
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Section: Property Features & Policies */}
      <div className="pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><ListChecks className="mr-3 h-6 w-6 text-primary"/>Property Features & Policies</h2>
        {/* <CheckboxGroup options={amenitiesOptions} value={formData.amenities || []} onChange={handleChange} label="Amenities" fieldName="amenities" /> */}
        {/* {errors.amenities && <p className="text-red-500 text-xs mt-1 block mb-4">{errors.amenities}</p>} */}
        <CheckboxGroup options={accessibilityOptions} value={formData.accessibility || []} onChange={handleChange} label="Property Accessibility" fieldName="accessibility" />
        <CheckboxGroup options={roomAccessibilityOptionsList} value={formData.roomAccessibility || []} onChange={handleChange} label="Room Accessibility" fieldName="roomAccessibility" />
        <CheckboxGroup options={popularFiltersOptions} value={formData.popularFilters || []} onChange={handleChange} label="Popular Filters" fieldName="popularFilters" />
        <CheckboxGroup options={funThingsToDoOptions} value={formData.funThingsToDo || []} onChange={handleChange} label="Fun Things To Do" fieldName="funThingsToDo" />
        <CheckboxGroup options={mealsOptionsList} value={formData.meals || []} onChange={handleChange} label="Meals" fieldName="meals" />
        <CheckboxGroup options={facilitiesOptionsList} value={formData.facilities || []} onChange={handleChange} label="Facilities" fieldName="facilities" />
        <CheckboxGroup options={bedPreferenceOptionsList} value={formData.bedPreference || []} onChange={handleChange} label="Bed Preferences" fieldName="bedPreference" />
        <CheckboxGroup options={reservationPolicyOptionsList} value={formData.reservationPolicy || []} onChange={handleChange} label="Reservation Policies" fieldName="reservationPolicy" />
        <CheckboxGroup options={brandsOptionsList} value={formData.brands || []} onChange={handleChange} label="Brands" fieldName="brands" />
        <CheckboxGroup options={roomFacilitiesOptionsList} value={formData.roomFacilities || []} onChange={handleChange} label="Room Facilities" fieldName="roomFacilities" />
      </div>

      {/* Section: Images */}
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><ImageIcon className="mr-3 h-6 w-6 text-primary"/>Images</h2>
        <div>
          <label className="font-medium text-gray-700">Banner Image</label>
          <ImageUpload label='banner image' value={formData.bannerImage || null} onChange={(image) => handleChange("bannerImage", image)} />
          {errors.bannerImage && <p className="text-red-500 text-xs mt-1">{errors.bannerImage}</p>}
        </div>
        <div>
          <label className="font-medium text-gray-700">Detail Images (minimum 3)</label>
          <MultipleImageUpload 
            label='detail images' 
            key={formData.detailImages?.map(img => img?.publicId || '').join(',') || 'empty-details'} // More robust key
            value={formData.detailImages || []} 
            onChange={(images) => handleChange("detailImages", images)} 
            maxImages={10} 
          />
          {errors.detailImages && <p className="text-red-500 text-xs mt-1">{errors.detailImages}</p>}
        </div>
      </div>

      {/* Section: Reviews (Basic Editing/Display) */}
      {/* {formData.review && formData.review.length > 0 && (
        <div className="space-y-4 pt-6 border-t">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 flex items-center"><MessageSquare className="mr-3 h-6 w-6 text-primary"/>Reviews</h2>
          {formData.review.map((review, index) => (
            <div key={review._id || index} className="border p-4 rounded-lg bg-gray-50 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-500"><strong>User:</strong> {review.userId?.toString().slice(-6) || 'Anonymous User'}</p>
                <p className="text-sm text-gray-500"><strong>Rating:</strong> <span className="font-semibold text-amber-500">{review.rating}/5</span></p>
              </div>
              <div>
                <label className="font-medium text-sm text-gray-700">Comment:</label>
                <Textarea
                  value={review.comment}
                  onChange={(e) => handleChange(`review.${index}.comment`, e.target.value)}
                  placeholder="Review comment"
                  rows={2}
                  className="text-sm mt-1"
                />
              </div>
            </div>
          ))}
        </div>
      )} */}

      <Button type="submit" className="w-full py-3 text-lg font-semibold mt-8">
        <Check className="mr-2 h-5 w-5"/> Save Property Changes
      </Button>
    </form>
  );
};

export default PropertyEditForm;