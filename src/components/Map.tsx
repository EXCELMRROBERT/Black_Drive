import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Navigation, 
  ShoppingBag, 
  DollarSign, 
  Fuel, 
  Coffee, 
  Store, 
  Pizza, 
  Music, 
  Plus, 
  Minus,
  ChevronRight,
  Home,
  Wrench,
  Scissors,
  Shirt,
  MapPin,
  Star,
  Shield,
  Hospital,
  Utensils,
  Dumbbell,
  Briefcase,
  Camera,
  Beer,
  Gamepad2,
  Tv,
  Car,
  Building,
  GraduationCap,
  X,
  CheckCircle2,
  Info
} from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DriverProfile, SimulationState } from '../types';
import { THEMES } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

interface MapProps {
  profile: DriverProfile;
  simulation: SimulationState;
}

interface POI {
  id: string;
  name: string;
  icon: any;
  color: string;
  pos: [number, number];
  description?: string;
  category?: string;
}

// Yerevan Center
const YEREVAN_COORDS: [number, number] = [40.1792, 44.5152];

// POI Type Definitions for randomization
const POI_TYPES = [
  { icon: ShoppingBag, color: '#ff00ff', weight: 10, names: ['Shop', 'Store', 'Market', 'Boutique'] },
  { icon: DollarSign, color: '#00ff00', weight: 5, names: ['Bank', 'ATM', 'Exchange'] },
  { icon: Fuel, color: '#ffff00', weight: 3, names: ['Gas', 'Station', 'Fuel', 'Petrol'] },
  { icon: Music, color: '#0000ff', weight: 5, names: ['Club', 'Bar', 'Lounge', 'Disco'] },
  { icon: Pizza, color: '#ff9900', weight: 8, names: ['Pizza', 'Food', 'Cafe', 'Dining'] },
  { icon: Coffee, color: '#ff0000', weight: 15, names: ['Coffee', 'Espresso', 'Cafe', 'Roasters'] },
  { icon: Home, color: '#00ffcc', weight: 2, names: ['Safehouse', 'Apartment', 'Home'] },
  { icon: Wrench, color: '#ff3300', weight: 3, names: ['Repair', 'Spray', 'Garage', 'Tuning'] },
  { icon: Scissors, color: '#3399ff', weight: 3, names: ['Barber', 'Salon', 'Cuts'] },
  { icon: Shirt, color: '#9966ff', weight: 5, names: ['Clothes', 'Wear', 'Vintage'] },
  { icon: Shield, color: '#0066ff', weight: 2, names: ['Police', 'Station', 'Security'] },
  { icon: Hospital, color: '#ff0033', weight: 1, names: ['Hospital', 'Clinic', 'Medical'] },
  { icon: Utensils, color: '#ff9933', weight: 10, names: ['Restaurant', 'Kebab', 'Bistro'] },
  { icon: Dumbbell, color: '#cccccc', weight: 3, names: ['Gym', 'Fitness', 'Workout'] },
  { icon: Briefcase, color: '#aaaaaa', weight: 8, names: ['Office', 'Center', 'Jobs'] },
  { icon: Camera, color: '#ffffff', weight: 4, names: ['View', 'Photo', 'Lookout'] },
  { icon: Beer, color: '#ffcc00', weight: 8, names: ['Pub', 'Beer', 'Tavern'] },
  { icon: Gamepad2, color: '#ff0066', weight: 3, names: ['Arcade', 'Gaming', 'Play'] },
  { icon: Tv, color: '#6600ff', weight: 2, names: ['Cinema', 'Shows', 'Theatre'] },
  { icon: Car, color: '#666666', weight: 5, names: ['Parking', 'Dealer', 'Autos'] },
  { icon: Building, color: '#888888', weight: 12, names: ['Center', 'Tower', 'Plaza'] },
  { icon: GraduationCap, color: '#003399', weight: 2, names: ['Uni', 'School', 'Library'] }
];

// Procedural POI Generator for filler
const generateRandomPOIs = (count: number) => {
  const pois = [];
  const totalWeight = POI_TYPES.reduce((acc, t) => acc + t.weight, 0);

  for (let i = 0; i < count; i++) {
    let r = Math.random() * totalWeight;
    let type = POI_TYPES[0];
    for (const t of POI_TYPES) {
      if (r < t.weight) {
        type = t;
        break;
      }
      r -= t.weight;
    }

    const lat = YEREVAN_COORDS[0] + (Math.random() - 0.5) * 0.08;
    const lng = YEREVAN_COORDS[1] + (Math.random() - 0.5) * 0.1;
    const name = `${type.names[Math.floor(Math.random() * type.names.length)]} #${i + 101}`;
    
    pois.push({
      id: `gen-${i}`,
      name,
      icon: type.icon,
      color: type.color,
      pos: [lat, lng] as [number, number],
      category: 'Commercial District',
      description: 'Standard local business operating in the Yerevan sector.'
    });
  }
  return pois;
};

const ARM_POIS: POI[] = [
  { 
    id: '1', 
    name: 'SAS FOOD COURT', 
    icon: Utensils, 
    color: '#ff9930', 
    pos: [40.1811, 44.5136],
    category: 'Restaurant',
    description: 'High-quality food court featuring the legendary SAS home-style cooking and local delicacies.'
  },
  { 
    id: '2', 
    name: 'CENTRAL BANK OF ARMENIA', 
    icon: DollarSign, 
    color: '#00ff88', 
    pos: [40.1775, 44.5126],
    category: 'Finance Hub',
    description: 'The main financial heart of the country. High security, restricted tactical data access.'
  },
  { 
    id: '3', 
    name: 'TASHIR PIZZA', 
    icon: Pizza, 
    color: '#ff4400', 
    pos: [40.1825, 44.5142],
    category: 'Fast Casual',
    description: 'Yerevan staple pizza chain. Popular gathering spot for local residents and tactical operators.'
  },
  { 
    id: '4', 
    name: 'MALKHAS JAZZ CLUB', 
    icon: Music, 
    color: '#8b5cf6', 
    pos: [40.1852, 44.5175],
    category: 'Entertainment',
    description: 'Legendary jazz lounge owned by Levon Malkhasyan. Excellent atmosphere and live acoustics.'
  },
  { 
    id: '5', 
    name: 'CASCADE COMPLEX', 
    icon: Camera, 
    color: '#ffffff', 
    pos: [40.1911, 44.5152],
    category: 'Landmark',
    description: 'Giant limestone stairway featuring modern art museum and panoramic tactical views of Mount Ararat.'
  },
  { 
    id: '6', 
    name: 'OPERA THEATER', 
    icon: MapPin, 
    color: '#f43f5e', 
    pos: [40.1858, 44.5151],
    category: 'Cultural Center',
    description: 'Spandaryan Opera and Ballet Theater. The architectural focal point of the Small Center.'
  },
  { 
    id: '7', 
    name: 'SAFEHOUSE: TUMANYAN ST', 
    icon: Home, 
    color: '#22d3ee', 
    pos: [40.1840, 44.5110],
    category: 'Residential',
    description: 'Secured apartment block with underground parking and high-speed network uplink.'
  },
  ...generateRandomPOIs(200)
];

// Custom GTA Badge Icon Generator (Refined)
const createGTAIcon = (IconComponent: any, color: string, isSelected: boolean) => {
  const html = renderToStaticMarkup(
    <div className={`relative group flex items-center justify-center transition-all duration-300 ${isSelected ? 'scale-125 z-[2000]' : ''}`}>
      <div 
        className={`w-8 h-8 bg-black border-[2.5px] rounded-[4px] flex items-center justify-center shadow-2xl transition-all ${
          isSelected ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)]' : 'border-white'
        }`}
      >
        <div 
          className="absolute inset-0 opacity-20"
          style={{ backgroundColor: color }}
        />
        <IconComponent style={{ color: isSelected ? '#22d3ee' : color, width: '16px', height: '16px' }} strokeWidth={3} />
      </div>
    </div>
  );
  return L.divIcon({
    html,
    className: 'gta-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

// Vehicle Marker Component (Refined)
function VehicleMarker({ speed, theme }: { speed: number; theme: string }) {
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
        setHeading((angle * 180 / Math.PI) + 90);
        map.panTo(newPos, { animate: true, duration: 0.8 });
      }
    }, 100);
    return () => clearInterval(interval);
  }, [speed, map]);

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

export default function Map({ profile, simulation }: MapProps) {
  const [zoom, setZoom] = useState(16);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  
  return (
    <div id="navigation_screen" className="flex flex-col flex-1 select-none overflow-hidden h-full w-full relative bg-[#060607]">
      {/* REAL LEAFLET MAP */}
      <style>{`
        .gta-map-tiles {
          filter: brightness(2.5) contrast(1.8) grayscale(1);
        }
        .leaflet-container {
          background: #000000 !important;
        }
      `}</style>
      <MapContainer 
        center={YEREVAN_COORDS} 
        zoom={16} 
        minZoom={12}
        maxZoom={19}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors"
          className="gta-map-tiles"
          subdomains="abcd"
          maxZoom={20}
        />
        
        {/* GTA STYLE POIs */}
        {ARM_POIS.map(poi => (
          <Marker 
            key={poi.id} 
            position={poi.pos} 
            icon={createGTAIcon(poi.icon, poi.color, selectedPOI?.id === poi.id)} 
            eventHandlers={{
              click: () => setSelectedPOI(poi)
            }}
          />
        ))}

        <VehicleMarker speed={simulation.speed} theme={profile.theme} />
        <MapControls zoomLevel={zoom} centerOn={selectedPOI?.pos} />
      </MapContainer>

      {/* OVERLAY UI: TACTICAL FEED */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col space-y-2 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-950/90 backdrop-blur-xl border border-white/10 px-5 py-4 rounded-[2rem] flex items-center space-x-5 shadow-2xl"
        >
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <Navigation className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] uppercase font-mono tracking-[0.3em] text-slate-500 font-bold mb-0.5">Tactical Map Feed</span>
            <span className="text-[13px] uppercase font-mono font-black text-white tracking-[0.05em] flex items-center">
              YEREVAN V3 <ChevronRight className="w-4 h-4 ml-1.5 opacity-30" />
            </span>
          </div>
        </motion.div>
      </div>

      {/* POI INFORMATION PANEL (GTA STYLE) */}
      <AnimatePresence>
        {selectedPOI && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 50 }}
            className="absolute top-4 right-4 z-[1001] w-[340px] flex flex-col space-y-3"
          >
            <div className="bg-slate-950/95 backdrop-blur-2xl border-2 border-white/10 rounded-[2rem] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-white/5 to-transparent rotate-12 -translate-y-4 pointer-events-none" />
              
              <button 
                onClick={() => setSelectedPOI(null)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer group pointer-events-auto"
              >
                <X className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </button>

              <div className="flex items-center space-x-4 mb-5">
                <div className="p-4 bg-white/5 rounded-2xl border-2 border-cyan-400/30">
                  <selectedPOI.icon style={{ color: selectedPOI.color }} className="w-8 h-8" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-mono font-black text-cyan-400 tracking-[0.2em] mb-1">
                    {selectedPOI.category || 'Location Info'}
                  </span>
                  <h2 className="text-xl font-mono font-black text-white leading-tight uppercase tracking-tight">
                    {selectedPOI.name}
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[13px] text-slate-100 font-medium leading-relaxed">
                    {selectedPOI.description || 'Sector details currently in retrieval process. Security clearance verified.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Target Identified</span>
                  </div>
                  <div className="bg-white/5 px-3 py-1 rounded-full flex items-center space-x-2">
                    <Info className="w-3 h-3 text-slate-500" />
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Interactive Marker</span>
                  </div>
                </div>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm px-4 py-3 rounded-2xl flex items-center space-x-3"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-tight">
                Current Location Tracked in Sector DB
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ZOOM CONTROLS */}
      {!selectedPOI && (
        <div className="absolute right-4 bottom-28 sm:bottom-6 z-[1000] flex flex-col space-y-3">
          <button 
            onClick={() => setZoom(prev => Math.min(19, prev + 1))}
            className="w-14 h-14 rounded-3xl bg-slate-950/95 border border-white/10 flex items-center justify-center text-white active:scale-90 cursor-pointer backdrop-blur-xl hover:bg-slate-900 shadow-[0_15px_40px_rgba(0,0,0,0.6)] transition-all"
          >
            <Plus className="w-6 h-6 text-slate-200" />
          </button>
          <button 
            onClick={() => setZoom(prev => Math.max(12, prev - 1))}
            className="w-14 h-14 rounded-3xl bg-slate-950/95 border border-white/10 flex items-center justify-center text-white active:scale-90 cursor-pointer backdrop-blur-xl hover:bg-slate-900 shadow-[0_15px_40px_rgba(0,0,0,0.6)] transition-all"
          >
            <Minus className="w-6 h-6 text-slate-200" />
          </button>
        </div>
      )}

      {/* STATUS FOOTER BAR */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 flex space-x-10 items-center shadow-[0_20px_60px_rgba(0,0,0,0.9)] select-none border-b-[3px] border-b-cyan-500/40">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-bold mb-1.5">Active Sector</span>
          <span className="text-[14px] font-mono font-black text-white tracking-[0.1em]">ARM_YVR_DX</span>
        </div>
        <div className="w-[1.5px] h-12 bg-white/10" />
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-bold mb-1.5">Map Engine</span>
          <span className="text-[14px] font-mono font-bold text-cyan-400 uppercase">GTA_V_ENGINE_PRO</span>
        </div>
        <div className="hidden sm:flex items-center space-x-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
          <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest">Network Secure</span>
        </div>
      </div>
    </div>
  );
}

