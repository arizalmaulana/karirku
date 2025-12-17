"use client";

import { useEffect } from "react";
import { useRealtimeNotifications } from "@/lib/hooks/useRealtimeNotifications";
import { useAuth } from "@/lib/auth-context";

/**
 * Provider untuk real-time notifications
 * Mengintegrasikan dengan sistem auth untuk menampilkan notifikasi real-time
 */
export function RealtimeNotificationsProvider() {
  const { user } = useAuth();
  const { notifications, unreadCount } = useRealtimeNotifications(user?.id || null);

  // Notifikasi akan otomatis ditampilkan melalui hook useRealtimeNotifications
  // Hook ini akan:
  // 1. Subscribe ke perubahan notifikasi real-time
  // 2. Menampilkan toast notification saat ada notifikasi baru
  // 3. Menampilkan browser notification jika user mengizinkan

  // Unread count bisa digunakan untuk menampilkan badge di UI
  useEffect(() => {
    // Update document title dengan unread count (opsional)
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) KarirKu`;
    } else {
      document.title = "KarirKu";
    }
  }, [unreadCount]);

  // Komponen ini tidak render apa-apa, hanya setup real-time subscription
  return null;
}

