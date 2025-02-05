import React, { useState } from 'react';
import { Clock, X, Check } from 'lucide-react';

const AttendanceCard = ({ student, initialStatus, onAttendanceChange }) => {
  // Initialize state based on the provided initial status
  // If the student was marked as present with late minutes, start in 'late' status
  const [status, setStatus] = useState(
    initialStatus?.present ? (initialStatus.lateMinutes ? 'late' : 'present') : 'absent'
  );

  // Late minutes can be either null (not set), a number, or 'أكثر'
  const [lateMinutes, setLateMinutes] = useState(initialStatus?.lateMinutes || null);

  // All possible late minute options in the order they should appear
  const lateOptions = [5, 10, 15, 20, 30, 45, 60, 'أكثر'];

  // Handle changes to the attendance status (absent, present, late)
  const handleStatusChange = (newStatus) => {
    // If switching away from 'late', clear the late minutes
    if (newStatus !== 'late') {
      setLateMinutes(null);
    }

    setStatus(newStatus);
    onAttendanceChange(student.id, {
      present: newStatus !== 'absent',
      lateMinutes: newStatus === 'late' ? lateMinutes : ''
    });
  };

  // Handle selection of late minutes
  const handleLateMinutesChange = (value) => {
    setLateMinutes(value);
    onAttendanceChange(student.id, {
      present: true,
      lateMinutes: value
    });
  };

  // Clear the late minutes value when the user clicks the display button
  const clearLateMinutes = () => {
    setLateMinutes(null);
  };

  // Format the late minutes for display in the selection grid
  const formatLateMinutes = (minutes) => {
    if (minutes === 'أكثر') return '+ 60';
    return minutes;
  };

  // Get appropriate color classes based on the current status
  const getStatusClasses = () => {
    switch (status) {
      case 'absent':
        return 'border-red-500/30 hover:border-red-500/50';
      case 'present':
        return 'border-green-500/30 hover:border-green-500/50';
      case 'late':
        return 'border-yellow-500/30 hover:border-yellow-500/50';
      default:
        return 'border-gray-700';
    }
  };

  const handleNameClick = () => {
    // If currently late, go to absent first
    if (status === 'late') {
      handleStatusChange('absent');
    } else {
      // Otherwise toggle between present and absent
      handleStatusChange(status === 'present' ? 'absent' : 'present');
    }
  };

  return (
    <div className={`rounded-lg p-4 border bg-gray-900/80 backdrop-blur-sm transition-all duration-300 ${getStatusClasses()}`}>
      {/* Student Info and Status Controls Row */}
      <div className="flex items-center justify-between gap-2">
        {/* Student Name */}
        <div
          className="font-semibold text-lg text-gray-100 cursor-pointer hover:opacity-80 transition-opacity select-none"
          onClick={handleNameClick}
        >
          {student.name}
        </div>

        {/* Status Buttons Group */}
        <div className="flex gap-1">
          {/* Absent Status Button */}
          <button
            onClick={() => handleStatusChange('absent')}
            className={`p-2 rounded-md transition-all ${
              status === 'absent'
                ? 'bg-red-500 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Present Status Button */}
          <button
            onClick={() => handleStatusChange('present')}
            className={`p-2 rounded-md transition-all ${
              status === 'present'
                ? 'bg-green-500 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            <Check className="h-4 w-4" />
          </button>

          {/* Late Status Button */}
          <button
            onClick={() => handleStatusChange('late')}
            className={`p-2 rounded-md transition-all ${
              status === 'late'
                ? 'bg-yellow-700 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            <Clock className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Late Minutes Selection Section */}
      {status === 'late' && (
        <div className="mt-4 space-y-2">
          {lateMinutes ? (
            // When minutes are selected, show single button with current value
            <button
              onClick={clearLateMinutes}
              className="w-full py-1.5 rounded bg-yellow-700 text-white text-sm hover:bg-yellow-800 transition-colors"
            >
              {lateMinutes === 'أكثر' ? 'أكثر من ساعة' : `${lateMinutes} دقيقة`}
            </button>
          ) : (
            // When no minutes selected, show grid of options
            <div className="grid grid-cols-4 gap-1">
              {lateOptions.map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => handleLateMinutesChange(minutes)}
                  className="py-2 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 hover:text-gray-100 transition-all duration-200"
                >
                  {formatLateMinutes(minutes)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceCard;