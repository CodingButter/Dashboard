import React, { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  initialCollapsed?: boolean;
}

export default function CollapsibleSection({
  title,
  children,
  initialCollapsed = false
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  return (
    <div className="mb-4 border-b border-gray-700 pb-1">
      <div 
        className="flex justify-between items-center cursor-pointer mb-1 py-2"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="text-sm font-bold text-blue-400">{title}</h3>
        <button className="text-gray-400 focus:outline-none">
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          )}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="mt-2 mb-4">
          {children}
        </div>
      )}
    </div>
  );
}