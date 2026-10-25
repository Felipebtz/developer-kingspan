'use client';

import { useEffect } from 'react';
import { authApi } from '../api/auth';
import { ApiError, configureApiAuth } from '../api/http';
import { loginFailed, logout, restoreToken, sessionVerified } from './auth/authSlice';
import { SESSION_TOKEN_KEY } from './auth/session';
import { useAppStore } from './hooks';

/** Inicializa o bridge sem criar dependência circular entre HTTP e Redux. */
export function ApiAuthBootstrap() {
  const store = useAppStore();

  useEffect(() => {
    configureApiAuth({
      getToken: () => store.getState().auth.accessToken,
      onUnauthorized: () => {
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
        store.dispatch(logout());

        if (window.location.pathname !== '/login') {
          const attemptedPath = window.location.pathname + window.location.search;
          const query = new URLSearchParams({ next: attemptedPath });
          window.location.replace(`/login?${query.toString()}`);
        }
      },
    });

    const savedToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (!savedToken || store.getState().auth.accessToken) return;

    store.dispatch(restoreToken(savedToken));
    void authApi.me()
      .then((user) => {
        // Evita que uma resposta antiga restaure uma sessão encerrada no meio do processo.
        if (store.getState().auth.accessToken === savedToken) {
          store.dispatch(sessionVerified(user));
        }
      })
      .catch((error: unknown) => {
        if (store.getState().auth.accessToken !== savedToken) return;
        if (error instanceof ApiError && error.status === 0) {
          // Não declarar token inválido apenas porque a rede caiu.
          store.dispatch(loginFailed('Não foi possível validar a sessão. Entre novamente.'));
        } else {
          sessionStorage.removeItem(SESSION_TOKEN_KEY);
          store.dispatch(logout());
        }
      });
  }, [store]);

  return null;
}
