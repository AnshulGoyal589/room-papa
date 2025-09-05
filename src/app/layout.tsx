import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ClerkProvider } from '@clerk/nextjs';
import RoleProtection from "@/components/auth/RoleProtection";

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Use a template to automatically add your brand name to page titles
  title: {
    template: '%s | Room Papa', // %s will be replaced by the title of individual pages
    default: 'Room Papa | Find & Book Hotels, Apartments & More', // Default title for the homepage
  },
  description: 'Find the best deals on hotels, apartments, vacation rentals, and more with Room Papa. Book your next stay with confidence and save on your travel.',

  // More specific metadata for your niche
  keywords: ['hotel booking', 'apartments', 'vacation rentals', 'travel deals', 'room booking', 'accommodation'],

  // Set the canonical URL for your homepage to prevent duplicate content issues
  alternates: {
    canonical: siteUrl,
  },

  // Open Graph (for social media sharing - Facebook, LinkedIn, etc.)
  openGraph: {
    title: 'Room Papa | Find & Book Hotels, Apartments & More',
    description: 'Find great deals on hotels, apartments, and unique places to stay.',
    url: siteUrl,
    siteName: 'Room Papa',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/assets/logo.jpg`,
        width: 1200,
        height: 630,
        alt: 'Room Papa - Your Ultimate Booking Companion',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // Twitter Card (for sharing on Twitter)
  twitter: {
    card: 'summary_large_image',
    title: 'Room Papa | Find & Book Hotels, Apartments & More',
    description: 'Find great deals on hotels, apartments, and unique places to stay.',
    // images: [`${siteUrl}/twitter-image.png`], // Create this image and place it in your `public` folder
  },

  // Favicons and icons
  // icons: {
  //   icon: '/favicon.ico',
  //   shortcut: '/favicon-16x16.png',
  //   apple: '/apple-touch-icon.png',
  // },

  // Helps search engines verify your site ownership
  verification: {
    google: 'googlee24569a7061b9a85.html', // Add your Google Search Console code here
  },

  // Instructs search engine crawlers
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <RoleProtection>
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
        </RoleProtection>
        </body>
      </html>
    </ClerkProvider>
  );
}