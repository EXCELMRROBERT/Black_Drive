import React, { useState, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
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
  MapPin
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
    // Initial size check
    map.invalidateSize();
    
    // Multiple delayed checks to handle CSS transitions
    const timers = [50, 150, 300, 600, 1200, 2000].map(delay => 
      setTimeout(() => {
        map.invalidateSize();
      }, delay)
    );
    
    const handleResize = () => {
      map.invalidateSize();
      // Second check for browser window resizing lag
      setTimeout(() => map.invalidateSize(), 150);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Also use ResizeObserver for the map container if possible
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    
    const container = map.getContainer();
    if (container) observer.observe(container);
    
    return () => {
      timers.forEach(t => clearTimeout(t));
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [map]);
  return null;
}

function VehicleMarker({ speed, theme, onPositionUpdate }: { speed: number; theme: string; onPositionUpdate: (pos: [number, number]) => void }) {
  const map = useMap();
  const [pos, setPos] = useState<[number, number]>(YEREVAN_COORDS);
  const [heading, setHeading] = useState(0);
  const currentTheme = THEMES[theme as keyof typeof THEMES];

  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      if (speed > 0) {
        progress += (speed / 120000);
        const angle = (progress * Math.PI * 2);
        const radius = 0.006; 
        const newPos: [number, number] = [
          YEREVAN_COORDS[0] + radius * Math.cos(angle),
          YEREVAN_COORDS[1] + (radius * 1.2) * Math.sin(angle)
        ];
        setPos(newPos);
        onPositionUpdate(newPos);
        setHeading((angle * 180 / Math.PI) + 90);
        map.panTo(newPos, { animate: true, duration: 0.8 });
      }
    }, 100);
    return () => clearInterval(interval);
  }, [speed, map, onPositionUpdate]);

  const html = renderToStaticMarkup(
    <div className="relative flex items-center justify-center">
      <div 
        className="absolute w-14 h-14 rounded-full opacity-25 blur-xl animate-pulse"
        style={{ backgroundColor: currentTheme.primary }}
      />
      <div style={{ transform: `rotate(${heading}deg)` }} className="transition-transform duration-300">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
          <path
            d="M 12,2 L 20,20 L 12,16 L 4,20 Z"
            fill={currentTheme.primary}
            stroke="#ffffff"
            strokeWidth="2"
            className="drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]"
          />
        </svg>
      </div>
    </div>
  );

  const vehicleIcon = L.divIcon({
    html,
    className: 'vehicle-marker',
    iconSize: [46, 46],
    iconAnchor: [23, 23]
  });

  return <Marker position={pos} icon={vehicleIcon} zIndexOffset={1000} />;
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
  const [currentVehiclePos, setCurrentVehiclePos] = useState<[number, number]>(YEREVAN_COORDS);
  const [routeMetrics, setRouteMetrics] = useState<{ distance: number; duration: number } | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

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
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}+Yerevan&limit=3&addressdetails=1&namedetails=1`);
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
        
        // Fetch real street routing from OSRM
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${currentVehiclePos[1]},${currentVehiclePos[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`;
        const routeResponse = await fetch(osrmUrl);
        const routeData = await routeResponse.json();

        if (routeData.routes && routeData.routes.length > 0) {
          const mainRoute = routeData.routes[0];
          // OSRM returns [lng, lat], we need [lat, lng] for Leaflet
          const coordinates = mainRoute.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
          setRoute(coordinates);
          
          // Set distance (m -> km) and duration (s -> s)
          setRouteMetrics({
            distance: mainRoute.distance,
            duration: mainRoute.duration
          });
        } else {
          // Fallback to simple corner route if OSRM fails
          setRoute([currentVehiclePos, [currentVehiclePos[0], dest[1]], dest]);
          setRouteMetrics(null);
        }
        
        setZoom(17);
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
    setSearchQuery('');
    setDestinationName('');
    setRouteMetrics(null);
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
      .route-line-animated {
        animation: routeFlow 2s linear infinite;
      }
    `;
  };

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
            icon={L.divIcon({
              html: renderToStaticMarkup(
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-12 h-12 bg-cyan-400/30 rounded-full blur-md animate-pulse" />
                  <MapPin className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" strokeWidth={3} />
                </div>
              ),
              className: 'dest-marker',
              iconSize: [32, 32],
              iconAnchor: [16, 32]
            })}
          />
        )}

        <VehicleMarker 
          speed={simulation.speed} 
          theme={profile.theme} 
          onPositionUpdate={setCurrentVehiclePos}
        />
        <MapControls zoomLevel={zoom} centerOn={destination || undefined} />
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
              className="w-full bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-3 pl-10 sm:pl-11 pr-4 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 shadow-2xl transition-all font-mono"
            />
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isSearching ? 'text-cyan-400 animate-spin' : 'text-slate-500 group-hover:text-cyan-400/50 transition-colors'}`} />
            {destination && (
              <button 
                type="button"
                onClick={clearNavigation}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-500 hover:text-white" />
              </button>
            )}
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

      {/* NAVIGATION METRICS PANEL: CONSOLIDATED FOOTER */}
      <AnimatePresence>
        {routeMetrics && destinationName && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-[1001] w-auto max-w-[calc(100vw-2rem)] flex items-center bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto border-b-[2px] border-b-cyan-500/30 overflow-hidden"
          >
            <div className="flex items-center space-x-3 sm:space-x-5 px-1 sm:px-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              </div>
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
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

