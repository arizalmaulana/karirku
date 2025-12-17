"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { RealtimeChannel } from "@supabase/supabase-js";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
  is_read: boolean;
  link: string | null;
  created_at: string;
}

/**
 * Hook untuk real-time notifications menggunakan Supabase Realtime
 * Menampilkan notifikasi langsung di device saat ada notifikasi baru
 */
export function useRealtimeNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const supabase = createBrowserClient();

  // Request permission untuk browser notifications
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }, []);

  // Tampilkan browser notification
  const showBrowserNotification = useCallback(
    (notification: Notification) => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        return;
      }

      if (Notification.permission === "granted") {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico", // Ganti dengan icon aplikasi Anda
          badge: "/favicon.ico",
          tag: notification.id,
          requireInteraction: false,
        });

        // Handle click pada notification
        browserNotification.onclick = () => {
          window.focus();
          if (notification.link) {
            window.location.href = notification.link;
          }
          browserNotification.close();
        };

        // Auto close setelah 5 detik
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    },
    []
  );

  // Setup real-time subscription
  useEffect(() => {
    if (!userId) {
      return;
    }

    // Request notification permission
    requestNotificationPermission();

    // Subscribe ke perubahan notifikasi untuk user ini
    const notificationChannel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;

          // Tambahkan ke state
          setNotifications((prev) => [newNotification, ...prev]);

          // Tampilkan toast notification
          const toastType =
            newNotification.type === "success"
              ? "success"
              : newNotification.type === "error"
              ? "error"
              : newNotification.type === "warning"
              ? "warning"
              : "info";

          toast[toastType](newNotification.title, {
            description: newNotification.message,
            duration: 5000,
            action: newNotification.link
              ? {
                  label: "Buka",
                  onClick: () => {
                    window.location.href = newNotification.link!;
                  },
                }
              : undefined,
          });

          // Tampilkan browser notification
          showBrowserNotification(newNotification);
        }
      )
      .subscribe();

    setChannel(notificationChannel);

    // Load notifikasi yang belum dibaca
    const loadUnreadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;
        setNotifications(data || []);
      } catch (error) {
        console.error("Error loading notifications:", error);
      }
    };

    loadUnreadNotifications();

    // Cleanup
    return () => {
      if (notificationChannel) {
        supabase.removeChannel(notificationChannel);
      }
    };
  }, [userId, supabase, requestNotificationPermission, showBrowserNotification]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const { error } = await (supabase
          .from("notifications") as any)
          .update({ is_read: true })
          .eq("id", notificationId)
          .eq("user_id", userId);

        if (error) throw error;

        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [supabase, userId]
  );

  return {
    notifications,
    markAsRead,
    unreadCount: notifications.filter((n) => !n.is_read).length,
  };
}

