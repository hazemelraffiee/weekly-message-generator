// src/components/ExamGrading/ExamGrading.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { decompress } from '../../utils/dataUtils';
import { decodeData } from '@/components/LinkCreator/utils';
import GradingTable from '@/components/Common/GradingTable';
import GradeDisplay from '@/components/Common/GradeDisplay';
import ExportDataButton from '@/components/MessageGenerator/ExportDataButton';
import { getExamConfig } from '@/config/examConfig';
import { PenLine, Loader2, Info, X, School, Award, Users, BarChart2, CheckCircle } from 'lucide-react';
import { useHydration } from '@/context/HydrationContext';
import useClickOutside from '@/hooks/useClickOutside';

// Grade Explanation Dialog Component
const GradeExplanationDialog = ({ student, grades, exemptions, sections, onClose }) => {
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
                {sections.map(section => {
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
                          <span className={`px-2 py-0.5 rounded ${
                            grade <= 2.5 ? 'bg-green-500/20 text-green-300' :
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

// Notification Component
const Notification = ({ message, type = 'success', onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-amber-600';
  const Icon = type === 'success' ? CheckCircle : Info;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 left-4 right-4 ${bgColor} text-white p-3 rounded-lg shadow-lg z-50 max-w-md mx-auto`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <span className="text-sm font-medium">{message}</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-full"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Custom hook for localStorage persistence
const useLocalStorage = (key, initialValue) => {
  const isHydrated = useHydration();
  
  // Initialize state with a function to only run once
  const [state, setState] = useState(() => {
    if (!isHydrated) return initialValue;
    
    try {
      const item = localStorage.getItem(`examGrading_${key}`);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  // Save to localStorage when state changes
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [activeExplanationStudent, setActiveExplanationStudent] = useState(null);
  const [notification, setNotification] = useState(null);

  // Data state
  const [data, setData] = useState(null);
  const [examConfig, setExamConfig] = useState(null);
  
  // Configuration selection state
  const [selectedConfigIndex, setSelectedConfigIndex] = useLocalStorage('selectedConfigIndex', 0);
  const [showConfigChangeConfirmation, setShowConfigChangeConfirmation] = useState(false);
  const [pendingConfigIndex, setPendingConfigIndex] = useState(null);

  // Grading state
  const [grades, setGrades] = useLocalStorage('grades', {});
  const [comments, setComments] = useLocalStorage('comments', {});
  const [exemptions, setExemptions] = useLocalStorage('exemptions', {});
  const [skippedStudents, setSkippedStudents] = useLocalStorage('skippedStudents', {});

  // Get current active config sections
  const activeSections = examConfig?.configs?.[selectedConfigIndex]?.sections || [];

  // Function to handle config change
  const handleConfigChange = (newIndex) => {
    if (newIndex === selectedConfigIndex) return;
    
    // Check if there are any grades data
    const hasGrades = Object.keys(grades).length > 0;
    
    if (hasGrades) {
      // Show confirmation dialog
      setPendingConfigIndex(newIndex);
      setShowConfigChangeConfirmation(true);
    } else {
      // If no grades yet, just change the config
      setSelectedConfigIndex(newIndex);
      showNotification('تم تغيير تكوين الاختبار');
    }
  };

  // Function to confirm config change
  const confirmConfigChange = () => {
    // Clear existing grading data
    setGrades({});
    setComments({});
    setExemptions({});
    // Update selected config
    setSelectedConfigIndex(pendingConfigIndex);
    // Close confirmation dialog
    setShowConfigChangeConfirmation(false);
    // Show success message
    showNotification('تم تغيير تكوين الاختبار وإعادة ضبط البيانات');
  };

  // Function to display notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  // Function to clear data with confirmation
  const clearData = useCallback(() => {
    // Clear all data
    setGrades({});
    setComments({});
    setExemptions({});
    setSkippedStudents({});

    // Clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('examGrading_')) {
        localStorage.removeItem(key);
      }
    });

    setShowConfirmation(false);
    showNotification('تم إعادة ضبط البيانات بنجاح');
  }, [setGrades, setComments, setExemptions, setSkippedStudents]);

  // Load data from URL parameters
  useEffect(() => {
    if (!isHydrated) return;

    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('data');
    
    if (!encoded) {
      setLoadingError('No data parameter found in URL');
      setIsLoading(false);
      return;
    }

    try {
      let decoded;
      try {
        decoded = decompress(encoded);
        if (decoded == null) {
          decoded = decodeData(encoded);
        }
      } catch (e) {
        console.error('Error decoding data:', e);
        setLoadingError('Failed to decode data from URL');
        setIsLoading(false);
        return;
      }

      if (!decoded?.className || !Array.isArray(decoded.students)) {
        setLoadingError('Invalid data format');
        setIsLoading(false);
        return;
      }

      // Get config for this class
      const config = getExamConfig(decoded.className);
      
      // Check if config is valid
      if (!config || !config.configs || !Array.isArray(config.configs) || config.configs.length === 0) {
        setLoadingError('Invalid exam configuration');
        setIsLoading(false);
        return;
      }

      // Set data and config
      setData({
        schoolName: decoded.schoolName || '',
        className: decoded.className,
        students: decoded.students.map(name => ({
          id: name.toLowerCase().replace(/\s+/g, '_'),
          name
        }))
      });
      
      setExamConfig(config);
      
      // Ensure selected config index is valid
      const validConfigIndex = 
        selectedConfigIndex >= config.configs.length ? 0 : selectedConfigIndex;
      
      // Only set if different to avoid a render loop
      if (validConfigIndex !== selectedConfigIndex) {
        setSelectedConfigIndex(validConfigIndex);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error("Error processing URL data:", err);
      setLoadingError('Failed to process data');
      setIsLoading(false);
    }
  // Removed selectedConfigIndex from dependency array to prevent loop
  }, [isHydrated, setSelectedConfigIndex]);

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
    if (!grades[studentId] || activeSections.length === 0) return null;

    const studentGrades = grades[studentId];
    const studentExemptions = exemptions[studentId] || {};

    let weightedSum = 0;
    let totalWeightUsed = 0;

    activeSections.forEach(section => {
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

    return totalWeightUsed === 0 ? null : weightedSum / totalWeightUsed;
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
    if (activeSections.length === 0) return {};

    const types = {};
    activeSections.forEach(section => {
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
    if (!grade) return '⏳';
    
    const numGrade = parseFloat(grade);
    if (numGrade <= 1.5) return '🏆';
    if (numGrade <= 2.5) return '✨';
    if (numGrade <= 3.5) return '👍';
    if (numGrade <= 4.0) return '💪';
    return '📚';
  };

  // Check if a student has all required sections graded or exempt
  const isStudentFullyGraded = (studentId) => {
    if (activeSections.length === 0) return false;
    
    const studentGrades = grades[studentId] || {};
    const studentExemptions = exemptions[studentId] || {};

    return activeSections.every(section =>
      typeof studentGrades[section.id] === 'number' || studentExemptions[section.id] === true
    );
  };

  const formatDate = (date) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    // Format Gregorian date
    const gregorianFormatter = new Intl.DateTimeFormat('ar', options);
    const gregorianDate = gregorianFormatter.format(date) + ' م';

    // Format Hijri date using Umm al-Qura calendar
    const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', options);
    const hijriDate = hijriFormatter.format(date) + ' هـ';

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
            onClick={clearData}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );

  // Render config change confirmation modal
  const renderConfigChangeConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full shadow-lg">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          تغيير تكوين الاختبار
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          سيؤدي تغيير تكوين الاختبار إلى مسح جميع بيانات التقييم الحالية. هل أنت متأكد من المتابعة؟
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={() => setShowConfigChangeConfirmation(false)}
            className="px-4 py-2 rounded-md bg-gray-600 text-gray-100 hover:bg-gray-700 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={confirmConfigChange}
            className="px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors"
          >
            تغيير التكوين
          </button>
        </div>
      </div>
    </div>
  );

  // Error state if data couldn't be loaded
  if (loadingError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100" dir="rtl">
        <div className="max-w-md text-center p-8">
          <h1 className="text-2xl font-bold mb-4 text-red-500">خطأ في البيانات</h1>
          <p className="mb-6">عذراً، لا يمكن عرض الصفحة. {loadingError}</p>
          <a href="/linkcreator" className="inline-flex px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700">
            العودة إلى صفحة إنشاء الرابط
          </a>
        </div>
      </div>
    );
  }

  // Loading state - only show when explicitly loading and hydrated
  if (isLoading && isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900" dir="rtl">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span>جاري التحميل...</span>
        </div>
      </div>
    );
  }

  // If not hydrated yet, show minimal loading state
  if (!isHydrated) {
    return <div className="min-h-screen bg-gray-900"></div>;
  }

  // If no valid data or config after loading is complete
  if (!data || !examConfig || !examConfig.configs || examConfig.configs.length === 0) {
    return (
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
  }

  // Get active config
  const activeConfig = examConfig.configs[selectedConfigIndex];
  
  // Filter out skipped students for statistics and results
  const activeStudents = data.students.filter(student => !skippedStudents[student.id]);
  
  // Calculate statistics only for active students
  const fullyGradedStudents = activeStudents.filter(student => isStudentFullyGraded(student.id));
  
  // Calculate class average only if we have fully graded students
  const classAverage = fullyGradedStudents.length > 0 
    ? fullyGradedStudents.reduce((sum, student) => {
        const grade = calculateGrade(student.id);
        return sum + (grade || 0);
      }, 0) / fullyGradedStudents.length
    : null;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Notifications */}
        {notification && (
          <Notification 
            message={notification.message} 
            type={notification.type} 
            onClose={() => setNotification(null)} 
          />
        )}

        {/* Confirmation dialogs */}
        {showConfirmation && renderConfirmationModal()}
        {showConfigChangeConfirmation && renderConfigChangeConfirmationModal()}

        {/* Grade explanation dialog */}
        {activeExplanationStudent && (
          <GradeExplanationDialog
            student={activeExplanationStudent}
            grades={grades}
            exemptions={exemptions}
            sections={activeSections}
            onClose={() => setActiveExplanationStudent(null)}
          />
        )}

        {/* New Streamlined Header */}
        <header className="mb-6">
          <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {/* Main header content */}
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between">
              {/* Left side - Class and exam info */}
              <div className="flex flex-col">
                <div className="text-xs text-gray-400 mb-1">{data.schoolName}</div>
                <h1 className="text-xl font-bold">{data.className}</h1>
                <div className="text-blue-400 text-sm mt-1">{examConfig.examName}</div>
              </div>
              
              {/* Right side - Actions */}
              <div className="flex items-center gap-3 mt-4 md:mt-0">
                {/* Config selector - only show if multiple configs */}
                {examConfig.configs.length > 1 && (
                  <div className="relative">
                    <select
                      value={selectedConfigIndex}
                      onChange={(e) => handleConfigChange(parseInt(e.target.value))}
                      className="bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {examConfig.configs.map((config, index) => (
                        <option key={index} value={index}>
                          {config.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Reset button */}
                <button
                  onClick={() => setShowConfirmation(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded px-3 py-2 text-sm font-medium"
                >
                  اختبار جديد
                </button>
              </div>
            </div>
            
            {/* Stats bar */}
            <div className="bg-gray-700 grid grid-cols-3 divide-x divide-gray-600 text-center">
              <div className="py-2 px-3">
                <div className="text-xs text-gray-400">الطلاب</div>
                <div className="font-bold">{activeStudents.length}</div>
              </div>
              <div className="py-2 px-3">
                <div className="text-xs text-gray-400">مكتمل</div>
                <div className="font-bold">{fullyGradedStudents.length}</div>
              </div>
              <div className="py-2 px-3">
                <div className="text-xs text-gray-400">المتوسط</div>
                <div className="font-bold">
                  {classAverage !== null ? classAverage.toFixed(1) : "—"}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Grading Table */}
        {activeStudents.length > 0 && activeSections.length > 0 && (
          <GradingTable
            students={data.students}
            types={getSectionsAsTypes()}
            grades={grades}
            comments={comments}
            skippedStudents={skippedStudents}
            onToggleSkip={toggleStudentSkipped}
            onCommentChange={handleCommentChange}
            renderGradeCell={renderGradeCell}
            className="mb-8"
          />
        )}

        {/* Results Section */}
        <div className="mt-8 border border-gray-700 rounded-lg bg-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-bold">نتائج الاختبار</h2>
            
            {/* Bulk exemption button */}
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من إعفاء جميع الخانات غير المقيمة؟')) {
                  // Mark all ungraded cells as exempt
                  const newExemptions = { ...exemptions };

                  // Only apply to active (non-skipped) students
                  activeStudents.forEach(student => {
                    const studentId = student.id;
                    const studentGrades = grades[studentId] || {};

                    if (!newExemptions[studentId]) {
                      newExemptions[studentId] = {};
                    }

                    // For each section that isn't graded yet, mark as exempt
                    activeSections.forEach(section => {
                      const sectionId = section.id;
                      if (typeof studentGrades[sectionId] !== 'number' && !newExemptions[studentId][sectionId]) {
                        newExemptions[studentId][sectionId] = true;
                      }
                    });

                    // Clean up if no exemptions were added
                    if (Object.keys(newExemptions[studentId]).length === 0) {
                      delete newExemptions[studentId];
                    }
                  });

                  setExemptions(newExemptions);
                  showNotification('تم إعفاء جميع الخانات غير المقيمة');
                }
              }}
              className="text-xs bg-purple-700 hover:bg-purple-800 text-white py-1 px-2 rounded"
            >
              إعفاء غير المقيم
            </button>
          </div>

          {/* Student results grid */}
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {activeStudents.map(student => {
                const fullyGraded = isStudentFullyGraded(student.id);
                const finalGrade = fullyGraded ? calculateGrade(student.id) : null;
                const exemptCount = Object.keys(exemptions[student.id] || {}).length;

                return (
                  <div key={student.id} className={`bg-gray-700/30 rounded border ${fullyGraded ? 'border-gray-600' : 'border-gray-700'} hover:border-gray-500 transition-colors overflow-hidden`}>
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 max-w-[70%]">
                          <span className="shrink-0">{getFinalGradeEmoji(finalGrade)}</span>
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
                            <span className={`px-2 py-1 rounded text-sm font-bold shrink-0 ${
                              finalGrade <= 2.5 ? 'bg-green-500/20 text-green-300' :
                              finalGrade <= 4.0 ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {finalGrade.toFixed(1)}
                              {exemptCount > 0 && <sup className="text-purple-300 text-xs ml-0.5">*</sup>}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-sm font-bold shrink-0 bg-gray-600/30 text-gray-400" title="لم يتم تقييم جميع الأقسام بعد">
                              —
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
                        <div className="text-xs text-gray-400 mt-2 line-clamp-1" title={comments[student.id]}>
                          <span className="text-gray-500">ملاحظات:</span> {comments[student.id]}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export button */}
          <div className="p-4 border-t border-gray-700 flex justify-end">
            <ExportDataButton
              coreData={{
                schoolName: data.schoolName,
                className: data.className,
                students: activeStudents,
                examName: examConfig.examName,
                examSections: activeSections
              }}
              reportDate={new Date().toISOString().split('T')[0]}
              formattedDate={formatDate(new Date())}
              attendance={{}}
              homework={{}}
              homeworkGrades={{
                types: getSectionsAsTypes(),
                grades: grades,
                comments: comments
              }}
              examData={{
                examName: examConfig.examName,
                configName: activeConfig.name,
                sections: activeSections,
                grades: grades,
                comments: comments,
                exemptions: exemptions,
                finalGrades: activeStudents.reduce((acc, student) => {
                  const grade = calculateGrade(student.id);
                  if (grade !== null) {
                    acc[student.id] = grade;
                  }
                  return acc;
                }, {})
              }}
              onError={(error) => {
                console.error('Export failed:', error);
                showNotification('فشل تصدير التقرير', 'error');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
