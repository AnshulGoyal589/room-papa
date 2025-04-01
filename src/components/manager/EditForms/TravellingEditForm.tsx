"use client";

import React, { useState } from "react";
import { Travelling } from "@/lib/mongodb/models/Travelling";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import ImageUpload from "@/components/cloudinary/ImageUpload";
import MultipleImageUpload from "@/components/cloudinary/MultipleImageUpload";

interface TravellingEditFormProps {
  item: Travelling;
  onSave: (updatedTravelling: Travelling) => void;
}

const TravellingEditForm: React.FC<TravellingEditFormProps> = ({ item, onSave }) => {
  const [formData, setFormData] = useState<Travelling>(item);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => {
      const keys = field.split(".");
      const updated: Partial<Travelling> = { ...prev };
      let temp: Record<string, unknown> = updated;
  
      for (let i = 0; i < keys.length - 1; i++) {
        if (!temp[keys[i]]) temp[keys[i]] = {};
        temp[keys[i]] = { ...temp[keys[i]] as Record<string, unknown> };
        temp = temp[keys[i]] as Record<string, unknown>;
      }
  
      temp[keys[keys.length - 1]] = value;
      return updated as Travelling;
    });
  };
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
      </div>

      <div>
        <label>Description</label>
        <Textarea
          name="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Enter description"
        />
      </div>

      <div>
        <label>Transportation Type</label>
        <Select
          value={formData.transportation.type}
          onValueChange={(value) => handleChange("transportation.type", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select transportation type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="air">Air</SelectItem>
            <SelectItem value="rail">Rail</SelectItem>
            <SelectItem value="road">Road</SelectItem>
            <SelectItem value="sea">Sea</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Arrival Time</label>
          <Input
            type="datetime-local"
            name="transportation.arrivalTime"
            value={formData.transportation.arrivalTime}
            onChange={(e) => handleChange("transportation.arrivalTime",e.target.value)}
          />
        </div>
        <div>
          <label>Departure Time</label>
          <Input
            type="datetime-local"
            name="transportation.departureTime"
            value={formData.transportation.departureTime}
            onChange={(e) => handleChange("transportation.departureTime", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>From</label>
          <Input
            name="transportation.from"
            value={formData.transportation.from}
            onChange={(e) => handleChange("transportation.from", e.target.value)}
            placeholder="Enter departure location"
          />
        </div>
        <div>
          <label>To</label>
          <Input
            name="transportation.to"
            value={formData.transportation.to}
            onChange={(e) => handleChange("transportation.to", e.target.value)}
            placeholder="Enter arrival location"
          />
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
        </div>
      </div>

      <div>
        <label>Banner Image</label>
        <ImageUpload
          label="banner image"
          value={formData.bannerImage}
          onChange={(image) => handleChange("bannerImage", image)}
        />
      </div>

      <div>
        <label>Detail Images</label>
        <MultipleImageUpload
          label="detail images"
          value={formData.detailImages}
          onChange={(images) => handleChange("detailImages", images)}
          maxImages={10}
        />
      </div>

      <Button type="submit">Save Changes</Button>
    </form>
  );
};

export default TravellingEditForm;
