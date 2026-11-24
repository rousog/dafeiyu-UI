# 大肥鱼UI · Da Fei Yu UI

一个 [DeepSeek Harness](https://github.com/deepseek-ai)（DSH）界面插件。

为对话区铺一张场景底图，右侧立一只鲨鱼娘，再压一层半透明遮罩，保证文字清晰；同时把左右侧栏、输入框、消息气泡、代码块和文件卡片的底色统一到同一套配色。

**深色与浅色各有一套**，在左侧栏导航区的「主题」页面里一键切换，切换的是 DSH 自己的外观设置。

| | 深色 | 浅色 |
|---|---|---|
| 场景 | 深海蓝渐变 + 光柱 | 浅海天光 + 柔光 |
| 遮罩 | 深蓝 23% | 白色 30% |
| 主色 | 藏青 `rgb(24,32,52)` | 雾蓝白 `#EEF3FB` |
| 人物 | 共用同一张 | 共用同一张 |

## 安装

在 DSH 里：

1. 打开 **插件（Plugins）** 页面
2. 点 **添加插件**
3. 填入：

```
github:<你的用户名>/dafeiyu-UI
```

装好后左侧栏导航区会出现 **主题** 图标，点进去可以切换深浅色。

> 也可以直接填本地绝对路径安装（把仓库 clone 到本地后填该目录）。

## 功能

- **对话区三层背景**：场景图 → 人物 → 遮罩
- **统一配色**：13 个主题令牌，覆盖侧栏、输入框、气泡、代码块、文件卡片
- **深浅切换**：写入 DSH 官方设置，和「设置 → 通用 → 外观」同步
- **底部渐变减淡**：输入框底座的遮罩降到 92%，人物脚部隐约可见

插件不注册任何 AI 工具、不读写工作区文件、不访问外部网络。

## 换成自己的图

把图片放进 `lib/assets/`（支持 `.svg` `.png` `.webp` `.jpg` `.jpeg`），然后改 `client.js` 顶部：

```js
const FIGURE = {
  file: 'dafeiyu.png',   // ← 换成你的人物图
  width: 0.38,           // 宽度占屏比
  centerX: 0.78,         // 水平中心（0=最左，1=最右）
  topGap: 0.1,           // 头顶留空
};

const PALETTES = {
  dark:  { scene: 'scene-ocean.svg', scrim: 'rgba(10, 16, 32, 0.23)', ... },
  light: { scene: 'scene-sky.svg',   scrim: 'rgba(255, 255, 255, 0.3)', ... },
};
```

**换图请用新文件名。** 资源路由的缓存头是 `immutable`（一年），同名覆盖时浏览器可能仍显示旧图。

## 调整颜色

所有颜色在 `client.js` 的 `PALETTES.dark.tokens` / `PALETTES.light.tokens` 里，每个调色板 13 个令牌：

```js
'--dsw-alias-bg-base': 'rgb(24, 32, 52)',           // 画布/右栏/底部渐变/头部
'--dsw-specific-sidebar-fill': 'rgb(20, 26, 44)',   // 左右侧栏
'--dsw-specific-input-major': 'rgba(28, 36, 58, 0.72)',   // 输入框
'--dsw-specific-bubble': 'rgba(34, 44, 70, 0.76)',  // 用户气泡
'--dsw-alias-markdown-code-block': 'rgba(26, 34, 56, 0.78)',  // 代码块
'--dsw-alias-markdown-inline-code': 'rgba(34, 44, 70, 0.8)',  // 行内代码
// …共 13 个，含变更卡片、代码分段等
```

透明度：`rgba()` 最后一个数字，`1.0` 完全不透明。

## 文件结构

```
dafeiyu-ui/
├── package.json          插件清单（含 "./assets/*" 导出）
├── cordis.patch.yml      Loader 挂载声明
├── index.js              Host 半（空壳，无逻辑）
├── client.js             Client 半（全部代码）
├── lib/assets/           图片资源（路径名固定）
│   ├── dafeiyu.png           鲨鱼娘（透明 PNG）
│   ├── scene-ocean.svg       深色场景
│   └── scene-sky.svg         浅色场景
├── locale/{en,zh}.json   插件页显示的名称与描述
└── icon.svg              插件图标
```

## 已知限制

- **依赖 DSH 内部令牌**（`--dsw-*`）。官方改版若重命名令牌，配色会静默失效（不报错，只是没效果）
- **已知可用版本**：DSH `0.2.2-rc.5`
- 图片必须放在 `lib/assets/`，这是 DSH 资源路由的硬编码路径
- 改包名时必须同步改 `client.js` 的 `PKG` 常量，否则图片 404

## 许可

MIT，见 [LICENSE](LICENSE)。
