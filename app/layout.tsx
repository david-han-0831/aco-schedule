import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ACO 관리 시스템",
  description: "안양시민오케스트라 구성원 및 연습일정 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            <Navigation />
            <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
                {children}
              </div>
            </main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

