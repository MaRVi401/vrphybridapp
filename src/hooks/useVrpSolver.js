import { useState, useRef, useEffect } from "react";

export function useVrpSolver() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState([]);
  const [result, setResult] = useState(null);
  const workerRef = useRef(null);

  useEffect(() => {
    // Inisialisasi Web Worker dari file vrpWorker.js
    workerRef.current = new Worker(new URL("../workers/vrpWorker.js", import.meta.url), {
      type: "module",
    });

    workerRef.current.onmessage = (e) => {
      const { type, iteration, bestDistance, bestSolution } = e.data;

      if (type === "PROGRESS") {
        setProgress((prev) => [...prev, { iteration, distance: parseFloat(bestDistance) }]);
        setResult(bestSolution);
      } else if (type === "COMPLETE") {
        setResult(bestSolution);
        setIsCalculating(false);
      }
    };

    return () => workerRef.current?.terminate();
  }, []);

  const runOptimization = (locations, params) => {
    setIsCalculating(true);
    setProgress([]);
    setResult(null);
    workerRef.current.postMessage({ locations, params });
  };

  return { isCalculating, progress, result, runOptimization };
}