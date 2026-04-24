'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';

export function StockSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();

  const { data: results, isLoading } = useQuery({
    queryKey: ['stock-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/instruments/search?q=${debouncedQuery}`);
      return res.data;
    },
    enabled: debouncedQuery.length >= 2,
  });

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search Indian stocks (e.g. RELIANCE, TCS)..."
          className="pl-10 h-12 text-lg rounded-xl border-2 focus-visible:ring-primary"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {results && results.length > 0 && (
        <Card className="absolute w-full mt-2 z-50 overflow-hidden rounded-xl border-2 shadow-2xl">
          <div className="max-h-[400px] overflow-y-auto">
            {results.map((stock: any) => (
              <div
                key={stock.instrumentToken}
                className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/stock/${stock.instrumentToken}`)}
              >
                <div>
                  <div className="font-bold text-lg">{stock.symbol}</div>
                  <div className="text-sm text-muted-foreground">{stock.tradingsymbol}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{stock.exchange}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
