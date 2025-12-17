import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { RealtimeNotificationsProvider } from "@/components/RealtimeNotificationsProvider";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "KarirKu - Platform Pencari Kerja Terpercaya",
  description: "Temukan pekerjaan impian Anda dari ribuan lowongan kerja terpercaya",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <RealtimeNotificationsProvider />
          <div className="min-h-screen bg-gray-50">
            <Header />
            {children}
            <Toaster position="top-right" richColors expand={false} />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
