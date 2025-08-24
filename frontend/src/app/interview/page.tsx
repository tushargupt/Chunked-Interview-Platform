'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function InterviewRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Generate random interview ID and redirect
    const interviewId = uuidv4();
    router.replace(`/interview/${interviewId}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Starting Interview...</h2>
        <p className="text-gray-600">Please wait while we prepare your session</p>
      </div>
    </div>
  );
}