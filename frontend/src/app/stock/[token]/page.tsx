'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useMarketStore } from '@/store/market-store';
import { CandleChart } from '@/components/candle-chart';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercent } from '@/lib/formatter';
import { TrendingUp, TrendingDown, Info, BrainCircuit } from 'lucide-react';

export default function StockDetail() {
  const { token } = useParams();
  const subscribe = useMarketStore((state) => state.subscribe);
  const priceData = useMarketStore((state) => state.prices[token as string]);

  useEffect(() => {
    if (token) {
      subscribe(token as string);
    }
  }, [token, subscribe]);

  const { data: stockInfo, isLoading: infoLoading } = useQuery({
    queryKey: ['stock-info', token],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/instruments/token/${token}`);
      return res.data;
    },
  });

  const { data: candles, isLoading: candlesLoading } = useQuery({
    queryKey: ['candles', token],
    queryFn: async () => {
      // Mocking range for now
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/market/candles`, {
        params: {
          exchange: 'NSE',
          symboltoken: token,
          interval: 'ONE_DAY',
          from: '2024-01-01 09:15',
          to: '2024-04-24 15:30',
        }
      });
      return res.data;
    },
    enabled: !!token,
  });

  const { data: aiAnalysis, isLoading: aiLoading } = useQuery({
    queryKey: ['ai-analysis', token],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/ai/analyze`, {
        params: {
          symbol: stockInfo?.symbol,
          token: token,
        }
      });
      return res.data;
    },
    enabled: !!token && !!stockInfo,
  });

  const { data: news, isLoading: newsLoading } = useQuery({
    queryKey: ['stock-news', stockInfo?.symbol],
    queryFn: async () => {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/news/stock?symbol=${stockInfo?.symbol}`);
      return res.data;
    },
    enabled: !!stockInfo?.symbol,
  });

  if (infoLoading) return <div className="p-20 text-center">Loading Stock Data...</div>;

  const currentPrice = priceData?.ltp || 0;
  const change = priceData?.change || 0;
  const changePercent = priceData?.changePercent || 0;
  const isPositive = change >= 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-4xl font-black">{stockInfo?.symbol}</h1>
              <Badge variant="outline" className="text-sm">{stockInfo?.exchange}</Badge>
            </div>
            <p className="text-muted-foreground">{stockInfo?.tradingsymbol}</p>
          </div>
          
          <div className="text-right">
            <div className={`text-4xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(currentPrice)}
            </div>
            <div className={`flex items-center justify-end gap-2 font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {formatCurrency(change)} ({formatPercent(changePercent)})
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <Card className="lg:col-span-2 p-6 border-2 rounded-2xl bg-card/30 backdrop-blur-md">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Technical Chart
            </h3>
            {candles && <CandleChart data={candles} />}
          </Card>

          {/* AI Intelligence Side Panel */}
          <div className="space-y-8">
            <Card className="p-6 border-2 border-primary/30 rounded-2xl bg-primary/5 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BrainCircuit className="w-20 h-20" />
              </div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-primary" /> AI Analysis
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Recommendation</span>
                  <Badge className={`${
                    aiAnalysis?.recommendation === 'BUY' ? 'bg-green-600' : 
                    aiAnalysis?.recommendation === 'SELL' ? 'bg-red-600' : 'bg-yellow-600'
                  } hover:opacity-80 px-4 py-1 text-lg`}>
                    {aiAnalysis?.recommendation || 'ANALYZING...'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-bold text-xl">{aiAnalysis?.confidence || 0}%</span>
                </div>
                <div className="flex justify-between items-center border-t pt-4">
                  <span className="text-muted-foreground">Risk Level</span>
                  <Badge variant="outline" className={`${
                    aiAnalysis?.risk?.level === 'Low' ? 'text-green-500' : 
                    aiAnalysis?.risk?.level === 'High' ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                    {aiAnalysis?.risk?.level || '...'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mt-4">
                  {aiAnalysis?.summary || 'Generating AI insights based on latest market data...'}
                </p>
              </div>
            </Card>

            <Card className="p-6 border-2 rounded-2xl bg-card/30 backdrop-blur-md">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" /> Key Fundamentals
              </h3>
              <div className="space-y-3">
                <FundamentalRow label="Market Cap" value="₹ 19.2L Cr" />
                <FundamentalRow label="P/E Ratio" value="28.4" />
                <FundamentalRow label="ROE" value="12.5%" />
                <FundamentalRow label="Debt/Equity" value="0.42" />
                <FundamentalRow label="Promoter Holding" value="50.3%" />
              </div>
            </Card>

            <Card className="p-6 border-2 rounded-2xl bg-card/30 backdrop-blur-md">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-yellow-500" /> Latest News
              </h3>
              <div className="space-y-4">
                {newsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading news...</p>
                ) : news && news.length > 0 ? (
                  news.map((item: any, i: number) => (
                    <div key={i} className="group cursor-pointer">
                      <a href={item.link} target="_blank" rel="noopener noreferrer">
                        <h4 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.pubDate).toLocaleDateString()}
                        </p>
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent news found.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function FundamentalRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-muted last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
