export function Footer() {
    const currentYear = new Date().getFullYear();
  
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
          { name: 'Terms of Service', href: '/terms' },
          { name: 'Privacy Policy', href: '/privacy' },
          { name: 'Cookies', href: '/cookies' }
        ]
      }
    ];
  
    return (
      <footer className="bg-gray-100 py-12">
        <div className="container mx-auto grid md:grid-cols-4 gap-8 px-4">
          
          <div>
            <h2 className="text-2xl font-bold text-[#003c95] mb-4">Room Papa</h2>
            <p className="text-gray-600">
              Your trusted partner in creating unforgettable travel experiences.
            </p>
          </div>
  
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-gray-600 hover:text-[#003c95] transition"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
  
          <div>
            <h3 className="font-semibold mb-4">Stay Updated</h3>
            <form className="flex flex-col space-y-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#003c95]"
              />
              <button 
                type="submit" 
                className="bg-[#003c95] text-white px-4 py-2 rounded-md hover:bg-[#003c95] transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
  
        <div className="border-t mt-8 py-4 text-center">
          <p className="text-gray-600">
            © {currentYear} Room Papa. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }