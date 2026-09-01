import { useEffect, useState } from "react";
import AppShell from "~/components/layout/AppShell";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "UltraFormula" },
    { name: "description", content: "A node-based procedural pipeline editor" },
  ];
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <AppShell />;
}
