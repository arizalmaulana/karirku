'use client';

import React from "react";

interface JobLocationMapProps {
    company: string;
    location: string; // contoh: "Jakarta, Indonesia"
    className?: string;
}

/**
 * Komponen peta interaktif sederhana berbasis Google Maps embed.
 * Menggunakan query nama perusahaan + lokasi sehingga tetap berfungsi
 * meski kita tidak punya data koordinat (lat/lng) di database.
 */
export function JobLocationMap({ company, location, className }: JobLocationMapProps) {
    const query = encodeURIComponent(`${company} ${location}`);
    const src = `https://www.google.com/maps/embed/v1/search?key=YOUR_GOOGLE_MAPS_API_KEY&q=${query}`;

    return (
        <div className={className}>
        <div className="text-xs text-gray-500 mb-1">Lokasi perusahaan (perkiraan)</div>
        <div className="overflow-hidden rounded-xl border">
            <iframe
            title={`Lokasi ${company}`}
            src={src}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-48 w-full border-0"
            allowFullScreen
            />
        </div>
        </div>
    );
}


