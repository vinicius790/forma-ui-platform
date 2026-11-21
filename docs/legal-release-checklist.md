# Checklist jurídico obrigatório antes da publicação

**Status: licença MIT aprovada e aplicada na raiz (`LICENSE`) e nos metadados SPDX (`package.json`).**

O checklist abaixo permanece como governança antes de cada publicação pública no registro npm:

1. Manter a licença aprovada (`MIT`) coerente em `LICENSE` na raiz e no campo `license` SPDX de todos os pacotes.
2. Rever avisos de terceiros, dependências transitivas e arquivos de referência visual/documental.
3. Confirmar compatibilidade das dependências incorporadas ou distribuídas (SBOM / `pnpm licenses`).
4. Gerar e manter o `pnpm-lock.yaml` atualizado depois de alterações de dependências.
5. Executar `pnpm check:legal-release` e `pnpm check:publish` e revisar os tarballs gerados antes de aprovar o release.
