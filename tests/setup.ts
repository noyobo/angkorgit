// Bun test setup for React component testing
import { expect } from 'bun:test';
import '@testing-library/jest-dom';

// 设置 happy-dom 作为测试环境
// @ts-expect-error - happy-dom types
global.happyDOM = true;
