import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  FormaProvider,
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  HeadlessTabs,
  HeadlessSelect,
  HeadlessAccordion,
  ToastProvider,
  ToastViewport,
  useToast
} from '../index.js';
import { expectNoA11yViolations } from '@forma-ui/a11y-testing';

function ToastTriggerHelper() {
  const toast = useToast();
  return (
    <Button onPress={() => toast.success('Salvo com sucesso', 'Alterações persistidas.')}>
      Notificar
    </Button>
  );
}

describe('@forma-ui/react adapters', () => {
  it('renders accessible Dialog, Tabs, Select, Accordion, and Toast in React and passes axe-core', async () => {
    const { container } = render(
      <FormaProvider locale="pt-BR">
        <ToastProvider>
          <ToastTriggerHelper />
          <ToastViewport />
        </ToastProvider>

        <Dialog>
          <DialogTrigger>Abrir Diálogo</DialogTrigger>
          <DialogContent>
            <DialogTitle>Configurações</DialogTitle>
            <DialogDescription>Ajuste suas preferências.</DialogDescription>
            <DialogClose>Fechar</DialogClose>
          </DialogContent>
        </Dialog>

        <HeadlessTabs
          ariaLabel="Navegação principal"
          tabs={[
            { value: 'overview', label: 'Visão Geral', content: 'Painel Visão Geral' },
            { value: 'metrics', label: 'Métricas', content: 'Painel Métricas' }
          ]}
        />

        <HeadlessSelect
          ariaLabel="Ambiente"
          options={[
            { value: 'prod', label: 'Produção' },
            { value: 'staging', label: 'Homologação' }
          ]}
        />

        <HeadlessAccordion
          items={[
            { value: 'faq-1', title: 'O que é headless UI?', content: 'Lógica + A11y sem CSS imposto.' }
          ]}
        />
      </FormaProvider>
    );

    // Trigger toast
    fireEvent.click(screen.getByText('Notificar'));
    expect(screen.getByText('Salvo com sucesso')).toBeInTheDocument();

    // Open dialog
    fireEvent.click(screen.getByText('Abrir Diálogo'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Audit entire React tree with axe-core
    await expectNoA11yViolations(container);
  });
});
