"use client"

import React, { useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts"

const chartData = [
  { date: "2024-04-01", brent: 87.42, wti: 83.71 },
  { date: "2024-04-02", brent: 88.92, wti: 85.15 },
  { date: "2024-04-03", brent: 89.35, wti: 85.43 },
  { date: "2024-04-04", brent: 90.65, wti: 86.59 },
  { date: "2024-04-05", brent: 91.17, wti: 86.91 },
  { date: "2024-04-08", brent: 90.38, wti: 86.43 },
  { date: "2024-04-09", brent: 89.42, wti: 85.23 },
  { date: "2024-04-10", brent: 90.48, wti: 86.21 },
  { date: "2024-04-11", brent: 89.74, wti: 85.02 },
  { date: "2024-04-12", brent: 90.45, wti: 85.66 },
  { date: "2024-04-15", brent: 90.10, wti: 85.41 },
  { date: "2024-04-16", brent: 90.02, wti: 85.36 },
  { date: "2024-04-17", brent: 87.29, wti: 82.69 },
  { date: "2024-04-18", brent: 87.11, wti: 82.73 },
  { date: "2024-04-19", brent: 87.29, wti: 83.14 },
  { date: "2024-04-22", brent: 87.00, wti: 82.85 },
  { date: "2024-04-23", brent: 88.42, wti: 83.36 },
  { date: "2024-04-24", brent: 88.02, wti: 82.81 },
  { date: "2024-04-25", brent: 89.01, wti: 83.57 },
  { date: "2024-04-26", brent: 89.50, wti: 83.85 },
  { date: "2024-04-29", brent: 88.40, wti: 82.63 },
  { date: "2024-04-30", brent: 87.86, wti: 81.93 },
  { date: "2024-05-01", brent: 83.44, wti: 79.00 },
  { date: "2024-05-02", brent: 83.67, wti: 78.95 },
  { date: "2024-05-03", brent: 82.96, wti: 78.11 },
  { date: "2024-05-06", brent: 83.33, wti: 78.48 },
  { date: "2024-05-07", brent: 83.16, wti: 78.38 },
  { date: "2024-05-08", brent: 83.58, wti: 78.99 },
  { date: "2024-05-09", brent: 83.88, wti: 79.26 },
  { date: "2024-05-10", brent: 82.79, wti: 78.26 },
  { date: "2024-05-13", brent: 83.36, wti: 79.12 },
  { date: "2024-05-14", brent: 82.38, wti: 78.02 },
  { date: "2024-05-15", brent: 82.75, wti: 78.63 },
  { date: "2024-05-16", brent: 83.27, wti: 79.23 },
  { date: "2024-05-17", brent: 83.98, wti: 80.06 },
  { date: "2024-05-20", brent: 83.71, wti: 79.80 },
  { date: "2024-05-21", brent: 82.88, wti: 79.26 },
  { date: "2024-05-22", brent: 81.90, wti: 77.57 },
  { date: "2024-05-23", brent: 81.36, wti: 76.87 },
  { date: "2024-05-24", brent: 82.12, wti: 77.72 },
  { date: "2024-05-27", brent: 83.10, wti: 78.65 },
  { date: "2024-05-28", brent: 84.22, wti: 79.83 },
  { date: "2024-05-29", brent: 83.60, wti: 79.23 },
  { date: "2024-05-30", brent: 81.86, wti: 77.91 },
  { date: "2024-05-31", brent: 81.62, wti: 76.99 },
  { date: "2024-06-03", brent: 78.36, wti: 74.22 },
  { date: "2024-06-04", brent: 77.52, wti: 73.25 },
  { date: "2024-06-05", brent: 78.41, wti: 74.07 },
  { date: "2024-06-06", brent: 79.87, wti: 75.55 },
  { date: "2024-06-07", brent: 79.62, wti: 75.53 },
  { date: "2024-06-10", brent: 81.63, wti: 77.74 },
  { date: "2024-06-11", brent: 81.92, wti: 77.90 },
  { date: "2024-06-12", brent: 82.60, wti: 78.50 },
  { date: "2024-06-13", brent: 82.75, wti: 78.62 },
  { date: "2024-06-14", brent: 82.62, wti: 78.45 },
  { date: "2024-06-17", brent: 84.25, wti: 80.33 },
  { date: "2024-06-18", brent: 85.33, wti: 81.57 },
  { date: "2024-06-19", brent: 85.07, wti: 81.57 },
  { date: "2024-06-20", brent: 85.71, wti: 82.17 },
  { date: "2024-06-21", brent: 85.24, wti: 80.73 },
  { date: "2024-06-24", brent: 86.01, wti: 81.63 },
  { date: "2024-06-25", brent: 85.01, wti: 80.83 },
  { date: "2024-06-26", brent: 85.25, wti: 80.90 },
  { date: "2024-06-27", brent: 86.39, wti: 81.74 },
  { date: "2024-06-28", brent: 86.41, wti: 81.54 },
  { date: "2024-06-30", brent: 86.50, wti: 81.60 },
]

export default function MarketDataChart() {
  const [timeRange, setTimeRange] = useState("90d")

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 my-12 overflow-hidden shadow-sm relative z-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Commodity Markets</h2>
          <p className="text-gray-500">Crude Oil Prices (USD/bbl) - Brent vs WTI</p>
        </div>
        
        <select 
          aria-label="Select time range"
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-gray-50 text-gray-900 border border-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
        >
          <option value="90d">Last 3 Months</option>
          <option value="30d">Last 30 Days</option>
          <option value="7d">Last 7 Days</option>
        </select>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillBrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="fillWTI" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#374151" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={32}
              stroke="#9ca3af"
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#111827', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#374151' }}
              labelFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            />
            
            <Area
              name="WTI Crude"
              dataKey="wti"
              type="monotone"
              fill="url(#fillWTI)"
              stroke="#10b981"
              strokeWidth={3}
              activeDot={{ r: 6 }}
            />
            <Area
              name="Brent Crude"
              dataKey="brent"
              type="monotone"
              fill="url(#fillBrent)"
              stroke="#3b82f6"
              strokeWidth={3}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

