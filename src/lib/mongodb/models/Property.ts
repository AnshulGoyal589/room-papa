

import { Collection, ObjectId } from 'mongodb';
import { getDb } from '..';
import {  PropertyAmenities, PropertyType } from '@/types';
import { Image } from './Image';
import { StoredRoomCategory } from '@/types/booking';


export interface Property {
  _id?: ObjectId;
  userId?: string;
  title?: string;
  description?: string;
  type: PropertyType;
  location: {
    address: string;
    state: string;
    city: string;
    country: string;
  };
  startDate: string; // Overall listing start
  endDate: string;   // Overall listing end
  costing: {         // Calculated summary: lowest starting price
    price: number;
    discountedPrice: number;
    currency: string;
  };
  totalRating?: number;
  review?: {
    comment: string;
    rating: number;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
  bannerImage?: Image;
  detailImages?: Image[];
  rooms: number;
  categoryRooms?: StoredRoomCategory[];
  amenities: string[];
  accessibility?: string[];
  roomAccessibility?: string[];
  popularFilters?: string[];
  funThingsToDo?: string[];
  meals?: string[];
  facilities?: string[];
  bedPreference?: string[];
  reservationPolicy?: string[];
  brands?: string[];
  roomFacilities?: string[];
  propertyRating?: number;
  googleMaps?: string;
}


  interface PropertyValidationInput {
    name: string;
    type: string;
    location: {
      address: string;
      city: string;
      country: string;
      [key: string]: unknown;
    };
    description: string;
    amenities: string[];
    pricePerNight: number;
    rooms: number;
    [key: string]: unknown;
  }

  export function validateProperty(propertyData: PropertyValidationInput): boolean {
    const requiredFields = ['name', 'type', 'location', 'description', 'amenities', 'pricePerNight', 'rooms'];
    
    for (const field of requiredFields) {
      if (!propertyData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate location sub-fields
    const requiredLocationFields = ['address', 'city', 'country'];
    for (const field of requiredLocationFields) {
      if (!propertyData.location[field]) {
        throw new Error(`Missing required location field: ${field}`);
      }
    }
    
    // Validate property type
    const validPropertyTypes: PropertyType[] = ['hotel', 'apartment', 'villa', 'hostel', 'resort'];
    if (!validPropertyTypes.includes(propertyData.type as PropertyType)) {
      throw new Error(`Invalid property type. Must be one of: ${validPropertyTypes.join(', ')}`);
    }
    
    // Validate amenities
    const validAmenities: PropertyAmenities[] = ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'parking', 'airConditioning', 'breakfast'];
    for (const amenity of propertyData.amenities) {
      if (!validAmenities.includes(amenity as PropertyAmenities)) {
        throw new Error(`Invalid amenity: ${amenity}. Valid amenities are: ${validAmenities.join(', ')}`);
      }
    }
    
    // Validate numeric values
    if (propertyData.pricePerNight <= 0) {
      throw new Error('Price per night must be greater than 0');
    }
    
    if (propertyData.rooms <= 0) {
      throw new Error('Maximum guests must be greater than 0');
    }

    
    return true;
  }

  export async function getPropertiesCollection(): Promise<Collection<Property>> {
    const db = await getDb();
    // console.log(db);
    return db.collection<Property>('properties');
  }
  
  export async function getAllProperties(userId?: string): Promise<Property[]> {
    const properties = await getPropertiesCollection();
    
    const query = userId ? { userId } : {};
    // console.log("query: ",query);
    return properties.find(query).toArray();
  }
  
  export async function getPropertyById(id: string): Promise<Property | null> {
    const properties = await getPropertiesCollection();
    // console.log("hurrrr: ",properties);
    return properties.findOne({ _id: new ObjectId(id) });
  }
  
  export async function createProperty(propertyData: Omit<Property, '_id' | 'createdAt' | 'updatedAt'>): Promise<Property> {
    try {
      // Validate property data
      validateProperty(propertyData as unknown as PropertyValidationInput);

      const properties = await getPropertiesCollection();
      
      const newProperty: Property = {
        ...propertyData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await properties.insertOne(newProperty);
      
      return {
        ...newProperty,
        _id: new ObjectId(result.insertedId.toString())
      };
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  }
  
  export async function updateProperty(id: string , propertyData: Partial<Property>): Promise<Property | null> {
    const properties = await getPropertiesCollection();
    
    await properties.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...propertyData,
          updatedAt: new Date()
        } 
      }
    );
    
    return getPropertyById(id);
  }
  
  export async function deleteProperty(id: string): Promise<boolean> {
    const properties = await getPropertiesCollection();
    const result = await properties.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }