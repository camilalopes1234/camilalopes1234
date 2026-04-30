"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";

const SIDEBAR_STORAGE_KEY = "crm.sidebar.collapsed";
const SIDEBAR_EVENT = "crm-sidebar-collapsed";

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => onStoreChange();

  window.addEventListener("storage", handleChange);
  window.addEventListener(SIDEBAR_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(SIDEBAR_EVENT, handleChange);
  };
}

function getSidebarSnapshot() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
}

export function WorkspaceShell({
  children,
  userName,
  userRole,
  title
}: {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  title?: string | null;
}) {
  const collapsed = useSyncExternalStore(subscribe, getSidebarSnapshot, () => false);

  function updateCollapsed(nextValue: boolean) {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));
    window.dispatchEvent(new Event(SIDEBAR_EVENT));
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className={`mx-auto grid max-w-[1680px] gap-4 transition-all duration-300 ${collapsed ? "lg:grid-cols-[88px_1fr]" : "lg:grid-cols-[288px_1fr]"}`}>
        <Sidebar collapsed={collapsed} />
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => updateCollapsed(!collapsed)} className="h-11 w-11 rounded-2xl p-0 shadow-sm">
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>
            <div className="min-w-0 flex-1">
              <Header userName={userName} userRole={userRole} title={title} />
            </div>
          </div>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
