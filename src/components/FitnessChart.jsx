import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FitnessChart({ historyData }) {
  if (!historyData || historyData.length === 0) return null;

  return (
    <div className="w-full h-72 bg-white p-4 rounded-xl shadow-md border border-gray-100">
      <h3 className="text-lg font-bold text-gray-700 mb-2">Grafik Konvergensi Fitness (Total Jarak vs Generasi)</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={historyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="generation" label={{ value: 'Generasi / Iterasi', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Jarak (km)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="fitness" stroke="#2563eb" strokeWidth={2} dot={false} name="Total Jarak (km)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}