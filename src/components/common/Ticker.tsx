import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { NGX_STOCKS } from '../../data/stocks';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

function PriceFlash({ symbol, price, pct }: { symbol: string; price: number; pct: number }) {
  const isUp = pct >= 0;
  return (
    <span className="inline-flex items-center gap-1.5 mx-5 select-none">
      <span className="font-semibold text-gray-300 tracking-wide text-[11px]">{symbol}</span>
      <motion.span
        key={`${symbol}-${price.toFixed(2)}`}
        initial={{ opacity: 0, y: isUp ? 4 : -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-bold text-[11px] tabular-nums"
        style={{ color: isUp ? '#22c55e' : '#ef4444' }}
      >
        ₦{price >= 1000 ? price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : price.toFixed(2)}
      </motion.span>
      <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
        {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
        {isUp ? '+' : ''}{pct.toFixed(2)}%
      </span>
      <span className="text-gray-700 text-[10px]">·</span>
    </span>
  );
}

export default function Ticker() {
  const { prices } = useStore();
  const [flashSymbol, setFlashSymbol] = useState<string | null>(null);
  const prevPrices = useRef<Record<string, number>>({});
  const items = NGX_STOCKS;

  // Track price changes to flash
  useEffect(() => {
    const changed = Object.entries(prices).find(([sym, data]) => {
      const prev = prevPrices.current[sym];
      return prev !== undefined && prev !== data.price;
    });
    if (changed) {
      setFlashSymbol(changed[0]);
      setTimeout(() => setFlashSymbol(null), 800);
    }
    prevPrices.current = Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, v.price]));
  }, [prices]);

  return (
    <div
      className="overflow-hidden border-b text-xs py-2 relative"
      style={{
        background: 'linear-gradient(90deg, rgba(10,15,30,0.98) 0%, rgba(13,21,48,0.98) 50%, rgba(10,15,30,0.98) 100%)',
        borderColor: 'rgba(212,175,55,0.15)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Live indicator */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5 pr-3"
        style={{ background: 'linear-gradient(90deg, rgba(10,15,30,1), transparent)' }}>
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 breathe" style={{ background: '#22c55e' }} />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#22c55e' }} />
        </span>
        <Zap size={10} className="text-yellow-400" />
        <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wider hidden sm:block">Live NGX</span>
      </div>

      {/* Flash alert overlay */}
      <AnimatePresence>
        {flashSymbol && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: (prices[flashSymbol]?.changePct ?? 0) >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
              color: (prices[flashSymbol]?.changePct ?? 0) >= 0 ? '#22c55e' : '#ef4444',
              border: `1px solid ${(prices[flashSymbol]?.changePct ?? 0) >= 0 ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
            }}
          >
            {flashSymbol} updated
          </motion.div>
        )}
      </AnimatePresence>

      <div className="ticker-scroll pl-20">
        {[...items, ...items].map((stock, i) => {
          const live = prices[stock.symbol];
          const price = live?.price ?? stock.price;
          const pct = live?.changePct ?? stock.changePct;
          return <PriceFlash key={`${i}-${stock.symbol}`} symbol={stock.symbol} price={price} pct={pct} />;
        })}
      </div>
    </div>
  );
}
