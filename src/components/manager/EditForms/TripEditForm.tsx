import React, { useState } from "react";
import { Trip } from "@/lib/mongodb/models/Trip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import ImageUpload from "@/components/cloudinary/ImageUpload";
import MultipleImageUpload from "@/components/cloudinary/MultipleImageUpload";

interface TripEditFormProps {
  item: Trip;
  onSave: (updatedTrip: Trip) => void;
}

const TripEditForm: React.FC<TripEditFormProps> = ({ item, onSave }) => {
  const [formData, setFormData] = useState<Trip>(item);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Define options for various trip features
  const amenitiesOptions = ["wifi", "pool", "gym", "spa", "restaurant", "parking", "airConditioning", "breakfast"];
  const propertyAccessibilityOptions =['Wheelchair Accessible', 'Elevator', 'Accessible Parking', 'Braille Signage', 'Accessible Bathroom', 'Roll-in Shower'];
  // const roomAccessibilityOptions = ["wideDoorway", "loweredSink", "grabBars", "showerChair", "visualAlerts"];
  const popularFiltersOptions =  ['Pet Friendly', 'Free Cancellation', 'Free Breakfast', 'Pool', 'Hot Tub', 'Ocean View', 'Family Friendly', 'Business Facilities'];
  const funThingsToDoOptions = ['Beach', 'Hiking', 'Shopping', 'Nightlife', 'Local Tours', 'Museums', 'Theme Parks', 'Water Sports'];
  const mealsOptions =['Breakfast', 'Lunch', 'Dinner', 'All-Inclusive', 'Buffet', 'À la carte', 'Room Service', 'Special Diets'];
  const facilitiesOptions = ['Parking', 'WiFi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Bar', 'Spa', 'Conference Room'];
   const reservationPolicyOptions = ['Free Cancellation', 'Flexible', 'Moderate', 'Strict', 'Non-Refundable', 'Pay at Property', 'Pay Now'];
  const brandsOptions =  ['Hilton', 'Marriott', 'Hyatt', 'Best Western', 'Accor', 'IHG', 'Wyndham', 'Choice Hotels'];
 const activitiesOptions = ["sightseeing", "adventure", "cultural", "relaxation", "entertainment", "sports"];

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => {
      const keys = field.split(".");
      // Create a deep copy of the previous state
      const updated = JSON.parse(JSON.stringify(prev)) as Trip;
      
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
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.description) newErrors.description = "Description is required";
    if (!formData.type) newErrors.type = "Trip type is required";
    if (!formData.destination?.city) newErrors.city = "City is required";
    if (!formData.destination?.state) newErrors.state = "State is required";
    if (!formData.destination?.country) newErrors.country = "Country is required";
    if (!formData.costing?.price) newErrors.price = "Price is required";
    if (!formData.costing?.currency) newErrors.currency = "Currency is required";
    if (!formData.bannerImage) newErrors.bannerImage = "Banner image is required";
    if (!formData.detailImages || formData.detailImages.length < 3) newErrors.detailImages = "At least 3 detail images are required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.amenities || formData.amenities.length === 0) newErrors.amenities = "At least one amenity is required";
    if (!formData.activities || formData.activities.length === 0) newErrors.activities = "At least one activity is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Title</label>
        <Input
          name="title"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Enter title"
        />
        {errors.title && <span className="text-red-500">{errors.title}</span>}
      </div>

      <div>
        <label>Description</label>
        <Textarea
          name="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Enter description"
          rows={5}
        />
        {errors.description && <span className="text-red-500">{errors.description}</span>}
      </div>

      <div>
        <label>Domain</label>
        <Input
          name="domain"
          value={formData.domain || ''}
          onChange={(e) => handleChange("domain", e.target.value)}
          placeholder="Enter domain"
        />
      </div>

      <div>
        <label>Trip Type</label>
        <Select
          value={formData.type}
          onValueChange={(value) => handleChange("type", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select trip type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Domestic">Domestic</SelectItem>
            <SelectItem value="International">International</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <span className="text-red-500">{errors.type}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label>City</label>
          <Input
            name="destination.city"
            value={formData.destination?.city || ''}
            onChange={(e) => handleChange("destination.city", e.target.value)}
            placeholder="Enter city"
          />
          {errors.city && <span className="text-red-500">{errors.city}</span>}
        </div>
        <div>
          <label>State</label>
          <Input
            name="destination.state"
            value={formData.destination?.state || ''}
            onChange={(e) => handleChange("destination.state", e.target.value)}
            placeholder="Enter state"
          />
          {errors.state && <span className="text-red-500">{errors.state}</span>}
        </div>
        <div>
          <label>Country</label>
          <Input
            name="destination.country"
            value={formData.destination?.country || ''}
            onChange={(e) => handleChange("destination.country", e.target.value)}
            placeholder="Enter country"
          />
          {errors.country && <span className="text-red-500">{errors.country}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label>Price</label>
          <Input
            type="number"
            name="costing.price"
            value={formData.costing?.price || ''}
            onChange={(e) => handleChange("costing.price", parseFloat(e.target.value) || 0)}
            min={1}
          />
          {errors.price && <span className="text-red-500">{errors.price}</span>}
        </div>

        <div>
          <label>Discounted Price</label>
          <Input
            type="number"
            name="costing.discountedPrice"
            value={formData.costing?.discountedPrice || ''}
            onChange={(e) => handleChange("costing.discountedPrice", parseFloat(e.target.value) || 0)}
            min={0}
          />
        </div>

        <div>
          <label>Currency</label>
          <Select
            value={formData.costing?.currency || ''}
            onValueChange={(value) => handleChange("costing.currency", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {["INR", "USD", "EUR", "GBP", "JPY"].map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.currency && <span className="text-red-500">{errors.currency}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Feature Sections */}
      <div className="border p-4 rounded-md">
        <h3 className="text-lg font-semibold mb-4">Trip Features</h3>
        
        <CheckboxGroup
          options={activitiesOptions}
          value={formData.activities || []}
          onChange={handleChange}
          label="Activities"
          fieldName="activities"
        />
        {errors.activities && <span className="text-red-500 block mb-4">{errors.activities}</span>}
        
        <CheckboxGroup
          options={amenitiesOptions}
          value={formData.amenities || []}
          onChange={handleChange}
          label="Amenities"
          fieldName="amenities"
        />
        {errors.amenities && <span className="text-red-500 block mb-4">{errors.amenities}</span>}
        
        <CheckboxGroup
          options={propertyAccessibilityOptions}
          value={formData.accessibility || []}
          onChange={handleChange}
          label="Trip Accessibility"
          fieldName="accessibility"
        />
        
        <CheckboxGroup
          options={popularFiltersOptions}
          value={formData.popularFilters || []}
          onChange={handleChange}
          label="Popular Filters"
          fieldName="popularFilters"
        />
        
        <CheckboxGroup
          options={funThingsToDoOptions}
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

      {/* Reviews Section */}
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

export default TripEditForm;