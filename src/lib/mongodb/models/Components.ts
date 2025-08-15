export interface Location{
    address: string;
    state: string;
    city: string;
    country: string;
}
export interface Costing {
    price: number;
    discountedPrice: number;
    currency: string;
}
export interface Image {
  url: string;
  publicId?: string;
  alt?: string;
}
