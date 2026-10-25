'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/http';
import {
  clearAuthError,
  loginFailed,
  loginStarted,
  loginSucceeded,
  sessionVerified,
} from '@/lib/redux/auth/authSlice';
import { SESSION_TOKEN_KEY } from '@/lib/redux/auth/session';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';

function safeDestination() {
  const next = new URLSearchParams(window.location.search).get('next');
  // Permitir apenas caminhos internos do dashboard; evitar open redirect.
  return next && /^\/dashboard(?:\/|$|\?)/.test(next) ? next : '/dashboard';
}

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { status, erro, user } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isSubmitting = status === 'pending';

  useEffect(() => {
    if (user && status === 'succeeded') {
      router.replace(safeDestination());
    }
  }, [user, status, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;
    dispatch(loginStarted());

    try {
      const response = await authApi.login({ email: email.trim(), password });
      sessionStorage.setItem(SESSION_TOKEN_KEY, response.token);
      dispatch(loginSucceeded(response));

      // Confirma JWT e dados da sessão diretamente no backend.
      const currentUser = await authApi.me();
      dispatch(sessionVerified(currentUser));
      setPassword('');
      router.replace(safeDestination());
    } catch (error: unknown) {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      const message =
        error instanceof ApiError
          ? error.status === 401
            ? 'E-mail, senha ou situação da conta não permitem o acesso.'
            : error.detail
          : 'Não foi possível entrar. Tente novamente.';
      dispatch(loginFailed(message));
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-bold">Entrar</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Acesse seu painel agora</p>
      <form className="mt-7" onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="seuemail@gmail.com"
              autoComplete="username"
              className="h-11"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                dispatch(clearAuthError());
              }}
              disabled={isSubmitting}
            />
          </Field>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              className="h-11"
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                dispatch(clearAuthError());
              }}
              disabled={isSubmitting}
            />
            {erro && <p role="alert" className="mt-3 text-sm text-destructive">{erro}</p>}
          </Field>
          <Button type="submit" className="mt-6 h-11 w-full" disabled={isSubmitting}>
            {isSubmitting ? <><Spinner className="size-4" /> Entrando...</> : 'Iniciar Sessão'}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
