import { describe, expect, it, vi } from 'vitest';
import { ListCollection, SelectionManager, TreeCollection, createMachineActor, createTreeViewController } from '../index';

describe('collection primitives', () => {
  it('rejects duplicate keys and keeps stable order', () => {
    expect(() => new ListCollection([{ key: 'x', value: 1 }, { key: 'x', value: 2 }])).toThrow(/Duplicate/);
    const list = new ListCollection([{ key: 'a', value: 1 }, { key: 'b', value: 2, disabled: true }, { key: 'c', value: 3 }]);
    expect(list.getKeyAfter('a')).toBe('c');
    expect(list.getKeyBefore('c')).toBe('a');
  });

  it('supports disabled-aware selection and range selection', () => {
    const list = new ListCollection([{ key: 'a', value: 1 }, { key: 'b', value: 2, disabled: true }, { key: 'c', value: 3 }]);
    const selection = new SelectionManager(list, 'multiple', ['a']);
    selection.selectRange('c', 'a');
    expect([...selection.getSelection()]).toEqual(['a', 'c']);
    selection.toggle('b');
    expect(selection.isSelected('b')).toBe(false);
  });

  it('filters invalid expanded keys when a tree is rebuilt', () => {
    const tree = new TreeCollection([{ key: 'branch', value: 'Branch', children: [{ key: 'leaf', value: 'Leaf' }] }], ['branch', 'leaf', 'missing']);
    expect([...tree.getExpandedKeys()]).toEqual(['branch']);
    tree.setNodes([{ key: 'other', value: 'Other' }]);
    expect([...tree.getExpandedKeys()]).toEqual([]);
  });

  it('flattens only expanded tree branches', () => {
    const tree = new TreeCollection([{ key: 'a', value: 'A', children: [{ key: 'b', value: 'B' }] }], ['a']);
    expect(tree.getVisibleKeys()).toEqual(['a', 'b']);
    expect(tree.getLevel('b')).toBe(2);
    tree.collapse('a');
    expect(tree.getVisibleKeys()).toEqual(['a']);
  });
});

describe('machine actor', () => {
  it('does not freeze caller-owned context and supports explicit updater transitions', () => {
    const initialContext = { count: 2 };
    const actor = createMachineActor<'ready', 'increment', { count: number }>({
      id: 'counter-updater', initialState: 'ready', initialContext,
      transition() { return { updateContext: (context) => ({ count: context.count + 1 }) }; },
    });
    expect(Object.isFrozen(initialContext)).toBe(false);
    actor.send('increment');
    expect(actor.getSnapshot().context.count).toBe(3);
  });

  it('transitions, notifies subscribers and stops deterministically', () => {
    type Event = { type: 'increment' } | { type: 'reset' };
    const onTransition = vi.fn();
    const actor = createMachineActor<'idle' | 'active', Event, { count: number }>({
      id: 'counter', initialState: 'idle', initialContext: { count: 0 }, onTransition,
      transition(snapshot, event) {
        if (event.type === 'increment') return { state: 'active', context: { count: snapshot.context.count + 1 } };
        if (event.type === 'reset') return { state: 'idle', context: { count: 0 } };
        return null;
      },
    });
    const subscriber = vi.fn();
    actor.subscribe(subscriber);
    actor.send({ type: 'increment' });
    expect(actor.getSnapshot().context.count).toBe(1);
    expect(actor.matches('active')).toBe(true);
    expect(subscriber).toHaveBeenCalledTimes(1);
    actor.stop();
    actor.send({ type: 'increment' });
    expect(actor.getSnapshot().context.count).toBe(1);
    expect(onTransition).toHaveBeenCalledTimes(1);
  });
});


describe('tree view focus management', () => {
  it('moves DOM focus to descendants and restores focus when collapsing a branch', () => {
    const tree = createTreeViewController({ nodes: [{ key: 'root', value: 'Root', children: [{ key: 'child', value: 'Child', children: [{ key: 'leaf', value: 'Leaf' }] }] }], defaultExpandedKeys: ['root', 'child'] });
    const root = document.createElement('div');
    const child = document.createElement('div');
    const leaf = document.createElement('div');
    root.tabIndex = child.tabIndex = leaf.tabIndex = 0;
    document.body.append(root, child, leaf);
    tree.registerItem('root', root);
    tree.registerItem('child', child);
    tree.registerItem('leaf', leaf);
    tree.focus('leaf');
    expect(document.activeElement).toBe(leaf);
    tree.toggleExpanded('root');
    expect(tree.focusedKeyValue).toBe('root');
    expect(document.activeElement).toBe(root);
    expect(tree.visibleNodes.map((node) => node.key)).toEqual(['root']);
    tree.destroy();
    root.remove();
    child.remove();
    leaf.remove();
  });
});
