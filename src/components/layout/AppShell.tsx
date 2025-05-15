
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarFooter,
  useSidebar, // Import useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Ticket, Home, BarChart3, Brain, Search, Download, ShieldCheck } from 'lucide-react';
import { DRAW_SCHEDULE, getDrawCategoryBySlug, FlatDrawCategory } from '@/lib/config';
import InstallPWAButton from '@/components/shared/InstallPWAButton';
import { SheetTitle } from '@/components/ui/sheet'; 

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellContent({ children }: AppShellProps) {
  const pathname = usePathname();
  const currentSlug = pathname.split('/draws/')[1]?.split('/')[0];
  const currentDraw = currentSlug ? getDrawCategoryBySlug(currentSlug) : null;
  const isAdminPage = pathname.startsWith('/admin');
  const { isMobile } = useSidebar(); // Get isMobile state from context

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <Ticket className="w-8 h-8 text-primary" />
            {isMobile ? (
              <SheetTitle className="text-xl font-semibold">Loto Predictor</SheetTitle>
            ) : (
              <span className="text-xl font-semibold">Loto Predictor</span>
            )}
          </Link>
        </SidebarHeader>
        <SidebarContent asChild>
          <ScrollArea className="flex-1">
            <SidebarMenu className="p-2">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === '/'}
                  tooltip={{children: "Accueil", side: "right", align:"center"}}
                >
                  <Link href="/">
                    <Home />
                    <span>Accueil</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            {Object.entries(DRAW_SCHEDULE).map(([day, times]) => (
              <SidebarGroup key={day}>
                <SidebarGroupLabel>{day}</SidebarGroupLabel>
                <SidebarMenu>
                  {Object.entries(times).map(([time, details]) => (
                    <SidebarMenuItem key={details.slug}>
                      <SidebarMenuButton
                        asChild
                        isActive={currentDraw?.slug === details.slug}
                        tooltip={{children: `${details.name} (${time})`, side: "right", align:"center"}}
                      >
                        <Link href={`/draws/${details.slug}`}>
                          <Ticket />
                          <span>{details.name} <span className="text-xs opacity-70">({time})</span></span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter className="p-2">
           <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isAdminPage}
                  tooltip={{children: "Administration", side: "right", align:"center"}}
                >
                  <Link href="/admin/draws">
                    <ShieldCheck />
                    <span>Admin</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
           </SidebarMenu>
          {/* <InstallPWAButton /> */}
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
             {currentDraw && !isAdminPage && (
                <h2 className="text-lg font-medium">
                  {currentDraw.name} ({currentDraw.day} - {currentDraw.time})
                </h2>
              )}
              {isAdminPage && (
                 <h2 className="text-lg font-medium">
                  Administration
                </h2>
              )}
          </div>
          <InstallPWAButton />
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}

export default function AppShell(props: AppShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <AppShellContent {...props} />
    </SidebarProvider>
  );
}
