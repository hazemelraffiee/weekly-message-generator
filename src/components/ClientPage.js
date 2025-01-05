'use client';

import dynamic from 'next/dynamic';
import { HydrationProvider } from '@/context/HydrationContext';
import { Suspense } from 'react';

const WeeklyMessageGenerator = dynamic(
  () => import('@/components/WeeklyMessageGenerator'),
  { ssr: false }
);

// Loading component
function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center gap-3 text-lg text-gray-100">
        جاري التحميل...
      </div>
    </div>
  );
}

// Client Component that handles the dynamic import
export default function ClientPage() {
  return (
    <main className="min-h-screen bg-gray-900 py-8">
      <Suspense fallback={<Loading />}>
        <HydrationProvider>
          <WeeklyMessageGenerator />
        </HydrationProvider>
      </Suspense>
    </main>
  );
}