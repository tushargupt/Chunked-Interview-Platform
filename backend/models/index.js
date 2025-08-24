const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  role: { 
    type: String, 
    enum: ['interviewer', 'candidate'], 
    required: true 
  }
}, { 
  timestamps: true
});

// Interview Schema
const interviewSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  duration: { 
    type: Number, 
    default: 0 
  }, // in seconds
  interviewerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  candidateId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  }
}, { 
  timestamps: true
});

// Recording Schema - interviewId as STRING (not ObjectId)
const recordingSchema = new mongoose.Schema({
  interviewId: { 
    type: String, // This must be String to accept UUIDs
    required: true,
    index: true
  },
  s3Key: { 
    type: String
  },
  bucketName: { 
    type: String, 
    default: function() {
      return process.env.S3_BUCKET_NAME || 'interview-recordings';
    }
  },
  startedAt: { 
    type: Date,
    default: Date.now
  },
  endedAt: { 
    type: Date 
  },
  url: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['uploading', 'complete', 'failed'], 
    default: 'uploading',
    index: true
  },
  chunkCount: { 
    type: Number, 
    default: 0 
  },
  totalSize: { 
    type: Number, 
    default: 0 
  }
}, { 
  timestamps: true
});

// Add indexes for better performance
recordingSchema.index({ interviewId: 1, status: 1 });
recordingSchema.index({ createdAt: -1 });

// Create models
const User = mongoose.model('User', userSchema);
const Interview = mongoose.model('Interview', interviewSchema);
const Recording = mongoose.model('Recording', recordingSchema);

module.exports = { User, Interview, Recording };