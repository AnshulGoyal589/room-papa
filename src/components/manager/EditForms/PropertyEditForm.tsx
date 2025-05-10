import React, { useState, useEffect } from "react";
import { Property } from "@/lib/mongodb/models/Property";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import ImageUpload from "@/components/cloudinary/ImageUpload";
import MultipleImageUpload from "@/components/cloudinary/MultipleImageUpload";
import { PropertyAmenities, RoomCategory } from "@/types";
import { X, Plus, Edit, Check, AlertCircle } from "lucide-react"; // Added more icons

interface PropertyEditFormProps {
  item: Property;
  onSave: (updatedProperty: Property) => void;
}

const PropertyEditForm: React.FC<PropertyEditFormProps> = ({ item, onSave }) => {
  // Initialize the form data from the item prop
  const [formData, setFormData] = useState<Property>(item);
  const [errors, setErrors] = useState<Record<string, string>>({});

  console.log("Item: ",item);
  
  // Initialize new category state for room categories
  const [newCategory, setNewCategory] = useState<RoomCategory>({
    title: "",
    qty: 1,
    price: 0,
    discountedPrice: 0,
    currency: item.costing?.currency || "INR"
  });
  
  // State to track if we're editing an existing category
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Define options for various property features
  const amenities: PropertyAmenities[] = ["wifi", "pool", "gym", "spa", "restaurant", "parking", "airConditioning", "breakfast"];
  
  const accessibility = ['Wheelchair Accessible', 'Elevator', 'Accessible Parking', 'Braille Signage', 'Accessible Bathroom', 'Roll-in Shower'];
  const roomAccessibilityOptions = ['Grab Bars', 'Lowered Amenities', 'Visual Alarms', 'Wide Doorways', 'Accessible Shower'];
  const popularFilters = ['Pet Friendly', 'Free Cancellation', 'Free Breakfast', 'Pool', 'Hot Tub', 'Ocean View', 'Family Friendly', 'Business Facilities'];
  const funThingsToDo = ['Beach', 'Hiking', 'Shopping', 'Nightlife', 'Local Tours', 'Museums', 'Theme Parks', 'Water Sports'];
  const mealsOptions = ['Breakfast', 'Lunch', 'Dinner', 'All-Inclusive', 'Buffet', 'À la carte', 'Room Service', 'Special Diets'];
  const facilitiesOptions = ['Parking', 'WiFi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Bar', 'Spa', 'Conference Room'];
  const bedPreferenceOptions = ['King', 'Queen', 'Twin', 'Double', 'Single', 'Sofa Bed', 'Bunk Bed'];
  const reservationPolicyOptions =  ['Free Cancellation', 'Flexible', 'Moderate', 'Strict', 'Non-Refundable', 'Pay at Property', 'Pay Now'];
  const brandsOptions =  ['Hilton', 'Marriott', 'Hyatt', 'Best Western', 'Accor', 'IHG', 'Wyndham', 'Choice Hotels'];
  const roomFacilitiesOptions = ['Air Conditioning', 'TV', 'Mini Bar', 'Coffee Maker', 'Safe', 'Desk', 'Balcony', 'Bathtub', 'Shower']

  // Update the form when the item prop changes
  useEffect(() => {
    setFormData(item);
  }, [item]);

  // Calculate derived values when room categories change
  useEffect(() => {
    if (formData.categoryRooms && formData.categoryRooms.length > 0) {
      // No need to update formData since we're displaying these calculated values separately
      // This could be uncommented if we want to actually update the formData with these values
      /*
      setFormData(prev => ({
        ...prev,
        rooms: totalRooms,
        costing: {
          ...prev.costing,
          price: minRoomPrice,
          currency: prev.categoryRooms && prev.categoryRooms.length > 0 ? prev.categoryRooms[0].currency : "INR"
        }
      }));
      */
    }
  }, [formData.categoryRooms]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => {
      const keys = field.split(".");
      // Create a deep copy of the previous state
      const updated = JSON.parse(JSON.stringify(prev)) as Property;
      
      // Navigate to the right part of the object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current: any = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        // Ensure the path exists
        if (!current[keys[i]]) {
          current[keys[i]] = keys[i + 1].match(/^\d+$/) ? [] : {};
        }
        current = current[keys[i]];
      }
      
      // Set the value at the final key
      const lastKey = keys[keys.length - 1];
      current[lastKey] = value;
      
      return updated;
    });
  };
  
  // Handle room category changes
  const handleCategoryChange = (field: keyof RoomCategory, value: string | number) => {
    setNewCategory(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle adding a new room category
  const handleAddCategory = () => {
    if (!newCategory.title) {
      setErrors(prev => ({ ...prev, categoryTitle: "Category title is required" }));
      return;
    }
    
    if (newCategory.qty <= 0) {
      setErrors(prev => ({ ...prev, categoryQty: "Quantity must be greater than 0" }));
      return;
    }
    
    if (newCategory.price <= 0) {
      setErrors(prev => ({ ...prev, categoryPrice: "Price must be greater than 0" }));
      return;
    }

    if (isEditMode && editingCategoryIndex !== null) {
      // Update existing category
      setFormData(prev => {
        const updatedCategories = [...(prev.categoryRooms || [])];
        updatedCategories[editingCategoryIndex] = { ...newCategory };
        return {
          ...prev,
          categoryRooms: updatedCategories
        };
      });
      
      // Exit edit mode
      setIsEditMode(false);
      setEditingCategoryIndex(null);
    } else {
      // Add new category
      setFormData(prev => ({
        ...prev,
        categoryRooms: [...(prev.categoryRooms || []), { ...newCategory }]
      }));
    }

    // Reset the new category form
    setNewCategory({
      title: "",
      qty: 1,
      price: 0,
      discountedPrice: 0,
      currency: newCategory.currency
    });
    
    // Clear any errors
    setErrors(prev => {
      const updated = { ...prev };
      delete updated.categoryTitle;
      delete updated.categoryQty;
      delete updated.categoryPrice;
      return updated;
    });
  };

  // Handle editing a room category
  const handleEditCategory = (index: number) => {
    const categoryToEdit = formData.categoryRooms?.[index];
    if (categoryToEdit) {
      setNewCategory({ ...categoryToEdit });
      setEditingCategoryIndex(index);
      setIsEditMode(true);
    }
  };

  // Handle canceling the edit mode
  const handleCancelEdit = () => {
    setNewCategory({
      title: "",
      qty: 1,
      price: 0,
      discountedPrice: 0,
      currency: formData.costing?.currency || "INR"
    });
    setEditingCategoryIndex(null);
    setIsEditMode(false);
  };

  // Handle removing a room category
  const handleRemoveCategory = (index: number) => {
    // If we're currently editing this category, exit edit mode
    if (editingCategoryIndex === index) {
      handleCancelEdit();
    }
    
    setFormData(prev => ({
      ...prev,
      categoryRooms: prev.categoryRooms?.filter((_, i) => i !== index)
    }));
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.description) newErrors.description = "Description is required";
    if (!formData.type) newErrors.type = "Property type is required";
    if (!formData.location?.address) newErrors.address = "Address is required";
    if (!formData.location?.city) newErrors.city = "City is required";
    if (!formData.location?.state) newErrors.state = "State is required";
    if (!formData.location?.country) newErrors.country = "Country is required";
    
    // Check if we have room categories instead of checking price directly
    if (!formData.categoryRooms || formData.categoryRooms.length === 0) {
      newErrors.categoryRooms = "At least one room category is required";
    }
    
    if (!formData.bannerImage) newErrors.bannerImage = "Banner image is required";
    if (!formData.detailImages || formData.detailImages.length < 3) newErrors.detailImages = "At least 3 detail images are required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.amenities || formData.amenities.length === 0) newErrors.amenities = "At least one amenity is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Before saving, update the rooms and price based on categories
      const updatedData = {
        ...formData,
        rooms: formData.categoryRooms && formData.categoryRooms.length > 0 
          ? formData.categoryRooms.reduce((sum, cat) => sum + cat.qty, 0)
          : formData.rooms,
        costing: {
          ...formData.costing,
          price: formData.categoryRooms && formData.categoryRooms.length > 0 
            ? Math.min(...formData.categoryRooms.map(cat => cat.price))
            : formData.costing?.price || 0,
          currency: formData.categoryRooms && formData.categoryRooms.length > 0 
            ? formData.categoryRooms[0].currency 
            : formData.costing?.currency || "INR"
        }
      };
      
      onSave(updatedData);
    }
  };

  // Helper component for checkbox groups
  const CheckboxGroup = ({ 
    options, 
    value = [], 
    onChange, 
    label, 
    fieldName 
  }: { 
    options: string[], 
    value: string[], 
    onChange: (field: string, value: string[]) => void, 
    label: string,
    fieldName: string
  }) => (
    <div className="mb-4">
      <label className="block mb-2 font-medium">{label}</label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`${fieldName}-${option}`}
              checked={value.includes(option)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange(fieldName, [...value, option]);
                } else {
                  onChange(fieldName, value.filter((item) => item !== option));
                }
              }}
            />
            <label htmlFor={`${fieldName}-${option}`} className="text-sm capitalize">
              {option.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  // Calculate the minimum price from all room categories
  const minRoomPrice = formData.categoryRooms && formData.categoryRooms.length > 0 
    ? Math.min(...formData.categoryRooms.map(cat => cat.price))
    : formData.costing?.price || 0;
  
  // Calculate the total room count from all categories
  const totalRooms = formData.categoryRooms && formData.categoryRooms.length > 0 
    ? formData.categoryRooms.reduce((sum, cat) => sum + cat.qty, 0)
    : formData.rooms || 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Title</label>
        <Input
          name="title"
          value={formData.title || ''}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Enter title"
        />
        {errors.title && <span className="text-red-500">{errors.title}</span>}
      </div>

      <div>
        <label>Description</label>
        <Textarea
          name="description"
          value={formData.description || ''}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Enter description"
          rows={5}
        />
        {errors.description && <span className="text-red-500">{errors.description}</span>}
      </div>

      <div>
        <label>Property Type</label>
        <Select
          value={formData.type || ''}
          onValueChange={(value) => handleChange("type", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select property type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hotel">Hotel</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
            <SelectItem value="hostel">Hostel</SelectItem>
            <SelectItem value="resort">Resort</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <span className="text-red-500">{errors.type}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label>Address</label>
          <Input
            name="location.address"
            value={formData.location?.address || ''}
            onChange={(e) => handleChange("location.address", e.target.value)}
            placeholder="Enter address"
          />
          {errors.address && <span className="text-red-500">{errors.address}</span>}
        </div>
        <div>
          <label>City</label>
          <Input
            name="location.city"
            value={formData.location?.city || ''}
            onChange={(e) => handleChange("location.city", e.target.value)}
            placeholder="Enter city"
          />
          {errors.city && <span className="text-red-500">{errors.city}</span>}
        </div>
        <div>
          <label>State</label>
          <Input
            name="location.state"
            value={formData.location?.state || ''}
            onChange={(e) => handleChange("location.state", e.target.value)}
            placeholder="Enter state"
          />
          {errors.state && <span className="text-red-500">{errors.state}</span>}
        </div>
        <div>
          <label>Country</label>
          <Input
            name="location.country"
            value={formData.location?.country || ''}
            onChange={(e) => handleChange("location.country", e.target.value)}
            placeholder="Enter country"
          />
          {errors.country && <span className="text-red-500">{errors.country}</span>}
        </div>
      </div>

      {/* Pricing Information (Read-only, calculated from room categories) */}
      <div className="bg-blue-50 p-4 rounded-md">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={16} className="text-blue-500" />
          <span className="text-sm text-blue-700">
            Price per night and total rooms are automatically calculated from room categories.
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Price per Night (Minimum)</label>
            <Input
              type="number"
              value={minRoomPrice}
              disabled
              className="bg-gray-100"
            />
            <span className="text-xs text-gray-500 mt-1">
              Based on the lowest room category price
            </span>
          </div>
          
          <div>
            <label className="text-sm font-medium">Total Rooms</label>
            <Input
              type="number"
              value={totalRooms}
              disabled
              className="bg-gray-100"
            />
            <span className="text-xs text-gray-500 mt-1">
              Sum of all room category quantities
            </span>
          </div>
          
          <div>
            <label className="text-sm font-medium">Currency</label>
            <Input
              type="text"
              value={formData.categoryRooms && formData.categoryRooms.length > 0 
                ? formData.categoryRooms[0].currency 
                : formData.costing?.currency || "INR"}
              disabled
              className="bg-gray-100"
            />
            <span className="text-xs text-gray-500 mt-1">
              Based on the first room category
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label>Property Rating (Stars)</label>
          <Input
            type="number"
            name="propertyRating"
            value={formData.propertyRating?.toString()}
            onChange={(e) => handleChange("propertyRating", parseFloat(e.target.value) || 0)}
            min={0}
            max={5}
            step={0.5}
          />
        </div>
        <div>
          <label>Property Google Maps</label>
          <Input
            type="string"
            name="googleMaps"
            value={formData.googleMaps}
            onChange={(e) => handleChange("googleMaps", e.target.value || "")}
          />
        </div>
        
        <div>
          <label>Total Rating</label>
          <Input
            type="number"
            name="totalRating"
            value={formData.totalRating || ''}
            onChange={(e) => handleChange("totalRating", parseFloat(e.target.value) || 0)}
            min={0}
            max={5}
            step={0.1}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Start Date</label>
          <Input
            type="date"
            name="startDate"
            value={formData.startDate || ''}
            onChange={(e) => handleChange("startDate", e.target.value)}
          />
          {errors.startDate && <span className="text-red-500">{errors.startDate}</span>}
        </div>
        <div>
          <label>End Date</label>
          <Input
            type="date"
            name="endDate"
            value={formData.endDate || ''}
            onChange={(e) => handleChange("endDate", e.target.value)}
          />
          {errors.endDate && <span className="text-red-500">{errors.endDate}</span>}
        </div>
      </div>

      {/* Room Categories Section */}
      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-medium mb-4">Room Categories</h3>
        
        {errors.categoryRooms && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
            {errors.categoryRooms}
          </div>
        )}
        
        {/* List of existing categories */}
        {formData.categoryRooms && formData.categoryRooms.length > 0 && (
          <div className="mb-4 space-y-2">
            <h4 className="text-sm font-medium">Added Categories:</h4>
            
            <div className="space-y-2">
              {formData.categoryRooms.map((cat, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-md">
                  <div className="flex-1 grid grid-cols-5 gap-2">
                    <div className="col-span-2">
                      <p className="font-medium">{cat.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Qty: {cat.qty}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {cat.currency} {cat.price}
                        {cat.discountedPrice > 0 && (
                          <span className="ml-1 text-green-600">
                            (-{cat.currency} {cat.discountedPrice})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      type="button"
                      onClick={() => handleEditCategory(index)}
                      className="text-blue-500 hover:text-blue-700"
                      disabled={isEditMode}
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleRemoveCategory(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Form to add new category or edit existing */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium mb-3">
            {isEditMode ? "Edit Category:" : "Add New Category:"}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Title</label>
              <Input 
                value={newCategory.title}
                onChange={(e) => handleCategoryChange('title', e.target.value)}
                placeholder="e.g. Deluxe Room, Suite, etc."
              />
              {errors.categoryTitle && <span className="text-red-500">{errors.categoryTitle}</span>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <Input 
                type="number"
                value={newCategory.qty}
                onChange={(e) => handleCategoryChange('qty', Number(e.target.value) || 0)}
                min={1}
                placeholder="Number of rooms available"
              />
              {errors.categoryQty && <span className="text-red-500">{errors.categoryQty}</span>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Price</label>
              <Input 
                type="number"
                value={newCategory.price}
                onChange={(e) => handleCategoryChange('price', Number(e.target.value) || 0)}
                min={0}
                placeholder="Regular price"
              />
              {errors.categoryPrice && <span className="text-red-500">{errors.categoryPrice}</span>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Discounted Price</label>
              <Input 
                type="number"
                value={newCategory.discountedPrice}
                onChange={(e) => handleCategoryChange('discountedPrice', Number(e.target.value) || 0)}
                min={0}
                placeholder="Discounted price (if any)"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <Select
                value={newCategory.currency} 
                onValueChange={(value) => handleCategoryChange('currency', value)} 
              >
                
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <button 
              type="button"
              onClick={handleAddCategory}
              className="flex items-center justify-center py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              {isEditMode ? (
                <>
                  <Check size={16} className="mr-2" /> Update Category
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" /> Add Category
                </>
              )}
            </button>
            
            {isEditMode && (
              <button 
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center justify-center py-2 px-4 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                <X size={16} className="mr-2" /> Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feature Sections */}
      <div className="border p-4 rounded-md">
        <h3 className="text-lg font-semibold mb-4">Property Features</h3>
        
        <CheckboxGroup
          options={amenities}
          value={formData.amenities || []}
          onChange={handleChange}
          label="Amenities"
          fieldName="amenities"
        />
        {errors.amenities && <span className="text-red-500 block mb-4">{errors.amenities}</span>}
        
        <CheckboxGroup
          options={accessibility}
          value={formData.accessibility || []}
          onChange={handleChange}
          label="Property Accessibility"
          fieldName="accessibility"
        />
        
        <CheckboxGroup
          options={roomAccessibilityOptions}
          value={formData.roomAccessibility || []}
          onChange={handleChange}
          label="Room Accessibility"
          fieldName="roomAccessibility"
        />
        
        <CheckboxGroup
          options={popularFilters}
          value={formData.popularFilters || []}
          onChange={handleChange}
          label="Popular Filters"
          fieldName="popularFilters"
        />
        
        <CheckboxGroup
          options={funThingsToDo}
          value={formData.funThingsToDo || []}
          onChange={handleChange}
          label="Fun Things To Do"
          fieldName="funThingsToDo"
        />
        
        <CheckboxGroup
          options={mealsOptions}
          value={formData.meals || []}
          onChange={handleChange}
          label="Meals"
          fieldName="meals"
        />
        
        <CheckboxGroup
          options={facilitiesOptions}
          value={formData.facilities || []}
          onChange={handleChange}
          label="Facilities"
          fieldName="facilities"
        />
        
        <CheckboxGroup
          options={bedPreferenceOptions}
          value={formData.bedPreference || []}
          onChange={handleChange}
          label="Bed Preferences"
          fieldName="bedPreference"
        />
        
        <CheckboxGroup
          options={reservationPolicyOptions}
          value={formData.reservationPolicy || []}
          onChange={handleChange}
          label="Reservation Policies"
          fieldName="reservationPolicy"
        />
        
        <CheckboxGroup
          options={brandsOptions}
          value={formData.brands || []}
          onChange={handleChange}
          label="Brands"
          fieldName="brands"
        />
        
        <CheckboxGroup
          options={roomFacilitiesOptions}
          value={formData.roomFacilities || []}
          onChange={handleChange}
          label="Room Facilities"
          fieldName="roomFacilities"
        />
      </div>

      <div>
        <label>Banner Image</label>
        <ImageUpload
          label='banner image'
          value={formData.bannerImage || null}
          onChange={(image) => handleChange("bannerImage", image)}
        />
        {errors.bannerImage && <span className="text-red-500">{errors.bannerImage}</span>}
      </div>

      <div>
        <label>Detail Images</label>
        <MultipleImageUpload
          label='detail images'
          key={formData.detailImages?.length}
          value={formData.detailImages || []}
          onChange={(images) => handleChange("detailImages", images)}
          maxImages={10}
        />
        {errors.detailImages && <span className="text-red-500">{errors.detailImages}</span>}
      </div>

      {/* Reviews Section (if needed) */}
      {formData.review && formData.review.length > 0 && (
        <div className="space-y-2">
          <label className="block font-medium">Reviews</label>
          {formData.review.map((review, index) => (
            <div key={index} className="border p-3 rounded-md">
              <div>
                <label>Comment</label>
                <Textarea
                  value={review.comment}
                  onChange={(e) => handleChange(`review.${index}.comment`, e.target.value)}
                  placeholder="Review comment"
                />
              </div>
              <div className="mt-2">
                <label>Rating</label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={review.rating}
                  onChange={(e) => handleChange(`review.${index}.rating`, parseInt(e.target.value))}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Button type="submit" className="w-full">Save Changes</Button>
    </form>
  );
};

export default PropertyEditForm;