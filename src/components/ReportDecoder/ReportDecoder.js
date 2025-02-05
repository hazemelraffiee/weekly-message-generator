import React, { useState } from 'react';
import JSONPretty from 'react-json-pretty';
import { decompress } from '@/utils/dataUtils';

const ReportDecoder = () => {
  const [encodedData, setEncodedData] = useState('');
  const [decodedData, setDecodedData] = useState(null);
  const [error, setError] = useState(null);

  

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setDecodedData(null);

    try {
      const decoded = decompress(encodedData);
      setDecodedData(decoded);
    } catch (err) {
      setError(err.message);
    }
  };

  // Custom theme for react-json-pretty
  const jsonTheme = {
    main: 'line-height:1.3;color:#66d9ef;background:#1e293b;overflow:auto;padding:1rem;border-radius:0.5rem;',
    key: 'color:#f92672;',
    string: 'color:#a6e22e;',
    value: 'color:#fd971f;',
    boolean: 'color:#ac81fe;',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">تحليل التقرير</h1>
        
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="space-y-4">
            <textarea
              value={encodedData}
              onChange={(e) => setEncodedData(e.target.value)}
              placeholder="الصق التقرير المشفر هنا..."
              className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500"
              dir="rtl"
            />
            
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              تحليل التقرير
            </button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Results Display */}
        {decodedData && (
          <div className="space-y-6">
            {/* Metadata Section */}
            <div className="p-6 bg-gray-800 rounded-lg">
              <h2 className="text-xl font-bold mb-4">معلومات التقرير</h2>
              <div className="grid gap-4">
                <div>
                  <span className="text-gray-400">المدرسة:</span>{' '}
                  <span>{decodedData.metadata.schoolName}</span>
                </div>
                <div>
                  <span className="text-gray-400">الفصل:</span>{' '}
                  <span>{decodedData.metadata.className}</span>
                </div>
                <div>
                  <span className="text-gray-400">التاريخ:</span>{' '}
                  <span>{decodedData.metadata.date.formatted}</span>
                </div>
              </div>
            </div>

            {/* Full JSON Data */}
            <div>
              <h2 className="text-xl font-bold mb-4">البيانات الكاملة</h2>
              <JSONPretty 
                id="json-pretty"
                data={decodedData}
                theme={jsonTheme}
                style={{ direction: 'ltr' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDecoder;