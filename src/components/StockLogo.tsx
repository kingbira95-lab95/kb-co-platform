import { useState } from 'react';
import { getStockLogoUrl } from '../utils/stockLogo';
import { LOGO_MANIFEST } from '../utils/logoManifest';

// Sector → brand color for badge fallbacks (matches industry conventions)
const SECTOR_COLORS: Record<string, string> = {
  Banking: '#3b82f6',
  'Commercial Banking': '#3b82f6',
  'Mortgage Banking': '#6366f1',
  Telecoms: '#8b5cf6',
  Telecommunications: '#8b5cf6',
  'Oil & Gas': '#f59e0b',
  Energy: '#f59e0b',
  Petroleum: '#d97706',
  Cement: '#ef4444',
  'Building Materials': '#ef4444',
  Construction: '#dc2626',
  'Consumer Goods': '#22c55e',
  'Food & Beverages': '#16a34a',
  Brewery: '#84cc16',
  Agriculture: '#65a30d',
  Agro: '#65a30d',
  Insurance: '#06b6d4',
  'Financial Services': '#0891b2',
  Technology: '#a855f7',
  ICT: '#9333ea',
  Healthcare: '#ec4899',
  Pharma: '#db2777',
  Transportation: '#f97316',
  Logistics: '#ea580c',
  Hospitality: '#d97706',
  Hotels: '#b45309',
  'Real Estate': '#14b8a6',
  REIT: '#0d9488',
  Industrial: '#64748b',
  Manufacturing: '#475569',
  Conglomerates: '#7c3aed',
  Media: '#c026d3',
  Printing: '#9d174d',
};

function getSectorColor(sector?: string): string {
  if (!sector) return '#D4AF37';
  for (const [key, color] of Object.entries(SECTOR_COLORS)) {
    if (sector.toLowerCase().includes(key.toLowerCase())) return color;
  }
  // Deterministic fallback from sector hash
  let hash = 0;
  for (let i = 0; i < sector.length; i++) hash = sector.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

interface StockLogoProps {
  symbol: string;
  sector?: string;
  website?: string;
  size?: number;
  className?: string;
}

/**
 * Shows a company logo for a given NGX stock symbol.
 * Waterfall: local SVG (/public/logos/<SYMBOL>.svg) → Clearbit → sector-colored badge
 */
export default function StockLogo({ symbol, sector, website, size = 28, className = '' }: StockLogoProps) {
  const [localFailed, setLocalFailed] = useState(false);
  const [clearbitFailed, setClearbitFailed] = useState(false);

  const localUrl = LOGO_MANIFEST[symbol];
  const clearbitUrl = getStockLogoUrl(symbol, website);
  const badgeColor = getSectorColor(sector);

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: Math.round(size * 0.28),
    flexShrink: 0,
    overflow: 'hidden',
  };

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    background: '#fff',
    padding: Math.round(size * 0.1),
  };

  // 1. Try local logo first (from public/logos/, resolved via generated manifest)
  if (localUrl && !localFailed) {
    return (
      <div style={containerStyle} className={className}>
        <img
          src={localUrl}
          alt={symbol}
          style={imgStyle}
          onError={() => setLocalFailed(true)}
        />
      </div>
    );
  }

  // 2. Try Clearbit API
  if (clearbitUrl && !clearbitFailed) {
    return (
      <div style={containerStyle} className={className}>
        <img
          src={clearbitUrl}
          alt={symbol}
          style={imgStyle}
          onError={() => setClearbitFailed(true)}
        />
      </div>
    );
  }

  // 3. Sector-colored badge fallback
  const initials = symbol.slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        ...containerStyle,
        background: badgeColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.35),
        fontWeight: 700,
        color: '#fff',
        letterSpacing: '-0.5px',
      }}
      className={className}
    >
      {initials}
    </div>
  );
}