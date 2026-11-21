import { spacingTokens, type SpacingTokenKey } from './spacing.js';

export interface LogicalSpacingDeclaration {
  paddingInlineStart?: string;
  paddingInlineEnd?: string;
  paddingBlockStart?: string;
  paddingBlockEnd?: string;
  marginInlineStart?: string;
  marginInlineEnd?: string;
  insetInlineStart?: string;
  insetInlineEnd?: string;
}

/**
 * Gera propriedades lógicas CSS compatíveis com LTR e RTL sem inversão manual.
 */
export function createLogicalPadding(
  inlineKey: SpacingTokenKey,
  blockKey: SpacingTokenKey
): LogicalSpacingDeclaration {
  return {
    paddingInlineStart: spacingTokens[inlineKey],
    paddingInlineEnd: spacingTokens[inlineKey],
    paddingBlockStart: spacingTokens[blockKey],
    paddingBlockEnd: spacingTokens[blockKey]
  };
}
