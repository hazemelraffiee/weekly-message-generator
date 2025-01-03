'use client';

import dynamic from 'next/dynamic';
import { HydrationProvider } from '@/context/HydrationContext';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

const WeeklyMessageGenerator = dynamic(
  () => import('@/components/WeeklyMessageGenerator'),
  { ssr: false }
);

// Separate component for handling URL parameters and title
function TitleUpdater() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (searchParams) {
      const data = searchParams.get('data');
      if (data) {
        try {
          const base64 = data
            .replace(/-/g, '+')
            .replace(/_/g, '/');
          
          const paddedBase64 = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);
          const binaryStr = atob(paddedBase64);
          
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          
          const decodedStr = new TextDecoder().decode(bytes);
          const parsedData = JSON.parse(decodedStr);
          
          if (parsedData?.className && Array.isArray(parsedData?.students)) {
            document.title = `${parsedData.className} - ${parsedData.students.length} طالب`;
          }
        } catch (error) {
          console.error('Error decoding data:', error);
        }
      }
    }
  }, [searchParams]);

  return null; // This component doesn't render anything
}

// Loading component for Suspense fallback
function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center gap-3 text-lg text-gray-100">
        جاري التحميل...
      </div>
    </div>
  );
}

// Main page component
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 py-8">
      <Suspense fallback={<Loading />}>
        <TitleUpdater />
        <HydrationProvider>
          <WeeklyMessageGenerator />
        </HydrationProvider>
      </Suspense>
    </main>
  );
}