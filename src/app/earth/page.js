'use client';

import { useState, useEffect } from 'react';
import EarthVisualization from './components/EarthVisualization';

export default function EarthPage() {
  const [planetData, setPlanetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEarthData() {
      try {
        setLoading(true);
        const response = await fetch('/api/planets?name=Earth');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch Earth data: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.planets && data.planets.length > 0) {
          setPlanetData(data.planets[0]);
        } else {
          throw new Error('No Earth data found in the response');
        }
      } catch (err) {
        console.error('Error fetching Earth data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEarthData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xl">Loading Earth data...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xl text-red-500">Error: {error}</p>
          </div>
        ) : (
          <div className="h-[calc(100vh-120px)]">
            <EarthVisualization planetData={planetData} />
          </div>
        )}
      </main>
    </div>
  );
}
