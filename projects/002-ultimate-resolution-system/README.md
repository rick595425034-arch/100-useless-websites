# 一切难题终极化解系统

一个看起来能够分析并解决任何复杂问题，实际上只会把问题越缩越小的整活决策系统。

输入任何正在困扰你的问题，系统会依次执行语义建模、事实校验、影响评估、多维推演与全局最优验证，最终生成唯一解决方案：

> 问题已缩小至不可见。大事化小，小事化了。

## 项目特点

- 单屏完成输入、分析与结论揭晓，适合录制短视频
- 六阶段高端决策演算与实时参数变化
- 用户输入的问题会随分析过程持续缩小
- 最终结论分阶段揭晓，不会在首页提前剧透
- 纯前端运行，不需要 API、账号或后端数据
- 同时支持网页与 macOS Electron 桌面应用
- 支持键盘、触控和响应式布局

## 本地运行

需要 Node.js `22.13.0` 或更高版本。

```bash
npm install
npm run dev
```

然后访问终端输出的本地地址。

## 构建网页版本

```bash
npm run build
npm start
```

## 运行桌面版本

```bash
npm run desktop:play
```

构建 macOS DMG：

```bash
npm run desktop:dist
```

## 测试

```bash
npm test
```

测试会验证首页不会提前剧透，并检查输入、缩小和结果三个状态保持独立。

## 技术栈

- React 19
- TypeScript
- vinext / Vite
- CSS 动画与 Web Audio API
- Electron

## 项目结构

```text
app/                 网页界面、交互与视觉样式
desktop/             Electron 渲染入口与构建配置
desktop-app/         Electron 主进程与应用资源
tests/               服务端渲染与状态流程测试
public/              公共静态资源
```

## 说明

本项目用于娱乐与创意编程展示。系统不会改变现实中的问题本身，仅优化它在屏幕上的显示尺寸。

## License

[MIT](./LICENSE)
