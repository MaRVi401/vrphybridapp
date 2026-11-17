import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function FitnessChart({ historyData, benchmarkData, isDarkMode }) {
  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
  const tooltipStyle = {
    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
    borderColor: isDarkMode ? '#334155' : '#cbd5e1',
    color: isDarkMode ? '#f8fafc' : '#0f172a',
    fontSize: '11px',
    borderRadius: '8px',
  };

  // Mode Perbandingan 3 Kurva (Benchmark)
  if (benchmarkData?.GA && benchmarkData?.ABC && benchmarkData?.HYBRID) {
    const gaHist = benchmarkData.GA.history || [];
    const abcHist = benchmarkData.ABC.history || [];
    const hybHist = benchmarkData.HYBRID.history || [];
    const maxLen = Math.max(gaHist.length, abcHist.length, hybHist.length);

    const mergedData = Array.from({ length: maxLen }, (_, idx) => ({
      generation: idx + 1,
      GA: gaHist[idx]?.fitness ?? null,
      ABC: abcHist[idx]?.fitness ?? null,
      HYBRID: hybHist[idx]?.fitness ?? null,
    }));

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={mergedData} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="generation" tick={{ fontSize: 10, fill: axisColor }} />
          <YAxis tick={{ fontSize: 10, fill: axisColor }} domain={['auto', 'auto']} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '2px' }} />
          <Line
            type="monotone"
            dataKey="GA"
            name="GA (km)"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="ABC"
            name="ABC (km)"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="HYBRID"
            name="HYBRID (km)"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Mode Algoritma Tunggal
  if (!historyData || historyData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs opacity-50 italic">
        Grafik konvergensi akan muncul setelah optimasi dijalankan
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={historyData} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="generation" tick={{ fontSize: 10, fill: axisColor }} />
        <YAxis tick={{ fontSize: 10, fill: axisColor }} domain={['auto', 'auto']} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey="fitness"
          name="Jarak Terbaik (km)"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}