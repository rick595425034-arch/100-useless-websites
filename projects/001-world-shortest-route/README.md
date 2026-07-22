# 全球路径决策系统

一个看起来极其专业、结论却极其朴素的整活路线规划器。

输入任意出发地和目的地，系统会依次执行全球节点接入、候选路线生成、地形约束分析、转向成本验证与路线冗余审计，最后给出唯一最优方案：

> 面向目的地，然后一直直走。

在线体验：[aether-path-cn.rick595425034.chatgpt.site](https://aether-path-cn.rick595425034.chatgpt.site)

## 项目特点

- 单屏完成完整表演，适合录制 10–30 秒短视频
- 出发地和目的地可自由输入，也提供常用城市候选
- 六阶段高端路线推演动画与实时参数变化
- 最终路线、转弯次数与绕行距离逐层揭晓
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

测试会验证首页不会提前剧透，并检查输入、计算和结果三个阶段是否保持独立。

## 技术栈

- React 19
- TypeScript
- vinext / Vite
- D3 Geo + Natural Earth 地图数据
- Electron

## 项目结构

```text
app/                 网页界面与交互
desktop/             Electron 渲染入口与构建配置
desktop-app/         Electron 主进程与应用资源
tests/               服务端渲染与状态流程测试
public/              公共静态资源
```

## 说明

本项目用于娱乐与创意编程展示，不提供真实导航建议。遇到海洋、山脉、国界或前方墙壁时，请自行判断是否继续直行。

## License

[MIT](./LICENSE)
