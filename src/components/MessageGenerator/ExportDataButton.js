import React from 'react';
import { Download, Check, Loader2 } from 'lucide-react';
import { compress } from '@/utils/dataUtils';

const ExportDataButton = ({ 
  coreData, 
  reportDate, 
  formattedDate, 
  attendance, 
  homework, 
  homeworkGrades,
  examData,
  onError
}) => {
  const [exportStatus, setExportStatus] = React.useState('initial'); // 'initial', 'processing', 'success'

  const prepareExportData = () => {
    // Check if we're dealing with exam data or regular weekly report
    const isExamData = !!examData;

    if (isExamData) {
      // ===== Prepare exam data export =====
      const gradesOrganizedByStudent = {};
      
      // Process exam grades for each student
      coreData.students.forEach(student => {
        gradesOrganizedByStudent[student.name] = {
          finalGrade: examData.finalGrades[student.id],
          sectionGrades: {},
          comments: homeworkGrades.comments[student.id] || ''
        };
        
        // Add section grades for this student
        examData.sections.forEach(section => {
          const sectionGrade = examData.grades[student.id]?.[section.id];
          if (sectionGrade) {
            gradesOrganizedByStudent[student.name].sectionGrades[section.name] = {
              grade: sectionGrade,
              weight: section.weight
            };
          }
        });
      });

      // Construct the final data structure for exam export
      return {
        metadata: {
          schoolName: coreData.schoolName,
          className: coreData.className,
          date: {
            raw: reportDate,
            formatted: formattedDate
          },
          examName: examData.examName
        },
        examSections: examData.sections.map(section => ({
          id: section.id,
          name: section.name,
          weight: section.weight
        })),
        studentResults: gradesOrganizedByStudent,
        exportType: 'exam'
      };
      
    } else {
      // ===== Prepare weekly report data export (original functionality) =====
      const attendanceByName = {};
      const gradesOrganizedByType = {};
      
      // Process attendance data for ALL students
      coreData.students.forEach(student => {
        // Get attendance data if it exists, otherwise mark as absent
        const attendanceData = attendance[student.id] || { present: false };
        attendanceByName[student.name] = attendanceData;
      });

      // Process homework grades
      Object.entries(coreData.homeworkTypes).forEach(([typeId, typeInfo]) => {
        gradesOrganizedByType[typeInfo.label] = {};
        
        Object.entries(homeworkGrades.grades).forEach(([studentId, grades]) => {
          const student = coreData.students.find(s => s.id === studentId);
          if (student && grades[typeId]) {
            gradesOrganizedByType[typeInfo.label][student.name] = grades[typeId];
          }
        });
      });

      // Process homework assignments
      const processedHomework = {
        assignments: (homework.assignments || []).map(assignment => ({
          type: homeworkGrades.types[assignment.type]?.label || assignment.type,
          content: assignment.content,
          assignedStudents: assignment.assignedStudents 
            ? assignment.assignedStudents.map(
                studentId => coreData.students.find(s => s.id === studentId)?.name
              ).filter(Boolean)
            : null
        }))
      };

      // Construct the final data structure for weekly report
      return {
        metadata: {
          schoolName: coreData.schoolName,
          className: coreData.className,
          date: {
            raw: reportDate,
            formatted: formattedDate
          }
        },
        attendance: attendanceByName,
        homework: processedHomework,
        previousHomework: gradesOrganizedByType,
        exportType: 'weekly'
      };
    }
  };

  const handleExport = async () => {
    try {
      setExportStatus('processing');
      
      // Prepare the data
      const exportData = prepareExportData();
      
      // Convert to JSON and compress
      const jsonString = JSON.stringify(exportData);
      const compressedData = await compress(jsonString);
      
      // Prepare a readable header with class and date information
      const isExam = !!examData;
      const header = `فصل: ${coreData.className}\n`;
      const dateInfo = `التاريخ: ${formattedDate}\n`;
      const typeInfo = isExam ? `اختبار: ${examData.examName}\n` : '';
      const separator = '---\n';
      
      // Combine header and compressed data
      const fullExport = header + dateInfo + typeInfo + separator + compressedData;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(fullExport);
      
      // Update status
      setExportStatus('success');
      setTimeout(() => setExportStatus('initial'), 2000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('initial');
      onError?.(error);
    }
  };

  const getButtonContent = () => {
    switch (exportStatus) {
      case 'processing':
        return (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-medium">جارٍ النسخ...</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span className="font-medium">تم النسخ</span>
          </div>
        );
      default:
        const isExam = !!examData;
        return (
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span className="font-medium">
              {isExam ? 'نسخ تقرير الاختبار للمشرف' : 'نسخ تقرير الإشراف'}
            </span>
          </div>
        );
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exportStatus !== 'initial'}
      className={`
        inline-flex items-center justify-center rounded-md text-sm font-medium 
        h-12 px-6 py-2 transition-colors text-white group w-full md:w-auto
        ${exportStatus === 'success'
          ? 'bg-green-600 hover:bg-green-700'
          : 'bg-blue-600 hover:bg-blue-700'}
      `}
    >
      {getButtonContent()}
    </button>
  );
};

export default ExportDataButton;