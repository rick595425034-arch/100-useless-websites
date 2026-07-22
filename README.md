# 挑战 100 个整活网站

一个长期更新的开源整活实验室：先把界面做得像要改变世界，再用一个完全没用但逻辑自洽的结论收尾。

这里收录伪高端决策系统与其他没用但认真制作的互动网站。每个作品都是独立项目，可以单独安装、运行、测试和打包；总仓库只负责统一编号、目录与质量检查。

> 当前进度：**2 / 100**

## 已收录项目

| # | 项目 | 形式 | 一句话介绍 | 状态 |
|---:|---|---|---|---|
| 001 | [全球路径决策系统](./projects/001-world-shortest-route) | Web / macOS | 用极其专业的流程计算几何意义上的最短路线 | 已完成 |
| 002 | [一切难题终极化解系统](./projects/002-ultimate-resolution-system) | Web / macOS | 对任何复杂问题进行六阶段终极化解 | 已完成 |

## 如何运行

每个项目彼此独立。进入想玩的目录后，按照该项目 README 操作即可。例如：

```bash
cd projects/001-world-shortest-route
npm install
npm run dev
```

桌面应用的运行与 DMG 构建命令写在各自项目说明中。

## 仓库结构

```text
projects/
  001-world-shortest-route/       全球路径决策系统
  002-ultimate-resolution-system/ 一切难题终极化解系统
scripts/                          清单与 CI 校验工具
tests/                            总仓库结构测试
catalog.json                      机器可读的项目目录
```

## 新增一个整活

1. 在 `projects/` 下创建下一个连续编号的目录，如 `003-new-idea`。
2. 保证项目可以独立运行，并提供自己的 `README.md`、`package.json` 和测试命令。
3. 更新 [`catalog.json`](./catalog.json) 与本页项目表格。
4. 在仓库根目录运行 `npm test`，再进入新项目运行它自己的测试。

更完整的约定见 [`CONTRIBUTING.md`](./CONTRIBUTING.md)。如果继续使用 Codex 开发，仓库中的 [`AGENTS.md`](./AGENTS.md) 会让后续任务自动遵守相同结构。

## 设计原则

- 第一眼要像真的，结局才有反差。
- 10–30 秒内完成铺垫、升级和包袱。
- 关键中文必须足够大，录屏后仍然看得清。
- 不用真实危险、破坏文件或欺骗用户来换节目效果。
- 每个项目独立，失败不会拖垮其他作品。

## 说明

本仓库中的项目主要用于娱乐、短视频表演和创意编程展示。涉及导航与决策的内容均不提供真实专业服务。

## License

[MIT](./LICENSE)
