import React, { useState } from 'react';
import JSONPretty from 'react-json-pretty';
import { Copy } from 'lucide-react';
import { decompress } from '@/utils/dataUtils';

const ReportDecoder = () => {
  const [encodedData, setEncodedData] = useState('');
  const [decodedData, setDecodedData] = useState(null);
  const [error, setError] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setDecodedData(null);
    setIsCopied(false);

    try {
      // if --- in encodedData, split by it and take the last part
      const data = encodedData.includes('---')
        ? encodedData.split('---').pop()
        : encodedData;
      const decoded = decompress(data.trim()); // Decompress the data
      setDecodedData(decoded);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle copying JSON data to clipboard
  const handleCopy = async () => {
    if (!decodedData) return;

    try {
      // Use pretty print format for copied JSON
      await navigator.clipboard.writeText(
        JSON.stringify(decodedData, null, 2),
      );
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Show feedback for 2 seconds
    } catch (err) {
      console.error('Failed to copy JSON: ', err);
      // Optionally, display a copy error message to the user
      setError('فشل نسخ البيانات.');
    }
  };

  // Custom theme for react-json-pretty
  const jsonTheme = {
    main: 'line-height:1.3;color:#66d9ef;background:#1e293b;overflow:auto;padding:1rem;border-radius:0.5rem;position:relative;', // Added position:relative
    key: 'color:#f92672;',
    string: 'color:#a6e22e;',
    value: 'color:#fd971f;',
    boolean: 'color:#ac81fe;',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          تحليل التقرير
        </h1>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="space-y-4">
            <textarea
              value={encodedData}
              onChange={(e) => setEncodedData(e.target.value)}
              placeholder="الصق التقرير المشفر هنا..."
              className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="rtl" // Keep RTL for input
            />

            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
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
            <div className="p-6 bg-gray-800 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-blue-400">
                معلومات التقرير
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-400">المدرسة:</span>{' '}
                  <span className="font-medium">
                    {decodedData.metadata.schoolName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">الفصل:</span>{' '}
                  <span className="font-medium">
                    {decodedData.metadata.className}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">التاريخ:</span>{' '}
                  <span className="font-medium">
                    {decodedData.metadata.date.formatted}
                  </span>
                </div>
              </div>
            </div>

            {/* Full JSON Data */}
            <div className="relative">
              {' '}
              {/* Make container relative */}
              <h2 className="text-xl font-semibold mb-4 text-blue-400">
                البيانات الكاملة
              </h2>
              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className="absolute top-100 right-0 mt-2 mr-2 p-2 bg-gray-700 rounded-md text-gray-300 hover:bg-gray-600 transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Copy JSON data"
                title={isCopied ? 'تم النسخ!' : 'نسخ البيانات'} // Tooltip
              >
                {isCopied ? (
                  <span className="text-xs text-green-400 px-1">تم النسخ!</span> // Show text feedback
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
              <JSONPretty
                id="json-pretty"
                data={decodedData}
                theme={jsonTheme}
                style={{ direction: 'ltr' }} // Keep LTR for JSON structure
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDecoder;