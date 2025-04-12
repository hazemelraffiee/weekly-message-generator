import React, { useState, useEffect, useCallback, useRef } from 'react';
import { decompress } from '../../utils/dataUtils';
import { decodeData } from '@/components/LinkCreator/utils'
import GradingTable from '@/components/Common/GradingTable';
import GradeDisplay from '@/components/Common/GradeDisplay';
import ExportDataButton from '@/components/MessageGenerator/ExportDataButton';
import { getExamConfig } from '@/config/examConfig';
import { PenLine, Loader2, Info, X, School, Award, Users, BarChart2 } from 'lucide-react';
import { useHydration } from '@/context/HydrationContext';
import useClickOutside from '@/hooks/useClickOutside';

// Grade Explanation Dialog Component
const GradeExplanationDialog = ({ student, grades, exemptions, examConfig, onClose }) => {
  const dialogRef = useRef(null);
  useClickOutside(dialogRef, onClose);

  const studentId = student.id;
  const studentGrades = grades[studentId] || {};
  const studentExemptions = exemptions[studentId] || {};

  // Calculate weighted average details for explanation
  let totalWeightUsed = 0;
  let totalWeightedScore = 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div ref={dialogRef} className="bg-gray-800 rounded-lg p-4 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">حساب درجة {student.name}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-700/30 p-4 rounded-lg">
            <h4 className="font-medium mb-2">طريقة حساب الدرجة النهائية</h4>
            <p className="text-sm text-gray-300">
              يتم حساب الدرجة النهائية بناءً على المتوسط المرجح لدرجات الأقسام، مع مراعاة وزن كل قسم.
              {Object.keys(studentExemptions).length > 0 && " الأقسام المعفى منها لا تدخل في حساب المتوسط."}
            </p>
          </div>

          <div className="border border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-700/50">
                  <th className="p-2 text-right">القسم</th>
                  <th className="p-2 text-center">الدرجة</th>
                  <th className="p-2 text-center">الوزن</th>
                  <th className="p-2 text-center">النتيجة المرجحة</th>
                </tr>
              </thead>
              <tbody>
                {examConfig.sections.map(section => {
                  const sectionId = section.id;
                  const grade = studentGrades[sectionId];
                  const isExempt = studentExemptions[sectionId];
                  const weight = section.weight;

                  // Calculations for weighted average
                  let weightedScore = null;
                  if (!isExempt && typeof grade === 'number') {
                    weightedScore = grade * weight;
                    totalWeightedScore += weightedScore;
                    totalWeightUsed += weight;
                  }

                  return (
                    <tr key={sectionId} className="border-t border-gray-700">
                      <td className="p-2 text-right">{section.name}</td>
                      <td className="p-2 text-center">
                        {isExempt ? (
                          <span className="text-purple-300">معفى</span>
                        ) : typeof grade === 'number' ? (
                          <span className={`px-2 py-0.5 rounded ${grade <= 2.5 ? 'bg-green-500/20 text-green-300' :
                            grade <= 4.0 ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                            {grade.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-500">غير مقيم</span>
                        )}
                      </td>
                      <td className="p-2 text-center">{weight}</td>
                      <td className="p-2 text-center">
                        {weightedScore !== null ? weightedScore.toFixed(1) : '-'}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-700/30 font-medium">
                  <td className="p-2 text-right" colSpan="2">المجموع</td>
                  <td className="p-2 text-center">{totalWeightUsed}</td>
                  <td className="p-2 text-center">{totalWeightedScore.toFixed(1)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-blue-900/30 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">الدرجة النهائية:</span>
              <span className="font-bold text-lg">
                {totalWeightUsed > 0 ? (totalWeightedScore / totalWeightUsed).toFixed(1) : '-'}
              </span>
            </div>
            <div className="text-sm text-gray-300 mt-2">
              تم حساب الدرجة بقسمة مجموع الدرجات المرجحة ({totalWeightedScore.toFixed(1)}) على مجموع الأوزان ({totalWeightUsed})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom hook for localStorage persistence
const useLocalStorage = (key, initialValue) => {
  const isHydrated = useHydration();
  const [state, setState] = useState(() => {
    // During SSR or before hydration, return initial value
    if (!isHydrated) return initialValue;

    try {
      const item = localStorage.getItem(`examGrading_${key}`);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(`examGrading_${key}`, JSON.stringify(state));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, state, isHydrated]);

  return [state, setState];
};

export default function ExamGrading() {
  const isHydrated = useHydration();
  const [isMounted, setIsMounted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeExplanationStudent, setActiveExplanationStudent] = useState(null);

  // Replace useState with useLocalStorage for persistent data
  const [data, setData] = useState(null);
  const [examConfig, setExamConfig] = useState(null);
  const [grades, setGrades] = useLocalStorage('grades', {});
  const [comments, setComments] = useLocalStorage('comments', {});
  const [exemptions, setExemptions] = useLocalStorage('exemptions', {});
  const [skippedStudents, setSkippedStudents] = useLocalStorage('skippedStudents', {});

  // Function to clear data with confirmation
  const clearData = useCallback(() => {
    // First clear the in-memory states immediately
    setGrades({});
    setComments({});
    setExemptions({});
    setSkippedStudents({});

    // Then clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('examGrading_')) {
        localStorage.removeItem(key);
      }
    });

    // Force a complete refresh to ensure clean slate
    window.location.reload();
  }, [setGrades, setComments, setExemptions, setSkippedStudents]);

  // Load data from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('data');
    if (encoded) {
      try {
        let decoded;
        try {
          decoded = decompress(encoded);
          if (decoded == null) {
            decoded = decodeData(encoded);
          }
        } catch (e) {
          console.error('Error decoding data:', e);
        }
        if (decoded?.className && Array.isArray(decoded.students)) {
          const config = getExamConfig(decoded.className);

          setData({
            schoolName: decoded.schoolName || '',
            className: decoded.className,
            students: decoded.students.map(name => ({
              id: name.toLowerCase().replace(/\s+/g, '_'),
              name
            }))
          });

          setExamConfig(config);
        }
      } catch (err) {
        console.error("Error decoding URL data:", err);
      }
    }
    setIsLoading(false);
  }, []);

  // Set component as mounted on initial render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Toggle student skip status
  const toggleStudentSkipped = useCallback((studentId) => {
    setSkippedStudents(prev => {
      const newSkippedStudents = { ...prev };
      if (newSkippedStudents[studentId]) {
        delete newSkippedStudents[studentId];
      } else {
        newSkippedStudents[studentId] = true;
      }
      return newSkippedStudents;
    });
  }, [setSkippedStudents]);

  // Calculate the final grade for a student based on weighted average
  const calculateGrade = (studentId) => {
    if (!grades[studentId] || !examConfig?.sections) return 1;

    const studentGrades = grades[studentId];
    const studentExemptions = exemptions[studentId] || {};

    let weightedSum = 0;
    let totalWeightUsed = 0;

    examConfig.sections.forEach(section => {
      // Skip this section if student is exempt
      if (studentExemptions[section.id]) {
        return;
      }

      const grade = studentGrades[section.id];
      if (typeof grade === 'number') {
        weightedSum += (grade * section.weight);
        totalWeightUsed += section.weight;
      }
    });

    return totalWeightUsed === 0 ? 1 : weightedSum / totalWeightUsed;
  };

  // Handle grade changes
  const handleGradeChange = (studentId, sectionId, value) => {
    setGrades(prev => {
      const newGrades = { ...prev };
      if (!newGrades[studentId]) newGrades[studentId] = {};

      if (value === null) {
        // If removing grade
        delete newGrades[studentId][sectionId];
        if (Object.keys(newGrades[studentId]).length === 0) {
          delete newGrades[studentId];
        }
      } else {
        newGrades[studentId][sectionId] = value;
      }

      return newGrades;
    });

    // If setting a grade, ensure the student isn't exempt for this section
    if (value !== null) {
      setExemptions(prev => {
        const newExemptions = { ...prev };
        if (newExemptions[studentId] && newExemptions[studentId][sectionId]) {
          delete newExemptions[studentId][sectionId];
          if (Object.keys(newExemptions[studentId]).length === 0) {
            delete newExemptions[studentId];
          }
        }
        return newExemptions;
      });
    }
  };

  // Handle exemption changes
  const handleExemptChange = (studentId, sectionId, isExempt) => {
    setExemptions(prev => {
      const newExemptions = { ...prev };

      if (isExempt) {
        // Setting exemption
        if (!newExemptions[studentId]) newExemptions[studentId] = {};
        newExemptions[studentId][sectionId] = true;

        // Remove any existing grade for this section
        setGrades(prevGrades => {
          const newGrades = { ...prevGrades };
          if (newGrades[studentId] && newGrades[studentId][sectionId]) {
            delete newGrades[studentId][sectionId];
            if (Object.keys(newGrades[studentId]).length === 0) {
              delete newGrades[studentId];
            }
          }
          return newGrades;
        });
      } else {
        // Removing exemption
        if (newExemptions[studentId] && newExemptions[studentId][sectionId]) {
          delete newExemptions[studentId][sectionId];
          if (Object.keys(newExemptions[studentId]).length === 0) {
            delete newExemptions[studentId];
          }
        }
      }

      return newExemptions;
    });
  };

  // Handle comment changes
  const handleCommentChange = (studentId, comment) => {
    setComments(prev => {
      const newComments = { ...prev };
      if (!comment) {
        delete newComments[studentId];
      } else {
        newComments[studentId] = comment;
      }
      return newComments;
    });
  };

  // Convert exam sections to the format expected by GradingTable
  const getSectionsAsTypes = () => {
    if (!examConfig?.sections) return {};

    const types = {};
    examConfig.sections.forEach(section => {
      types[section.id] = {
        ...section,
        label: section.name,
        gradingSystem: 'german',
        minGrade: 1.0,
        maxGrade: 6.0
      };
    });
    return types;
  };

  // Custom renderer for grade cells in the table
  const renderGradeCell = (student, sectionId, currentValue, section) => {
    const studentId = student.id;
    const isExempt = exemptions[studentId]?.[sectionId] === true;
    const isSkipped = skippedStudents[studentId];

    if (isSkipped) {
      return (
        <div className="w-full text-center opacity-50 line-through">
          {currentValue ? currentValue.toFixed(1) : "-"}
        </div>
      );
    }

    return (
      <div className="w-full text-center">
        <GradeDisplay
          initialValue={currentValue ? Number(currentValue) : null}
          gradingSystem="german"
          editable={true}
          min={1.0}
          max={6.0}
          isExempt={isExempt}
          showExemptOption={true}
          onChange={(value) => handleGradeChange(student.id, sectionId, value)}
          onExempt={(exempt) => handleExemptChange(student.id, sectionId, exempt)}
          placeholder={(() => {
            const names = student.name.trim().split(' ');
            return names[0] === 'عبد' && names[1] ? `${names[0]} ${names[1]}` : names[0];
          })()}
          studentName={student.name}
          homeworkType={section.label}
        />
      </div>
    );
  };

  // Helper function to get appropriate emoji based on grade
  const getFinalGradeEmoji = (grade) => {
    const numGrade = parseFloat(grade);
    if (numGrade <= 1.5) return '🏆';
    if (numGrade <= 2.5) return '✨';
    if (numGrade <= 3.5) return '👍';
    if (numGrade <= 4.0) return '💪';
    return '📚';
  };

  // Check if a student has all required sections graded or exempt
  const isStudentFullyGraded = (studentId) => {
    const studentGrades = grades[studentId] || {};
    const studentExemptions = exemptions[studentId] || {};

    return examConfig.sections.every(section =>
      typeof studentGrades[section.id] === 'number' || studentExemptions[section.id] === true
    );
  };

  const formatDate = (dateStr) => {
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

    // Format Hijri date using Umm al-Qura calendar
    const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', options);
    const hijriParts = hijriFormatter.formatToParts(date);
    let hijriDate = '';

    hijriParts.forEach(part => {
      if (part.type === 'weekday') hijriDate += part.value + '، ';
      else if (['day', 'month', 'year'].includes(part.type)) hijriDate += part.value + ' ';
      else if (part.type === 'literal' && part.value !== '، ') hijriDate += part.value;
    });
    hijriDate = hijriDate.trim() + ' هـ';

    return `${hijriDate} الموافق ${gregorianDate}`;
  };

  // Render confirmation modal
  const renderConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full shadow-lg">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          هل أنت متأكد؟
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          سيتم مسح جميع البيانات الحالية وبدء اختبار جديد. لا يمكن التراجع عن هذا الإجراء.
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

  // Error state if data couldn't be loaded
  if (!data && !isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100" dir="rtl">
      <div className="max-w-md text-center p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-500">خطأ في البيانات</h1>
        <p className="mb-6">عذراً، لا يمكن عرض الصفحة. يرجى التأكد من صحة الرابط.</p>
        <a href="/linkcreator" className="inline-flex px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700">
          العودة إلى صفحة إنشاء الرابط
        </a>
      </div>
    </div>
  );

  // Loading state
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

  // If no exam configuration is available, show error
  if (!examConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100" dir="rtl">
        <div className="text-center p-8">
          <div className="mb-4 text-blue-400">جاري تحميل البيانات...</div>
        </div>
      </div>
    );
  }

  // Filter out skipped students for statistics and results
  const activeStudents = data.students.filter(student => !skippedStudents[student.id]);
  
  // Calculate statistics only for active students
  const fullyGradedStudents = activeStudents.filter(student => isStudentFullyGraded(student.id));
  const classAverage = fullyGradedStudents.length > 0 
    ? fullyGradedStudents.reduce((sum, student) => sum + calculateGrade(student.id), 0) / fullyGradedStudents.length
    : null;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Confirmation dialog */}
        {showConfirmation && renderConfirmationModal()}

        {/* Grade explanation dialog */}
        {activeExplanationStudent && (
          <GradeExplanationDialog
            student={activeExplanationStudent}
            grades={grades}
            exemptions={exemptions}
            examConfig={examConfig}
            onClose={() => setActiveExplanationStudent(null)}
          />
        )}

        {/* Header Section */}
        <div className="mb-8">
          {/* Main card with layered design */}
          <div className="relative rounded-xl overflow-hidden shadow-xl border border-blue-500/30">
            {/* Background gradient with subtle pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700"></div>
            <div className="absolute inset-0 
