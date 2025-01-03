import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Link2, Check, Loader2 } from 'lucide-react';

// Utility function to convert string to UTF-8 bytes
const stringToUtf8Bytes = (str) => {
  const utf8 = unescape(encodeURIComponent(str));
  const bytes = new Uint8Array(utf8.length);
  for (let i = 0; i < utf8.length; i++) {
    bytes[i] = utf8.charCodeAt(i);
  }
  return bytes;
};

// Utility function to convert UTF-8 bytes back to string
const utf8BytesToString = (bytes) => {
  const utf8 = String.fromCharCode.apply(null, bytes);
  return decodeURIComponent(escape(utf8));
};

// Utility function to compress and encode data
const encodeData = (data) => {
  try {
    // Convert the data object to a JSON string
    const jsonString = JSON.stringify(data);

    // Convert string to UTF-8 bytes
    const bytes = stringToUtf8Bytes(jsonString);

    // Convert bytes to base64 and make it URL-safe
    const base64 = btoa(String.fromCharCode.apply(null, bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return base64;
  } catch (error) {
    console.error('Error encoding data:', error);
    return null;
  }
};

// Utility function to decode data
export const decodeData = (encodedData) => {
  try {
    // Make the base64 URL-safe string back to regular base64
    const base64 = encodedData
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Pad the base64 string if needed
    const paddedBase64 = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);
    
    // Convert base64 to bytes
    const binary = atob(paddedBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    // Convert bytes back to string and parse JSON
    const jsonString = utf8BytesToString(bytes);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error decoding data:', error);
    return null;
  }
};

const LinkCreator = () => {
  const [className, setClassName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [students, setStudents] = useState([]);
  const [copyStatus, setCopyStatus] = useState('initial');
  const [showNotification, setShowNotification] = useState(false);

  // Function to add a new student
  const addStudent = useCallback(() => {
    if (newStudentName.trim()) {
      setStudents(prev => {
        // Check if student already exists
        if (prev.some(student => student.name === newStudentName.trim())) {
          return prev;
        }
        return [...prev, {
          id: Date.now().toString(),
          name: newStudentName.trim()
        }];
      });
      setNewStudentName('');
    }
  }, [newStudentName]);

  // Function to remove a student
  const removeStudent = useCallback((studentId) => {
    setStudents(prev => prev.filter(student => student.id !== studentId));
  }, []);

  // Function to generate and copy the URL
  const generateAndCopyUrl = useCallback(async () => {
    // Create the data object
    const data = {
      className,
      students: students.map(s => s.name)
    };

    // Encode the data
    const encodedData = encodeData(data);
    if (!encodedData) {
      console.error('Failed to encode data');
      return;
    }

    // Generate the full URL - points to root instead of /weekly-message
    const url = `${window.location.origin}/weekly-message-generator?data=${encodedData}`;

    try {
      setCopyStatus('copying');
      await navigator.clipboard.writeText(url);
      setCopyStatus('copied');
      setShowNotification(true);
      setTimeout(() => {
        setCopyStatus('initial');
        setShowNotification(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      setCopyStatus('initial');
    }
  }, [className, students]);

  const isFormValid = className.trim() && students.length > 0;

  return (
    <div className="container mx-auto p-4 max-w-2xl" dir="rtl">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-semibold text-gray-100">إنشاء رابط لفصل جديد</h1>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Class Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">
              اسم الفصل
            </label>
            <input
              className="w-full h-10 rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-gray-100"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="أدخل اسم الفصل"
            />
          </div>

          {/* Students Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">
              الطلاب
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1 h-10 rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-gray-100"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="اسم الطالب"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addStudent();
                  }
                }}
              />
              <button
                onClick={addStudent}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white"
              >
                <Plus className="h-4 w-4 inline-block ml-2" />
                إضافة
              </button>
            </div>

            {/* Students List */}
            {students.length > 0 && (
              <div className="border border-gray-700 rounded-lg p-4 space-y-2 mt-4">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-2 bg-gray-700/50 rounded"
                  >
                    <span className="text-gray-100">{student.name}</span>
                    <button
                      onClick={() => removeStudent(student.id)}
                      className="text-red-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generate Link Button */}
          <div className="relative pt-4">
            {/* Success Notification */}
            <div
              className={`
                absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full
                transition-opacity duration-200
                ${copyStatus === 'copied' ? 'opacity-100' : 'opacity-0'}
              `}
            >
              <div className="bg-green-600 text-white px-4 py-2 rounded-md shadow-lg text-sm whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>تم نسخ الرابط بنجاح</span>
                </div>
              </div>
            </div>

            <button
              onClick={generateAndCopyUrl}
              disabled={!isFormValid || copyStatus === 'copying'}
              className={`
                w-full inline-flex items-center justify-center 
                rounded-md text-sm font-medium h-12 px-6 py-2 
                transition-colors duration-200 text-white
                ${!isFormValid
                  ? 'bg-gray-600 cursor-not-allowed'
                  : copyStatus === 'copied'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }
              `}
            >
              <div className="flex items-center gap-2">
                {copyStatus === 'copying' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : copyStatus === 'copied' ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Link2 className="h-5 w-5" />
                )}
                <span>
                  {copyStatus === 'copying'
                    ? 'جاري إنشاء الرابط...'
                    : copyStatus === 'copied'
                      ? 'تم نسخ الرابط!'
                      : 'إنشاء ونسخ الرابط'
                  }
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkCreator;