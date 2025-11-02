

import { Collection, ObjectId } from 'mongodb';
import { getDb } from '..';
import { Costing, Image, Location, Review } from './Components';
import { HouseRules, PropertyAmenities, propertyAmenitiesArray, PropertyType } from '@/types/property';
import { RoomCategory } from '@/types/property';

export interface Property {
  _id?: ObjectId;
  accessibility?: string[];
  amenities: string[];
  bannerImage?: Image;
  bedPreference?: string[];
  brands?: string[];
  categoryRooms?: RoomCategory[];
  costing: Costing;
  createdAt?: Date;
  description?: string;
  detailImages?: Image[];
  facilities?: string[];
  funThingsToDo?: string[];
  googleMaps?: string;
  houseRules?: HouseRules;
  location: Location;
  meals?: string[];
  offers?: string[];
  popularFilters?: string[];
  propertyRating?: number;
  priority?: number;
  reservationPolicy?: string[];
  review?: Review[];
  roomAccessibility?: string[];
  roomFacilities?: string[];
  rooms: number;
  title?: string;
  totalRating?: number;
  type: PropertyType;
  updatedAt?: Date;
  userId?: string;
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
    const validPropertyTypes: PropertyType[] = ['hotel', 'apartment', 'villa', 'hostel', 'resort' , 'cottage', 'homestay'];
    if (!validPropertyTypes.includes(propertyData.type as PropertyType)) {
      throw new Error(`Invalid property type. Must be one of: ${validPropertyTypes.join(', ')}`);
    }
    
    // Validate amenities
    const validAmenities: PropertyAmenities[] = Array.from(propertyAmenitiesArray);
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
    return db.collection<Property>('properties');
  }
  
  export async function getAllProperties(): Promise<Property[]> {
    const properties = await getPropertiesCollection();
    return properties.find({}).toArray();
  }
  export async function getAllUploaderProperties(userId: string): Promise<Property[]> {
    const properties = await getPropertiesCollection();
    if(!userId){
      return properties.find({}).toArray();
    }
    return properties.find({ userId }).toArray();
  }
  
  export async function getPropertyById(id: string): Promise<Property | null> {
    const properties = await getPropertiesCollection();
    return properties.findOne({ _id: new ObjectId(id) });
  }

  export async function addPropertyReview(propertyId: string, review: Review): Promise<void> {
    const properties = await getPropertiesCollection();
    await properties.updateOne(
      { _id: new ObjectId(propertyId) },
      {
        $push: { review: review },
        $inc: { totalRating: review.rating }
      }
    );
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

  export async function checkReviewStatus(PropertyId: string, userId: string): Promise<boolean> {
    const properties = await getPropertiesCollection();
    const property = await properties.findOne({ _id: new ObjectId(PropertyId), 'review.userId': userId });
    return !!property;
  }