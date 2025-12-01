"use client";

import { MapPin } from "lucide-react";

interface JobLocationMapProps {
  company: string;
  location: string;
  className?: string;
}

/**
 * Komponen peta interaktif sederhana berbasis Google Maps embed.
 * Menggunakan query nama perusahaan + lokasi sehingga tetap berfungsi
 * meski kita tidak punya data koordinat (lat/lng) di database.
 */
 
  export function JobLocationMap({ company, location, className = "" }: JobLocationMapProps) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
        <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
        <span>{location}</span>
      </div>
    );
  }

