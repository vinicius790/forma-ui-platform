export const logicalPropertyMap = {
  marginLeft: 'margin-inline-start', marginRight: 'margin-inline-end', paddingLeft: 'padding-inline-start', paddingRight: 'padding-inline-end',
  borderLeft: 'border-inline-start', borderRight: 'border-inline-end', borderTopLeftRadius: 'border-start-start-radius', borderTopRightRadius: 'border-start-end-radius',
  textAlignLeft: 'start', textAlignRight: 'end', left: 'inset-inline-start', right: 'inset-inline-end',
} as const;
export function toLogicalCss(property: string): string { return logicalPropertyMap[property as keyof typeof logicalPropertyMap] ?? property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`); }
