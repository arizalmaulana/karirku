/**
 * Utility functions untuk format tanggal yang konsisten
 * Mencegah hydration mismatch antara server dan client
 */

const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const monthNamesShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

/**
 * Format tanggal ke format Indonesia yang konsisten
 * Format: DD Bulan YYYY (contoh: 15 Januari 2024)
 */
export function formatDateIndonesian(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
        return 'Tanggal tidak valid';
    }
    
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
}

/**
 * Format tanggal ke format Indonesia pendek
 * Format: DD Bulan YYYY (contoh: 15 Jan 2024)
 */
export function formatDateIndonesianShort(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
        return 'Tanggal tidak valid';
    }
    
    const day = date.getDate();
    const month = monthNamesShort[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
}

/**
 * Format tanggal dengan waktu
 * Format: DD Bulan YYYY, HH:MM (contoh: 15 Januari 2024, 14:30)
 */
export function formatDateTimeIndonesian(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
        return 'Tanggal tidak valid';
    }
    
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

/**
 * Format tanggal hanya hari dan bulan (tanpa tahun)
 * Format: DD Bulan (contoh: 15 Januari)
 */
export function formatDateDayMonth(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
        return 'Tanggal tidak valid';
    }
    
    const day = date.getDate();
    const month = monthNamesShort[date.getMonth()];
    
    return `${day} ${month}`;
}

