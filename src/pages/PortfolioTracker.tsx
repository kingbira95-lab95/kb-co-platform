import { useState } from 'react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../store';
import { NGX_STOCKS } from '../data/stocks';
import { formatPrice, formatLargeNumber } from '../utils';
import { Plus, Trash2, BarChart3, Wallet, TrendingUp, FileText, Sheet } from 'lucide-react';

const COLORS = ['#D4AF37', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export default function PortfolioTracker() {
  const { portfolios, activePortfolioId, prices, addHolding, removeHolding, createPortfolio, setActivePortfolio, addNotification } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ symbol: '', shares: '', buyPrice: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [newPortName, setNewPortName] = useState('');
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

  const handleExport = async (type: 'pdf' | 'excel') => {
    if (!activePortfolioId) return;
    setExporting(type);
    try {
      if (type === 'excel') {
        // Client-side Excel export — no backend needed
        const wb = XLSX.utils.book_new();

        const rows: (string | number)[][] = [
          ['KB & Co Corporate Investment — Portfolio Report'],
          [`Portfolio: ${activePortfolio?.name ?? 'My Portfolio'}`],
          [`Generated: ${new Date().toLocaleDateString('en-NG', { dateStyle: 'long' })}`],
          [],
          ['Symbol', 'Company', 'Sector', 'Shares', 'Avg Cost (₦)', 'Current Price (₦)', 'Value (₦)', 'Gain/Loss (₦)', 'Gain/Loss %'],
          ...holdings.map(h => [
            h.symbol,
            h.stock?.name ?? h.symbol,
            h.stock?.sector ?? '',
            h.shares,
            h.buyPrice,
            h.currentPrice,
            +h.currentValue.toFixed(2),
            +h.gainLoss.toFixed(2),
            +(h.gainLossPct.toFixed(2)),
          ]),
          [],
          ['', '', '', '', '', 'TOTAL', +totalValue.toFixed(2), +totalGain.toFixed(2), +(totalGainPct.toFixed(2))],
        ];

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [14, 30, 20, 10, 16, 18, 16, 16, 12].map(w => ({ wch: w }));
        XLSX.utils.book_append_sheet(wb, ws, 'Portfolio');
        XLSX.writeFile(wb, `KB-Co-Portfolio-${new Date().toISOString().slice(0, 10)}.xlsx`);
      } else {
        // Client-side PDF export — no backend needed
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF({ orientation: 'landscape' });
        const generated = new Date().toLocaleDateString('en-NG', { dateStyle: 'long' });

        doc.setFontSize(18);
        doc.setTextColor(160, 128, 32);
        doc.text('KB & Co Corporate Investment', 14, 16);
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text(`Portfolio Report — ${activePortfolio?.name ?? 'My Portfolio'}`, 14, 24);
        doc.setFontSize(9);
        doc.setTextColor(110, 110, 110);
        doc.text(`Generated: ${generated}  ·  ${holdings.length} holdings  ·  Prices: NGX live`, 14, 30);

        autoTable(doc, {
          startY: 36,
          head: [['Symbol', 'Company', 'Sector', 'Shares', 'Avg Cost (₦)', 'Current (₦)', 'Value (₦)', 'Gain/Loss (₦)', 'Gain/Loss %']],
          body: holdings.map(h => [
            h.symbol,
            h.stock?.name ?? h.symbol,
            h.stock?.sector ?? '—',
            h.shares.toLocaleString(),
            h.buyPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
            h.currentPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
            h.currentValue.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
            h.gainLoss.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
            `${h.gainLossPct >= 0 ? '+' : ''}${h.gainLossPct.toFixed(2)}%`,
          ]),
          foot: [[
            '', '', '', '', '', 'TOTAL',
            totalValue.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
            totalGain.toLocaleString('en-NG', { minimumFractionDigits: 2 }),
            `${totalGainPct >= 0 ? '+' : ''}${totalGainPct.toFixed(2)}%`,
          ]],
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [212, 175, 55], textColor: [10, 15, 30], fontStyle: 'bold' },
          footStyles: { fillColor: [10, 15, 30], textColor: [212, 175, 55], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [246, 244, 238] },
        });

        const pageH = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setTextColor(130, 130, 130);
        doc.text(
          'KB & Co Corporate Investment Limited — investment research and educational information only. Past performance does not guarantee future returns.',
          14, pageH - 8,
        );

        doc.save(`KB-Co-Portfolio-${new Date().toISOString().slice(0, 10)}.pdf`);
      }
    } catch (e) {
      console.error('Export failed', e);
      alert(`${type === 'pdf' ? 'PDF' : 'Excel'} export failed. Please try again.`);
    } finally {
      setExporting(null);
    }
  };

  const activePortfolio = portfolios.find(p => p.id === activePortfolioId);

  const holdings = (activePortfolio?.holdings ?? []).map(h => {
    const stock = NGX_STOCKS.find(s => s.symbol === h.symbol);
    const currentPrice = prices[h.symbol]?.price ?? h.buyPrice;
    const currentValue = currentPrice * h.shares;
    const costBasis = h.buyPrice * h.shares;
    const gainLoss = currentValue - costBasis;
    const gainLossPct = ((currentValue - costBasis) / costBasis) * 100;
    return { ...h, stock, currentPrice, currentValue, costBasis, gainLoss, gainLossPct };
  });

  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.costBasis, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  const pieData = holdings.map((h, i) => ({
    name: h.symbol,
    value: Math.round((h.currentValue / totalValue) * 100),
    color: COLORS[i % COLORS.length],
  }));

  const handleAdd = () => {
    if (!addForm.symbol || !addForm.shares) return;
    const stock = NGX_STOCKS.find(s => s.symbol === addForm.symbol.toUpperCase());
    if (!stock) return;
    addHolding(activePortfolioId!, {
      symbol: addForm.symbol.toUpperCase(),
      shares: +addForm.shares,
      buyPrice: +addForm.buyPrice || (prices[addForm.symbol.toUpperCase()]?.price ?? stock.price),
      buyDate: new Date().toISOString(),
    });
    addNotification({ type: 'portfolio', title: 'Stock Added', message: `${addForm.shares} shares of ${addForm.symbol.toUpperCase()} added to portfolio`, symbol: addForm.symbol.toUpperCase() });
    setAddForm({ symbol: '', shares: '', buyPrice: '' });
    setShowAdd(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">My Portfolio</h2>
          <p className="text-sm text-gray-400 mt-1">Track your holdings, P&L, and allocation</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('pdf')} disabled={!!exporting} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-gray-300 transition-all disabled:opacity-50" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <FileText size={12} /> {exporting === 'pdf' ? '…' : 'PDF'}
          </button>
          <button onClick={() => handleExport('excel')} disabled={!!exporting} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-gray-300 transition-all disabled:opacity-50" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <Sheet size={12} /> {exporting === 'excel' ? '…' : 'Excel'}
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-gray-300 transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <Plus size={12} /> New Portfolio
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-black" style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}>
            <Plus size={12} /> Add Stock
          </button>
        </div>
      </div>

      {/* Portfolio tabs */}
      {portfolios.length > 1 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {portfolios.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePortfolio(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${activePortfolioId === p.id ? 'text-black' : 'text-gray-400 hover:text-white'}`}
              style={activePortfolioId === p.id ? { background: 'linear-gradient(135deg, #D4AF37, #A08020)' } : { background: 'rgba(255,255,255,0.05)' }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Portfolio Value', value: formatLargeNumber(totalValue), icon: Wallet, color: '#D4AF37' },
          { label: 'Total Cost', value: formatLargeNumber(totalCost), icon: BarChart3, color: '#3b82f6' },
          { label: 'Total Gain/Loss', value: `${totalGain >= 0 ? '+' : ''}${formatLargeNumber(totalGain)}`, icon: TrendingUp, color: totalGain >= 0 ? '#22c55e' : '#ef4444', positive: totalGain >= 0 },
          { label: 'Return %', value: `${totalGainPct >= 0 ? '+' : ''}${totalGainPct.toFixed(2)}%`, icon: TrendingUp, color: totalGainPct >= 0 ? '#22c55e' : '#ef4444', positive: totalGainPct >= 0 },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500">{kpi.label}</span>
              <kpi.icon size={14} color={kpi.color} />
            </div>
            <div className="text-xl font-bold" style={{ color: (kpi as any).positive !== undefined ? ((kpi as any).positive ? '#22c55e' : '#ef4444') : kpi.color }}>
              {kpi.value}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        {/* Holdings Table */}
        <div className="xl:col-span-2 glass-card overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="text-sm font-semibold text-white">{holdings.length} Holdings</span>
          </div>
          {holdings.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              No holdings yet. Click "Add Stock" to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <th className="text-left px-4 py-2">Stock</th>
                    <th className="text-right px-3 py-2">Shares</th>
                    <th className="text-right px-3 py-2">Avg Cost</th>
                    <th className="text-right px-3 py-2">Curr. Price</th>
                    <th className="text-right px-3 py-2">Value</th>
                    <th className="text-right px-3 py-2">P&L</th>
                    <th className="text-right px-3 py-2">P&L%</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => (
                    <tr key={h.symbol} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold text-black" style={{ background: '#D4AF37' }}>{h.symbol.slice(0, 2)}</div>
                          <div>
                            <div className="text-xs font-bold text-white">{h.symbol}</div>
                            <div className="text-[9px] text-gray-500 truncate" style={{ maxWidth: 80 }}>{h.stock?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-gray-300">{h.shares.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right text-xs text-gray-400">₦{formatPrice(h.buyPrice)}</td>
                      <td className="px-3 py-3 text-right text-xs text-white font-medium">₦{formatPrice(h.currentPrice)}</td>
                      <td className="px-3 py-3 text-right text-xs text-white font-semibold">{formatLargeNumber(h.currentValue)}</td>
                      <td className={`px-3 py-3 text-right text-xs font-semibold ${h.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {h.gainLoss >= 0 ? '+' : ''}{formatLargeNumber(h.gainLoss)}
                      </td>
                      <td className={`px-3 py-3 text-right text-xs font-semibold ${h.gainLossPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {h.gainLossPct >= 0 ? '+' : ''}{h.gainLossPct.toFixed(2)}%
                      </td>
                      <td className="px-3 py-3">
                        <button onClick={() => removeHolding(activePortfolioId!, h.symbol)} className="text-gray-600 hover:text-red-400 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Allocation Pie */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Portfolio Allocation</h3>
          {holdings.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0D1530', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, fontSize: 11 }} formatter={(v: unknown) => [`${v}%`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                      <span className="text-gray-400">{item.name}</span>
                    </div>
                    <span className="text-white font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 text-sm py-8">Add stocks to see allocation</div>
          )}
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-md glass-card p-6">
            <h3 className="text-base font-bold text-white mb-5">Add Stock to Portfolio</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Symbol</label>
                <select value={addForm.symbol} onChange={e => setAddForm(f => ({ ...f, symbol: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }}>
                  <option value="" style={{ background: '#0D1530' }}>Select stock...</option>
                  {NGX_STOCKS.map(s => <option key={s.symbol} value={s.symbol} style={{ background: '#0D1530' }}>{s.symbol} - {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Number of Shares</label>
                <input type="number" min="1" value={addForm.shares} onChange={e => setAddForm(f => ({ ...f, shares: e.target.value }))}
                  placeholder="e.g. 100"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1.5">Buy Price (₦) — Leave blank for current price</label>
                <input type="number" min="0" step="0.01" value={addForm.buyPrice} onChange={e => setAddForm(f => ({ ...f, buyPrice: e.target.value }))}
                  placeholder="Optional"
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleAdd} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}>Add to Portfolio</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Portfolio Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm glass-card p-6">
            <h3 className="text-base font-bold text-white mb-4">Create New Portfolio</h3>
            <input value={newPortName} onChange={e => setNewPortName(e.target.value)} placeholder="Portfolio name"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none mb-4"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(212,175,55,0.15)' }} />
            <div className="flex gap-3">
              <button onClick={() => { createPortfolio(newPortName || 'New Portfolio'); setShowCreate(false); setNewPortName(''); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background: 'linear-gradient(135deg, #D4AF37, #A08020)' }}>Create</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 rounded-xl text-sm text-gray-400" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
