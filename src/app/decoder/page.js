'use client';

import dynamic from 'next/dynamic';
import { HydrationProvider } from '@/context/HydrationContext';

const ReportDecoder = dynamic(
  () => import('@/components/ReportDecoder/ReportDecoder'),
  { ssr: false }
);

export default function ReportDecoderPage() {
  return (
    <main className="min-h-screen bg-gray-900 py-8">
      <HydrationProvider>
        <ReportDecoder />
      </HydrationProvider>
    </main>
  );
}