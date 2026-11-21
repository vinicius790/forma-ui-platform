# @forma-ui/codemods

CLI de migração AST TypeScript para alterações de API conhecidas. O modo padrão é dry-run: lista arquivos e propriedades que seriam modificados sem gravar arquivos.

```bash
# Preview sem escrever nada
forma-codemod --from v0 --to v1 "src/**/*.{ts,tsx}"

# Aplicação explícita
forma-codemod --from v0 --to v1 "src/**/*.{ts,tsx}" --write
```

Migrações disponíveis: `v0 -> v1` e `v1 -> v2`; é possível encadear `v0 -> v2`. Consulte `supportedMigrations()` na API programática.

As regras renomeiam apenas identificadores usados em posições sintáticas reconhecidas (propriedades, acessos, atributos JSX, métodos e assinaturas). Não transformam strings, comentários, nomes arbitrários, chamadas dinâmicas ou contratos externos. Faça commit/backup antes de executar `--write` e revise o diff. O codemod não substitui leitura do changelog nem migração manual.
