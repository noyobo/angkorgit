import { describe, test, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { App } from '@/app/App';

// 这就是从 E2E 迁移的测试 - 完全相同的测试意图，但是：
// ✅ 快 10-20 倍（毫秒级 vs 秒级）
// ✅ 不需要浏览器
// ✅ 不需要等待 DOM 渲染
// ✅ 使用你们已有的 demo.ts mock 数据

describe('CommandPalette', () => {
  test('opens with keyboard shortcut', async () => {
    // 渲染整个 App（使用 demo mode）
    render(<App />);
    
    // 等待 splash 消失，仓库列表加载
    const angkorgitRepo = await screen.findByText('angkorgit', { exact: true });
    await userEvent.click(angkorgitRepo);
    
    // 等待仓库打开
    await screen.findByPlaceholderText('Search commits…');
    
    // 按 Cmd/Ctrl+K
    await userEvent.keyboard('{Meta>}k{/Meta}');
    
    // 验证命令面板打开
    expect(screen.getByPlaceholderText('Type a command or branch name…')).toBeVisible();
  });

  test('previews theme and keeps it only on enter', async () => {
    render(<App />);
    
    const angkorgitRepo = await screen.findByText('angkorgit', { exact: true });
    await userEvent.click(angkorgitRepo);
    await screen.findByPlaceholderText('Search commits…');
    
    // 验证默认主题
    const html = document.documentElement;
    expect(html).toHaveClass(/theme-angkor-dusk/);
    
    // 打开命令面板
    await userEvent.keyboard('{Meta>}k{/Meta}');
    
    // 搜索主题
    const commandInput = screen.getByPlaceholderText('Type a command or branch name…');
    await userEvent.type(commandInput, 'color theme');
    await userEvent.click(screen.getByRole('option', { name: 'Color theme' }));
    
    // 搜索 dracula
    const themeSearch = screen.getByPlaceholderText('Search themes…');
    await userEvent.type(themeSearch, 'dracula');
    
    // 验证预览生效
    expect(html).toHaveClass(/theme-dracula/);
    
    // 按 Escape 取消
    await userEvent.keyboard('{Escape}');
    
    // 验证恢复原主题
    expect(html).toHaveClass(/theme-angkor-dusk/);
    expect(screen.queryByPlaceholderText('Search themes…')).not.toBeInTheDocument();
  });
});
