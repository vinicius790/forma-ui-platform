/** Progressive EyeDropper API primitive with SSR safety and AbortSignal support. */

interface EyeDropperInstance {
  open(options?: { signal?: AbortSignal }): Promise<{ sRGBHex: string }>;
}

interface EyeDropperCtor {
  new (): EyeDropperInstance;
}

export function supportsEyeDropper(): boolean {
  return typeof window !== 'undefined' && typeof (window as Window & { EyeDropper?: EyeDropperCtor }).EyeDropper === 'function';
}

export async function pickScreenColor(signal?: AbortSignal): Promise<string | null> {
  if (!supportsEyeDropper()) return null;
  const Ctor = (window as Window & { EyeDropper?: EyeDropperCtor }).EyeDropper!;
  try {
    const picker = new Ctor();
    const result = await picker.open(signal ? { signal } : undefined);
    return result.sRGBHex;
  } catch {
    return null;
  }
}
