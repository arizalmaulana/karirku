# Contoh Implementasi Fitur Lamaran

Dokumen ini berisi contoh implementasi untuk fitur-fitur lamaran yang telah dibuat.

## 📁 File-File yang Dibuat

### 1. Komponen Form Lamaran Enhanced
**File:** `components/job-seeker/ApplicationFormEnhanced.tsx`

**Fitur:**
- ✅ Save as Draft (manual dan auto-save setiap 30 detik)
- ✅ Load draft otomatis saat membuka form
- ✅ Validasi CV (max 5MB)
- ✅ Validasi Cover Letter (minimal 50 karakter)
- ✅ Counter karakter untuk cover letter
- ✅ Indikator draft tersimpan

**Cara Menggunakan:**

Ganti `ApplicationForm` dengan `ApplicationFormEnhanced` di file:
```typescript
// app/job-seeker/jobs/[id]/apply/page.tsx
import { ApplicationFormEnhanced } from "@/components/job-seeker/ApplicationFormEnhanced";

// Di dalam component:
<ApplicationFormEnhanced jobId={params.id} jobTitle={job.title} />
```

### 2. Komponen Withdraw Application
**File:** `components/job-seeker/WithdrawApplicationButton.tsx`

**Fitur:**
- ✅ Tarik lamaran dengan konfirmasi dialog
- ✅ Hanya bisa withdraw jika status masih `submitted` atau `review`
- ✅ Auto redirect setelah withdraw

**Cara Menggunakan:**

Tambahkan di halaman detail lamaran job seeker:
```typescript
// app/job-seeker/applications/[id]/page.tsx
import { WithdrawApplicationButton } from "@/components/job-seeker/WithdrawApplicationButton";

// Di dalam component, tambahkan:
<WithdrawApplicationButton 
    applicationId={application.id} 
    currentStatus={application.status} 
/>
```

### 3. Komponen Update Status Enhanced (Recruiter)
**File:** `components/recruiter/ApplicationStatusFormEnhanced.tsx`

**Fitur:**
- ✅ Form update status dengan notes/alasan
- ✅ Notes wajib untuk status `rejected` dan `interview`
- ✅ Notes opsional untuk status `accepted`
- ✅ Validasi sebelum submit

**Cara Menggunakan:**

Ganti `ApplicationStatusForm` dengan `ApplicationStatusFormEnhanced` di:
```typescript
// app/recruiter/applications/[id]/page.tsx
import { ApplicationStatusFormEnhanced } from "@/components/recruiter/ApplicationStatusFormEnhanced";

// Di dalam component:
<ApplicationStatusFormEnhanced
    applicationId={application.id}
    currentStatus={application.status}
    jobSeekerEmail={profile?.email}
/>
```

### 4. Komponen Timeline Tracking
**File:** `components/ApplicationTimeline.tsx`

**Fitur:**
- ✅ Visual timeline status lamaran
- ✅ Menampilkan status yang sudah dilalui
- ✅ Highlight status saat ini
- ✅ Menampilkan tanggal untuk setiap status

**Cara Menggunakan:**

Tambahkan di halaman detail lamaran:
```typescript
// app/job-seeker/applications/[id]/page.tsx
import { ApplicationTimeline } from "@/components/ApplicationTimeline";

// Di dalam component:
<Card>
    <CardHeader>
        <CardTitle>Timeline Status</CardTitle>
    </CardHeader>
    <CardContent>
        <ApplicationTimeline
            currentStatus={application.status}
            submittedAt={application.submitted_at}
            updatedAt={application.updated_at}
        />
    </CardContent>
</Card>
```

## 🔧 Implementasi Lengkap

### Contoh: Update Halaman Detail Lamaran Job Seeker

```typescript
// app/job-seeker/applications/[id]/page.tsx
import { ApplicationTimeline } from "@/components/ApplicationTimeline";
import { WithdrawApplicationButton } from "@/components/job-seeker/WithdrawApplicationButton";

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
    // ... existing code ...

    return (
        <div className="space-y-6">
            {/* ... existing header ... */}

            <div className="grid gap-6 lg:grid-cols-2">
                {/* ... existing cards ... */}

                {/* Tambahkan Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle>Timeline Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ApplicationTimeline
                            currentStatus={application.status}
                            submittedAt={application.submitted_at}
                            updatedAt={application.updated_at}
                        />
                    </CardContent>
                </Card>

                {/* Tambahkan Withdraw Button */}
                <Card>
                    <CardHeader>
                        <CardTitle>Aksi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <WithdrawApplicationButton 
                            applicationId={application.id} 
                            currentStatus={application.status} 
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
```

### Contoh: Update Halaman Apply dengan Form Enhanced

```typescript
// app/job-seeker/jobs/[id]/apply/page.tsx
import { ApplicationFormEnhanced } from "@/components/job-seeker/ApplicationFormEnhanced";

export default async function ApplyJobPage({ params }: { params: { id: string } }) {
    // ... existing code ...

    return (
        <div className="space-y-6">
            {/* ... existing header ... */}

            <Card>
                <CardHeader>
                    <CardTitle>Formulir Lamaran</CardTitle>
                    <CardDescription>
                        Lengkapi informasi berikut untuk melamar pekerjaan ini
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ApplicationFormEnhanced jobId={params.id} jobTitle={job.title} />
                </CardContent>
            </Card>
        </div>
    );
}
```

## 🗄️ Database Enhancement (Opsional)

Untuk menyimpan notes dari recruiter, bisa tambahkan field baru di tabel `applications`:

```sql
-- Tambah field notes untuk menyimpan catatan recruiter
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Tambah field rejection_reason untuk alasan penolakan
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Tambah field interview_date untuk jadwal interview
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS interview_date TIMESTAMPTZ;

-- Tambah field interview_location untuk lokasi interview
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS interview_location TEXT;
```

Kemudian update type di `lib/types.ts`:

```typescript
export interface Application {
    id: string;
    job_id: string;
    job_seeker_id: string;
    status: ApplicationStatus;
    cv_url: string | null;
    portfolio_url: string | null;
    cover_letter: string | null;
    notes: string | null; // Catatan dari recruiter
    rejection_reason: string | null; // Alasan penolakan
    interview_date: string | null; // Jadwal interview
    interview_location: string | null; // Lokasi interview
    submitted_at: string;
    updated_at: string;
}
```

## 🔔 Notifikasi Real-time

Untuk notifikasi real-time, bisa menggunakan Supabase Realtime. Contoh implementasi sudah ada di `ApplicationsPageClient.tsx` dengan subscription.

Untuk menambahkan toast notification saat status berubah:

```typescript
// Di ApplicationsPageClient.tsx, tambahkan:
useEffect(() => {
    const handleStatusUpdate = (event: CustomEvent) => {
        const { applicationId, status } = event.detail;
        toast.info(`Status lamaran berubah menjadi: ${getStatusLabel(status)}`);
        refreshApplications();
    };

    window.addEventListener("application-status-updated", handleStatusUpdate as EventListener);
    return () => {
        window.removeEventListener("application-status-updated", handleStatusUpdate as EventListener);
    };
}, []);
```

## 📊 Analytics Dashboard (Opsional)

Untuk membuat analytics dashboard untuk recruiter, bisa buat component baru:

```typescript
// components/recruiter/ApplicationAnalytics.tsx
'use client';

export function ApplicationAnalytics({ applications }: { applications: any[] }) {
    const stats = useMemo(() => {
        return {
            total: applications.length,
            byStatus: {
                submitted: applications.filter(a => a.status === 'submitted').length,
                review: applications.filter(a => a.status === 'review').length,
                interview: applications.filter(a => a.status === 'interview').length,
                accepted: applications.filter(a => a.status === 'accepted').length,
                rejected: applications.filter(a => a.status === 'rejected').length,
            },
            acceptanceRate: applications.length > 0 
                ? (applications.filter(a => a.status === 'accepted').length / applications.length * 100).toFixed(1)
                : 0,
        };
    }, [applications]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Statistik cards */}
        </div>
    );
}
```

## ✅ Checklist Implementasi

- [x] Form lamaran dengan save draft
- [x] Withdraw application
- [x] Update status dengan notes
- [x] Timeline tracking
- [ ] Email notifications (TODO)
- [ ] Analytics dashboard (TODO)
- [ ] Export data (TODO)
- [ ] Bulk actions (TODO)

## 🚀 Next Steps

1. **Integrasikan komponen-komponen baru** ke halaman yang sesuai
2. **Update database schema** jika perlu (untuk notes, interview_date, dll)
3. **Test semua fitur** dengan berbagai skenario
4. **Tambahkan email notifications** menggunakan Supabase Edge Functions atau service email
5. **Buat analytics dashboard** untuk recruiter
6. **Implementasi export data** (CSV/PDF)

## 📝 Catatan Penting

1. **RLS Policies**: Pastikan RLS policies sudah benar untuk semua operasi
2. **Validasi**: Semua input harus divalidasi di client dan server
3. **Error Handling**: Handle semua error dengan baik dan berikan feedback ke user
4. **Performance**: Gunakan pagination untuk daftar yang panjang
5. **Security**: Jangan expose data sensitif, pastikan ownership validation

