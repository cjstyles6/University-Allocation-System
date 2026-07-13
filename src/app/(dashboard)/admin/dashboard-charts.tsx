"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

const occupancyConfig = {
  available: { label: "Available", color: "#10b981" },
  occupied: { label: "Occupied", color: "#f43f5e" },
  maintenance: { label: "Maintenance", color: "#f59e0b" },
} satisfies ChartConfig;

export function RoomOccupancyChart({
  data,
}: {
  data: { hostel: string; available: number; occupied: number; maintenance: number }[];
}) {
  return (
    <ChartContainer config={occupancyConfig} className="aspect-auto h-64 w-full">
      <BarChart data={data} barGap={4}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="hostel" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="available" fill="var(--color-available)" radius={4} />
        <Bar dataKey="occupied" fill="var(--color-occupied)" radius={4} />
        <Bar dataKey="maintenance" fill="var(--color-maintenance)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

const categoryConfig = {
  count: { label: "Complaints", color: "#7c3aed" },
} satisfies ChartConfig;

export function ComplaintsByCategoryChart({
  data,
}: {
  data: { category: string; count: number }[];
}) {
  return (
    <ChartContainer config={categoryConfig} className="aspect-auto h-64 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="category"
          tickLine={false}
          axisLine={false}
          width={90}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
