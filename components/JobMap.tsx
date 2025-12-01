"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Job } from "../types/job";

interface JobMapProps {
  jobs: Job[];
  onJobSelect?: (job: Job) => void;
  height?: string;
  className?: string;
}

export function JobMap({ 
  jobs, 
  onJobSelect,
  height = "600px",
  className = "" 
}: JobMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerClusterGroupRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Dynamically import Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const leafletCSS = document.createElement("link");
          leafletCSS.rel = "stylesheet";
          leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          leafletCSS.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
          leafletCSS.crossOrigin = "";
          document.head.appendChild(leafletCSS);
        }

        // Dynamically import MarkerCluster CSS
        if (!document.querySelector('link[href*="MarkerCluster.css"]')) {
          const clusterCSS = document.createElement("link");
          clusterCSS.rel = "stylesheet";
          clusterCSS.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css";
          document.head.appendChild(clusterCSS);

          const clusterDefaultCSS = document.createElement("link");
          clusterDefaultCSS.rel = "stylesheet";
          clusterDefaultCSS.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css";
          document.head.appendChild(clusterDefaultCSS);
        }

        // Import Leaflet library
        const L = (await import("leaflet")).default;

        // Import MarkerCluster plugin
        await import("leaflet.markercluster");

        if (!mounted) return;

        // Fix Leaflet default icon issue in bundlers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        // Initialize map if not already initialized
        if (mapRef.current && !mapInstanceRef.current) {
          // Center on Indonesia
          const map = L.map(mapRef.current, {
            center: [-2.5489, 118.0149],
            zoom: 5,
            zoomControl: true,
            scrollWheelZoom: true,
            dragging: true,
            touchZoom: true,
          });

          // Add OpenStreetMap tile layer
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            minZoom: 3,
          }).addTo(map);

          mapInstanceRef.current = map;

          // Fix map rendering after initialization
          setTimeout(() => {
            if (mounted && map) {
              map.invalidateSize();
            }
          }, 100);
        }

        if (!mounted) return;

        // Add markers with clustering
        const map = mapInstanceRef.current;
        
        // Clear existing cluster group
        if (markerClusterGroupRef.current) {
          map.removeLayer(markerClusterGroupRef.current);
        }

        // Create marker cluster group
        const markers = (L as any).markerClusterGroup({
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          spiderfyOnMaxZoom: true,
          removeOutsideVisibleBounds: true,
          maxClusterRadius: 60,
          iconCreateFunction: function(cluster: any) {
            const count = cluster.getChildCount();
            let sizeClass = 'small';
            
            if (count >= 10) {
              sizeClass = 'large';
            } else if (count >= 5) {
              sizeClass = 'medium';
            }

            return L.divIcon({
              html: `<div class="cluster-marker cluster-${sizeClass}">${count}</div>`,
              className: 'custom-cluster-icon',
              iconSize: L.point(40, 40),
            });
          },
        });

        // Add markers for jobs with coordinates
        const jobsWithCoords = jobs.filter(job => job.coordinates);

        if (jobsWithCoords.length === 0) {
          setError("Tidak ada lowongan dengan koordinat lokasi");
          setIsLoading(false);
          return;
        }

        jobsWithCoords.forEach((job) => {
          if (!job.coordinates) return;

          const marker = L.marker([job.coordinates.lat, job.coordinates.lng]);

          // Create popup content
          const popupContent = `
            <div class="job-map-popup">
              <div class="popup-header">
                <img src="${job.logo}" alt="${job.company}" class="popup-logo" />
                <div class="popup-header-text">
                  <h3 class="popup-company">${job.company}</h3>
                  <h4 class="popup-title">${job.title}</h4>
                </div>
              </div>
              <div class="popup-location">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>${job.location}</span>
              </div>
              <div class="popup-info">
                <div class="popup-badge">${job.type}</div>
                <div class="popup-salary">${job.salary}</div>
              </div>
              <button class="popup-button" id="view-job-${job.id}">
                Lihat Detail Lowongan
              </button>
            </div>
          `;

          marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-job-popup',
          });

          // Add click handler for detail button
          marker.on('popupopen', () => {
            const button = document.getElementById(`view-job-${job.id}`);
            if (button && onJobSelect) {
              button.onclick = () => {
                onJobSelect(job);
              };
            }
          });

          markers.addLayer(marker);
        });

        // Add cluster group to map
        map.addLayer(markers);
        markerClusterGroupRef.current = markers;

        // Fit bounds to show all markers
        if (jobsWithCoords.length > 0) {
          const bounds = markers.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { 
              padding: [50, 50],
              maxZoom: 12,
            });
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error initializing map:", err);
        if (mounted) {
          setError("Gagal memuat peta. Silakan refresh halaman.");
          setIsLoading(false);
        }
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (markerClusterGroupRef.current) {
        markerClusterGroupRef.current.clearLayers();
        markerClusterGroupRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [jobs, onJobSelect]);

  return (
    <div className={`job-map-container ${className}`} style={{ height, position: 'relative' }}>
      {isLoading && (
        <div className="job-map-loading">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="mt-3 text-gray-600">Memuat peta...</p>
        </div>
      )}
      
      {error && (
        <div className="job-map-error">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div 
        ref={mapRef} 
        className="job-map"
        style={{ 
          width: '100%', 
          height: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
        }} 
      />

      {!isLoading && !error && (
        <div className="job-map-info">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>{jobs.filter(j => j.coordinates).length} lokasi lowongan</span>
        </div>
      )}
    </div>
  );
}
