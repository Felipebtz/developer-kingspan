
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  LayoutDashboard,
  ClipboardList,
  FilePlus2,
  CheckCircle2,
  Wallet,
  Users,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

type UserRole = "SOLICITANTE" | "APROVADOR" | "ADMIN";

// Usuário fictício para testar o frontend
const DEMO_USER: {
  fullName: string;
  email: string;
  role: UserRole;
} = {
  fullName: "Usuário Solicitante",
  email: "solicitante@exemplo.com",
  role: "ADMIN",
};

const SIDEBAR_NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    Icon: LayoutDashboard,
    roles: ["SOLICITANTE", "APROVADOR", "ADMIN"],
  },
  {
    href: "/dashboard/requests",
    label: "Minhas solicitações",
    Icon: ClipboardList,
    roles: ["SOLICITANTE", "APROVADOR", "ADMIN"],
  },
  {
    href: "/dashboard/requests/new",
    label: "Nova solicitação",
    Icon: FilePlus2,
    roles: ["SOLICITANTE"],
  },
  {
    href: "/dashboard/approvals",
    label: "Aprovações",
    Icon: CheckCircle2,
    roles: ["APROVADOR", "ADMIN"],
  },
  {
    href: "/dashboard/budgets",
    label: "Orçamentos",
    Icon: Wallet,
    roles: ["ADMIN"],
  },
  {
    href: "/dashboard/cost-centers",
    label: "Centros de custo",
    Icon: Building2,
    roles: ["ADMIN"],
  },
  {
    href: "/dashboard/users",
    label: "Gestão de usuários",
    Icon: Users,
    roles: ["ADMIN"],
  },
  {
    href: "/dashboard/settings",
    label: "Configurações",
    Icon: Settings,
    roles: ["ADMIN"],
  },
];

export default function AppSidebar() {
  const pathname = usePathname();

  const navItems = SIDEBAR_NAV.filter((item) =>
    item.roles.includes(DEMO_USER.role)
  );

  const activeHref = navItems
    .filter(
      (item) =>
        pathname === item.href ||
        pathname.startsWith(`${item.href}/`)
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-white/10 text-white [--sidebar:#003B75] [--sidebar-foreground:#FFFFFF] [--sidebar-accent:#14538D] [--sidebar-accent-foreground:#FFFFFF]"
    >
      {/* CABEÇALHO */}
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex items-center gap-3 px-3 py-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white p-1.5">
              <Image
                src="/logo-kingspan.png"
                alt="Kingspan ISOESTE"
                width={36}
                height={36}
                className="max-h-9 w-auto object-contain"
              />
            </div>

            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-bold text-white">
                KINGSPAN ISOESTE
              </p>

              <p className="text-xs text-blue-100/75">
                Portal de Compras
              </p>
            </div>
          </div>
        </SidebarMenu>
      </SidebarHeader>

      {/* CONTEÚDO */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = activeHref === item.href;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-10 cursor-pointer px-3 text-white/80 hover:bg-white/10 hover:text-white data-[active=true]:bg-white/15 data-[active=true]:font-medium data-[active=true]:text-white"
                    >
                      <Link href={item.href}>
                        <item.Icon className="size-5 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* RODAPÉ */}
      <SidebarFooter>
        <div className="flex items-center gap-2.5 rounded-md bg-white/[0.06] p-3">
          <Avatar className="size-9 shrink-0">
            <AvatarFallback className="bg-white/15 font-semibold text-white">
              US
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-white">
              {DEMO_USER.fullName}
            </p>

            <p className="truncate text-xs text-blue-100/70">
              {DEMO_USER.email}
            </p>
          </div>

          <Link
            href="/login"
            title="Voltar ao login"
            aria-label="Voltar ao login"
            className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="size-4" />
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
