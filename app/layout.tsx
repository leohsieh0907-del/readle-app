import type { Metadata } from 'next';
import { Inter, Lora } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/AppShell';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const lora = Lora({
  variable: '--font-serif',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Readle — AI 英文學習平台',
  description: '影片雙字幕、AI 助教 Luna、單字記憶曲線。每天 10 分鐘的優雅習慣。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${inter.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
