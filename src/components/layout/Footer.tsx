import Image from 'next/image';

/**
 * Compact, Professional, Single-Row Footer Component, including all data points for all users.
 */
export function Footer() {
    const currentYear = new Date().getFullYear();

    // --- All Contact Data is now static and visible to everyone ---
    const phones = ['7807154322', '8091954322'];
    
    // The contactEmails array is now hardcoded with all possible options
    const contactEmails = [
        { 
            name: 'Partner Inquiries', 
            email: 'partner@roompapa.com' 
        },
        { 
            name: 'Support & Help', 
            email: 'help@roompapa.com' 
        }
    ];

    const footerLinks = [
        {
            title: 'Company',
            links: [
                { name: 'About Us', href: '/about' },
                { name: 'Careers', href: '/careers' },
                { name: 'Press', href: '/press' }
            ]
        },
        {
            title: 'Support',
            links: [
                { name: 'Help Center', href: '/help' },
                { name: 'Contact Us', href: '/contact' },
                { name: 'FAQ', href: '/faq' }
            ]
        },
        {
            title: 'Legal',
            links: [
                { name: 'Terms', href: '/terms' },
                { name: 'Privacy', href: '/privacy' },
                { name: 'Cookies', href: '/cookies' }
            ]
        }
    ];

    // Styling constants
    const primaryColor = 'text-[#003c95]';
    const hoverColor = 'hover:text-[#003c95]';
    // Smallest headings and text for compactness
    const headingStyle = `text-xl font-bold ${primaryColor} mb-3 tracking-wider uppercase`;
    const linkTextStyle = "text-gray-600 text-xs sm:text-sm";


    return (
        <footer className="bg-gray-100 py-8 border-t border-gray-200">
            <div className="container mx-auto px-6 lg:px-8">
                
                {/* Main Content Grid: Single row on medium screens and up */}
                <div className="grid grid-cols-2 md:grid-cols-7 gap-y-6 md:gap-x-4 lg:gap-x-8 pb-8">
                    
                    {/* Column 1: Brand Info & Logo */}
                    <div className="col-span-2 md:col-span-2 flex flex-col items-start">
                        
                        <Image 
                            src="/assets/logo.jpg" 
                            alt="Room Papa Logo" 
                            width={80} // Small logo size
                            height={40} 
                            className="mb-2 object-contain h-auto w-auto" 
                        />
                        
                        <p className="text-gray-500 text-xs leading-tight max-w-[150px] mt-1">
                            Your trusted partner for travel excellence and comfort.
                        </p>
                    </div>

                    {/* Columns 2, 3, 4: Navigation Links */}
                    {footerLinks.map((section) => (
                        <div key={section.title} className="col-span-1">
                            <h3 className={headingStyle}>
                                {section.title}
                            </h3>
                            <ul className="space-y-1.5 list-none p-0">
                                {section.links.map((link) => (
                                    <li key={link.name}>
                                        <a 
                                            href={link.href} 
                                            className={`${linkTextStyle} ${hoverColor} transition duration-300 block`}
                                        >
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Column 5: Comprehensive Contact Information Block */}
                    <div className="col-span-2 md:col-span-2">
                        <h3 className={headingStyle}>
                            Contact & HQ
                        </h3>

                        {/* Addresses - Tightly packed */}
                        <div className="mb-4">
                            <p className="font-bold text-[14px] text-gray-800 uppercase mb-1">Office Locations:</p>
                            <p className="text-[13px] text-gray-600 leading-snug">
                                Manali: Manali Circuit House road, 175131 H.P.
                            </p>
                            <p className="text-[13px] text-gray-600 leading-snug">
                                Delhi: 211, Green Park, 110016 New Delhi
                            </p>
                        </div>
                        
                        {/* Phones - Tightly packed in a grid/flex for horizontal space saving */}
                        <div className="mb-4">
                            <h4 className="font-bold text-[14px] text-gray-800 uppercase mb-1">Customer Care:</h4>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                {phones.map((phone) => (
                                    <a
                                        key={phone}
                                        href={`tel:${phone}`}
                                        className="text-[13px] text-gray-600 hover:text-[#003c95] transition font-medium"
                                    >
                                        {phone}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Emails - Tightly packed */}
                        <div>
                            <h4 className="font-bold text-[14px] text-gray-800 uppercase mb-1">Email Channels:</h4>
                            <ul className="space-y-1 text-[13px] list-none p-0">
                                {contactEmails.map((item) => (
                                    <li key={item.email}>
                                        <a
                                            href={`mailto:${item.email}`}
                                            className="text-gray-600 hover:text-[#003c95] transition font-medium break-words"
                                        >
                                            {item.email}
                                        </a>
                                        {/* Extremely subtle indication of role */}
                                        <span className="text-gray-500 text-[10px] ml-1">({item.name})</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Copyright Section */}
                <div className="border-t border-gray-300 mt-4 pt-4 text-center">
                    <p className="text-gray-500 text-xs">
                        © {currentYear} Room Papa. All rights reserved. 
                    </p>
                </div>
            </div>
        </footer>
    );
}