"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Car, LogOut, User, LayoutDashboard, Shield } from "lucide-react";
import type { Profile } from "@/lib/supabase/types";

interface NavbarProps {
  profile?: Profile | null;
}

export function Navbar({ profile }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-blue-600">
            <Car className="h-6 w-6" />
            WashSlot
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/car-washes" className="hover:text-slate-900 transition-colors">
              Find a Car Wash
            </Link>
            {profile?.role === "owner" && (
              <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
                My Dashboard
              </Link>
            )}
            {profile?.role === "admin" && (
              <Link href="/admin" className="hover:text-slate-900 transition-colors">
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-9 w-9 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                      {profile.full_name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/bookings" />} className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    My Bookings
                  </DropdownMenuItem>
                  {profile.role === "owner" && (
                    <DropdownMenuItem render={<Link href="/dashboard" />} className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Owner Dashboard
                    </DropdownMenuItem>
                  )}
                  {profile.role === "admin" && (
                    <DropdownMenuItem render={<Link href="/admin" />} className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                  Sign in
                </Button>
                <Button size="sm" render={<Link href="/signup" />}>
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
