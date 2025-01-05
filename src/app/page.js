import { decodeDataServer } from '@/utils/serverUtils';
import ClientPage from '@/components/ClientPage';

export async function generateMetadata({ searchParams }) {
  const data = searchParams?.data;
  
  if (!data) {
    return {
      title: 'منصة إنشاء الرسائل الأسبوعية'
    };
  }

  try {
    // Use the server-safe decode function
    const decodedData = decodeDataServer(data);
    
    if (decodedData?.className && Array.isArray(decodedData?.students)) {
      return {
        title: `${decodedData.className} - ${decodedData.students.length} طلاب`,
        description: `تقرير حصة ${decodedData.className}`,
        openGraph: {
          title: `${decodedData.className} - ${decodedData.students.length} طلاب`,
          description: `تقرير حصة ${decodedData.className}`
        }
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }

  return {
    title: 'منصة إنشاء الرسائل الأسبوعية'
  };
}

export default function Page() {
  return <ClientPage />;
}
