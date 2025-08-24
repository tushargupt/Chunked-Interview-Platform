import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Chunked Interview Platform
          </h1>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Advanced interview recording platform with real-time chunked upload, 
            cloud storage, and seamless download capabilities. Perfect for remote interviews
            with automatic backup and recovery.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              href="/interview"
              className="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg"
            >
              Start New Interview
            </Link>
            <Link 
              href="/recordings"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-900 transition-colors"
            >
              View Recordings
            </Link>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 text-center">
            <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Chunked Upload</h3>
            <p className="text-blue-100">Real-time upload every 2 seconds for maximum reliability</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 text-center">
            <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">AWS S3 Storage</h3>
            <p className="text-blue-100">Secure cloud storage with automatic backup</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 text-center">
            <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">HD Recording</h3>
            <p className="text-blue-100">High-quality video and audio capture</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 text-center">
            <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Easy Download</h3>
            <p className="text-blue-100">Instant download links with secure access</p>
          </div>
        </div>

        {/* Technical Features */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-white mb-6">Technical Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto text-sm">
            <div className="bg-white bg-opacity-5 rounded-lg p-3">
              <span className="text-blue-200">• MediaRecorder API with WebM format</span>
            </div>
            <div className="bg-white bg-opacity-5 rounded-lg p-3">
              <span className="text-blue-200">• Real-time chunk processing</span>
            </div>
            <div className="bg-white bg-opacity-5 rounded-lg p-3">
              <span className="text-blue-200">• MongoDB for metadata storage</span>
            </div>
            <div className="bg-white bg-opacity-5 rounded-lg p-3">
              <span className="text-blue-200">• Express.js REST API</span>
            </div>
            <div className="bg-white bg-opacity-5 rounded-lg p-3">
              <span className="text-blue-200">• Next.js React frontend</span>
            </div>
            <div className="bg-white bg-opacity-5 rounded-lg p-3">
              <span className="text-blue-200">• S3 signed URLs for security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}