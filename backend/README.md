# Backend

API Spring Boot 4 / Java 17 para autenticação, solicitações de compra, aprovação sequencial e orçamento.

## Execução pelo Docker Compose

Na raiz do repositório:

```bash
docker compose up --build
```

A API fica em `http://localhost:8085`, o health check em `GET /health` e a documentação OpenAPI em `/swagger-ui.html`. O PostgreSQL é inicializado pelo Flyway com `ddl-auto=validate`.

O Compose ativa um seed somente para demonstração. Ele cria dois centros de custo, oito usuários ativos, orçamentos e cinco solicitações em estados distintos. Todos os usuários abaixo usam a senha fictícia definida por `DEMO_SEED_PASSWORD` (padrão local: `KingspanDemo@2026`):

- `solicitante.operacoes@demo.local`
- `aprovador.n1.operacoes@demo.local`
- `aprovador.n2.operacoes@demo.local`
- `solicitante.projetos@demo.local`
- `aprovador.n1.projetos@demo.local`
- `aprovador.n2.projetos@demo.local`
- `admin.principal@demo.local`
- `admin.reserva@demo.local`

O seed usa identificadores estáveis e não duplica registros ao reiniciar. Desative-o fora de demonstração com `DEMO_SEED_ENABLED=false` e forneça `JWT_SECRET_BASE64`, credenciais do banco e senhas por variáveis externas.

## Build e testes

```bash
./mvnw clean verify
```

No Windows PowerShell, use `./mvnw.cmd clean verify`. Os testes de contexto utilizam PostgreSQL efêmero via Testcontainers.

## Variáveis principais

- `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET_BASE64`: segredo Base64 obrigatório para ambientes reais
- `APP_CORS_ALLOWED_ORIGINS`: origens permitidas, separadas por vírgula
- `DEMO_SEED_ENABLED` e `DEMO_SEED_PASSWORD`
- `LOGGING_STRUCTURED_FORMAT_CONSOLE=logstash`: logs JSON; `X-Request-Id` é propagado ou gerado pela API

Para parar o ambiente preservando os dados, execute `docker compose stop`. Não use `down -v` se quiser manter o volume.
