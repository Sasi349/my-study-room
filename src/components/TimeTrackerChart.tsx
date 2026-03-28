"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface TimeEntry {
  date: string;
  minutes: number;
}

interface ChartProps {
  entries: TimeEntry[];
  viewMode: "week" | "month";
  weekStart?: Date;
}

export default function TimeTrackerChart({ entries, viewMode, weekStart }: ChartProps) {
  // Prepare data for the chart
  const getChartData = () => {
    if (viewMode === "week" && weekStart) {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const data: Array<{
        day: string;
        date: string;
        hours: number;
        minutes: number;
      }> = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];

        const totalMinutes = entries
          .filter((e) => e.date === dateStr)
          .reduce((sum, e) => sum + e.minutes, 0);

        const hours = (totalMinutes / 60).toFixed(1);

        data.push({
          day: days[i],
          hours: parseFloat(hours),
          minutes: totalMinutes,
          date: dateStr,
        });
      }
      return data;
    } else {
      // Month view - show last 30 days
      const data: Array<{
        date: string;
        hours: number;
      }> = [];
      const today = new Date();

      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const totalMinutes = entries
          .filter((e) => e.date === dateStr)
          .reduce((sum, e) => sum + e.minutes, 0);

        data.push({
          date: new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          hours: parseFloat((totalMinutes / 60).toFixed(1)),
        });
      }

      return data;
    }
  };

  const chartData = getChartData();

  if (chartData.length === 0 || chartData.every((d) => d.hours === 0)) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <p>No data to display yet. Start logging time to see your progress!</p>
      </div>
    );
  }

  return (
    <div className="w-full h-96 bg-white dark:bg-slate-900 rounded-2xl p-6 ring-1 ring-slate-200 dark:ring-slate-700">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <XAxis dataKey={viewMode === "week" ? "day" : "date"} stroke="#64748b" tick={{ fontSize: 12 }} />
          <YAxis stroke="#64748b" label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #475569",
              borderRadius: "8px",
              color: "#f1f5f9",
            }}
            formatter={(value) => `${value}h`}
          />
          <Line
            type="monotone"
            dataKey="hours"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: "#3b82f6", r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
