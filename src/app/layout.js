import './globals.css';

export const metadata = {
  title: 'منصة إنشاء الرسائل الأسبوعية',
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