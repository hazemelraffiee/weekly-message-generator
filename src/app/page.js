'use client';

import dynamic from 'next/dynamic';
import { HydrationProvider } from '@/context/HydrationContext';

const WeeklyMessageGenerator = dynamic(
  () => import('@/components/WeeklyMessageGenerator'),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 py-8">
      <HydrationProvider>
        <WeeklyMessageGenerator />
      </HydrationProvider>
    </main>
  );
}