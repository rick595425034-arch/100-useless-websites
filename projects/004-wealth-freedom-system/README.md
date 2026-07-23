# 财富自由实现系统

一个把“财富自由”严格按字面执行的单页互动整活。

用户输入期望金额，系统先以私人银行级别的视觉完成资金入账、流动资金链创建和无限钱生钱闭环。最后系统严格执行“财富自由”：资产长出翅膀自主离场，余额归零，并郑重宣布您的财富已经获得自由。

## 在线体验

- 阿里云正式站：[wealth.aibrew.cn](https://wealth.aibrew.cn)
- Sites 镜像：[aureus-wealth-freedom.rick595425034.chatgpt.site](https://aureus-wealth-freedom.rick595425034.chatgpt.site)

## Web 开发

```bash
npm install
npm run dev
```

打开终端中显示的本地地址即可体验。

## 静态 Web 构建

```bash
npm run web:build
```

产物位于 `web-dist/`。阿里云使用 Nginx 直接提供静态文件，参考配置位于 `deploy/`。

## macOS 桌面版

本地运行：

```bash
npm run desktop:play
```

生成 Apple Silicon DMG：

```bash
npm run desktop:dist
```

生成的安装包位于 `release/`，构建产物不会提交到仓库。

## 测试

```bash
npm test
```

## 表演节奏

- 首屏只呈现可信的财富管理入口，不提前剧透。
- 点击后依次完成入账、资金链、无限复利和财富自由四阶段。
- 约 9 秒时资产获得翅膀，约 10 秒时开始自主飞行。
- 约 13 秒时余额归零并出现最终结论。

## 安全说明

本项目只修改页面内的虚拟金额和动画，不读取账户、文件或设备数据，不执行任何真实金融操作，也不构成投资建议。
