import { useState, useEffect, useRef } from 'react';

export function useVrpSolver() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/vrpWorker.js', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e) => {
      const { status, isBenchmark, data } = e.data;
      if (status === 'SUCCESS') {
        if (isBenchmark) {
          setBenchmarkResult(data);

          // Pilih pemenang terbaik: prioritas status Valid (isFeasible), lalu jarak terpendek
          const bestCandidate = Object.entries(data)
            .map(([algName, res]) => ({ ...res, winnerAlgorithm: algName }))
            .sort((a, b) => {
              if (a.isFeasible !== b.isFeasible) {
                return a.isFeasible ? -1 : 1;
              }
              return a.bestDistance - b.bestDistance;
            })[0];

          setResult(bestCandidate);
        } else {
          setResult(data);
          setBenchmarkResult(null);
        }
      }
      setIsCalculating(false);
    };

    workerRef.current.onerror = (err) => {
      console.error('VRP Worker Error:', err);
      setIsCalculating(false);
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  const runSolver = (algorithm, locations, params) => {
    if (!locations || locations.length === 0 || !workerRef.current) return;
    setIsCalculating(true);
    workerRef.current.postMessage({ algorithm, locations, params });
  };

  return { isCalculating, result, benchmarkResult, runSolver };
}