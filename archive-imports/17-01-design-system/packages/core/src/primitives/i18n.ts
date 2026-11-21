import type { Direction } from './roving-tabindex.js';

export interface FormaMessages {
  'dialog.close': string;
  'select.placeholder': string;
  'select.noOptions': string;
  'select.selectedCount': string;
  'toast.close': string;
  'toast.regionLabel': string;
  'menu.label': string;
  'accordion.expand': string;
  'accordion.collapse': string;
}

export const defaultMessages: Record<string, FormaMessages> = {
  'pt-BR': {
    'dialog.close': 'Fechar diálogo',
    'select.placeholder': 'Selecione uma opção',
    'select.noOptions': 'Nenhuma opção disponível',
    'select.selectedCount': '{count} selecionado(s)',
    'toast.close': 'Fechar notificação',
    'toast.regionLabel': 'Notificações',
    'menu.label': 'Menu de opções',
    'accordion.expand': 'Expandir seção',
    'accordion.collapse': 'Recolher seção'
  },
  'en-US': {
    'dialog.close': 'Close dialog',
    'select.placeholder': 'Select an option',
    'select.noOptions': 'No options available',
    'select.selectedCount': '{count} selected',
    'toast.close': 'Dismiss notification',
    'toast.regionLabel': 'Notifications',
    'menu.label': 'Options menu',
    'accordion.expand': 'Expand section',
    'accordion.collapse': 'Collapse section'
  },
  'es-ES': {
    'dialog.close': 'Cerrar diálogo',
    'select.placeholder': 'Seleccione una opción',
    'select.noOptions': 'No hay opciones disponibles',
    'select.selectedCount': '{count} seleccionado(s)',
    'toast.close': 'Cerrar notificación',
    'toast.regionLabel': 'Notificaciones',
    'menu.label': 'Menú de opciones',
    'accordion.expand': 'Expandir sección',
    'accordion.collapse': 'Contraer sección'
  },
  'ar-SA': {
    'dialog.close': 'إغلاق مربع الحوار',
    'select.placeholder': 'اختر خيارًا',
    'select.noOptions': 'لا توجد خيارات متاحة',
    'select.selectedCount': 'تم تحديد {count}',
    'toast.close': 'إغلاق الإشعار',
    'toast.regionLabel': 'الإشعارات',
    'menu.label': 'قائمة الخيارات',
    'accordion.expand': 'توسيع القسم',
    'accordion.collapse': 'طي القسم'
  }
};

const RTL_LANG_PREFIXES = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi'];

export function getDirectionForLocale(locale: string): Direction {
  const baseLang = locale.split('-')[0]?.toLowerCase() ?? '';
  return RTL_LANG_PREFIXES.includes(baseLang) ? 'rtl' : 'ltr';
}

export interface I18nState {
  locale: string;
  dir: Direction;
  messages: FormaMessages;
}

export interface I18nManager {
  getState: () => I18nState;
  setLocale: (locale: string, customMessages?: Partial<FormaMessages>) => void;
  setDirection: (dir: Direction) => void;
  t: (key: keyof FormaMessages, params?: Record<string, string | number>) => string;
  subscribe: (listener: (state: I18nState) => void) => () => void;
}

export function createI18nManager(
  initialLocale = 'pt-BR',
  initialOverrides?: Partial<FormaMessages>
): I18nManager {
  const listeners = new Set<(state: I18nState) => void>();

  const resolveMessages = (locale: string, overrides?: Partial<FormaMessages>): FormaMessages => {
    const base = defaultMessages[locale] ?? defaultMessages['en-US']!;
    return { ...base, ...overrides };
  };

  let state: I18nState = {
    locale: initialLocale,
    dir: getDirectionForLocale(initialLocale),
    messages: resolveMessages(initialLocale, initialOverrides)
  };

  const notify = () => {
    for (const listener of listeners) listener(state);
  };

  return {
    getState() {
      return state;
    },
    setLocale(locale, customMessages) {
      state = {
        locale,
        dir: getDirectionForLocale(locale),
        messages: resolveMessages(locale, customMessages)
      };
      notify();
    },
    setDirection(dir) {
      state = { ...state, dir };
      notify();
    },
    t(key, params) {
      let text = state.messages[key] ?? defaultMessages['en-US']![key] ?? key;
      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
        }
      }
      return text;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
