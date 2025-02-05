'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { HydrationProvider } from '@/context/HydrationContext';
import { decodeData } from '@/components/LinkCreator/LinkCreator';
import Loading from '@/components/Common/Loading';

// Dynamically import WeeklyMessageGenerator with its own loading state
const WeeklyMessageGenerator = dynamic(
  () => import('@/components/MessageGenerator/WeeklyMessageGenerator'),
  { 
    loading: () => <Loading />,
    ssr: false 
  }
);

// The main client component that uses searchParams
export default function ClientPage() {
  // useSearchParams is now safely wrapped in a Suspense boundary from the parent
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams) {
      const data = searchParams.get('data');
      if (data) {
        try {
          const decodedData = decodeData(data);
          if (decodedData?.className && Array.isArray(decodedData?.students)) {
            // Update page title based on decoded data
            document.title = `${decodedData.className} - ${decodedData.students.length} طالب`;
            
            // Update meta description
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
              metaDescription.setAttribute('content', `تقرير حصة ${decodedData.className}`);
            }
          }
        } catch (error) {
          console.error('Error decoding data:', error);
        }
      }
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-gray-900 py-8">
      <HydrationProvider>
        <WeeklyMessageGenerator />
      </HydrationProvider>
    </main>
  );
}