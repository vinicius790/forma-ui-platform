# @forma-ui/cli

Ferramenta local para descobrir integrações, diagnosticar projetos e gerar um ponto de partida sem sobrescrever arquivos existentes. Não instala dependências automaticamente e não altera manifestos do projeto consumidor.

## Comandos

```bash
forma list
forma doctor --cwd ./meu-app
forma init --framework react --cwd ./meu-app
forma add theme --cwd ./meu-app
```

Frameworks/targets reconhecidos: React, Preact, Vue 3, Svelte 5, Solid, Lit/Web Components, Angular e Vanilla DOM. O comando `init` cria `src/forma-ui.ts` e recusa sobrescrita; `add theme` cria `src/styles/forma-theme.css` e também recusa sobrescrita.

`doctor` informa a presença de package.json, node_modules, lockfile e configuração TypeScript. É um diagnóstico superficial: não substitui o gerenciador de pacotes, o compilador, a auditoria de dependências ou as verificações do projeto.

## Segurança e limitações

- Execute a CLI com permissões normais do usuário, nunca como administrador sem necessidade.
- Revise os arquivos gerados antes de integrá-los.
- A CLI não executa scripts do projeto consumidor nem baixa código remoto.
- `vanilla` usa o core diretamente; os outros targets geram imports dos adapters correspondentes.
