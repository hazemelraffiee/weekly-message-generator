'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Copy,
  Plus,
  Minus,
  Check,
  Users,
  Calendar,
  BookOpen,
  ClipboardList,
  Bell,
  Settings,
  Trash2,
  PenLine,
  Loader2,
  GraduationCap,
  Clock
} from 'lucide-react';


const useLocalStorage = (key, initialValue) => {
  // Initialize state with a function to avoid executing during SSR
  const [state, setState] = useState(() => {
    // Only try to get from localStorage after component mounts
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = localStorage.getItem(`weeklyMessage_${key}`);
      // Check if the item exists before trying to parse it
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Make sure to stringify undefined values as null
        const valueToStore = state === undefined ? null : state;
        localStorage.setItem(`weeklyMessage_${key}`, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
      }
    }
  }, [key, state]);

  return [state, setState];
};


const WeeklyMessageGenerator = () => {

  const [isMounted, setIsMounted] = useState(false);

  const [showCopyNotification, setShowCopyNotification] = useState(false);

  const [showConfirmation, setShowConfirmation] = useState(false);

  const [reportDate, setReportDate] = useLocalStorage('reportDate', (() => {
    if (typeof window === 'undefined') {
      return '';
    }
    const today = new Date();
    return today.toISOString().split('T')[0];
  })());

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize today's date
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Core state management
  const [className, setClassName] = useLocalStorage('className', '');
  const [students, setStudents] = useLocalStorage('students', []);
  const [sections, setSections] = useLocalStorage('sections', {
    weekStudy: {
      enabled: true,
      fields: []
    },
    notes: {
      enabled: true,
      fields: []
    },
    reminders: {
      enabled: true,
      fields: []
    },
    custom: {
      enabled: false,
      fields: []
    }
  });

  const [formattedDate, setFormattedDate] = useLocalStorage('formattedDate', '');
  const [attendance, setAttendance] = useLocalStorage('attendance', {});
  const [newStudentName, setNewStudentName] = useState('');
  const [copyStatus, setCopyStatus] = useState('initial');
  const [homework, setHomework] = useLocalStorage('homework', {
    general: {
      enabled: true,
      content: ''
    },
    specific: {
      assignments: []
    }
  });

  // Date formatting function
  const formatDate = useCallback((dateStr) => {
    const date = new Date(dateStr);

    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    // Format Gregorian date
    const gregorianFormatter = new Intl.DateTimeFormat('ar', options);
    const gregorianParts = gregorianFormatter.formatToParts(date);
    let gregorianDate = '';

    gregorianParts.forEach(part => {
      if (part.type === 'weekday') gregorianDate += part.value + '، ';
      else if (['day', 'month', 'year'].includes(part.type)) gregorianDate += part.value + ' ';
      else if (part.type === 'literal' && part.value !== '، ') gregorianDate += part.value;
    });
    gregorianDate = gregorianDate.trim() + ' م';

    // Format Hijri date
    const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', options);
    const hijriParts = hijriFormatter.formatToParts(date);
    let hijriDate = '';

    hijriParts.forEach(part => {
      if (part.type === 'weekday') hijriDate += part.value + '، ';
      else if (['day', 'month', 'year'].includes(part.type)) hijriDate += part.value + ' ';
      else if (part.type === 'literal' && part.value !== '، ') hijriDate += part.value;
    });
    hijriDate = hijriDate.trim() + ' هـ';

    return `${hijriDate} الموافق ${gregorianDate}`;
  }, []);

  const clearData = useCallback(() => {
    // Preserve className and students
    const preservedClassName = className;
    const preservedStudents = students;

    // Clear all localStorage keys that start with weeklyMessage_
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('weeklyMessage_')) {
        localStorage.removeItem(key);
      }
    });

    // Restore preserved data
    setClassName(preservedClassName);
    setStudents(preservedStudents);

    // Reset other state to initial values
    setReportDate(() => {
      const today = new Date();
      return today.toISOString().split('T')[0];
    });
    setFormattedDate('');
    setAttendance({});
    setHomework({
      general: {
        enabled: true,
        content: ''
      },
      specific: {
        enabled: false,
        assignments: []
      }
    });
    setSections({
      weekStudy: {
        enabled: true,
        fields: []
      },
      notes: {
        enabled: true,
        fields: []
      },
      reminders: {
        enabled: true,
        fields: []
      },
      custom: {
        enabled: false,
        fields: []
      }
    });
  }, [className, students, setClassName, setStudents, setReportDate, setFormattedDate,
    setAttendance, setHomework, setSections]);

  // Initialize formatted date on component mount and date changes
  useEffect(() => {
    setFormattedDate(formatDate(reportDate));
  }, [reportDate, formatDate]);

  // Student management functions
  const addStudent = useCallback(() => {
    if (newStudentName.trim()) {
      setStudents(prev => [...prev, {
        id: Date.now().toString(),
        name: newStudentName.trim()
      }]);
      setNewStudentName('');
    }
  }, [newStudentName, setStudents]);

  const removeStudent = useCallback((studentId) => {
    setStudents(prev => prev.filter(student => student.id !== studentId));
  }, [setStudents]);

  // Attendance management function
  const handleAttendanceChange = useCallback((studentId, isPresent, lateMinutes = '') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        present: isPresent,
        lateMinutes: lateMinutes
      }
    }));
  }, []);

  // Section management functions
  const handleSectionToggle = useCallback((sectionKey) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        enabled: !prev[sectionKey].enabled
      }
    }));
  }, []);

  const handleFieldChange = useCallback((section, fieldId, type, value) => {
    setSections(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        fields: prev[section].fields.map(field =>
          field.id === fieldId ? { ...field, [type]: value } : field
        )
      }
    }));
  }, [setSections]);

  // Functions for managing section fields
  const addField = useCallback((section) => {
    setSections(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        fields: [
          ...prev[section].fields,
          { id: Date.now().toString(), key: '', value: '' }
        ]
      }
    }));
  }, [setSections]);

  const removeField = useCallback((section, fieldId) => {
    setSections(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        fields: prev[section].fields.filter(field => field.id !== fieldId)
      }
    }));
  }, [setSections]);

  // Homework management functions
  const handleHomeworkChange = useCallback((type, value) => {
    setHomework(prev => ({
      ...prev,
      general: {
        ...prev.general,
        [type]: value
      }
    }));
  }, []);

  const handleSpecificHomework = useCallback((action, assignmentIndex, data) => {
    setHomework(prev => {
      const newHomework = { ...prev };

      switch (action) {
        case 'add':
          return {
            ...prev,
            specific: {
              ...prev.specific,
              assignments: [...prev.specific.assignments, {
                studentIds: [],
                content: ''
              }]
            }
          };
        case 'remove':
          return {
            ...prev,
            specific: {
              ...prev.specific,
              assignments: prev.specific.assignments.filter((_, idx) => idx !== assignmentIndex)
            }
          };
        case 'update':
          return {
            ...prev,
            specific: {
              ...prev.specific,
              assignments: prev.specific.assignments.map((assignment, idx) =>
                idx === assignmentIndex ? { ...assignment, ...data } : assignment
              )
            }
          };
        case 'toggle':
          return {
            ...prev,
            specific: {
              ...prev.specific,
              enabled: !prev.specific.enabled
            }
          };
        default:
          return prev;
      }
    });
  }, []);

  // Message generation helpers
  const getAttendanceMessage = useCallback(() => {
    const presentStudents = students.filter(student => attendance[student.id]?.present);
    const absentStudents = students.filter(student => !attendance[student.id]?.present);

    let message = '';

    if (presentStudents.length > 0) {
      message += '*الطلاب الحاضرون:*\n';
      presentStudents
        .sort((a, b) => {
          const aLate = attendance[a.id]?.lateMinutes;
          const bLate = attendance[b.id]?.lateMinutes;
          if (aLate && !bLate) return 1;
          if (!aLate && bLate) return -1;
          return a.name.localeCompare(b.name);
        })
        .forEach(student => {
          const lateMinutes = attendance[student.id]?.lateMinutes;
          message += lateMinutes
            ? `⏰ ${student.name} (متأخر ${lateMinutes} دقيقة)\n`
            : `✅ ${student.name}\n`;
        });
    }

    if (absentStudents.length > 0) {
      if (message) message += '\n';
      message += '*الطلاب الغائبون:*\n';
      absentStudents
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(student => {
          message += `❌ ${student.name}\n`;
        });
    }

    return message;
  }, [attendance, students]);

  const getHomeworkMessage = useCallback(() => {
    if (!homework.general.enabled) return '';

    let message = '';

    if (homework.general.content) {
      message += '*الواجب العام:*\n';
      message += `${homework.general.content}\n\n`;
    }

    if (homework.specific.enabled && homework.specific.assignments.length > 0) {
      const validAssignments = homework.specific.assignments.filter(
        assignment => assignment.studentIds.length > 0 && assignment.content
      );

      if (validAssignments.length > 0) {
        message += '*واجبات خاصة:*\n';
        validAssignments.forEach(assignment => {
          const studentNames = assignment.studentIds
            .map(id => students.find(s => s.id === id)?.name)
            .filter(Boolean)
            .join('، ');
          message += `🔸 *${studentNames}:*\n`;
          message += `${assignment.content}\n\n`;
        });
      }
    }

    return message ? `📝 *الواجبات:*\n${message}` : '';
  }, [homework, students]);

  // Main message generation function
  const generateMessage = useCallback(() => {
    let message = 'بسم الله الرحمن الرحيم\n';
    message += 'السلام عليكم ورحمة الله وبركاته\n\n';

    message += `👥 *أولياء أمورنا الكرام في فصل ${className}*\n`;
    message += `📅 *تقرير يوم ${formattedDate}*\n\n`;

    // Add attendance section if there are students
    if (students.length > 0) {
      message += getAttendanceMessage() + '\n';
    }

    // Add enabled sections with content
    Object.entries(sections).forEach(([sectionKey, section]) => {
      if (section.enabled && section.fields.some(f => f.key && f.value)) {
        const sectionIcons = {
          weekStudy: '📖',
          notes: '📋',
          reminders: '⚠️',
          custom: '📌'
        };

        const titles = {
          weekStudy: 'ما تم دراسته هذا الأسبوع',
          notes: 'ملاحظات المعلم',
          reminders: 'تذكيرات مهمة',
          custom: 'معلومات إضافية'
        };

        message += `${sectionIcons[sectionKey]} *${titles[sectionKey]}*\n`;
        section.fields.forEach(field => {
          if (field.key && field.value) {
            message += `🔸 *${field.key}:*\n`;
            field.value.split('\n').forEach((line) => {
              if (line.trim()) {
                message += `${line.trim()}\n`;
              }
            });
            message += '\n';
          }
        });
      }
    });

    // Add homework section if enabled
    const homeworkMessage = getHomeworkMessage();
    if (homeworkMessage) {
      message += homeworkMessage + '\n';
    }

    message += '🤲 جزاكم الله خيراً\n';
    message += 'وتفضلوا بقبول فائق الاحترام والتقدير';

    return message;
  }, [
    className,
    formattedDate,
    students,
    sections,
    getAttendanceMessage,
    getHomeworkMessage
  ]);

  // Clipboard functionality
  const copyToClipboard = useCallback(() => {
    const message = generateMessage();
    const textarea = document.createElement('textarea');
    textarea.value = message;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);

    try {
      setCopyStatus('copying');
      textarea.select();
      document.execCommand('copy');
      setCopyStatus('copied');
      setShowCopyNotification(true);
      setTimeout(() => {
        setCopyStatus('initial');
        setShowCopyNotification(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(message)
          .then(() => {
            setCopyStatus('copied');
            setShowCopyNotification(true);
            setTimeout(() => {
              setCopyStatus('initial');
              setShowCopyNotification(false);
            }, 2000);
          })
          .catch((clipErr) => {
            console.error('Clipboard API failed:', clipErr);
            setCopyStatus('initial');
          });
      } else {
        setCopyStatus('initial');
      }
    } finally {
      document.body.removeChild(textarea);
    }
  }, [generateMessage]);

  const renderConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full shadow-lg">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          هل أنت متأكد؟
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          سيتم مسح جميع البيانات الحالية وبدء حصة جديدة. لا يمكن التراجع عن هذا الإجراء.
        </p>
        <p className="text-sm text-gray-400 mb-6">
          إسم الفصل وأسماء الطلاب لن يتم حذفهم.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={() => setShowConfirmation(false)}
            className="px-4 py-2 rounded-md bg-gray-600 text-gray-100 hover:bg-gray-700 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={() => {
              clearData();
              setShowConfirmation(false);
            }}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!isMounted) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center gap-3 text-lg">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span>جاري التحميل...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto p-4 max-w-4xl text-gray-100" dir="rtl">
        <div className="flex items-center gap-3 mb-8">
          <GraduationCap className="h-8 w-8 text-blue-500" />
          <h1 className="text-2xl font-bold">منشئ الرسائل الأسبوعية</h1>
        </div>

        {/* Class Info Section */}
        <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800/50 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3 p-6 border-b border-gray-700">
            <Users className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold">معلومات الفصل</h3>
          </div>
          <div className="p-6 pt-0 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <PenLine className="h-4 w-4 text-gray-400" />
                اسم الفصل
              </label>
              <input
                className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="أدخل اسم الفصل"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                التاريخ
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 text-right"
              />
              <div className="text-sm text-gray-400 mt-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {formattedDate}
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Section */}
        <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800 shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-lg font-semibold leading-none tracking-tight">
              الحضور والغياب
            </h3>
          </div>
          <div className="p-6 pt-0 space-y-4">
            <div className="flex gap-2">
              <input
                className="flex-1 h-10 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="اسم الطالب"
                dir="rtl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addStudent();
                  }
                }}
              />
              <button
                onClick={addStudent}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-700 hover:bg-gray-700 h-10 px-4 py-2"
              >
                <Plus className="h-4 w-4 inline-block ml-2" />
                إضافة طالب
              </button>
            </div>

            {students.length > 0 && (
              <div className="border rounded-lg p-4 space-y-3">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center gap-3 p-2 bg-gray-700 rounded">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border border-gray-600 bg-gray-700"
                      checked={attendance[student.id]?.present || false}
                      onChange={(e) => handleAttendanceChange(student.id, e.target.checked)}
                    />
                    <span className="flex-1">{student.name}</span>
                    {attendance[student.id]?.present && (
                      <input
                        type="number"
                        placeholder="دقائق التأخير"
                        className="w-32 text-center h-10 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                        value={attendance[student.id]?.lateMinutes || ''}
                        onChange={(e) => handleAttendanceChange(student.id, true, e.target.value)}
                      />
                    )}
                    <button
                      onClick={() => removeStudent(student.id)}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 hover:bg-red-600/10 text-red-600 transition-colors"
                      title="حذف الطالب"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Homework Section */}
        <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800 shadow-sm">
          <div className="flex items-center gap-2 p-6 pb-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border border-gray-600 bg-gray-700"
              checked={homework.general.enabled}
              onChange={(e) => handleHomeworkChange('enabled', e.target.checked)}
            />
            <h3 className="text-lg font-semibold leading-none tracking-tight">
              الواجبات
            </h3>
          </div>
          {homework.general.enabled && (
            <div className="p-6 pt-0 space-y-4">
              {/* General Homework */}
              <div className="space-y-2">
                <label className="text-sm font-medium">الواجب العام (لجميع الطلاب)</label>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100"
                  value={homework.general.content}
                  onChange={(e) => handleHomeworkChange('content', e.target.value)}
                  placeholder="اكتب الواجب العام هنا"
                  dir="rtl"
                />
              </div>

              {/* Specific Homework Section */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium">الواجبات الخاصة</h4>
                </div>

                <div className="space-y-4">
                  {homework.specific.assignments.map((assignment, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 space-y-4">
                          {/* Student Selection Area */}
                          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                            <div className="text-sm text-gray-400 mb-2">اختر الطلاب:</div>
                            <div className="grid grid-cols-2 gap-2">
                              {students.map(student => (
                                <div key={student.id} className="flex items-center gap-2 p-1">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border border-gray-600 bg-gray-700"
                                    checked={assignment.studentIds.includes(student.id)}
                                    onChange={(e) => {
                                      const newIds = e.target.checked
                                        ? [...assignment.studentIds, student.id]
                                        : assignment.studentIds.filter(id => id !== student.id);
                                      handleSpecificHomework('update', index, { studentIds: newIds });
                                    }}
                                  />
                                  <span className="text-sm">{student.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Homework Content Area */}
                          <div>
                            <textarea
                              className="w-full min-h-[100px] rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100"
                              value={assignment.content}
                              onChange={(e) => handleSpecificHomework('update', index, { content: e.target.value })}
                              placeholder="اكتب الواجب الخاص هنا"
                              dir="rtl"
                            />
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleSpecificHomework('remove', index)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 hover:bg-red-600/10 text-red-600 transition-colors"
                          title="حذف الواجب"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Button */}
                  <button
                    onClick={() => handleSpecificHomework('add')}
                    className="w-full border-2 border-dashed rounded-md p-3 hover:bg-gray-700/50 border-gray-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 inline-block ml-2" />
                    إضافة واجب خاص
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Sections */}
        {Object.entries(sections).map(([sectionKey, section]) => {
          const titles = {
            weekStudy: 'ما تم دراسته',
            notes: 'ملاحظات المعلم',
            reminders: 'تذكيرات',
            custom: 'قسم مخصص'
          };

          return (
            <div key={sectionKey} className="mb-4 rounded-lg border border-gray-700 bg-gray-800 shadow-sm">
              <div className="flex items-center gap-2 p-6 pb-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-gray-600 bg-gray-700"
                  checked={section.enabled}
                  onChange={() => handleSectionToggle(sectionKey)}
                />
                <h3 className="text-lg font-semibold leading-none tracking-tight">
                  {titles[sectionKey]}
                </h3>
              </div>
              {section.enabled && (
                <div className="p-6 pt-0 grid gap-4">
                  {section.fields.map((field) => (
                    <div key={field.id} className="grid gap-2">
                      <div className="flex gap-2">
                        <input
                          className="flex-1 h-10 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100"
                          value={field.key}
                          onChange={(e) => handleFieldChange(sectionKey, field.id, 'key', e.target.value)}
                          placeholder="العنوان"
                          dir="rtl"
                        />
                        <button
                          onClick={() => removeField(sectionKey, field.id)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 hover:bg-red-600/10 text-red-600 transition-colors"
                          title="حذف الحقل"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <textarea
                        className="w-full min-h-[100px] rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100"
                        value={field.value}
                        onChange={(e) => handleFieldChange(sectionKey, field.id, 'value', e.target.value)}
                        placeholder="المحتوى"
                        dir="rtl"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => addField(sectionKey)}
                    className="w-full border-2 border-dashed rounded-md p-2 hover:bg-gray-700 border-gray-700"
                  >
                    <Plus className="h-4 w-4 inline-block ml-2" />
                    إضافة حقل جديد
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Copy and Clear Buttons */}
        <div className="flex gap-4 mt-8">
          {/* Copy Button Container with Notification */}
          <div className="relative flex-1">
            {/* Copy Success Notification - Appears fixed above the button */}
            {copyStatus === 'copied' && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                <div className="bg-green-600 text-white px-4 py-2 rounded-md shadow-lg text-sm animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>تم نسخ الرسالة بنجاح</span>
                  </div>
                </div>
              </div>
            )}

            {/* Copy Button with Dynamic States */}
            <button
              onClick={copyToClipboard}
              disabled={copyStatus === 'copying'}
              className={`
        w-full inline-flex items-center justify-center rounded-md text-sm font-medium
        h-12 px-6 py-2 transition-all duration-300
        disabled:opacity-70 disabled:cursor-not-allowed
        ${copyStatus === 'copied'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
                }
      `}
            >
              <div className="flex items-center gap-2">
                {copyStatus === 'copying' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : copyStatus === 'copied' ? (
                  <Check className="h-5 w-5 animate-scale-up" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {copyStatus === 'copying'
                    ? 'جاري النسخ...'
                    : copyStatus === 'copied'
                      ? 'تم النسخ!'
                      : 'نسخ الرسالة'}
                </span>
              </div>
            </button>
          </div>

          {/* New Session Button */}
          <button
            onClick={() => setShowConfirmation(true)}
            className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium 
        bg-yellow-600 hover:bg-yellow-700 h-12 px-6 py-2 transition-colors duration-200 group"
          >
            <div className="flex items-center gap-2">
              <PenLine className="h-5 w-5 transition-transform group-hover:scale-110" />
              <span className="font-medium">حصة جديدة</span>
            </div>
          </button>

          {/* Render Confirmation Modal */}
          {showConfirmation && renderConfirmationModal()}
        </div>
      </div>
    );
  };

  return renderContent();
};

// Add this export statement at the end of the file
export default WeeklyMessageGenerator;