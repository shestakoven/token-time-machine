import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppWagmiProvider } from '@/components/providers/wagmi-provider';

const inter = Inter({subsets: ['latin']});

export const metadata: Metadata = {
  title: 'Token Time Machine',
  description: 'Calculate potential profit/loss for tokens based on historical data.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning={true}>
        <AppWagmiProvider>
          {children}
        </AppWagmiProvider>
        <Toaster />
      </body>
    </html>
  );
}
