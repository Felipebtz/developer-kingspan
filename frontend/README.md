# Frontend

Aplicação Next.js 16 / React para o sistema de solicitações de compra.

## Execução pelo Docker Compose

Na raiz do repositório:

```bash
docker compose up --build
```

Abra `http://localhost:3000`. O JavaScript do navegador acessa a API pela URL pública definida em `NEXT_PUBLIC_API_URL` (padrão `http://localhost:8085`), incorporada durante o build da imagem.

## Desenvolvimento local

```bash
npm ci
npm run dev
```

Crie `frontend/.env.local` apenas para configuração local e não o versione. Exemplo:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8085
```

## Qualidade e build

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

O container usa o artefato `standalone` do Next.js e executa como usuário não privilegiado. Para parar o ambiente preservando os dados, use `docker compose stop` na raiz.
