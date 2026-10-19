#!/usr/bin/env bash
#
# setup.sh — Configuração inicial do repositório
#
# Execute uma vez, logo após clonar o seu fork e ANTES de começar a desenvolver.
# No Windows, execute pelo Git Bash.
#
# O que este script faz:
#   - ativa os hooks Git de .githooks/ (pre-commit, commit-msg, pre-push)
#   - ativa o registro automático de uso de IA em .agents/changelog/diff.md
#

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo ""
echo "Configurando o repositório do Developer Challenge..."
echo ""

if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo -e "${RED}Erro: este script deve ser executado dentro de um repositório Git.${NC}"
  exit 1
fi

cd "$(git rev-parse --show-toplevel)"

git config core.hooksPath .githooks
chmod +x .githooks/* .agents/hooks/*.sh .agents/*.sh 2>/dev/null || true

# Baseline do registro de IA: tudo que existe agora é o enunciado.
bash .agents/hooks/ai-log.sh init </dev/null

echo -e "${GREEN}✓${NC} Hooks Git ativados: pre-commit, commit-msg, pre-push"
echo -e "${GREEN}✓${NC} Registro de IA ativado: .agents/changelog/diff.md"
echo -e "    • Claude Code e Cursor: automático (hooks do projeto)"
echo -e "    • Outros agentes: seguem o AGENTS.md"
echo -e "    • IA no navegador: ${YELLOW}bash .agents/hooks/ai-log.sh snapshot <Ferramenta>${NC} antes de colar,"
echo -e "      ${YELLOW}bash .agents/hooks/ai-log.sh record <Ferramenta> \"o que pediu\"${NC} depois"
echo ""
echo -e "${YELLOW}Todo commit precisa do trailer${NC} 'AI-Assisted: yes' ${YELLOW}ou${NC} 'AI-Assisted: no'."
echo -e "${YELLOW}Leia as seções 9 e 10 do README.md antes de começar.${NC}"
echo ""
echo -e "${GREEN}Setup concluído. Boa sorte no desafio!${NC}"
echo ""
