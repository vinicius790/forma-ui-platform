# @forma-ui/react

Adaptadores headless e acessíveis para React 18 e React 19 construídos sobre `@forma-ui/core`, utilizando `useSyncExternalStore` para leituras livres de *tearing* e `createPortal` para renderização fora da hierarquia DOM.

## Instalação

```bash
pnpm add @forma-ui/react @forma-ui/core
```

## Componentes e Hooks Exportados
- **Contexto Global i18n/RTL:** `<FormaProvider locale="pt-BR" dir="ltr">`, `useFormaI18n()`
- **1. Button:** `<Button pressed={...} loading={...} elementType="button" onPress={...}>`
- **2. Dialog:** `<Dialog>`, `<DialogTrigger>`, `<DialogPortal>`, `<DialogOverlay>`, `<DialogContent>`, `<DialogTitle>`, `<DialogDescription>`, `<DialogClose>`
- **3. Menu:** `<HeadlessMenu triggerLabel="Ações" items={[...]} onSelectItem={...} />`
- **4. Tabs:** `<HeadlessTabs tabs={[...]} orientation="horizontal" activationMode="automatic" />`
- **5. Tooltip:** `<HeadlessTooltip content="Atalho Ctrl+K"><button>Ajuda</button></HeadlessTooltip>`
- **6. Select:** `<HeadlessSelect options={[...]} multiple={false} name="framework" />`
- **7. Toast:** `<ToastProvider>`, `<ToastViewport />`, `useToast()`
- **8. Accordion:** `<HeadlessAccordion type="single" collapsible items={[...]} />`
