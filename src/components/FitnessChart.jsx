import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function FitnessChart({ data }) {
  return (
    <div className="h-[250px] w-full bg-slate-800 p-4 rounded-xl border border-slate-700">
      <h3 className="text-slate-200 text-sm font-semibold mb-2">Grafik Konvergensi Jarak (KM)</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="iteration" stroke="#94A3B8" />
          <YAxis stroke="#94A3B8" domain={["dataMin - 5", "dataMax + 5"]} />
          <Tooltip contentStyle={{ backgroundColor: "#1E293B", borderColor: "#475569" }} />
          <Line type="monotone" dataKey="distance" stroke="#10B981" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}