'use client';

import dynamic from 'next/dynamic';
import { HydrationProvider } from '@/context/HydrationContext';

const LinkCreator = dynamic(
  () => import('@/components/LinkCreator'),
  { ssr: false }
);

export default function LinkCreatorPage() {
  return (
    <main className="min-h-screen bg-gray-900 py-8">
      <HydrationProvider>
        <LinkCreator />
      </HydrationProvider>
    </main>
  );
}