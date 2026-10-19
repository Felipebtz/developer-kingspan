# Programa de Recrutamento - Kingspan

## Developer Challenge — testes técnicos

Cada nível tem o seu enunciado em uma **branch própria**. Esta branch (`main`) **não contém nenhum teste**: não desenvolva aqui.

| Nível | Branch | Enunciado |
|---|---|---|
| Desenvolvedor(a) Fullstack **Pleno** | `teste-pleno` | [abrir](https://github.com/kingspanisoeste/developer-challenge/tree/teste-pleno) |
| Desenvolvedor(a) Fullstack **Júnior** | `teste-junior` | [abrir](https://github.com/kingspanisoeste/developer-challenge/tree/teste-junior) |

## Como começar

1. Use a branch indicada no **e-mail do convite**.
2. Faça um fork deste repositório **desmarcando** a opção *"Copy the `main` branch only"*. Sem isso, o fork não traz as branches dos testes.
3. Clone o fork e mude para a branch do seu teste:
   ```bash
   git switch teste-pleno     # ou: git switch teste-junior
   ./setup.sh                 # no Windows, execute pelo Git Bash
   ```
4. Siga o `README.md` da branch. É lá que estão os requisitos, os critérios de avaliação e as regras de uso de IA.

## Fez o fork só com a `main`?

Recupere a branch do seu teste no clone do fork (troque `teste-pleno` por `teste-junior` se for o caso):

```bash
git remote add upstream https://github.com/kingspanisoeste/developer-challenge.git
git fetch upstream teste-pleno
git switch -c teste-pleno upstream/teste-pleno
git push -u origin teste-pleno
```

Dúvidas: responda ao e-mail do convite.
