import { describe, test, expect } from 'bun:test';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { App } from '@/app/App';

describe('CommitGraph', () => {
  test('opens demo repository and shows commit graph', async () => {
    render(<App />);
    
    // 打开 angkorgit 仓库
    await userEvent.click(await screen.findByText('angkorgit', { exact: true }));
    
    // 验证搜索框加载
    await screen.findByPlaceholderText('Search commits…');
    
    // 验证 main 分支可见
    expect(screen.getByText('main', { exact: true })).toBeVisible();
    
    // 验证 Working copy 可见
    expect(screen.getByText('Working copy')).toBeVisible();
  });

  test('selecting a commit opens the inspector', async () => {
    render(<App />);
    
    await userEvent.click(await screen.findByText('angkorgit', { exact: true }));
    await screen.findByPlaceholderText('Search commits…');
    
    // 点击第一个提交行
    const firstRow = screen.getAllByRole('row')[0];
    await userEvent.click(firstRow);
    
    // 验证 Inspector 显示
    const inspector = screen.getByRole('complementary', { name: 'Inspector' });
    expect(within(inspector).getByLabelText('4 modified')).toBeVisible();
  });

  test('commit search finds matches and steps through them', async () => {
    render(<App />);
    
    await userEvent.click(await screen.findByText('angkorgit', { exact: true }));
    const searchInput = await screen.findByPlaceholderText('Search commits…');
    
    // 搜索 "virtualize"
    await userEvent.type(searchInput, 'virtualize');
    
    // 验证找到匹配
    expect(await screen.findByText(/^1 of \d+$/)).toBeVisible();
    expect(screen.getByText(/200\+ commits/)).toBeVisible();
    
    // 验证高亮的匹配
    const activeMatch = screen.getByTestId('search-match-active');
    expect(activeMatch).toHaveTextContent(/virtualize commit rows/);
    
    // 按 Enter 到下一个
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText(/^2 of \d+$/)).toBeVisible();
    
    // 清空搜索
    await userEvent.keyboard('{Escape}');
    expect(searchInput).toHaveValue('');
  });
});
