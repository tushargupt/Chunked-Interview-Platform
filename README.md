# Chunked Interview Platform

A modern, reliable interview recording platform with real-time chunked upload, cloud storage, and seamless download capabilities. Built with Next.js, Express.js, MongoDB, and AWS S3.

## 🚀 Features

- **Real-time Chunked Recording**: Records and uploads video chunks every 2 seconds for maximum reliability
- **High-Quality Recording**: HD video and audio capture using WebRTC MediaRecorder API
- **Cloud Storage**: Secure AWS S3 storage with automatic backup
- **Instant Downloads**: Generate secure download links with signed URLs
- **Navigation Protection**: Prevents accidental page navigation during recording
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **RESTful API**: Express.js backend with MongoDB for metadata storage

## 🏗️ Architecture

```
Project Root/
├── frontend/          # Next.js React application
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   └── components/ # React components
│   ├── package.json
│   └── ...
├── backend/           # Express.js API server
│   ├── models/        # MongoDB schemas
│   ├── routes/        # API routes
│   ├── services/      # Business logic services
│   ├── server.js      # Main server file
│   └── package.json
└── README.md         # This file
```

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **AWS Account** with S3 bucket access
- **Modern web browser** with WebRTC support

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/tushargupt/Chunked-Interview-Platform.git
cd Chunked-Interview-Platform
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/interview-platform
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/interview-platform

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-interview-recordings-bucket

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## 🔧 Configuration

### AWS S3 Setup

1. Create an S3 bucket for storing recordings
2. Configure bucket permissions for public read access (optional)
3. Create IAM user with S3 permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       },
       {
         "Effect": "Allow",
         "Action": [
           "s3:ListBucket"
         ],
         "Resource": "arn:aws:s3:::your-bucket-name"
       }
     ]
   }
   ```

### MongoDB Setup

**Local MongoDB:**
```bash
# Install MongoDB
# Start MongoDB service
mongod --dbpath /path/to/your/db
```

**MongoDB Atlas:**
1. Create a cluster at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Get connection string
3. Add to `.env` file

## 🎯 Usage

### Starting an Interview

1. Navigate to the home page
2. Click "Start New Interview"
3. Allow camera and microphone permissions
4. Click "Start Recording" to begin

### Recording Features

- **Real-time Upload**: Chunks are uploaded every 2 seconds as backup
- **Progress Monitoring**: View upload progress and chunk count
- **Duration Tracking**: Live recording duration display
- **Recovery Protection**: Automatic handling of interrupted recordings

### Viewing Recordings

1. Click "View Recordings" from the home page
2. Browse all recorded interviews
3. Download completed recordings
4. Monitor upload status for in-progress recordings

## 📁 Project Structure

### Frontend (`/frontend`)

```
src/
├── app/
│   ├── page.tsx                    # Home page
│   ├── layout.tsx                  # Root layout
│   ├── interview/
│   │   ├── page.tsx               # Interview redirect
│   │   └── [interviewId]/
│   │       └── page.tsx           # Interview session page
│   └── recordings/
│       └── page.tsx               # Recordings list page
└── components/
    ├── ChunkedRecorder.tsx        # Main recording component
    ├── InterviewPage.tsx          # Interview page container
    └── RecordingsList.tsx         # Recordings list component
```

### Backend (`/backend`)

```
├── server.js                      # Express server setup
├── models/
│   └── index.js                   # MongoDB schemas
├── routes/
│   └── recordings.js              # Recording API routes
└── services/
    ├── s3Service.js               # AWS S3 operations
    └── chunkService.js            # Chunk handling logic
```

## 🔌 API Endpoints

### Recording Management

- `POST /api/interviews/:interviewId/recordings/start` - Start recording session
- `POST /api/interviews/:interviewId/recordings/chunk` - Upload chunk (backup)
- `POST /api/interviews/:interviewId/recordings/final` - Upload final recording
- `GET /api/recordings` - Get all recordings
- `GET /api/recordings/:recordingId/download` - Get download URL

### Health Check

- `GET /health` - Server health status

## 🛡️ Security Features

- **Signed URLs**: Secure download links with expiration
- **File Validation**: Video file format and size validation
- **Error Handling**: Comprehensive error handling and logging
- **CORS Protection**: Configured for specific frontend domains

## 🔍 Troubleshooting

### Common Issues

**Camera/Microphone Access:**
- Ensure HTTPS in production (required for WebRTC)
- Check browser permissions
- Verify camera/microphone hardware

**Recording Upload Fails:**
- Check AWS credentials and permissions
- Verify S3 bucket configuration
- Check network connectivity
- Monitor server logs for detailed errors

**MongoDB Connection:**
- Verify MongoDB is running (local)
- Check connection string format
- Ensure database permissions (Atlas)

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

Check browser console and server logs for detailed error information.

## 🚀 Deployment

### Backend Deployment

**Recommended platforms:**
- AWS EC2 with PM2
- Heroku
- DigitalOcean Droplets
- Railway

**Environment variables to set:**
- All `.env` variables
- `NODE_ENV=production`
- `PORT` (if different from 5000)

### Frontend Deployment

**Recommended platforms:**
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify

**Build command:**
```bash
npm run build
```

**Environment variables:**
- `NEXT_PUBLIC_API_URL=https://your-api-domain.com`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review server and browser console logs



**Built with ❤️ using Next.js, Express.js, MongoDB, and AWS S3**