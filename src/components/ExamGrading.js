import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { decodeData } from './LinkCreator';

const GRADES = [
  { value: 1.0, label: '1', color: 'emerald' },
  { value: 1.3, label: '1-', color: 'emerald' },
  { value: 1.7, label: '2+', color: 'green' },
  { value: 2.0, label: '2', color: 'green' },
  { value: 2.3, label: '2-', color: 'green' },
  { value: 2.7, label: '3+', color: 'blue' },
  { value: 3.0, label: '3', color: 'blue' },
  { value: 3.3, label: '3-', color: 'blue' },
  { value: 3.7, label: '4+', color: 'yellow' },
  { value: 4.0, label: '4', color: 'yellow' },
  { value: 4.3, label: '4-', color: 'yellow' },
  { value: 4.7, label: '5+', color: 'orange' },
  { value: 5.0, label: '5', color: 'orange' },
  { value: 5.3, label: '5-', color: 'orange' },
  { value: 6.0, label: '6', color: 'red' },
];

const GradeSelector = ({ value = 1, onChange }) => {
  const currentIndex = GRADES.findIndex(g => g.value === value) || 0;
  const currentGrade = GRADES[currentIndex];

  const colorClasses = {
    emerald: 'bg-emerald-500 hover:bg-emerald-600',
    green: 'bg-green-500 hover:bg-green-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    red: 'bg-red-500 hover:bg-red-600'
  }[currentGrade.color];

  return (
    <div className="flex gap-2">
      <div className="flex flex-row"> {/* Changed from flex-col to flex-row */}
        <button
          onClick={() => currentIndex > 0 && onChange(GRADES[currentIndex - 1].value)}
          disabled={currentIndex === 0}
          className={`p-1 rounded-r ${currentIndex === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700'}`} 
        >
          <ChevronUp className="w-8 h-8" />
        </button>
        <button
          onClick={() => currentIndex < GRADES.length - 1 && onChange(GRADES[currentIndex + 1].value)}
          disabled={currentIndex === GRADES.length - 1}
          className={`p-1 rounded-l ${currentIndex === GRADES.length - 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700'}`}
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </div>

      <div className={`px-6 py-3 rounded font-bold text-white ${colorClasses} min-w-[80px] text-center text-2xl`}>
        {currentGrade.label}
      </div>
    </div>
  );
};

export default function ExamGrading() {
  const [data, setData] = useState(null);
  const [examName, setExamName] = useState('');
  const [sections, setSections] = useState([]);
  const [grades, setGrades] = useState({});
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('data');
    if (encoded) {
      const decoded = decodeData(encoded);
      if (decoded?.className && Array.isArray(decoded.students)) {
        setData({
          schoolName: decoded.schoolName || '',
          className: decoded.className,
          students: decoded.students.map(name => ({
            id: name.toLowerCase().replace(/\s+/g, '_'),
            name
          }))
        });
      }
    }
  }, []);

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

  const totalWeight = sections.reduce((sum, s) => sum + s.weight, 0);

  const calculateGrade = (studentId) => {
    if (!grades[studentId]) return 1;
    const studentGrades = grades[studentId];
    let weightedSum = 0, totalWeightUsed = 0;

    sections.forEach(section => {
      const grade = studentGrades[section.id];
      if (typeof grade === 'number') {
        weightedSum += (grade * section.weight);
        totalWeightUsed += section.weight;
      }
    });

    return totalWeightUsed === 0 ? 1 : weightedSum / totalWeightUsed;
  };

  const generateMessage = (studentId) => {
    const student = data.students.find(s => s.id === studentId);
    const finalGrade = calculateGrade(studentId);
    
    const getGradeLabel = (value) => {
      const grade = GRADES.find(g => g.value === value) || GRADES[0];
      return grade.label;
    };
    
    let msg = `السلام عليكم ورحمة الله وبركاته\nتحية طيبة وبعد،\n\n`;
  
    // Introduction explaining what this is
    msg += `نود إفادتكم بنتيجة اختبار "${examName || 'التقييم'}".\n`;
    msg += `يرجى العلم أن التقييم يتبع نظام الدرجات الألماني (١-٦) حيث تعتبر درجة ١ هي الأفضل.\n\n`;
    
    // Student info section
    msg += `*معلومات الطالب*\n`;
    msg += `الاسم: ${student.name}\n`;
    msg += `الصف: ${data.className}\n`;
    msg += `\n`;
  
    // Grades details section
    msg += `*تفاصيل الدرجات* 📝\n`;
    sections.forEach(section => {
      const gradeValue = grades[studentId]?.[section.id] || 1;
      const gradeLabel = getGradeLabel(gradeValue);
      msg += `• ${section.name}\n`;
      msg += `   الدرجة: ${gradeLabel}\n`;
    });
    msg += `\n`;
  
    // Final grade section with emoji based on performance
    const finalGradeLabel = getGradeLabel(finalGrade);
    msg += `*النتيجة النهائية* ${getFinalGradeEmoji(finalGrade)}\n`;
    msg += `الدرجة: ${finalGradeLabel}\n`;
    msg += `\n`;
  
    // Performance description
    msg += `*مستوى الأداء*\n`;
    msg += `${getGradeDescription(finalGrade)}\n`;
  
    msg += `\n اللهم بارك في أبنائكم وأبنائنا وأجعلهم اللهم قرة عين لنا في الدنيا والآخرة`;
    
    return msg;
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
  
  // Helper function to get grade description in Arabic
  const getGradeDescription = (grade) => {
    const numGrade = parseFloat(grade);
    if (numGrade <= 1.3) return 'ممتاز جداً - أداء متميز';
    if (numGrade <= 2.3) return 'جيد جداً - أداء فوق المتوسط';
    if (numGrade <= 3.3) return 'جيد - أداء مُرضي';
    if (numGrade <= 4.0) return 'مقبول - يحتاج إلى تحسين';
    if (numGrade <= 5.0) return 'ضعيف - يحتاج إلى دعم إضافي';
    return 'غير مُرضي - يتطلب مراجعة شاملة';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-2">{data.className}</h1>
          <div className="text-blue-100">{data.schoolName}</div>
          <input
            type="text"
            value={examName}
            onChange={e => setExamName(e.target.value)}
            placeholder="اسم الاختبار"
            className="mt-4 w-full bg-blue-700/50 border border-blue-400/30 rounded px-3 py-2 text-white placeholder-blue-300"
          />
        </div>

        <div className="mb-8 border border-gray-700 rounded-lg bg-gray-800 p-6">
          <h2 className="text-xl font-bold mb-4">أقسام الاختبار</h2>
          <div className="space-y-3">
            {sections.map(section => (
              <div key={section.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-800/50 rounded-lg">
                <input
                  value={section.name}
                  onChange={e => setSections(sections.map(s =>
                    s.id === section.id ? { ...s, name: e.target.value } : s
                  ))}
                  placeholder="اسم القسم"
                  className="flex-1 min-w-0 bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />

                <div className="flex justify-between sm:justify-end items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">الوزن:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-row sm:flex-col">
                        <button
                          onClick={() => setSections(sections.map(s =>
                            s.id === section.id ? { ...s, weight: s.weight + 1 } : s
                          ))}
                          className="p-1 rounded-r sm:rounded-r-none sm:rounded-t bg-gray-600 hover:bg-gray-700"
                        >
                          <ChevronUp className="w-8 h-8" />
                        </button>
                        <button
                          onClick={() => setSections(sections.map(s =>
                            s.id === section.id ? { ...s, weight: Math.max(1, s.weight - 1) } : s
                          ))}
                          className={`p-1 rounded-l sm:rounded-l-none sm:rounded-b ${section.weight === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700'
                            }`}
                        >
                          <ChevronDown className="w-8 h-8" />
                        </button>
                      </div>
                      <div className="px-4 py-2 rounded font-bold bg-gray-600 min-w-[60px] text-center">
                        {section.weight}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSections(sections.filter(s => s.id !== section.id))}
                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => setSections([...sections, { id: Date.now().toString(), name: '', weight: 1 }])}
              className="w-full border-2 border-dashed border-gray-700 rounded p-3 hover:bg-gray-700/50 transition-colors"
            >
              <Plus className="w-5 h-5 inline-block ml-2" />
              إضافة قسم
            </button>
          </div>
        </div>

        {sections.length > 0 && (
          <div className="space-y-3">
            {data.students.map(student => (
              <div key={student.id} className="border border-gray-700 rounded-lg bg-gray-800">
                <div
                  onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/50"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold">{student.name}</span>
                    <span className={`text-2xl font-bold ${calculateGrade(student.id) <= 4 ? 'text-green-400' : 'text-red-400'}`}>
                      {calculateGrade(student.id).toFixed(1)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(generateMessage(student.id))
                          .then(() => {
                            setCopySuccess(student.id);
                            setTimeout(() => setCopySuccess(null), 2000);
                          });
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2"
                    >
                      {copySuccess === student.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      نسخ
                    </button>
                    <ChevronDown className={`w-5 h-5 transition-transform ${expandedStudent === student.id ? 'rotate-180' : ''
                      }`} />
                  </div>
                </div>

                {expandedStudent === student.id && (
                  <div className="p-4 border-t border-gray-700 space-y-4">
                    {sections.map(section => (
                      <div key={section.id} className="flex items-center gap-4">
                        <span className="text-sm font-medium flex-1">{section.name}</span>
                        <GradeSelector
                          value={grades[student.id]?.[section.id] || 1}
                          onChange={value => setGrades(prev => ({
                            ...prev,
                            [student.id]: {
                              ...(prev[student.id] || {}),
                              [section.id]: value
                            }
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}