/**
 * OpenRouter AI service — wraps the OpenRouter REST API for KB & Co AI features.
 * Model: openai/gpt-oss-120b:free
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY ?? '';
const MODEL = 'openai/gpt-oss-120b:free';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterChunk {
  choices: Array<{ delta: { content?: string } }>;
  usage?: { total_tokens?: number; reasoning_tokens?: number };
}

async function* streamChat(messages: Message[]): AsyncGenerator<string> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://kbco.ng',
      'X-Title': 'KB & Co Corporate Investment',
    },
    body: JSON.stringify({ model: MODEL, messages, stream: true }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`OpenRouter error: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value, { stream: true }).split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') return;
      try {
        const chunk: OpenRouterChunk = JSON.parse(raw);
        const content = chunk.choices[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // ignore parse errors in SSE stream
      }
    }
  }
}

async function chat(messages: Message[]): Promise<string> {
  let result = '';
  for await (const token of streamChat(messages)) {
    result += token;
  }
  return result;
}

// ── High-level helpers ─────────────────────────────────────────────────────────

export async function getStockAnalysis(
  symbol: string,
  name: string,
  sector: string,
  currentPrice: number,
  priceHistory: Array<{ year: number; price: number }>,
  financials: {
    grossMargin: number;
    netMargin: number;
    roe: number;
    debtToEquity: number;
    revenue: number[];
    years: number[];
  },
): Promise<string> {
  const yoyReturns = priceHistory.slice(1).map((p, i) => {
    const prev = priceHistory[i].price;
    return `${p.year}: ${((p.price - prev) / prev * 100).toFixed(1)}%`;
  });

  const messages: Message[] = [
    {
      role: 'system',
      content: `You are an expert Nigerian equity analyst at KB & Co Corporate Investment Limited.
Provide concise, data-driven analysis in 3-4 bullet points. Use ₦ for prices. Focus on NGX market dynamics,
FX impacts, sector trends, and investment opportunities. Be specific and professional.`,
    },
    {
      role: 'user',
      content: `Analyze ${name} (${symbol}) on NGX:
Sector: ${sector}
Current price: ₦${currentPrice.toFixed(2)}
Price history (YoY returns): ${yoyReturns.join(', ')}
Gross margin: ${financials.grossMargin}% | Net margin: ${financials.netMargin}%
ROE: ${financials.roe}% | D/E: ${financials.debtToEquity}x
Revenue trend: ${financials.years.map((y, i) => `${y}: ₦${(financials.revenue[i] / 1000).toFixed(0)}B`).join(', ')}

Provide 3-4 key investment insights including outlook, risks, and valuation view.`,
    },
  ];
  return chat(messages);
}

export async function getStockNews(symbol: string, name: string, sector: string): Promise<string> {
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are a financial news analyst focused on Nigerian equity markets (NGX).
Generate realistic, plausible recent news summaries for the company. Include sector trends, regulatory news,
and macro factors affecting the Nigerian market. Format as 3 brief news items with dates.`,
    },
    {
      role: 'user',
      content: `Generate 3 recent news items for ${name} (${symbol}), sector: ${sector}.
Include NGX market context, FX impact, and sector-specific developments. Keep each item to 2 sentences.
Today is ${new Date().toLocaleDateString('en-NG', { dateStyle: 'long' })}.`,
    },
  ];
  return chat(messages);
}

export async function getTechnicalAnalysis(
  symbol: string,
  priceHistory: Array<{ year: number; price: number }>,
  currentPrice: number,
): Promise<string> {
  const prices = priceHistory.map(p => `${p.year}: ₦${p.price}`).join(', ');
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are a technical analyst specialising in NGX stocks. Provide clear, actionable
technical analysis. Reference support/resistance levels, trend direction, and key signals.`,
    },
    {
      role: 'user',
      content: `Provide technical analysis for ${symbol}:
Annual closing prices: ${prices}
Current price: ₦${currentPrice.toFixed(2)}

Give: 1) Trend analysis, 2) Key support & resistance, 3) Signal summary (Buy/Hold/Sell), 4) Risk level.
Be concise — 4 bullet points.`,
    },
  ];
  return chat(messages);
}

export async function getPortfolioInsight(
  portfolioName: string,
  stocks: Array<{ symbol: string; weight: number; changePct: number }>,
  totalValue: number,
): Promise<string> {
  const stockList = stocks.map(s => `${s.symbol} (${s.weight}%, ${s.changePct >= 0 ? '+' : ''}${s.changePct.toFixed(2)}%)`).join(', ');
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are a portfolio manager at KB & Co. Provide concise portfolio performance commentary
and actionable rebalancing suggestions for Nigerian investors.`,
    },
    {
      role: 'user',
      content: `Analyse "${portfolioName}" portfolio:
Holdings: ${stockList}
Total Value: ₦${totalValue.toLocaleString()}
Give 3 insights: performance, risks, and one rebalancing suggestion.`,
    },
  ];
  return chat(messages);
}

export { streamChat, chat };
