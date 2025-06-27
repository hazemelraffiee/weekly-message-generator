'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Link2, Check, Loader2, Upload, X, Pencil } from 'lucide-react';

import { decodeData, useLocalStorage, DEFAULT_HOMEWORK_TYPES } from '@/components/LinkCreator/utils';
import { compress, decompress } from '@/utils/dataUtils';
import { HomeworkTypesCard } from '@/components/LinkCreator/HomeworkTypesCard';

const InputField = ({ label, value, onChange, placeholder, onKeyDown }) => (
  <div className="space-y-2">
    {label && <label className="text-sm font-medium text-gray-200">{label}</label>}
    <input
      className="w-full h-10 rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
    />
  </div>
);

const ListItem = ({ name, color, onEdit, onDelete }) => (
  <div className="flex items-center justify-between p-2 bg-gray-700/50 rounded hover:bg-gray-700 transition-colors">
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full bg-${color}-500`}></div>
      <span className="text-gray-100">{name}</span>
    </div>
    <div className="flex items-center gap-1">
      <button onClick={onEdit} className="text-blue-500 hover:text-blue-400 p-1">
        <Pencil className="h-4 w-4" />
      </button>
      <button onClick={onDelete} className="text-red-500 hover:text-red-400 p-1">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  </div>
);

const StudentsCard = ({ students, setStudents, newStudentName, setNewStudentName }) => {
  const addStudent = useCallback(() => {
    if (newStudentName.trim()) {
      setStudents(prev => {
        if (prev.some(student => student.name === newStudentName.trim())) {
          return prev;
        }
        return [...prev, { id: Date.now().toString(), name: newStudentName.trim() }];
      });
      setNewStudentName('');
    }
  }, [newStudentName, setStudents, setNewStudentName]);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 h-full">
      <h2 className="text-xl font-semibold text-gray-100 mb-6">الطلاب</h2>
      <div className="space-y-4">
        <AddItemForm
          value={newStudentName}
          onChange={(e) => setNewStudentName(e.target.value)}
          onAdd={addStudent}
          placeholder="اسم الطالب"
        />
        <div className="space-y-2 max-h-[calc(100vh-24rem)] overflow-y-auto">
          {students.map((student) => (
            <ListItem
              key={student.id}
              name={student.name}
              onEdit={() => {
                const newName = window.prompt('تعديل اسم الطالب', student.name);
                if (newName?.trim()) {
                  setStudents(prev => prev.map(s =>
                    s.id === student.id ? { ...s, name: newName.trim() } : s
                  ));
                }
              }}
              onDelete={() => setStudents(prev => prev.filter(s => s.id !== student.id))}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const Header = ({ onLoadClick, onClearClick }) => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 className="text-xl font-semibold text-gray-100">إنشاء رابط لفصل جديد</h1>
      <div className="flex gap-3 w-full sm:w-auto">
        <button
          onClick={onLoadClick}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          <Upload className="h-4 w-4 inline-block ml-2" />
          تحميل رابط
        </button>
        <button
          onClick={onClearClick}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          <Trash2 className="h-4 w-4 inline-block ml-2" />
          مسح القوائم
        </button>
      </div>
    </div>
  </div>
);

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 relative"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
};

// Notification Component
const Notification = ({ notification }) => {
  if (!notification) return null;

  return (
    <div
      className={`
        fixed bottom-24 left-1/2 transform -translate-x-1/2 
        px-4 py-2 rounded-md shadow-lg text-white z-30
        ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}
      `}
    >
      <div className="flex items-center gap-2">
        {notification.type === 'success' ? (
          <Check className="h-4 w-4" />
        ) : (
          <X className="h-4 w-4" />
        )}
        <span>{notification.message}</span>
      </div>
    </div>
  );
};

const AddItemForm = ({ value, onChange, onAdd, placeholder }) => (
  <div className="flex gap-2">
    <input
      className="flex-1 h-10 rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onKeyDown={(e) => e.key === 'Enter' && onAdd()}
    />
    <button
      onClick={onAdd}
      className="inline-flex items-center justify-center rounded-md h-10 px-4 bg-blue-600 hover:bg-blue-700 transition-colors text-white"
    >
      <Plus className="h-4 w-4 inline-block ml-2" />
      إضافة
    </button>
  </div>
);

const SchoolInfoCard = ({ schoolName, setSchoolName, className, setClassName }) => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
    <h2 className="text-xl font-semibold text-gray-100 mb-6">معلومات المدرسة</h2>
    <div className="space-y-4">
      <InputField
        label="اسم المدرسة"
        value={schoolName}
        onChange={(e) => setSchoolName(e.target.value)}
        placeholder="أدخل اسم المدرسة"
      />
      <InputField
        label="اسم الفصل"
        value={className}
        onChange={(e) => setClassName(e.target.value)}
        placeholder="أدخل اسم الفصل"
      />
    </div>
  </div>
);

const TeachersCard = ({ teachers, setTeachers, newTeacherName, setNewTeacherName }) => {
  const addTeacher = () => {
    if (newTeacherName.trim()) {
      setTeachers(prev => {
        if (prev.some(teacher => teacher.name === newTeacherName.trim())) {
          return prev;
        }
        return [...prev, { id: Date.now().toString(), name: newTeacherName.trim() }];
      });
      setNewTeacherName('');
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-100 mb-6">المعلمون</h2>
      <div className="space-y-4">
        <AddItemForm
          value={newTeacherName}
          onChange={(e) => setNewTeacherName(e.target.value)}
          onAdd={addTeacher}
          placeholder="اسم المعلم"
        />
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {teachers.map((teacher) => (
            <ListItem
              key={teacher.id}
              name={teacher.name}
              onEdit={() => {
                const newName = window.prompt('تعديل اسم المعلم', teacher.name);
                if (newName?.trim()) {
                  setTeachers(prev => prev.map(t =>
                    t.id === teacher.id ? { ...t, name: newName.trim() } : t
                  ));
                }
              }}
              onDelete={() => setTeachers(prev => prev.filter(t => t.id !== teacher.id))}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Main component
const LinkCreator = () => {
  // State management
  const [schoolName, setSchoolName] = useLocalStorage('schoolName', '');
  const [className, setClassName] = useLocalStorage('className', '');
  const [newStudentName, setNewStudentName] = useState('');
  const [students, setStudents] = useState([]);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [homeworkTypes, setHomeworkTypes] = useState({});
  const [useDefaultTypes, setUseDefaultTypes] = useState(true);
  const [copyStatus, setCopyStatus] = useState('initial');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [loadingLink, setLoadingLink] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);

  // Show notification helper
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Handle loading existing link
  const handleLoadLink = useCallback(async () => {
    setLoadingLink(true);
    setError('');
  
    try {
      // Extract data parameter if it's a full URL
      const dataParam = linkInput.includes('?data=')
        ? linkInput.split('?data=')[1]
        : linkInput;
  
      // Try new format first (decompress)
      let decodedData;
      try {
        decodedData = decompress(dataParam);
      } catch (e) {
        console.log('New format decode failed, trying legacy format...', e);
      }
  
      // If new format fails, try legacy format (decode)
      if (!decodedData) {
        try {
          decodedData = decodeData(dataParam);
        } catch (e) {
          console.log('Legacy format decode failed', e);
          throw new Error('الرابط غير صالح');
        }
      }
  
      if (!decodedData) {
        throw new Error('الرابط غير صالح');
      }

      // 2. Update basic information
      setSchoolName(decodedData.schoolName || '');
      setClassName(decodedData.className || '');

      // 3. Update student and teacher lists
      const updatedStudents = decodedData.students.map((name, index) => ({
        id: `student-${Date.now()}-${index}`,
        name
      }));
      setStudents(updatedStudents);

      const updatedTeachers = decodedData.teachers.map((name, index) => ({
        id: `teacher-${Date.now()}-${index}`,
        name
      }));
      setTeachers(updatedTeachers);

      // 4. Handle homework types
      if (decodedData.homeworkTypes) {
        // First, determine if we're dealing with the simplified format
        const isSimplifiedFormat = Object.values(decodedData.homeworkTypes).every(
          value => typeof value === 'string'
        );

        // Turn off default types first to prevent interference
        setUseDefaultTypes(false);

        // Wait for the next tick to ensure useDefaultTypes has been updated
        await new Promise(resolve => setTimeout(resolve, 0));

        if (isSimplifiedFormat) {
          // Convert from simplified color format to full format
          const reconstructedTypes = Object.entries(decodedData.homeworkTypes)
            .reduce((acc, [label, color]) => {
              const id = `type-${Date.now()}-${label.toLowerCase().replace(/\s+/g, '-')}`;
              acc[id] = {
                id,
                label,
                template: '',
                style: `bg-${color}-950/50 text-${color}-400 hover:bg-${color}-900/50`
              };
              return acc;
            }, {});

          setHomeworkTypes(reconstructedTypes);
        } else if (Object.keys(decodedData.homeworkTypes).length > 0) {
          // Handle full format homework types
          // Add timestamps to IDs to ensure uniqueness
          const updatedTypes = Object.entries(decodedData.homeworkTypes)
            .reduce((acc, [key, type]) => {
              const newId = `type-${Date.now()}-${key}`;
              acc[newId] = {
                ...type,
                id: newId
              };
              return acc;
            }, {});

          setHomeworkTypes(updatedTypes);
        } else {
          // Empty homework types, revert to defaults
          setUseDefaultTypes(true);
          setHomeworkTypes(DEFAULT_HOMEWORK_TYPES);
        }
      } else {
        // No homework types in data, use defaults
        setUseDefaultTypes(true);
        setHomeworkTypes(DEFAULT_HOMEWORK_TYPES);
      }

      // 5. Clean up and notify success
      setIsModalOpen(false);
      setLinkInput('');
      showNotification('تم تحميل البيانات بنجاح');

    } catch (error) {
      console.error('Load error:', error);
      setError('حدث خطأ أثناء تحميل البيانات. يرجى التحقق من الرابط والمحاولة مرة أخرى.');
    } finally {
      setLoadingLink(false);
    }
  }, [linkInput, setSchoolName, setClassName, showNotification]);

  // Form validation
  const isFormValid = schoolName.trim() && className.trim() && students.length > 0;

  const handleClearLists = useCallback(() => {
    setStudents([]);
    setTeachers([]);
    showNotification('تم مسح جميع القوائم بنجاح');
  }, [showNotification]);

  const handleGenerateAndCopyUrl = useCallback(async () => {
    // Extract color from style string (e.g., "bg-blue-950/50 text-blue-400..." -> "blue")
    const extractColor = (style) => {
      const match = style.match(/bg-(\w+)-950/);
      return match ? match[1] : null;
    };
  
    // Transform homework types to simplified format
    const simplifiedHomeworkTypes = Object.values(homeworkTypes).reduce((acc, type) => {
      const color = extractColor(type.style);
      if (color) {
        acc[type.label] = color;
      }
      return acc;
    }, {});
  
    const data = {
      schoolName,
      className,
      students: students.map(s => s.name),
      teachers: teachers.map(t => t.name),
      // Only include homeworkTypes if we're not using defaults
      ...(useDefaultTypes ? {} : { homeworkTypes: simplifiedHomeworkTypes })
    };

    try {
      setCopyStatus('copying');
      const encodedData = compress(JSON.stringify(data));
      if (!encodedData) {
        throw new Error('Failed to encode data');
      }

      const url = `${window.location.origin}/weekly-message-generator?data=${encodedData}`;
      await navigator.clipboard.writeText(url);
      showNotification('تم نسخ الرابط بنجاح');
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('initial'), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      setCopyStatus('initial');
    }
  }, [schoolName, className, students, teachers, homeworkTypes, useDefaultTypes, showNotification]);

  return (
    <div className="min-h-screen bg-gray-900 py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4">
        <Header onLoadClick={() => setIsModalOpen(true)} onClearClick={handleClearLists} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-24">
          <div className="space-y-6">
            <SchoolInfoCard
              schoolName={schoolName}
              setSchoolName={setSchoolName}
              className={className}
              setClassName={setClassName}
            />
            <TeachersCard
              teachers={teachers}
              setTeachers={setTeachers}
              newTeacherName={newTeacherName}
              setNewTeacherName={setNewTeacherName}
            />
            <HomeworkTypesCard
              homeworkTypes={homeworkTypes}
              setHomeworkTypes={setHomeworkTypes}
              useDefaultTypes={useDefaultTypes}
              setUseDefaultTypes={setUseDefaultTypes}
            />
          </div>
          <StudentsCard
            students={students}
            setStudents={setStudents}
            newStudentName={newStudentName}
            setNewStudentName={setNewStudentName}
          />
        </div>

        {/* Modal for loading existing link */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-100">تحميل رابط موجود</h2>
              <p className="text-gray-400 mt-1">قم بلصق الرابط الموجود لتحميل البيانات وتعديلها</p>
            </div>

            <textarea
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="الصق الرابط هنا..."
              className="w-full h-24 rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-2 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                إلغاء
              </button>
              <button
                onClick={handleLoadLink}
                disabled={!linkInput.trim() || loadingLink}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingLink ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري التحميل...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    تحميل
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>

        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm p-4 border-t border-gray-800">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={handleGenerateAndCopyUrl}
              disabled={!isFormValid || copyStatus === 'copying'}
              className={`
                w-full inline-flex items-center justify-center 
                rounded-md text-sm font-medium h-12 px-6
                transition-colors duration-200 text-white
                ${!isFormValid
                  ? 'bg-gray-600 cursor-not-allowed'
                  : copyStatus === 'copied'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }
              `}
            >
              <div className="flex items-center gap-2">
                {copyStatus === 'copying' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : copyStatus === 'copied' ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Link2 className="h-5 w-5" />
                )}
                <span>
                  {copyStatus === 'copying'
                    ? 'جاري إنشاء الرابط...'
                    : copyStatus === 'copied'
                      ? 'تم نسخ الرابط!'
                      : 'إنشاء ونسخ الرابط'
                  }
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Notification */}
        <Notification notification={notification} />
      </div>
    </div>
  );
};
export default LinkCreator;