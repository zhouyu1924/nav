<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1aNCbdSHdtleYxpuvYTKlYEYTRBjsrMd-

更新说明：
添加 package.json：定义项目依赖（React, Vite, TypeScript 等）和构建命令。
添加 vite.config.ts：配置 Vite 构建工具。
添加 tsconfig.json：TypeScript 配置文件。
修改 index.html：移除旧的 importmap，添加对 index.tsx 的正确引用。
Cloudflare Pages 部署设置：
在代码更新并推送到 GitHub 后，请在 Cloudflare Pages 的设置中确保以下配置：
Build command (构建命令): npm run build
Build output directory (构建输出目录): dist
