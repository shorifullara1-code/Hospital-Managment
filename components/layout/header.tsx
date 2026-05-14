"use client";

import { Bell, Menu, Scan } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger className={buttonVariants({ variant: "ghost", size: "icon", className: "md:hidden" })}>
              <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>
        
        <div className="flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 leading-none">Dashboard</h2>
          <span className="text-[10px] text-slate-400 font-medium mt-1">City General Hospital • Dhaka</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center px-4 py-1.5 bg-teal-50 border border-teal-100 rounded-lg gap-2">
          <div className="bg-teal-500/10 p-1 rounded">
            <Scan className="h-3 w-3 text-teal-600" />
          </div>
          <span className="text-[10px] font-bold text-teal-700 tracking-wide uppercase">Barcode Scanner Active</span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-slate-600">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#E11D48] border-2 border-white" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 rounded-lg border border-slate-200">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
                    <AvatarFallback className="bg-[#052A24] text-white text-[10px]">AD</AvatarFallback>
                  </Avatar>
                  <div className="w-2 h-2 bg-slate-900 rounded-full" />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none">Dr. Sarah Smith</p>
                  <p className="text-xs text-muted-foreground font-medium">
                    sarah.smith@citygeneral.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs font-medium">My Profile</DropdownMenuItem>
              <DropdownMenuItem className="text-xs font-medium">Admin Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs font-medium text-red-600">Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
