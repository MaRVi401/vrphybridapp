import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import FitnessChart from './components/FitnessChart';
import { useVrpSolver } from './hooks/useVrpSolver';

const defaultLocations = [
  { id: 'depot-1', name: 'Alun-Alun Indramayu (Depot)', lat: -6.3265, lng: 108.3200, demand: 0, isDepot: true },
  { id: 'loc-1', name: 'Pasar Karangampel', lat: -6.4633, lng: 108.4522, demand: 12, isDepot: false },
  { id: 'loc-2', name: 'Kecamatan Jatibarang', lat: -6.4712, lng: 108.3075, demand: 8, isDepot: false },
  { id: 'loc-3', name: 'Kecamatan Losarang', lat: -6.3985, lng: 108.1485, demand: 15, isDepot: false },
  { id: 'loc-4', name: 'Kecamatan Haurgeulis', lat: -6.4589, lng: 107.9421, demand: 10, isDepot: false },
  { id: 'loc-5', name: 'Pelabuhan Eretan', lat: -6.3021, lng: 108.0125, demand: 18, isDepot: false },
  { id: 'loc-6', name: 'POLINDRA', lat: -6.4063, lng: 108.2825, demand: 9, isDepot: false },
];

export default function App() {
  const [locations, setLocations] = useState(defaultLocations);
  const [algorithm, setAlgorithm] = useState('HYBRID');
  const [params, setParams] = useState({
    capacity: 35,
    vehicles: 3,
    generations: 100,
    popSize: 40,
  });

  // State Mode Gelap / Terang
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showTradeOff, setShowTradeOff] = useState(false);

  const [manualInput, setManualInput] = useState({
    name: '',
    lat: '',
    lng: '',
    demand: 10,
    isDepot: false,
  });

  const [editingLoc, setEditingLoc] = useState(null);
  const { isCalculating, result, benchmarkResult, runSolver } = useVrpSolver();

  // Sinkronisasi kelas 'dark' ke tag <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleMapClick = (latlng) => {
    const newLoc = {
      id: `loc-${Date.now()}`,
      name: `Titik Peta ${locations.length}`,
      lat: latlng.lat,
      lng: latlng.lng,
      demand: 10,
      isDepot: false,
    };
    setLocations([...locations, newLoc]);
  };

  const handleAddManual = (e) => {
    e.preventDefault();
    if (!manualInput.lat || !manualInput.lng) return;

    let updatedLocations = [...locations];
    if (manualInput.isDepot) {
      updatedLocations = updatedLocations.map((loc) => ({ ...loc, isDepot: false }));
    }

    const newLoc = {
      id: `loc-${Date.now()}`,
      name: manualInput.name || `Lokasi ${locations.length}`,
      lat: parseFloat(manualInput.lat),
      lng: parseFloat(manualInput.lng),
      demand: manualInput.isDepot ? 0 : parseInt(manualInput.demand) || 0,
      isDepot: manualInput.isDepot,
    };

    setLocations([...updatedLocations, newLoc]);
    setManualInput({ name: '', lat: '', lng: '', demand: 10, isDepot: false });
  };

  const handleSetDepot = (id) => {
    setLocations(
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

    let updated = locations.map((loc) => {
      if (loc.id === editingLoc.id) {
        return {
          ...editingLoc,
          lat: parseFloat(editingLoc.lat),
          lng: parseFloat(editingLoc.lng),
          demand: editingLoc.isDepot ? 0 : parseInt(editingLoc.demand) || 0,
        };
      }
      if (editingLoc.isDepot) {
        return { ...loc, isDepot: false };
      }
      return loc;
    });

    setLocations(updated);
    setEditingLoc(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (file.name.endsWith('.json')) {
          setLocations(JSON.parse(event.target.result));
        } else if (file.name.endsWith('.csv')) {
          const lines = event.target.result.split('\n');
          const parsed = [];
          lines.slice(1).forEach((line, idx) => {
            const [name, lat, lng, demand, isDepot] = line.split(',');
            if (lat && lng) {
              parsed.push({
                id: `csv-${idx}`,
                name: name.trim() || `Loc ${idx}`,
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                demand: parseInt(demand) || 0,
                isDepot: isDepot.trim().toLowerCase() === 'true',
              });
            }
          });
          setLocations(parsed);
        }
      } catch (err) {
        alert('Format file tidak valid!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`h-screen w-screen p-3 font-sans flex flex-col overflow-hidden transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-800'
    }`}>
      
      {/* 1. Header */}
      <header className={`h-12 px-4 rounded-xl shadow-sm border flex justify-between items-center shrink-0 mb-3 transition-colors ${
        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></span>
          <h1 className="text-base font-black tracking-tight">VRP Solver Indramayu</h1>
          <span className={`text-xs px-2 py-0.5 rounded-md font-bold border ${
            isDarkMode ? 'bg-indigo-950 text-indigo-300 border-indigo-800' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
          }`}>
            {algorithm} Mode
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Button Dark / Light Mode */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
              isDarkMode ? 'bg-slate-700 border-slate-600 text-amber-300 hover:bg-slate-600' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </button>

          <button
            onClick={() => runSolver(algorithm, locations, params)}
            disabled={isCalculating}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
          >
            {isCalculating ? 'Kalkulasi...' : 'Jalankan Optimasi'}
          </button>
        </div>
      </header>

      {/* 2. Main Grid Layout */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-hidden">
        
        {/* SIDEBAR KIRI (4 Kolom) */}
        <div className="col-span-4 flex flex-col gap-3 min-h-0">
          
          {/* Panel Form Input */}
          <div className={`p-3 rounded-xl shadow-sm border shrink-0 space-y-2 transition-colors ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <h2 className="text-xs font-bold uppercase tracking-wider opacity-80">Tambah Lokasi Manual</h2>
            <form onSubmit={handleAddManual} className="space-y-1.5 text-xs">
              <input
                type="text"
                placeholder="Nama Lokasi"
                value={manualInput.name}
                onChange={(e) => setManualInput({ ...manualInput, name: e.target.value })}
                className={`w-full px-2.5 py-1 border rounded-md transition ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:outline-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:outline-indigo-500'
                }`}
              />
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude (-6.xxx)"
                  value={manualInput.lat}
                  onChange={(e) => setManualInput({ ...manualInput, lat: e.target.value })}
                  className={`px-2.5 py-1 border rounded-md transition ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  required
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude (108.xxx)"
                  value={manualInput.lng}
                  onChange={(e) => setManualInput({ ...manualInput, lng: e.target.value })}
                  className={`px-2.5 py-1 border rounded-md transition ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  required
                />
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <input
                  type="number"
                  placeholder="Demand"
                  value={manualInput.demand}
                  disabled={manualInput.isDepot}
                  onChange={(e) => setManualInput({ ...manualInput, demand: e.target.value })}
                  className={`w-24 px-2 py-1 border rounded-md disabled:opacity-50 ${
                    isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
                <label className="flex items-center text-[11px] gap-1 cursor-pointer font-semibold text-red-500">
                  <input
                    type="checkbox"
                    checked={manualInput.isDepot}
                    onChange={(e) => setManualInput({ ...manualInput, isDepot: e.target.checked })}
                  />
                  <span>Depot Utama</span>
                </label>
                <button type="submit" className={`px-3 py-1 rounded-md font-semibold transition ${
                  isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-slate-800 text-white hover:bg-slate-900'
                }`}>
                  + Tambah
                </button>
              </div>
            </form>
          </div>

          {/* Panel Parameter Algoritma */}
          <div className={`p-3 rounded-xl shadow-sm border shrink-0 space-y-2 transition-colors ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-wider opacity-80">Parameter Algoritma</h2>
              <input type="file" accept=".csv, .json" onChange={handleFileUpload} id="file-upload" className="hidden" />
              <label htmlFor="file-upload" className="text-[10px] text-indigo-400 hover:underline font-semibold cursor-pointer">
                Upload Dataset
              </label>
            </div>
            
            <div className="space-y-1.5 text-xs">
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className={`w-full p-1 border rounded-md font-semibold text-xs ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-indigo-300' : 'bg-slate-50 border-slate-200 text-indigo-600'
                }`}
              >
                <option value="HYBRID">Hybrid (GA + ABC)</option>
                <option value="GA">Genetic Algorithm (GA)</option>
                <option value="ABC">Artificial Bee Colony (ABC)</option>
                <option value="BENCHMARK">🔥 Benchmark Semua Algoritma</option>
              </select>

              <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                {['capacity', 'vehicles', 'generations', 'popSize'].map((key) => (
                  <div key={key}>
                    <label className="opacity-60 block truncate capitalize">{key === 'capacity' ? 'Kapasitas' : key === 'vehicles' ? 'Armada' : key}</label>
                    <input
                      type="number"
                      value={params[key]}
                      onChange={(e) => setParams({ ...params, [key]: parseInt(e.target.value) || 0 })}
                      className={`w-full p-1 border rounded text-center font-bold ${
                        isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* List Kelola Lokasi */}
          <div className={`p-3 rounded-xl shadow-sm border flex-1 flex flex-col min-h-0 transition-colors ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex justify-between items-center mb-1.5 shrink-0">
              <h2 className="text-xs font-bold uppercase tracking-wider opacity-80">Daftar Lokasi ({locations.length})</h2>
              <button onClick={() => setLocations([])} className="text-[10px] text-red-400 hover:underline font-semibold">
                Reset All
              </button>
            </div>

            <div className={`flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs border-t pt-1.5 ${
              isDarkMode ? 'border-slate-700' : 'border-slate-100'
            }`}>
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className={`p-1.5 rounded-lg border flex justify-between items-center transition ${
                    loc.isDepot
                      ? isDarkMode ? 'bg-red-950/40 border-red-800' : 'bg-red-50 border-red-200'
                      : isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="truncate pr-1">
                    <div className="font-bold flex items-center gap-1 truncate text-[11px]">
                      <span className={loc.isDepot ? 'text-red-400' : 'opacity-90'}>{loc.name}</span>
                      {loc.isDepot && <span className="bg-red-600 text-white text-[9px] px-1 py-0.2 rounded">Depot</span>}
                    </div>
                    <div className="text-[10px] opacity-50 truncate">
                      Demand: {loc.demand} | ({loc.lat.toFixed(3)}, {loc.lng.toFixed(3)})
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!loc.isDepot && (
                      <button
                        onClick={() => handleSetDepot(loc.id)}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          isDarkMode ? 'bg-red-950 text-red-300 hover:bg-red-900' : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        Set Depot
                      </button>
                    )}
                    <button
                      onClick={() => setEditingLoc(loc)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setLocations(locations.filter((l) => l.id !== loc.id))}
                      className="text-red-400 hover:text-red-500 font-bold px-1 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* UTAMA KANAN (8 Kolom) */}
        <div className="col-span-8 flex flex-col gap-3 min-h-0">
          
          {/* Peta Interaktif */}
          <div className={`p-2 rounded-xl shadow-sm border flex-1 flex flex-col min-h-0 transition-colors ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex-1 rounded-lg overflow-hidden relative">
              <MapView locations={locations} routes={result ? result.bestRoutes : []} onMapClick={handleMapClick} />
            </div>
          </div>

          {/* Bottom Panel Result */}
          <div className={`h-48 p-3 rounded-xl shadow-sm border shrink-0 flex gap-3 overflow-hidden transition-colors ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            
            {/* Status Hasil Rute (Kiri) */}
            <div className={`w-1/3 flex flex-col justify-between border-r pr-3 min-h-0 ${
              isDarkMode ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <div className="flex flex-col h-full min-h-0">
                
                {/* Header Switcher Rute vs TradeOff */}
                <div className="flex justify-between items-center mb-1.5 shrink-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider opacity-80">
                    {showTradeOff ? '💡 Analisis Trade-Off' : 'Hasil Optimasi'}
                  </h3>
                  <button
                    onClick={() => setShowTradeOff(!showTradeOff)}
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isDarkMode ? 'bg-indigo-950 text-indigo-300' : 'bg-indigo-50 text-indigo-600'
                    }`}
                  >
                    {showTradeOff ? 'Rute' : 'Analisis'}
                  </button>
                </div>

                {showTradeOff ? (
                  <div className="flex-1 min-h-0 overflow-y-auto text-[10px]">
                    <table className="w-full text-left border-collapse">
                      <thead className={`text-[9px] uppercase sticky top-0 ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                        <tr>
                          <th className="p-1">Armada</th>
                          <th className="p-1">Jarak</th>
                          <th className="p-1">Waktu</th>
                          <th className="p-1">BBM</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        <tr>
                          <td className="p-1 font-bold">Sedikit</td>
                          <td className="p-1 text-emerald-400">Pendek</td>
                          <td className="p-1 text-amber-400">Lama</td>
                          <td className="p-1 text-emerald-400">Hemat</td>
                        </tr>
                        <tr>
                          <td className="p-1 font-bold">Banyak</td>
                          <td className="p-1 text-rose-400">Panjang</td>
                          <td className="p-1 text-emerald-400">Cepat</td>
                          <td className="p-1 text-rose-400">Boros</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : result ? (
                  <div className="flex flex-col h-full min-h-0 space-y-1">
                    <div className="shrink-0">
                      <div className="text-xl font-black text-indigo-500">
                        {result.bestDistance.toFixed(2)} km
                      </div>
                      <div className="text-[10px] opacity-50">
                        Waktu Komputasi: {result.executionTime} ms
                      </div>
                    </div>

                    <div className={`flex-1 min-h-0 overflow-y-auto space-y-1 text-[10px] border-t pt-1.5 pr-1 ${
                      isDarkMode ? 'border-slate-700' : 'border-slate-100'
                    }`}>
                      {result.bestRoutes.map((r, i) => (
                        <div key={i} className={`p-1.5 rounded border leading-tight ${
                          isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'
                        }`}>
                          <span className="font-bold block text-[10px] mb-0.5">
                            Armada #{i + 1}:
                          </span>
                          <span>
                            Depot ➔ {r.map((c) => locations[c]?.name).join(' ➔ ')} ➔ Depot
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs opacity-50 italic py-4">
                    Klik 'Jalankan Optimasi' untuk kalkulasi rute.
                  </div>
                )}

              </div>
            </div>

            {/* Grafik / Benchmark (Kanan) */}
            <div className="w-2/3 flex flex-col min-h-0 overflow-hidden">
              {benchmarkResult ? (
                <div className="h-full flex flex-col min-h-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">🔥 Tabel Benchmark</h3>
                  <div className="flex-1 overflow-y-auto text-xs">
                    <table className="w-full text-left">
                      <thead className={`text-[10px] uppercase sticky top-0 ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                        <tr>
                          <th className="p-1">Algoritma</th>
                          <th className="p-1">Total Jarak</th>
                          <th className="p-1">Waktu</th>
                          <th className="p-1">Armada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700 text-[11px]">
                        {Object.entries(benchmarkResult).map(([alg, d]) => (
                          <tr key={alg}>
                            <td className="p-1 font-bold text-indigo-400">{alg}</td>
                            <td className="p-1 font-semibold">{d.bestDistance.toFixed(2)} km</td>
                            <td className="p-1">{d.time} ms</td>
                            <td className="p-1">{d.bestRoutes.length} Unit</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col min-h-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Grafik Konvergensi</h3>
                  <div className="flex-1 min-h-0 w-full">
                    <FitnessChart historyData={result ? result.history : []} isDarkMode={isDarkMode} />
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Modal Edit Pop-up */}
      {editingLoc && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl p-4 max-w-xs w-full shadow-2xl space-y-3 ${
            isDarkMode ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'bg-white text-slate-800'
          }`}>
            <h3 className="text-xs font-bold uppercase">Edit Data Lokasi</h3>
            <form onSubmit={handleSaveEdit} className="space-y-2 text-xs">
              <input
                type="text"
                value={editingLoc.name}
                onChange={(e) => setEditingLoc({ ...editingLoc, name: e.target.value })}
                className={`w-full p-1.5 border rounded-md ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                required
              />
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="number"
                  step="any"
                  value={editingLoc.lat}
                  onChange={(e) => setEditingLoc({ ...editingLoc, lat: e.target.value })}
                  className={`w-full p-1.5 border rounded-md ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  required
                />
                <input
                  type="number"
                  step="any"
                  value={editingLoc.lng}
                  onChange={(e) => setEditingLoc({ ...editingLoc, lng: e.target.value })}
                  className={`w-full p-1.5 border rounded-md ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  required
                />
              </div>
              <input
                type="number"
                value={editingLoc.demand}
                disabled={editingLoc.isDepot}
                onChange={(e) => setEditingLoc({ ...editingLoc, demand: e.target.value })}
                className={`w-full p-1.5 border rounded-md disabled:opacity-50 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
              />
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-red-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingLoc.isDepot}
                  onChange={(e) => setEditingLoc({ ...editingLoc, isDepot: e.target.checked })}
                />
                <span>Set Depot Utama</span>
              </label>

              <div className="flex justify-end gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLoc(null)}
                  className={`px-3 py-1 rounded font-semibold ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}