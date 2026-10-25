import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { escapeHtml } from '../utils/storage';
import {
  ElectricPole,
  RouteOptimizationResult,
  WorkplaceDepot,
} from '../types/pole';
import { formatKm, formatVnd } from '../utils/calculations';
import {
  Compass,
  Crosshair,
  Layers,
  MapPin,
  Maximize2,
  Navigation,
  Search,
  Sparkles,
} from 'lucide-react';

interface MapContainerProps {
  depot: WorkplaceDepot;
  poles: ElectricPole[];
  selectedPoleId: string | null;
  onSelectPole: (poleId: string) => void;
  onMapClickLocation?: (lat: number, lng: number, addressSuggestion?: string) => void;
  routeResult: RouteOptimizationResult | null;
  isPickingLocation?: boolean;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  depot,
  poles,
  selectedPoleId,
  onSelectPole,
  onMapClickLocation,
  routeResult,
  isPickingLocation = false,
}) => {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapElementRef.current || mapInstanceRef.current) return;

    const map = L.map(mapElementRef.current, {
      center: [depot.lat, depot.lng],
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Recalculate Leaflet dimensions after a hidden mobile panel becomes visible.
  useEffect(() => {
    if (!mapElementRef.current) return;
    const observer = new ResizeObserver(() => mapInstanceRef.current?.invalidateSize());
    observer.observe(mapElementRef.current);
    return () => observer.disconnect();
  }, []);

  // Handle map click for manual location picking
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      if (!isPickingLocation) return;
      const { lat, lng } = e.latlng;
      let address = `Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'vi',
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.display_name) {
            address = data.display_name;
          }
        }
      } catch (err) {
        // Fallback to coordinates
      }

      if (onMapClickLocation) {
        onMapClickLocation(Number(lat.toFixed(6)), Number(lng.toFixed(6)), address);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [onMapClickLocation, isPickingLocation]);

  // Update Markers & Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Depot Marker
    const depotIcon = L.divIcon({
      className: 'custom-depot-pin',
      html: `
        <div style="background-color: #0f172a; color: white; width: 36px; height: 36px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 2px solid #38bdf8;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const depotMarker = L.marker([depot.lat, depot.lng], { icon: depotIcon })
      .bindPopup(`
        <div style="min-width: 220px; font-family: sans-serif; padding: 4px;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #0284c7; margin-bottom: 2px;">Điểm Xuất Phát / Trụ Sở</div>
          <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 4px;">${escapeHtml(depot.name)}</div>
          <div style="font-size: 12px; color: #475569; line-height: 1.4;">${escapeHtml(depot.address)}</div>
          <div style="margin-top: 8px; font-size: 11px; color: #64748b; font-family: monospace;">Tọa độ: ${depot.lat.toFixed(5)}, ${depot.lng.toFixed(5)}</div>
        </div>
      `);
    markersGroup.addLayer(depotMarker);

    // 2. Poles Markers
    poles.forEach((pole, index) => {
      const isSelected = pole.id === selectedPoleId;
      const isOffset = pole.crossarmType === 'offset';
      const isDouble = pole.poleStructure === 'double';

      let borderColor = '#2563eb';
      if (pole.voltageLevel === '110kV') borderColor = '#dc2626';
      else if (pole.voltageLevel === '35kV') borderColor = '#d97706';
      else if (pole.voltageLevel === '0.4kV') borderColor = '#16a34a';

      const poleIcon = L.divIcon({
        className: 'custom-pole-pin',
        html: `
          <div style="position: relative; width: 34px; height: 34px; border-radius: 9999px; background: white; border: 3px solid ${borderColor}; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; color: #0f172a; box-shadow: ${isSelected ? '0 0 0 4px #38bdf8' : '0 2px 4px rgba(0,0,0,0.2)'};">
            <span style="font-size: 11px; line-height: 1;">${index + 1}</span>
            <span style="font-size: 8px; color: #64748b; line-height: 1;">${pole.insulatorCount}sứ</span>
            ${
              isOffset
                ? `<div style="position: absolute; top: -4px; right: -4px; width: 12px; height: 12px; background: #e11d48; border-radius: 9999px; border: 1.5px solid white;" title="Cây đà lắp lệch"></div>`
                : ''
            }
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const poleMarker = L.marker([pole.lat, pole.lng], { icon: poleIcon })
        .on('click', () => {
          onSelectPole(pole.id);
        })
        .bindPopup(`
          <div style="min-width: 240px; font-family: sans-serif; padding: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: 700; font-size: 14px; color: #0f172a;">${escapeHtml(pole.code)}</span>
              <span style="font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; color: #334155;">${pole.voltageLevel}</span>
            </div>
            <div style="font-size: 12px; font-weight: 500; color: #334155; margin-bottom: 6px;">${escapeHtml(pole.name)}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">${escapeHtml(pole.address)}</div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #f8fafc; padding: 8px; border-radius: 6px; font-size: 11px; margin-bottom: 8px;">
              <div><strong>Số sứ:</strong> ${pole.insulatorCount} cục</div>
              <div><strong>Cây đà:</strong> ${isOffset ? '<span style="color:#e11d48">Đà lệch</span>' : 'Đà cân'}</div>
              <div><strong>Kết cấu:</strong> ${isDouble ? 'Trụ đôi' : pole.poleStructure === 'steel_tower' ? 'Tháp sắt' : 'Trụ đơn'}</div>
              <div><strong>Cự ly:</strong> ${formatKm(pole.distanceFromBaseKm)}</div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 6px;">
              <span style="font-size: 11px; color: #64748b;">Định mức bảo trì:</span>
              <span style="font-size: 13px; font-weight: 700; color: #0284c7; font-family: monospace;">${formatVnd(pole.maintenanceCostVnd)}</span>
            </div>
          </div>
        `);

      markersGroup.addLayer(poleMarker);
    });

    // 3. User Current GPS Marker (if located)
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-user-pin',
        html: `
          <div style="width: 20px; height: 20px; border-radius: 9999px; background: #2563eb; border: 3px solid white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.4);"></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      const userMarker = L.marker(userLocation, { icon: userIcon }).bindPopup(
        '<strong>Vị trí GPS hiện tại của bạn</strong>'
      );
      markersGroup.addLayer(userMarker);
    }

    // 4. Draw Route Polyline if routeResult is provided
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (routeResult && routeResult.legs.length > 0) {
      const latlngs: [number, number][] = [
        routeResult.legs[0].fromCoords,
        ...routeResult.legs.map(leg => leg.toCoords),
      ];

      const polyline = L.polyline(latlngs, {
        color: '#0284c7',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);

      routeLayerRef.current = polyline;
    }
  }, [depot, poles, selectedPoleId, userLocation, routeResult]);

  // Center on selected pole
  useEffect(() => {
    if (!selectedPoleId || !mapInstanceRef.current) return;
    const target = poles.find((p) => p.id === selectedPoleId);
    if (target) {
      mapInstanceRef.current.setView([target.lat, target.lng], 15, { animate: true });
    }
  }, [selectedPoleId, poles]);

  // Handle Search Location in Vietnam (Ấp, Xã, Huyện...)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    setIsSearching(true);
    setSearchMessage(null);

    try {
      const query = encodeURIComponent(`${searchQuery.trim()}, Vietnam`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=3&addressdetails=1`
      );
      const results = await response.json();

      if (results && results.length > 0) {
        const first = results[0];
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);

        mapInstanceRef.current.setView([lat, lon], 15, { animate: true });
        setSearchMessage(`Đã tìm thấy: ${first.display_name.slice(0, 50)}...`);

        if (onMapClickLocation) {
          onMapClickLocation(lat, lon, first.display_name);
        }
      } else {
        setSearchMessage('Không tìm thấy địa chỉ phù hợp. Bạn có thể bấm chọn trực tiếp trên bản đồ.');
      }
    } catch (err) {
      setSearchMessage('Lỗi tìm kiếm địa chỉ. Vui lòng bấm trực tiếp trên bản đồ.');
    } finally {
      setIsSearching(false);
    }
  };

  // Get current device GPS location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coords: [number, number] = [latitude, longitude];
        setUserLocation(coords);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(coords, 16, { animate: true });
        }

        // Auto reverse geocode
        let address = `Tọa độ: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`
          );
          if (resp.ok) {
            const data = await resp.json();
            if (data?.display_name) address = data.display_name;
          }
        } catch {
          // ignore
        }

        if (onMapClickLocation) {
          onMapClickLocation(Number(latitude.toFixed(6)), Number(longitude.toFixed(6)), address);
        }

        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        alert(`Không thể lấy tọa độ GPS: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Fit all markers in view
  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const allPoints: [number, number][] = [
      [depot.lat, depot.lng],
      ...poles.map((p) => [p.lat, p.lng] as [number, number]),
    ];

    if (userLocation) allPoints.push(userLocation);

    if (allPoints.length > 0) {
      map.fitBounds(allPoints, { padding: [40, 40], maxZoom: 16 });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
      {/* Top Floating Search & Quick Actions Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
        <form
          onSubmit={handleSearch}
          className="pointer-events-auto flex items-center bg-white/95 backdrop-blur-sm shadow-md rounded-lg border border-slate-200 overflow-hidden flex-1 max-w-md"
        >
          <div className="pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm ấp, xã, huyện, đường dây điện lực..."
            className="w-full px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="px-3 py-2 bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {isSearching ? 'Đang tìm...' : 'Tìm'}
          </button>
        </form>

        <div className="pointer-events-auto flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isLocating}
            title="Định vị GPS hiện tại"
            className="flex items-center gap-1 px-3 py-2 bg-white text-slate-700 hover:text-slate-900 text-xs font-medium rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
            <span className="hidden sm:inline">GPS hiện trường</span>
          </button>

          <button
            type="button"
            onClick={handleFitBounds}
            title="Xem toàn cảnh tuyến trụ"
            className="flex items-center gap-1 px-3 py-2 bg-white text-slate-700 hover:text-slate-900 text-xs font-medium rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Toàn cảnh</span>
          </button>
        </div>
      </div>

      {/* Picking Location Guide Overlay */}
      {isPickingLocation && (
        <div className="absolute top-16 left-3 right-3 z-20 pointer-events-none flex justify-center">
          <div className="bg-amber-500/95 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-md flex items-center gap-1.5 pointer-events-auto">
            <MapPin className="w-4 h-4 animate-bounce" />
            <span>Chế độ chọn vị trí: Bấm trực tiếp vào bất kỳ điểm nào trên bản đồ để ghim trụ</span>
          </div>
        </div>
      )}

      {/* Search Feedback Message */}
      {searchMessage && (
        <div className="absolute top-16 left-3 z-20 pointer-events-auto bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-lg shadow max-w-sm">
          {searchMessage}
        </div>
      )}

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-md border border-slate-200 text-[11px] text-slate-600 flex flex-col gap-1 pointer-events-auto">
        <div className="font-semibold text-slate-800 flex items-center gap-1 border-b border-slate-100 pb-1">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>Chú thích bản đồ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-900 border border-sky-400"></div>
          <span>Trụ sở Đội QLVH ({depot.name.slice(0, 18)}...)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center text-[7px] font-bold">1</div>
          <span>Trụ điện tuyến (Mã số & số sứ)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-600"></div>
          <span>Chấm đỏ: Cây đà lắp lệch (Offset)</span>
        </div>
        {routeResult && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-sky-700 font-medium">
            <Navigation className="w-3 h-3" />
            <span>Lộ trình tối ưu ({formatKm(routeResult.totalDistanceKm)})</span>
          </div>
        )}
      </div>

      {/* Map DOM Element */}
      <div ref={mapElementRef} className="w-full h-full" />
    </div>
  );
};
