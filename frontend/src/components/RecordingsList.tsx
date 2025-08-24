'use client';

import { useState, useEffect } from 'react';

interface Recording {
  id: string;
  interviewId: string;
  status: 'uploading' | 'complete' | 'failed';
  startedAt: string;
  endedAt: string | null;
  totalSize: number;
  chunkCount: number;
}

export default function RecordingsList() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch recordings
  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recordings`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recordings');
      }

      const data = await response.json();
      setRecordings(data.recordings || []);
      setError(null);
    } catch (err) {
      console.error('Fetch recordings error:', err);
      setError('Failed to load recordings');
    } finally {
      setLoading(false);
    }
  };

  // Download recording
  const downloadRecording = async (recordingId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/recordings/${recordingId}/download`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get download link');
      }

      const result = await response.json();
      
      if (result.success && result.downloadUrl) {
        // Create download link
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = `interview-${recordingId}.webm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download recording');
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate duration
  const calculateDuration = (startedAt: string, endedAt: string | null): string => {
    if (!endedAt) return 'In Progress';
    
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const diffInSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    const mins = Math.floor(diffInSeconds / 60);
    const secs = diffInSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'uploading': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recordings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Recordings</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchRecordings}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Interview Recordings</h1>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">{recordings.length} recordings</span>
              <button
                onClick={fetchRecordings}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recordings List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {recordings.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recordings</h3>
            <p className="mt-1 text-sm text-gray-500">Start recording interviews to see them here.</p>
            <div className="mt-6">
              <a
                href="/interview"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Start New Interview
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {recordings.map((recording) => (
                <li key={recording.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              Interview Recording #{recording.interviewId}
                            </p>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(recording.status)}`}>
                              {recording.status}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span>Duration: {calculateDuration(recording.startedAt, recording.endedAt)}</span>
                            <span className="mx-2">•</span>
                            <span>Size: {formatFileSize(recording.totalSize)}</span>
                            <span className="mx-2">•</span>
                            <span>Chunks: {recording.chunkCount}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(recording.startedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {recording.status === 'complete' && (
                          <button
                            onClick={() => downloadRecording(recording.id)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download
                          </button>
                        )}
                        {recording.status === 'uploading' && (
                          <div className="inline-flex items-center px-3 py-2 text-sm text-yellow-600">
                            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </div>
                        )}
                        {recording.status === 'failed' && (
                          <div className="inline-flex items-center px-3 py-2 text-sm text-red-600">
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Failed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}