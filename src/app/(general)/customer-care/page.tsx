// app/customer-care/page.tsx
'use client'; // This page uses client-side interactivity (useState, useEffect)

import { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { ChevronDown, ChevronUp, Search, MessageSquare, Phone, HelpCircle } from 'lucide-react';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  keywords?: string[];
}

const faqsData: FAQItem[] = [
  {
    id: 1,
    question: 'How do I cancel my booking?',
    answer: 'To cancel your booking, please log in to your account, go to "My Bookings", find the relevant booking, and click "Cancel Booking". Please note that cancellation policies vary depending on the property and rate type. Some bookings may be non-refundable or incur a cancellation fee.',
    category: 'Bookings',
    keywords: ['cancel', 'reservation', 'modify']
  },
  {
    id: 2,
    question: 'Can I change the dates of my booking?',
    answer: 'Modifying booking dates depends on the property\'s availability and policies. Go to "My Bookings", select your booking, and look for a "Change Dates" option. If not available, you may need to cancel and rebook, or contact customer support for assistance.',
    category: 'Bookings',
    keywords: ['change', 'modify', 'dates', 'amend']
  },
  {
    id: 3,
    question: 'What payment methods are accepted?',
    answer: 'We accept a wide range of payment methods, including major credit cards (Visa, MasterCard, American Express), PayPal, and sometimes local payment options depending on the region. The accepted methods will be displayed during the checkout process.',
    category: 'Payments',
    keywords: ['payment', 'credit card', 'paypal']
  },
  {
    id: 4,
    question: 'How do I find my booking confirmation?',
    answer: 'Your booking confirmation is sent to the email address you provided during booking. You can also find it in your account under "My Bookings". If you can\'t find it, please check your spam folder or contact us.',
    category: 'Bookings',
    keywords: ['confirmation', 'email', 'receipt']
  },
  {
    id: 5,
    question: 'Is my personal information secure?',
    answer: 'Yes, we take data security very seriously. We use industry-standard encryption and security protocols to protect your personal information. For more details, please read our Privacy Policy.',
    category: 'Account & Security',
    keywords: ['security', 'privacy', 'data', 'protection']
  },
  {
    id: 6,
    question: 'How do I contact customer support?',
    answer: 'You can contact our customer support team via the "Contact Us" section on our website, by phone, or through live chat when available. We are here to help you 24/7.',
    category: 'Support',
    keywords: ['contact', 'help', 'support', 'assistance']
  },
];

const CustomerCarePage: NextPage = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredFAQs, setFilteredFAQs] = useState<FAQItem[]>(faqsData);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const toggleFAQ = (id: number) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  useEffect(() => {
    let newFilteredFAQs = faqsData;

    if (activeCategory !== 'All') {
      newFilteredFAQs = newFilteredFAQs.filter(faq => faq.category === activeCategory);
    }

    if (searchTerm.trim() !== '') {
      newFilteredFAQs = newFilteredFAQs.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (faq.keywords && faq.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }
    setFilteredFAQs(newFilteredFAQs);
  }, [searchTerm, activeCategory]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent page reload
    // Search is already live, but you could add specific submit logic here if needed
  };

  const categories = ['All', ...new Set(faqsData.map(faq => faq.category))];

  return (
    <>
      <Head>
        <title>Customer Service | Booking.com Style</title>
        <meta name="description" content="Get help with your bookings and account." />
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Header Section - Booking.com Blue */}
        <header className="bg-[#003580] text-white p-6 shadow-md">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-3xl font-bold">Customer Service Help</h1>
            <p className="mt-1 text-blue-200">Find answers to your questions and get support.</p>
          </div>
        </header>

        <main className="container mx-auto max-w-6xl p-4 sm:p-6 md:p-8">
          {/* Search Bar Section */}
          <section className="mb-8 p-6 bg-white rounded-lg shadow-lg">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-grow w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for help (e.g. 'cancel booking')"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0071c2] focus:border-[#0071c2] outline-none transition-colors"
                />
              </div>
              {/* <button 
                type="submit"
                className="w-full sm:w-auto bg-[#0071c2] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#00589a] transition-colors"
              >
                Search
              </button> */}
              {/* Search is live, so submit button is optional */}
            </form>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Sidebar for Categories / Other Help */}
            <aside className="md:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Help Topics</h3>
                <ul className="space-y-2">
                  {categories.map(category => (
                    <li key={category}>
                      <button
                        onClick={() => setActiveCategory(category)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                          activeCategory === category
                            ? 'bg-[#e6f2ff] text-[#003580] font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {category} ({category === 'All' ? faqsData.length : faqsData.filter(f => f.category === category).length})
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Still need help?</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="flex items-center text-[#0071c2] hover:underline">
                      <MessageSquare size={20} className="mr-2" /> Contact Us
                    </a>
                  </li>
                  <li>
                    <a href="#" className="flex items-center text-[#0071c2] hover:underline">
                      <Phone size={20} className="mr-2" /> Call Support
                    </a>
                  </li>
                   {/* <li>
                    <a href="#" className="flex items-center text-[#0071c2] hover:underline">
                      <BookOpen size={20} className="mr-2" /> Our Travel Articles
                    </a>
                  </li> */}
                </ul>
              </div>
            </aside>

            {/* FAQ List Section */}
            <section className="md:col-span-3">
              {filteredFAQs.length > 0 ? (
                <div className="space-y-4">
                  {filteredFAQs.map((faq) => (
                    <div key={faq.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <button
                        onClick={() => toggleFAQ(faq.id)}
                        className="w-full flex justify-between items-center p-4 sm:p-5 text-left text-gray-800 hover:bg-gray-50 focus:outline-none focus:bg-gray-100 transition-colors"
                      >
                        <span className="font-semibold text-base sm:text-lg">{faq.question}</span>
                        {openFAQ === faq.id ? (
                          <ChevronUp size={24} className="text-[#0071c2]" />
                        ) : (
                          <ChevronDown size={24} className="text-gray-500" />
                        )}
                      </button>
                      {openFAQ === faq.id && (
                        <div className="p-4 sm:p-5 border-t border-gray-200 bg-gray-50">
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                  <HelpCircle size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No FAQs found</h3>
                  <p className="text-gray-500">Try adjusting your search term or category.</p>
                </div>
              )}
            </section>
          </div>
        </main>

        {/* Footer - Simplified */}
        <footer className="mt-12 py-8 bg-gray-800 text-gray-300 text-center">
          <div className="container mx-auto">
            <p>© {new Date().getFullYear()} RoomPapa. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default CustomerCarePage;