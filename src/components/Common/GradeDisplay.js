import React, { useState, useRef, useCallback } from 'react';
import { X, Trash2 } from 'lucide-react';
import useClickOutside from '@/hooks/useClickOutside';

const germanGrades = [
  1.0, 1.3, 1.5, 1.7,
  2.0, 2.3, 2.5, 2.7,
  3.0, 3.3, 3.5, 3.7,
  4.0, 5.0, 6.0
];

const getGradeColor = (grade, system, min, max) => {
  if (!grade) return 'bg-gray-800/50';

  if (system === 'german' && grade === 6.0) {
    return 'bg-red-500/40 text-red-200';
  }

  let percentage;
  if (system === 'german') {
    percentage = (6 - grade) / 5 * 100;
  } else {
    percentage = (max - grade) / (max - min) * 100;
  }

  if (percentage >= 80) return 'bg-green-500/30 text-green-200';
  if (percentage >= 60) return 'bg-green-600/20 text-green-300';
  if (percentage >= 40) return 'bg-yellow-500/20 text-yellow-200';
  if (percentage >= 20) return 'bg-orange-500/20 text-orange-200';
  return 'bg-red-500/20 text-red-200';
};

const QuickSelectionGrid = ({
  system,
  min,
  max,
  onSelect,
  onClose,
  currentGrade,
  studentName,
  homeworkType
}) => {
  const modalRef = useRef(null);
  useClickOutside(modalRef, onClose);

  const grades = system === 'german'
    ? germanGrades
    : Array.from({ length: ((max - min) * 2) + 1 }, (_, i) => min + (i * 0.5));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-gray-800 rounded-lg p-4 w-full max-w-md">

        {/* Dialog header */}
        <div className="flex items-center justify-between mb-4">
          {/* Title / Info */}
          <div className="flex flex-col">
            <span className="font-medium text-gray-200">{studentName}</span>
            <span className="text-gray-400 text-sm">{homeworkType}</span>
          </div>

          {/* Buttons row */}
          <div className="flex items-center gap-2">
            {/* Clear button */}
            <button
              onClick={() => {
                onSelect(null);
                onClose();
              }}
              className="p-2 rounded-md text-red-400 hover:bg-red-800/30"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Grade selection grid */}
        <div className="grid grid-cols-3 gap-4">
          {grades.map((grade) => (
            <button
              key={grade}
              onClick={() => {
                onSelect(grade);
                onClose();
              }}
              className={`
                  ${getGradeColor(grade, system, min, max)}
                  p-4 rounded-lg text-lg font-medium
                  hover:opacity-80 active:scale-95
                  transition-all duration-200
                  min-h-[64px]
                  ${currentGrade === grade
                  ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800"
                  : ""
                }
                `}
            >
              {grade.toFixed(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const GradeDisplay = ({
  initialValue,
  gradingSystem,
  editable = false,
  onChange,
  min = 1.0,
  max = 5.0,
  placeholder = 'Tap to add grade',
  studentName,
  homeworkType
}) => {
  const [grade, setGrade] = useState(initialValue);
  const [showQuickSelect, setShowQuickSelect] = useState(false);
  const [isRecentlyChanged, setIsRecentlyChanged] = useState(false);
  const containerRef = useRef(null);

  const handleGradeChange = useCallback((newGrade) => {
    setGrade(newGrade);
    onChange?.(newGrade);
    // Add recently changed effect
    setIsRecentlyChanged(true);
    setTimeout(() => {
      setIsRecentlyChanged(false);
    }, 500); // Animation duration
  }, [onChange]);

  const formatGrade = (value) => {
    if (!value) return '';
    return Number(value).toFixed(1);
  };

  const gradeColor = grade
    ? getGradeColor(grade, gradingSystem, min, max)
    : 'bg-gray-800/50';

  const baseStyle = "min-w-[64px] min-h-[64px] px-4 py-3 rounded transition-all duration-200";
  const displayStyle = `${baseStyle} ${gradeColor} 
      ${editable ? 'cursor-pointer hover:opacity-80 active:scale-95' : ''}
      ${isRecentlyChanged ? 'ring-2 ring-blue-500 animate-pulse' : ''}
      flex items-center justify-center`;

  return (
    <>
      <div
        ref={containerRef}
        className="inline-flex items-stretch"
        onClick={() => editable && setShowQuickSelect(true)}
      >
        <div className={displayStyle}>
          <span className="text-lg">{formatGrade(grade) || placeholder}</span>
        </div>
      </div>

      {showQuickSelect && (
        <QuickSelectionGrid
          system={gradingSystem}
          min={min}
          max={max}
          currentGrade={grade}
          onSelect={handleGradeChange}
          onClose={() => setShowQuickSelect(false)}
          studentName={studentName}
          homeworkType={homeworkType}
        />
      )}
    </>
  );
};

export default GradeDisplay;