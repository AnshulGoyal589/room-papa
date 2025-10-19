import React from 'react'

interface AboutPropertyProps {
    description?: string;
}

const AboutProperty: React.FC<AboutPropertyProps> = ({ description }) => {
  return (
    <div className="bg-white p-4 rounded-md border border-gray-200 mb-5">
        <h2 className="text-xl font-bold text-gray-800 mb-3">About this property</h2>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{description || "No detailed description available."}</p>
    </div>
  )
}

export default AboutProperty