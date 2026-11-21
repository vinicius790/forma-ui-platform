import { describe, expect, it, vi } from 'vitest';
import {
  createAvatarController,
  createListboxController,
  createNumberFieldController,
  createPinInputController,
  createRatingGroupController,
  createSearchFieldController,
  createToggleGroupController,
  createTreeViewController,
  createToolbarController,
  getTextFieldProps,
  getMeterProps,
} from '../index';

describe('expanded headless controls', () => {
  it('supports listbox keyboard navigation, disabled options and multiple selection', () => {
    const onChange = vi.fn();
    const listbox = createListboxController({
      selectionMode: 'multiple',
      options: [{ key: 'a', value: 'A' }, { key: 'b', value: 'B', disabled: true }, { key: 'c', value: 'C' }],
      onValueChange: onChange,
    });
    const event = (key: string) => ({ key, preventDefault: vi.fn(), ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, isComposing: false, keyCode: 0 }) as unknown as KeyboardEvent;
    listbox.getRootProps('list').onKeyDown(event('ArrowDown'));
    expect(listbox.activeOption?.key).toBe('c');
    listbox.select('c');
    expect(onChange).toHaveBeenCalledWith(['c']);
    expect(listbox.getOptionProps('b')['aria-disabled']).toBe(true);
    expect(listbox.getRootProps('choice-list')['aria-activedescendant']).toBe('c');
    expect(listbox.getOptionProps('c').tabIndex).toBe(-1);
  });

  it('expands tree nodes and moves to their visible descendants', () => {
    const tree = createTreeViewController({
      nodes: [{ key: 'root', value: 'Root', children: [{ key: 'child', value: 'Child' }] }],
      defaultExpandedKeys: [],
    });
    expect(tree.visibleNodes.map((node) => node.key)).toEqual(['root']);
    const right = { key: 'ArrowRight', preventDefault: vi.fn(), isComposing: false, keyCode: 0 } as unknown as KeyboardEvent;
    tree.getRootProps('Navigation').onKeyDown(right);
    expect(tree.visibleNodes.map((node) => node.key)).toEqual(['root', 'child']);
    expect(tree.visibleNodes[1]?.level).toBe(2);
    const rootElement = document.createElement('div');
    const childElement = document.createElement('div');
    rootElement.tabIndex = -1;
    childElement.tabIndex = -1;
    document.body.append(rootElement, childElement);
    tree.registerItem('root', rootElement);
    tree.registerItem('child', childElement);
    tree.getRootProps('File tree').onKeyDown({ key: 'ArrowRight', preventDefault: vi.fn(), isComposing: false, keyCode: 0 } as unknown as KeyboardEvent);
    expect(document.activeElement).toBe(childElement);
    tree.destroy();
    rootElement.remove();
    childElement.remove();
  });

  it('keeps toggle group values controlled by its mode and skips disabled items', () => {
    const onChange = vi.fn();
    const group = createToggleGroupController({ type: 'single', onValueChange: onChange });
    group.register({ value: 'bold' });
    group.register({ value: 'italic', disabled: true });
    group.toggle('bold');
    group.toggle('italic');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('bold');
  });

  it('supports number field limits and does not coerce empty input to zero', () => {
    const onChange = vi.fn();
    const field = createNumberFieldController({ min: 2, max: 8, step: 2, defaultValue: 4, onValueChange: onChange });
    field.increment(10);
    expect(field.value).toBe(8);
    field.getInputProps().onChange({ currentTarget: { valueAsNumber: Number.NaN } } as unknown as Event);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('handles search clear and Escape', () => {
    const onChange = vi.fn();
    const search = createSearchFieldController({ defaultValue: 'Forma', onValueChange: onChange });
    search.getInputProps().onKeyDown({ key: 'Escape', preventDefault: vi.fn() } as unknown as KeyboardEvent);
    expect(search.value).toBe('');
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('normalizes pin input and completes only at the configured length', () => {
    const complete = vi.fn();
    const pin = createPinInputController({ length: 4, onComplete: complete });
    pin.paste('12-34-56');
    expect(pin.value).toBe('1234');
    expect(complete).toHaveBeenCalledWith('1234');
    expect(pin.getInputProps(0).type).toBe('text');
  });

  it('supports rating selection and clear semantics', () => {
    const rating = createRatingGroupController({ count: 5, defaultValue: 4, allowClear: true });
    rating.setValue(4);
    expect(rating.value).toBe(0);
    expect(rating.getItemProps(1).role).toBe('radio');
  });

  it('switches avatar image and fallback state', () => {
    const avatar = createAvatarController({ src: '/avatar.png' });
    expect(avatar.getImageProps().hidden).toBe(true);
    avatar.imageLoaded();
    expect(avatar.getFallbackProps().hidden).toBe(true);
    const brokenAvatar = createAvatarController({ src: '/missing.png' });
    brokenAvatar.imageFailed();
    expect(brokenAvatar.imageState).toBe('error');
  });

  it('reports meter and text-field accessibility attributes', () => {
    expect(getMeterProps({ value: 130, max: 100 })['aria-valuenow']).toBe(100);
    const props = getTextFieldProps({ id: 'email', descriptionId: 'email-hint', errorId: 'email-error', description: true, invalid: true, errorMessage: 'Invalid' });
    expect(props['aria-describedby']).toBe('email-hint email-error');
  });

  it('does not require toolbar items to exist before initialization', () => {
    const toolbar = createToolbarController({ label: 'Text formatting' });
    expect(toolbar.getRootProps().role).toBe('toolbar');
  });

  it('skips disabled tree nodes during arrow navigation and generates unique pin ids', () => {
    const tree = createTreeViewController({
      nodes: [
        { key: 'a', value: 'A' },
        { key: 'b', value: 'B', disabled: true },
        { key: 'c', value: 'C' },
      ],
    });
    tree.getRootProps('Items').onKeyDown({ key: 'ArrowDown', preventDefault: vi.fn(), isComposing: false, keyCode: 0 } as unknown as KeyboardEvent);
    expect(tree.focusedKeyValue).toBe('c');

    const pin1 = createPinInputController({ length: 2 });
    const pin2 = createPinInputController({ length: 2 });
    expect(pin1.getInputProps(0).id).not.toBe(pin2.getInputProps(0).id);
  });

  it('resets avatar state when src is cleared via updateOptions', () => {
    const avatar = createAvatarController({ src: '/avatar.png' });
    avatar.imageLoaded();
    expect(avatar.imageState).toBe('loaded');
    avatar.updateOptions({ src: undefined });
    expect(avatar.imageState).toBe('empty');
  });
});
