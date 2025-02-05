import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Calendar, AlertCircle } from 'lucide-react';

const ClassroomAnalytics = ({ classroomData }) => {
  const analytics = useMemo(() => {
    const classrooms = Object.values(classroomData);
    
    // Process each classroom
    const classroomMetrics = classrooms.map(classroom => {
      const students = Object.values(classroom.students || {});
      
      // Find the latest attendance date across all students
      const latestDate = Math.max(...students.map(s => s.lastAttendanceDate || 0));
      
      // Count students with this latest attendance record
      const studentsWithLatestRecord = students.filter(
        s => s.lastAttendanceDate === latestDate
      ).length;

      return {
        name: classroom.className.replace('.xlsx', ''),
        attendance: classroom.averageAttendance,
        totalStudents: classroom.totalStudents,
        latestDate,
        studentsWithLatestRecord,
        completionRate: (studentsWithLatestRecord / classroom.totalStudents) * 100
      };
    });

    return {
      classroomMetrics: classroomMetrics.sort((a, b) => b.latestDate - a.latestDate)
    };
  }, [classroomData]);

  // Excel date conversion helper
  const convertExcelDate = (excelDate) => {
    if (!excelDate) return 'لا يوجد';
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Latest Attendance Records */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">آخر تسجيلات الحضور</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900/50">
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">الفصل</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">عدد الطلاب</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">آخر تسجيل</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">طلاب مسجلين</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">نسبة الإكتمال</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">متوسط الحضور</th>
              </tr>
            </thead>
            <tbody>
              {analytics.classroomMetrics.map((classroom) => (
                <tr key={classroom.name} className="border-b border-gray-700 last:border-0 bg-gray-800 hover:bg-gray-700/50 transition-all">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-200">{classroom.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-300">
                    {classroom.totalStudents}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-300">
                    {convertExcelDate(classroom.latestDate)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-sm ${
                      classroom.completionRate === 100
                        ? 'bg-green-900/30 text-green-300'
                        : classroom.completionRate >= 75
                        ? 'bg-yellow-900/30 text-yellow-300'
                        : 'bg-red-900/30 text-red-300'
                    }`}>
                      {classroom.studentsWithLatestRecord} / {classroom.totalStudents}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-24 bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            classroom.completionRate === 100
                              ? 'bg-green-500'
                              : classroom.completionRate >= 75
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${classroom.completionRate}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400">
                        {classroom.completionRate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-sm ${
                      classroom.attendance >= 90
                        ? 'bg-green-900/30 text-green-300'
                        : classroom.attendance >= 75
                        ? 'bg-blue-900/30 text-blue-300'
                        : 'bg-red-900/30 text-red-300'
                    }`}>
                      {classroom.attendance.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Distribution Chart */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-4">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">توزيع نسب الحضور</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.classroomMetrics} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" domain={[0, 100]} stroke="#9CA3AF" />
              <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#E5E7EB' }}
                itemStyle={{ color: '#93C5FD' }}
                formatter={(value) => [`${value.toFixed(1)}%`, 'نسبة الحضور']}
              />
              <Bar
                dataKey="attendance"
                fill="#3B82F6"
                radius={[0, 4, 4, 0]}
                name="نسبة الحضور"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ClassroomAnalytics;