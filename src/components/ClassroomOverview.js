import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Folder, AlertCircle, Upload, Menu, X, Users, Clock, GraduationCap, TrendingUp } from 'lucide-react';

import ClassroomAnalytics from '@/components/ClassroomAnalytics';

const ClassroomOverview = () => {
  // State for search and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    attendanceThreshold: 0,
    gradeThreshold: 0,
    absenceDuration: 0,
  });

  // Handle file drop event
  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    );

    if (files.length === 0) {
      setError('الرجاء إرفاق ملفات Excel فقط');
      return;
    }

    await handleFiles(files);
  };

  // Handle file input change
  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    await handleFiles(files);
  };

  // Process uploaded files
  const handleFiles = async (files) => {
    setUploading(true);
    setError('');
    setStatus('جاري معالجة الملفات...');

    try {
      const newClassroomData = {};
      for (const file of files) {
        const classData = await processExcelFile(file);
        newClassroomData[classData.className] = classData;
      }

      setClassroomData(newClassroomData);
      setSelectedClassroom('overview');
      setStatus('');
    } catch (err) {
      console.error('Error processing files:', err);
      setError(`خطأ في معالجة الملفات: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [classroomData, setClassroomData] = useState({});
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Calculate summary statistics for filtered data
  const getFilteredStats = () => {
    const filteredStudents = getFilteredStudents();
    return {
      count: filteredStudents.length,
      averageAttendance: filteredStudents.reduce((sum, student) => sum + student.attendanceRate, 0) / filteredStudents.length || 0,
      averageGrade: filteredStudents.reduce((sum, student) => sum + student.averageGrade, 0) / filteredStudents.length || 0,
      atRiskCount: filteredStudents.filter(s => s.absenceDuration >= 21).length
    };
  };

  // Function to handle column header clicks
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Sorting function for table columns
  const sortData = (students, key) => {
    return [...students].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      // Handle special cases for sorting
      if (key === 'lastAttendanceDate') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }

      if (sortConfig.direction === 'ascending') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  };

  // Function to filter students based on search and filters
  const getFilteredStudents = () => {
    if (!selectedClassroom || !classroomData[selectedClassroom]) return [];

    let students = Object.values(classroomData[selectedClassroom].students);

    // Apply search filter
    if (searchTerm) {
      students = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply numerical filters
    if (filters.attendanceThreshold > 0) {
      students = students.filter(student =>
        student.attendanceRate >= filters.attendanceThreshold
      );
    }

    if (filters.gradeThreshold > 0) {
      students = students.filter(student =>
        student.averageGrade >= filters.gradeThreshold
      );
    }

    if (filters.absenceDuration > 0) {
      students = students.filter(student =>
        student.absenceDuration >= filters.absenceDuration
      );
    }

    // Apply sorting if configured
    if (sortConfig.key) {
      students = sortData(students, sortConfig.key);
    }

    return students;
  };

  // Enhanced responsiveness management
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Excel date conversion with enhanced formatting
  const convertExcelDate = (excelDate) => {
    if (!excelDate) return 'لا يوجد';
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // This function scans through the attendance records to find the most recent date
  // when the student was marked as present ('حاضر')
  const findLastPresentDate = (sheetData) => {
    // Get the range of cells in the sheet
    const range = XLSX.utils.decode_range(sheetData['!ref']);

    // Scan backwards from the last row to find the most recent attendance
    for (let row = range.e.r; row >= 19; row--) {
      // Get the date and attendance status cells for this row
      const dateCell = sheetData[XLSX.utils.encode_cell({ r: row, c: 0 })];
      const attendanceCell = sheetData[XLSX.utils.encode_cell({ r: row, c: 1 })];

      // Check if this row has a valid present attendance record
      if (attendanceCell &&
        attendanceCell.v === 'حاضر' &&
        dateCell &&
        typeof dateCell.v === 'number') {
        return dateCell.v;  // Return the Excel date value
      }
    }
    return null;  // Return null if no present dates were found
  };

  // This function calculates the number of days between the last recorded date
  // and the last date the student was present
  const calculateAbsenceDuration = (lastDate, lastPresentDate) => {
    // Return null if either date is missing
    if (!lastDate || !lastPresentDate) return null;

    // Convert Excel dates to JavaScript Date objects
    // Excel dates are number of days since 1900-01-01, minus 25569 days to adjust to Unix epoch
    const lastRecordDate = new Date((lastDate - 25569) * 86400 * 1000);
    const lastPresent = new Date((lastPresentDate - 25569) * 86400 * 1000);

    // Calculate the difference in milliseconds and convert to days
    const diffTime = Math.abs(lastRecordDate - lastPresent);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Enhanced file processing functions
  const processExcelFile = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const students = {};

    for (const sheetName of workbook.SheetNames) {
      if (sheetName === 'Tabelle2') continue;

      const sheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(sheet['!ref']);

      let totalClasses = 0;
      let attendedClasses = 0;
      let grades = [];
      let lastAttendanceDate = null;
      let lastAttendanceStatus = null;

      for (let row = 19; row <= range.e.r; row++) {
        const dateCell = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
        const attendanceCell = sheet[XLSX.utils.encode_cell({ r: row, c: 1 })];
        const gradeCell = sheet[XLSX.utils.encode_cell({ r: row, c: 2 })];

        if (attendanceCell && attendanceCell.v) {
          const attendanceStatus = String(attendanceCell.v).trim();
          if (attendanceStatus === 'حاضر' || attendanceStatus === 'غائب') {
            totalClasses++;
            if (attendanceStatus === 'حاضر') attendedClasses++;
            if (dateCell && typeof dateCell.v === 'number') {
              lastAttendanceDate = dateCell.v;
              lastAttendanceStatus = attendanceStatus;
            }
          }
        }

        if (gradeCell && typeof gradeCell.v === 'number' && !isNaN(gradeCell.v)) {
          grades.push(gradeCell.v);
        }
      }

      const lastPresentDate = findLastPresentDate(sheet);
      const absenceDuration = lastAttendanceStatus === 'غائب' ?
        calculateAbsenceDuration(lastAttendanceDate, lastPresentDate) : null;

      students[sheetName] = {
        name: sheetName,
        attendanceRate: totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0,
        averageGrade: grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0,
        totalClasses,
        totalTests: grades.length,
        lastAttendanceDate,
        lastAttendanceStatus,
        lastPresentDate,
        absenceDuration,
        grades
      };
    }

    return {
      className: file.name.replace('.xlsx', ''),
      students,
      totalStudents: Object.keys(students).length,
      averageAttendance: Object.values(students).reduce((sum, student) => sum + student.attendanceRate, 0) / Object.keys(students).length,
      averageGrade: Object.values(students).reduce((sum, student) => sum + student.averageGrade, 0) / Object.keys(students).length,
      studentsNeedingAttention: Object.values(students).filter(s => s.absenceDuration > 21).length
    };
  };

  return (
    <div className="relative flex min-h-screen bg-gray-900" dir="rtl">
      {/* Main Header - Dark Theme */}
      <header className="fixed top-0 right-0 left-0 bg-gray-800 border-b border-gray-700 z-30">
        <div className={`flex items-center h-16 px-4 ${sidebarOpen ? 'lg:mr-72' : ''}`}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 mr-2 rounded-lg hover:bg-gray-700 transition-colors lg:hidden"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? (
              <X className="w-6 h-6 text-gray-300" />
            ) : (
              <Menu className="w-6 h-6 text-gray-300" />
            )}
          </button>

          {selectedClassroom && classroomData[selectedClassroom] ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-100">{selectedClassroom}</h1>
                <div className="h-5 w-px bg-gray-600 mx-1 hidden sm:block"></div>
                <p className="text-sm text-gray-400 hidden sm:block">
                  {classroomData[selectedClassroom].totalStudents} طلاب •&nbsp;
                  متوسط الحضور {classroomData[selectedClassroom].averageAttendance.toFixed(1)}%
                </p>
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-sm ${classroomData[selectedClassroom].studentsNeedingAttention > 0
                ? 'bg-red-900/50 text-red-200 border border-red-700'
                : 'bg-green-900/50 text-green-200 border border-green-700'
                }`}>
                {classroomData[selectedClassroom].studentsNeedingAttention > 0
                  ? `${classroomData[selectedClassroom].studentsNeedingAttention} طلاب بحاجة للمتابعة`
                  : 'لا يوجد طلاب متغيبين'
                }
              </div>
            </div>
          ) : (
            <h1 className="text-xl font-bold text-gray-100">لوحة التحكم</h1>
          )}
        </div>
      </header>

      {/* Enhanced Sidebar - Dark Theme */}
      <aside className={`
        fixed lg:relative z-40 mt-16
        w-72 h-[calc(100vh-4rem)] bg-gray-800 border-l border-gray-700
        p-4 flex flex-col overflow-hidden
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* File Upload Area with improved visual feedback */}
        {Object.keys(classroomData).length === 0 ? (
          <div
            className={`relative p-6 border-2 border-dashed rounded-xl mb-4 transition-all ${dragActive
              ? 'border-blue-400 bg-blue-900/20'
              : 'border-gray-600 hover:border-gray-500'
              }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              multiple
              accept=".xlsx,.xls"
              disabled={uploading}
            />
            <div className="text-center">
              <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-300 mb-1">اسحب ملفات Excel هنا</p>
              <p className="text-xs text-gray-400">أو انقر للاختيار</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setClassroomData({});
              setSelectedClassroom(null);
              setStatus('');
              setError('');
            }}
            className="w-full p-3 mb-4 bg-red-900/30 text-red-200 rounded-xl border border-red-800 
                     hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            إعادة تعيين
          </button>
        )}

        {/* Enhanced Class List with better visual hierarchy */}
        {Object.keys(classroomData).length > 0 && (
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-400 mb-2">الفصول</h3>
            <div className="space-y-2">
              {/* Add Overview item first */}
              <div
                onClick={() => setSelectedClassroom('overview')}
                className={`p-3 rounded-lg cursor-pointer transition-all ${selectedClassroom === 'overview'
                  ? 'bg-blue-900/30 border border-blue-700'
                  : 'hover:bg-gray-700/50 border border-transparent'
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-sm text-gray-200">نظرة عامة</span>
                </div>
                <div className="text-xs text-gray-400">
                  {Object.keys(classroomData).length} فصول
                </div>
              </div>

              {/* Classroom items */}
              {Object.entries(classroomData).map(([className, data]) => (
                <div
                  key={className}
                  onClick={() => setSelectedClassroom(className)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${selectedClassroom === className
                    ? 'bg-blue-900/30 border border-blue-700'
                    : 'hover:bg-gray-700/50 border border-transparent'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Folder className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-sm text-gray-200">{className}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {data.totalStudents} طلاب
                  </div>
                  {data.studentsNeedingAttention > 0 && (
                    <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{data.studentsNeedingAttention} طلاب متغيبين +3 أسابيع</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area - Dark Theme */}
      <main className={`
        flex-1 p-6 mt-16 overflow-auto
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'lg:mr-66' : ''} // 72 - 6 = 66
      `}>
        {/* Status Messages with improved visibility */}
        {status && (
          <div className="mb-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-blue-200">{status}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {selectedClassroom && (
          selectedClassroom === 'overview' ? (
            <ClassroomAnalytics classroomData={classroomData} />
          ) : (
            classroomData[selectedClassroom] && (
              <div className="space-y-6">
                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Students Card */}
                  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg hover:border-gray-600 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">إجمالي الطلاب</p>
                        <p className="text-2xl font-bold text-gray-100">
                          {classroomData[selectedClassroom].totalStudents}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-400" />
                      </div>
                    </div>
                  </div>

                  {/* Average Attendance Card */}
                  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg hover:border-gray-600 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">متوسط نسبة الحضور</p>
                        <p className="text-2xl font-bold text-gray-100">
                          {classroomData[selectedClassroom].averageAttendance.toFixed(1)}%
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-green-400" />
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(classroomData[selectedClassroom].averageAttendance, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Average Grade Card */}
                  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg hover:border-gray-600 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">متوسط الدرجات</p>
                        <p className="text-2xl font-bold text-gray-100">
                          {classroomData[selectedClassroom].averageGrade.toFixed(2)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-900/30 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-purple-400" />
                      </div>
                    </div>
                  </div>

                  {/* Students Needing Attention Card */}
                  <div className={`rounded-xl p-4 border shadow-lg transition-all duration-300 ${classroomData[selectedClassroom].studentsNeedingAttention > 0
                    ? 'bg-red-900/20 border-red-800 hover:border-red-700'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">غياب +3 أسابيع</p>
                        <p className="text-2xl font-bold text-gray-100">
                          {classroomData[selectedClassroom].studentsNeedingAttention}
                        </p>
                      </div>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${classroomData[selectedClassroom].studentsNeedingAttention > 0
                        ? 'bg-red-900/30'
                        : 'bg-gray-700/50'
                        }`}>
                        <AlertCircle className={`w-6 h-6 ${classroomData[selectedClassroom].studentsNeedingAttention > 0
                          ? 'text-red-400'
                          : 'text-gray-400'
                          }`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Students Table */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-100">تفاصيل الطلاب</h2>
                        <button
                          onClick={() => setShowFilters(!showFilters)}
                          className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                          الفلترة والبحث
                        </button>
                      </div>

                      {/* Search and Filters Panel */}
                      {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                          {/* Search Input */}
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="بحث باسم الطالب..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          {/* Attendance Filter */}
                          <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-400">نسبة الحضور الأدنى</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={filters.attendanceThreshold}
                              onChange={(e) => setFilters({ ...filters, attendanceThreshold: Number(e.target.value) })}
                              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          {/* Grade Filter */}
                          <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-400">الدرجة الأدنى</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={filters.gradeThreshold}
                              onChange={(e) => setFilters({ ...filters, gradeThreshold: Number(e.target.value) })}
                              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          {/* Absence Duration Filter */}
                          <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-400">مدة الغياب (بالأيام)</label>
                            <input
                              type="number"
                              min="0"
                              value={filters.absenceDuration}
                              onChange={(e) => setFilters({ ...filters, absenceDuration: Number(e.target.value) })}
                              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* Filter Summary */}
                      {(searchTerm || Object.values(filters).some(v => v > 0)) && (
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <span>النتائج: {getFilteredStats().count} طالب</span>
                            <span>•</span>
                            <span>متوسط الحضور: {getFilteredStats().averageAttendance.toFixed(1)}%</span>
                            <span>•</span>
                            <span>متوسط الدرجات: {getFilteredStats().averageGrade.toFixed(2)}</span>
                          </div>
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setFilters({
                                attendanceThreshold: 0,
                                gradeThreshold: 0,
                                absenceDuration: 0
                              });
                            }}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            مسح الفلاتر
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      {/* Enhanced Table Header with Sorting Indicators */}
                      <thead>
                        <tr className="bg-gray-900/50">
                          {[
                            { key: 'name', label: 'اسم الطالب', sortable: true },
                            { key: 'attendanceRate', label: 'نسبة الحضور', sortable: true },
                            { key: 'averageGrade', label: 'متوسط الدرجات', sortable: true },
                            { key: 'totalClasses', label: 'عدد الحصص', sortable: true },
                            { key: 'totalTests', label: 'عدد الاختبارات', sortable: true },
                            { key: 'lastAttendanceDate', label: 'آخر تسجيل', sortable: true },
                            { key: 'lastAttendanceStatus', label: 'حالة آخر تسجيل', sortable: true },
                            { key: 'absenceDuration', label: 'مدة الغياب', sortable: true }
                          ].map(column => (
                            <th
                              key={column.key}
                              className={`px-4 py-3 text-right text-sm font-medium text-gray-400 ${column.sortable ? 'cursor-pointer hover:text-gray-200' : ''
                                }`}
                              onClick={() => column.sortable && handleSort(column.key)}
                              role={column.sortable ? 'button' : undefined}
                              aria-sort={
                                sortConfig.key === column.key
                                  ? sortConfig.direction === 'ascending'
                                    ? 'ascending'
                                    : 'descending'
                                  : undefined
                              }
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span>{column.label}</span>
                                {column.sortable && (
                                  <div className="flex flex-col">
                                    <svg
                                      className={`w-2 h-2 ${sortConfig.key === column.key && sortConfig.direction === 'ascending'
                                        ? 'text-blue-400'
                                        : 'text-gray-600'
                                        }`}
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M12 5l8 8H4z" />
                                    </svg>
                                    <svg
                                      className={`w-2 h-2 ${sortConfig.key === column.key && sortConfig.direction === 'descending'
                                        ? 'text-blue-400'
                                        : 'text-gray-600'
                                        }`}
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M12 19l-8-8h16z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredStudents().map((student, index) => (
                          <tr
                            key={student.name}
                            className={`
                              group
                              border-b border-gray-700 last:border-0
                              ${student.absenceDuration >= 21 ? 'bg-red-900/20' : 'bg-gray-800'}
                              hover:bg-gray-700/50 transition-all duration-150 ease-in-out
                            `}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3 group-hover:bg-gray-600 transition-colors">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <span className="font-medium text-gray-200 group-hover:text-white transition-colors">{student.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="inline-flex items-center">
                                <span className={`px-2 py-1 rounded-lg text-sm transition-all duration-150 ${student.attendanceRate >= 90
                                  ? 'bg-green-900/30 text-green-300 group-hover:bg-green-900/40' :
                                  student.attendanceRate >= 75
                                    ? 'bg-blue-900/30 text-blue-300 group-hover:bg-blue-900/40' :
                                    'bg-red-900/30 text-red-300 group-hover:bg-red-900/40'
                                  }`}>
                                  {student.attendanceRate.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-medium text-gray-300 group-hover:text-gray-200 transition-colors">
                                {student.averageGrade.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300 group-hover:text-gray-200 transition-colors">
                              {student.totalClasses}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300 group-hover:text-gray-200 transition-colors">
                              {student.totalTests}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300 group-hover:text-gray-200 transition-colors">
                              {convertExcelDate(student.lastAttendanceDate)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2 py-1 rounded-lg text-sm transition-all duration-150 ${student.lastAttendanceStatus === 'حاضر'
                                ? 'bg-green-900/30 text-green-300 group-hover:bg-green-900/40'
                                : 'bg-red-900/30 text-red-300 group-hover:bg-red-900/40'
                                }`}>
                                {student.lastAttendanceStatus || 'لا يوجد'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {student.lastAttendanceStatus === 'غائب' && student.absenceDuration ? (
                                <span className={`inline-flex items-center px-2 py-1 rounded-lg text-sm transition-all duration-150 ${student.absenceDuration >= 21
                                  ? 'bg-red-900/30 text-red-300 group-hover:bg-red-900/40'
                                  : 'bg-yellow-900/30 text-yellow-300 group-hover:bg-yellow-900/40'
                                  }`}>
                                  {student.absenceDuration} يوم
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )
        )}
      </main>
    </div>
  );
};

export default ClassroomOverview;