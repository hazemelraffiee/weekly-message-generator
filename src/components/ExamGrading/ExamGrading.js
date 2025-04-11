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

  // Function to clear data with confirmation
  const clearData = useCallback(() => {
    // First clear the in-memory states immediately
    setGrades({});
    setComments({});
    setExemptions({});

    // Then clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('examGrading_')) {
        localStorage.removeItem(key);
      }
    });

    // Force a complete refresh to ensure clean slate
    window.location.reload();
  }, [setGrades, setComments, setExemptions]);

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
            <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMyIvPjwvc3ZnPg==')]"></div>

            {/* Content container with proper spacing */}
            <div className="relative p-5 sm:p-6 md:p-8">
              {/* Top section with school name */}
              <div className="flex items-center gap-2 text-blue-200 mb-3">
                <PenLine className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm font-medium">{data.schoolName}</span>
              </div>

              {/* Main content grid for better responsive layout */}
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 lg:gap-6 items-start">
                {/* Class and exam info - takes more space on desktop */}
                <div className="lg:col-span-5">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">{data.className}</h1>

                  <div className="inline-flex items-center px-4 py-2.5 bg-blue-600/40 backdrop-blur-sm border border-blue-400/20 rounded-lg text-white gap-2 shadow-md">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300" />
                    <span className="font-semibold text-sm sm:text-base">{examConfig.examName}</span>
                  </div>
                </div>

                {/* New exam button - aligned right on desktop */}
                <div className="lg:col-span-2 flex justify-start lg:justify-end mt-4 lg:mt-0">
                  <button
                    onClick={() => setShowConfirmation(true)}
                    className="group flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-lg shadow-lg transition-all duration-300 text-white w-full sm:w-auto"
                  >
                    <PenLine className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:rotate-12" />
                    <span className="font-medium text-sm sm:text-base">اختبار جديد</span>
                  </button>
                </div>
              </div>

              {/* Stats section with improved responsive grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-8">
                {/* Student count */}
                <div className="bg-blue-700/50 backdrop-blur-sm rounded-lg border border-blue-500/30 p-4 hover:bg-blue-600/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-blue-500/20 rounded-full">
                      <Users className="h-5 w-5 text-blue-300" />
                    </div>
                    <div>
                      <div className="text-xs text-blue-200">الطلاب</div>
                      <div className="text-lg sm:text-xl font-bold text-white">{data.students.length}</div>
                    </div>
                  </div>
                </div>

                {/* Completed count */}
                <div className="bg-blue-700/50 backdrop-blur-sm rounded-lg border border-blue-500/30 p-4 hover:bg-blue-600/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-green-500/20 rounded-full">
                      <Info className="h-5 w-5 text-green-300" />
                    </div>
                    <div>
                      <div className="text-xs text-blue-200">مكتمل</div>
                      <div className="text-lg sm:text-xl font-bold text-white">
                        {data.students.filter(student => isStudentFullyGraded(student.id)).length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Class average */}
                <div className="bg-blue-700/50 backdrop-blur-sm rounded-lg border border-blue-500/30 p-4 hover:bg-blue-600/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-yellow-500/20 rounded-full">
                      <BarChart2 className="h-5 w-5 text-yellow-300" />
                    </div>
                    <div>
                      <div className="text-xs text-blue-200">متوسط الصف</div>
                      <div className="text-lg sm:text-xl font-bold text-white">
                        {(() => {
                          // Only include students with complete grading in the average
                          const gradedStudents = data.students.filter(student => isStudentFullyGraded(student.id));
                          if (gradedStudents.length === 0) return "ــ";

                          const average = gradedStudents.reduce(
                            (sum, student) => sum + calculateGrade(student.id),
                            0
                          ) / gradedStudents.length;

                          return average.toFixed(1);
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grading Table */}
        {data.students.length > 0 && (
          <GradingTable
            students={data.students}
            types={getSectionsAsTypes()}
            grades={grades}
            comments={comments}
            onCommentChange={handleCommentChange}
            renderGradeCell={renderGradeCell}
            className="mb-8"
          />
        )}

        {/* Results Section */}
        <div className="mt-8 border border-gray-700 rounded-lg bg-gray-800 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
            <h2 className="text-xl font-bold mb-2 sm:mb-0">نتائج الاختبار</h2>
            <div className="flex items-center gap-3 text-sm">
              <div className="px-3 py-1.5 bg-gray-700/50 rounded-lg">
                <span className="text-gray-400 ml-1">عدد الطلاب:</span>
                <span className="font-medium">{data.students.length}</span>
                <span className="text-xs text-gray-500 mr-1">
                  ({(() => {
                    const completedCount = data.students.filter(student =>
                      isStudentFullyGraded(student.id)
                    ).length;
                    return `${completedCount} مكتمل`;
                  })()})
                </span>
              </div>
              <div className="px-3 py-1.5 bg-gray-700/50 rounded-lg">
                <span className="text-gray-400 ml-1">متوسط الصف:</span>
                <span className="font-medium">
                  {(() => {
                    // Only include students with complete grading in the average
                    const gradedStudents = data.students.filter(student =>
                      isStudentFullyGraded(student.id)
                    );

                    if (gradedStudents.length === 0) return "ــ";

                    const average = gradedStudents.reduce(
                      (sum, student) => sum + calculateGrade(student.id),
                      0
                    ) / gradedStudents.length;

                    return average.toFixed(1);
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Bulk exemption button */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من إعفاء جميع الخانات غير المقيمة؟ لا يمكن التراجع عن هذا الإجراء.')) {
                  // Mark all ungraded cells as exempt
                  const newExemptions = { ...exemptions };

                  data.students.forEach(student => {
                    const studentId = student.id;
                    const studentGrades = grades[studentId] || {};

                    if (!newExemptions[studentId]) {
                      newExemptions[studentId] = {};
                    }

                    // For each section that isn't graded yet, mark as exempt
                    examConfig.sections.forEach(section => {
                      const sectionId = section.id;
                      if (typeof studentGrades[sectionId] !== 'number' && !newExemptions[studentId][sectionId]) {
                        newExemptions[studentId][sectionId] = true;
                      }
                    });

                    // If no exemptions were added for this student, clean up
                    if (Object.keys(newExemptions[studentId]).length === 0) {
                      delete newExemptions[studentId];
                    }
                  });

                  setExemptions(newExemptions);
                }
              }}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white transition-colors"
            >
              <span>إعفاء جميع الخانات غير المقيمة</span>
            </button>
          </div>

          {/* Student results grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {data.students.map(student => {
              const fullyGraded = isStudentFullyGraded(student.id);
              const finalGrade = fullyGraded ? calculateGrade(student.id) : null;

              // Count exempt sections for this student
              const exemptCount = Object.keys(exemptions[student.id] || {}).length;

              return (
                <div key={student.id} className="bg-gray-700/30 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors overflow-hidden">
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 max-w-full">
                        <span className="shrink-0">{finalGrade !== null ? getFinalGradeEmoji(finalGrade) : '⏳'}</span>
                        <span className="font-medium truncate">{student.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {finalGrade !== null && (
                          <button
                            onClick={() => setActiveExplanationStudent(student)}
                            className="p-1 hover:bg-blue-900/30 rounded-full text-blue-400"
                            title="تفاصيل الدرجة"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        )}
                        {finalGrade !== null ? (
                          <span className={`px-2 py-1 rounded-md text-sm font-bold shrink-0 ${finalGrade <= 2.5 ? 'bg-green-500/20 text-green-300' :
                            finalGrade <= 4.0 ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                            {finalGrade.toFixed(1)}
                            {exemptCount > 0 && <sup className="text-purple-300 text-xs ml-0.5">*</sup>}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-md text-sm font-bold shrink-0 bg-gray-600/30 text-gray-400" title="لم يتم تقييم جميع الأقسام بعد">
                            ــ
                          </span>
                        )}
                      </div>
                    </div>

                    {exemptCount > 0 && (
                      <div className="mt-1 text-xs text-purple-300">
                        <span>معفى من {exemptCount} {exemptCount === 1 ? 'قسم' : 'أقسام'}</span>
                      </div>
                    )}

                    {comments[student.id] && (
                      <div className="text-xs text-gray-400 mt-2 line-clamp-2" title={comments[student.id]}>
                        <span className="text-gray-500">ملاحظات:</span> {comments[student.id]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Supervisor export section */}
          <div className="bg-blue-600/10 rounded-lg p-4 border border-blue-600/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-right">
                <h3 className="text-lg font-medium text-blue-300">إرسال التقرير للمشرف</h3>
                <p className="text-gray-400 text-sm">تصدير نتائج الاختبار كاملة لإرسالها للمشرف</p>
              </div>
              <ExportDataButton
                coreData={{
                  schoolName: data.schoolName,
                  className: data.className,
                  students: data.students,
                  examName: examConfig.examName,
                  examSections: examConfig.sections
                }}
                reportDate={new Date().toISOString().split('T')[0]}
                formattedDate={formatDate(new Date())}
                attendance={{}} // No attendance for exams
                homework={{}} // No homework for exams
                homeworkGrades={{
                  types: getSectionsAsTypes(),
                  grades: grades,
                  comments: comments
                }}
                examData={{
                  examName: examConfig.examName,
                  sections: examConfig.sections,
                  grades: grades,
                  comments: comments,
                  exemptions: exemptions, // Add exemptions to exported data
                  finalGrades: data.students.reduce((acc, student) => {
                    acc[student.id] = calculateGrade(student.id);
                    return acc;
                  }, {})
                }}
                onError={(error) => {
                  console.error('Export failed:', error);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}