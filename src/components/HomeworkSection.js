import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit, X, Check, ChevronDown } from 'lucide-react';

export const homeworkTypes = {
  memorization: {
    id: 'memorization',
    label: 'حفظ',
    template: '',
    style: 'bg-green-950/50 text-green-400 hover:bg-green-900/50'
  },
  recentReview: {
    id: 'recentReview',
    label: 'مراجعة قريبة',
    template: '',
    style: 'bg-blue-950/50 text-blue-400 hover:bg-blue-900/50'
  },
  pastReview: {
    id: 'pastReview',
    label: 'مراجعة بعيدة',
    template: '',
    style: 'bg-purple-950/50 text-purple-400 hover:bg-purple-900/50'
  },
  custom: {
    id: 'custom',
    label: 'واجب آخر',
    template: '',
    style: 'bg-gray-950/50 text-gray-400 hover:bg-gray-900/50'
  }
};

const HomeworkTypeButton = ({ type, config, onAddForAll, onAddForGroup }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded border border-gray-700 ${config.style}`}
      >
        <Plus className="h-4 w-4" />
        {config.label}
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-10 min-w-[180px]"
        >
          <button
            onClick={() => {
              onAddForAll();
              setIsOpen(false);
            }}
            className={`w-full text-right px-4 py-2 hover:bg-gray-800 transition-colors ${config.style}`}
          >
            إضافة لجميع الطلاب
          </button>
          <button
            onClick={() => {
              onAddForGroup();
              setIsOpen(false);
            }}
            className={`w-full text-right px-4 py-2 hover:bg-gray-800 transition-colors ${config.style}`}
          >
            إضافة لمجموعة محددة
          </button>
        </div>
      )}
    </div>
  );
};

const HomeworkTypeButtons = ({ onAdd, onAddForGroup }) => (
  <div className="flex flex-wrap gap-2">
    {Object.entries(homeworkTypes).map(([type, config]) => (
      <HomeworkTypeButton
        key={type}
        type={type}
        config={config}
        onAddForAll={() => onAdd(type)}
        onAddForGroup={() => onAddForGroup(type)}
      />
    ))}
  </div>
);

const HomeworkItem = ({
  id,
  type,
  content,
  onEdit,
  onDelete,
  readOnly = false,
  isReferenceToGeneral = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSave = () => {
    onEdit(editedContent);
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <>
      <div
        className={`flex items-center justify-between py-2 border-b border-gray-800 last:border-0 transition-colors duration-300 ${isReferenceToGeneral ? 'opacity-75' : ''
          }`}
        id={id}
      >
        <div className={`${homeworkTypes[type].style} flex-1`}>
          <span className="font-bold ml-2">{homeworkTypes[type].label}:</span>
          {isEditing ? (
            <input
              type="text"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onKeyPress={handleKeyPress}
              onBlur={handleSave}
              autoFocus
              className="border border-gray-700 bg-gray-800 rounded px-2 py-1 ml-2 w-64 text-gray-100"
            />
          ) : (
            <span className="text-gray-300">{content || "___________"}</span>
          )}
        </div>
        <div className="flex gap-2">
          {!readOnly ? (
            isEditing ? (
              <button
                onClick={handleSave}
                className="p-2 text-green-400 hover:bg-green-950/50 rounded-md transition-colors"
              >
                <Check className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:bg-gray-800 rounded-md transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                {onDelete && (
                  <button
                    onClick={() => {
                      if (!content?.trim()) {
                        // If content is empty or just whitespace, delete immediately
                        onDelete();
                      } else {
                        // Otherwise show confirmation dialog
                        setShowDeleteDialog(true);
                      }
                    }}
                    className="p-2 text-red-400 hover:bg-red-950/50 rounded-md transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </>
            )
          ) : (
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:bg-gray-800 rounded-md transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-100 mb-4 text-right">تأكيد الحذف</h3>
            <p className="text-gray-300 text-right mb-6">هل أنت متأكد من حذف هذا الواجب؟</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setShowDeleteDialog(false);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const StudentSelector = ({ students, onConfirm, onCancel }) => {
  const [selectedStudents, setSelectedStudents] = useState([]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg w-96 max-w-full">
        <h3 className="text-xl text-right mb-4">اختر الطلاب</h3>

        <div className="mb-4 flex justify-end gap-2">
          <button
            onClick={() => setSelectedStudents(students.map(s => s.id))}
            className="px-3 py-1 text-sm bg-gray-800 rounded hover:bg-gray-700"
          >
            تحديد الكل
          </button>
          <button
            onClick={() => setSelectedStudents([])}
            className="px-3 py-1 text-sm bg-gray-800 rounded hover:bg-gray-700"
          >
            إلغاء التحديد
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {students.map((student) => (
            <div
              key={student.id}
              onClick={() => {
                setSelectedStudents(prev =>
                  prev.includes(student.id)
                    ? prev.filter(id => id !== student.id)
                    : [...prev, student.id]
                );
              }}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer ${selectedStudents.includes(student.id)
                ? 'bg-blue-900/50'
                : 'hover:bg-gray-800'
                }`}
            >
              <div className={`w-4 h-4 rounded border ${selectedStudents.includes(student.id)
                ? 'bg-blue-500 border-blue-500'
                : 'border-gray-600'
                } flex items-center justify-center`}>
                {selectedStudents.includes(student.id) && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <span>{student.name}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700"
          >
            إلغاء
          </button>
          <button
            onClick={() => onConfirm(selectedStudents)}
            className={`px-4 py-2 rounded ${selectedStudents.length > 0
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-700 cursor-not-allowed'
              }`}
            disabled={selectedStudents.length === 0}
          >
            إضافة
          </button>
        </div>
      </div>
    </div>
  );
};

const HomeworkSection = ({ students, homework, onHomeworkChange, attendance = {} }) => {
  // Track UI state for expandable sections and modals
  const [showSpecificHomework, setShowSpecificHomework] = useState(() => {
    // Check if there are any specific homework assignments in the initial homework data
    return (homework.assignments || []).some(assignment => assignment.isSpecific);
  });
  const [openStudentId, setOpenStudentId] = useState(null);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const generalHomeworkRef = useRef(null);

  const isStudentAbsent = (studentId) => {
    return !attendance?.[studentId]?.present;
  };

  // Sort students: present first, then absent
  const sortedStudents = [...students].sort((a, b) => {
    const aAbsent = isStudentAbsent(a.id);
    const bAbsent = isStudentAbsent(b.id);
    if (aAbsent === bAbsent) {
      // If both present or both absent, sort by name
      return a.name.localeCompare(b.name);
    }
    // Put absent students last
    return aAbsent ? 1 : -1;
  });

  // Helper function to add new homework assignments
  const addHomework = (type, selectedStudents = [], isSpecific = false) => {
    const newHomework = {
      id: Date.now().toString(),
      type,
      content: homeworkTypes[type].template || '',
      assignedStudents: selectedStudents,
      isSpecific
    };

    onHomeworkChange({
      ...homework,
      assignments: [...(homework.assignments || []), newHomework]
    });
  };

  // Helper to update existing homework assignments
  const updateHomework = (homeworkId, updates) => {
    onHomeworkChange({
      ...homework,
      assignments: (homework.assignments || []).map(item =>
        item.id === homeworkId ? { ...item, ...updates } : item
      )
    });
  };

  // Helper to delete homework assignments
  const deleteHomework = (homeworkId) => {
    onHomeworkChange({
      ...homework,
      assignments: (homework.assignments || []).filter(item => item.id !== homeworkId)
    });
  };

  // Get homework assignments for a specific student
  const getStudentHomework = (studentId) => {
    const assignments = homework.assignments || [];
    return {
      specific: assignments.filter(hw =>
        hw.isSpecific && hw.assignedStudents.includes(studentId)
      ),
      general: assignments.filter(hw =>
        !hw.isSpecific &&
        (!hw.assignedStudents.length || hw.assignedStudents.includes(studentId))
      )
    };
  };

  // Component for general homework section
  const GeneralHomeworkCard = () => (
    <div className="w-full mb-6 border border-gray-800 rounded-lg bg-gray-900 p-6">
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">الواجبات العامة</h2>
        </div>

        <HomeworkTypeButtons
          onAdd={(type) => addHomework(type)}
          onAddForGroup={(type) => {
            setSelectedType(type);
            setShowStudentSelector(true);
          }}
        />

        <div ref={generalHomeworkRef} className="space-y-4">
          {(homework.assignments || [])
            .filter(hw => !hw.isSpecific)
            .map((hw) => (
              <div key={hw.id} className="space-y-1">
                {hw.assignedStudents?.length > 0 && (
                  <div className="text-sm text-gray-400">
                    {students
                      .filter(s => hw.assignedStudents.includes(s.id))
                      .map(s => s.name)
                      .join('، ')}
                  </div>
                )}
                <HomeworkItem
                  id={`general-homework-${hw.id}`}
                  type={hw.type}
                  content={hw.content}
                  onEdit={(newContent) => updateHomework(hw.id, { content: newContent })}
                  onDelete={() => deleteHomework(hw.id)}
                />
              </div>
            ))}
        </div>

        <div className="flex items-center gap-2 justify-start mt-4 pt-4 border-t border-gray-800">
          <input
            type="checkbox"
            id="specific-homework"
            checked={showSpecificHomework}
            onChange={(e) => setShowSpecificHomework(e.target.checked)}
            className="rounded border-gray-700 bg-gray-800"
          />
          <label htmlFor="specific-homework" className="text-sm cursor-pointer">
            إضافة واجبات خاصة لكل طالب
          </label>
        </div>
      </div>
    </div>
  );

  // Component for individual student cards
  const StudentCard = ({ student, isAbsent }) => {
    const isOpen = openStudentId === student.id;
    const studentHomework = getStudentHomework(student.id);

    // Calculate homework counts for the badges
    const specificCount = studentHomework.specific.length;
    const generalCount = studentHomework.general.length;

    return (
      <div className="w-full mb-2 border border-gray-800 rounded-lg bg-gray-900">
        <div
          className="px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center justify-between"
          onClick={() => setOpenStudentId(isOpen ? null : student.id)}
        >
          <div className="flex items-center gap-4">
            <span className={`text-lg font-semibold ${isAbsent ? 'text-red-400' : 'text-gray-200'}`}>
              👤 {student.name}
            </span>

            {/* Homework count badges */}
            <div className="flex items-center gap-2">
              {specificCount > 0 && (
                <div className="px-2 py-1 text-sm rounded-full bg-blue-900/50 text-blue-300 border border-blue-700">
                  {specificCount} خاص
                </div>
              )}
              {generalCount > 0 && (
                <div className="px-2 py-1 text-sm rounded-full bg-gray-800/50 text-gray-300 border border-gray-700">
                  {generalCount} عام
                </div>
              )}
            </div>
          </div>

          <ChevronDown
            className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
          />
        </div>

        {isOpen && (
          <div className="px-6 py-4 bg-gray-900/50 space-y-6">
            {/* Specific Homework Section */}
            <div className="mb-6">
              <h3 className="font-bold mb-2 text-gray-100">الواجبات الخاصة</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(homeworkTypes).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => addHomework(type, [student.id], true)}
                    className={`flex items-center gap-2 px-3 py-2 rounded border border-gray-700 ${config.style}`}
                  >
                    <Plus className="h-4 w-4" />
                    {config.label}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {studentHomework.specific.map((hw) => (
                  <HomeworkItem
                    key={hw.id}
                    id={`specific-homework-${hw.id}`}
                    type={hw.type}
                    content={hw.content}
                    onEdit={(newContent) => updateHomework(hw.id, { content: newContent })}
                    onDelete={() => deleteHomework(hw.id)}
                  />
                ))}
              </div>
            </div>

            {/* General Homework Reference Section */}
            <div>
              <h3 className="font-bold mb-2">الواجبات العامة</h3>
              <div className="space-y-2 opacity-75">
                {studentHomework.general.map((hw) => (
                  <HomeworkItem
                    key={hw.id}
                    type={hw.type}
                    content={hw.content}
                    onEdit={() => {
                      const element = document.getElementById(`general-homework-${hw.id}`);
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    readOnly
                    isReferenceToGeneral={true}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 text-right" dir="rtl">
      <GeneralHomeworkCard />

      {showSpecificHomework && (
        <div className="space-y-2">
          {sortedStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              isAbsent={isStudentAbsent(student.id)}
            />
          ))}
        </div>
      )}

      {showStudentSelector && (
        <StudentSelector
          students={students}
          onConfirm={(selectedStudents) => {
            addHomework(selectedType, selectedStudents);
            setShowStudentSelector(false);
            setSelectedType(null);
          }}
          onCancel={() => {
            setShowStudentSelector(false);
            setSelectedType(null);
          }}
        />
      )}
    </div>
  );
};

export default HomeworkSection;