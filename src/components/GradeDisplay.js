import React, { useState, useRef } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import useClickOutside from '@/hooks/useClickOutside';

const germanGrades = [
  1.0, 1.3, 1.5, 1.7,
  2.0, 2.3, 2.5, 2.7,
  3.0, 3.3, 3.5, 3.7,
  4.0, 5.0, 6.0
];

// This function converts a grade to a color using a gradient scale
const getGradeColor = (grade, system, min, max) => {
  // For invalid grades, return a neutral color
  if (!grade) return 'bg-gray-800/50';
  
  // Special case for German grade 6.0 - indicate deletion possibility
  if (system === 'german' && grade === 6.0) {
    return 'bg-red-500/40 text-red-200'; // More intense red to indicate deletion zone
  }

  // Convert the grade to a percentage for color calculation
  let percentage;
  if (system === 'german') {
    percentage = (6 - grade) / 5 * 100; // Adjusted for 1.0-6.0 range
  } else {
    percentage = (max - grade) / (max - min) * 100;
  }

  // Rest of the color ranges remain the same
  if (percentage >= 80) {
    return 'bg-green-500/30 text-green-200';
  } else if (percentage >= 60) {
    return 'bg-green-600/20 text-green-300';
  } else if (percentage >= 40) {
    return 'bg-yellow-500/20 text-yellow-200';
  } else if (percentage >= 20) {
    return 'bg-orange-500/20 text-orange-200';
  } else {
    return 'bg-red-500/20 text-red-200';
  }
};

// Helper function for German grades remains the same
const getNextGermanGrade = (current, direction) => {
  const currentIndex = germanGrades.indexOf(Number(current));
  
  // Special case: if we're already at 6.0 and trying to go worse (down)
  if (current === 6.0 && direction === 'down') {
    return null; // This will trigger grade deletion
  }
  
  if (currentIndex === -1) {
    const closest = germanGrades.reduce((prev, curr) => {
      return Math.abs(curr - current) < Math.abs(prev - current) ? curr : prev;
    });
    return closest;
  }

  const newIndex = direction === 'up'
    ? Math.max(0, currentIndex - 1)
    : Math.min(germanGrades.length - 1, currentIndex + 1);

  return germanGrades[newIndex];
};

const GradeDisplay = ({
  initialValue,
  gradingSystem,
  editable = false,
  onChange,
  min = 1.0,
  max = 5.0
}) => {
  const [grade, setGrade] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  const containerRef = useRef(null);

  useClickOutside(containerRef, () => {
    if (isEditing) {
      setIsEditing(false);
    }
  });

  const formatGrade = (value) => {
    if (!value) return '';

    if (gradingSystem === 'german') {
      return Number(value).toFixed(1);
    } else {
      return Number(value).toFixed(Number.isInteger(value) ? 0 : 1);
    }
  };

  const handleIncrease = () => {
    let newGrade;
    if (gradingSystem === 'german') {
      // For German grades, "right" means a better grade (lower number)
      newGrade = getNextGermanGrade(grade, 'up');
    } else {
      newGrade = Math.max(min, Math.round((grade - 0.5) * 2) / 2);
    }
    setGrade(newGrade);
    onChange?.(newGrade);
  };

  const handleDecrease = () => {
    let newGrade;
    if (gradingSystem === 'german') {
      // For German grades, "left" means a worse grade (higher number)
      newGrade = getNextGermanGrade(grade, 'down');
      // If newGrade is null, we want to clear the grade
      if (newGrade === null) {
        setGrade(undefined);
        onChange?.(undefined);
        setIsEditing(false); // Close the edit mode after deletion
        return;
      }
    } else {
      newGrade = Math.min(max, Math.round((grade + 0.5) * 2) / 2);
    }
    setGrade(newGrade);
    onChange?.(newGrade);
  };

  const isValidGrade = (value) => {
    const num = Number(value);
    if (isNaN(num)) return false;

    if (gradingSystem === 'german') {
      return germanGrades.includes(num);
    } else {
      return num >= min && num <= max && (num * 2) % 1 === 0;
    }
  };

  const toggleEdit = () => {
    if (editable) {
      setIsEditing(!isEditing);
    }
  };

  // Get color styles as before
  const gradeColor = isValidGrade(grade)
    ? getGradeColor(grade, gradingSystem, min, max)
    : 'bg-gray-800/50 text-red-400';

  // Modified styles to ensure consistent height and alignment
  const baseStyle = "px-3 py-2 rounded transition-colors duration-200"; // Increased padding for better height
  const displayStyle = `${baseStyle} ${gradeColor}`;

  return (
    <div ref={containerRef} className="inline-flex items-stretch">
      {/* Left (thumbs down) button - decreases grade */}
      {isEditing && (
        <button
          className="px-3 py-2 rounded-l hover:bg-red-700/50 active:bg-red-800/50 
        text-red-400 hover:text-red-200 flex items-center justify-center 
        min-w-[44px] min-h-[44px] transition-colors duration-200"
          onClick={handleDecrease}
        >
          <ThumbsDown className="w-6 h-6" />
        </button>
      )}

      {/* Grade display */}
      <div
        className={`${displayStyle} ${editable ? 'cursor-pointer hover:bg-opacity-40' : ''} 
          ${isEditing ? 'border-x border-gray-700' : ''}`} // Added border when editing
        onClick={toggleEdit}
      >
        {formatGrade(grade) || 'اضغط لإضافة درجة'}
      </div>

      {/* Right (thumbs up) button - increases grade */}
      {isEditing && (
        <button
          className="px-3 py-2 rounded-r hover:bg-green-700/50 active:bg-green-800/50 
      text-green-400 hover:text-green-200 flex items-center justify-center 
      min-w-[44px] min-h-[44px] transition-colors duration-200"
          onClick={handleIncrease}
        >
          <ThumbsUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default GradeDisplay;