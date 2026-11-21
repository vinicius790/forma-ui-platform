import { describe, expect, it } from 'vitest';
import { createCheckboxController } from '@forma-ui/core';

describe('Preact adapter package contract', () => {
  it('can be imported without touching browser globals', async () => {
    const adapter = await import('../index');
    expect(typeof adapter.useFormaController).toBe('function');
    expect(typeof adapter.useCheckbox).toBe('function');
    expect(typeof adapter.useDialog).toBe('function');
    expect(typeof adapter.useAlertDialog).toBe('function');
    expect(typeof adapter.useMenu).toBe('function');
    expect(typeof adapter.useTabs).toBe('function');
    expect(typeof adapter.useTooltip).toBe('function');
    expect(typeof adapter.useSelect).toBe('function');
    expect(typeof adapter.useMultiSelect).toBe('function');
    expect(typeof adapter.useCombobox).toBe('function');
    expect(typeof adapter.useAccordion).toBe('function');
    expect(typeof adapter.useToasts).toBe('function');
    expect(typeof adapter.useSwitch).toBe('function');
    expect(typeof adapter.useDisclosure).toBe('function');
    expect(typeof adapter.usePagination).toBe('function');
    expect(typeof adapter.useSlider).toBe('function');
    expect(typeof adapter.useRadioGroup).toBe('function');
    expect(typeof adapter.usePinInput).toBe('function');
    expect(typeof adapter.useRatingGroup).toBe('function');
    expect(typeof adapter.useAvatar).toBe('function');
    expect(typeof adapter.useToolbar).toBe('function');
    expect(typeof adapter.useFormaStore).toBe('function');
  });
  it('uses core controllers as the source of behavior', () => {
    const controller = createCheckboxController({ defaultChecked: false });
    controller.toggle();
    expect(controller.checked).toBe(true);
  });
});
