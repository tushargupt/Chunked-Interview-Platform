'use client';

import { useParams } from 'next/navigation';
import InterviewPage from '@/components/InterviewPage';

export default function InterviewRoute() {
  const params = useParams();
  const interviewId = params.interviewId as string;

  return <InterviewPage interviewId={interviewId} />;
}