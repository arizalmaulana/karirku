import { NextResponse } from "next/server";
import { fetchJobsFromDatabase } from "@/lib/utils/jobData";

/**
 * API Route untuk mengambil semua jobs
 * Digunakan oleh client components yang tidak bisa menggunakan server functions
 */
export async function GET() {
  try {
    const jobs = await fetchJobsFromDatabase();
    return NextResponse.json({ jobs }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengambil data lowongan" },
      { status: 500 }
    );
  }
}

