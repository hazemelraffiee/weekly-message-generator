'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Copy,
  Plus,
  Check,
  Users,
  Calendar,
  Trash2,
  PenLine,
  Loader2,
  GraduationCap,
  Clock,
  Link2
} from 'lucide-react';

import { useHydration } from '@/context/HydrationContext'

import { decodeData } from '@/components/LinkCreator'

import AttendanceCard from '@/components/AttendanceCard';

import HomeworkSection, { homeworkTypes } from '@/components/HomeworkSection';

const useLocalStorage = (key, initialValue) => {
  const isHydrated = useHydration();
  const [state, setState] = useState(() => {
    // During SSR or before hydration, return initial value
    if (!isHydrated) return initialValue;

    try {
      const item = localStorage.getItem(`weeklyMessage_${key}`);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(`weeklyMessage_${key}`, JSON.stringify(state));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, state, isHydrated]);

  return [state, setState];
};

const generateStudentId = (name) => {
  // Remove any whitespace and convert to lowercase
  const normalizedName = name.trim().toLowerCase();

  // Create a simple hash from the name
  // This ensures the same name always generates the same ID
  let hash = 0;
  for (let i = 0; i < normalizedName.length; i++) {
    const char = normalizedName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to a string and make it positive
  return `student_${Math.abs(hash)}`;
};

const WeeklyMessageGenerator = () => {

  // 1. First, all useState hooks

  const [coreData, setCoreData] = useState({
    schoolName: '',
    className: '',
    students: [],
    teachers: []
  });
  const [isMounted, setIsMounted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [reportDate, setReportDate] = useLocalStorage('reportDate', (() => {
    if (typeof window === 'undefined') return '';
    const today = new Date();
    return today.toISOString().split('T')[0];
  })());
  const [formattedDate, setFormattedDate] = useLocalStorage('formattedDate', '');
  const [attendance, setAttendance] = useLocalStorage('attendance', {});
  const [sections, setSections] = useLocalStorage('sections', {
    weekStudy: { enabled: true, fields: [] },
    notes: { enabled: true, fields: [] },
    reminders: { enabled: true, fields: [] },
    custom: { enabled: false, fields: [] }
  });
  const [homework, setHomework] = useLocalStorage('homework', {
    assignments: [] // Initialize with empty assignments array
  });

  const [copyStatus, setCopyStatus] = useState('initial');
  const [showNotification, setShowNotification] = useState(false);

  // 2. All useCallback definitions

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
    // Clear localStorage first
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('weeklyMessage_')) {
        localStorage.removeItem(key);
      }
    });

    // Reset all states
    setReportDate(new Date().toISOString().split('T')[0]);
    setAttendance({});
    setHomework({
      assignments: [] // Reset to empty assignments array
    });
    setSections({
      weekStudy: { enabled: true, fields: [] },
      notes: { enabled: true, fields: [] },
      reminders: { enabled: true, fields: [] },
      custom: { enabled: false, fields: [] }
    });

    // Force a re-render
    setIsMounted(false);
    setTimeout(() => setIsMounted(true), 0);
  }, [setReportDate, setFormattedDate, setAttendance, setHomework, setSections, setIsMounted]);

  const handleAttendanceChange = useCallback((studentId, attendanceData) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        present: attendanceData.present,
        lateMinutes: attendanceData.lateMinutes
      }
    }));
  }, []);

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

  const getAttendanceMessage = useCallback(() => {
    // Separate students into present and absent groups
    const presentStudents = coreData.students.filter(student => attendance[student.id]?.present);
    const absentStudents = coreData.students.filter(student => !attendance[student.id]?.present);

    let message = '';

    // Handle present students (including those who are late)
    if (presentStudents.length > 0) {
      message += '*الطلاب الحاضرون:*\n';

      // Sort students: on-time first, then by lateness duration
      presentStudents
        .sort((a, b) => {
          const aLate = attendance[a.id]?.lateMinutes;
          const bLate = attendance[b.id]?.lateMinutes;

          // If one is late and the other isn't, put the on-time student first
          if (aLate && !bLate) return 1;
          if (!aLate && bLate) return -1;

          // If both are late, sort by duration ('أكثر' should come last)
          if (aLate && bLate) {
            if (aLate === 'أكثر') return 1;
            if (bLate === 'أكثر') return -1;
            return parseInt(aLate) - parseInt(bLate);
          }

          // If neither is late, sort by name
          return a.name.localeCompare(b.name);
        })
        .forEach(student => {
          const lateMinutes = attendance[student.id]?.lateMinutes;

          if (!lateMinutes) {
            // Student is present and on time
            message += `✅ ${student.name}\n`;
          } else {
            // Student is late
            const lateDisplay = lateMinutes === 'أكثر'
              ? 'متأخر أكثر من ساعة'
              : `متأخر ${lateMinutes} دقيقة`;
            message += `⏰ ${student.name} (${lateDisplay})\n`;
          }
        });
    }

    // Handle absent students
    if (absentStudents.length > 0) {
      if (message) message += '\n';
      message += '*الطلاب الغائبون:*\n';

      // Sort absent students alphabetically
      absentStudents
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(student => {
          message += `❌ ${student.name}\n`;
        });
    }

    return message;
  }, [attendance, coreData.students]);

  const getHomeworkMessage = useCallback(() => {
    if (!homework.assignments || homework.assignments.length === 0) {
      return '';
    }

    let message = '📝 *الواجبات المنزلية*\n\n';

    // First, let's group homework assignments
    const generalHomework = homework.assignments.filter(hw => !hw.assignedStudents?.length);
    const specificHomework = homework.assignments.filter(hw => hw.assignedStudents?.length > 0);

    // Handle general homework (assigned to all students)
    if (generalHomework.length > 0) {
      message += '*الواجبات العامة:*\n';
      generalHomework.forEach(hw => {
        const typeLabel = homeworkTypes[hw.type].label;
        message += `• ${typeLabel}: ${hw.content}\n`;
      });
      message += '\n';
    }

    // Handle specific homework (assigned to specific students)
    if (specificHomework.length > 0) {
      message += '*الواجبات الخاصة:*\n';

      // Group homework by students for better organization
      const studentHomework = {};

      specificHomework.forEach(hw => {
        hw.assignedStudents.forEach(studentId => {
          if (!studentHomework[studentId]) {
            studentHomework[studentId] = [];
          }
          studentHomework[studentId].push(hw);
        });
      });

      // Generate message for each student's homework
      Object.entries(studentHomework).forEach(([studentId, assignments]) => {
        const student = coreData.students.find(s => s.id === studentId);
        if (student) {
          message += `\n👤 *${student.name}:*\n`;
          assignments.forEach(hw => {
            const typeLabel = homeworkTypes[hw.type].label;
            message += `• ${typeLabel}: ${hw.content}\n`;
          });
        }
      });
    }

    return message;
  }, [homework.assignments, coreData.students]);

  const generateMessage = useCallback(() => {
    // Opening and Welcome
    let message = 'بسم الله الرحمن الرحيم\n';
    message += 'السلام عليكم ورحمة الله وبركاته\n\n';

    // Warm welcome addition
    message += 'حياكم الله أولياء أمورنا الكرام 🌟\n';
    message += 'نسعد بمشاركتكم تقرير هذا اليوم عن أبنائكم\n\n';

    // Class and Date Information
    message += `👥 *فصل ${coreData.className}*\n`;
    message += `📅 *تقرير يوم ${formattedDate}*\n\n`;

    // Attendance Section
    if (coreData.students.length > 0) {
      message += '📊 *سجل الحضور والغياب*\n';
      message += getAttendanceMessage() + '\n';
    }

    // Dynamic Sections
    Object.entries(sections).forEach(([sectionKey, section]) => {
      if (section.enabled && section.fields.some(f => f.key && f.value)) {
        const sectionIcons = {
          weekStudy: '📖',
          notes: '📋',
          reminders: '⚠️',
          custom: '📌'
        };

        const titles = {
          weekStudy: 'المحتوى التعليمي لهذا الأسبوع',
          notes: 'ملاحظات وتوجيهات المعلم',
          reminders: 'تذكيرات هامة',
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

    // Homework Section
    const homeworkMessage = getHomeworkMessage();
    if (homeworkMessage) {
      message += homeworkMessage + '\n';
    }

    // Enhanced closing message
    message += '🤲 نشكر لكم متابعتكم المستمرة ودعمكم لأبنائكم\n';
    message += 'جزاكم الله خيراً على تعاونكم معنا\n\n';

    if (coreData.teachers && coreData.teachers.length > 0) {
      message += '\n👨‍🏫 *المعلمون:*\n';
      message += coreData.teachers.map(teacher => `• ${teacher}`).join('\n');
      message += '\n\n';
    }

    return message.trim();
  }, [
    coreData.className,
    formattedDate,
    coreData.students,
    coreData.teachers,
    sections,
    getAttendanceMessage,
    getHomeworkMessage
  ]);

  const copyToClipboard = useCallback(() => {
    const message = generateMessage();

    setCopyStatus('copying');
    navigator.clipboard.writeText(message)
      .then(() => {
        setCopyStatus('copied');
        setShowNotification(true);
        setTimeout(() => {
          setCopyStatus('initial');
          setShowNotification(false);
        }, 2000);
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        setCopyStatus('initial');
      });
  }, [generateMessage]);

  // Effect to decode and validate data parameter
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get('data');

    if (encodedData) {
      try {
        const decodedData = decodeData(encodedData);
        if (decodedData && decodedData.className && Array.isArray(decodedData.students)) {
          setCoreData({
            schoolName: decodedData.schoolName || '',
            className: decodedData.className,
            students: decodedData.students.map(name => ({
              id: generateStudentId(name),
              name: name
            })),
            teachers: decodedData.teachers || []
          });
        }
      } catch (error) {
        console.error('Error decoding data:', error);
      }
    }
    setIsLoading(false);
  }, []); // Empty dependency array since this should only run once

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setFormattedDate(formatDate(reportDate));
  }, [reportDate, formatDate]);

  // Ensure date is formatted immediately when component mounts
  useEffect(() => {
    if (!reportDate && typeof window !== 'undefined') {
      setReportDate(new Date().toISOString().split('T')[0]);
    }
  }, []);

  // Show error state if we don't have valid core data
  if (!coreData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100" dir="rtl">
        <div className="max-w-md text-center p-8">
          <h1 className="text-2xl font-bold mb-4 text-red-500">خطأ في البيانات</h1>
          <p className="mb-6">
            عذراً، لا يمكن عرض الصفحة. يرجى التأكد من صحة الرابط أو العودة إلى صفحة إنشاء الرابط.
          </p>
          <a
            href={
              window.location.href
                .split('?')[0]
                .replace(/\/+$/, '') + '/linkcreator'
            }
            className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            العودة إلى صفحة إنشاء الرابط
          </a>
        </div>
      </div>
    );
  }

  const isHydrated = useHydration();

  if (isLoading || !isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-lg">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span>جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (!coreData.className || !coreData.students.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100" dir="rtl">
        <div className="max-w-md text-center p-8">
          <h1 className="text-2xl font-bold mb-4 text-red-500">خطأ في البيانات</h1>
          <p className="mb-6">
            عذراً، لا يمكن عرض الصفحة. يرجى التأكد من صحة الرابط أو العودة إلى صفحة إنشاء الرابط.
          </p>
          <a
            href={
              window.location.href
                .split('?')[0]
                .replace(/\/+$/, '') + '/linkcreator'
            }
            className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            العودة إلى صفحة إنشاء الرابط
          </a>
        </div>
      </div>
    );
  }

  // Initialize today's date
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const renderConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full shadow-lg">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          هل أنت متأكد؟
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          سيتم مسح جميع البيانات الحالية وبدء حصة جديدة. لا يمكن التراجع عن هذا الإجراء.
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
        {/* Header */}
        <div className="mb-8">
          {/* Main Header Container with gradient background */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-blue-800">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 bg-grid-white/10" />

            <div className="relative p-6">
              {/* Main Content Container - Using flex column by default */}
              <div className="flex flex-col gap-6">
                {/* Top Section: Class Information */}
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Primary Info Section */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* School Icon - Responsive sizing */}
                    <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm flex-shrink-0">
                      <GraduationCap className="h-7 w-7 md:h-8 md:w-8 text-white" />
                    </div>

                    {/* School and Class Information */}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm md:text-base text-gray-300 mb-1">
                        {coreData.schoolName}
                      </div>
                      <h1 className="text-2xl md:text-3xl font-bold text-white break-words leading-tight">
                        {coreData.className}
                      </h1>
                      <div className="mt-2 text-sm md:text-base text-gray-200 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{coreData.students.length} طلاب</span>
                      </div>
                    </div>
                  </div>

                  {/* Teachers Section - Flexible width */}
                  <div className="w-full md:w-auto md:min-w-[240px]">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <GraduationCap className="h-5 w-5 text-blue-200 mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-300 mb-2">المعلمون</div>
                          {coreData.teachers && coreData.teachers.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {coreData.teachers.map((teacher, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm text-white"
                                >
                                  {teacher}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">لم يتم تحديد المعلمين</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: New Session Button */}
                <div className="border-t border-white/10 pt-4 mt-2">
                  <button
                    onClick={() => setShowConfirmation(true)}
                    className="w-full md:w-auto inline-flex items-center justify-center rounded-md text-sm font-medium h-11 px-5 bg-amber-600 hover:bg-amber-700 transition-colors text-white group"
                  >
                    <div className="flex items-center gap-2">
                      <PenLine className="h-5 w-5 transition-transform group-hover:scale-110" />
                      <span className="font-medium">حصة جديدة</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Class Info Section */}
        <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800/50 shadow-sm backdrop-blur-sm">
          {/* Section Header */}
          <div className="flex items-center gap-3 p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              تاريخ الحصة
            </h3>
          </div>

          {/* Section Content */}
          <div className="p-6 space-y-4">
            {/* Date Selection and Display */}
            <div className="space-y-3">
              {/* Date Input with Label */}
              <div className="space-y-2">

                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => {
                    setReportDate(e.target.value);
                    setFormattedDate(formatDate(e.target.value));
                  }}
                  className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 text-right"
                />
              </div>

              {/* Formatted Date Display */}
              <div className="rounded-md border border-gray-700 bg-gray-800/50 p-4 space-y-2">
                <div className="text-sm font-medium text-gray-400">سيظهر في الرسالة كالتالي:</div>
                <div className="flex items-center gap-2 text-gray-100">
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">{formattedDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Section */}
        <div className="border rounded-lg border-gray-700 bg-gray-800 overflow-hidden">
          {/* Section Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-700 bg-gray-750">
            <Users className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold">سجل الحضور</h3>
            <span className="ml-auto text-sm text-gray-400">
              {coreData.students.filter(student => attendance[student.id]?.present).length} / {coreData.students.length} حاضر
            </span>
          </div>

          {/* Attendance Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {coreData.students.map((student) => (
              <AttendanceCard
                key={student.id}
                student={student}
                initialStatus={attendance[student.id]}
                onAttendanceChange={handleAttendanceChange}
              />
            ))}
          </div>
        </div>

        {/* Homework Section */}
        <div className="mb-4 rounded-lg border border-gray-700 bg-gray-800 shadow-sm">
          <HomeworkSection
            students={coreData.students}
            homework={homework}
            onHomeworkChange={setHomework}
            attendance={attendance}
          />
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

        {/* Footer Actions */}
        <div className="relative">
          <div className="mt-8 flex justify-center">
            {/* Copy Message Button */}
            <button
              onClick={copyToClipboard}
              disabled={copyStatus === 'copying'}
              className={`
        inline-flex items-center justify-center rounded-md text-sm font-medium 
        h-12 px-6 py-2 transition-colors text-white group w-full max-w-md
        ${copyStatus === 'copied'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'}
      `}
            >
              <div className="flex items-center gap-2">
                {copyStatus === 'copying' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : copyStatus === 'copied' ? (
                  <Check className="h-5 w-5 transition-transform group-hover:scale-110" />
                ) : (
                  <Copy className="h-5 w-5 transition-transform group-hover:scale-110" />
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

            {/* Copy Success Notification */}
            <div className={`
      absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full
      transition-opacity duration-200 pointer-events-none
      ${copyStatus === 'copied' ? 'opacity-100' : 'opacity-0'}  
    `}>
              <div className="bg-green-600 text-white px-4 py-2 rounded-md shadow-lg text-sm whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>تم نسخ الرسالة بنجاح</span>
                </div>
              </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">
                    هل أنت متأكد؟
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">
                    سيتم مسح جميع البيانات الحالية وبدء حصة جديدة. لا يمكن التراجع عن هذا الإجراء.
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
            )}
          </div>
        </div>
      </div>
    );
  };

  return renderContent();
};

// Add this export statement at the end of the file
export default WeeklyMessageGenerator;