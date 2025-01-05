import './globals.css';

export const metadata = {
  title: 'منصة إنشاء الرسائل الأسبوعية',
  description: 'منصة لإنشاء وإدارة الرسائل الأسبوعية للطلاب',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
      </body>
    </html>
  );
}