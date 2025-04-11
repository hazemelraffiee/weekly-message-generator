import React, { useState, useEffect } from 'react';
import { decompress } from '../../utils/dataUtils';
import GradingTable from '@/components/Common/GradingTable';
import GradeDisplay from '@/components/Common/GradeDisplay';
import ExportDataButton from '@/components/MessageGenerator/ExportDataButton';
import { getExamConfig } from '@/config/examConfig';

export default function ExamGrading() {
  const [data, setData] = useState(null);
  const [examConfig, setExamConfig] = useState(null);
  const [grades, setGrades] = useState({});
  const [comments, setComments] = useState({});
  const [exemptions, setExemptions] = useState({}); // Track exemptions

  // Load data from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('data');
    if (encoded) {
      try {
        const decoded = decompress(encoded);
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
  }, []);

  // Error state if data couldn't be loaded
  if (!data) return (
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

  // Custom renderer for grade cells in the table - using GradeDisplay to match homework grading UI
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
          showExemptOption={true} // Only in exam grading
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

  // If no exam configuration is available, show loading or error
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
        {/* Header section */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-2">{data.className}</h1>
          <div className="text-blue-100">{data.schoolName}</div>
          <div className="mt-4 px-4 py-3 bg-blue-700/50 border border-blue-400/30 rounded text-white">
            <span className="font-bold">{examConfig.examName}</span>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
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