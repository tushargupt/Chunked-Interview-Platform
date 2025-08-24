'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface ChunkedRecorderProps {
  interviewId: string;
  onRecordingStart?: () => void;
  onRecordingStop?: (recordingData: any) => void;
  onError?: (error: string) => void;
}

interface RecordingState {
  isRecording: boolean;
  duration: number;
  chunkCount: number;
  uploadedChunks: number;
  isProcessing: boolean;
}

export default function ChunkedRecorder({ 
  interviewId, 
  onRecordingStart, 
  onRecordingStop, 
  onError 
}: ChunkedRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const chunkIndexRef = useRef(0);
  
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    duration: 0,
    chunkCount: 0,
    uploadedChunks: 0,
    isProcessing: false
  });

  const [error, setError] = useState<string | null>(null);
  const [mediaReady, setMediaReady] = useState(false);
  const [isPageHidden, setIsPageHidden] = useState(false);

  // Timer for duration tracking and auto-save
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (recordingState.isRecording) {
      interval = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          duration: prev.duration + 1
        }));

        // Auto-save recording state every 30 seconds
        if (recordingState.duration > 0 && recordingState.duration % 30 === 0) {
          sessionStorage.setItem('recordingBackup', JSON.stringify({
            interviewId,
            chunks: recordedChunksRef.current.length,
            duration: recordingState.duration,
            lastSaved: Date.now()
          }));
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [recordingState.isRecording, recordingState.duration, interviewId]);

  // Send chunk to server
  const sendChunkToServer = async (chunkIndex: number, data: Blob): Promise<boolean> => {
    try {
      if (data.size === 0) return false;

      console.log(`📦 Sending chunk ${chunkIndex} (${data.size} bytes) to server`);

      const formData = new FormData();
      formData.append('chunk', data);
      formData.append('chunkIndex', chunkIndex.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${interviewId}/recordings/chunk`,
        {
          method: 'POST',
          body: formData
        }
      );

      console.log(`📡 Chunk ${chunkIndex} response status:`, response.status);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Chunk ${chunkIndex} upload result:`, result);
      
      if (result.success) {
        setRecordingState(prev => ({
          ...prev,
          uploadedChunks: prev.uploadedChunks + 1
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`❌ Chunk ${chunkIndex} upload error:`, error);
      return false;
    }
  };

  // Get supported MIME type
  const getSupportedMimeType = (): string => {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus', 
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log(`🎥 Using MIME type: ${type}`);
        return type;
      }
    }
    
    console.log(`🎥 Fallback to: video/webm`);
    return 'video/webm';
  };

  // Initialize media stream
  const initializeMedia = useCallback(async () => {
    try {
      console.log('🎬 Initializing media stream...');
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      console.log('✅ Media stream obtained successfully');
      console.log('📹 Video tracks:', stream.getVideoTracks().length);
      console.log('🎵 Audio tracks:', stream.getAudioTracks().length);

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('📺 Video element connected to stream');
      }

      setMediaReady(true);
    } catch (err) {
      console.error('❌ Media initialization error:', err);
      const errorMsg = 'Failed to access camera and microphone. Please ensure permissions are granted.';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [onError]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!streamRef.current || !mediaReady) {
      console.log('❌ Cannot start recording - stream or media not ready');
      return;
    }

    try {
      console.log(`🎬 Starting recording for interview: ${interviewId}`);

      // Initialize recording session on server
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${interviewId}/recordings/start`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      console.log('🌐 Server start response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to start recording session on server');
      }

      const serverResult = await response.json();
      console.log('✅ Server start response:', serverResult);

      // Clear previous data
      recordedChunksRef.current = [];
      chunkIndexRef.current = 0;

      // Get supported MIME type
      const mimeType = getSupportedMimeType();

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      });

      console.log('🎥 MediaRecorder created with:', {
        mimeType,
        state: mediaRecorder.state
      });

      // Set up event handlers
      mediaRecorder.ondataavailable = async (event) => {
        const chunkIndex = chunkIndexRef.current++;
        console.log(`📦 Data available - chunk ${chunkIndex}, size: ${event.data.size}`);
        
        if (event.data && event.data.size > 0) {
          // Store chunk in memory
          recordedChunksRef.current.push(event.data);

          setRecordingState(prev => ({
            ...prev,
            chunkCount: prev.chunkCount + 1
          }));

          // Upload chunk to server (backup) - with small delay
          setTimeout(() => {
            sendChunkToServer(chunkIndex, event.data);
          }, 100);
        } else {
          console.log(`⚠️ Empty chunk received at index ${chunkIndex}`);
        }
      };

      mediaRecorder.onstart = () => {
        console.log('▶️ MediaRecorder started');
      };

      mediaRecorder.onstop = () => {
        console.log('⏹️ MediaRecorder stopped, total chunks:', recordedChunksRef.current.length);
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
      };

      // Store reference and start recording
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(2000); // 2-second chunks
      
      console.log('🎬 MediaRecorder.start() called with 2000ms interval');

      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        duration: 0,
        chunkCount: 0,
        uploadedChunks: 0
      }));

      onRecordingStart?.();

    } catch (err) {
      console.error('❌ Start recording error:', err);
      const errorMsg = 'Failed to start recording';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [mediaReady, interviewId, onRecordingStart, onError]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !recordingState.isRecording) {
      console.log('❌ Cannot stop recording - no active recording');
      return;
    }

    try {
      console.log('⏹️ Stopping recording...');
      setRecordingState(prev => ({ ...prev, isProcessing: true }));

      const mediaRecorder = mediaRecorderRef.current;
      
      // Wait for stop event
      const stopPromise = new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => {
          console.log('✅ MediaRecorder stop event fired');
          resolve();
        };
      });

      mediaRecorder.stop();
      await stopPromise;
      
      // Wait for any final chunks
      console.log('⏳ Waiting for final chunks...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (recordedChunksRef.current.length === 0) {
        throw new Error('No chunks were recorded');
      }

      console.log(`📦 Total recorded chunks: ${recordedChunksRef.current.length}`);

      // Create final blob
      const mimeType = 'video/webm';
      const combinedBlob = new Blob(recordedChunksRef.current, { type: mimeType });
      console.log(`🎥 Combined blob size: ${combinedBlob.size} bytes`);

      // Upload final recording to server
      const formData = new FormData();
      formData.append('recording', combinedBlob, `interview-${interviewId}.webm`);

      console.log('🌐 Uploading final recording to server...');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${interviewId}/recordings/final`,
        {
          method: 'POST',
          body: formData
        }
      );

      console.log('📡 Final upload response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to upload final recording to server');
      }

      const result = await response.json();
      console.log('✅ Final upload result:', result);
      
      // Cleanup
      recordedChunksRef.current = [];
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        uploadedChunks: prev.chunkCount
      }));

      // Clean up session storage
      sessionStorage.removeItem('activeRecording');

      onRecordingStop?.(result.recording);

    } catch (err) {
      console.error('❌ Stop recording error:', err);
      const errorMsg = 'Failed to stop recording';
      setError(errorMsg);
      onError?.(errorMsg);
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false
      }));
    }
  }, [recordingState.isRecording, interviewId, onRecordingStop, onError]);

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize media on mount
  useEffect(() => {
    initializeMedia();
    
    return () => {
      if (streamRef.current) {
        console.log('🛑 Cleaning up media stream');
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Add page navigation protection
  useEffect(() => {
    // Prevent page refresh/navigation during recording
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (recordingState.isRecording) {
        console.log('⚠️ Page unload detected during recording');
        
        // Try to finalize recording synchronously
        if (recordedChunksRef.current.length > 0) {
          const mimeType = 'video/webm';
          const combinedBlob = new Blob(recordedChunksRef.current, { type: mimeType });
          
          // Use sendBeacon for reliable data sending during page unload
          const formData = new FormData();
          formData.append('recording', combinedBlob, `interview-${interviewId}-interrupted.webm`);
          
          console.log('📡 Sending recording via beacon');
          const sent = navigator.sendBeacon(
            `${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${interviewId}/recordings/final`,
            formData
          );
          console.log('📡 Beacon sent:', sent);
        }
        
        e.preventDefault();
        e.returnValue = 'Recording is in progress. Are you sure you want to leave?';
        return 'Recording is in progress. Are you sure you want to leave?';
      }
    };

    // Add visibility change handler for recovery
    const handleVisibilityChange = () => {
      if (document.hidden && recordingState.isRecording) {
        console.log('⚠️ Page hidden during recording - continuing in background');
        setIsPageHidden(true);
      } else if (!document.hidden && recordingState.isRecording) {
        console.log('✅ Page visible again - recording still active');
        setIsPageHidden(false);
      }
    };

    // Save recording state to sessionStorage for recovery
    if (recordingState.isRecording) {
      sessionStorage.setItem('activeRecording', JSON.stringify({
        interviewId,
        isRecording: true,
        startTime: Date.now() - (recordingState.duration * 1000),
        chunkCount: recordingState.chunkCount
      }));
    } else {
      sessionStorage.removeItem('activeRecording');
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [recordingState.isRecording, interviewId, recordingState.duration, recordingState.chunkCount]);

  // Debug: Log current state
  useEffect(() => {
    console.log('🔍 Current state:', {
      mediaReady,
      isRecording: recordingState.isRecording,
      chunkCount: recordingState.chunkCount,
      duration: recordingState.duration,
      error
    });
  }, [mediaReady, recordingState, error]);

  // Loading state
  if (!mediaReady && !error) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white">Accessing camera and microphone...</p>
        <p className="text-gray-400 text-sm mt-2">Make sure to allow permissions when prompted</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center">
        <div className="bg-red-500 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-white text-lg font-semibold mb-2">Recording Error</h3>
        <p className="text-gray-300 mb-4">{error}</p>
        <div className="space-y-2">
          <button
            onClick={initializeMedia}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition-colors mr-2"
          >
            Retry Camera Access
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-white transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* Video Preview */}
      <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Recording Overlay */}
        {recordingState.isRecording && (
          <div className="absolute top-4 left-4 space-y-2">
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>REC {formatDuration(recordingState.duration)}</span>
            </div>
            {isPageHidden && (
              <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                Background Recording
              </div>
            )}
          </div>
        )}

        {/* Processing Overlay */}
        {recordingState.isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
              <p className="text-lg font-medium">Processing recording...</p>
              <p className="text-sm text-gray-300">Uploading to cloud storage</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          {/* Recording Info */}
          <div className="text-white text-sm space-y-1">
            <div>Duration: {formatDuration(recordingState.duration)}</div>
            <div>Chunks: {recordingState.chunkCount} | Uploaded: {recordingState.uploadedChunks}</div>
            <div className="text-xs text-gray-400">
              Format: {getSupportedMimeType().split(';')[0]}
            </div>
            <div className="text-xs text-gray-400">
              Interview: {interviewId}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-3">
            {!recordingState.isRecording ? (
              <button
                onClick={startRecording}
                disabled={recordingState.isProcessing || !mediaReady}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg text-white font-medium flex items-center space-x-2 transition-colors"
              >
                <div className="w-3 h-3 bg-white rounded-full"></div>
                <span>Start Recording</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                disabled={recordingState.isProcessing}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg text-white font-medium flex items-center space-x-2 transition-colors"
              >
                <div className="w-3 h-3 bg-white"></div>
                <span>Stop Recording</span>
              </button>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {recordingState.chunkCount > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Backup Upload Progress</span>
              <span>{recordingState.uploadedChunks}/{recordingState.chunkCount}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: recordingState.chunkCount > 0 
                    ? `${(recordingState.uploadedChunks / recordingState.chunkCount) * 100}%` 
                    : '0%' 
                }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}