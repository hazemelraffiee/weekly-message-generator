'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import GoogleDriveFileBrowser from './GoogleDriveFileBrowser';
import ExcelViewer from './ExcelViewer';
import { extractHeaderAndData, decodeData } from '@/lib/encoder-decoder';
import { processExcelFile } from '@/lib/excel-processor';

export default function ReportSubmitter() {
  const { data: session, status } = useSession();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [encodedData, setEncodedData] = useState({});
  const [processing, setProcessing] = useState(false);
  const [updateResults, setUpdateResults] = useState({});

  const handleFileSelect = (file) => {
    if (!selectedFiles.find(f => f.id === file.id)) {
      setSelectedFiles([...selectedFiles, file]);
      setActiveFileIndex(selectedFiles.length);
    } else {
      const index = selectedFiles.findIndex(f => f.id === file.id);
      setActiveFileIndex(index);
    }
  };

  const handleCloseTab = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (activeFileIndex >= newFiles.length) {
      setActiveFileIndex(Math.max(0, newFiles.length - 1));
    }
  };

  const handleUpdateFile = async (fileId) => {
    const encoded = encodedData[fileId];
    if (!encoded) {
      alert('Please enter encoded data first');
      return;
    }

    setProcessing(true);
    setUpdateResults({});

    try {
      // Extract and decode data
      const { headerInfo, compressedData } = extractHeaderAndData(encoded);
      const decodedData = decodeData(compressedData);

      if (!decodedData) {
        throw new Error('Failed to decode data');
      }

      // Process the Excel file
      const results = await processExcelFile(fileId, decodedData);
      setUpdateResults(results);

      // Show success/failure summary
      const failures = Object.entries(results).filter(([_, result]) => !result.success);
      if (failures.length === 0) {
        alert('File updated successfully!');
      } else {
        alert(`Updated with ${failures.length} failures. Check the results below.`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Report Submitter</h1>
          <p className="text-gray-600 mb-6">Sign in to access your Google Drive files</p>
          <button
            onClick={() => signIn('google')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const activeFile = selectedFiles[activeFileIndex];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Report Submitter</h1>
          <div className="flex items-center gap-4">
            <span>{session.user?.email}</span>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-gray-100 p-4 overflow-y-auto">
          <GoogleDriveFileBrowser onFileSelect={handleFileSelect} />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* File tabs */}
          <div className="bg-gray-200 flex overflow-x-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={file.id}
                className={`flex items-center px-4 py-2 cursor-pointer ${
                  activeFileIndex === index ? 'bg-white' : 'bg-gray-100'
                }`}
                onClick={() => setActiveFileIndex(index)}
              >
                <span className="text-sm mr-2">{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(index);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Content area */}
          {activeFile ? (
            <div className="flex-1 flex flex-col">
              {/* Update section */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex gap-4">
                  <textarea
                    className="flex-1 p-3 border rounded-lg resize-none"
                    rows="4"
                    placeholder="Paste encoded data here..."
                    value={encodedData[activeFile.id] || ''}
                    onChange={(e) => setEncodedData({
                      ...encodedData,
                      [activeFile.id]: e.target.value
                    })}
                  />
                  <button
                    onClick={() => handleUpdateFile(activeFile.id)}
                    disabled={processing}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {processing ? 'Processing...' : 'Update File'}
                  </button>
                </div>

                {/* Results */}
                {updateResults && Object.keys(updateResults).length > 0 && (
                  <div className="mt-4 p-3 bg-white border rounded">
                    <h3 className="font-semibold mb-2">Update Results:</h3>
                    <div className="max-h-32 overflow-y-auto">
                      {Object.entries(updateResults).map(([student, result]) => (
                        <div key={student} className="text-sm">
                          <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                            {student}: {result.success ? '✓' : `✗ ${result.error}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Excel viewer */}
              <div className="flex-1 overflow-hidden">
                <ExcelViewer fileId={activeFile.id} fileName={activeFile.name} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a file from Google Drive to begin
            </div>
          )}
        </div>
      </div>
    </div>
  );
}