import { useEffect, useState } from 'react';

export default function App() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Fetch data from your backend
    fetch('/api/market-data?tickers=AAPL,BTC-USD,RELIANCE.NS')
      .then((res) => res.json())
      .then((json) => setData(json.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>🚀 AI Trading Command Center</h1>
      {!data ? <p>Loading market data...</p> : (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {data.map((asset: any) => (
            <div key={asset.ticker} style={{ border: '1px solid #334155', padding: '1rem', borderRadius: '8px' }}>
              <h2>{asset.name} ({asset.ticker})</h2>
              <p>Price: {asset.currencyPrefix}{asset.price.toFixed(2)}</p>
              <p>Signal: <strong>{asset.signal}</strong></p>
              <p>Risk: {asset.risk}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}