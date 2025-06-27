'use client';

import { useState, useEffect } from 'react';

export default function ExcelViewer({ fileId, fileName }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [spreadsheetData, setSpreadsheetData] = useState(null);
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    if (fileId) {
      fetchSpreadsheetData();
    }
  }, [fileId]);

  const fetchSpreadsheetData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sheets/${fileId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch spreadsheet');
      }
      
      setSpreadsheetData(data);
      setActiveSheet(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!spreadsheetData) {
    return null;
  }

  const sheets = spreadsheetData.metadata.sheets;
  const currentSheetName = sheets[activeSheet];
  const currentSheetData = spreadsheetData.data[currentSheetName];

  return (
    <div className="flex flex-col h-full">
      {/* Sheet tabs */}
      <div className="flex border-b overflow-x-auto">
        {sheets.map((sheetName, index) => (
          <button
            key={sheetName}
            onClick={() => setActiveSheet(index)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
              activeSheet === index
                ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {sheetName}
          </button>
        ))}
      </div>

      {/* Sheet content */}
      <div className="flex-1 overflow-auto p-4">
        {currentSheetData.length === 0 ? (
          <p className="text-gray-500">No data in this sheet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <tbody>
                {currentSheetData.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-100' : ''}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={`border border-gray-300 px-2 py-1 text-sm ${
                          rowIndex === 0 ? 'font-semibold' : ''
                        }`}
                      >
                        {cell || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}