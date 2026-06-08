"use client";

import { useState, useMemo } from "react";
import { formatPrice, formatDate } from "@/lib/mock-data";
import type { Event, Registration } from "@/lib/types";

interface AnalyticsDashboardProps {
  events: Event[];
  registrations: Registration[];
}

type Timeframe = "7d" | "30d" | "90d" | "all";

const CHART_DIMENSIONS = {
  width: 900,
  height: 320,
  paddingLeft: 60,
  paddingRight: 40,
  paddingTop: 40,
  paddingBottom: 60,
};

export default function AnalyticsDashboard({ events, registrations }: AnalyticsDashboardProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 1. Filtered registrations & events based on selectedEventId and timeframe
  const filteredData = useMemo(() => {
    let list = [...registrations];

    // Filter by Event
    if (selectedEventId !== "all") {
      list = list.filter((r) => r.event_id === selectedEventId);
    }

    // Filter by Timeframe
    const now = new Date();
    let cutoff = new Date();
    if (timeframe === "7d") {
      cutoff.setDate(now.getDate() - 7);
    } else if (timeframe === "30d") {
      cutoff.setDate(now.getDate() - 30);
    } else if (timeframe === "90d") {
      cutoff.setDate(now.getDate() - 90);
    } else {
      cutoff = new Date(0); // All time
    }

    if (timeframe !== "all") {
      list = list.filter((r) => new Date(r.created_at) >= cutoff);
    }

    // Sort registrations by creation time ascending for trend charting
    list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return list;
  }, [registrations, selectedEventId, timeframe]);

  // Total summary calculations
  const summary = useMemo(() => {
    // Approved / Attended / No-show are considered tickets sold.
    // Refunded or Rejected are not. Awaiting verification or pending? 
    // Let's include approved, attended, and no_show in paid metrics.
    const paidRegs = filteredData.filter(
      (r) => r.status === "approved" || r.status === "attended" || r.status === "no_show"
    );

    const totalRevenue = paidRegs.reduce((acc, r) => acc + r.amount_paise, 0);
    const totalTicketsSold = paidRegs.length;

    // Check-in rates: attended vs no_show
    const attended = filteredData.filter((r) => r.status === "attended").length;
    const noShow = filteredData.filter((r) => r.status === "no_show").length;
    const totalFinished = attended + noShow;
    const attendanceRate = totalFinished > 0 ? Math.round((attended / totalFinished) * 100) : 0;

    // Capacity fill rate (based on selected event, or all active events in timeframe)
    let totalCapacity = 0;
    if (selectedEventId !== "all") {
      const ev = events.find((e) => e.id === selectedEventId);
      totalCapacity = ev?.capacity || 0;
    } else {
      // Sum capacities of events that overlap with this timeframe
      const now = new Date();
      let cutoff = new Date();
      if (timeframe === "7d") cutoff.setDate(now.getDate() - 7);
      else if (timeframe === "30d") cutoff.setDate(now.getDate() - 30);
      else if (timeframe === "90d") cutoff.setDate(now.getDate() - 90);
      else cutoff = new Date(0);

      const activeEvents = events.filter(
        (e) => timeframe === "all" || new Date(e.start_at) >= cutoff
      );
      totalCapacity = activeEvents.reduce((acc, e) => acc + e.capacity, 0);
    }

    const fillRate = totalCapacity > 0 ? Math.round((totalTicketsSold / totalCapacity) * 100) : 0;

    return {
      totalRevenue,
      totalTicketsSold,
      attendanceRate,
      fillRate,
      totalCapacity,
      attended,
      noShow,
    };
  }, [filteredData, events, selectedEventId, timeframe]);

  // Generate continuous daily data points for the SVG Line Graph
  const chartData = useMemo(() => {
    const pointsMap: Record<string, { dateStr: string; label: string; count: number; revenue: number }> = {};

    // Get date range limits
    const now = new Date();
    let start = new Date();
    if (timeframe === "7d") start.setDate(now.getDate() - 7);
    else if (timeframe === "30d") start.setDate(now.getDate() - 30);
    else if (timeframe === "90d") start.setDate(now.getDate() - 90);
    else {
      // All time: find earliest registration date or default 30 days ago
      if (filteredData.length > 0) {
        start = new Date(filteredData[0].created_at);
      } else {
        start.setDate(now.getDate() - 30);
      }
    }

    // Normalize start and end times to dates
    const d = new Date(start);
    d.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    // Initialize all dates in range with 0 values
    while (d <= end) {
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      pointsMap[key] = { dateStr: key, label, count: 0, revenue: 0 };
      d.setDate(d.getDate() + 1);
    }

    // Populate registration counts and revenue
    filteredData.forEach((r) => {
      const key = new Date(r.created_at).toISOString().split("T")[0];
      if (pointsMap[key]) {
        // Only count valid tickets sold in charts
        if (r.status === "approved" || r.status === "attended" || r.status === "no_show") {
          pointsMap[key].count += 1;
          pointsMap[key].revenue += r.amount_paise / 100; // in Rupees
        }
      }
    });

    return Object.values(pointsMap).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [filteredData, timeframe]);

  // SVG dimensions & metrics scaling
  const graphWidth = CHART_DIMENSIONS.width - CHART_DIMENSIONS.paddingLeft - CHART_DIMENSIONS.paddingRight;
  const graphHeight = CHART_DIMENSIONS.height - CHART_DIMENSIONS.paddingTop - CHART_DIMENSIONS.paddingBottom;

  const maxVal = useMemo(() => {
    let maxCount = 0;
    let maxRevenue = 0;
    chartData.forEach((d) => {
      if (d.count > maxCount) maxCount = d.count;
      if (d.revenue > maxRevenue) maxRevenue = d.revenue;
    });
    return {
      count: Math.max(maxCount, 5), // Min ceiling to avoid divide by 0
      revenue: Math.max(maxRevenue, 1000),
    };
  }, [chartData]);

  // Construct points coordinates for count and revenue
  const points = useMemo(() => {
    const len = chartData.length;
    if (len === 0) return { counts: [], revenues: [], lines: "", areas: "", revLines: "", revAreas: "" };

    const counts: { x: number; y: number; label: string; count: number; revenue: number }[] = [];
    const revenues: { x: number; y: number; label: string; count: number; revenue: number }[] = [];

    chartData.forEach((d, i) => {
      // X coordinate is horizontal spacing
      const x = CHART_DIMENSIONS.paddingLeft + (i / (len - 1 || 1)) * graphWidth;
      
      // Y coordinates scaled
      const yCount = CHART_DIMENSIONS.paddingTop + graphHeight - (d.count / maxVal.count) * graphHeight;
      const yRevenue = CHART_DIMENSIONS.paddingTop + graphHeight - (d.revenue / maxVal.revenue) * graphHeight;

      counts.push({ x, y: yCount, label: d.label, count: d.count, revenue: d.revenue });
      revenues.push({ x, y: yRevenue, label: d.label, count: d.count, revenue: d.revenue });
    });

    // Generate Path Strings
    let linePath = "";
    let areaPath = "";
    let revLinePath = "";
    let revAreaPath = "";

    if (counts.length > 0) {
      linePath = `M ${counts[0].x} ${counts[0].y}`;
      areaPath = `M ${counts[0].x} ${CHART_DIMENSIONS.paddingTop + graphHeight} L ${counts[0].x} ${counts[0].y}`;
      
      revLinePath = `M ${revenues[0].x} ${revenues[0].y}`;
      revAreaPath = `M ${revenues[0].x} ${CHART_DIMENSIONS.paddingTop + graphHeight} L ${revenues[0].x} ${revenues[0].y}`;

      for (let i = 1; i < counts.length; i++) {
        // Curve construction using linear segments (sharp and clean)
        linePath += ` L ${counts[i].x} ${counts[i].y}`;
        areaPath += ` L ${counts[i].x} ${counts[i].y}`;

        revLinePath += ` L ${revenues[i].x} ${revenues[i].y}`;
        revAreaPath += ` L ${revenues[i].x} ${revenues[i].y}`;
      }

      areaPath += ` L ${counts[counts.length - 1].x} ${CHART_DIMENSIONS.paddingTop + graphHeight} Z`;
      revAreaPath += ` L ${revenues[revenues.length - 1].x} ${CHART_DIMENSIONS.paddingTop + graphHeight} Z`;
    }

    return { counts, revenues, lines: linePath, areas: areaPath, revLines: revLinePath, revAreas: revAreaPath };
  }, [chartData, graphWidth, graphHeight, maxVal]);


  // Breakdown metrics for all events list
  const eventBreakdowns = useMemo(() => {
    return events.map((e) => {
      const eventRegs = registrations.filter(
        (r) => r.event_id === e.id && (r.status === "approved" || r.status === "attended" || r.status === "no_show")
      );
      const rev = eventRegs.reduce((acc, r) => acc + r.amount_paise, 0);
      const ticketsSold = eventRegs.length;
      const fillRate = e.capacity > 0 ? Math.round((ticketsSold / e.capacity) * 100) : 0;

      const attended = registrations.filter((r) => r.event_id === e.id && r.status === "attended").length;
      const noShow = registrations.filter((r) => r.event_id === e.id && r.status === "no_show").length;
      const finished = attended + noShow;
      const attRate = finished > 0 ? Math.round((attended / finished) * 100) : 0;

      return {
        ...e,
        revenue: rev,
        ticketsSold,
        fillRate,
        attendanceRate: attRate,
        hasFinished: new Date(e.end_at) < new Date(),
      };
    });
  }, [events, registrations]);

  return (
    <div className="space-y-8 max-w-[1100px]">
      {/* Controls: Timeframe and Event Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-4 surface p-4 rounded-2xl">
        <div className="flex flex-wrap gap-2">
          {(["7d", "30d", "90d", "all"] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                timeframe === tf
                  ? "bg-[var(--green-ink)] text-[var(--cream)]"
                  : "text-[var(--ink-mute)] hover:bg-[var(--cream-soft)]"
              }`}
            >
              {tf === "7d" && "Last 7 Days"}
              {tf === "30d" && "Last 30 Days"}
              {tf === "90d" && "Last 90 Days"}
              {tf === "all" && "All Time"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[var(--ink-mute)] uppercase tracking-wider">
            Event Context:
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-[var(--cream-soft)] border text-[var(--green-ink)] outline-none border-[var(--surface-border)] focus:border-[var(--green)] transition-all cursor-pointer"
          >
            <option value="all">All Events</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({new Date(e.start_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Revenue */}
        <div className="surface p-5 rounded-2xl relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-widest text-[var(--ink-mute)] mb-3 font-semibold">
            Tickets Revenue
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-4xl text-[var(--green-deep)] tracking-tight">
              {formatPrice(summary.totalRevenue)}
            </span>
          </div>
          <p className="text-[11px] text-[var(--ink-mute)] mt-3">
            Exclude refunds and cancellations
          </p>
          <div className="absolute right-3 bottom-3 text-3xl opacity-10 group-hover:scale-110 transition-transform">
            ₹
          </div>
        </div>

        {/* KPI 2: Tickets Sold */}
        <div className="surface p-5 rounded-2xl relative overflow-hidden group">
          <div className="text-[10px] uppercase tracking-widest text-[var(--ink-mute)] mb-3 font-semibold">
            Tickets Confirmed
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-4xl text-[var(--green-ink)] tracking-tight">
              {summary.totalTicketsSold}
            </span>
            {selectedEventId !== "all" && (
              <span className="text-xs text-[var(--ink-mute)]">/ {summary.totalCapacity} capacity</span>
            )}
          </div>
          <p className="text-[11px] text-[var(--ink-mute)] mt-3">
            Approved registrations with passes
          </p>
          <div className="absolute right-3 bottom-3 text-3xl opacity-10 group-hover:scale-110 transition-transform">
            🎫
          </div>
        </div>

        {/* KPI 3: Capacity Fill Rate with Custom SVG Ring Gauge */}
        <div className="surface p-5 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--ink-mute)] mb-2 font-semibold">
              Capacity Fill Rate
            </div>
            <span className="font-display text-4xl text-[var(--green-ink)] tracking-tight">
              {summary.fillRate}%
            </span>
            <p className="text-[11px] text-[var(--ink-mute)] mt-2">
              {summary.totalTicketsSold} sold across {summary.totalCapacity} capacity
            </p>
          </div>

          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="var(--cream-deep)"
                strokeWidth="3.5"
              />
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="var(--green)"
                strokeWidth="3.5"
                strokeDasharray={`${summary.fillRate} ${100 - summary.fillRate}`}
                strokeDashoffset="0"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--green-ink)]">
              {summary.fillRate}%
            </div>
          </div>
        </div>

        {/* KPI 4: Attendance Rate with Custom SVG Gauge */}
        <div className="surface p-5 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--ink-mute)] mb-2 font-semibold">
              Attendance Rate
            </div>
            <span className="font-display text-4xl text-[var(--green-ink)] tracking-tight">
              {summary.attendanceRate}%
            </span>
            <p className="text-[11px] text-[var(--ink-mute)] mt-2">
              {summary.attended} attended / {summary.noShow} no-show
            </p>
          </div>

          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="var(--cream-deep)"
                strokeWidth="3.5"
              />
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="var(--warn)"
                strokeWidth="3.5"
                strokeDasharray={`${summary.attendanceRate} ${100 - summary.attendanceRate}`}
                strokeDashoffset="0"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--green-ink)]">
              {summary.attendanceRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Custom SVG Line Graph */}
      <div className="surface p-6 rounded-3xl">
        <div className="flex flex-wrap items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--green-ink)]">
              Ticket Sales & Revenue Trends
            </h2>
            <p className="text-xs text-[var(--ink-mute)] mt-0.5">
              Interactive display of registrations volume vs cash revenue daily ticks
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-[var(--ink-dim)]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-[var(--green)] inline-block"></span>
              <span>Ticket Vol ({maxVal.count} max)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-[var(--warn)] inline-block"></span>
              <span>Revenue (₹{maxVal.revenue} max)</span>
            </div>
          </div>
        </div>

        {/* Chart Viewport */}
        {chartData.length > 1 ? (
          <div className="relative">
            <svg
              className="w-full h-auto select-none"
              viewBox={`0 0 ${CHART_DIMENSIONS.width} ${CHART_DIMENSIONS.height}`}
            >
              <defs>
                {/* Area Gradient fills */}
                <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--green)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--green)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--warn)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="var(--warn)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = CHART_DIMENSIONS.paddingTop + ratio * graphHeight;
                const countVal = Math.round(maxVal.count * (1 - ratio));
                const revVal = Math.round(maxVal.revenue * (1 - ratio));
                return (
                  <g key={index} className="opacity-40">
                    <line
                      x1={CHART_DIMENSIONS.paddingLeft}
                      y1={y}
                      x2={CHART_DIMENSIONS.width - CHART_DIMENSIONS.paddingRight}
                      y2={y}
                      stroke="var(--surface-border)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    {/* Left label: Count */}
                    <text
                      x={CHART_DIMENSIONS.paddingLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[10px] font-semibold font-mono fill-[var(--ink-mute)]"
                    >
                      {countVal}
                    </text>
                    {/* Right label: Revenue */}
                    <text
                      x={CHART_DIMENSIONS.width - CHART_DIMENSIONS.paddingRight + 10}
                      y={y + 4}
                      textAnchor="start"
                      className="text-[10px] font-semibold font-mono fill-[var(--ink-mute)]"
                    >
                      ₹{revVal}
                    </text>
                  </g>
                );
              })}

              {/* Filled Area Paths */}
              {points.areas && (
                <path d={points.areas} fill="url(#countGradient)" />
              )}
              {points.revAreas && (
                <path d={points.revAreas} fill="url(#revGradient)" />
              )}

              {/* Line Paths */}
              {points.lines && (
                <path
                  d={points.lines}
                  fill="none"
                  stroke="var(--green)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {points.revLines && (
                <path
                  d={points.revLines}
                  fill="none"
                  stroke="var(--warn)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* X Axis Date labels (Max 8 labels to keep layout clean) */}
              {chartData.map((d, i) => {
                const modulo = Math.ceil(chartData.length / 8);
                if (i % modulo !== 0 && i !== chartData.length - 1) return null;

                const x = CHART_DIMENSIONS.paddingLeft + (i / (chartData.length - 1)) * graphWidth;
                const y = CHART_DIMENSIONS.height - CHART_DIMENSIONS.paddingBottom + 20;

                return (
                  <text
                    key={i}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    className="text-[10px] font-medium fill-[var(--ink-mute)]"
                  >
                    {d.label}
                  </text>
                );
              })}

              {/* Hover indicator lines & circles */}
              {hoveredIndex !== null && points.counts[hoveredIndex] && (
                <g>
                  {/* Vertical cursor slice line */}
                  <line
                    x1={points.counts[hoveredIndex].x}
                    y1={CHART_DIMENSIONS.paddingTop}
                    x2={points.counts[hoveredIndex].x}
                    y2={CHART_DIMENSIONS.paddingTop + graphHeight}
                    stroke="var(--green-ink)"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                  {/* Dot on counts line */}
                  <circle
                    cx={points.counts[hoveredIndex].x}
                    cy={points.counts[hoveredIndex].y}
                    r="5"
                    fill="var(--green)"
                    stroke="var(--cream)"
                    strokeWidth="1.5"
                  />
                  {/* Dot on revenue line */}
                  <circle
                    cx={points.revenues[hoveredIndex].x}
                    cy={points.revenues[hoveredIndex].y}
                    r="5"
                    fill="var(--warn)"
                    stroke="var(--cream)"
                    strokeWidth="1.5"
                  />
                </g>
              )}

              {/* Interactive invisible hover zone rects */}
              {chartData.map((_, i) => {
                const segmentWidth = graphWidth / chartData.length;
                const x = CHART_DIMENSIONS.paddingLeft + i * segmentWidth - segmentWidth / 2;
                return (
                  <rect
                    key={i}
                    x={x}
                    y={CHART_DIMENSIONS.paddingTop}
                    width={segmentWidth}
                    height={graphHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay (standard CSS absolute coordinates) */}
            {hoveredIndex !== null && chartData[hoveredIndex] && (
              <div
                className="absolute bg-white/95 backdrop-blur border border-[var(--surface-border)] rounded-xl p-3 shadow-lg pointer-events-none text-xs space-y-1 transition-all duration-75"
                style={{
                  left: `${(points.counts[hoveredIndex].x / CHART_DIMENSIONS.width) * 100}%`,
                  transform: "translateX(-50%)",
                  top: "20px",
                }}
              >
                <div className="font-bold text-[var(--green-ink)] border-b border-[var(--surface-border)] pb-1 mb-1">
                  {chartData[hoveredIndex].label}
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--ink-mute)]">Tickets Confirmed:</span>
                  <span className="font-bold text-[var(--green)]">{chartData[hoveredIndex].count}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--ink-mute)]">Cash Revenue:</span>
                  <span className="font-bold text-[var(--warn)]">₹{chartData[hoveredIndex].revenue.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-24 text-center text-[var(--ink-mute)] text-xs border border-dashed border-[var(--surface-border)] rounded-2xl">
            Insufficient data historical points within current filters to compute timeline chart.
          </div>
        )}
      </div>

      {/* Event Breakdown Summary List Table */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--green-ink)]">
          Event Breakdown Analytics
        </h2>

        <div className="rounded-2xl overflow-hidden border border-[var(--surface-border)] surface">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--cream-deep)]/50 border-b border-[var(--surface-border)]">
                  {[
                    "Event Title",
                    "Event Date",
                    "Confirmed Tickets",
                    "Capacity Fill Rate",
                    "Total Revenue",
                    "Check-In Rate",
                  ].map((th) => (
                    <th
                      key={th}
                      className="px-6 py-3 text-left text-[10px] uppercase tracking-widest text-[var(--ink-mute)] font-medium"
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--surface-border)]">
                {eventBreakdowns.map((eb) => (
                  <tr key={eb.id} className="transition-colors hover:bg-[var(--cream-deep)]/25">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[var(--green-ink)] text-xs">
                        {eb.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--ink-dim)]">
                      {formatDate(eb.start_at)}
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--green-ink)]">
                      {eb.ticketsSold} / {eb.capacity}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--green-ink)] w-8">{eb.fillRate}%</span>
                        <div className="w-20 h-1.5 rounded-full bg-[var(--cream-deep)] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${eb.fillRate}%`,
                              background: eb.fillRate >= 85 ? "var(--warn)" : "var(--ok)",
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-[var(--green-deep)]">
                      {formatPrice(eb.revenue)}
                    </td>
                    <td className="px-6 py-4">
                      {eb.hasFinished ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            eb.attendanceRate >= 80
                              ? "bg-[rgba(46,122,76,0.08)] text-[var(--green-deep)]"
                              : "bg-[rgba(199,126,26,0.08)] text-[var(--warn)]"
                          }`}
                        >
                          {eb.attendanceRate}% Check-in
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--cream-deep)] text-[var(--ink-mute)]">
                          Event Upcoming
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
