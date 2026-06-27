# 星途 · 星图（Xingtu）

> 初中知识星图 — 在吉卜力风格的白昼天穹下，逐科点亮每一颗知识之星 ✨

![快速迭代中](https://img.shields.io/badge/状态-快速迭代中-orange) ![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue) ![React](https://img.shields.io/badge/React-19-blue) ![Three.js](https://img.shields.io/badge/Three.js-0.184-green)

## 项目简介

**星途** 是一个 3D 交互式学习页面，支持**多学科切换**（目前包含初中 **物理** 与 **化学**）。它将每个学科的知识化作漫天星辰，随机散布在吉卜力风格的白昼天穹中。顶部可一键切换学科，各学科的点亮进度彼此独立。每颗星代表一个知识点（或一个化学元素），点击即可查看详情并作答；答对即点亮该星，发出柔和的光芒。

不同学科有不同的作答方式：

- **物理**：点击星星查看知识点，做 2–3 道选择题，全部答对即点亮。
- **化学**「元素之谜」：每颗星是一个元素的谜面，输入正确的化学式（元素符号或单质化学式）即点亮；点亮后展示谜面、元素符号、化学式与元素说明。

🌟 **核心体验**：选择学科 → 浏览星图 → 点击星星 → 阅读 / 解谜 → 完成作答 → 点亮星辰

> ⚠️ 本项目仍在**快速迭代**中，功能、数据结构、视觉表现均可能随时变动。

---

## 功能概览

| 功能 | 说明 |
|------|------|
| 🔀 学科切换 | 顶部一键切换初中物理 / 化学，点亮进度互相独立 |
| 🌌 3D 星图 | 知识星随机散布在球壳空间中，柔和色彩对应不同章节 / 分组 |
| ☁️ 吉卜力天空 | 渐变天穹 + 程序化云层 + 柔和日光，打造梦幻白昼氛围 |
| 📖 知识面板 | 物理：查看知识点摘要与核心要点 |
| 📝 随堂测验 | 物理：每个知识点 2–3 道选择题，附带详细解析 |
| 🧪 元素之谜 | 化学：根据谜面输入化学式点亮，点亮后展示符号、化学式与说明（判定忽略大小写 / 空格 / 下标） |
| ✨ 点亮机制 | 答对即点亮星星，产生辉光闪烁效果 |
| 💾 进度持久化 | 各学科进度独立保存在浏览器 `localStorage`，刷新不丢失 |
| 🖱️ 自由视角 | 拖拽旋转、滚轮缩放，可从全局概览深入星群之间 |

## 效果展示

![默认](./example/0.png)

![稍远](./example/1.png)
![远看](./example/2.png)
![知识点描述](./example/3.png)
![答题](./example/4.png)


---

## 快速开始

### 环境要求

- **Node.js** ≥ 18
- **pnpm**（推荐）或 npm

### 安装与运行

```bash
# 克隆仓库
git clone <repo-url>
cd xingtu-frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
# 打开 http://localhost:5173

# 类型检查（dev 模式下不会检查类型，需要手动运行）
pnpm exec tsc --noEmit

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

> ⚠️ 本项目需要 WebGL 支持。在无头浏览器中运行需添加参数：
> `--enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader-webgl`

---

## 学科与数据配置

### 学科注册表

所有学科在 **`src/data/subjects.ts`** 中注册。每个学科声明自己的数据文件与作答模式：

```ts
{ id: 'physics',   name: '初中物理', short: '物理', dataUrl: '/data/knowledge-points.json',  mode: 'quiz'    }
{ id: 'chemistry', name: '初中化学', short: '化学', dataUrl: '/data/chemistry-points.json',   mode: 'formula' }
```

- `mode: 'quiz'` —— 选择题模式（物理）。
- `mode: 'formula'` —— 填化学式模式（化学）。

新增一个学科 = 在此注册表加一项 + 提供对应的 JSON 数据文件。

### 数据来源

| 学科 | 数据文件 | 生成方式 |
|------|---------|---------|
| 物理 | `public/data/knowledge-points.json` | 由 `public/all_knowledge.md` 大纲编译 |
| 化学 | `public/data/chemistry-points.json` | 由 `scripts/gen_chemistry.py` 生成 |

修改对应 JSON 并刷新页面即可生效，无需重新构建。

### 数据结构

每个数据文件包含两个顶层字段 `chapters` 与 `knowledgePoints`：

```jsonc
{
  // 章节 / 分组定义，每个分配一种柔和色彩
  "chapters": [
    { "name": "测量与运动", "color": "#7EC8E3" }
    // ...
  ],

  // 知识点 / 元素列表
  "knowledgePoints": [
    {
      "id": "length-measure",          // 唯一标识符
      "title": "长度测量",              // 显示名称（化学中为元素名，点亮前隐藏）
      "chapter": "测量与运动",           // 所属章节 / 分组（对应 chapters[].name）
      "order": 0,                      // 排序权重（也用作随机位置的种子）
      "summary": "刻度尺是测量长度的基本工具...", // 概要说明（化学中为「谜面」）
      "keyPoints": ["..."],            // 核心要点（化学中为元素小档案）

      // —— 物理（quiz 模式）——
      "questions": [
        {
          "id": "q1",
          "text": "用分度值为1mm的刻度尺测量长度，读数应估读到？",
          "options": ["1mm", "0.1mm", "1cm", "0.1cm"],
          "answer": 1,                  // 正确选项下标（从 0 开始）
          "explanation": "估读到分度值的下一位。"
        }
      ],

      // —— 化学（formula 模式）专用字段，物理为空 ——
      "symbol": "H",                    // 元素符号（也用于判定答案）
      "formula": "H₂",                  // 单质化学式（展示用，含下标）
      "explanation": "氢是最轻的元素…"   // 元素说明（点亮后展示）
    }
  ]
}
```

### 初中物理章节

| 章节 | 知识点数 | 题目数 |
|------|---------|--------|
| 测量与运动 | 5 | 10 |
| 声现象 | 7 | 14 |
| 光现象 | 10 | 20 |
| 质量与密度 | 4 | 8 |
| 力 | 5 | 10 |
| 力与运动 | 4 | 8 |
| 压强 | 5 | 10 |
| 浮力 | 5 | 10 |
| 简单机械与功 | 5 | 10 |
| 热学 | 10 | 20 |
| 电学基础 | 5 | 10 |
| 欧姆定律与电阻 | 5 | 10 |
| 电功率与家庭电路 | 8 | 16 |
| 电与磁 | 7 | 14 |
| 信息能源与材料 | 6 | 12 |
| **合计** | **91** | **195** |

### 初中化学分组

| 分组 | 元素数 | 内容 |
|------|-------|------|
| 周期表前20位 | 20 | H ~ Ca（原子序数 1–20） |
| 常见金属 | 8 | Mn、Fe、Cu、Zn、Ag、Ba、Au、Hg |
| 稀有气体 | 3 | Kr、Xe、Rn |
| **合计** | **31** | —— |

### 编辑知识点 / 元素

- **物理**：直接编辑 `public/data/knowledge-points.json`（或先在 `public/all_knowledge.md` 规划大纲），刷新页面即可。每个知识点建议 2–3 道题，`chapter` 必须与 `chapters[].name` 完全一致，`answer` 为选项下标（从 0 开始）。
- **化学**：编辑 `scripts/gen_chemistry.py` 中的 `ELEMENTS` 表，再运行 `python3 scripts/gen_chemistry.py` 重新生成 JSON。

### 自定义数据源

物理数据 URL 默认从 `/data/knowledge-points.json` 加载，可通过环境变量覆盖：

```bash
VITE_DATA_URL=https://example.com/my-data.json pnpm dev
```

---

## 技术架构

```
xingtu-frontend/
├── public/
│   ├── all_knowledge.md              # 物理知识点大纲源文件
│   └── data/
│       ├── knowledge-points.json     # 物理运行时数据
│       └── chemistry-points.json     # 化学运行时数据
├── scripts/
│   └── gen_chemistry.py              # 化学数据生成脚本
├── src/
│   ├── App.tsx                       # 主应用：学科状态、按模式分支面板
│   ├── main.tsx                      # 入口
│   ├── data/
│   │   ├── subjects.ts               # 学科注册表（物理 / 化学）
│   │   ├── DataProvider.tsx          # React Context，按学科 fetch JSON
│   │   ├── types.ts                  # 类型定义
│   │   └── knowledgePoints.ts        # 类型重导出
│   ├── state/
│   │   └── useProgress.ts           # Zustand 进度存储（按学科隔离 + 持久化）
│   ├── three/
│   │   ├── Scene.tsx                 # R3F 画布、灯光、后处理（Bloom）
│   │   ├── StarsSpiral.tsx           # 星星容器组件
│   │   ├── KnowledgeStar.tsx        # 单颗星：4角光芒几何体 + 交互
│   │   ├── GalaxyBackground.tsx      # 天空背景容器
│   │   ├── SkyDome.tsx               # 天穹着色器（渐变 + 日光）
│   │   ├── GhibliClouds.tsx          # 吉卜力风格程序化云层
│   │   ├── Stardust.tsx              # 星尘粒子系统
│   │   ├── spiral.ts                 # 随机球壳位置生成器
│   │   └── SpiralPath.tsx            # （已弃用，未挂载）
│   └── ui/
│       ├── Hud.tsx                   # HUD：学科切换 + 进度统计 + 图例
│       ├── KnowledgePanel.tsx        # 物理：知识详情面板
│       ├── QuizPanel.tsx             # 物理：答题面板
│       └── ElementPanel.tsx          # 化学：谜面 + 化学式输入 / 谜底
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 技术栈

| 技术 | 用途 |
|------|------|
| [React 19](https://react.dev) | UI 框架 |
| [Three.js 0.184](https://threejs.org) | 3D 渲染引擎 |
| [React Three Fiber 9](https://docs.pmnd.rs/react-three-fiber) | React Three.js 绑定 |
| [Drei](https://github.com/pmndrs/drei) | R3F 辅助工具库 |
| [React Three Postprocessing](https://github.com/pmndrs/react-postprocessing) | 后处理效果（Bloom 辉光） |
| [Zustand 5](https://zustand.docs.pmnd.rs) | 状态管理（进度持久化） |
| [Vite 8](https://vite.dev) | 构建工具 |
| [TypeScript 6](https://www.typescriptlang.org) | 类型安全 |

### 四层架构

1. **数据层** (`src/data/`) — `subjects.ts` 注册多学科，`DataProvider` 按当前学科加载对应 JSON 并通过 React Context 分发，同时暴露当前作答 `mode`
2. **状态层** (`src/state/`) — Zustand 管理点亮进度，**按学科隔离**（`bySubject`），`localStorage` 持久化
3. **3D 场景层** (`src/three/`) — R3F 画布、星星几何体、天空着色器、后处理
4. **UI 覆盖层** (`src/ui/`) — 纯 DOM 面板，`App.tsx` 按 `mode` 决定渲染物理面板（知识 + 答题）或化学面板（元素之谜），绝对定位叠加在 Canvas 上

### 点亮与辉光机制

星星的点亮效果基于**选择性 Bloom（Selective Bloom）**技术：

- 场景启用 ACES 色调映射，但星星材质设置 `toneMapped={false}` 使其发射光绕过色调压缩
- **未点亮**：`emissiveIntensity ≈ 0.42`，颜色值低于阈值，不产生辉光
- **已点亮**：`emissiveIntensity ≈ 1.2`，颜色值超过亮度阈值 1，触发 Bloom 辉光
- **闪烁动画**：点亮瞬间通过 `useFrame` 将 `emissiveIntensity` 短暂提升至 ~6，产生一次性闪光

---

## 已知问题

- 开发服务器控制台会输出 `THREE.Clock deprecated, use THREE.Timer` 警告——来自 R3F 内部，不影响功能
- 本项目为手动搭建（非 `create-vite` 生成），暂无 `.gitignore`

---

## 许可证

本项目仅供学习交流使用。
