# QQ Agent Plus 官方技能索引

这是官方技能市场的索引仓库。主程序默认读取：

```
https://raw.githubusercontent.com/sakurawwwxh/qq-agent-skills/main/index.json
```

普通用户不需要来这里：在控制台「技能 → 技能市场」刷新即可看到审核通过的技能。

## 提交一个新技能

1. Fork 本仓库。
2. 在 `skills/<id>/` 放 `skill.json` 和 `SKILL.md`（只读 Markdown，不执行代码）。
3. 在 `index.json` 的 `skills` 数组追加一条。可以先在主仓库运行：

   ```bash
   node scripts/skill-pack.mjs ./my-skill \
     --base-url https://raw.githubusercontent.com/<you>/qq-agent-skills/main/skills/my-skill
   ```

   把输出里的字段填进 `index.json`；本仓库内也可以直接把 `files` 写成相对 `path`（CI 会读盘校验）。
4. 运行 `node scripts/check.mjs`，然后提 PR。
5. 维护者审核工具白名单、流程和文件哈希后合并；主程序刷新索引即可见。

也可以使用仓库里的「技能提交」issue 模板先提交索引条目，由维护者代为整理成 PR。

## 约束

- 只允许 Markdown / JSON，不执行代码；
- `id` 小写字母/数字/连字符，2–64 位，不能与内置技能重名；
- 单个文件 ≤128KB，整包 ≤512KB，最多 8 个文件；
- `allowedTools` 只能收窄工具，不能新增权限；
- `preview` 是市场列表/详情用的摘要，不能省略；
- 不含个人信息、密钥、侵权素材或需要登录才能访问的文件。

## 目录

```
index.json
skills/
  trip-planner/{skill.json,SKILL.md}
  recipe-helper/{skill.json,SKILL.md}
scripts/check.mjs
```
