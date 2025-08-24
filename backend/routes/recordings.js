const express = require('express');
const multer = require('multer');
const { Recording } = require('../models');
const s3Service = require('../services/s3Service');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

const diskUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per chunk
  }
});

// Validate video file
const validateVideoFile = async (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    
    // Read first few bytes to check WebM signature
    const buffer = fs.readFileSync(filePath, { start: 0, end: 32 });
    const signature = buffer.toString('hex');
    
    return {
      isValid: true,
      size: stats.size,
      signature: signature.substring(0, 16)
    };
  } catch (error) {
    console.error('Video validation error:', error);
    return {
      isValid: false,
      error: error.message
    };
  }
};

// Start recording session
router.post('/interviews/:interviewId/recordings/start', async (req, res) => {
  try {
    const { interviewId } = req.params;

    if (!interviewId) {
      return res.status(400).json({
        success: false,
        message: 'Interview ID is required'
      });
    }

    let recording = await Recording.findOne({ interviewId });
    
    if (!recording) {
      recording = new Recording({
        interviewId,
        startedAt: new Date(),
        status: 'uploading'
      });
      await recording.save();
    } else {
      console.log(`Existing recording: ${recording._id}`);
    }

    res.json({
      success: true,
      recordingId: recording._id,
      message: 'Recording session started'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start recording session',
      error: error.message
    });
  }
});

// Upload individual chunk (backup)
router.post('/interviews/:interviewId/recordings/chunk', diskUpload.single('chunk'), async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { chunkIndex } = req.body;
    const chunkData = req.file;

    if (!interviewId) {
      return res.status(400).json({
        success: false,
        message: 'Interview ID is required'
      });
    }

    if (!chunkData) {
      return res.status(400).json({
        success: false,
        message: 'No chunk data provided'
      });
    }

    // Update recording with chunk info
    await Recording.findOneAndUpdate(
      { interviewId },
      { 
        $inc: { chunkCount: 1, totalSize: chunkData.size },
        $set: { status: 'uploading' }
      }
    );

    res.json({
      success: true,
      chunkIndex: parseInt(chunkIndex),
      size: chunkData.size,
      message: 'Chunk received successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload chunk',
      error: error.message
    });
  }
});

// Upload final combined recording
router.post('/interviews/:interviewId/recordings/final', memoryUpload.single('recording'), async (req, res) => {
  const { interviewId } = req.params;
  
  try {
    const recordingFile = req.file;

    console.log(`=== FINAL RECORDING UPLOAD START ===`);
    console.log(`📋 Interview ID: ${interviewId}`);

    if (!interviewId) {
      console.log(`No ID provided`);
      return res.status(400).json({
        success: false,
        message: 'Interview ID is required'
      });
    }

    if (!recordingFile) {
      console.log(`No recording file in request`);
      return res.status(400).json({
        success: false,
        message: 'No recording file provided'
      });
    }

    // Find recording
    const recording = await Recording.findOne({ interviewId });
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording session not found'
      });
    }

    // Create temp directory
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Determine file extension
    let extension = '.webm';
    if (recordingFile.mimetype.includes('mp4')) {
      extension = '.mp4';
    }

    const tempFileName = `interview-${interviewId}-${Date.now()}${extension}`;
    const tempFilePath = path.join(tempDir, tempFileName);
    
    console.log(`💾 Writing file to: ${tempFilePath}`);
    
    // Write file to disk
    fs.writeFileSync(tempFilePath, recordingFile.buffer);
    
    const writtenStats = fs.statSync(tempFilePath);
    console.log(`${writtenStats.size}`);

    const validation = await validateVideoFile(tempFilePath);

    if (!validation.isValid) {
      fs.unlinkSync(tempFilePath);
      return res.status(400).json({
        success: false,
        message: 'Invalid video file',
        error: validation.error
      });
    }

    // Upload to S3
    const uploadResult = await s3Service.uploadRecording(tempFilePath, interviewId);
    console.log(`S3 result:`, uploadResult);

    if (!uploadResult.success) {
      fs.unlinkSync(tempFilePath);
      
      await Recording.findOneAndUpdate(
        { interviewId },
        { status: 'failed', endedAt: new Date() }
      );
      
      return res.status(500).json({
        success: false,
        message: 'Failed to upload recording to S3'
      });
    }
    // Update recording with S3 details
    const updatedRecording = await Recording.findOneAndUpdate(
      { interviewId },
      {
        s3Key: uploadResult.s3Key,
        url: uploadResult.url,
        status: 'complete',
        endedAt: new Date(),
        totalSize: recordingFile.size,
        mimeType: recordingFile.mimetype,
        validation: {
          signature: validation.signature,
          isValid: validation.isValid
        }
      },
      { new: true }
    );

    // Cleanup temp file
    fs.unlinkSync(tempFilePath);
    res.json({
      success: true,
      recording: {
        id: updatedRecording._id,
        interviewId: updatedRecording.interviewId,
        url: updatedRecording.url,
        status: updatedRecording.status,
        duration: Math.floor((updatedRecording.endedAt - updatedRecording.startedAt) / 1000),
        size: updatedRecording.totalSize,
        mimeType: updatedRecording.mimeType,
        validation: updatedRecording.validation
      },
      message: 'Recording finalized and validated successfully'
    });

  } catch (error) {
    console.error('Error', error);
    
    try {
      await Recording.findOneAndUpdate(
        { interviewId },
        { status: 'failed', endedAt: new Date() }
      );
    } catch (updateError) {
      console.error('Failed to update recording status:', updateError);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to finalize recording',
      error: error.message
    });
  }
});

// Get all recordings
router.get('/recordings', async (req, res) => {
  try {
    const recordings = await Recording.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      recordings: recordings.map(recording => ({
        id: recording._id,
        interviewId: recording.interviewId,
        status: recording.status,
        startedAt: recording.startedAt,
        endedAt: recording.endedAt,
        totalSize: recording.totalSize,
        chunkCount: recording.chunkCount,
        mimeType: recording.mimeType
      }))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recordings',
      error: error.message
    });
  }
});

// Download recording
router.get('/recordings/:recordingId/download', async (req, res) => {
  try {
    const { recordingId } = req.params;
    
    if (!recordingId) {
      return res.status(400).json({
        success: false,
        message: 'Recording ID is required'
      });
    }
    
    const recording = await Recording.findById(recordingId);
    if (!recording || recording.status !== 'complete') {
      return res.status(404).json({
        success: false,
        message: 'Recording not found or not ready for download'
      });
    }

    const downloadUrl = await s3Service.generateDownloadUrl(recording.s3Key, 3600); // 1 hour

    res.json({
      success: true,
      downloadUrl,
      fileName: `interview-${recording.interviewId}.webm`,
      mimeType: recording.mimeType || 'video/webm',
      size: recording.totalSize,
      expiresIn: 3600
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate download link',
      error: error.message
    });
  }
});

module.exports = router;