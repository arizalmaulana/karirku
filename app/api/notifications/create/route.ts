import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * API Route untuk membuat notifikasi
 * Menggunakan service role untuk bypass RLS
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, title, message, type = "info", link = null } = body;

    // Validasi input
    if (!user_id || !title || !message) {
      return NextResponse.json(
        { error: "user_id, title, dan message harus diisi" },
        { status: 400 }
      );
    }

    // Validasi type
    const validTypes = ["success", "info", "warning", "error"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type harus salah satu dari: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const adminClient = createSupabaseAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: "Service role key tidak tersedia" },
        { status: 500 }
      );
    }

    // Buat notifikasi menggunakan function create_notification
    const { data, error } = await adminClient.rpc("create_notification", {
      p_user_id: user_id,
      p_title: title,
      p_message: message,
      p_type: type,
      p_link: link,
    });

    if (error) {
      console.error("Error creating notification:", error);
      return NextResponse.json(
        { error: error.message || "Gagal membuat notifikasi" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, notification_id: data },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in create notification API:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}

