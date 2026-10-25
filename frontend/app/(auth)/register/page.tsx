
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Centros de custo fictícios para demonstração.
  // Posteriormente serão carregados do backend.
  const costCenters = [
    { id: "1", name: "Administrativo" },
    { id: "2", name: "Tecnologia" },
    { id: "3", name: "Operações" },
    { id: "4", name: "Produção" },
  ];

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha deve conter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas informadas não coincidem.");
      return;
    }

    if (!costCenter) {
      setError("Selecione um centro de custo.");
      return;
    }

    setIsSubmitting(true);

    // Simulação visual. Nenhuma API é chamada.
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 700);
  };

  // CONFIRMAÇÃO DO CADASTRO
  if (isSuccess) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-blue-50">
          <CheckCircle2 className="size-8 text-[#004289]" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#0F2B4D]">
          Cadastro demonstrativo concluído
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Esta é uma prévia visual. Quando o cadastro
          estiver integrado, sua solicitação será
          encaminhada para análise do administrador.
        </p>

        <div className="mt-7 rounded-lg border border-blue-100 bg-blue-50 p-4 text-left">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-5 text-[#004289]" />

            <div>
              <p className="text-sm font-semibold text-[#003B7A]">
                Aguardando aprovação
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Após a ativação pelo administrador,
                você poderá acessar o portal.
              </p>
            </div>
          </div>
        </div>

        <Button asChild className="mt-7 h-11 w-full">
          <Link href="/login">
            Voltar para o login
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm py-5">
      {/* VOLTAR */}
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition-colors hover:text-[#004289]"
      >
        <ArrowLeft className="size-4" />
        Voltar ao login
      </Link>

      {/* TÍTULO */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-[#0F2B4D]">
          Criar conta
        </h1>

        <p className="mt-2 text-sm leading-5 text-slate-500">
          Preencha seus dados para solicitar acesso
          ao Portal de Compras.
        </p>
      </div>



      <form onSubmit={handleSubmit}>
        <FieldGroup>
          {/* NOME */}
          <Field>
            <FieldLabel htmlFor="name">
              Nome completo
            </FieldLabel>

            <Input
              id="name"
              type="text"
              placeholder="Digite seu nome completo"
              autoComplete="name"
              className="h-11 bg-white"
              required
              minLength={3}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </Field>

          {/* E-MAIL */}
          <Field>
            <FieldLabel htmlFor="email">
              E-mail
            </FieldLabel>

            <Input
              id="email"
              type="email"
              placeholder="seuemail@empresa.com.br"
              autoComplete="email"
              className="h-11 bg-white"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </Field>

          {/* CENTRO DE CUSTO */}
          <Field>
            <FieldLabel htmlFor="costCenter">
              Centro de custo
            </FieldLabel>

            <select
              id="costCenter"
              required
              value={costCenter}
              onChange={(e) => setCostCenter(e.target.value)}
              disabled={isSubmitting}
              className="flex h-11 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:opacity-50"
            >
              <option value="">
                Selecione seu centro de custo
              </option>

              {costCenters.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>

            <p className="mt-1 text-xs text-muted-foreground">
              Selecione o setor ao qual você pertence.
            </p>
          </Field>

          {/* SENHA */}
          <Field>
            <FieldLabel htmlFor="password">
              Senha
            </FieldLabel>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo de 8 caracteres"
                autoComplete="new-password"
                className="h-11 bg-white pr-11"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />

              <button
                type="button"
                aria-label={
                  showPassword
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-[#004289]"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </Field>

          {/* CONFIRMAR SENHA */}
          <Field>
            <FieldLabel htmlFor="confirmPassword">
              Confirmar senha
            </FieldLabel>

            <Input
              id="confirmPassword"
              type="password"
              placeholder="Digite sua senha novamente"
              autoComplete="new-password"
              className="h-11 bg-white"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </Field>

          {/* ERRO */}
          {error && (
            <p
              role="alert"
              className="rounded-md bg-red-50 p-3 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          {/* CADASTRAR */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 h-11 w-full cursor-pointer bg-[#004289] font-semibold text-white hover:bg-[#003B7A]"
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 size-4" />
                Enviando...
              </>
            ) : (
              "Solicitar cadastro"
            )}
          </Button>
        </FieldGroup>
      </form>

      {/* RODAPÉ */}
      <p className="mt-7 text-center text-sm text-slate-500">
        Já possui uma conta?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#004289] hover:underline"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
