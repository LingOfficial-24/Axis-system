"use client";

import dynamic from "next/dynamic";

const AxisSystem = dynamic(() => import("../components/AxisSystem"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-400"></div>
    </div>
  ),
});

export default function Home() {
  return <AxisSystem />;
}