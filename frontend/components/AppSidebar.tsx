
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

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

import {
  logout,
  type AuthState,
} from "@/lib/redux/auth/authSlice";

import type { AuthUser } from "@/lib/api/auth";

type UserRole = "SOLICITANTE" | "APROVADOR" | "ADMIN";

type NavItem = {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  roles: UserRole[];
};

const SIDEBAR_NAV: NavItem[] = [
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const user = useSelector(
    (state: { auth: AuthState }) => state.auth.user
  );

  const profile = user as
    | (AuthUser & { fullName?: string })
    | null;

  const displayName =
    profile?.name ||
    profile?.fullName ||
    "Usuário";

  const displayEmail = profile?.email ?? "";

  const role = profile?.role as UserRole | undefined;

  const initials = getInitials(displayName);

  // Filtra menus conforme o perfil autenticado.
  const navItems = SIDEBAR_NAV.filter(
    (item) =>
      role !== undefined &&
      item.roles.includes(role)
  );

  // Determina a rota ativa, priorizando a mais específica.
  const activeHref = navItems
    .filter(
      (item) =>
        pathname === item.href ||
        pathname.startsWith(`${item.href}/`)
    )
    .sort(
      (a, b) => b.href.length - a.href.length
    )[0]?.href;

  function handleLogout() {
    // Limpa a sessão do Redux.
    dispatch(logout());

    // Remove tokens persistidos no navegador.
    // Ajuste caso o projeto utilize outras chaves.
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
    } catch {
      // O Redux ainda será limpo.
    }

    router.replace("/login");
    router.refresh();
  }

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
                const isActive =
                  activeHref === item.href;

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
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-white">
              {displayName}
            </p>

            <p className="truncate text-xs text-blue-100/70">
              {displayEmail}
            </p>

            {role && (
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-blue-100/60">
                {role}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Sair da conta"
            aria-label="Sair da conta"
            className="rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
