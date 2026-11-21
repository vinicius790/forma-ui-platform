const truthyJsxValue = (attribute) => {
  if (!attribute?.value) return true;
  if (attribute.value.type === 'JSXExpressionContainer') {
    const expression = attribute.value.expression;
    return expression.type === 'Literal' ? Boolean(expression.value) : false;
  }
  return attribute.value.type === 'Literal' ? Boolean(attribute.value.value) : true;
};

const ariaHiddenIsTrue = (attribute) => {
  if (!attribute?.value) return true;
  if (attribute.value.type === 'JSXExpressionContainer') {
    const expression = attribute.value.expression;
    if (expression.type === 'Literal') return expression.value === true || expression.value === 'true';
    return true;
  }
  return attribute.value.type === 'Literal' && (attribute.value.value === true || attribute.value.value === 'true');
};

const stringJsxValue = (attribute) => {
  if (!attribute?.value) return null;
  if (attribute.value.type === 'Literal' && typeof attribute.value.value === 'string') return attribute.value.value;
  if (
    attribute.value.type === 'JSXExpressionContainer' &&
    attribute.value.expression.type === 'Literal' &&
    typeof attribute.value.expression.value === 'string'
  ) {
    return attribute.value.expression.value;
  }
  return null;
};

const numericJsxValue = (attribute) => {
  if (!attribute?.value) return null;
  const expression = attribute.value.type === 'JSXExpressionContainer'
    ? attribute.value.expression
    : attribute.value;
  if (expression.type === 'Literal' && typeof expression.value === 'number') return expression.value;
  if (expression.type === 'Literal' && typeof expression.value === 'string' && /^[+-]?\d+$/u.test(expression.value.trim())) return Number(expression.value);
  if (expression.type === 'UnaryExpression' && expression.operator === '-' && expression.argument.type === 'Literal' && typeof expression.argument.value === 'number') {
    return -expression.argument.value;
  }
  return null;
};

const buttonType = {
  meta: {
    type: 'problem',
    docs: { description: 'Require an explicit type on native JSX buttons to avoid accidental form submission.' },
    schema: [],
    messages: { missing: 'Add an explicit type="button", type="submit" or type="reset" to this button.' },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name.toLowerCase() !== 'button') return;
        if (node.attributes.some((attribute) => attribute.type === 'JSXAttribute' && attribute.name.type === 'JSXIdentifier' && attribute.name.name === 'type')) return;
        context.report({ node, messageId: 'missing' });
      },
    };
  },
};

const noPositiveTabindex = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow positive tabIndex values that create a confusing custom tab order.' },
    schema: [],
    messages: { positive: 'Avoid positive tabIndex values. Use natural DOM order and roving tabindex for composite widgets.' },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'tabIndex') return;
        const value = numericJsxValue(node);
        if (value !== null && value > 0) context.report({ node, messageId: 'positive' });
      },
    };
  },
};

const noAriaHiddenFocusable = {
  meta: {
    type: 'problem',
    docs: { description: 'Prevent focusable JSX elements from being hidden from the accessibility tree.' },
    schema: [],
    messages: { hiddenFocusable: 'This element is aria-hidden but can receive keyboard focus. Remove focusability or do not hide it from the accessibility tree.' },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const attributes = node.attributes.filter((attribute) => attribute.type === 'JSXAttribute' && attribute.name.type === 'JSXIdentifier');
        const hidden = attributes.find((attribute) => attribute.name.name === 'aria-hidden');
        if (!hidden || !ariaHiddenIsTrue(hidden)) return;
        const tabIndex = attributes.find((attribute) => attribute.name.name === 'tabIndex');
        const autoFocus = attributes.find((attribute) => attribute.name.name === 'autoFocus');
        const disabled = attributes.some((attribute) => attribute.name.name === 'disabled' && truthyJsxValue(attribute));
        const tag = node.name.type === 'JSXIdentifier' ? node.name.name.toLowerCase() : '';
        const hasHref = attributes.some((attribute) => attribute.name.name === 'href');
        const nativeFocusable = !disabled && (tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea' || (tag === 'a' && hasHref));
        const tabIndexValue = tabIndex ? numericJsxValue(tabIndex) : null;
        const explicitFocusable = tabIndexValue !== null && tabIndexValue >= 0;
        if (nativeFocusable || explicitFocusable || (!disabled && autoFocus)) context.report({ node: hidden, messageId: 'hiddenFocusable' });
      },
    };
  },
};

const noAutofocus = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Warn against autoFocus props that hijack keyboard focus unexpectedly.' },
    schema: [],
    messages: { avoidAutofocus: 'Avoid autoFocus; manage initial focus explicitly through FocusTrap or DialogController.' },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type === 'JSXIdentifier' && node.name.name === 'autoFocus' && truthyJsxValue(node)) {
          context.report({ node, messageId: 'avoidAutofocus' });
        }
      },
    };
  },
};

const noRolePresentationOnFocusable = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow role="presentation" or role="none" on natively focusable elements.' },
    schema: [],
    messages: { conflict: 'Do not apply role="presentation" or role="none" to a focusable element.' },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const tag = node.name.type === 'JSXIdentifier' ? node.name.name.toLowerCase() : '';
        if (!['button', 'input', 'select', 'textarea', 'a'].includes(tag)) return;
        const roleAttr = node.attributes.find((a) => a.type === 'JSXAttribute' && a.name.type === 'JSXIdentifier' && a.name.name === 'role');
        const role = stringJsxValue(roleAttr);
        if (role === 'presentation' || role === 'none') context.report({ node: roleAttr, messageId: 'conflict' });
      },
    };
  },
};

const requireAccessibleButtonName = {
  meta: {
    type: 'problem',
    docs: { description: 'Require self-closing native JSX buttons to declare aria-label or aria-labelledby.' },
    schema: [],
    messages: { missingName: 'Self-closing <button /> must provide aria-label or aria-labelledby.' },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (!node.selfClosing || node.name.type !== 'JSXIdentifier' || node.name.name.toLowerCase() !== 'button') return;
        const hasSpread = node.attributes.some((a) => a.type === 'JSXSpreadAttribute');
        if (hasSpread) return;
        const hasLabel = node.attributes.some(
          (a) => a.type === 'JSXAttribute' && a.name.type === 'JSXIdentifier' && (a.name.name === 'aria-label' || a.name.name === 'aria-labelledby'),
        );
        if (!hasLabel) context.report({ node, messageId: 'missingName' });
      },
    };
  },
};

const VALID_WAI_ARIA_1_2_ROLES = new Set([
  // Widget & composite widget roles
  'alert', 'alertdialog', 'button', 'checkbox', 'combobox', 'dialog', 'grid',
  'gridcell', 'link', 'listbox', 'log', 'marquee', 'menu', 'menubar',
  'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'progressbar',
  'radio', 'radiogroup', 'scrollbar', 'searchbox', 'separator', 'slider',
  'spinbutton', 'status', 'switch', 'tab', 'tablist', 'tabpanel', 'textbox',
  'timer', 'tooltip', 'tree', 'treegrid', 'treeitem',
  // Document structure roles
  'application', 'article', 'blockquote', 'caption', 'cell', 'code',
  'columnheader', 'definition', 'deletion', 'directory', 'document',
  'emphasis', 'feed', 'figure', 'generic', 'group', 'heading', 'img',
  'insertion', 'list', 'listitem', 'math', 'meter', 'none', 'note',
  'paragraph', 'presentation', 'row', 'rowgroup', 'rowheader', 'strong',
  'subscript', 'superscript', 'table', 'term', 'time', 'toolbar',
  // Landmark roles
  'banner', 'complementary', 'contentinfo', 'form', 'main', 'navigation',
  'region', 'search',
]);

const validAriaRole = {
  meta: {
    type: 'problem',
    docs: { description: 'Validate literal JSX role attributes against the WAI-ARIA 1.2 concrete role set.' },
    schema: [],
    messages: {
      invalidRole: 'Invalid WAI-ARIA 1.2 role "{{role}}". Use a valid concrete WAI-ARIA role or native HTML semantics.',
      emptyRole: 'The role attribute must not be empty.',
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'role') return;
        const raw = stringJsxValue(node);
        if (raw === null) return;
        const tokens = raw.trim().split(/\s+/u).filter(Boolean);
        if (tokens.length === 0) {
          context.report({ node, messageId: 'emptyRole' });
          return;
        }
        for (const token of tokens) {
          if (!VALID_WAI_ARIA_1_2_ROLES.has(token)) {
            context.report({ node, messageId: 'invalidRole', data: { role: token } });
            return;
          }
        }
      },
    };
  },
};

const noClickableNonInteractive = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Flag clickable non-interactive <div> and <span> elements lacking role, tabIndex, or keyboard handler.',
    },
    schema: [],
    messages: {
      inaccessibleClick:
        'Clickable <{{tag}}> must provide a semantic role, tabIndex, and keyboard handler (onKeyDown/onKeyUp/onKeyPress), or use a native <button>.',
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier') return;
        const tag = node.name.name.toLowerCase();
        if (tag !== 'div' && tag !== 'span') return;
        if (node.attributes.some((attr) => attr.type === 'JSXSpreadAttribute')) return;

        const attrs = node.attributes.filter(
          (attr) => attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier',
        );
        const hasOnClick = attrs.some((attr) => attr.name.name === 'onClick');
        if (!hasOnClick) return;

        const roleAttr = attrs.find((attr) => attr.name.name === 'role');
        const roleLiteral = roleAttr ? stringJsxValue(roleAttr) : null;
        const hasRole = Boolean(
          roleAttr && roleLiteral !== '' && roleLiteral !== 'presentation' && roleLiteral !== 'none',
        );
        const hasTabIndex = attrs.some((attr) => attr.name.name === 'tabIndex');
        const hasKeyboardHandler = attrs.some(
          (attr) =>
            attr.name.name === 'onKeyDown' ||
            attr.name.name === 'onKeyUp' ||
            attr.name.name === 'onKeyPress',
        );

        if (!hasRole || !hasTabIndex || !hasKeyboardHandler) {
          context.report({ node, messageId: 'inaccessibleClick', data: { tag } });
        }
      },
    };
  },
};

export const rules = {
  'button-type': buttonType,
  'no-positive-tabindex': noPositiveTabindex,
  'no-aria-hidden-focusable': noAriaHiddenFocusable,
  'no-autofocus': noAutofocus,
  'no-role-presentation-on-focusable': noRolePresentationOnFocusable,
  'require-accessible-button-name': requireAccessibleButtonName,
  'valid-aria-role': validAriaRole,
  'no-clickable-non-interactive': noClickableNonInteractive,
};

const plugin = { meta: { name: '@forma-ui/eslint-plugin', version: '100.0.0' }, rules, configs: {} };

export const configs = {
  recommended: {
    plugins: { forma: plugin },
    rules: {
      'forma/button-type': 'warn',
      'forma/no-positive-tabindex': 'error',
      'forma/no-aria-hidden-focusable': 'error',
      'forma/no-role-presentation-on-focusable': 'error',
      'forma/require-accessible-button-name': 'warn',
    },
  },
  strict: {
    plugins: { forma: plugin },
    rules: {
      'forma/button-type': 'error',
      'forma/no-positive-tabindex': 'error',
      'forma/no-aria-hidden-focusable': 'error',
      'forma/no-autofocus': 'error',
      'forma/no-role-presentation-on-focusable': 'error',
      'forma/require-accessible-button-name': 'error',
      'forma/valid-aria-role': 'error',
      'forma/no-clickable-non-interactive': 'error',
    },
  },
};
plugin.configs = configs;
export default plugin;
