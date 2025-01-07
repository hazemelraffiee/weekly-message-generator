'use client';

import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Book, ChevronDown, ChevronUp } from 'lucide-react';

export const homeworkTypes = {
  memorization: {
    id: 'memorization',
    label: 'حفظ',
    template: 'حفظ سورة [] من الآية [] إلى الآية []',
    icon: Book,
  },
  recentReview: {
    id: 'recentReview',
    label: 'مراجعة قريبة',
    template: 'مراجعة سورة [] من الآية [] إلى الآية []',
    icon: Book,
  },
  pastReview: {
    id: 'pastReview',
    label: 'مراجعة بعيدة',
    template: 'مراجعة سورة [] من الآية [] إلى الآية []',
    icon: Book,
  },
  custom: {
    id: 'custom',
    label: 'واجب آخر',
    template: '',
    icon: Book,
  },
};

const HomeworkSection = ({ students, homework, onHomeworkChange }) => {
  // Initialize homework if it doesn't exist or ensure it has the correct structure
  const ensureValidHomework = (homeworkData) => {
    // If homework is undefined or null, return a new object with empty assignments
    if (!homeworkData) {
      return { assignments: [] };
    }

    // If homework exists but doesn't have assignments array, add it
    if (!Array.isArray(homeworkData.assignments)) {
      return { ...homeworkData, assignments: [] };
    }

    // If homework is already valid, return as is
    return homeworkData;
  };

  // Helper function to add a new assignment
  const addAssignment = (type) => {
    // First ensure we have valid homework data
    const validHomework = ensureValidHomework(homework);

    const newAssignment = {
      id: Date.now(),
      type: type,
      content: homeworkTypes[type].template,
      isGeneral: true,
      students: [],
      expanded: true,
    };

    // Now we can safely spread the assignments array
    onHomeworkChange({
      ...validHomework,
      assignments: [...validHomework.assignments, newAssignment]
    });
  };

  // Helper function to update an existing assignment
  const updateAssignment = (id, updates) => {
    const validHomework = ensureValidHomework(homework);

    const newAssignments = validHomework.assignments.map(assignment =>
      assignment.id === id ? { ...assignment, ...updates } : assignment
    );

    onHomeworkChange({
      ...validHomework,
      assignments: newAssignments
    });
  };

  // Helper function to remove an assignment
  const removeAssignment = (id) => {
    const validHomework = ensureValidHomework(homework);

    const newAssignments = validHomework.assignments.filter(
      assignment => assignment.id !== id
    );

    onHomeworkChange({
      ...validHomework,
      assignments: newAssignments
    });
  };

  // Ensure we have valid homework data for rendering
  const validHomework = ensureValidHomework(homework);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">الواجبات المنزلية</h3>
      </div>

      {/* Assignment List */}
      <div className="space-y-4">
        {validHomework.assignments.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            students={students}
            onUpdate={(updates) => updateAssignment(assignment.id, updates)}
            onRemove={() => removeAssignment(assignment.id)}
          />
        ))}
      </div>

      {/* Add Assignment Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.values(homeworkTypes).map((type) => (
          <button
            key={type.id}
            onClick={() => addAssignment(type.id)}
            className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-700 rounded-lg hover:bg-gray-700/50 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const AssignmentCard = ({ assignment, students, onUpdate, onRemove }) => {
  const TypeIcon = homeworkTypes[assignment.type].icon;

  return (
    <div className="border border-gray-700 rounded-lg bg-gray-800/50 overflow-hidden">
      {/* Card Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/50"
        onClick={() => onUpdate({ expanded: !assignment.expanded })}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <TypeIcon className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-medium text-gray-200">
            {homeworkTypes[assignment.type].label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-2 hover:bg-gray-700 rounded-md"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
          {assignment.expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Card Content */}
      {assignment.expanded && (
        <div className="p-4 border-t border-gray-700 space-y-4">
          {/* General/Specific Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
            <span className="text-sm text-gray-400">نوع التكليف</span>
            <div className="flex gap-3">
              <button
                onClick={() => onUpdate({ isGeneral: true, students: [] })}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${assignment.isGeneral
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
              >
                عام
              </button>
              <button
                onClick={() => onUpdate({ isGeneral: false })}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${!assignment.isGeneral
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
              >
                مخصص
              </button>
            </div>
          </div>

          {/* Homework Content */}
          <textarea
            value={assignment.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            className="w-full min-h-[100px] rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100"
            placeholder="محتوى الواجب"
            dir="rtl"
          />

          {/* Student Selection */}
          {!assignment.isGeneral && (
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              {/* Header with selection count and controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm">
                  <span className="text-gray-400">الطلاب المحددين: </span>
                  <span className="text-blue-400 font-medium">
                    {assignment.students.length} من {students.length}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate({ students: students.map(s => s.id) });
                    }}
                    className="px-3 py-1 text-xs rounded bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    تحديد الكل
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate({ students: [] });
                    }}
                    className="px-3 py-1 text-xs rounded bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>

              {/* Student List */}
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className={`flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer ${assignment.students.includes(student.id)
                        ? 'bg-blue-500/10 hover:bg-blue-500/20'
                        : 'hover:bg-gray-800'
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const isSelected = assignment.students.includes(student.id);
                      const newStudents = isSelected
                        ? assignment.students.filter(id => id !== student.id)
                        : [...assignment.students, student.id];
                      onUpdate({ students: newStudents });
                    }}
                  >
                    <div
                      className={`w-4 h-4 rounded border ${assignment.students.includes(student.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-600'
                        } flex items-center justify-center`}
                    >
                      {assignment.students.includes(student.id) && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-200">{student.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomeworkSection;