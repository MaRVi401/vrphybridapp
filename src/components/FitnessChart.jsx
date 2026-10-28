import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function FitnessChart({ historyData, isDarkMode }) {
  if (!historyData || historyData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs opacity-50 italic">
        Belum ada data konvergensi. Klik 'Jalankan Optimasi'.
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={historyData} margin={{ top: 5, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
            <XAxis
              dataKey="generation"
              tick={{ fontSize: 9, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 9, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDarkMode ? '#1e293b' : '#0f172a',
                borderColor: isDarkMode ? '#475569' : '#1e293b',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
                padding: '4px 8px',
              }}
              formatter={(value) => [`${value} km`, 'Total Jarak']}
              labelFormatter={(label) => `Generasi: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="fitness"
              stroke={isDarkMode ? '#818cf8' : '#4f46e5'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}