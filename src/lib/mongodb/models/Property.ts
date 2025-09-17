

import { Collection, ObjectId } from 'mongodb';
import { getDb } from '..';
import {  PropertyAmenities, PropertyType } from '@/types';
import { StoredRoomCategory } from '@/types/booking';
import { Costing, Image, Location, Review } from './Components';


export interface Property {
  _id?: ObjectId;
  userId?: string;
  title?: string;
  description?: string;
  type: PropertyType;
  location: Location;
  startDate: string;
  endDate: string;
  costing: Costing;
  totalRating?: number;
  review?: Review[];
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
    location: Location;
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
  
// import { ObjectId } from 'mongodb'; // <-- Make sure this import is present

// Assuming you have these types and functions defined elsewhere
// type Property = { _id: ObjectId; name: string; /* ...other fields */ updatedAt: Date; };
// async function getPropertiesCollection(): Promise<Collection<Property>> { /* ... */ }

export async function updateProperty(id: string, propertyData: Partial<Property>): Promise<Property | null> {
  
  // --- Safety Check 1: Validate the ID format ---
  if (!ObjectId.isValid(id)) {
    console.error("Invalid ID format provided:", id);
    return null; // Or throw a specific error
  }

  const properties = await getPropertiesCollection();

  // --- Safety Check 2: Prevent updating the immutable _id ---
  // It's good practice to ensure the _id is not part of the update payload.
  const updatePayload = { ...propertyData };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (updatePayload as any)._id; // Use 'as any' to bypass TypeScript strictness here

  try {
    const result = await properties.findOneAndUpdate(
      { _id: new ObjectId(id) }, // The filter to find the document
      {
        $set: {
          ...updatePayload,
          updatedAt: new Date()
        }
      },
      {
        // This option is crucial: it tells MongoDB to return the document *after* the update has been applied.
        // The default is to return the document *before* the update.
        returnDocument: 'after' 
      }
    );

    // findOneAndUpdate returns the modified document object, or null if no document was found.
    // In driver v3, the result was in `result.value`. In v4+, it's the top-level return.
    // The code below works for modern versions of the driver.
    return result;

  } catch (error) {
    console.error("Failed to update property:", error);
    // Depending on your app's needs, you might re-throw the error or return null
    throw new Error("Database update failed.");
  }
}

  export async function deleteProperty(id: string): Promise<boolean> {
    const properties = await getPropertiesCollection();
    const result = await properties.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }