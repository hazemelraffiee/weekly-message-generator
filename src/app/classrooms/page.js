'use client';

import dynamic from 'next/dynamic';
import { HydrationProvider } from '@/context/HydrationContext';

const ClassroomOverview = dynamic(
  () => import('@/components/ClassroomOverview/ClassroomOverview'),
  { ssr: false }
);

export default function ClassroomOverviewPage() {
  return (
    <main className="min-h-screen bg-gray-900 py-8">
      <HydrationProvider>
        <ClassroomOverview />
      </HydrationProvider>
    </main>
  );
}