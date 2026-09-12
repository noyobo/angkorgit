import { describe, expect, it } from 'bun:test';
import type {
  TabStripItem,
  TabStripProps,
} from '../../packages/design-system/src/components/TabStrip';

describe('TabStrip types', () => {
  it('TabStripItem has correct structure', () => {
    const item: TabStripItem = {
      id: 'test-id',
      label: 'Test Label',
    };

    expect(item.id).toBe('test-id');
    expect(item.label).toBe('Test Label');
  });

  it('TabStripItem supports optional fields', () => {
    const item: TabStripItem = {
      id: 'test-id',
      label: 'Test Label',
      title: 'Tooltip text',
      icon: null,
    };

    expect(item.title).toBe('Tooltip text');
  });

  it('TabStripProps has correct required fields', () => {
    const props: TabStripProps = {
      items: [{ id: 'tab-1', label: 'Tab 1' }],
      activeId: 'tab-1',
      onSelect: () => {},
      onClose: () => {},
    };

    expect(props.items).toHaveLength(1);
    expect(props.activeId).toBe('tab-1');
    expect(typeof props.onSelect).toBe('function');
    expect(typeof props.onClose).toBe('function');
  });

  it('TabStripProps supports optional customization', () => {
    const props: TabStripProps = {
      items: [{ id: 'tab-1', label: 'Tab 1' }],
      activeId: 'tab-1',
      onSelect: () => {},
      onClose: () => {},
      showHints: true,
      hintContent: (index) => `Hint ${index}`,
      size: 'sm',
      draggable: true,
      className: 'custom-class',
    };

    expect(props.showHints).toBe(true);
    expect(props.size).toBe('sm');
    expect(props.draggable).toBe(true);
    expect(props.className).toBe('custom-class');
    expect(props.hintContent?.(0)).toBe('Hint 0');
  });

  it('supports size variants', () => {
    const sizes: Array<TabStripProps['size']> = ['sm', 'md', undefined];
    expect(sizes).toContain('sm');
    expect(sizes).toContain('md');
  });

  it('hintContent function signature is correct', () => {
    const hintFn: NonNullable<TabStripProps['hintContent']> = (index: number) => {
      return `⌘ ${index + 1}`;
    };

    expect(hintFn(0)).toBe('⌘ 1');
    expect(hintFn(8)).toBe('⌘ 9');
  });

  it('drag-and-drop callbacks have correct signatures', () => {
    const onDragStart: TabStripProps['onDragStart'] = (id, _e) => {
      expect(typeof id).toBe('string');
    };
    const onDragOver: TabStripProps['onDragOver'] = (id, _e) => {
      expect(typeof id).toBe('string');
    };
    const onDrop: TabStripProps['onDrop'] = (id, _e) => {
      expect(typeof id).toBe('string');
    };

    expect(typeof onDragStart).toBe('function');
    expect(typeof onDragOver).toBe('function');
    expect(typeof onDrop).toBe('function');
  });

  it('supports generic string types', () => {
    type CustomId = `tab-${number}`;
    const items: TabStripItem<CustomId>[] = [
      { id: 'tab-1' as CustomId, label: 'Tab 1' },
      { id: 'tab-2' as CustomId, label: 'Tab 2' },
    ];

    expect(items[0].id).toBe('tab-1');
    expect(items[1].id).toBe('tab-2');
  });

  it('activeId can be null', () => {
    const props: TabStripProps = {
      items: [{ id: 'tab-1', label: 'Tab 1' }],
      activeId: null,
      onSelect: () => {},
      onClose: () => {},
    };

    expect(props.activeId).toBeNull();
  });

  it('supports custom onWheel handler', () => {
    let wheelCalled = false;
    const props: TabStripProps = {
      items: [{ id: 'tab-1', label: 'Tab 1' }],
      activeId: 'tab-1',
      onSelect: () => {},
      onClose: () => {},
      onWheel: () => {
        wheelCalled = true;
      },
    };

    props.onWheel?.({} as any);
    expect(wheelCalled).toBe(true);
  });

  it('supports renderExtraContent callback', () => {
    const props: TabStripProps = {
      items: [{ id: 'tab-1', label: 'Tab 1' }],
      activeId: 'tab-1',
      onSelect: () => {},
      onClose: () => {},
      renderExtraContent: (item, index) => {
        expect(item.id).toBe('tab-1');
        expect(index).toBe(0);
        return null;
      },
    };

    props.renderExtraContent?.(props.items[0], 0);
  });
});
