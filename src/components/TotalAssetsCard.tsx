import { Gem, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useStore } from '../store';

const GOLD = '#D4AF37';
const fmt = (n: number) => '₦' + n.toLocaleString('en-NG', { maximumFractionDigits: 0 });

interface Props {
  onNavigate?: (page: string) => void;
}

/**
 * Compact "Total Assets / Net Worth" summary strip shared by the Trading
 * Account and My Portfolio pages. Reads the store's net-worth selectors so
 * both pages show a single, consistent total.
 */
export default function TotalAssetsCard({ onNavigate }: Props) {
  // Subscribe to inputs so the totals stay reactive to price/holding changes
  const realBalance = useStore(s => s.realBalance);
  useStore(s => s.realHoldings);
  useStore(s => s.portfolios);
  useStore(s => s.prices);
  useStore(s => s.manualAssets);
  useStore(s => s.liabilities);

  const totalAssets = useStore(s => s.getTotalAssets)();
  const netWorth = useStore(s => s.getNetWorth)();
  const invested = useStore(s => s.getInvestedValue)();
  const liabilities = useStore(s => s.getLiabilitiesTotal)();

  return (
    <div
      onClick={() => onNavigate?.('net-worth')}
      className={onNavigate ? 'cursor-pointer' : ''}
      style={{
        background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(10,15,30,0.35))',
        border: '1px solid rgba(212,175,55,0.25)',
        borderRadius: 16,
        padding: '16px 18px',
        marginBottom: 20,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Gem size={12} style={{ color: GOLD }} /> Total Assets
          </p>
          <p className="text-2xl font-extrabold text-white tabular-nums mt-0.5">{fmt(totalAssets)}</p>
        </div>
        <div className="flex items-center gap-5 text-sm">
          <div>
            <p className="text-[11px] text-gray-500">Cash</p>
            <p className="text-white font-semibold tabular-nums">{fmt(realBalance)}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-500">Invested</p>
            <p className="text-blue-400 font-semibold tabular-nums flex items-center gap-1"><ArrowUpRight size={13} />{fmt(invested)}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-500">Liabilities</p>
            <p className="text-red-400 font-semibold tabular-nums flex items-center gap-1"><ArrowDownRight size={13} />{fmt(liabilities)}</p>
          </div>
          <div className="pl-4" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-[11px] text-gray-500">Net Worth</p>
            <p className="font-extrabold tabular-nums" style={{ color: GOLD }}>{fmt(netWorth)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
