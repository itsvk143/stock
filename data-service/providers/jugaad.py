from jugaad_data.nse import NSELive
from .base import BaseProvider
from typing import Dict, Any
import datetime

class JugaadProvider(BaseProvider):
    def __init__(self):
        self.n = NSELive()

    def get_stock(self, symbol: str) -> Dict[str, Any]:
        try:
            data = self.n.stock_quote(symbol)
            price_info = data.get('priceInfo', {})
            
            return {
                "symbol": symbol,
                "price": price_info.get('lastPrice', 0),
                "change": price_info.get('change', 0),
                "percentChange": price_info.get('pChange', 0),
                "timestamp": datetime.datetime.now().isoformat(),
                "provider": "jugaad-data"
            }
        except Exception as e:
            raise Exception(f"jugaad-data error for {symbol}: {str(e)}")

    def get_market_status(self) -> Dict[str, Any]:
        try:
            status = self.n.market_status()
            return status
        except:
            return {"status": "unknown"}
