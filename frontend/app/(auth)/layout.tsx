
import Image from "next/image";
import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[44%_56%]">
      {/* LADO ESQUERDO - FORMULÁRIO */}
      <section className="flex min-h-svh flex-col bg-white">
        <div className="mx-auto flex w-full max-w-[450px] flex-1 flex-col px-8 py-8 sm:px-12 lg:px-6">

          {/* LOGO KINGSPAN ISOESTE */}
          <div className="flex items-center">
            <Image
              src="/logo-kingspan.png"
              alt="Kingspan ISOESTE"
              width={240}
              height={70}
              priority
              className="h-auto w-[220px] object-contain"
            />
          </div>

          {/* Conteúdo da autenticação */}
          <main className="flex flex-1 items-center justify-center py-12">
            <div className="w-full">
              {children}
            </div>
          </main>

          <footer className="text-xs text-slate-400">
            © 2026 Kingspan ISOESTE · Projeto demonstrativo
          </footer>
        </div>
      </section>

      {/* LADO DIREITO - MASCOTE */}
      <aside className="relative hidden min-h-svh overflow-hidden bg-[#0055B8] lg:block">

        {/* Blocos geométricos estilo referência */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute left-0 top-0 h-[26%] w-[37%] bg-[#004289]" />
          <div className="absolute left-0 top-[26%] h-[13%] w-[26%] bg-[#004289]" />
          <div className="absolute left-0 top-[39%] h-[13%] w-[15%] bg-[#004289]" />

          <div className="absolute right-0 bottom-0 h-[27%] w-[34%] bg-[#003B7A]" />
          <div className="absolute right-0 bottom-[27%] h-[13%] w-[23%] bg-[#003B7A]" />
          <div className="absolute right-0 bottom-[40%] h-[12%] w-[12%] bg-[#003B7A]" />

          <div className="absolute right-[11%] top-[11%] size-3 rounded-full bg-white/30" />
          <div className="absolute right-[18%] top-[17%] size-1.5 rounded-full bg-white/40" />
          <div className="absolute left-[18%] bottom-[23%] size-2 rounded-full bg-white/30" />
        </div>

        {/* Cabeçalho do painel azul */}
        <div className="absolute left-10 top-10 z-20 xl:left-14 xl:top-12">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">
            Gestão de compras
          </span>
        </div>

        {/* Mascote oficial - Léo */}
        <div className="absolute inset-x-[8%] bottom-[10%] top-[12%] z-10">
          <div className="relative h-full w-full">
            <Image
              src="/mascote-leo-kingspan.jpg"
              alt="Léo, mascote da Kingspan ISOESTE"
              fill
              priority
              sizes="(min-width: 1024px) 56vw, 100vw"
              className="object-contain [mask-image:radial-gradient(ellipse_at_center,black_48%,transparent_78%)]"
            />
          </div>
        </div>

        {/* Rodapé institucional */}
        <div className="absolute bottom-9 left-10 right-10 z-20 xl:left-14">
          <div className="max-w-sm">
            <p className="text-lg font-semibold text-white">
              Solicitações e aprovações
            </p>
            <p className="mt-1 text-sm text-blue-100">
              Um único lugar para acompanhar suas compras.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
