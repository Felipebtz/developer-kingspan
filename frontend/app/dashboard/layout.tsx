
import type { ReactNode } from "react";
import Link from "next/link";

import AppSidebar from "@/components/AppSidebar";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import {
  Search,
  UserRound,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      {/* SIDEBAR */}
      <AppSidebar />

      <SidebarInset className="min-w-0 bg-[#F8FAFC]">
        {/* HEADER */}
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
          {/* BOTÃO SIDEBAR */}
          <SidebarTrigger className="-ml-1" />

          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          {/* PESQUISA - VISUAL */}
          <div className="relative h-10 w-full max-w-sm">
            <Search className="absolute left-3 top-3 size-4 text-slate-400" />

            <Input
              type="search"
              placeholder="Buscar solicitação..."
              aria-label="Busca demonstrativa"
              className="h-full w-full border-slate-200 bg-white pl-9"
              readOnly
            />
          </div>

          {/* PERFIL DO USUÁRIO */}
          <div className="ml-auto">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Abrir menu do usuário"
                  className="cursor-pointer rounded-full"
                >
                  <Avatar>
                    <AvatarFallback className="bg-[#EAF2FA] font-semibold text-[#004289]">
                      US
                    </AvatarFallback>
                  </Avatar>
                </button>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                className="w-56 p-2"
              >
                <div className="border-b px-2 py-2">
                  <p className="text-sm font-medium">
                    Usuário Solicitante
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Perfil demonstrativo
                  </p>
                </div>

                <Link
                  href="/dashboard/settings"
                  className="mt-2 flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
                >
                  <UserRound className="size-4" />
                  Minha conta
                </Link>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="min-h-[calc(100svh-64px)] p-4 lg:p-6">
          <div className="mx-auto w-full max-w-[1400px]">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
