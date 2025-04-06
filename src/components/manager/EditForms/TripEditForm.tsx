"use client";

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
    if (!formData.type) newErrors.type = "Trip type is required";
    if (!formData.destination.city) newErrors.city = "City is required";
    if (!formData.destination.state) newErrors.state = "State is required";
    if (!formData.destination.country) newErrors.country = "Country is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.costing.price) newErrors.price = "Price is required";
    if (!formData.costing.currency) newErrors.currency = "Currency is required";
    if (!formData.bannerImage) newErrors.bannerImage = "Banner image is required";
    if (formData.detailImages && formData.detailImages.length < 3) newErrors.detailImages = "At least 3 detail images are required";

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
          placeholder="Enter trip title"
        />
        {errors.title && <span className="text-red-500">{errors.title}</span>}
      </div>

      <div>
        <label>Description</label>
        <Textarea
          name="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Enter trip description"
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

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label>City</label>
          <Input
            name="destination.city"
            value={formData.destination.city}
            onChange={(e) => handleChange("destination.city", e.target.value)}
            placeholder="Enter city"
          />
          {errors.city && <span className="text-red-500">{errors.city}</span>}
        </div>
        <div>
          <label>State</label>
          <Input
            name="destination.state"
            value={formData.destination.state}
            onChange={(e) => handleChange("destination.state", e.target.value)}
            placeholder="Enter state"
          />
          {errors.state && <span className="text-red-500">{errors.state}</span>}
        </div>
        <div>
          <label>Country</label>
          <Input
            name="destination.country"
            value={formData.destination.country}
            onChange={(e) => handleChange("destination.country", e.target.value)}
            placeholder="Enter country"
          />
          {errors.country && <span className="text-red-500">{errors.country}</span>}
        </div>
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
            onChange={(e) => handleChange("endDate", e.target.value)}
          />
          {errors.endDate && <span className="text-red-500">{errors.endDate}</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label>Price</label>
          <Input
            type="number"
            name="costing.price"
            value={formData.costing.price}
            onChange={(e) => handleChange("costing.price", parseFloat(e.target.value))}
            min={0}
          />
          {errors.price && <span className="text-red-500">{errors.price}</span>}
        </div>
        <div>
          <label>Discounted Price</label>
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

      <div>
        <label>Activities</label>
        <Textarea
          name="activities"
          value={formData.activities.join(", ")}
          onChange={(e) => handleChange("activities", e.target.value.split(", "))}
          placeholder="Enter activities separated by commas"
        />
      </div>

      <div>
        <label>Banner Image</label>
        <ImageUpload
          label="banner image"
          value={formData.bannerImage}
          onChange={(image) => handleChange("bannerImage", image)}
        />
        {errors.bannerImage && <span className="text-red-500">{errors.bannerImage}</span>}
      </div>

      <div>
        <label>Detail Images</label>
        <MultipleImageUpload
          label="detail images"
          value={formData.detailImages}
          onChange={(images) => handleChange("detailImages", images)}
          maxImages={10}
        />
        {errors.detailImages && <span className="text-red-500">{errors.detailImages}</span>}
      </div>

      <div>
        <label>Domain</label>
        <Input
          name="domain"
          value={formData.domain}
          onChange={(e) => handleChange("domain", e.target.value)}
          placeholder="Enter domain"
        />
      </div>

      <Button type="submit">Save Changes</Button>
    </form>
  );
};

export default TripEditForm;
