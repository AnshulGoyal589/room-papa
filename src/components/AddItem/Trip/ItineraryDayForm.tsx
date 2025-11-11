// /components/trip-form/ItineraryDayForm.tsx

import React, { useState } from 'react';
import { FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, MapPin, Bed, Car, Image as ImageIcon } from 'lucide-react';
import MultipleImageUpload from '@/components/cloudinary/MultipleImageUpload';
import { Image } from '@/lib/mongodb/models/Components';
import { Accommodation, Destination, ItineraryDay, PlaceToVisit, TransportSegment, WithClientId } from '@/lib/mongodb/models/Trip';
import { ChipList } from '../Property/SharedUI';


// --- Helper to generate unique client-side IDs ---
const generateClientId = (): string => `client_${Math.random().toString(36).substring(2, 11)}`;

// --- Sub-component for Places To Visit ---
const PlacesManager = ({ places, onPlacesChange }: { places: WithClientId<PlaceToVisit>[], onPlacesChange: (p: WithClientId<PlaceToVisit>[]) => void }) => {
  const [newPlace, setNewPlace] = useState<PlaceToVisit>({ name: '', description: '', duration: '', location: { city: '', state: '', country: '' } });

  const handleAdd = () => {
    if (!newPlace.name.trim()) return alert("Place name is required.");
    onPlacesChange([...places, { ...newPlace, clientId: generateClientId() }]);
    setNewPlace({ name: '', description: '', duration: '', location: { city: '', state: '', country: '' } });
  };

  const handleRemove = (clientId: string) => {
    onPlacesChange(places.filter(p => p.clientId !== clientId));
  };

  return (
    <div className="space-y-3 p-3 border rounded-md bg-muted/50">
      <h5 className="font-semibold flex items-center"><MapPin className="h-4 w-4 mr-2"/>Places to Visit</h5>
      {places.map(p => (
        <div key={p.clientId} className="flex items-center justify-between text-sm bg-background p-2 rounded border">
          <div>
             <p className="font-medium">{p.name} ({p.duration || 'N/A'})</p>
             <p className="text-xs text-muted-foreground">{p.location?.city}, {p.location?.country}</p>
          </div>
          <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleRemove(p.clientId)}><Trash2 size={16}/></Button>
        </div>
      ))}
      <div className="space-y-2 pt-2 border-t">
          <p className="text-sm font-medium">Add New Place:</p>
          <Input placeholder="Place Name*" value={newPlace.name} onChange={e => setNewPlace(p => ({...p, name: e.target.value}))}/>
          <Input placeholder="Duration (e.g., 2 hrs)" value={newPlace.duration} onChange={e => setNewPlace(p => ({...p, duration: e.target.value}))}/>
          <Textarea placeholder="Description" value={newPlace.description} onChange={e => setNewPlace(p => ({...p, description: e.target.value}))}/>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="City" value={newPlace.location?.city} onChange={e => setNewPlace(p => ({...p, location: {...p.location as Destination, city: e.target.value}}))}/>
            <Input placeholder="State" value={newPlace.location?.state} onChange={e => setNewPlace(p => ({...p, location: {...p.location as Destination, state: e.target.value}}))}/>
            <Input placeholder="Country" value={newPlace.location?.country} onChange={e => setNewPlace(p => ({...p, location: {...p.location as Destination, country: e.target.value}}))}/>
          </div>
          {/* TODO: Add Single Image Uploader for place.image */}
          <Button onClick={handleAdd} className="w-full"><Plus className="h-4 w-4 mr-2"/>Add Place</Button>
      </div>
    </div>
  );
};

// --- Sub-component for Transport Segments ---
const TransportManager = ({ segments, onSegmentsChange }: { segments: WithClientId<TransportSegment>[], onSegmentsChange: (s: WithClientId<TransportSegment>[]) => void }) => {
    const [newSegment, setNewSegment] = useState<TransportSegment>({ mode: '', details: '', departureTime: '', arrivalTime: '' });

    const handleAdd = () => {
        if (!newSegment.mode?.trim()) return alert("Transport mode is required.");
        onSegmentsChange([...segments, { ...newSegment, clientId: generateClientId() }]);
        setNewSegment({ mode: '', details: '', departureTime: '', arrivalTime: '' });
    };
    
    const handleRemove = (clientId: string) => {
        onSegmentsChange(segments.filter(s => s.clientId !== clientId));
    };

    return (
        <div className="space-y-3 p-3 border rounded-md bg-muted/50">
            <h5 className="font-semibold flex items-center"><Car className="h-4 w-4 mr-2"/>Transport</h5>
            {segments.map(s => (
                <div key={s.clientId} className="flex items-center justify-between text-sm bg-background p-2 rounded border">
                    <div>
                        <p className="font-medium">{s.mode}: {s.details}</p>
                        <p className="text-xs text-muted-foreground">{s.departureTime} - {s.arrivalTime}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleRemove(s.clientId)}><Trash2 size={16}/></Button>
                </div>
            ))}
            <div className="space-y-2 pt-2 border-t">
                <p className="text-sm font-medium">Add New Transport:</p>
                <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Mode (e.g., Flight)" value={newSegment.mode} onChange={e => setNewSegment(s => ({...s, mode: e.target.value}))}/>
                    <Input placeholder="Details (e.g., AI-101)" value={newSegment.details} onChange={e => setNewSegment(s => ({...s, details: e.target.value}))}/>
                    <FormItem>
                        <FormLabel className="text-xs">Departure Time</FormLabel>
                        <Input type="time" value={newSegment.departureTime} onChange={e => setNewSegment(s => ({...s, departureTime: e.target.value}))}/>
                    </FormItem>
                    <FormItem>
                        <FormLabel className="text-xs">Arrival Time</FormLabel>
                        <Input type="time" value={newSegment.arrivalTime} onChange={e => setNewSegment(s => ({...s, arrivalTime: e.target.value}))}/>
                    </FormItem>
                </div>
                <Button onClick={handleAdd} className="w-full"><Plus className="h-4 w-4 mr-2"/>Add Transport</Button>
            </div>
        </div>
    );
}

// --- Sub-component for Accommodation ---
const AccommodationManager = ({ accommodation, onAccommodationChange }: { accommodation: Accommodation | null | undefined, onAccommodationChange: (a: Accommodation | null) => void }) => {
    const handleAccommodationChange = (field: keyof Accommodation, value: string) => {
        onAccommodationChange({ ...(accommodation || {}), [field]: value });
    };

    return (
        <div className="space-y-3 p-3 border rounded-md bg-muted/50">
            <div className="flex justify-between items-center">
                <h5 className="font-semibold flex items-center"><Bed className="h-4 w-4 mr-2"/>Accommodation</h5>
                {accommodation && <Button variant="ghost" size="sm" onClick={() => onAccommodationChange(null)}>Clear</Button>}
            </div>
            {accommodation ? (
                <div className="space-y-2">
                    <Input placeholder="Hotel Name" value={accommodation.name || ''} onChange={e => handleAccommodationChange('name', e.target.value)}/>
                    <Input placeholder="Hotel Address" value={accommodation.address || ''} onChange={e => handleAccommodationChange('address', e.target.value)}/>
                    <Input placeholder="Hotel ID (from DB, optional)" value={String(accommodation.hotelId || '')} onChange={e => handleAccommodationChange('hotelId', e.target.value)}/>
                    {/* TODO: Add single image uploader for accommodation.image */}
                </div>
            ) : (
                <Button variant="outline" className="w-full" onClick={() => onAccommodationChange({name: ''})}>Add Accommodation</Button>
            )}
        </div>
    );
};

// --- Main Itinerary Day Form ---
interface ItineraryDayFormProps {
  dayData: ItineraryDay;
  onSave: (dayData: ItineraryDay) => void;
  onCancel: () => void;
}

const ItineraryDayForm: React.FC<ItineraryDayFormProps> = ({ dayData, onSave, onCancel }) => {
  const [day, setDay] = useState<ItineraryDay>(dayData);
  const [newActivity, setNewActivity] = useState('');
  const [newMeal, setNewMeal] = useState('');

  const handleSimpleChange = (field: 'title' | 'overview' | 'notes', value: string) => {
    setDay(prev => ({...prev, [field]: value}));
  };
  
  const handleDateChange = (dateString: string) => {
      setDay(prev => ({...prev, date: new Date(dateString)}));
  }

  const handleAddItemToList = (listKey: 'activities' | 'meals', item: string, setItem: React.Dispatch<React.SetStateAction<string>>) => {
      if(!item.trim()) return;
      setDay(prev => ({...prev, [listKey]: [...(prev[listKey] || []), item.trim()]}));
      setItem('');
  }

  return (
    <div className="p-4 bg-muted/30 border rounded-lg space-y-6 mt-6 animate-fade-in">
      <h4 className="text-lg font-semibold text-foreground">
        {dayData.title ? 'Editing' : 'Adding'} Day {day.dayNumber}
      </h4>
      
      {/* --- Basic Details --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem>
          <FormLabel>Title*</FormLabel>
          <Input value={day.title || ''} onChange={e => handleSimpleChange('title', e.target.value)} placeholder="e.g., Arrival and Exploration" />
        </FormItem>
        <FormItem>
          <FormLabel>Date</FormLabel>
          <Input type="date" value={day.date ? day.date.toISOString().split('T')[0] : ''} onChange={e => handleDateChange(e.target.value)} />
        </FormItem>
      </div>
      <FormItem>
        <FormLabel>Overview*</FormLabel>
        <Textarea value={day.overview || ''} onChange={e => handleSimpleChange('overview', e.target.value)} placeholder="Summary of the day's events." />
      </FormItem>

      {/* --- Activities & Meals --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
            <FormLabel>Activities</FormLabel>
            <div className="flex gap-2"><Input value={newActivity} onChange={e => setNewActivity(e.target.value)} placeholder="e.g., Sightseeing tour"/><Button onClick={() => handleAddItemToList('activities', newActivity, setNewActivity)}>Add</Button></div>
            <ChipList items={day.activities || []} onRemove={item => setDay(d => ({...d, activities: d.activities?.filter(a => a !== item)}))}/>
        </div>
        <div className="space-y-2">
            <FormLabel>Meals Included</FormLabel>
            <div className="flex gap-2"><Input value={newMeal} onChange={e => setNewMeal(e.target.value)} placeholder="e.g., Breakfast"/><Button onClick={() => handleAddItemToList('meals', newMeal, setNewMeal)}>Add</Button></div>
            <ChipList items={day.meals || []} onRemove={item => setDay(d => ({...d, meals: d.meals?.filter(m => m !== item)}))}/>
        </div>
      </div>

      {/* --- Complex Field Managers --- */}
      <PlacesManager 
        places={day.placesToVisit || []}
        onPlacesChange={(newPlaces) => setDay(prev => ({...prev, placesToVisit: newPlaces}))}
      />
      <TransportManager 
        segments={day.transport || []}
        onSegmentsChange={(newSegments) => setDay(prev => ({...prev, transport: newSegments}))}
      />
      <AccommodationManager
        accommodation={day.accommodation}
        onAccommodationChange={(newAccommodation) => setDay(prev => ({...prev, accommodation: newAccommodation}))}
      />

      {/* --- Day Gallery --- */}
       <div className="space-y-2 pt-2 border-t">
            <FormLabel className="flex items-center"><ImageIcon className="h-4 w-4 mr-2"/>Day-Specific Images</FormLabel>
            <MultipleImageUpload 
                label="Day Images"
                value={day.images || []} 
                onChange={(images: Image[]) => setDay(prev => ({...prev, images}))}
                maxImages={5}
            />
       </div>

      {/* --- Notes --- */}
      <FormItem>
        <FormLabel>Notes (Optional)</FormLabel>
        <Textarea value={day.notes || ''} onChange={e => handleSimpleChange('notes', e.target.value)} placeholder="Tips, warnings, or extra info." />
      </FormItem>

      {/* --- Actions --- */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="button" onClick={() => onSave(day)}>Save Day {day.dayNumber}</Button>
      </div>
    </div>
  );
};

export default ItineraryDayForm;