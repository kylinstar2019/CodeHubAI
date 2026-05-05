## 分支改动记录
分支：feat/rebrand-opencode-to-codehubai
时间：2026-05-05 21:00:00
改动内容：将界面中的OpenCode品牌名改为CodeHubAI

改动详情：
- src/features/chat/Header.tsx: 更新窗口标题从OpenCode改为CodeHubAI
- src/features/settings/components/ServersSettings.tsx: 更新服务状态消息中的品牌名
- src/locales/zh-CN/chat.json: 更新中文翻译header.openCode为CodeHubAI
- src/locales/en/chat.json: 更新英文翻译header.openCode为CodeHubAI

影响范围：
- 左上角品牌显示
- 浏览器窗口标题
- 服务器在线状态显示

---

## 分支改动记录
分支：feat/rebrand-opencode-to-codehubai
时间：2026-05-05 21:46:00
改动内容：添加AI工具选择器下拉菜单

改动详情：
- src/features/chat/AIToolSelector.tsx: 新建AI工具选择器组件，支持opencode、claude-code、codex选项
- src/features/chat/ChatPane.tsx: 更新以管理工具选择状态
- src/features/chat/Header.tsx: 集成工具选择器到模型选择器旁边
- src/locales/en/chat.json: 添加工具选择器英文翻译
- src/locales/zh-CN/chat.json: 添加工具选择器中文翻译

影响范围：
- Header组件新增AI工具选择下拉菜单
- ChatPane状态管理
- 本地化文件更新
