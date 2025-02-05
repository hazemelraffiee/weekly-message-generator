import React from 'react';
import { Download, Check, Loader2 } from 'lucide-react';
import pako from 'pako';
import { homeworkTypes } from './HomeworkSection';

// Helper function to compress data
function compressData(jsonString) {
  // Always use pako for consistent compression across browsers
  const compressed = pako.deflate(jsonString, {
    level: 9,               // Maximum compression
    windowBits: 15,         // Default window size
    memLevel: 8,           // Default memory level
    strategy: 0            // Default strategy
  });
  
  // Convert to base64
  return btoa(String.fromCharCode.apply(null, compressed));
}

const ExportDataButton = ({ 
  coreData, 
  reportDate, 
  formattedDate, 
  attendance, 
  homework, 
  homeworkGrades,
  onError
}) => {
  const [exportStatus, setExportStatus] = React.useState('initial'); // 'initial', 'processing', 'success'

  const prepareExportData = () => {
    const attendanceByName = {};
    const gradesOrganizedByType = {};
    
    // Process attendance data for ALL students
    coreData.students.forEach(student => {
      // Get attendance data if it exists, otherwise mark as absent
      const attendanceData = attendance[student.id] || { present: false };
      attendanceByName[student.name] = attendanceData;
    });

    // Process homework grades
    Object.entries(homeworkGrades.types).forEach(([typeId, typeInfo]) => {
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

    // Construct the final data structure
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
      previousHomework: gradesOrganizedByType
    };
  };

  const handleExport = async () => {
    try {
      setExportStatus('processing');
      
      // Prepare the data
      const exportData = prepareExportData();
      
      // Convert to JSON and compress
      const jsonString = JSON.stringify(exportData);
      const compressedData = await compressData(jsonString);
      
      // Prepare a readable header with class and date information
      const header = `فصل: ${coreData.className}\n`;
      const dateInfo = `التاريخ: ${formattedDate}\n`;
      const separator = '---\n';
      
      // Combine header and compressed data
      const fullExport = header + dateInfo + separator + compressedData;
      
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
        return (
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span className="font-medium">نسخ تقرير الإشراف</span>
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