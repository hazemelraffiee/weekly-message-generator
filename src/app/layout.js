import './globals.css';

export const metadata = {
  title: 'Weekly Message Generator',
  description: 'A tool for generating weekly messages',
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