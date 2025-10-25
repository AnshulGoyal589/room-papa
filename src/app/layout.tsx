import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ClerkProvider } from '@clerk/nextjs';
import RoleProtection from "@/components/auth/RoleProtection";
import { Header } from "@/components/layout/Header";

// Force dynamic rendering to prevent build-time issues with Clerk
export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://roompapa.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  
  title: {
    template: '%s | Room Papa - Find & Book Hotels, Apartments & More',
    default: 'Room Papa | Find & Book Hotels, Apartments & Vacation Rentals Online',
  },
  
  description: 'Discover and book the best hotels, apartments, vacation rentals, and unique accommodations with Room Papa. Compare prices, read reviews, and enjoy secure booking with instant confirmation. Your perfect stay is just a click away!',

  keywords: [
    "hotel booking online",
    "apartment rentals",
    "vacation rentals",
    "accommodation booking",
    "travel deals",
    "room papa",
    "roompapa",
    "budget hotels",
    "luxury accommodations",
    "short term rentals",
    "holiday homes",
    "business travel",
    "family friendly hotels",
    "last minute deals",
    "weekend getaways",
    "city breaks",
    "beach resorts",
    "mountain cabins",
    "urban apartments",
    "boutique hotels",
    "homestays",
    "extended stays",
    "pet friendly accommodations",
    "accessible hotels",
    "eco friendly stays",
    "unique accommodations",
    "instant booking confirmation",
    "secure online booking",
    "travel insurance",
    "24/7 customer support",
    "book hotel India",
    "cheap hotels India",
    "best hotels in Mumbai",
    "hotels in Delhi",
    "Bangalore apartment rentals",
    "serviced apartments India",
    "homestay Kerala",
    "Goa beach cottages",
    "Jaipur heritage hotels",
    "houseboats in Kerala",
    "honeymoon packages India",
    "long term rentals India",
    "monthly rentals India",
    "student accommodation India",
    "corporate stays India",
    "airport hotels India",
    "villa rentals India",
    "resort bookings India",
    "discount hotel deals India",
    "compare hotel prices India",
    "verified listings India",
    "instant confirmation bookings",
    "flexible cancellation",
    "refundable bookings",
    "secure payment gateway India",
    "UPI hotel booking",
    "mobile booking app",
    "best price guarantee",
    "group bookings India",
    "event accommodation India",
    "relocation housing India",
    "co-living spaces India",
    "hostel bookings India",
    "budget stays India",
    "luxury resorts India",
    "eco resorts India",
    "pet friendly hotels India",
    "family rooms India",
    "wheelchair accessible hotels India",
    "regional language support Hindi",
    "regional language support Tamil",
    "regional language support Telugu",
    "INR pricing",
    "GST invoice booking",
    "corporate travel portal India",
    "last minute hotel deals India",
    "weekend staycation India",
    "popular destinations India",
    "book apartment near me India",
    "beach resorts Goa",
    "mountain retreats India",
    "backpacker stays India",
    "verified hosts India",
    "trusted accommodation platform",
    "travel booking India",
    "holiday rentals India"
  ],

  // Enhanced author and publisher information
  authors: [{ name: 'Room Papa Team' }],
  creator: 'Room Papa',
  publisher: 'Room Papa',
  
  // Category for better content classification
  category: 'Travel & Tourism',

  // Canonical + hreflang for India
  alternates: {
    canonical: siteUrl,
    languages: {
      'en-IN': siteUrl,
      'x-default': siteUrl,
    },
  },

  // Set OG locale to India
  openGraph: {
    title: 'Room Papa | Find & Book Hotels, Apartments & More',
    description: 'Discover amazing accommodations worldwide. Book hotels, apartments, and vacation rentals with confidence. Best prices guaranteed!',
    url: siteUrl,
    siteName: 'Room Papa',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/assets/logo.jpg`,
        width: 1200,
        height: 630,
        alt: 'Room Papa - Your Ultimate Booking Companion',
        type: 'image/jpeg',
      },
      {
        url: `${siteUrl}/assets/logo.jpg`,
        width: 800,
        height: 600,
        alt: 'Room Papa Logo',
        type: 'image/jpeg',
      },
    ],
  },

  // Enhanced Twitter Card metadata
  twitter: {
    card: 'summary_large_image',
    title: 'Room Papa | Find & Book Hotels, Apartments & More',
    description: 'Discover amazing accommodations worldwide. Book with confidence!',
    creator: '@roompapa',
    site: '@roompapa',
    images: [`${siteUrl}/assets/logo.jpg`],
  },

  // Comprehensive icons configuration
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
    shortcut: '/favicon.ico',
  },

  // App-specific metadata
  applicationName: 'Room Papa',
  referrer: 'origin-when-cross-origin',
  
  // Enhanced verification (add your actual codes)
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || '',
    yandex: process.env.YANDEX_VERIFICATION || '',
    yahoo: process.env.YAHOO_VERIFICATION || '',
    other: {
      'msvalidate.01': process.env.BING_SITE_VERIFICATION || '',
    },
  },

  // Comprehensive robots configuration
  robots: {
    index: true,
    follow: true,
    noarchive: false,
    nosnippet: false,
    noimageindex: false,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Additional metadata for better SEO
  classification: 'Travel, Tourism, Hospitality, Accommodation',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "Room Papa",
    "description": "Find and book the best hotels, apartments, vacation rentals, and unique accommodations worldwide",
    "url": "https://roompapa.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://roompapa.com/assets/logo.jpg",
      "width": 1200,
      "height": 630
    },
    "sameAs": [
      // "https://www.facebook.com/roompapa",
      // "https://www.twitter.com/roompapa",
      "https://www.instagram.com/roompapa.com1",
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-800-ROOMPAPA",
      "contactType": "customer service",
      "availableLanguage": "English"
    },
    "inLanguage": "en-IN",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN"
    },
    "areaServed": "IN",
    "serviceType": "Hotel Booking, Vacation Rental Booking, Travel Accommodation",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://roompapa.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <ClerkProvider>
      {/* Set document language to India */}
      <html lang="en-IN" itemScope itemType="https://schema.org/TravelAgency">
        <head>
          {/* Robots stays indexable */}
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

          {/* Geo targeting for India */}
          <meta httpEquiv="content-language" content="en-IN" />
          <meta name="geo.region" content="IN" />
          <meta name="geo.placename" content="India" />
          <meta name="geo.position" content="20.5937;78.9629" />
          <meta name="ICBM" content="20.5937, 78.9629" />

          {/* Additional SEO meta tags */}
          <meta name="theme-color" content="#2563eb" />
          <meta name="msapplication-TileColor" content="#2563eb" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="format-detection" content="telephone=no" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          
          {/* Preconnect to external domains for performance */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://res.cloudinary.com" />
          
          {/* DNS prefetch for external resources */}
          <link rel="dns-prefetch" href="//www.google-analytics.com" />
          <link rel="dns-prefetch" href="//www.googletagmanager.com" />
          
          {/* Structured Data JSON-LD */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData),
            }}
          />
          
          {/* Manifest for PWA capabilities */}
          <link rel="manifest" href="/manifest.json" />
          
          {/* Additional favicon formats */}
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="alternate icon" href="/favicon.ico" />
          <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#2563eb" />
        </head>
        <body 
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          itemScope 
          itemType="https://schema.org/WebPage"
        >
          <RoleProtection>
            <Header />
            <main className="flex-grow" role="main" itemScope itemType="https://schema.org/WebPageElement">
              {children}
            </main>
            <Footer />
          </RoleProtection>
        </body>
      </html>
    </ClerkProvider>
  );
}