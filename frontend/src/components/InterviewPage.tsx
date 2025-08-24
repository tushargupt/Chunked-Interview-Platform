'use client';

import { useState, useEffect } from 'react';
import ChunkedRecorder from './ChunkedRecorder';

interface InterviewPageProps {
  interviewId: string;
}

interface RecordingData {
  id: string;
  interviewId: string;
  url: string;
  status: string;
  duration: number;
  size: number;
}

export default function InterviewPage({ interviewId: initialInterviewId }: InterviewPageProps) {
  const [currentInterviewId, setCurrentInterviewId] = useState(initialInterviewId);
  const [recordingData, setRecordingData] = useState<RecordingData | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecoveryNotice, setShowRecoveryNotice] = useState(false);

  // Generate new interview ID
  const generateNewInterviewId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Check for interrupted recording on mount
  useEffect(() => {
    const savedRecording = sessionStorage.getItem('activeRecording');
    if (savedRecording) {
      try {
        const recordingData = JSON.parse(savedRecording);
        if (recordingData.isRecording) {
          const timeSinceStart = Date.now() - recordingData.startTime;
          const shouldShow = timeSinceStart < 10 * 60 * 1000; // 10 minutes
          
          if (shouldShow) {
            setShowRecoveryNotice(true);
            // Finalize the interrupted recording
            finalizeInterruptedRecording(recordingData.interviewId);
          }
          sessionStorage.removeItem('activeRecording');
        }
      } catch (e) {
        console.error('interrupted recording:', e);
        sessionStorage.removeItem('activeRecording');
      }
    }
  }, []);

  // Finalize interrupted recording
  const finalizeInterruptedRecording = async (interruptedInterviewId: string) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${interruptedInterviewId}/recordings/finalize`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'interrupted' })
        }
      );
    } catch (error) {
      console.error('recording:', error);
    }
  };

  const handleRecordingStart = () => {
    setIsRecording(true);
    setError(null);
  };

  const handleRecordingStop = (data: RecordingData) => {
    setIsRecording(false);
    setRecordingData(data);
    // Generate new interview ID for next recording
    setCurrentInterviewId(generateNewInterviewId());
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsRecording(false);
  };

  const startNewRecording = () => {
    setRecordingData(null);
    setError(null);
    setCurrentInterviewId(generateNewInterviewId());
  };

  const dismissRecoveryNotice = () => {
    setShowRecoveryNotice(false);
  };

  const downloadRecording = async () => {
    if (!recordingData) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/recordings/${recordingData.id}/download`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get download link');
      }

      const result = await response.json();
      
      if (result.success && result.downloadUrl) {
        // Create download link
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = `interview-${recordingData.interviewId}.webm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to download recording');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Interview Session</h1>
              <p className="text-sm text-gray-500 mt-1">
                Interview ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{currentInterviewId}</code>
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {isRecording && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-600 font-medium">Recording in progress</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recovery Notice */}
        {showRecoveryNotice && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">Previous Recording Session Detected</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Your previous recording was automatically saved. You can now start a new recording session.</p>
                </div>
                <div className="mt-3 flex space-x-3">
                  <a
                    href="/recordings"
                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Check Recordings
                  </a>
                  <button
                    onClick={dismissRecoveryNotice}
                    className="text-yellow-800 hover:text-yellow-900 px-3 py-1 text-sm font-medium transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Recording Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recorder Component */}
        <div className="mb-8">
          <ChunkedRecorder
            interviewId={currentInterviewId}
            onRecordingStart={handleRecordingStart}
            onRecordingStop={handleRecordingStop}
            onError={handleError}
          />
        </div>

        {/* Recording Complete */}
        {recordingData && recordingData.status === 'complete' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-green-800">Recording Complete! 🎉</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Your interview has been successfully recorded and uploaded to cloud storage.</p>
                </div>
                
                {/* Recording Details */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="text-xs font-medium text-green-600 uppercase tracking-wider">Duration</div>
                    <div className="mt-1 text-lg font-semibold text-green-900">
                      {formatDuration(recordingData.duration)}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="text-xs font-medium text-green-600 uppercase tracking-wider">File Size</div>
                    <div className="mt-1 text-lg font-semibold text-green-900">
                      {formatFileSize(recordingData.size)}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="text-xs font-medium text-green-600 uppercase tracking-wider">Status</div>
                    <div className="mt-1 text-lg font-semibold text-green-900 capitalize flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {recordingData.status}
                    </div>
                  </div>
                </div>

                {/* Download Button */}
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={downloadRecording}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Recording
                  </button>
                  
                  <button
                    onClick={startNewRecording}
                    className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    Start New Recording
                  </button>
                  
                  <a
                    href="/recordings"
                    className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    View All Recordings
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isRecording && !recordingData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-blue-800">Ready to Record</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Click "Start Recording" to begin the interview session with automatic cloud backup.</p>
                  <ul className="mt-3 space-y-1">
                    <li className="flex items-center">
                      <svg className="h-4 w-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      High-quality video and audio recording
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Real-time chunked upload for reliability
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Secure AWS S3 cloud storage
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Instant download after recording
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Protected against accidental navigation
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Automatic recovery if interrupted
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}