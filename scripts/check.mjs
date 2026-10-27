#!/usr/bin/env node
// 官方技能索引体检：校验条目字段、文件路径、sha256，以及本地 manifest 与索引是否一致。
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const INDEX = path.join(ROOT, 'index.json');
const ID_RE = /^[a-z0-9][a-z0-9-]{1,63}$/;
const FILE_RE = /^[A-Za-z0-9_.-]{1,80}\.(json|md)$/i;
const errors = [];
let data;
try { data = JSON.parse(fs.readFileSync(INDEX, 'utf8')); }
catch (error) { console.error(`✖ 读取 index.json 失败：${error?.message || error}`); process.exit(1); }
if (!Array.isArray(data?.skills) || !data.skills.length) errors.push('index.json 没有 skills 数组或为空');
const seen = new Set();
for (const [i, entry] of (data.skills || []).entries()) {
  const label = `skills[${i}]${entry?.id ? `(${entry.id})` : ''}`;
  const id = String(entry?.id || '');
  if (!ID_RE.test(id)) errors.push(`${label}: id 非法`);
  if (seen.has(id)) errors.push(`${label}: id 重复`);
  seen.add(id);
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(String(entry?.version || ''))) errors.push(`${label}: version 不是 semver`);
  if (!String(entry?.name || '').trim()) errors.push(`${label}: 缺少 name`);
  if (!String(entry?.preview || '').trim()) errors.push(`${label}: 缺少 preview`);
  const files = entry?.files;
  if (!files || typeof files !== 'object' || Array.isArray(files)) { errors.push(`${label}: files 必须是对象`); continue; }
  if (Object.keys(files).length > 8) errors.push(`${label}: 文件超过 8 个`);
  if (!files['skill.json']) errors.push(`${label}: 缺少 skill.json`);
  let manifest = null;
  for (const [name, meta] of Object.entries(files)) {
    if (!FILE_RE.test(name)) { errors.push(`${label}: 文件键非法 ${name}`); continue; }
    const rel = String(meta?.path || '');
    const abs = path.resolve(ROOT, rel);
    if (!rel || !abs.startsWith(path.join(ROOT, 'skills') + path.sep)) { errors.push(`${label}: ${name} 路径必须在 skills/ 下`); continue; }
    if (!/^[0-9a-f]{64}$/i.test(String(meta?.sha256 || ''))) errors.push(`${label}: ${name} sha256 格式错误`);
    if (!fs.existsSync(abs)) { errors.push(`${label}: ${name} 文件不存在 ${rel}`); continue; }
    const bytes = fs.readFileSync(abs);
    if (bytes.length !== Number(meta.bytes)) errors.push(`${label}: ${name} bytes 不一致`);
    if (crypto.createHash('sha256').update(bytes).digest('hex') !== String(meta.sha256).toLowerCase()) errors.push(`${label}: ${name} sha256 不一致`);
    if (name === 'skill.json') { try { manifest = JSON.parse(bytes.toString('utf8')); } catch { errors.push(`${label}: skill.json 不是 JSON`); } }
  }
  if (manifest) {
    if (manifest.id !== id) errors.push(`${label}: manifest id=${manifest.id} 与索引不一致`);
    const expected = [...(manifest.allowedTools || [])].sort().join('\n');
    const actual = [...(entry.allowedTools || [])].sort().join('\n');
    if (expected !== actual) errors.push(`${label}: allowedTools 与 manifest 不一致`);
    const instructions = String(manifest.instructions || 'SKILL.md').trim();
    if (!files[instructions]) errors.push(`${label}: 缺少说明文件 ${instructions}`);
  }
}
if (errors.length) { for (const error of errors) console.error(`✖ ${error}`); process.exit(1); }
console.log(`✓ 官方技能索引通过：${data.skills.length} 个技能`);
