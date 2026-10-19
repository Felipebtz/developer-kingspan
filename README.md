# Programa de Recrutamento - Kingspan

## Teste Técnico — Desenvolvedor(a) Júnior Fullstack

> **Stack:** Java ou Node.js + React ou Angular
> **Prazo:** 2 dias corridos
> **Uso de IA:** permitido, **com registro obrigatório** (ver [seção 9](#9-uso-de-ia--permitido-com-registro-obrigatório))
> **Vídeo:** obrigatório, de 8 a 12 min, com fluxo ao vivo, percurso no código e decisões (ver [seção 7.1](#71-vídeo-de-apresentação-obrigatório))
> **Branch deste enunciado:** `teste-junior`. Ao criar o fork, **desmarque** *"Copy the `main` branch only"* (ver [seção 7](#7-instruções-de-entrega))

---

## Sumário

1. [Contexto do Desafio](#1-contexto-do-desafio)
2. [Requisitos Funcionais](#2-requisitos-funcionais)
3. [Especificação da API REST](#3-especificação-da-api-rest)
4. [Regras de Negócio — Máquina de Estados](#4-regras-de-negócio--máquina-de-estados)
5. [Requisitos Não Funcionais](#5-requisitos-não-funcionais)
6. [Critérios de Avaliação](#6-critérios-de-avaliação)
7. [Instruções de Entrega](#7-instruções-de-entrega)
8. [Dicas e Considerações](#8-dicas-e-considerações)
9. [Uso de IA — permitido, com registro obrigatório](#9-uso-de-ia--permitido-com-registro-obrigatório)
10. [⚠️ Regras do Repositório](#️-10-regras-do-repositório)

---

## 1. Contexto do Desafio

Você foi contratado(a) para construir um sistema interno de gestão de solicitações de compra para uma empresa de médio porte. O fluxo envolve múltiplos papéis de usuários e uma cadeia de aprovações com regras específicas por valor.

**Objetivo principal:** Implementar uma API REST robusta com lógica de estados bem definida, acompanhada de uma interface web que permita ao usuário interagir com o fluxo de aprovações de forma intuitiva.

### 1.1 Papéis de usuário

| Papel | Descrição |
|-------|-----------|
| `SOLICITANTE` | Cria e acompanha suas próprias solicitações |
| `APROVADOR` | Analisa e aprova ou rejeita solicitações atribuídas a ele |
| `ADMIN` | Acesso total; pode cancelar qualquer solicitação e visualizar todos os registros |

---

## 2. Requisitos Funcionais

### 2.1 Autenticação e usuários

- Cadastro de usuário informando nome, e-mail, senha e papel (role)
- Login retornando token JWT
- Endpoints protegidos por autenticação — sem token válido retornam `401`

### 2.2 Solicitações de compra

- Criar solicitação informando: título, descrição, valor e categoria
- Listar solicitações com filtro por status e paginação
- Detalhar uma solicitação pelo ID
- Cancelar solicitação (somente `SOLICITANTE` dono ou `ADMIN`)

### 2.3 Fluxo de aprovação

- Ao criar uma solicitação, o sistema deve determinar automaticamente o nível de aprovação necessário com base no valor
- Um `APROVADOR` pode aprovar ou rejeitar solicitações pendentes
- Ao aprovar/rejeitar, deve ser possível informar um comentário opcional
- Histórico completo de ações (quem fez o quê e quando) deve ser armazenado e consultável

### 2.4 Interface web (front-end)

- Tela de login
- Dashboard com resumo: totais por status (pendente, aprovada, rejeitada, cancelada)
- Listagem de solicitações com filtro por status
- Formulário de criação de solicitação
- Tela de detalhe mostrando: dados da solicitação, status atual e histórico de ações
- Botões de ação contextuais (aprovar, rejeitar, cancelar) exibidos apenas para quem tem permissão no estado atual

---

## 3. Especificação da API REST

### 3.1 Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/auth/register` | Cadastra novo usuário |
| `POST` | `/auth/login` | Autentica e retorna JWT |
| `GET` | `/auth/me` | Retorna dados do usuário logado |

### 3.2 Solicitações

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/requests` | Lista solicitações (paginado, filtrável por status) |
| `POST` | `/requests` | Cria nova solicitação |
| `GET` | `/requests/:id` | Detalha uma solicitação |
| `PATCH` | `/requests/:id/cancel` | Cancela uma solicitação |
| `PATCH` | `/requests/:id/approve` | Aprova uma solicitação (`APROVADOR`) |
| `PATCH` | `/requests/:id/reject` | Rejeita uma solicitação (`APROVADOR`) |
| `GET` | `/requests/:id/history` | Retorna histórico de ações da solicitação |

### 3.3 Padrão de resposta esperado

- **Sucesso:** HTTP `2xx` com corpo JSON padronizado
- **Erros de validação:** HTTP `400` com lista de erros
- **Não autorizado:** HTTP `401` / Sem permissão: HTTP `403`
- **Ação inválida para o estado atual:** HTTP `422` com mensagem descritiva

### 3.4 Exemplo de payload — criar solicitação

```http
POST /requests
Content-Type: application/json

{
  "title": "Compra de notebooks",
  "description": "Aquisição de 5 notebooks para o time de TI",
  "amount": 15000.00,
  "category": "EQUIPMENT"
}
```

---

## 4. Regras de Negócio — Máquina de Estados

### 4.1 Estados possíveis

| Estado | Descrição |
|--------|-----------|
| `PENDING` | Estado inicial após criação |
| `APPROVED` | Aprovada pelo aprovador competente |
| `REJECTED` | Rejeitada pelo aprovador competente |
| `CANCELLED` | Cancelada pelo solicitante ou admin |

### 4.2 Regra de aprovação por valor

| Valor da Solicitação | Nível de Aprovação Necessário |
|----------------------|-------------------------------|
| Até R$ 1.000,00 | `NIVEL_1` — qualquer `APROVADOR` pode aprovar |
| Entre R$ 1.000,01 e R$ 10.000,00 | `NIVEL_2` — apenas `APROVADOR` sênior ou `ADMIN` |
| Acima de R$ 10.000,00 | `NIVEL_3` — somente `ADMIN` pode aprovar |

### 4.3 Transições válidas

```
PENDING → APPROVED   — somente por APROVADOR com nível compatível
PENDING → REJECTED   — somente por APROVADOR com nível compatível
PENDING → CANCELLED  — pelo próprio SOLICITANTE ou por ADMIN
APPROVED  → qualquer coisa — BLOQUEADO (estado final)
REJECTED  → qualquer coisa — BLOQUEADO (estado final)
CANCELLED → qualquer coisa — BLOQUEADO (estado final)
```

> **Ponto crítico de avaliação:** Tentativas de transição inválida devem retornar HTTP `422` com uma mensagem clara explicando por que a ação não é permitida naquele estado.
>
> Exemplo: _"Não é possível aprovar uma solicitação já cancelada."_

---

## 5. Requisitos Não Funcionais

### 5.1 Back-end

- **Linguagem:** Java (Spring Boot) ou Node.js (Express / NestJS / Fastify)
- **Banco de dados:** Relacional (PostgreSQL ou MySQL recomendado)
- **Autenticação:** JWT
- Validação de entrada com mensagens de erro legíveis
- Estrutura de projeto organizada em camadas ou módulos

### 5.2 Front-end

- **Framework:** React ou Angular
- Gerenciamento de estado para o token JWT (localStorage ou Context/Store)
- Tratamento de erros e feedback visual ao usuário (loading, mensagens de erro)
- Não é necessário design sofisticado — clareza e funcionalidade são prioritárias

### 5.3 Entrega

- **Faça um fork deste repositório** e implemente as funcionalidades dentro do próprio fork — trabalhe preferencialmente em **monorepo** (back-end e front-end na mesma base de código, em pastas separadas)
- O repositório do fork deve estar **público** para que a equipe avaliadora possa acessá-lo após a entrega
- `README.md` com instruções claras de como rodar o projeto localmente (dentro de cada pasta: `backend/` e `frontend/`)
- Variáveis de ambiente documentadas com exemplo (`.env.example`)
- Docker / docker-compose são opcionais, mas valorizados

---

## 6. Critérios de Avaliação

A avaliação seguirá os critérios abaixo. A nota final é a média ponderada.

| Critério | Peso |
|----------|------|
| Modelagem de dados — entidades, relacionamentos e integridade | 20% |
| Lógica de estados — transições corretas e tratamento de erros 422 | 25% |
| API REST — organização, padronização e coerência das respostas | 20% |
| Front-end — fluxo funcional e feedback ao usuário | 15% |
| Qualidade de código — legibilidade, separação de responsabilidades | 15% |
| README e documentação — instruções claras e completas | 5% |

### 6.1 Diferenciais (não obrigatórios)

- Testes unitários ou de integração no back-end
- Docker / docker-compose funcional
- Paginação e filtros avançados na listagem
- Tratamento de concorrência (evitar dupla aprovação)

---

## 7. Instruções de Entrega

1. **Faça um fork deste repositório** para a sua conta pessoal do GitHub, **desmarcando** *"Copy the `main` branch only"*
2. Clone o fork e trabalhe na branch **`teste-junior`** (`git switch teste-junior`). **É ela que será avaliada**
3. Execute `./setup.sh` na raiz do fork **antes de começar** (no Windows, pelo **Git Bash**). Ele configura os hooks de proteção e o registro automático de IA
4. Implemente o projeto em estrutura de **monorepo**, criando as pastas dentro do seu fork:
   ```
   backend/    ← back-end
   frontend/   ← front-end
   ```
5. Mantenha o repositório **público** — a equipe avaliadora irá acessá-lo diretamente pelo link, sem necessidade de convite
6. Inclua um `README.md` **dentro de cada pasta** (`backend/` e `frontend/`) com:
   - Descrição do projeto e decisões técnicas relevantes
   - Pré-requisitos e variáveis de ambiente necessárias (com `.env.example`)
   - Passo a passo para rodar localmente
   - Exemplos de requisições (curl ou collection Postman/Insomnia)
7. Grave o **vídeo de apresentação** seguindo o roteiro da [seção 7.1](#71-vídeo-de-apresentação-obrigatório) e coloque o link no `backend/README.md`
8. Envie o link do repositório e do vídeo por e-mail até o prazo informado. O último commit da branch `teste-junior` antes do prazo é o avaliado

> **Importante:**
> - Entregas sem README funcional ou sem instruções suficientes para rodar o projeto serão **desclassificadas**.
> - Projetos que não compilam ou não inicializam **não serão avaliados**.
> - Repositórios **privados** não serão avaliados.
> - Entregas **sem o vídeo**, ou com vídeo que não cubra os 3 blocos da seção 7.1, ficam **incompletas** e não seguem para a próxima etapa.

### 7.1 Vídeo de apresentação (obrigatório)

Queremos ver que você **entende o que construiu**: como o sistema funciona, o que acontece por trás de cada ação e por que você fez desse jeito. Não basta mostrar as telas funcionando.

**Formato**

- **Duração:** 8 a 12 minutos
- **Tela + a sua voz**, em português. Câmera é opcional
- Explique **com as suas palavras**. Pode usar um roteiro de tópicos, mas não leia um texto pronto palavra por palavra nem use narração sintética (voz gerada)
- Grave sobre a versão final do código e diga o **hash do último commit** no início
- Link não listado (YouTube, Loom ou Google Drive com acesso por link)

**Roteiro obrigatório** (nesta ordem; os tempos são referência)

| # | Bloco | O que precisa aparecer |
|---|---|---|
| 1 | **Fluxo ao vivo** (~5 min) | Com o sistema rodando: login como `SOLICITANTE` → criar uma solicitação → login como `APROVADOR` → aprovar ou rejeitar → ver o status e o histórico. Mostre também **uma transição inválida** (ex.: aprovar uma solicitação cancelada) e a resposta `422`. **Em cada passo, diga o que acontece por trás:** qual endpoint é chamado, que regra é verificada e o que é gravado no banco |
| 2 | **Percurso no código** (~4 min) | Siga a requisição de **aprovação** da entrada da API até o banco: autenticação, verificação do papel e do nível de aprovação pelo valor, mudança de estado e gravação do histórico. Mostre **onde fica a regra** que decide o nível (`NIVEL_1`, `NIVEL_2`, `NIVEL_3`) |
| 3 | **Decisões** (~2 min) | Duas ou três decisões que você tomou (ex.: como modelou as tabelas, como organizou as camadas, como tratou os erros): **o que escolheu e por quê**. Se usou IA, conte em que parte usou e algo que precisou corrigir |

**O que não avaliamos no vídeo:** qualidade de imagem, edição, dicção ou nervosismo. Avaliamos se você **entende e consegue explicar** o que entregou.

---

## 8. Dicas e Considerações

### 8.1 Por onde começar

1. Defina e modele as entidades no banco antes de qualquer código
2. Implemente a autenticação e os middlewares de autorização
3. Construa a máquina de estados com testes manuais antes de subir o front-end
4. Integre o front-end por último, aproveitando a API já validada

### 8.2 Armadilhas comuns

- Não ignorar as regras de nível de aprovação por valor — **é a parte mais avaliada**
- Lembrar de validar o papel do usuário **E** o nível de aprovação antes de executar ações
- Retornar mensagens de erro claras no `422` — _"Ação inválida"_ é insuficiente
- Não expor a senha do usuário em nenhuma resposta da API

### 8.3 O que NÃO será penalizado

- Design do front-end (não é uma vaga de UI/UX)
- Ausência de testes automatizados (são diferenciais, não requisito)
- Escolha de framework específico dentro das opções oferecidas

> Boa sorte! Em caso de dúvidas sobre o enunciado, entre em contato antes de tomar decisões de design.

---


## 9. Uso de IA — permitido, com registro obrigatório

Você pode usar ferramentas de IA (Claude Code, Cursor, Copilot, ChatGPT etc.). **O que avaliamos é se você entende e consegue explicar o que entregou.** Por isso o uso precisa ser **rastreável**.

### 9.1 Registro automático (`.agents/changelog/diff.md`)

Depois do `./setup.sh`, cada turno de um agente de IA é registrado sozinho:

| Ferramenta | Como o registro acontece |
|---|---|
| **Claude Code** e **Cursor** | Hooks do projeto (automático) |
| **Codex, GitHub Copilot, Gemini e outros agentes** | O agente lê o `AGENTS.md` e executa os comandos de registro |
| **IA fora do editor** (chat no navegador) | **Você** executa os comandos abaixo antes e depois de colar o código |

```bash
bash .agents/hooks/ai-log.sh snapshot ChatGPT                     # antes de colar o código gerado
bash .agents/hooks/ai-log.sh record ChatGPT "o que você pediu à IA" # depois de colar
```

> 🔒 O registro é commitado no seu fork público. **Não coloque dados pessoais, senhas ou chaves nos prompts.**

### 9.2 Declaração em todo commit

Todo commit precisa ter, na mensagem, o trailer `AI-Assisted: yes` ou `AI-Assisted: no`:

```bash
git commit -m "feat: máquina de estados" -m "AI-Assisted: yes"
```

O hook `commit-msg` recusa commits sem essa linha.

### 9.3 Valorizado (não obrigatório)

Um `AI_USAGE.md` na raiz, escrito por você, contando em poucas linhas quais ferramentas usou, para quê e em que momento a IA errou e você corrigiu.

### 9.4 Eliminatório

- Omitir uso de IA (`AI-Assisted: no` em código gerado por IA)
- Editar ou apagar entradas do `.agents/changelog/diff.md` (ele só recebe novas entradas)
- Desativar ou contornar os hooks (`--no-verify`, alterar `core.hooksPath` etc.)

> Usar IA **não** reduz a nota. Esconder o uso desclassifica.

---

## ⚠️ 10. Regras do Repositório

> Leia esta seção com atenção antes de iniciar o desenvolvimento.

### 10.1 Configuração inicial obrigatória

```bash
./setup.sh
```

O script ativa os hooks Git (`pre-commit`, `commit-msg`, `pre-push`) e o registro automático de IA. No Windows, execute pelo **Git Bash**.

### 10.2 Arquivos protegidos

Os arquivos abaixo são **pré-existentes** e **não podem ser modificados nem removidos**:

| Arquivo / Diretório | Motivo |
|---------------------|--------|
| `README.md` | Enunciado do desafio |
| `.gitignore`, `.gitattributes` | Configuração do repositório (use `.gitignore` próprios dentro de `backend/` e `frontend/`) |
| `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md` | Instruções obrigatórias para agentes de IA |
| `.claude/settings.json`, `.cursor/` | Hooks de registro de IA |
| `.githooks/`, `setup.sh` | Hooks de proteção e instalação |
| `.agents/` | Registro de uso de IA (o `.agents/changelog/diff.md` só recebe novas entradas) |

### 10.3 Consequências

- O **histórico completo de commits** é auditado. Alterar arquivo protegido, adulterar o registro de IA ou contornar os hooks **desclassifica automaticamente**
- Os hooks bloqueiam localmente a maior parte dessas situações, mas a auditoria é feita do nosso lado, sobre o seu fork

### 10.4 Estrutura esperada

```
developer-challenge/          ← seu fork (branch teste-junior)
├── backend/    ← crie aqui o back-end
├── frontend/   ← crie aqui o front-end
└── ...         ← outros arquivos do seu projeto (ex.: docker-compose.yml, AI_USAGE.md)
```

Não altere arquivos fora das suas próprias pastas de trabalho.
