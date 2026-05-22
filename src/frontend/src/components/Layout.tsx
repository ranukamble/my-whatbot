import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  Menu,
  MessageCircle,
  Smartphone,
  Users,
  UsersRound,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/campaigns", label: "Campaigns", icon: Megaphone },
  { path: "/contacts", label: "Contacts", icon: Users },
  { path: "/history", label: "History", icon: ClipboardList },
  { path: "/whatsapp", label: "WhatsApp", icon: Smartphone },
  { path: "/groups", label: "Groups", icon: UsersRound },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  const isActive = (path: string): boolean => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const active = isActive(item.path);
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
            data-ocid={`nav.${item.label.toLowerCase().replace(/\s+/g, "_")}.link`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function BrandLogo() {
  return (
    <div className="flex h-14 items-center border-b px-4">
      <MessageCircle className="h-6 w-6 text-primary mr-2 shrink-0" />
      <span className="text-lg font-display font-bold text-sidebar-foreground truncate">
        My WhatBot
      </span>
    </div>
  );
}

function Footer() {
  return (
    <div className="border-t p-4">
      <p className="text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()}. Built with love using{" "}
        <a
          href="https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=mywhatbot"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}

export function Layout() {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
        <header className="flex h-14 shrink-0 items-center border-b bg-card px-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mr-3"
                data-ocid="nav.mobile_menu.button"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] p-0">
              <BrandLogo />
              <div className="py-4">
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </div>
              <Footer />
            </SheetContent>
          </Sheet>
          <MessageCircle className="h-6 w-6 text-primary mr-2 shrink-0" />
          <span className="text-lg font-display font-bold text-foreground truncate">
            My WhatBot
          </span>
        </header>
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
        <Toaster position="top-right" richColors />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="flex w-[240px] flex-col border-r bg-sidebar">
        <BrandLogo />
        <div className="flex-1 overflow-auto py-4">
          <SidebarNav />
        </div>
        <Footer />
      </aside>
      <main className="flex-1 overflow-auto bg-background p-6">
        <Outlet />
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
