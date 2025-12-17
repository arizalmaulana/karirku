"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Suspense } from "react";

/**
 * Komponen untuk menampilkan toast notification saat email berhasil dikonfirmasi
 * Digunakan di halaman dashboard untuk menampilkan notifikasi dari query parameter
 */
function EmailConfirmationToastContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailConfirmed = searchParams.get("emailConfirmed");
    
    if (emailConfirmed === "true") {
      // Tampilkan toast notification
      toast.success("Email Berhasil Dikonfirmasi", {
        description: "Selamat! Email Anda telah berhasil dikonfirmasi. Akun Anda sekarang aktif dan siap digunakan.",
        duration: 5000,
      });

      // Hapus query parameter dari URL tanpa reload
      const url = new URL(window.location.href);
      url.searchParams.delete("emailConfirmed");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  return null;
}

export function EmailConfirmationToast() {
  return (
    <Suspense fallback={null}>
      <EmailConfirmationToastContent />
    </Suspense>
  );
}

