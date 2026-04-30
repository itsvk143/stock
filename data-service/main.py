import os
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from providers.jugaad import JugaadProvider
from providers.angel import AngelOneProvider
import time

load_dotenv()

app = FastAPI(title="Stock Data Layer")

# Initialize Providers
dev_provider = JugaadProvider()
prod_provider = AngelOneProvider()

# Simple In-Memory Cache
cache = {}
CACHE_TTL = 5 # 5 seconds

def get_active_provider():
    env = os.getenv("DATA_PROVIDER", "DEV")
    return prod_provider if env == "PROD" else dev_provider

@app.get("/stock/{symbol}")
def get_stock_data(symbol: str):
    # 1. Check Cache
    if symbol in cache:
        cached_data, timestamp = cache[symbol]
        if time.time() - timestamp < CACHE_TTL:
            return cached_data

    # 2. Try Primary Provider
    provider = get_active_provider()
    try:
        data = provider.get_stock(symbol)
        cache[symbol] = (data, time.time())
        return data
    except Exception as primary_err:
        print(f"Primary provider failed: {primary_err}")
        
        # 3. Fallback to DEV (jugaad-data) if PROD fails
        if os.getenv("DATA_PROVIDER") == "PROD":
            try:
                print("Falling back to jugaad-data...")
                data = dev_provider.get_stock(symbol)
                return data
            except Exception as fallback_err:
                raise HTTPException(status_code=503, detail=f"All providers failed. Fallback error: {fallback_err}")
        
        raise HTTPException(status_code=503, detail=str(primary_err))

@app.get("/health")
def health():
    return {"status": "ok", "provider": os.getenv("DATA_PROVIDER", "DEV")}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
