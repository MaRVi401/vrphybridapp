import React, { useState, useEffect } from "react";
import MapView from "./components/MapView";
import FitnessChart from "./components/FitnessChart";
import { useVrpSolver } from "./hooks/useVrpSolver";

const defaultLocations = [
  {
    id: "depot-1",
    name: "Alun-Alun Indramayu (Depot)",
    lat: -6.3265,
    lng: 108.32,
    demand: 0,
    isDepot: true,
  },
  {
    id: "loc-1",
    name: "Pasar Karangampel",
    lat: -6.4633,
    lng: 108.4522,
    demand: 12,
    isDepot: false,
  },
  {
    id: "loc-2",
    name: "Kecamatan Jatibarang",
    lat: -6.4712,
    lng: 108.3075,
    demand: 8,
    isDepot: false,
  },
  {
    id: "loc-3",
    name: "Kecamatan Losarang",
    lat: -6.3985,
    lng: 108.1485,
    demand: 15,
    isDepot: false,
  },
  {
    id: "loc-4",
    name: "Kecamatan Haurgeulis",
    lat: -6.4589,
    lng: 107.9421,
    demand: 10,
    isDepot: false,
  },
  {
    id: "loc-5",
    name: "Pelabuhan Eretan",
    lat: -6.3021,
    lng: 108.0125,
    demand: 18,
    isDepot: false,
  },
  {
    id: "loc-6",
    name: "POLINDRA",
    lat: -6.4063,
    lng: 108.2825,
    demand: 9,
    isDepot: false,
  },
];

// Warna sinkron dengan garis rute di MapView.jsx
const routeColors = [
  "#E63946",
  "#2A9D8F",
  "#F4A261",
  "#9C27B0",
  "#3F51B5",
  "#00BCD4",
  "#E91E63",
  "#8BC34A",
];

export default function App() {
  const [locations, setLocations] = useState(defaultLocations);
  const [algorithm, setAlgorithm] = useState("HYBRID");
  const [params, setParams] = useState({
    capacity: 35,
    vehicles: 3,
    generations: 100,
    popSize: 40,
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showTradeOff, setShowTradeOff] = useState(false);
  const [isRouteOutdated, setIsRouteOutdated] = useState(false);
  const [mobileTab, setMobileTab] = useState("result"); // 'result' | 'locations' | 'params'

  const [manualInput, setManualInput] = useState({
    name: "",
    lat: "",
    lng: "",
    demand: 10,
    isDepot: false,
  });

  const [editingLoc, setEditingLoc] = useState(null);
  const { isCalculating, result, benchmarkResult, runSolver } = useVrpSolver();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const updateLocations = (newLocations) => {
    setLocations(newLocations);
    setIsRouteOutdated(true);
  };

  const handleRunOptimization = () => {
    const hasDepot = locations.some((l) => l.isDepot);
    const customerCount = locations.filter((l) => !l.isDepot).length;

    if (!hasDepot || customerCount === 0) {
      alert("Pastikan terdapat minimal 1 Depot dan 1 titik pelanggan.");
      return;
    }
    if (
      params.capacity <= 0 ||
      params.vehicles <= 0 ||
      params.generations <= 0 ||
      params.popSize < 2
    ) {
      alert("Parameter Kapasitas, Armada, Generasi (>=1), dan PopSize (>=2) harus valid.");
      return;
    }

    setIsRouteOutdated(false);
    setShowTradeOff(false);
    setMobileTab("result");
    runSolver(algorithm, locations, params);
  };

  const handleMapClick = (latlng) => {
    const hasDepot = locations.some((l) => l.isDepot);
    const newLoc = {
      id: `loc-${Date.now()}`,
      name: `Titik Peta ${locations.length + 1}`,
      lat: latlng.lat,
      lng: latlng.lng,
      demand: hasDepot ? 10 : 0,
      isDepot: !hasDepot,
    };
    updateLocations([...locations, newLoc]);
  };

  const handleAddManual = (e) => {
    e.preventDefault();
    if (!manualInput.lat || !manualInput.lng) return;

    let updatedLocations = [...locations];
    if (manualInput.isDepot) {
      updatedLocations = updatedLocations.map((loc) => ({
        ...loc,
        isDepot: false,
      }));
    }

    const newLoc = {
      id: `loc-${Date.now()}`,
      name: manualInput.name.trim() || `Lokasi ${locations.length + 1}`,
      lat: parseFloat(manualInput.lat),
      lng: parseFloat(manualInput.lng),
      demand: manualInput.isDepot
        ? 0
        : Math.max(0, parseInt(manualInput.demand, 10) || 0),
      isDepot: manualInput.isDepot,
    };

    updateLocations([...updatedLocations, newLoc]);
    setManualInput({ name: "", lat: "", lng: "", demand: 10, isDepot: false });
  };

  const handleSetDepot = (id) => {
    updateLocations(
      locations.map((loc) => ({
        ...loc,
        isDepot: loc.id === id,
        demand: loc.id === id ? 0 : loc.demand > 0 ? loc.demand : 10,
      }))
    );
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingLoc) return;

    const updated = locations.map((loc) => {
      if (loc.id === editingLoc.id) {
        return {
          ...editingLoc,
          name: editingLoc.name.trim() || loc.name,
          lat: parseFloat(editingLoc.lat),
          lng: parseFloat(editingLoc.lng),
          demand: editingLoc.isDepot
            ? 0
            : Math.max(0, parseInt(editingLoc.demand, 10) || 0),
        };
      }
      if (editingLoc.isDepot) {
        return { ...loc, isDepot: false };
      }
      return loc;
    });

    updateLocations(updated);
    setEditingLoc(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let parsed = [];
        if (file.name.endsWith(".json")) {
          const raw = JSON.parse(event.target.result);
          if (!Array.isArray(raw)) throw new Error("Format JSON harus array");
          parsed = raw.map((item, idx) => ({
            id: item.id || `json-${idx}-${Date.now()}`,
            name: String(item.name || `Loc ${idx + 1}`),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lng),
            demand: item.isDepot ? 0 : parseInt(item.demand, 10) || 0,
            isDepot: Boolean(item.isDepot),
          }));
        } else if (file.name.endsWith(".csv")) {
          const lines = event.target.result
            .split(/\r?\n/)
            .filter((l) => l.trim());
          lines.slice(1).forEach((line, idx) => {
            const [name, lat, lng, demand, isDepot] = line.split(",");
            if (
              lat &&
              lng &&
              !isNaN(parseFloat(lat)) &&
              !isNaN(parseFloat(lng))
            ) {
              const depotFlag = (isDepot || "").trim().toLowerCase() === "true";
              parsed.push({
                id: `csv-${idx}-${Date.now()}`,
                name: (name || "").trim() || `Loc ${idx + 1}`,
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                demand: depotFlag ? 0 : parseInt(demand, 10) || 0,
                isDepot: depotFlag,
              });
            }
          });
        }

        if (parsed.length === 0) {
          alert("Dataset kosong atau tidak terbaca.");
          return;
        }
        if (!parsed.some((p) => p.isDepot)) {
          parsed[0].isDepot = true;
          parsed[0].demand = 0;
        }
        updateLocations(parsed);
      } catch (err) {
        alert("Format file tidak valid! Pastikan struktur CSV/JSON sesuai.");
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleExportResult = () => {
    if (!activeResult) return;
    const payload = {
      algorithm,
      params,
      totalDistanceKm: Number(activeResult.bestDistance.toFixed(2)),
      executionTimeMs: activeResult.executionTime || activeResult.time,
      isFeasible: activeResult.isFeasible,
      routes: activeResult.bestRoutes.map((r, idx) => ({
        armada: idx + 1,
        load: r.reduce((sum, cIdx) => sum + (locations[cIdx]?.demand || 0), 0),
        stops: r.map((cIdx) => locations[cIdx]?.name),
      })),
      benchmark: activeBenchmark || null,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vrp-result-${algorithm.toLowerCase()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeResult = !isRouteOutdated ? result : null;
  const activeBenchmark = !isRouteOutdated ? benchmarkResult : null;
  const totalCustomerDemand = locations
    .filter((l) => !l.isDepot)
    .reduce((sum, l) => sum + (l.demand || 0), 0);
  const totalFleetCapacity = params.capacity * params.vehicles;
  const isCapacityEnough = totalCustomerDemand <= totalFleetCapacity;

  const cardSurface = isDarkMode
    ? "bg-slate-800/95 border-slate-700/80"
    : "bg-white border-slate-200/90";

  const inputSurface = isDarkMode
    ? "bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
    : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none";

  return (
    <div
      className={`min-h-screen lg:h-screen w-full p-2.5 sm:p-3.5 pb-20 lg:pb-3.5 font-sans flex flex-col lg:overflow-hidden transition-colors duration-200 ${
        isDarkMode
          ? "bg-slate-950 text-slate-100"
          : "bg-slate-100 text-slate-800"
      }`}
    >
      {/* 1. Sticky Header */}
      <header
        className={`sticky top-2 z-30 min-h-[3.25rem] px-3 sm:px-4 py-2 lg:py-0 rounded-xl shadow-sm border backdrop-blur-md flex items-center justify-between gap-2 shrink-0 mb-3 transition-colors ${cardSurface}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shrink-0"></span>
          <h1 className="text-sm sm:text-base font-black tracking-tight truncate">
            VRP Solver Indramayu
          </h1>
          <span
            className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold border shrink-0 ${
              isDarkMode
                ? "bg-indigo-950/80 text-indigo-300 border-indigo-800"
                : "bg-indigo-50 text-indigo-700 border-indigo-200"
            }`}
          >
            {algorithm}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Badge Kapasitas Total (Tampil di tablet/desktop) */}
          <div
            className={`hidden md:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border ${
              isCapacityEnough
                ? isDarkMode
                  ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
                : isDarkMode
                  ? "bg-rose-950/50 border-rose-800 text-rose-300"
                  : "bg-rose-50 border-rose-200 text-rose-700"
            }`}
          >
            <span>Muatan:</span>
            <strong>
              {totalCustomerDemand} / {totalFleetCapacity}
            </strong>
          </div>

          {activeResult && (
            <button
              onClick={handleExportResult}
              title="Download Hasil JSON"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isDarkMode
                  ? "bg-slate-700/80 border-slate-600 text-slate-200 hover:bg-slate-600"
                  : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-200"
              }`}
            >
              ⬇ <span className="hidden sm:inline">Export</span>
            </button>
          )}

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
              isDarkMode
                ? "bg-slate-700 border-slate-600 text-amber-300 hover:bg-slate-600"
                : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {isDarkMode ? "☀️" : "🌙"}
            <span className="hidden sm:inline">
              {isDarkMode ? "Light" : "Dark"}
            </span>
          </button>

          {/* Tombol Optimasi Utama (Desktop) */}
          <button
            onClick={handleRunOptimization}
            disabled={isCalculating}
            className="hidden lg:inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:bg-slate-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
          >
            {isCalculating ? "⏳ Kalkulasi..." : "▶ Jalankan Optimasi"}
          </button>
        </div>
      </header>

      {/* 2. Main Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 lg:overflow-hidden">
        {/* KOLOM KANAN (DESKTOP) / ATAS (MOBILE): Peta + Panel Hasil */}
        <div className="order-1 lg:order-2 lg:col-span-8 flex flex-col gap-3 min-h-0">
          {/* Peta Interaktif (Selalu mounted agar Leaflet responsif tanpa grey-tile) */}
          <div
            className={`p-2 rounded-xl shadow-sm border h-[300px] sm:h-[380px] lg:h-auto lg:flex-1 flex flex-col min-h-0 relative transition-colors ${cardSurface}`}
          >
            <div className="flex-1 rounded-lg overflow-hidden relative z-0">
              <MapView
                locations={locations}
                routes={activeResult ? activeResult.bestRoutes : []}
                onMapClick={handleMapClick}
              />
            </div>
            <div
              className={`mt-1.5 px-1 flex justify-between items-center text-[10px] opacity-60`}
            >
              <span>💡 Ketuk peta untuk menambah titik pelanggan baru</span>
              <span>{locations.length} Titik Terdaftar</span>
            </div>
          </div>

          {/* Navigasi Tab Khusus Mobile & Tablet (< lg) */}
          <div
            className={`grid grid-cols-3 gap-1 p-1 rounded-xl border lg:hidden ${cardSurface}`}
          >
            {[
              { id: "result", label: "📊 Hasil & Grafik" },
              { id: "locations", label: `📍 Lokasi (${locations.length})` },
              { id: "params", label: "⚙️ Parameter" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition ${
                  mobileTab === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : isDarkMode
                      ? "text-slate-400 hover:text-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel Hasil & Grafik (Tampil di Desktop, atau saat mobileTab === 'result') */}
          <div
            className={`${
              mobileTab === "result" ? "flex" : "hidden lg:flex"
            } h-auto md:h-56 lg:h-52 p-3 rounded-xl shadow-sm border shrink-0 flex-col md:flex-row gap-3 lg:overflow-hidden transition-colors ${cardSurface}`}
          >
            {/* Status Hasil Rute */}
            <div
              className={`w-full md:w-5/12 flex flex-col justify-between border-b md:border-b-0 md:border-r pb-3 md:pb-0 md:pr-3 min-h-0 ${
                isDarkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="flex flex-col h-full min-h-0">
                <div className="flex justify-between items-center mb-1.5 shrink-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider opacity-80">
                    {showTradeOff ? "💡 Analisis Trade-Off" : "Hasil Optimasi"}
                  </h3>
                  <button
                    onClick={() => setShowTradeOff(!showTradeOff)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition ${
                      isDarkMode
                        ? "bg-indigo-950 text-indigo-300 hover:bg-indigo-900"
                        : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    }`}
                  >
                    {showTradeOff ? "Lihat Rute" : "Trade-Off"}
                  </button>
                </div>

                {showTradeOff ? (
                  <div className="flex-1 min-h-0 overflow-y-auto text-[11px]">
                    <table className="w-full text-left border-collapse">
                      <thead
                        className={`text-[10px] uppercase sticky top-0 ${
                          isDarkMode
                            ? "bg-slate-900 text-slate-400"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <tr>
                          <th className="p-1.5">Armada</th>
                          <th className="p-1.5">Jarak</th>
                          <th className="p-1.5">Waktu</th>
                          <th className="p-1.5">BBM</th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y ${
                          isDarkMode ? "divide-slate-700" : "divide-slate-200"
                        }`}
                      >
                        <tr>
                          <td className="p-1.5 font-bold">Sedikit</td>
                          <td className="p-1.5 text-emerald-500 font-semibold">
                            Pendek
                          </td>
                          <td className="p-1.5 text-amber-500 font-semibold">
                            Lama
                          </td>
                          <td className="p-1.5 text-emerald-500 font-semibold">
                            Hemat
                          </td>
                        </tr>
                        <tr>
                          <td className="p-1.5 font-bold">Banyak</td>
                          <td className="p-1.5 text-rose-500 font-semibold">
                            Panjang
                          </td>
                          <td className="p-1.5 text-emerald-500 font-semibold">
                            Cepat
                          </td>
                          <td className="p-1.5 text-rose-500 font-semibold">
                            Boros
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : activeResult ? (
                  <div className="flex flex-col h-full min-h-0 space-y-1.5">
                    <div className="shrink-0 flex items-baseline justify-between gap-2">
                      <div>
                        <span className="text-xl sm:text-2xl font-black text-indigo-500">
                          {activeResult.bestDistance.toFixed(2)} km
                        </span>
                        <div className="text-[10px] opacity-60">
                          Waktu:{" "}
                          <strong>
                            {activeResult.executionTime || activeResult.time} ms
                          </strong>{" "}
                          • {activeResult.bestRoutes.length} Armada
                        </div>
                      </div>

                      {activeResult.isFeasible === false ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30">
                          Overload
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                          Optimal Valid
                        </span>
                      )}
                    </div>

                    <div
                      className={`max-h-52 md:max-h-none flex-1 min-h-0 overflow-y-auto space-y-1.5 text-[11px] border-t pt-1.5 pr-1 ${
                        isDarkMode ? "border-slate-700" : "border-slate-100"
                      }`}
                    >
                      {activeResult.bestRoutes.map((r, i) => {
                        const routeLoad = r.reduce(
                          (sum, cIdx) => sum + (locations[cIdx]?.demand || 0),
                          0
                        );
                        const isOverload = routeLoad > params.capacity;
                        const badgeColor =
                          routeColors[i % routeColors.length];

                        return (
                          <div
                            key={i}
                            style={{ borderLeftColor: badgeColor }}
                            className={`p-2 rounded-lg border border-l-4 leading-snug ${
                              isDarkMode
                                ? "bg-slate-900/90 border-slate-700 text-slate-200"
                                : "bg-slate-50 border-slate-200/80 text-slate-700"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="font-bold text-[11px]">
                                Armada #{i + 1}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  isOverload
                                    ? "bg-rose-500/15 text-rose-500"
                                    : "bg-emerald-500/15 text-emerald-500"
                                }`}
                              >
                                {routeLoad}/{params.capacity} unit
                              </span>
                            </div>
                            <div className="text-[10px] opacity-85">
                              Depot ➔{" "}
                              {r.map((c) => locations[c]?.name).join(" ➔ ")} ➔
                              Depot
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center text-xs opacity-60 italic py-4 px-2">
                    {isRouteOutdated
                      ? "Data lokasi diperbarui. Jalankan optimasi untuk menghitung rute baru."
                      : "Tekan 'Jalankan Optimasi' untuk memulai pencarian rute terbaik."}
                  </div>
                )}
              </div>
            </div>

            {/* Grafik Konvergensi / Tabel Benchmark */}
            <div className="w-full md:w-7/12 h-44 md:h-full flex flex-col min-h-0 overflow-hidden">
              {activeBenchmark ? (
                <div className="h-full flex flex-col min-h-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-1.5 opacity-80">
                    🔥 Perbandingan Benchmark
                  </h3>
                  <div className="flex-1 overflow-x-auto overflow-y-auto text-xs">
                    <table className="w-full text-left min-w-[340px]">
                      <thead
                        className={`text-[10px] uppercase sticky top-0 ${
                          isDarkMode
                            ? "bg-slate-900 text-slate-400"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <tr>
                          <th className="p-1.5">Algoritma</th>
                          <th className="p-1.5">Total Jarak</th>
                          <th className="p-1.5">Waktu</th>
                          <th className="p-1.5">Armada</th>
                          <th className="p-1.5">Status</th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y text-[11px] ${
                          isDarkMode ? "divide-slate-700" : "divide-slate-200"
                        }`}
                      >
                        {Object.entries(activeBenchmark).map(([alg, d]) => (
                          <tr key={alg}>
                            <td className="p-1.5 font-extrabold text-indigo-500">
                              {alg}
                            </td>
                            <td className="p-1.5 font-bold">
                              {d.bestDistance.toFixed(2)} km
                            </td>
                            <td className="p-1.5">{d.time} ms</td>
                            <td className="p-1.5">
                              {d.bestRoutes.length} Unit
                            </td>
                            <td className="p-1.5">
                              {d.isFeasible === false ? (
                                <span className="text-rose-500 font-bold">
                                  Overload
                                </span>
                              ) : (
                                <span className="text-emerald-500 font-bold">
                                  Valid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col min-h-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">
                    Kurva Konvergensi Fitness
                  </h3>
                  <div className="flex-1 min-h-0 w-full">
                    <FitnessChart
                      historyData={activeResult ? activeResult.history : []}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KIRI (DESKTOP) / TAB LOKASI & PARAMETER (MOBILE) */}
        <div className="order-2 lg:order-1 lg:col-span-4 flex flex-col gap-3 min-h-0">
          {/* Panel Parameter Algoritma */}
          <div
            className={`${
              mobileTab === "params" ? "block" : "hidden lg:block"
            } p-3 rounded-xl shadow-sm border shrink-0 space-y-2.5 transition-colors ${cardSurface}`}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-wider opacity-80">
                Konfigurasi Algoritma
              </h2>
              <input
                type="file"
                accept=".csv, .json"
                onChange={handleFileUpload}
                id="file-upload"
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="text-[11px] text-indigo-500 hover:underline font-bold cursor-pointer"
              >
                📂 Import CSV/JSON
              </label>
            </div>

            <div className="space-y-2 text-xs">
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className={`w-full p-2 lg:p-1.5 border rounded-lg font-bold text-xs ${
                  isDarkMode
                    ? "bg-slate-900 border-slate-700 text-indigo-300"
                    : "bg-slate-50 border-slate-200 text-indigo-700"
                }`}
              >
                <option value="HYBRID">⚡ Hybrid (GA + ABC)</option>
                <option value="GA">🧬 Genetic Algorithm (GA)</option>
                <option value="ABC">🐝 Artificial Bee Colony (ABC)</option>
                <option value="BENCHMARK">🔥 Benchmark Semua Algoritma</option>
              </select>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                {[
                  { key: "capacity", label: "Kapasitas" },
                  { key: "vehicles", label: "Armada" },
                  { key: "generations", label: "Generasi" },
                  { key: "popSize", label: "Populasi" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="opacity-70 block truncate mb-0.5 font-medium">
                      {label}
                    </label>
                    <input
                      type="number"
                      min={key === "popSize" ? 2 : 1}
                      value={params[key]}
                      onChange={(e) =>
                        setParams({
                          ...params,
                          [key]: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className={`w-full p-2 lg:p-1 border rounded-lg text-center font-bold text-xs ${inputSurface}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel Form Tambah Lokasi Manual */}
          <div
            className={`${
              mobileTab === "locations" ? "block" : "hidden lg:block"
            } p-3 rounded-xl shadow-sm border shrink-0 space-y-2 transition-colors ${cardSurface}`}
          >
            <h2 className="text-xs font-bold uppercase tracking-wider opacity-80">
              Tambah Titik Lokasi
            </h2>
            <form onSubmit={handleAddManual} className="space-y-2 text-xs">
              <input
                type="text"
                placeholder="Nama Lokasi (cth: Pasar Baru)"
                value={manualInput.name}
                onChange={(e) =>
                  setManualInput({ ...manualInput, name: e.target.value })
                }
                className={`w-full px-2.5 py-2 lg:py-1.5 border rounded-lg transition ${inputSurface}`}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude (-6.xxx)"
                  value={manualInput.lat}
                  onChange={(e) =>
                    setManualInput({ ...manualInput, lat: e.target.value })
                  }
                  className={`px-2.5 py-2 lg:py-1.5 border rounded-lg transition ${inputSurface}`}
                  required
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude (108.xxx)"
                  value={manualInput.lng}
                  onChange={(e) =>
                    setManualInput({ ...manualInput, lng: e.target.value })
                  }
                  className={`px-2.5 py-2 lg:py-1.5 border rounded-lg transition ${inputSurface}`}
                  required
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] opacity-70">Demand:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={manualInput.demand}
                    disabled={manualInput.isDepot}
                    onChange={(e) =>
                      setManualInput({ ...manualInput, demand: e.target.value })
                    }
                    className={`w-20 px-2 py-1.5 lg:py-1 border rounded-lg disabled:opacity-40 font-semibold ${inputSurface}`}
                  />
                </div>
                <label className="flex items-center text-[11px] gap-1.5 cursor-pointer font-semibold text-rose-500">
                  <input
                    type="checkbox"
                    checked={manualInput.isDepot}
                    onChange={(e) =>
                      setManualInput({
                        ...manualInput,
                        isDepot: e.target.checked,
                      })
                    }
                    className="rounded accent-rose-600"
                  />
                  <span>Jadikan Depot</span>
                </label>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg font-bold transition ml-auto bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  + Tambah
                </button>
              </div>
            </form>
          </div>

          {/* List Kelola Lokasi */}
          <div
            className={`${
              mobileTab === "locations" ? "flex" : "hidden lg:flex"
            } p-3 rounded-xl shadow-sm border max-h-96 lg:max-h-none lg:flex-1 flex-col min-h-0 transition-colors ${cardSurface}`}
          >
            <div className="flex justify-between items-center mb-2 shrink-0">
              <h2 className="text-xs font-bold uppercase tracking-wider opacity-80">
                Daftar Titik ({locations.length})
              </h2>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => updateLocations(defaultLocations)}
                  className="text-[11px] text-indigo-500 hover:underline font-bold"
                >
                  Reset Default
                </button>
                <button
                  onClick={() => updateLocations([])}
                  className="text-[11px] text-rose-500 hover:underline font-bold"
                >
                  Hapus Semua
                </button>
              </div>
            </div>

            <div
              className={`flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs border-t pt-2 ${
                isDarkMode ? "border-slate-700" : "border-slate-100"
              }`}
            >
              {locations.length === 0 ? (
                <div className="text-center py-6 text-xs opacity-50 italic">
                  Belum ada lokasi. Ketuk peta atau tambahkan manual.
                </div>
              ) : (
                locations.map((loc) => (
                  <div
                    key={loc.id}
                    className={`p-2 rounded-lg border flex justify-between items-center gap-2 transition ${
                      loc.isDepot
                        ? isDarkMode
                          ? "bg-rose-950/35 border-rose-800/80"
                          : "bg-rose-50/90 border-rose-200"
                        : isDarkMode
                          ? "bg-slate-900/90 border-slate-700/80"
                          : "bg-slate-50 border-slate-200/70"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold flex items-center gap-1.5 truncate text-xs">
                        <span
                          className={`truncate ${
                            loc.isDepot ? "text-rose-500" : "opacity-95"
                          }`}
                        >
                          {loc.name}
                        </span>
                        {loc.isDepot && (
                          <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.5 rounded font-extrabold shrink-0">
                            DEPOT
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] opacity-60 truncate mt-0.5">
                        {loc.isDepot
                          ? "Pusat Distribusi"
                          : `Demand: ${loc.demand} unit`}{" "}
                        • ({loc.lat.toFixed(4)}, {loc.lng.toFixed(4)})
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!loc.isDepot && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDepot(loc.id);
                          }}
                          className={`px-2 py-1.5 lg:py-1 rounded-md text-[10px] font-bold transition ${
                            isDarkMode
                              ? "bg-rose-950 text-rose-300 hover:bg-rose-900"
                              : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                          }`}
                        >
                          Depot
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingLoc(loc);
                        }}
                        className={`px-2 py-1.5 lg:py-1 rounded-md text-[10px] font-bold transition ${
                          isDarkMode
                            ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        }`}
                      >
                        Edit
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateLocations(
                            locations.filter((l) => l.id !== loc.id)
                          );
                        }}
                        className="text-rose-500 hover:bg-rose-500/10 rounded-md font-bold px-2 py-1 text-xs transition"
                        title="Hapus lokasi"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sticky Bottom Action Bar (Khusus Mobile & Tablet < lg) */}
      <div
        className={`fixed bottom-0 inset-x-0 z-30 p-2.5 border-t backdrop-blur-md flex items-center justify-between gap-3 lg:hidden ${
          isDarkMode
            ? "bg-slate-900/95 border-slate-800"
            : "bg-white/95 border-slate-200"
        }`}
      >
        <div className="text-[11px] leading-tight">
          <div className="opacity-60">Total Muatan / Kapasitas</div>
          <div
            className={`font-extrabold ${
              isCapacityEnough ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {totalCustomerDemand} / {totalFleetCapacity} unit ({params.vehicles}{" "}
            Armada)
          </div>
        </div>

        <button
          onClick={handleRunOptimization}
          disabled={isCalculating}
          className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:bg-slate-500 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold transition shadow-md shrink-0"
        >
          {isCalculating ? "⏳ Menghitung..." : "▶ Jalankan Optimasi"}
        </button>
      </div>

      {/* Modal Edit Pop-up */}
      {editingLoc && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div
            className={`rounded-2xl p-4 max-w-sm w-full shadow-2xl border space-y-3 ${cardSurface}`}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Edit Data Lokasi
            </h3>
            <form onSubmit={handleSaveEdit} className="space-y-2.5 text-xs">
              <div>
                <label className="text-[10px] opacity-60 block mb-1">
                  Nama Lokasi
                </label>
                <input
                  type="text"
                  value={editingLoc.name}
                  onChange={(e) =>
                    setEditingLoc({ ...editingLoc, name: e.target.value })
                  }
                  className={`w-full p-2 border rounded-lg ${inputSurface}`}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] opacity-60 block mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editingLoc.lat}
                    onChange={(e) =>
                      setEditingLoc({ ...editingLoc, lat: e.target.value })
                    }
                    className={`w-full p-2 border rounded-lg ${inputSurface}`}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] opacity-60 block mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editingLoc.lng}
                    onChange={(e) =>
                      setEditingLoc({ ...editingLoc, lng: e.target.value })
                    }
                    className={`w-full p-2 border rounded-lg ${inputSurface}`}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] opacity-60 block mb-1">
                  Demand (Unit)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingLoc.demand}
                  disabled={editingLoc.isDepot}
                  onChange={(e) =>
                    setEditingLoc({ ...editingLoc, demand: e.target.value })
                  }
                  className={`w-full p-2 border rounded-lg disabled:opacity-40 ${inputSurface}`}
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-rose-500 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editingLoc.isDepot}
                  onChange={(e) =>
                    setEditingLoc({ ...editingLoc, isDepot: e.target.checked })
                  }
                  className="accent-rose-600"
                />
                <span>Set sebagai Depot Utama</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLoc(null)}
                  className={`px-3.5 py-2 rounded-lg font-semibold ${
                    isDarkMode
                      ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}