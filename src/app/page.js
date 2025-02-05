import { Suspense } from 'react';
import ClientPage from '@/components/Common/ClientPage';
import Loading from '@/components/Common/Loading';

// The root page component now includes the Suspense boundary
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientPage />
    </Suspense>
  );
}