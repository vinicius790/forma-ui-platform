# Versionamento Semântico (SemVer), Publicação e Codemods

## 1. Política de Versionamento Semântico (SemVer 2.0.0)
Todos os pacotes publicados sob o escopo `@forma-ui/*` seguem estritamente o SemVer:
- **PATCH (`1.0.x`):** Correções de bugs de foco/ARIA, melhorias internas de performance e ajustes de tipagem retrocompatíveis.
- **MINOR (`1.x.0`):** Novos componentes headless, novas opções retrocompatíveis em máquinas existentes, novos idiomas no `i18n` ou novos temas em `@forma-ui/themes`.
- **MAJOR (`x.0.0`):** Alterações incompatíveis em contratos de *prop getters*, renomeação de propriedades de opções ou remoção de APIs depreciadas — sempre acompanhadas de um codemod automatizado em `@forma-ui/codemods`.

## 2. Processo de Preparação e Publicação (Changesets)
```bash
# 1. Registrar intenção de mudança (gera arquivo em .changeset/)
pnpm changeset

# 2. Aplicar bump de versão nos package.json afetados e atualizar CHANGELOG.md
pnpm version-packages

# 3. Validar compilação, árvore de exports, ausência de ciclos e suíte de testes
pnpm build
pnpm verify:exports --require-dist
pnpm release:check
pnpm test
pnpm test:a11y

# 4. Publicar no registry configurado (requer autenticação autorizada)
pnpm release
```

## 3. Migração Automatizada com `@forma-ui/codemods`
Para garantir atualizações sem atrito entre versões major, o pacote `@forma-ui/codemods` fornece tanto uma API programática quanto o executável CLI `forma-codemod`:

```bash
# Executar em modo simulação (--dry) para inspecionar alterações sem gravar em disco
npx forma-codemod v0-to-v1-dialog-props ./src --dry

# Aplicar migração recursivamente em um diretório ou arquivo específico
npx forma-codemod v0-to-v1-dialog-props ./src/components/ConfirmModal.tsx
npx forma-codemod v0-to-v1-select-value ./src/forms/CountrySelect.tsx
npx forma-codemod v1-to-v2-direction-provider ./src/App.tsx
```
