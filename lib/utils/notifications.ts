/**
 * Utility functions untuk membuat notifikasi
 */

export interface CreateNotificationParams {
  user_id: string;
  title: string;
  message: string;
  type?: "success" | "info" | "warning" | "error";
  link?: string | null;
}

/**
 * Membuat notifikasi melalui API
 */
export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    const response = await fetch("/api/notifications/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: params.user_id,
        title: params.title,
        message: params.message,
        type: params.type || "info",
        link: params.link || null,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Error creating notification:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error creating notification:", error);
    return false;
  }
}

/**
 * Helper untuk membuat notifikasi status lamaran
 */
export function getApplicationStatusNotification(
  status: string,
  jobTitle: string,
  companyName: string,
  notes?: string | null,
  interviewDate?: string | null,
  interviewLocation?: string | null
): { title: string; message: string; type: "success" | "info" | "warning" | "error" } {
  switch (status) {
    case "review":
      return {
        title: "Lamaran Anda Sedang Direview",
        message: `Lamaran Anda untuk posisi "${jobTitle}" di ${companyName} sedang dalam proses review. Kami akan menghubungi Anda segera.`,
        type: "info",
      };

    case "interview":
      let interviewMessage = `Selamat! Lamaran Anda untuk "${jobTitle}" di ${companyName} diterima untuk tahap interview.`;
      
      if (interviewDate) {
        const date = new Date(interviewDate);
        const formattedDate = date.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        interviewMessage += `\n\nTanggal: ${formattedDate}`;
      }
      
      if (interviewLocation) {
        interviewMessage += `\nLokasi: ${interviewLocation}`;
      }
      
      if (notes) {
        interviewMessage += `\n\nCatatan: ${notes}`;
      }

      return {
        title: "Anda Diundang Interview! 🎉",
        message: interviewMessage,
        type: "success",
      };

    case "accepted":
      let acceptedMessage = `Selamat! Lamaran Anda untuk "${jobTitle}" di ${companyName} telah diterima.`;
      
      if (notes) {
        acceptedMessage += `\n\n${notes}`;
      } else {
        acceptedMessage += ` Tim HR akan menghubungi Anda untuk langkah selanjutnya.`;
      }

      return {
        title: "Lamaran Anda Diterima! 🎊",
        message: acceptedMessage,
        type: "success",
      };

    case "rejected":
      let rejectedMessage = `Terima kasih atas minat Anda. Lamaran Anda untuk "${jobTitle}" di ${companyName} tidak dapat dilanjutkan.`;
      
      if (notes) {
        rejectedMessage += `\n\nAlasan: ${notes}`;
      } else {
        rejectedMessage += ` Tetap semangat mencari peluang lainnya!`;
      }

      return {
        title: "Update Status Lamaran",
        message: rejectedMessage,
        type: "info",
      };

    default:
      return {
        title: "Status Lamaran Diupdate",
        message: `Status lamaran Anda untuk "${jobTitle}" di ${companyName} telah diupdate.`,
        type: "info",
      };
  }
}

/**
 * Membuat notifikasi untuk jobseeker saat status lamaran diupdate
 */
export async function notifyApplicationStatusUpdate(
  jobSeekerId: string,
  status: string,
  jobTitle: string,
  companyName: string,
  applicationId: string,
  notes?: string | null,
  interviewDate?: string | null,
  interviewLocation?: string | null
): Promise<boolean> {
  const notification = getApplicationStatusNotification(
    status,
    jobTitle,
    companyName,
    notes,
    interviewDate,
    interviewLocation
  );

  return await createNotification({
    user_id: jobSeekerId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    link: `/job-seeker/applications/${applicationId}`,
  });
}

/**
 * Membuat notifikasi untuk recruiter saat ada lamaran baru
 */
export async function notifyNewApplication(
  recruiterId: string,
  jobTitle: string,
  jobSeekerName: string,
  applicationId: string,
  jobId: string
): Promise<boolean> {
  return await createNotification({
    user_id: recruiterId,
    title: "Lamaran Baru Diterima",
    message: `${jobSeekerName} baru saja melamar untuk posisi "${jobTitle}". Segera review untuk mendapatkan kandidat terbaik!`,
    type: "info",
    link: `/recruiter/applications/${applicationId}`,
  });
}

/**
 * Membuat notifikasi untuk recruiter saat akun mereka di-approve
 */
export async function notifyRecruiterApproval(recruiterId: string): Promise<boolean> {
  return await createNotification({
    user_id: recruiterId,
    title: "Akun Anda Telah Disetujui! ✅",
    message: "Selamat! Akun recruiter Anda telah disetujui oleh admin. Anda sekarang bisa mulai posting lowongan pekerjaan.",
    type: "success",
    link: "/recruiter/jobs/new",
  });
}

/**
 * Membuat notifikasi untuk jobseeker saat ada lowongan baru yang sesuai
 */
export async function notifyNewJobMatch(
  jobSeekerId: string,
  jobTitle: string,
  companyName: string,
  matchScore: number,
  jobId: string
): Promise<boolean> {
  return await createNotification({
    user_id: jobSeekerId,
    title: "Lowongan Baru untuk Anda! 🔔",
    message: `Ada lowongan baru "${jobTitle}" di ${companyName} yang sesuai dengan profil Anda. Match score: ${matchScore}%`,
    type: "info",
    link: `/job-seeker/jobs/${jobId}`,
  });
}

