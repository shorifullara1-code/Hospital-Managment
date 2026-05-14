"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function RevenueChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis
          dataKey="name"
          stroke="#94A3B8"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          dy={10}
        />
        <YAxis
          stroke="#94A3B8"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `৳${value/1000}k`}
        />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke="#15807D" 
          strokeWidth={2} 
          dot={{ r: 0 }} 
          activeDot={{ r: 4 }} 
        />
        <Line 
          type="monotone" 
          dataKey="expenses" 
          stroke="#F59E0B" 
          strokeWidth={2} 
          dot={{ r: 0 }} 
          activeDot={{ r: 4 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
