'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Link2, Check, Loader2, Upload, X, Pencil } from 'lucide-react';

// Custom hook for localStorage
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(initialValue);

  useEffect(() => {
    try {
      const item = localStorage.getItem(`linkCreator_${key}`);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
    }
  }, [key]);

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(`linkCreator_${key}`, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

// Utility functions remain the same
const stringToUtf8Bytes = (str) => {
  const utf8 = unescape(encodeURIComponent(str));
  const bytes = new Uint8Array(utf8.length);
  for (let i = 0; i < utf8.length; i++) {
    bytes[i] = utf8.charCodeAt(i);
  }
  return bytes;
};

const utf8BytesToString = (bytes) => {
  const utf8 = String.fromCharCode.apply(null, bytes);
  return decodeURIComponent(escape(utf8));
};

const encodeData = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    const bytes = stringToUtf8Bytes(jsonString);
    const base64 = btoa(String.fromCharCode.apply(null, bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return base64;
  } catch (error) {
    console.error('Error encoding data:', error);
    return null;
  }
};

export const decodeData = (encodedData) => {
  try {
    // Extract the data parameter from the URL if a full URL is pasted
    const dataParam = encodedData.includes('?data=')
      ? encodedData.split('?data=')[1]
      : encodedData;

    const base64 = dataParam
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const paddedBase64 = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);
    const binary = atob(paddedBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonString = utf8BytesToString(bytes);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error decoding data:', error);
    return null;
  }
};

// Custom Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  // Close modal when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key press
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

const LinkCreator = () => {
  // State management
  const [schoolName, setSchoolName] = useLocalStorage('schoolName', '');
  const [className, setClassName] = useLocalStorage('className', '');
  const [newStudentName, setNewStudentName] = useState('');
  const [students, setStudents] = useState([]);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [copyStatus, setCopyStatus] = useState('initial');

  // Modal and link loading states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [loadingLink, setLoadingLink] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle loading existing link
  const handleLoadLink = useCallback(async () => {
    setLoadingLink(true);
    setError('');

    try {
      const decodedData = decodeData(linkInput);

      if (!decodedData) {
        throw new Error('الرابط غير صالح');
      }

      setSchoolName(decodedData.schoolName || '');
      setClassName(decodedData.className || '');
      setStudents(decodedData.students.map((name, index) => ({
        id: `existing-${index}`,
        name
      })));
      setTeachers(decodedData.teachers.map((name, index) => ({
        id: `existing-${index}`,
        name
      })));

      setIsModalOpen(false);
      setLinkInput('');
      showNotification('تم تحميل البيانات بنجاح');
    } catch (error) {
      setError('حدث خطأ أثناء تحميل البيانات. يرجى التحقق من الرابط والمحاولة مرة أخرى.');
    } finally {
      setLoadingLink(false);
    }
  }, [linkInput, setSchoolName, setClassName, showNotification]);

  const clearLists = useCallback(() => {
    setStudents([]);
    setTeachers([]);
    showNotification('تم مسح قوائم الطلاب والمعلمين');
  }, [showNotification]);

  // Function to add a new student
  const addStudent = useCallback(() => {
    if (newStudentName.trim()) {
      setStudents(prev => {
        if (prev.some(student => student.name === newStudentName.trim())) {
          return prev;
        }
        return [...prev, {
          id: Date.now().toString(),
          name: newStudentName.trim()
        }];
      });
      setNewStudentName('');
    }
  }, [newStudentName]);

  // Function to add a new teacher
  const addTeacher = useCallback(() => {
    if (newTeacherName.trim()) {
      setTeachers(prev => {
        if (prev.some(teacher => teacher.name === newTeacherName.trim())) {
          return prev;
        }
        return [...prev, {
          id: Date.now().toString(),
          name: newTeacherName.trim()
        }];
      });
      setNewTeacherName('');
    }
  }, [newTeacherName]);

  // Function to remove a student
  const removeStudent = useCallback((studentId) => {
    setStudents(prev => prev.filter(student => student.id !== studentId));
  }, []);

  // Function to remove a teacher
  const removeTeacher = useCallback((teacherId) => {
    setTeachers(prev => prev.filter(teacher => teacher.id !== teacherId));
  }, []);

  // Function to generate and copy the URL
  const generateAndCopyUrl = useCallback(async () => {
    const data = {
      schoolName,
      className,
      students: students.map(s => s.name),
      teachers: teachers.map(t => t.name)
    };

    const encodedData = encodeData(data);
    if (!encodedData) {
      console.error('Failed to encode data');
      return;
    }

    const url = `${window.location.origin}/weekly-message-generator?data=${encodedData}`;

    try {
      setCopyStatus('copying');
      await navigator.clipboard.writeText(url);
      setCopyStatus('copied');
      showNotification('تم نسخ الرابط بنجاح');

      setTimeout(() => {
        setCopyStatus('initial');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      setCopyStatus('initial');
      showNotification('حدث خطأ أثناء نسخ الرابط', 'error');
    }
  }, [schoolName, className, students, teachers]);

  // Form validation
  const isFormValid = schoolName.trim() && className.trim() && students.length > 0;

  useEffect(() => {
    // Initialize students and teachers with empty arrays on mount
    setStudents([]);
    setTeachers([]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section - Contains primary actions */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-100">إنشاء رابط لفصل جديد</h1>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <Upload className="h-4 w-4 inline-block ml-2" />
                تحميل رابط
              </button>
              <button
                onClick={clearLists}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                <Trash2 className="h-4 w-4 inline-block ml-2" />
                مسح القوائم
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-24">
          {/* Left Column - School Info and Teachers */}
          <div className="space-y-6">
            {/* School Information Card */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-6">معلومات المدرسة</h2>

              <div className="space-y-4">
                {/* School Name Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">اسم المدرسة</label>
                  <input
                    className="w-full h-10 rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="أدخل اسم المدرسة"
                  />
                </div>

                {/* Class Name Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">اسم الفصل</label>
                  <input
                    className="w-full h-10 rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="أدخل اسم الفصل"
                  />
                </div>
              </div>
            </div>

            {/* Teachers Card */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-6">المعلمون</h2>

              {/* Add Teacher Input */}
              <div className="flex gap-2 mb-4">
                <input
                  className="flex-1 h-10 rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  placeholder="اسم المعلم"
                  onKeyDown={(e) => e.key === 'Enter' && addTeacher()}
                />
                <button
                  onClick={addTeacher}
                  className="inline-flex items-center justify-center rounded-md h-10 px-4 bg-blue-600 hover:bg-blue-700 transition-colors text-white"
                >
                  <Plus className="h-4 w-4 inline-block ml-2" />
                  إضافة
                </button>
              </div>

              {/* Teachers List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between p-2 bg-gray-700/50 rounded hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-gray-100">{teacher.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const newName = window.prompt('تعديل اسم المعلم', teacher.name);
                          if (newName?.trim()) {
                            setTeachers(prev => prev.map(t =>
                              t.id === teacher.id ? { ...t, name: newName.trim() } : t
                            ));
                          }
                        }}
                        className="text-blue-500 hover:text-blue-400 p-1"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeTeacher(teacher.id)}
                        className="text-red-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Students */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-6">الطلاب</h2>

            {/* Add Student Input */}
            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 h-10 rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="اسم الطالب"
                onKeyDown={(e) => e.key === 'Enter' && addStudent()}
              />
              <button
                onClick={addStudent}
                className="inline-flex items-center justify-center rounded-md h-10 px-4 bg-blue-600 hover:bg-blue-700 transition-colors text-white"
              >
                <Plus className="h-4 w-4 inline-block ml-2" />
                إضافة
              </button>
            </div>

            {/* Students List */}
            <div className="space-y-2 max-h-[calc(100vh-24rem)] overflow-y-auto">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-2 bg-gray-700/50 rounded hover:bg-gray-700 transition-colors"
                >
                  <span className="text-gray-100">{student.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const newName = window.prompt('تعديل اسم الطالب', student.name);
                        if (newName?.trim()) {
                          setStudents(prev => prev.map(s =>
                            s.id === student.id ? { ...s, name: newName.trim() } : s
                          ));
                        }
                      }}
                      className="text-blue-500 hover:text-blue-400 p-1"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeStudent(student.id)}
                      className="text-red-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Link Button - Sticky Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm p-4 border-t border-gray-800 z-20">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={generateAndCopyUrl}
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

        {/* Modal */}
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

        {/* Notification */}
        {notification && (
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
        )}
      </div>
    </div>
  );
};

export default LinkCreator;