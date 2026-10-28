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
          setResult(data.HYBRID);
        } else {
          setResult(data);
          setBenchmarkResult(null);
        }
      }
      setIsCalculating(false);
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  const runSolver = (algorithm, locations, params) => {
    if (!locations || locations.length === 0) return;
    setIsCalculating(true);
    workerRef.current.postMessage({ algorithm, locations, params });
  };

  return { isCalculating, result, benchmarkResult, runSolver };
}