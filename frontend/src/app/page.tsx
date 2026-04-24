import { StockSearch } from "@/components/stock-search";
import { Card } from "@/components/ui/card";
import { TrendingUp, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16 space-y-6">
          <h1 className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 sm:text-7xl">
            STOCK INTELLIGENCE
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Production-grade AI insights for Indian Equity Markets. Real-time data, 
            broker-integrated execution, and advanced financial reasoning.
          </p>
          <div className="pt-8">
            <StockSearch />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
          <FeatureCard 
            icon={<Zap className="w-8 h-8 text-yellow-500" />}
            title="Real-time LTP"
            description="WebSocket-integrated ticks from Angel One with sub-second latency."
          />
          <FeatureCard 
            icon={<TrendingUp className="w-8 h-8 text-green-500" />}
            title="AI Analysis"
            description="LLM-powered reasoning grounded in actual fundamentals and technical data."
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-8 h-8 text-blue-500" />}
            title="Risk Engine"
            description="Advanced scoring based on debt, promoter pledges, and volatility."
          />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="p-8 border-2 hover:border-primary/50 transition-all group rounded-2xl bg-card/50 backdrop-blur-sm">
      <div className="mb-6 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </Card>
  );
}
