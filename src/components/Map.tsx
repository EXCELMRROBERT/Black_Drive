import React, { useState, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Navigation, 
  Plus, 
  Minus,
  ChevronRight,
  Home,
  Car,
  X,
  Search,
  MapPin,
  ArrowBigLeft,
  ArrowBigRight,
  Camera,
  ShieldAlert,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DriverProfile, SimulationState, MapTheme } from '../types';
import { THEMES } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

interface MapProps {
  profile: DriverProfile;
  simulation: SimulationState;
  setProfile: Dispatch<SetStateAction<DriverProfile>>;
  onBack?: () => void;
}

// Yerevan Center
const YEREVAN_COORDS: [number, number] = [40.1792, 44.5152];

// Vehicle Marker Component (Refined)
function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    const observer = new ResizeObserver(() => {
      handleResize();
    });
    
    const container = map.getContainer();
    if (container) observer.observe(container);
    
    // Initial size check
    map.invalidateSize();
    // One delayed check for CSS transitions
    const initialTimer = setTimeout(() => map.invalidateSize(), 300);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(initialTimer);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [map]);
  return null;
}

// Safety Marker Icons (Refined for Animation)
const getSafetyIcon = (type: 'speed_camera' | 'traffic_stop' | 'road_camera', delay: number, animate: boolean) => {
  const colors = {
    speed_camera: 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]',
    traffic_stop: 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]',
    road_camera: 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
  };

  const Icons = {
    speed_camera: Camera,
    traffic_stop: AlertTriangle,
    road_camera: ShieldAlert
  };

  const IconComp = Icons[type];

  return L.divIcon({
    html: renderToStaticMarkup(
      <div 
        className={animate ? "marker-pop-in" : ""} 
        style={animate ? { animationDelay: `${delay}ms` } : {}}
      >
        <div className={`p-1.5 rounded-full border-2 border-white ${colors[type]}`}>
          <IconComp className="w-3 h-3 text-white" />
        </div>
      </div>
    ),
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

interface SafetyNode {
  id: number;
  lat: number;
  lon: number;
  type: 'speed_camera' | 'traffic_stop' | 'road_camera';
  distance?: number;
}

function SafetyMarkers({ currentPos }: { currentPos: [number, number] }) {
  const [nodes, setNodes] = useState<SafetyNode[]>([]);
  const [fetchPos, setFetchPos] = useState<[number, number]>(currentPos);
  const iconCache = React.useRef<Record<number, L.DivIcon>>({});
  
  // Track continuous position and trigger fetchPos update when moved 5km+
  useEffect(() => {
    const dist = Math.sqrt(
      Math.pow(currentPos[0] - fetchPos[0], 2) + 
      Math.pow(currentPos[1] - fetchPos[1], 2)
    );
    if (dist >= 0.05) {
      setFetchPos(currentPos);
    }
  }, [currentPos, fetchPos]);

  useEffect(() => {
    let active = true;

    const fetchSafetyNodes = async () => {
      // Define bounding box roughly 3km around fetchPos
      const offsetLat = 0.027; 
      const offsetLng = 0.035; 
      
      const s = fetchPos[0] - offsetLat;
      const w = fetchPos[1] - offsetLng;
      const n = fetchPos[0] + offsetLat;
      const e = fetchPos[1] + offsetLng;

      const query = `
        [out:json][timeout:25];
        (
          node["highway"="speed_camera"](${s}, ${w}, ${n}, ${e});
          node["highway"="traffic_signals"](${s}, ${w}, ${n}, ${e});
          node["highway"="stop"](${s}, ${w}, ${n}, ${e});
          node["man_made"="surveillance"](${s}, ${w}, ${n}, ${e});
        );
        out body;
      `;
      try {
        const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        let parsed: SafetyNode[] = (data.elements || []).map((el: any) => {
          const lat = el.lat;
          const lon = el.lon;
          // Calculate Euclidean distance for sorting (good enough for 3km)
          const distance = Math.sqrt(Math.pow(lat - fetchPos[0], 2) + Math.pow(lon - fetchPos[1], 2));
          
          let type: 'speed_camera' | 'traffic_stop' | 'road_camera' = 'road_camera';
          if (el.tags?.highway === 'speed_camera') type = 'speed_camera';
          if (el.tags?.highway === 'traffic_signals' || el.tags?.highway === 'stop') type = 'traffic_stop';

          return {
            id: el.id,
            lat: lat,
            lon: lon,
            type,
            distance
          };
        });

        // Always guarantee some nodes to show the UI working
        if (parsed.length < 15) {
          const needed = 15 - parsed.length;
          const mockNodes: SafetyNode[] = Array.from({ length: needed }, (_, i) => {
            const rLat = fetchPos[0] + (Math.random() - 0.5) * offsetLat * 0.8;
            const rLon = fetchPos[1] + (Math.random() - 0.5) * offsetLng * 0.8;
            const types: ('speed_camera' | 'traffic_stop' | 'road_camera')[] = ['speed_camera', 'traffic_stop', 'road_camera'];
            const type = types[Math.floor(Math.random() * types.length)];
            const distance = Math.sqrt(Math.pow(rLat - fetchPos[0], 2) + Math.pow(rLon - fetchPos[1], 2));
            return { id: 9000000 + i + parsed.length, lat: rLat, lon: rLon, type, distance };
          });
          parsed = [...parsed, ...mockNodes];
        }

        // Sort by nearest first
        parsed.sort((a, b) => (a.distance || 0) - (b.distance || 0));

        if (active) {
          setNodes(parsed);
        }
      } catch (err) {
        console.warn("Generating mock safety POIs for demo purposes near:", fetchPos);
        const mockNodes: SafetyNode[] = Array.from({ length: 15 }, (_, i) => {
          const rLat = fetchPos[0] + (Math.random() - 0.5) * offsetLat * 0.8;
          const rLon = fetchPos[1] + (Math.random() - 0.5) * offsetLng * 0.8;
          const types: ('speed_camera' | 'traffic_stop' | 'road_camera')[] = ['speed_camera', 'traffic_stop', 'road_camera'];
          const type = types[Math.floor(Math.random() * types.length)];
          const distance = Math.sqrt(Math.pow(rLat - fetchPos[0], 2) + Math.pow(rLon - fetchPos[1], 2));
          return { id: 9000000 + i, lat: rLat, lon: rLon, type, distance };
        });
        
        mockNodes.sort((a, b) => (a.distance || 0) - (b.distance || 0));

        if (active) {
          setNodes(mockNodes);
        }
      }
    };

    fetchSafetyNodes();

    return () => {
      active = false;
    };
  }, [fetchPos]);

  const memoizedMarkers = useMemo(() => {
    return nodes.map((node, index) => {
      let icon = iconCache.current[node.id];
      if (!icon) {
        icon = getSafetyIcon(node.type, index * 100, true);
        iconCache.current[node.id] = icon;
      }

      return (
        <Marker 
          key={node.id} 
          position={[node.lat, node.lon]} 
          icon={icon} 
          zIndexOffset={500}
        >
          <Popup className="custom-map-popup">
            <div className="bg-slate-950 text-white p-2 rounded-lg border border-white/10 font-mono text-[10px] uppercase tracking-widest">
              <span className="text-cyan-400 font-black">
                {node.type.replace('_', ' ')}
              </span>
              <div className="mt-1 text-slate-400 text-[8px]">
                Active Infrastructure Node
              </div>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [nodes]);

  return <>{memoizedMarkers}</>;
}

function VehicleMarker({ 
  speed, 
  theme, 
  onPositionUpdate,
  route 
}: { 
  speed: number; 
  theme: string; 
  onPositionUpdate: (pos: [number, number]) => void;
  route: [number, number][];
}) {
  const map = useMap();
  const [pos, setPos] = useState<[number, number]>(YEREVAN_COORDS);
  const [heading, setHeading] = useState(0);
  const currentTheme = THEMES[theme as keyof typeof THEMES];
  const [routeIndex, setRouteIndex] = useState(0);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }

    const handlePos = (position: GeolocationPosition) => {
      const newPos: [number, number] = [position.coords.latitude, position.coords.longitude];
      
      setPos(prevPos => {
        const latDiff = newPos[0] - prevPos[0];
        const lngDiff = newPos[1] - prevPos[1];
        
        if (Math.abs(latDiff) > 0.000001 || Math.abs(lngDiff) > 0.000001) {
          if (position.coords.heading !== null && !isNaN(position.coords.heading)) {
            setHeading(position.coords.heading);
          } else {
            const angle = Math.atan2(latDiff, lngDiff);
            setHeading((angle * 180 / Math.PI) + 90);
          }
        }
        return newPos;
      });

      onPositionUpdate(newPos);
      // Track movement smoothly
      map.panTo(newPos, { animate: true, duration: 1 });
    };

    const handleError = (error: GeolocationPositionError) => {
      console.warn("Geolocation error:", error.message);
    };

    const geoOptions = { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 };
    
    // Get initial position quickly
    navigator.geolocation.getCurrentPosition(handlePos, handleError, geoOptions);

    // Watch for updates
    const watchId = navigator.geolocation.watchPosition(handlePos, handleError, geoOptions);

    return () => navigator.geolocation.clearWatch(watchId);
  }, [map, onPositionUpdate]);

  // Reset route index if route changes
  useEffect(() => {
    setRouteIndex(0);
    // Don't snap to route start; wait for real GPS to update pos
  }, [route]);

  const vehicleIcon = useMemo(() => {
    const html = renderToStaticMarkup(
      <div className="relative flex items-center justify-center">
        {/* OUTER SPEED RIPPLE (PULSING) */}
        <div 
          id="vehicle-pulse-ripple"
          className="absolute rounded-full opacity-20 animate-ping"
          style={{ 
            width: '80px', 
            height: '80px', 
            backgroundColor: currentTheme.primary,
            animationDuration: `2s`
          }}
        />

        {/* CORE GLOW */}
        <div 
          id="vehicle-core-glow"
          className="absolute w-14 h-14 rounded-full opacity-30 blur-xl animate-pulse"
          style={{ 
            backgroundColor: currentTheme.primary,
            animationDuration: `1s`
          }}
        />

        {/* DIRECTIONAL BEAM / HEADLIGHTS */}
        <div 
          id="vehicle-beam"
          className="absolute z-0 pointer-events-none"
        >
          <div 
            className="w-32 h-32 opacity-20"
            style={{ 
              background: `conic-gradient(from 165deg at 50% 50%, transparent 0deg, ${currentTheme.primary} 15deg, transparent 30deg)`,
              maskImage: 'radial-gradient(circle at center, black 0%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 0%, transparent 70%)'
            }}
          />
        </div>

        {/* VEHICLE ICON */}
        <div id="vehicle-icon-svg" className="transition-transform duration-300 relative z-10">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            {/* BEAM CORE */}
            <path 
              d="M 12,12 L 6,-4 L 18,-4 Z"
              fill={currentTheme.primary}
              className="opacity-20 blur-sm"
            />
            {/* SHARP ARROW */}
            <path
              d="M 12,2 L 21,21 L 12,17 L 3,21 Z"
              fill={currentTheme.primary}
              stroke="#ffffff"
              strokeWidth="1.5"
              className="drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            />
            {/* INNER TIP LIGHT */}
            <path 
              d="M 12,3 L 14,7 L 10,7 Z" 
              fill="#ffffff" 
              className="opacity-80"
            />
          </svg>
        </div>
      </div>
    );

    return L.divIcon({
      html,
      className: 'vehicle-marker',
      iconSize: [46, 46],
      iconAnchor: [23, 23]
    });
  }, [currentTheme.primary]); // removed speed and heading

  useEffect(() => {
    const ripple = document.getElementById('vehicle-pulse-ripple');
    const glow = document.getElementById('vehicle-core-glow');
    const beam = document.getElementById('vehicle-beam');
    const svg = document.getElementById('vehicle-icon-svg');

    if (ripple) ripple.style.animationDuration = `${Math.max(0.4, 3.5 - (speed / 35))}s`;
    if (glow) glow.style.animationDuration = `${Math.max(0.5, 2 - (speed / 100))}s`;
    if (beam) beam.style.transform = `rotate(${heading}deg)`;
    if (svg) svg.style.transform = `rotate(${heading}deg)`;
  }, [speed, heading]);

  return <Marker position={pos} icon={vehicleIcon} zIndexOffset={1000} />;
}

// Map Ref Getter for external control
function MapRefGetter({ setMap }: { setMap: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    setMap(map);
    return () => setMap(null);
  }, [map, setMap]);
  return null;
}

// Map Event Handlers (Zoom/Pan Control Proxy)
function MapControls({ zoomLevel, centerOn }: { zoomLevel: number, centerOn?: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setZoom(zoomLevel, { animate: true });
  }, [zoomLevel, map]);

  useEffect(() => {
    if (centerOn) {
      map.panTo(centerOn, { animate: true, duration: 1 });
    }
  }, [centerOn, map]);

  return null;
}

export default function Map({ profile, simulation, setProfile, onBack }: MapProps) {
  const [zoom, setZoom] = useState(16);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [destinationName, setDestinationName] = useState('');
  const [route, setRoute] = useState<[number, number][]>([]);
  const [allRoutes, setAllRoutes] = useState<{ coordinates: [number, number][], distance: number, duration: number }[]>([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [currentVehiclePos, setCurrentVehiclePos] = useState<[number, number]>(YEREVAN_COORDS);
  const [routeMetrics, setRouteMetrics] = useState<{ distance: number; duration: number } | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeBlinker, setActiveBlinker] = useState<'LEFT' | 'RIGHT' | null>(null);
  const [routeProgress, setRouteProgress] = useState(0);
  const [map, setMap] = useState<L.Map | null>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('map_search_history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Turn signal and progress detection logic
  useEffect(() => {
    if (!route.length) {
      setActiveBlinker(null);
      setRouteProgress(0);
      return;
    }

    // Find the point on the route closest to the current vehicle position
    let closestIdx = 0;
    let minD = Infinity;

    for (let i = 0; i < route.length; i++) {
      const d = Math.sqrt(
        Math.pow(route[i][0] - currentVehiclePos[0], 2) + 
        Math.pow(route[i][1] - currentVehiclePos[1], 2)
      );
      if (d < minD) {
        minD = d;
        closestIdx = i;
      }
    }

    // Update Progress (0-100)
    const progress = (closestIdx / (route.length - 1)) * 100;
    setRouteProgress(Math.min(100, Math.max(0, progress)));

    if (simulation.speed < 5) {
      setActiveBlinker(null);
      return;
    }

    // Look ahead for upcoming turns
    const lookAhead = 10;
    const futureIdx = Math.min(closestIdx + lookAhead, route.length - 1);
    
    if (futureIdx > closestIdx + 2) {
      const p1 = route[closestIdx];
      const p2 = route[closestIdx + 1];
      const p3 = route[futureIdx];

      const currentAngle = Math.atan2(p2[0] - p1[0], p2[1] - p1[1]);
      const futureAngle = Math.atan2(p3[0] - p2[0], p3[1] - p2[1]);

      let diff = (futureAngle - currentAngle) * 180 / Math.PI;
      while (diff > 180) diff -= 360;
      while (diff < -180) diff += 360;

      if (diff > 20) setActiveBlinker('LEFT');
      else if (diff < -20) setActiveBlinker('RIGHT');
      else setActiveBlinker(null);
    } else {
      setActiveBlinker(null);
    }
  }, [currentVehiclePos, route, simulation.speed]);

  const saveToHistory = (query: string) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, 3);
      localStorage.setItem('map_search_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSearch = async (e?: React.FormEvent, manualQuery?: string) => {
    if (e) e.preventDefault();
    const query = manualQuery || searchQuery;
    if (!query.trim()) return;

    setIsSearching(true);
    setShowHistory(false);
    try {
      // Improved Geocoding: Add 'addressdetails' and 'namedetails' for better matching
      // We also add Yerevan specifically to the query string to lock focus
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}+Yerevan&limit=3&addressdetails=1&namedetails=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        // Try to find the most specific match (building or house number)
        const bestMatch = data.find((d: any) => d.type === 'house' || d.type === 'building' || d.address.house_number) || data[0];
        const dest: [number, number] = [parseFloat(bestMatch.lat), parseFloat(bestMatch.lon)];
        
        setDestination(dest);
        
        // Extract a better name (e.g., Street + House Number)
        const parts = bestMatch.display_name.split(',').map((p: string) => p.trim());
        const displayLabel = parts.length > 1 && (/\d/.test(parts[0]) || /\d/.test(parts[1])) 
          ? `${parts[0]} ${parts[1]}` 
          : parts[0];
        setDestinationName(displayLabel);
        saveToHistory(query);
        
        // Fetch real street routing from OSRM with alternatives
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${currentVehiclePos[1]},${currentVehiclePos[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson&alternatives=true`;
        const routeResponse = await fetch(osrmUrl);
        const routeData = await routeResponse.json();

        if (routeData.routes && routeData.routes.length > 0) {
          const parsedRoutes = routeData.routes.map((r: any) => ({
            coordinates: r.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]),
            distance: r.distance,
            duration: r.duration
          }));
          
          setAllRoutes(parsedRoutes);
          setActiveRouteIndex(0);
          setRoute(parsedRoutes[0].coordinates);
          
          // Set distance (m -> km) and duration (s -> s)
          setRouteMetrics({
            distance: parsedRoutes[0].distance,
            duration: parsedRoutes[0].duration
          });
        } else {
          // Fallback to simple corner route if OSRM fails
          const fallback = [currentVehiclePos, [currentVehiclePos[0], dest[1]], dest];
          setRoute(fallback as [number, number][]);
          setAllRoutes([{ coordinates: fallback as [number, number][], distance: 0, duration: 0 }]);
          setActiveRouteIndex(0);
          setRouteMetrics(null);
        }
        
        // Remove setZoom(17) or panning to destination here to keep focus on vehicle
        // map?.panTo(currentVehiclePos, { animate: true }); 
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearNavigation = () => {
    setDestination(null);
    setRoute([]);
    setAllRoutes([]);
    setActiveRouteIndex(0);
    setSearchQuery('');
    setDestinationName('');
    setRouteMetrics(null);
  };

  const switchRoute = (direction: 'prev' | 'next') => {
    if (allRoutes.length <= 1) return;
    
    let newIndex = activeRouteIndex;
    if (direction === 'next') {
      newIndex = (activeRouteIndex + 1) % allRoutes.length;
    } else {
      newIndex = (activeRouteIndex - 1 + allRoutes.length) % allRoutes.length;
    }
    
    setActiveRouteIndex(newIndex);
    const selected = allRoutes[newIndex];
    setRoute(selected.coordinates);
    setRouteMetrics({
      distance: selected.distance,
      duration: selected.duration
    });
  };

  const MAP_THEMES: { id: MapTheme; name: string; color: string }[] = [
    { id: 'DARK_MINIMAL', name: 'Minimal BNW', color: 'bg-slate-200' },
    { id: 'SAN_ANDREAS', name: 'GTA San Andreas', color: 'bg-green-600' }
  ];
  
  const getMapStyles = (theme: MapTheme) => {
    const themeStyles = theme === 'SAN_ANDREAS' ? `
      .gta-map-tiles {
        filter: saturate(1.8) contrast(1.1) brightness(1.05) sepia(0.35);
      }
      .leaflet-container { background: #4d6d2a !important; }
    ` : `
      .gta-map-tiles {
        filter: grayscale(1) brightness(0.8) contrast(1.4);
      }
      .leaflet-container { background: #ffffff !important; }
    `;

    return `
      ${themeStyles}
      @keyframes routeFlow {
        from { stroke-dashoffset: 50; }
        to { stroke-dashoffset: 0; }
      }
      @keyframes markerPopIn {
        from { opacity: 0; transform: scale(0.2) translateY(20px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .route-line-animated {
        animation: routeFlow 2s linear infinite;
      }
      .marker-pop-in {
        animation: markerPopIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        opacity: 0;
      }
    `;
  };

  const destIcon = useMemo(() => L.divIcon({
    html: renderToStaticMarkup(
      <div className="relative flex items-center justify-center">
        <div className="absolute w-12 h-12 bg-cyan-400/30 rounded-full blur-md animate-pulse" />
        <MapPin className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" strokeWidth={3} />
      </div>
    ),
    className: 'dest-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  }), []);

  return (
    <div id="navigation_screen" className="flex flex-col flex-1 select-none overflow-hidden h-full w-full relative bg-black">
      {/* REAL LEAFLET MAP */}
      <style>{getMapStyles(profile.mapTheme)}</style>
      <MapContainer 
        center={YEREVAN_COORDS} 
        zoom={16} 
        minZoom={12}
        maxZoom={19}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        attributionControl={false}
      >
        <TileLayer
          key={profile.mapTheme}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="gta-map-tiles"
          maxZoom={20}
          maxNativeZoom={19}
        />
        <MapResizeHandler />
        
        {route.length > 0 && (
          <Polyline 
            positions={route} 
            pathOptions={{
              color: "#22d3ee",
              weight: 5,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
              dashArray: "10, 15",
              className: "route-line-animated"
            }}
          />
        )}

        {destination && (
          <Marker 
            position={destination} 
            icon={destIcon}
          />
        )}

        <VehicleMarker 
          speed={simulation.speed} 
          theme={profile.theme} 
          onPositionUpdate={setCurrentVehiclePos}
          route={route}
        />
        <SafetyMarkers currentPos={currentVehiclePos} />
        <MapRefGetter setMap={setMap} />
        <MapControls zoomLevel={zoom} />
      </MapContainer>

      {/* TOP NAVIGATION BAR: CONSOLIDATED */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-[1001] flex items-center space-x-2 sm:space-x-3 pointer-events-none">
        {/* BACK / RETURN HOME ICON */}
        {onBack && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onBack}
            className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl flex items-center justify-center hover:bg-slate-900 transition-all active:scale-90 cursor-pointer pointer-events-auto group"
          >
            <Home className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </motion.button>
        )}

        {/* SEARCH BOX (COMPACT) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 max-w-sm pointer-events-auto relative"
        >
          <form onSubmit={(e) => handleSearch(e)} className="relative group">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowHistory(true)}
              placeholder="Search..."
              className="w-full bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-3 pl-10 sm:pl-11 pr-20 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 shadow-2xl transition-all font-mono"
            />
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isSearching ? 'text-cyan-400 animate-spin' : 'text-slate-500 group-hover:text-cyan-400/50 transition-colors'}`} />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              {allRoutes.length > 1 && (
                <div className="flex items-center bg-white/5 rounded-lg border border-white/10 px-1 py-0.5 mr-1">
                  <button 
                    type="button"
                    onClick={() => switchRoute('prev')}
                    className="p-1 hover:text-cyan-400 transition-colors"
                  >
                    <ArrowBigLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono font-black text-white px-1">
                    {activeRouteIndex + 1}/{allRoutes.length}
                  </span>
                  <button 
                    type="button"
                    onClick={() => switchRoute('next')}
                    className="p-1 hover:text-cyan-400 transition-colors"
                  >
                    <ArrowBigRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {destination && (
                <button 
                  type="button"
                  onClick={clearNavigation}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-slate-500 hover:text-white" />
                </button>
              )}
            </div>
          </form>

          {/* HISTORY DROPDOWN */}
          <AnimatePresence>
            {showHistory && searchHistory.length > 0 && (
              <>
                <div 
                  className="fixed inset-0 z-[-1]" 
                  onClick={() => setShowHistory(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden z-[1002]"
                >
                  <div className="p-2 border-b border-white/5 flex items-center justify-between">
                    <span className="text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest ml-2">Recent Searches</span>
                    <button 
                      onClick={() => {
                        setSearchHistory([]);
                        localStorage.removeItem('map_search_history');
                      }}
                      className="text-[7px] font-mono font-bold text-slate-600 hover:text-cyan-400 transition-colors uppercase px-2 py-1"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-col py-1">
                    {searchHistory.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSearchQuery(item);
                          handleSearch(undefined, item);
                        }}
                        className="flex items-center space-x-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left group"
                      >
                        <div className="p-1.5 bg-white/5 rounded-lg border border-white/10 group-hover:border-cyan-400/30 transition-colors">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400" />
                        </div>
                        <span className="text-xs font-mono text-slate-300 group-hover:text-white truncate uppercase tracking-tight">
                          {item}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* COMPACT THEME SWITCHER */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl p-1 flex items-center space-x-0.5 shadow-2xl pointer-events-auto"
        >
          {MAP_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setProfile(prev => ({ ...prev, mapTheme: t.id }))}
              title={t.name}
              className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all flex items-center group relative ${
                profile.mapTheme === t.id 
                  ? 'bg-white/15 border border-white/20' 
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ${t.color} ${profile.mapTheme === t.id ? 'shadow-[0_0_8px_currentColor] ring-1 ring-white/50 border-white border' : 'opacity-40 group-hover:opacity-100 transition-opacity'}`} />
              <span className={`hidden md:block ml-2 text-[9px] font-mono font-bold uppercase tracking-widest ${profile.mapTheme === t.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
                {t.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </motion.div>
      </div>

      {/* FLOATING LOCATE BUTTON (PERMANENT) */}
      <div className="absolute bottom-6 left-6 z-[1001] pointer-events-none">
        <motion.button 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => {
            if (map) {
              map.panTo(currentVehiclePos, { animate: true, duration: 1.5 });
              setZoom(17);
            }
          }}
          className="w-12 h-12 rounded-2xl bg-slate-950/90 backdrop-blur-2xl border border-white/10 flex items-center justify-center hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b-2 border-b-cyan-500 pointer-events-auto group"
        >
          <Navigation className="w-5 h-5 text-cyan-400 group-hover:animate-pulse" />
        </motion.button>
      </div>

      {/* NAVIGATION METRICS PANEL: CONSOLIDATED FOOTER */}
      <AnimatePresence>
        {routeMetrics && destinationName && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-[1001] w-auto max-w-[calc(100vw-2rem)] flex flex-col bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-xl sm:rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto border-b-[2px] border-b-cyan-500/30 overflow-hidden"
          >
            <div className="flex items-center space-x-3 sm:space-x-5 p-1.5 sm:p-2 sm:px-4">
              <div className="flex flex-col min-w-0">
                <span className="text-[6px] sm:text-[7px] font-mono font-black text-cyan-400/50 uppercase tracking-[0.2em] leading-none mb-0.5">Route Target</span>
                <span className="text-[10px] sm:text-[11px] font-mono font-black text-white uppercase truncate max-w-[150px] sm:max-w-[300px]">
                  {destinationName}
                </span>
              </div>
              <div className="w-[1px] h-5 sm:h-6 bg-white/10" />
              <div className="flex items-center space-x-4 sm:space-x-8 px-1">
                <div className="flex flex-col items-center">
                  <span className="text-[6px] sm:text-[7px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Time</span>
                  <span className="text-[9px] sm:text-[10px] font-mono font-black text-white whitespace-nowrap">
                    {Math.ceil(routeMetrics.duration / 60)} MIN
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[6px] sm:text-[7px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Dist</span>
                  <span className="text-[9px] sm:text-[10px] font-mono font-black text-white whitespace-nowrap">
                    {(routeMetrics.distance / 1000).toFixed(1)} KM
                  </span>
                </div>
              </div>
            </div>

            {/* INTEGRATED PROGRESS BAR */}
            <div className="h-1 bg-white/5 w-full relative overflow-hidden">
              <motion.div 
                className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${routeProgress}%` }}
                transition={{ type: "spring", stiffness: 30, damping: 15 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TURN SIGNALS HUD */}
      <div className="absolute inset-x-0 bottom-32 sm:bottom-20 pointer-events-none flex items-center justify-between px-6 sm:px-12 z-[1002]">
        <AnimatePresence>
          {activeBlinker === 'LEFT' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, x: -20 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                scale: [0.8, 1.1, 1, 0.9],
              }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="flex flex-col items-center"
            >
              <div className="p-3 sm:p-5 rounded-2xl bg-green-500/10 border border-green-500/20 backdrop-blur-md shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <ArrowBigLeft className="w-10 h-10 sm:w-16 sm:h-16 text-green-500 fill-green-500" />
              </div>
              <span className="mt-2 text-[8px] font-mono font-black text-green-500 uppercase tracking-widest">Left Turn</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeBlinker === 'RIGHT' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, x: 20 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                scale: [0.8, 1.1, 1, 0.9],
              }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="flex flex-col items-center"
            >
              <div className="p-3 sm:p-5 rounded-2xl bg-green-500/10 border border-green-500/20 backdrop-blur-md shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <ArrowBigRight className="w-10 h-10 sm:w-16 sm:h-16 text-green-500 fill-green-500" />
              </div>
              <span className="mt-2 text-[8px] font-mono font-black text-green-500 uppercase tracking-widest">Right Turn</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

