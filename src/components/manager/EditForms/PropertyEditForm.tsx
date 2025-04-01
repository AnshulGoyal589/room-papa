import React, { useState } from "react";
import { Property } from "@/lib/mongodb/models/Property";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import ImageUpload from "@/components/cloudinary/ImageUpload";
import MultipleImageUpload from "@/components/cloudinary/MultipleImageUpload";
import { PropertyAmenities } from "@/types";

interface PropertyEditFormProps {
  item: Property;
  onSave: (updatedProperty: Property) => void;
}

const PropertyEditForm: React.FC<PropertyEditFormProps> = ({ item, onSave }) => {
  // console.log(item);
  const [formData, setFormData] = useState<Property>(item);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const amenities: PropertyAmenities[] = ["wifi", "pool", "gym", "spa", "restaurant", "parking", "airConditioning", "breakfast"];

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => {
      const keys = field.split(".");
      const updated: Partial<Property> = { ...prev };
      let temp: Record<string, unknown> = updated;
  
      for (let i = 0; i < keys.length - 1; i++) {
        if (!temp[keys[i]]) temp[keys[i]] = {};
        temp[keys[i]] = { ...temp[keys[i]] as Record<string, unknown> };
        temp = temp[keys[i]] as Record<string, unknown>;
      }
  
      temp[keys[keys.length - 1]] = value;
      return updated as Property;
    });
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.description) newErrors.description = "Description is required";
    if (!formData.type) newErrors.type = "Property type is required";
    if (!formData.location.address) newErrors.address = "Address is required";
    if (!formData.location.city) newErrors.city = "City is required";
    if (!formData.location.state) newErrors.state = "State is required";
    if (!formData.location.country) newErrors.country = "Country is required";
    if (!formData.costing.price) newErrors.price = "Price is required";
    if (!formData.costing.currency) newErrors.currency = "Currency is required";
    if (!formData.bedrooms) newErrors.bedrooms = "Number of bedrooms is required";
    if (!formData.bathrooms) newErrors.bathrooms = "Number of bathrooms is required";
    if (!formData.maximumGuests) newErrors.maximumGuests = "Maximum guests is required";
    if (!formData.bannerImage) newErrors.bannerImage = "Banner image is required";
    if (formData.detailImages.length < 3) newErrors.detailImages = "At least 3 detail images are required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

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
        />
        {errors.description && <span className="text-red-500">{errors.description}</span>}
      </div>

      <div>
        <label>Property Type</label>
        <Select
          value={formData.type}
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
            value={formData.location.address}
            onChange={(e) => handleChange("location.address", e.target.value)}
            placeholder="Enter address"
          />
          {errors.address && <span className="text-red-500">{errors.address}</span>}
        </div>
        <div>
          <label>City</label>
          <Input
            name="location.city"
            value={formData.location.city}
            onChange={(e) => handleChange("location.city", e.target.value)}
            placeholder="Enter city"
          />
          {errors.city && <span className="text-red-500">{errors.city}</span>}
        </div>
        <div>
          <label>State</label>
          <Input
            name="location.state"
            value={formData.location.state}
            onChange={(e) => handleChange("location.state", e.target.value)}
            placeholder="Enter state"
          />
          {errors.state && <span className="text-red-500">{errors.state}</span>}
        </div>
        <div>
          <label>Country</label>
          <Input
            name="location.country"
            value={formData.location.country}
            onChange={(e) => handleChange("location.country", e.target.value)}
            placeholder="Enter country"
          />
          {errors.country && <span className="text-red-500">{errors.country}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label>Price per Night</label>
          <Input
            type="number"
            name="costing.price"
            value={formData.costing.price}
            onChange={(e) => handleChange("costing.price", parseFloat(e.target.value))}
            min={1}
          />
          {errors.price && <span className="text-red-500">{errors.price}</span>}
        </div>

        <div>
          <label>Discounted Price per Night</label>
          <Input
            type="number"
            name="costing.discountedPrice"
            value={formData.costing.discountedPrice}
            onChange={(e) => handleChange("costing.discountedPrice", parseFloat(e.target.value))}
            min={0}
          />
        </div>

        <div>
          <label>Currency</label>
          <Select
            value={formData.costing.currency}
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

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label>Bedrooms</label>
          <Input
            type="number"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={(e) => handleChange("bedrooms", parseInt(e.target.value))}
            min={1}
          />
          {errors.bedrooms && <span className="text-red-500">{errors.bedrooms}</span>}
        </div>

        <div>
          <label>Bathrooms</label>
          <Input
            type="number"
            name="bathrooms"
            value={formData.bathrooms}
            onChange={(e) => handleChange("bathrooms", parseInt(e.target.value))}
            min={1}
          />
          {errors.bathrooms && <span className="text-red-500">{errors.bathrooms}</span>}
        </div>

        <div>
          <label>Maximum Guests</label>
          <Input
            type="number"
            name="maximumGuests"
            value={formData.maximumGuests}
            onChange={(e) => handleChange("maximumGuests", parseInt(e.target.value))}
            min={1}
          />
          {errors.maximumGuests && <span className="text-red-500">{errors.maximumGuests}</span>}
        </div>
      </div>

      {amenities.map((amenity) => (
        <div key={amenity} className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={amenity}
            checked={formData.amenities.includes(amenity)}
            onChange={(e) => {
              if (e.target.checked) {
                handleChange("amenities", [...formData.amenities, amenity]);
              } else {
                handleChange("amenities", formData.amenities.filter((a) => a !== amenity));
              }
            }}
          />
          <label htmlFor={amenity} className="text-sm capitalize">
            {amenity === "airConditioning" ? "Air Conditioning" : amenity}
          </label>
        </div>
      ))}

      <div>
        <label>Banner Image</label>
        <ImageUpload
          label='banner image'
          value={formData.bannerImage}
          onChange={(image) => handleChange("bannerImage", image)}
        />
        {errors.bannerImage && <span className="text-red-500">{errors.bannerImage}</span>}
      </div>

      <div>
        <label>Detail Images</label>
        <MultipleImageUpload
          label='detail images'
          value={formData.detailImages}
          onChange={(images) => handleChange("detailImages", images)}
          maxImages={10}
        />
        {errors.detailImages && <span className="text-red-500">{errors.detailImages}</span>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Start Date</label>
          <Input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={(e) => handleChange("startDate",e.target.value)}
          />
          {errors.startDate && <span className="text-red-500">{errors.startDate}</span>}
        </div>
        <div>
          <label>End Date</label>
          <Input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={(e) => handleChange("endDate",e.target.value)}
          />
          {errors.endDate && <span className="text-red-500">{errors.endDate}</span>}
        </div>
      </div>

      <Button type="submit">Save Changes</Button>
    </form>
  );
};

export default PropertyEditForm;
