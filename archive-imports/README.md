# Archive imports — fonte e proveniência

Esta pasta preserva a segunda fonte fornecida para a consolidação do Forma UI.

- `17-01-design-system/`: extração fiel do conteúdo do RAR recebido. Os caminhos internos e bytes dos arquivos foram preservados.
- `original/17-01-design-system.rar`: arquivo RAR original, sem alteração.

**Importante:** `17-01-design-system/` é uma fotografia histórica de código, não um segundo workspace pnpm. Não compile nem publique seus `package.json` a partir daqui. Os 116 caminhos em conflito divergiam dos correspondentes no projeto ZIP; portanto, sobrescrevê-los automaticamente poderia quebrar APIs e exports. Consulte `../docs/source-merge-report.md` e `../docs/source-merge-manifest.json`.
