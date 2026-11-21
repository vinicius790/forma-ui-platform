type Direction = 'ltr' | 'rtl';
interface KeyRule { key: string; action: string; rtl?: string }
interface ComponentKeyboardSpec { component: string; pattern: string; keys: KeyRule[] }
const keyboardMatrix: ComponentKeyboardSpec[] = [
  { component: 'Button', pattern: 'HTML button nativo', keys: [{ key: 'Enter / Space', action: 'Ativa o botão' }] },
  { component: 'Dialog', pattern: 'Dialog modal', keys: [{ key: 'Tab', action: 'Move o foco dentro do modal' }, { key: 'Shift + Tab', action: 'Move o foco em sentido inverso' }, { key: 'Escape', action: 'Fecha e restaura o foco' }] },
  { component: 'Menu', pattern: 'Menu de ações', keys: [{ key: 'ArrowDown / ArrowUp', action: 'Move entre itens' }, { key: 'Home / End', action: 'Primeiro / último item' }, { key: 'Escape', action: 'Fecha e devolve foco ao trigger' }, { key: 'Typeahead', action: 'Busca pelo início do texto' }] },
  { component: 'Tabs', pattern: 'Tabs', keys: [{ key: 'ArrowRight', action: 'Próxima tab', rtl: 'Tab anterior' }, { key: 'ArrowLeft', action: 'Tab anterior', rtl: 'Próxima tab' }, { key: 'ArrowDown / ArrowUp', action: 'Navegação vertical' }, { key: 'Home / End', action: 'Primeira / última tab' }] },
  { component: 'Tooltip', pattern: 'Tooltip não interativo', keys: [{ key: 'Focus', action: 'Exibe tooltip' }, { key: 'Escape', action: 'Fecha tooltip' }] },
  { component: 'Select', pattern: 'Select-only combobox', keys: [{ key: 'ArrowDown / ArrowUp', action: 'Abre e navega opções' }, { key: 'Enter / Space', action: 'Abre ou confirma opção' }, { key: 'Escape', action: 'Fecha sem confirmar' }, { key: 'Typeahead', action: 'Localiza opções' }] },
  { component: 'Toast', pattern: 'Status não modal', keys: [{ key: 'Tab', action: 'Alcança ação/dispensa quando presente' }, { key: 'Escape', action: 'Não fecha globalmente; use botão de dispensa' }] },
  { component: 'Accordion', pattern: 'Accordion heading/button', keys: [{ key: 'Enter / Space', action: 'Expande ou recolhe seção' }, { key: 'Tab', action: 'Navega entre cabeçalhos e conteúdo' }] },
  { component: 'Checkbox', pattern: 'Native checkbox', keys: [{ key: 'Space', action: 'Alterna marcado/desmarcado' }] },
  { component: 'Switch', pattern: 'Native button switch', keys: [{ key: 'Space / Enter', action: 'Alterna ligado/desligado' }] },
  { component: 'RadioGroup', pattern: 'Radio group', keys: [{ key: 'Arrow keys', action: 'Move e seleciona opções conforme orientação', rtl: 'Move e seleciona opções em direção espelhada' }, { key: 'Home / End', action: 'Primeira / última opção' }] },
  { component: 'Slider', pattern: 'Slider', keys: [{ key: 'Arrow keys', action: 'Ajusta o valor respeitando orientação e RTL' }, { key: 'Home / End', action: 'Valor mínimo / máximo' }, { key: 'PageUp / PageDown', action: 'Ajuste em passos maiores' }] },
  { component: 'Combobox', pattern: 'Editable combobox', keys: [{ key: 'ArrowDown / ArrowUp', action: 'Abre e percorre opções' }, { key: 'Enter', action: 'Seleciona a opção ativa' }, { key: 'Escape', action: 'Fecha a lista' }] },
  { component: 'Pagination', pattern: 'Pagination buttons', keys: [{ key: 'Enter / Space', action: 'Ativa a página selecionada' }] },
  { component: 'Popover', pattern: 'Non-modal / modal dialog popover', keys: [{ key: 'Enter / Space', action: 'Abre ou fecha o popover no trigger' }, { key: 'Escape', action: 'Fecha o popover e restaura o foco' }] },
  { component: 'Drawer', pattern: 'Slide-over modal dialog', keys: [{ key: 'Tab / Shift + Tab', action: 'Mantém o foco contido no drawer modal' }, { key: 'Escape', action: 'Fecha o drawer, libera scroll lock e restaura foco' }] },
  { component: 'Splitter', pattern: 'Window Splitter (role="separator")', keys: [{ key: 'ArrowRight / ArrowLeft', action: 'Redimensiona painéis horizontais (+Shift passo largo)' }, { key: 'Home / End', action: 'Ajusta para tamanho mínimo ou máximo' }, { key: 'Enter', action: 'Alterna recolher e restaurar painel' }] },
  { component: 'ContextMenu', pattern: 'Context menu', keys: [{ key: 'Shift + F10 / ContextMenu', action: 'Abre o menu contextual via teclado' }, { key: 'Escape', action: 'Fecha o menu contextual' }] },
  { component: 'Stepper', pattern: 'Multi-step wizard', keys: [{ key: 'ArrowRight / ArrowLeft', action: 'Navega entre passos respeitando modo linear', rtl: 'Navega em direção espelhada' }, { key: 'Home / End', action: 'Primeiro / último passo' }] },
  { component: 'Carousel', pattern: 'WAI-ARIA Carousel', keys: [{ key: 'ArrowRight / ArrowLeft', action: 'Avança / retrocede slide' }, { key: 'Home / End', action: 'Primeiro / último slide' }] },
  { component: 'ColorPicker', pattern: '2D Color Area Slider', keys: [{ key: 'ArrowRight / ArrowLeft', action: 'Ajusta saturação (+Shift em passos de 10%)' }, { key: 'ArrowUp / ArrowDown', action: 'Ajusta luminosidade (+Shift em passos de 10%)' }] },
  { component: 'TagsInput', pattern: 'Editable chips list', keys: [{ key: 'Enter / ,', action: 'Confirma nova tag' }, { key: 'Backspace / ArrowLeft', action: 'Seleciona ou remove última tag quando input vazio' }] },
  { component: 'Editable', pattern: 'Inline editable text', keys: [{ key: 'Enter / F2', action: 'Entra em modo de edição' }, { key: 'Enter / Escape', action: 'Confirma ou cancela edição' }] },
  { component: 'SegmentGroup', pattern: 'Segmented radio group', keys: [{ key: 'ArrowRight / ArrowLeft', action: 'Alterna segmento ativo', rtl: 'Alterna segmento em direção espelhada' }] },
  { component: 'TreeGrid', pattern: 'WAI-ARIA Treegrid (2D hierárquico)', keys: [{ key: 'ArrowDown / ArrowUp', action: 'Move entre linhas visíveis' }, { key: 'ArrowRight', action: 'Expande linha ou avança coluna', rtl: 'Recolhe linha ou retrocede coluna' }, { key: 'ArrowLeft', action: 'Recolhe linha ou retrocede coluna', rtl: 'Expande linha ou avança coluna' }, { key: 'Home / End', action: 'Primeira / última célula da linha (+Ctrl para início/fim da grade)' }] },
  { component: 'Menubar', pattern: 'WAI-ARIA Menubar horizontal', keys: [{ key: 'ArrowRight / ArrowLeft', action: 'Move entre itens de nível superior', rtl: 'Move entre itens em direção espelhada' }, { key: 'ArrowDown / Enter / Space', action: 'Abre submenu e foca o primeiro item' }, { key: 'Escape', action: 'Fecha submenu e restaura foco ao menubar' }] },
  { component: 'Feed', pattern: 'WAI-ARIA Feed de artigos', keys: [{ key: 'PageDown / PageUp', action: 'Move foco para o próximo / anterior artigo do feed' }, { key: 'Ctrl + Home / Ctrl + End', action: 'Move foco para o início / fim fora do feed' }] },
  { component: 'Kanban', pattern: 'Quadro Kanban acessível por teclado', keys: [{ key: 'ArrowUp / ArrowDown', action: 'Navega entre cartões na coluna' }, { key: 'ArrowRight / ArrowLeft', action: 'Move foco entre colunas (ou move cartão quando em modo arrasto)', rtl: 'Move entre colunas em direção espelhada' }, { key: 'Space / Enter', action: 'Ativa/solta modo de movimentação do cartão' }, { key: 'Escape', action: 'Cancela movimentação e restaura posição original' }] },
  { component: 'BottomSheet', pattern: 'Modal bottom sheet com pontos de encaixe', keys: [{ key: 'Tab / Shift + Tab', action: 'Mantém o foco contido na folha modal' }, { key: 'ArrowUp / ArrowDown', action: 'Alterna snap points quando no handle de arrasto' }, { key: 'Escape', action: 'Fecha a folha inferior e restaura foco ao trigger' }] },
  { component: 'OtpInput', pattern: 'Entrada de código OTP / verificação', keys: [{ key: '0-9 / Caractere', action: 'Preenche dígito e avança automaticamente para o próximo campo' }, { key: 'Backspace', action: 'Limpa campo atual ou retrocede e limpa o anterior' }, { key: 'ArrowRight / ArrowLeft', action: 'Move foco entre slots de código', rtl: 'Move foco entre slots em direção espelhada' }, { key: 'Ctrl+V / Paste', action: 'Distribui o código colado nos slots sequenciais' }] },
];
function keysForDirection(spec: ComponentKeyboardSpec, direction: Direction): KeyRule[] {
  return spec.keys.map((rule) => ({ ...rule, action: direction === 'rtl' && rule.rtl ? rule.rtl : rule.action }));
}
export function renderKeyboardMatrix(target: HTMLElement, direction: Direction): void {
  target.replaceChildren();
  const table = document.createElement('table'); table.className = 'keyboard-matrix';
  table.innerHTML = '<caption>Matriz de teclado — a regra direcional é espelhada em RTL quando aplicável</caption><thead><tr><th>Componente</th><th>Tecla</th><th>Resultado</th></tr></thead>';
  const body = document.createElement('tbody');
  for (const spec of keyboardMatrix) for (const rule of keysForDirection(spec, direction)) { const row = document.createElement('tr'); for (const value of [spec.component, rule.key, rule.action]) { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); } body.append(row); }
  table.append(body); target.append(table);
}
