# E2E 测试指南

[English](./E2E-TESTING.md)

## 关键：必须打生产包

**E2E 只能打生产构建，禁止对着 `bun run dev` 跑。**

### 为什么

Rspack 开发模式默认 **lazy compilation**（按需编译模块）：

- 访问到才编译
- CI 里会出现 404 和 MIME 类型错误
- JS chunk 加载失败 → 测试超时
- 见 [Rspack Lazy Compilation](https://rspack.rs/guide/advanced/lazy-compilation)

官方说明：lazy compilation **只对 dev 生效，不影响 production**。

相关 issue：[#12444](https://github.com/web-infra-dev/rspack/issues/12444)、[#10997](https://github.com/web-infra-dev/rspack/issues/10997)、[#11843](https://github.com/web-infra-dev/rspack/pull/11843)。

## 现在的正确做法

CI（`.github/workflows/ci.yml`）先 `bun run build`，再用静态服务器托管 `apps/desktop/dist`，端口 **1420**，然后 `bun run test:e2e`。

这样：没有按需编译、chunk 全是静态文件、稳定、测的是真实产物。

## 如果非要测 dev

在 rspack 配置里关 lazy compilation（`lazyCompilation: false`，或 `process.env.E2E_TEST`）。默认不要这么干。

## 症状

浏览器控制台出现这些，就是 lazy compilation：

```
Failed to load resource: 404
Refused to execute script from '...lazy-compilation-proxy.js'
because its MIME type ('text/html') is not executable
Loading chunk ... failed
```

**立刻改成生产包再测。** 加 timeout 没用。

## 本地怎么跑

```bash
bun run build
cd apps/desktop/dist
python3 -m http.server 1420 &
cd ../../..
bun run test:e2e
```

开发 UI 用 `bun run dev`。**永远不要**让 E2E 打 `bun run dev`——本机可能碰巧过，CI 必挂。

## 排障

1. 先看浏览器控制台
2. 找 404 / MIME 错误
3. 确认测的是生产包（看 CI log）

## 教训（2026-09-12）

一开始对着 dev server 跑 E2E：CI 里 3 条 smoke 全超时，控制台 chunk 加载失败。根因就是 Rspack lazy compilation。先加 timeout 浪费约 2 小时，看文档后 5 分钟修好。

**先查官方已知问题，再猜超时。**
