import React, { useState } from 'react';
import MapView from './components/MapView';
import FitnessChart from './components/FitnessChart';
import { useVrpSolver } from './hooks/useVrpSolver';

// Default dataset berpusat di Indramayu, Jawa Barat
const defaultLocations = [
  { id: 'depot-1', name: 'Alun-Alun Indramayu (Depot Pusat)', lat: -6.3265, lng: 108.3200, demand: 0, isDepot: true },
  { id: 'loc-1', name: 'Pasar Karangampel', lat: -6.4633, lng: 108.4522, demand: 12, isDepot: false },
  { id: 'loc-2', name: 'Kecamatan Jatibarang', lat: -6.4712, lng: 108.3075, demand: 8, isDepot: false },
  { id: 'loc-3', name: 'Kecamatan Losarang', lat: -6.3985, lng: 108.1485, demand: 15, isDepot: false },
  { id: 'loc-4', name: 'Kecamatan Haurgeulis', lat: -6.4589, lng: 107.9421, demand: 10, isDepot: false },
  { id: 'loc-5', name: 'Pelabuhan Eretan', lat: -6.3021, lng: 108.0125, demand: 18, isDepot: false },
  { id: 'loc-6', name: 'Politeknik Negeri Indramayu (POLINDRA)', lat: -6.4063, lng: 108.2825, demand: 9, isDepot: false },
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

  // State Form Tambah Manual
  const [manualInput, setManualInput] = useState({
    name: '',
    lat: '',
    lng: '',
    demand: 10,
    isDepot: false,
  });

  // State Modal Edit
  const [editingLoc, setEditingLoc] = useState(null);

  const { isCalculating, result, benchmarkResult, runSolver } = useVrpSolver();

  // Handle Klik Peta untuk Tambah Lokasi
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

  // Handle Tambah Manual
  const handleAddManual = (e) => {
    e.preventDefault();
    if (!manualInput.lat || !manualInput.lng) return;

    let updatedLocations = [...locations];

    // Jika yang ditambah adalah Depot, atur titik lain agar bukan depot
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

  // Fungsi Ganti Titik Depot secara Instan
  const handleSetDepot = (id) => {
    setLocations(
      locations.map((loc) => ({
        ...loc,
        isDepot: loc.id === id,
        demand: loc.id === id ? 0 : loc.demand > 0 ? loc.demand : 10,
      }))
    );
  };

  // Fungsi Simpan Perubahan Edit
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
      // Jika diset sebagai depot, pastikan titik lain jadi customer
      if (editingLoc.isDepot) {
        return { ...loc, isDepot: false };
      }
      return loc;
    });

    setLocations(updated);
    setEditingLoc(null);
  };

  // Upload Dataset (CSV / JSON)
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
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-indigo-600">Dynamic VRP Solver - Wilayah Indramayu</h1>
            <p className="text-sm text-slate-500">
              Optimasi Rute Kendaraan dengan Algoritma Metaheuristik (ABC, GA, Hybrid)
            </p>
          </div>
          <button
            onClick={() => runSolver(algorithm, locations, params)}
            disabled={isCalculating}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white px-6 py-3 rounded-xl font-bold transition shadow-md"
          >
            {isCalculating ? 'Menghitung Rute...' : 'Jalankan Optimasi'}
          </button>
        </header>

        {/* Dynamic Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form Input Manual & Upload */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-700">1. Tambah Lokasi</h2>
            
            <form onSubmit={handleAddManual} className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm">
              <span className="font-semibold text-slate-600 block">Tambah Titik Manual:</span>
              <input
                type="text"
                placeholder="Nama Lokasi (misal: Kecamatan Jatibarang)"
                value={manualInput.name}
                onChange={(e) => setManualInput({ ...manualInput, name: e.target.value })}
                className="w-full p-2 border rounded-lg bg-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude (-6.xxx)"
                  value={manualInput.lat}
                  onChange={(e) => setManualInput({ ...manualInput, lat: e.target.value })}
                  className="p-2 border rounded-lg bg-white"
                  required
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude (108.xxx)"
                  value={manualInput.lng}
                  onChange={(e) => setManualInput({ ...manualInput, lng: e.target.value })}
                  className="p-2 border rounded-lg bg-white"
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  placeholder="Demand (Barang)"
                  value={manualInput.demand}
                  disabled={manualInput.isDepot}
                  onChange={(e) => setManualInput({ ...manualInput, demand: e.target.value })}
                  className="w-1/2 p-2 border rounded-lg bg-white disabled:bg-slate-200"
                />
                <label className="flex items-center text-xs space-x-1 cursor-pointer font-medium text-red-600">
                  <input
                    type="checkbox"
                    checked={manualInput.isDepot}
                    onChange={(e) => setManualInput({ ...manualInput, isDepot: e.target.checked })}
                  />
                  <span>Jadikan Depot Utama</span>
                </label>
              </div>
              <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded-lg font-medium hover:bg-slate-900">
                + Tambah Lokasi
              </button>
            </form>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-sm">
              <span className="font-semibold text-slate-600 block">Upload Dataset (CSV / JSON):</span>
              <input
                type="file"
                accept=".csv, .json"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          </div>

          {/* Parameter Algoritma */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-700">2. Parameter Algoritma</h2>
            
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Metode Algoritma:</label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 font-semibold text-indigo-600"
                >
                  <option value="GA">Genetic Algorithm (GA)</option>
                  <option value="ABC">Artificial Bee Colony (ABC)</option>
                  <option value="HYBRID">Hybrid (GA + ABC)</option>
                  <option value="BENCHMARK">Benchmark Semua Algoritma</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 text-xs">Kapasitas Kendaraan</label>
                  <input
                    type="number"
                    value={params.capacity}
                    onChange={(e) => setParams({ ...params, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs">Jumlah Kendaraan</label>
                  <input
                    type="number"
                    value={params.vehicles}
                    onChange={(e) => setParams({ ...params, vehicles: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs">Jumlah Generasi</label>
                  <input
                    type="number"
                    value={params.generations}
                    onChange={(e) => setParams({ ...params, generations: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-xs">Ukuran Populasi</label>
                  <input
                    type="number"
                    value={params.popSize}
                    onChange={(e) => setParams({ ...params, popSize: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* List Lokasi, Edit & Ganti Depot */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-700">3. Kelola Lokasi ({locations.length})</h2>
              <button onClick={() => setLocations([])} className="text-xs text-red-500 hover:underline font-medium">
                Reset
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className={`p-2.5 rounded-xl border text-xs flex justify-between items-center ${
                    loc.isDepot ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-1">
                      <span className={loc.isDepot ? 'text-red-700' : 'text-slate-800'}>{loc.name}</span>
                      {loc.isDepot && <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Depot</span>}
                    </div>
                    <div className="text-slate-400">
                      Demand: {loc.demand} | ({loc.lat.toFixed(3)}, {loc.lng.toFixed(3)})
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {!loc.isDepot && (
                      <button
                        onClick={() => handleSetDepot(loc.id)}
                        className="bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded text-[10px] font-semibold"
                        title="Jadikan Depot"
                      >
                        Set Depot
                      </button>
                    )}
                    <button
                      onClick={() => setEditingLoc(loc)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded text-[10px] font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setLocations(locations.filter((l) => l.id !== loc.id))}
                      className="text-red-400 hover:text-red-600 font-bold px-1 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Visual Peta Interaktif */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-700 mb-3">Peta Wilayah & Rute Optimasi</h2>
          <MapView locations={locations} routes={result ? result.bestRoutes : []} onMapClick={handleMapClick} />
        </div>

        {/* Output Hasil */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
              <h2 className="text-lg font-bold text-slate-700">Hasil Rute & Jarak</h2>
              <div className="p-4 bg-indigo-50 rounded-xl text-indigo-900 font-semibold text-lg">
                Total Jarak: <span className="text-indigo-600">{result.bestDistance.toFixed(2)} km</span>
              </div>
              <div className="text-xs text-slate-500">Waktu Proses: {result.executionTime} ms</div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {result.bestRoutes.map((route, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 border">
                    <span className="font-bold text-slate-700">Armada #{idx + 1}:</span>
                    <p className="text-slate-600">
                      Depot ➔ {route.map((cIdx) => locations[cIdx]?.name).join(' ➔ ')} ➔ Depot
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <FitnessChart historyData={result.history} />
          </div>
        )}

        {/* Mode Benchmark Table */}
        {benchmarkResult && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-700">🔥 Hasil Perbandingan Benchmark</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                  <tr>
                    <th className="px-4 py-3">Algoritma</th>
                    <th className="px-4 py-3">Total Jarak</th>
                    <th className="px-4 py-3">Waktu Komputasi</th>
                    <th className="px-4 py-3">Armada Terpakai</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(benchmarkResult).map(([algName, data]) => (
                    <tr key={algName} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-indigo-600">{algName}</td>
                      <td className="px-4 py-3 font-semibold">{data.bestDistance.toFixed(2)} km</td>
                      <td className="px-4 py-3">{data.time} ms</td>
                      <td className="px-4 py-3">{data.bestRoutes.length} Kendaraan</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Pop-up Edit Lokasi */}
        {editingLoc && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Edit Data Lokasi</h3>
              <form onSubmit={handleSaveEdit} className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lokasi</label>
                  <input
                    type="text"
                    value={editingLoc.name}
                    onChange={(e) => setEditingLoc({ ...editingLoc, name: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={editingLoc.lat}
                      onChange={(e) => setEditingLoc({ ...editingLoc, lat: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={editingLoc.lng}
                      onChange={(e) => setEditingLoc({ ...editingLoc, lng: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Demand Barang</label>
                  <input
                    type="number"
                    value={editingLoc.demand}
                    disabled={editingLoc.isDepot}
                    onChange={(e) => setEditingLoc({ ...editingLoc, demand: e.target.value })}
                    className="w-full p-2 border rounded-lg disabled:bg-slate-100"
                  />
                </div>
                <label className="flex items-center space-x-2 text-xs font-semibold text-red-600 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={editingLoc.isDepot}
                    onChange={(e) => setEditingLoc({ ...editingLoc, isDepot: e.target.checked })}
                  />
                  <span>Jadikan Titik Depot Utama</span>
                </label>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingLoc(null)}
                    className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}