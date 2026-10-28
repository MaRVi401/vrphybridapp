import React, { useState } from "react";
import MapView from "./components/MapView";
import FitnessChart from "./components/FitnessChart";
import { useVrpSolver } from "./hooks/useVrpSolver";

// Data Sampel Lokasi (1 Depot + 5 Pelanggan di Bandung)
const SAMPLE_LOCATIONS = [
  { id: 0, name: "Depot Pusat", lat: -6.9175, lng: 107.6191, demand: 0 },
  { id: 1, name: "Toko A", lat: -6.9034, lng: 107.6187, demand: 20 },
  { id: 2, name: "Toko B", lat: -6.9211, lng: 107.6071, demand: 35 },
  { id: 3, name: "Toko C", lat: -6.9322, lng: 107.6255, demand: 15 },
  { id: 4, name: "Toko D", lat: -6.8912, lng: 107.6101, demand: 25 },
  { id: 5, name: "Toko E", lat: -6.9100, lng: 107.6300, demand: 30 },
];

export default function App() {
  const { isCalculating, progress, result, runOptimization } = useVrpSolver();
  
  // State Parameter Algoritma & Kendaraan
  const [params, setParams] = useState({
    popSize: 40,
    maxIterations: 150,
    limit: 15,
    numVehicles: 2,
    vehicleCapacity: 60,
  });

  // Handler eksekusi dengan validasi fallback angka agar tidak NaN
  const handleRun = () => {
    const safeParams = {
      popSize: Number(params.popSize) || 40,
      maxIterations: Number(params.maxIterations) || 150,
      limit: Number(params.limit) || 15,
      numVehicles: Number(params.numVehicles) || 2,
      vehicleCapacity: Number(params.vehicleCapacity) || 60,
    };

    runOptimization(SAMPLE_LOCATIONS, safeParams);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-emerald-400">
          Hybrid ABC-GA Vehicle Routing Problem
        </h1>
        <p className="text-slate-400 text-sm">
          Optimasi rute pengiriman barang berbasis Pure Client-Side React + Web Worker
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Kontrol Form */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Parameter Optimasi</h2>
          
          {/* Input Maksimal Iterasi */}
          <div>
            <label className="text-xs text-slate-400">Maksimal Iterasi</label>
            <input
              type="number"
              value={isNaN(params.maxIterations) ? "" : params.maxIterations}
              onChange={(e) =>
                setParams({
                  ...params,
                  maxIterations: e.target.value === "" ? "" : parseInt(e.target.value, 10),
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm mt-1 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Input Jumlah Kendaraan */}
          <div>
            <label className="text-xs text-slate-400">Jumlah Kendaraan</label>
            <input
              type="number"
              value={isNaN(params.numVehicles) ? "" : params.numVehicles}
              onChange={(e) =>
                setParams({
                  ...params,
                  numVehicles: e.target.value === "" ? "" : parseInt(e.target.value, 10),
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm mt-1 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Input Kapasitas Kendaraan */}
          <div>
            <label className="text-xs text-slate-400">Kapasitas Kendaraan (kg)</label>
            <input
              type="number"
              value={isNaN(params.vehicleCapacity) ? "" : params.vehicleCapacity}
              onChange={(e) =>
                setParams({
                  ...params,
                  vehicleCapacity: e.target.value === "" ? "" : parseInt(e.target.value, 10),
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm mt-1 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Tombol Eksekusi */}
          <button
            onClick={handleRun}
            disabled={isCalculating}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 font-semibold rounded-lg text-slate-950 transition disabled:opacity-50 mt-2"
          >
            {isCalculating ? "Memproses ABC-GA..." : "Jalankan Optimasi"}
          </button>

          {/* Panel Ringkasan Hasil */}
          {result && (
            <div className="mt-4 p-3 bg-slate-900 rounded-lg border border-slate-700 text-sm space-y-2">
              <div>
                <p className="text-slate-400 text-xs">Total Jarak Terbaik:</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {result.totalDistance ? result.totalDistance.toFixed(2) : "0.00"} KM
                </p>
              </div>
              {result.totalPenalty > 0 && (
                <div className="text-xs text-red-400">
                  ⚠️ Terkena Penalti Overload: +{result.totalPenalty.toFixed(0)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel Visualisasi Peta & Grafik */}
        <div className="lg:col-span-2 space-y-6">
          <MapView locations={SAMPLE_LOCATIONS} routes={result?.routes} />
          <FitnessChart data={progress} />
        </div>
      </div>
    </div>
  );
}