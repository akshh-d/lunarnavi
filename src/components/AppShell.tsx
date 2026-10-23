import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  BookOpen, Columns3, Compass, Database, Globe2, Info, LayoutDashboard, Rocket, Save, Timer,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInset,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { useMission } from "@/lib/store";
import { SiteSelect, TimeInput } from "./controls";
import { fmtLat, fmtLon, hasPoint } from "@/data/sites";

const NAV = [
  { to: "/", label: "Mission Overview", icon: LayoutDashboard },
  { to: "/explorer", label: "Lunar Explorer", icon: Globe2 },
  { to: "/compare", label: "Site Comparison", icon: Columns3 },
  { to: "/geometry", label: "Sun & Earth Geometry", icon: Compass },
  { to: "/timeline", label: "Mission Timeline", icon: Timer },
  { to: "/missions", label: "CLPS Missions", icon: Rocket },
  { to: "/scenarios", label: "Saved Scenarios", icon: Save },
  { to: "/methodology", label: "Data & Methodology", icon: Database },
  { to: "/about", label: "About", icon: Info },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { edu, setEdu, site } = useMission();
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="no-print">
        <SidebarHeader className="px-3 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-primary/50 bg-[radial-gradient(circle_at_35%_35%,var(--foreground),var(--regolith)_70%)]" />
            <span className="font-display text-base font-semibold tracking-wider group-data-[collapsible=icon]:hidden">
              LUNAR<span className="text-primary">·</span>NAVIGATOR
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((n) => (
                  <SidebarMenuItem key={n.to}>
                    <SidebarMenuButton asChild isActive={pathname === n.to} tooltip={n.label}>
                      <Link to={n.to}><n.icon /><span>{n.label}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="group-data-[collapsible=icon]:hidden">
          <label className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
            <span className="flex items-center gap-2"><BookOpen className="size-4 text-primary" />Educational mode</span>
            <Switch checked={edu} onCheckedChange={setEdu} />
          </label>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-transparent">
        <header className="no-print sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur">
          <SidebarTrigger />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <SiteSelect />
            <span className="num hidden text-xs text-muted-foreground md:inline">
              {hasPoint(site) ? `${fmtLat(site.lat)} ${fmtLon(site.lon)}` : "region only"}
            </span>
          </div>
          <TimeInput />
        </header>
        <main className="mx-auto w-full max-w-[1500px] p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
