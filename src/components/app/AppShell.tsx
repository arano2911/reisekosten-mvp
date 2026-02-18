"use client";

import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-md min-h-dvh pb-20">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
