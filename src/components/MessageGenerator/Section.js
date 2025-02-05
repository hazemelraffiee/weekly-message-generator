import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const Section = ({ 
  icon: Icon,  // Lucide icon component
  iconColorClass = "text-blue-400", // Tailwind color class for the icon
  iconBgClass = "bg-blue-900/30", // Background color for icon container
  title,
  collapsible = false,
  defaultExpanded = true,
  rightElement, // Optional element to show on the right side of header
  className = "", // Additional classes for the main container
  children 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <section className={`rounded-lg border border-gray-700 bg-gray-800 shadow-sm overflow-hidden mb-4 ${className}`}>
      <header 
        className={`flex items-center gap-3 p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-750 ${
          collapsible ? 'cursor-pointer hover:bg-gray-750' : ''
        }`}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3 flex-1">
          {Icon && (
            <div className={`p-2 rounded-lg ${iconBgClass}`}>
              <Icon className={`h-5 w-5 ${iconColorClass}`} />
            </div>
          )}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {rightElement}
          {collapsible && (
            <ChevronDown 
              className={`h-5 w-5 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`} 
            />
          )}
        </div>
      </header>

      {(!collapsible || isExpanded) && (
        <div className="transition-all duration-200">
          {children}
        </div>
      )}
    </section>
  );
};

export default Section;