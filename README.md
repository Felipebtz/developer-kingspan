# Programa de Recrutamento - Kingspan

## Teste Técnico — Desenvolvedor(a) Júnior Fullstack

> **Stack:** Java ou Node.js + React ou Angular
> **Prazo:** 3 dias corridos a partir do e-mail de convite; a data e o horário limite estão no convite (esforço estimado: 12–16 h, incluindo o vídeo)
> **Uso de IA:** permitido; o registro é automático e você não precisa marcar nada (ver [seção 9](#9-uso-de-ia--permitido-com-registro-automático))
> **Vídeo:** obrigatório, de 8 a 12 min, seguindo o fluxo operacional do sistema e explicando regras de negócio, detalhes técnicos, validações, decisões e contingências (ver [seção 7.1](#71-vídeo-de-apresentação-obrigatório))
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
9. [Uso de IA — permitido, com registro automático](#9-uso-de-ia--permitido-com-registro-automático)
10. [⚠️ Regras do Repositório](#️-10-regras-do-repositório)
11. [Dúvidas](#11-dúvidas)

---

## 1. Contexto do Desafio

Você foi contratado(a) para construir um sistema interno de gestão de solicitações de compra para uma empresa de médio porte. O fluxo envolve múltiplos papéis de usuários e uma cadeia de aprovações com regras específicas por valor.

**Objetivo principal:** Implementar uma API REST robusta com lógica de estados bem definida, acompanhada de uma interface web que permita ao usuário interagir com o fluxo de aprovações de forma intuitiva.

### 1.1 Papéis de usuário

| Papel | Descrição |
|-------|-----------|
| `SOLICITANTE` | Cria e acompanha suas próprias solicitações |
| `APROVADOR` | Analisa e aprova ou rejeita solicitações **pendentes** cujo nível de aprovação seja compatível com o seu `approverLevel` (ver 4.2) |
| `ADMIN` | Acesso total; aprova qualquer nível, pode cancelar qualquer solicitação e visualizar todos os registros |

- Todo `APROVADOR` tem um atributo **`approverLevel`**: `NIVEL_1` ou `NIVEL_2`. Ele é informado no cadastro (2.1). O "aprovador sênior" da seção 4.2 é o `APROVADOR` com `approverLevel: NIVEL_2`
- Somente `SOLICITANTE` cria solicitações

---

## 2. Requisitos Funcionais

### 2.1 Autenticação e usuários

- Cadastro de usuário informando nome, e-mail, senha e papel (role); para `APROVADOR`, também o `approverLevel` (`NIVEL_1` ou `NIVEL_2`)
- Login retornando token JWT
- Endpoints protegidos por autenticação — sem token válido retornam `401`

### 2.2 Solicitações de compra

- Criar solicitação informando: título, descrição, valor e categoria
- `category` é um enum: `EQUIPMENT | SERVICES | SUPPLIES | TRAVEL | SOFTWARE | OTHER`
- Listar solicitações com filtro por status e paginação, por exemplo `GET /requests?status=PENDING&page=0&size=10`
- Visibilidade: o `SOLICITANTE` vê só as próprias solicitações; `APROVADOR` e `ADMIN` veem todas
- Detalhar uma solicitação pelo ID
- Cancelar solicitação (somente `SOLICITANTE` dono ou `ADMIN`)

### 2.3 Fluxo de aprovação

- Ao criar uma solicitação, o sistema deve determinar automaticamente o nível de aprovação necessário com base no valor
- Um `APROVADOR` pode aprovar ou rejeitar solicitações pendentes
- Ao aprovar/rejeitar, deve ser possível informar um comentário opcional
- Histórico completo de ações (quem fez o quê e quando) deve ser armazenado e consultável

### 2.4 Interface web (front-end)

- Tela de login
- Dashboard com resumo: totais por status (pendente, aprovada, rejeitada, cancelada), considerando só as solicitações que o usuário pode ver
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
- **Não autorizado:** HTTP `401` (sem token ou token inválido)
- **Sem permissão:** HTTP `403` quando o **papel** não permite a ação (ex.: `SOLICITANTE` tentando aprovar)
- **Regra de negócio:** HTTP `422` com mensagem descritiva quando o papel permite, mas a regra impede: ação inválida para o estado atual **ou** nível de aprovação insuficiente (ex.: `APROVADOR` `NIVEL_1` tentando aprovar uma solicitação de `NIVEL_2`)

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
| Até R$ 1.000,00 | `NIVEL_1` — qualquer `APROVADOR` (`NIVEL_1` ou `NIVEL_2`) ou `ADMIN` |
| Entre R$ 1.000,01 e R$ 10.000,00 | `NIVEL_2` — apenas `APROVADOR` com `approverLevel: NIVEL_2` (o "aprovador sênior") ou `ADMIN` |
| Acima de R$ 10.000,00 | `NIVEL_3` — somente `ADMIN` pode aprovar |

### 4.3 Transições válidas

```
PENDING → APPROVED   — somente por APROVADOR com nível compatível, ou ADMIN
PENDING → REJECTED   — somente por APROVADOR com nível compatível, ou ADMIN
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

1. **Faça um fork deste repositório** para a sua conta pessoal do GitHub, **desmarcando** *"Copy the `main` branch only"*. **Não** abra Pull Request para o repositório original
2. Clone o fork e trabalhe na branch **`teste-junior`** (`git switch teste-junior`). **É ela que será avaliada**
3. Execute `./setup.sh` na raiz do fork **antes do primeiro commit** (no Windows, pelo **Git Bash**). Ele configura os hooks de proteção e o registro automático de IA. Se clonar de novo ou trocar de máquina, rode outra vez
4. **Faça todos os commits pelo terminal**, depois do setup. Pelo site do GitHub os hooks não rodam
5. Implemente o projeto em estrutura de **monorepo**, criando as pastas dentro do seu fork:
   ```
   backend/    ← back-end
   frontend/   ← front-end
   ```
6. Mantenha o repositório **público** — a equipe avaliadora irá acessá-lo diretamente pelo link, sem necessidade de convite
7. Inclua um `README.md` **dentro de cada pasta** (`backend/` e `frontend/`) com:
   - Descrição do projeto e decisões técnicas relevantes
   - Pré-requisitos e variáveis de ambiente necessárias (com `.env.example`)
   - Passo a passo para rodar localmente
   - Exemplos de requisições (curl ou collection Postman/Insomnia)
8. Grave o **vídeo de apresentação** conforme a [seção 7.1](#71-vídeo-de-apresentação-obrigatório)
9. Responda ao e-mail do convite com o link do repositório e do vídeo **dentro do prazo**. O último commit da branch `teste-junior` antes do prazo é o avaliado; commits posteriores não são considerados

**Fez o fork só com a `main`?** Recupere a branch do teste no seu clone:

```bash
git remote add upstream https://github.com/kingspanisoeste/developer-challenge.git
git fetch upstream teste-junior
git switch -c teste-junior upstream/teste-junior
git push -u origin teste-junior
```

> **Importante:**
> - Entregas sem README funcional ou sem instruções suficientes para rodar o projeto serão **desclassificadas**.
> - Projetos que não compilam ou não inicializam **não serão avaliados**.
> - Repositórios **privados** não serão avaliados.
> - Entregas **sem o vídeo**, ou com vídeo que não cubra os temas da seção 7.1, ficam **incompletas** e não seguem para a próxima etapa.

### 7.1 Vídeo de apresentação (obrigatório)

Um vídeo **simples**: você usa o sistema seguindo o **fluxo operacional**, do jeito que um usuário usaria, e a cada passo explica **o que está acontecendo e por quê**. Não basta mostrar as telas funcionando.

**Formato**

- **Duração:** 8 a 12 minutos
- **Tela + a sua voz**, em português. Câmera é opcional
- Explique **com as suas palavras**. Pode usar um roteiro de tópicos, mas não leia um texto pronto palavra por palavra nem use narração sintética (voz gerada)
- Hospede onde preferir (Google Drive, OneDrive, YouTube não listado, Loom…), com **acesso por link**, e envie o link no e-mail de entrega

**O fluxo a seguir** (com o sistema rodando)

Login como `SOLICITANTE` → criar uma solicitação → login como `APROVADOR` → aprovar ou rejeitar → ver o status e o histórico. Depois, alguns casos em que o sistema **recusa** a ação.

**Ao longo do fluxo, o vídeo precisa explicar:**

| Tema | O que mostrar e explicar |
|---|---|
| **Regras de negócio** | Como o nível de aprovação é definido pelo valor, quem pode aprovar cada nível e quais transições de estado são permitidas |
| **Detalhes técnicos** | O que cada ação faz por trás: qual endpoint é chamado, onde a regra está no código e o que é gravado no banco e no histórico. Abra o código quando for explicar |
| **Validações** | Dados inválidos, token ausente, papel sem permissão, aprovador sem o nível necessário. Mostre ao vivo pelo menos um `422` (ex.: aprovar uma solicitação cancelada) |
| **Decisões de arquitetura** | Como você modelou as tabelas e organizou as camadas do projeto, e **por que** escolheu assim |
| **Contingências** | O que acontece em situações fora do caminho feliz (ex.: ação em estado final, duas pessoas agindo na mesma solicitação, erro inesperado) e como o sistema responde |
| **Uso de IA** | Se usou, onde usou e algo que precisou corrigir |

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

> Boa sorte! Em caso de dúvidas sobre o enunciado, pergunte antes de tomar decisões de design (ver [seção 11](#11-dúvidas)).

---

## 9. Uso de IA — permitido, com registro automático

Você pode usar ferramentas de IA (Claude Code, Cursor, Copilot, ChatGPT etc.). **O que avaliamos é se você entende e consegue explicar o que entregou.** O uso fica **registrado** pelo próprio repositório, e **você não precisa marcar nada**.

### 9.1 Como o registro funciona (`.agents/changelog/diff.md`)

Depois do `./setup.sh`, os agentes de IA anotam sozinhos o que fizeram, quais arquivos alteraram e quantas linhas:

| Ferramenta | Como o registro acontece |
|---|---|
| **Claude Code** e **Cursor** | Hooks do projeto (automático) |
| **Codex, GitHub Copilot (modo agente), Gemini e outros agentes** | O agente segue as instruções do `AGENTS.md` e faz o registro sozinho |
| **IA fora do editor** (chat no navegador) **gerando código que você cola** | Opcional: `bash .agents/hooks/ai-log.sh snapshot ChatGPT` antes de colar e `bash .agents/hooks/ai-log.sh record ChatGPT "o que pediu"` depois |
| **Autocomplete no editor** ou **chat só para tirar dúvida** | Não precisa registrar |

**Regra simples:** o que está no registro foi feito com IA; **o que não está no registro é considerado escrito por você**, e é cobrado como tal no vídeo e na conversa.

> 🔒 O registro é commitado no seu fork público. **Não coloque dados pessoais, senhas ou chaves nos prompts.**

### 9.2 Marcação dos commits (automática)

- Quando um commit inclui registro de IA, o hook `commit-msg` adiciona sozinho `AI-Assisted: yes` e o nome do agente à mensagem. Commits sem registro não recebem marcação e contam como trabalho sem IA
- **Faça os commits pelo terminal.** Pelo site do GitHub os hooks não rodam

### 9.3 Valorizado (não obrigatório)

Um `AI_USAGE.md` na raiz, escrito por você, contando em poucas linhas quais ferramentas usou, para quê e em que momento a IA errou e você corrigiu.

### 9.4 Eliminatório

- **Impedir o registro**: pedir ao agente para não registrar, desativar os hooks do repositório ou do agente, ou contorná-los (ex.: `--no-verify`, alterar `core.hooksPath`)
- Editar ou apagar entradas do `.agents/changelog/diff.md` (ele só recebe novas entradas)
- Não conseguir explicar, no vídeo ou na conversa, um trecho que você entregou

> Usar IA **não** reduz a nota. Esconder o uso desclassifica.

---

## ⚠️ 10. Regras do Repositório

> Leia esta seção com atenção antes de iniciar o desenvolvimento.

### 10.1 Configuração inicial obrigatória

```bash
./setup.sh
```

O script ativa os hooks Git (`pre-commit`, `commit-msg`, `pre-push`) e o registro automático de IA. No Windows, execute pelo **Git Bash**.

> **Atenção:** ferramentas como **husky** e **lefthook** trocam o `core.hooksPath` e desligam os hooks do desafio, o que é eliminatório. Se quiser lint ou formatação, rode como script do projeto.

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

- O **histórico completo de commits** é auditado. Alterar arquivo protegido, adulterar o registro de IA ou contornar os hooks **desclassifica automaticamente**, mesmo que a alteração tenha sido desfeita depois
- Os hooks bloqueiam localmente a maior parte dessas situações, mas a auditoria é feita do nosso lado, sobre o seu fork

### 10.4 Estrutura esperada

```
developer-challenge/          ← seu fork (branch teste-junior)
├── backend/    ← crie aqui o back-end
├── frontend/   ← crie aqui o front-end
└── ...         ← outros arquivos do seu projeto (ex.: docker-compose.yml, AI_USAGE.md, package.json de workspace)
```

Não altere os arquivos protegidos (10.2). Arquivos novos podem ficar nas suas pastas ou na raiz.

---

## 11. Dúvidas

Responda ao e-mail do convite. **Perguntar é bem-visto e não conta contra você.** Se a resposta não chegar a tempo, decida, escreva a sua premissa no `backend/README.md` e siga em frente.
