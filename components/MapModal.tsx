"use client";

import { useEffect, useRef, useState } from "react";
import { X, MapPin, Building2, Wallet, Home, Search, Filter, SlidersHorizontal, List, MapIcon, ChevronRight, Briefcase } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { Job } from "../types/job";

interface MapModalProps {
  jobs: Job[];
  open: boolean;
  onClose: () => void;
  onJobSelect: (job: Job) => void;
}

export function MapModal({ jobs, open, onClose, onJobSelect }: MapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const markerClusterGroupRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);

  // Filter jobs based on search and filters
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation =
      selectedLocation === "all" || job.location.includes(selectedLocation);

    const matchesType =
      selectedType === "all" || job.type === selectedType;

    const matchesCategory =
      selectedCategory === "all" || job.category === selectedCategory;

    return matchesSearch && matchesLocation && matchesType && matchesCategory;
  });

  // Get unique locations
  const locations = Array.from(new Set(jobs.map(j => j.location.split(',')[0].trim())));
  const types = Array.from(new Set(jobs.map(j => j.type)));
  const categories = Array.from(new Set(jobs.map(j => j.category)));

  useEffect(() => {
    if (!open) return;

    const loadMap = async () => {
      setIsLoading(true);
      
      // Import Leaflet CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      // Import MarkerCluster CSS
      const clusterCSS = document.createElement("link");
      clusterCSS.rel = "stylesheet";
      clusterCSS.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css";
      document.head.appendChild(clusterCSS);

      const clusterDefaultCSS = document.createElement("link");
      clusterDefaultCSS.rel = "stylesheet";
      clusterDefaultCSS.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css";
      document.head.appendChild(clusterDefaultCSS);

      // Import Leaflet JS
      const L = (await import("leaflet")).default;

      // Import MarkerCluster plugin
      await import("leaflet.markercluster");

      // Fix default icon issue with Leaflet in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (mapRef.current && !mapInstanceRef.current) {
        // Initialize map centered on Indonesia
        const map = L.map(mapRef.current).setView([-2.5489, 118.0149], 5);

        // Add tile layer with better styling
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        setIsLoading(false);

        // Timeout to ensure map renders properly
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      }
    };

    loadMap();

    return () => {
      if (markerClusterGroupRef.current) {
        markerClusterGroupRef.current.clearLayers();
        markerClusterGroupRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [open]);

  // Update markers when filtered jobs change
  useEffect(() => {
    if (!mapInstanceRef.current || !open) return;

    const updateMarkers = async () => {
      const L = (await import("leaflet")).default;

      // Clear existing markers
      if (markerClusterGroupRef.current) {
        mapInstanceRef.current.removeLayer(markerClusterGroupRef.current);
      }

      // Create custom cluster icon
      const markers = (L as any).markerClusterGroup({
        iconCreateFunction: function(cluster: any) {
          const count = cluster.getChildCount();
          let size = 'small';
          let colorClass = 'bg-blue-500';
          
          if (count > 10) {
            size = 'large';
            colorClass = 'bg-purple-600';
          } else if (count > 5) {
            size = 'medium';
            colorClass = 'bg-indigo-600';
          }

          return L.divIcon({
            html: `<div class="cluster-marker ${colorClass}" style="
              width: ${size === 'large' ? '50px' : size === 'medium' ? '45px' : '40px'};
              height: ${size === 'large' ? '50px' : size === 'medium' ? '45px' : '40px'};
              background: ${size === 'large' ? '#9333ea' : size === 'medium' ? '#4f46e5' : '#3b82f6'};
              border: 3px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: ${size === 'large' ? '16px' : '14px'};
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              cursor: pointer;
              transition: transform 0.2s;
            ">
              ${count}
            </div>`,
            className: 'custom-cluster-icon',
            iconSize: L.point(50, 50),
          });
        },
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 80,
      });

      // Add markers for filtered jobs with coordinates
      const jobsWithCoordinates = filteredJobs.filter((job) => job.coordinates);

      jobsWithCoordinates.forEach((job) => {
        if (job.coordinates) {
          // Create custom marker icon based on job category
          const iconColor = 
            job.category === 'Technology' ? '#3b82f6' :
            job.category === 'Design' ? '#ec4899' :
            job.category === 'Marketing' ? '#f59e0b' :
            job.category === 'Business' ? '#10b981' : '#6366f1';

          const customIcon = L.divIcon({
            html: `<div style="
              background: ${iconColor};
              width: 30px;
              height: 30px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            ">
              <div style="
                transform: rotate(45deg);
                color: white;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                margin-top: -3px;
              ">💼</div>
            </div>`,
            className: 'custom-marker-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
          });

          const marker = L.marker([job.coordinates.lat, job.coordinates.lng], {
            icon: customIcon
          });

          // Create custom popup content
          const popupContent = `
            <div style="min-width: 300px; font-family: system-ui, -apple-system, sans-serif;">
              <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb;">
                <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 8px;">
                  <img src="${job.logo}" alt="${job.company}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover;" />
                  <div style="flex: 1;">
                    <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 4px 0; color: #111827;">${job.title}</h3>
                    <p style="font-size: 14px; margin: 0; color: #6b7280; font-weight: 500;">${job.company}</p>
                  </div>
                </div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <span style="
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 10px;
                    background: #dbeafe;
                    color: #1e40af;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                  ">${job.type}</span>
                  <span style="
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 10px;
                    background: #e0e7ff;
                    color: #4338ca;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                  ">${job.category}</span>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px;">
                <div style="display: flex; align-items: center; gap: 10px; font-size: 14px; color: #374151;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span style="font-weight: 500;">${job.location}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; font-size: 14px; color: #374151;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  <span style="font-weight: 600; color: #10b981;">${job.salary}</span>
                </div>
                ${job.costOfLiving ? `
                  <div style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: #6b7280; padding: 8px; background: #f9fafb; border-radius: 6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <span>💰 Biaya hidup: <strong>${job.costOfLiving}</strong></span>
                  </div>
                ` : ''}
              </div>
              <button 
                id="view-job-${job.id}" 
                style="
                  width: 100%;
                  padding: 10px 16px;
                  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                  color: white;
                  border: none;
                  border-radius: 8px;
                  font-size: 14px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.3s;
                  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                "
                onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.4)'"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(59, 130, 246, 0.3)'"
              >
                👀 Lihat Detail Pekerjaan
              </button>
            </div>
          `;

          marker.bindPopup(popupContent, {
            maxWidth: 350,
            className: "custom-popup",
          });

          // Add click listener to the button inside popup
          marker.on("popupopen", () => {
            const button = document.getElementById(`view-job-${job.id}`);
            if (button) {
              button.addEventListener("click", () => {
                onJobSelect(job);
                onClose();
              });
            }
          });

          // Highlight marker on hover
          marker.on("mouseover", () => {
            setHoveredJobId(job.id);
          });

          marker.on("mouseout", () => {
            setHoveredJobId(null);
          });

          markers.addLayer(marker);
        }
      });

      markerClusterGroupRef.current = markers;
      mapInstanceRef.current.addLayer(markers);

      // Fit bounds to show all markers if there are any
      if (jobsWithCoordinates.length > 0) {
        const bounds = markers.getBounds();
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    };

    updateMarkers();
  }, [filteredJobs, open, onJobSelect, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex">
      <div className="relative w-full h-full bg-white flex">
        {/* Sidebar */}
        <div 
          className={`
            absolute lg:relative z-20 top-0 left-0 h-full bg-white border-r shadow-xl
            transition-all duration-300 ease-in-out
            ${showSidebar ? 'w-full sm:w-96' : 'w-0'}
            overflow-hidden
          `}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <List className="w-5 h-5" />
                  <h3 className="font-semibold">Daftar Lowongan</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(false)}
                  className="lg:hidden text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Cari posisi atau perusahaan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/90 border-0 focus-visible:ring-2 focus-visible:ring-white/50"
                />
              </div>

              {/* Filter Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full mt-2 text-white hover:bg-white/20 justify-start"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                {showFilters ? 'Sembunyikan' : 'Tampilkan'} Filter
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="p-4 border-b bg-gray-50 space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Lokasi</label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Semua Lokasi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Lokasi</SelectItem>
                      {locations.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Tipe Pekerjaan</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Semua Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tipe</SelectItem>
                      {types.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Kategori</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(selectedLocation !== 'all' || selectedType !== 'all' || selectedCategory !== 'all' || searchQuery) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedLocation('all');
                      setSelectedType('all');
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    className="w-full"
                  >
                    Reset Filter
                  </Button>
                )}
              </div>
            )}

            {/* Job List */}
            <div className="flex-1 overflow-hidden">
              <div className="p-3 bg-gray-50 border-b">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-indigo-600">{filteredJobs.length}</span> lowongan ditemukan
                </p>
              </div>
              <ScrollArea className="h-[calc(100%-40px)]">
                <div className="p-3 space-y-2">
                  {filteredJobs.filter(j => j.coordinates).map((job) => (
                    <div
                      key={job.id}
                      onClick={() => {
                        onJobSelect(job);
                        onClose();
                      }}
                      onMouseEnter={() => setHoveredJobId(job.id)}
                      onMouseLeave={() => setHoveredJobId(null)}
                      className={`
                        p-3 rounded-lg border-2 cursor-pointer transition-all
                        ${hoveredJobId === job.id 
                          ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                          : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow'
                        }
                      `}
                    >
                      <div className="flex gap-3">
                        <img 
                          src={job.logo} 
                          alt={job.company} 
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                            {job.title}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2 truncate">{job.company}</p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {job.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {job.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{job.location}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  ))}

                  {filteredJobs.filter(j => j.coordinates).length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 text-sm">Tidak ada lowongan ditemukan</p>
                      <p className="text-gray-500 text-xs mt-1">Coba ubah filter pencarian</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-b shadow-sm">
            <div className="px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {!showSidebar && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSidebar(true)}
                    className="flex-shrink-0"
                  >
                    <List className="w-5 h-5" />
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <MapIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <h2 className="text-gray-900 text-lg leading-tight">Peta Lowongan Kerja</h2>
                    <p className="text-gray-600 text-xs">
                      {filteredJobs.filter(j => j.coordinates).length} lokasi lowongan di Indonesia
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-gray-100 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Map */}
          <div className="w-full h-full pt-[73px]">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 z-10">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-700 font-medium">Memuat peta interaktif...</p>
                  <p className="text-gray-500 text-sm mt-1">Mohon tunggu sebentar</p>
                </div>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" />
          </div>

          {/* Legend */}
          <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 max-w-xs border hidden md:block">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              Panduan Peta
            </h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  5
                </div>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">Cluster marker</span> - Klik untuk zoom
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 flex-shrink-0">
                  <div className="absolute w-6 h-6 bg-blue-500 rounded-full rotate-45 border-2 border-white shadow-md" style={{ borderRadius: '50% 50% 50% 0' }}></div>
                </div>
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">Marker</span> - Klik untuk detail lowongan
                </p>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Tech</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Design</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Marketing</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Business</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Stats */}
          <div className="absolute top-20 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 md:hidden">
            <p className="text-xs text-gray-600">
              <span className="font-bold text-indigo-600">{filteredJobs.filter(j => j.coordinates).length}</span> lowongan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}