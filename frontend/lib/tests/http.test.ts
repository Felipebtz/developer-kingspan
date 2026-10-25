/** Testes unitários Vitest. Executar após confirmar/configurar o runner no projeto real. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {apiRequest,ApiError,configureApiAuth
} from '../api/http';

import { authApi } from '../api/auth';;

const user = { id: 2, name: 'Usuário Teste', email: 'user@example.test', role: 'SOLICITANTE', status: 'ACTIVE' };

describe('Microchunk 1: cliente HTTP + auth', () => {
  const logout = vi.fn();
  beforeEach(() => {
    logout.mockReset();
    configureApiAuth({ getToken: () => 'jwt-de-teste', onUnauthorized: logout });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('AUTH-01: POST /auth/login envia credenciais e lê token/user', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ token: 'jwt-valido', user }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await authApi.login({ email: user.email, password: 'senha-teste' });
    expect(result.token).toBe('jwt-valido');
    expect(result.user.email).toBe(user.email);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers instanceof Headers && init.headers.has('Authorization')).toBe(false);
    expect(JSON.parse(init.body as string)).toEqual({ email: user.email, password: 'senha-teste' });
  });

  it('AUTH-02: 401 do login preserva sessão e não chama logout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'INVALID_CREDENTIALS', detail: 'Credenciais inválidas' }), { status: 401 })));
    await expect(authApi.login({ email: 'x@y.com', password: 'errada' })).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    expect(logout).not.toHaveBeenCalled();
  });

  it('AUTH-04: adiciona Bearer ao GET autenticado', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(user), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await authApi.me();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer jwt-de-teste');
  });

  it('AUTH-05: 401 autenticado emite logout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'Expirado' }), { status: 401 })));
    await expect(authApi.me()).rejects.toBeInstanceOf(ApiError);
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('preserva Problem Details 409', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'STALE_VERSION', detail: 'Atualize os dados', requestId: 'req-1', errors: [{ field: 'lockVersion' }] }), { status: 409, headers: { 'Content-Type': 'application/problem+json' } })));
    await expect(apiRequest('/requests/1')).rejects.toMatchObject({ status: 409, code: 'STALE_VERSION', requestId: 'req-1', errors: [{ field: 'lockVersion' }] });
  });

  it('204 não tenta ler JSON inexistente', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(apiRequest<void>('/requests/1/approve', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('falha de rede tem código distinto de erro de regra', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(authApi.me()).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });
});
