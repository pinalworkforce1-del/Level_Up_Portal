import { readFile, writeFile } from 'node:fs/promises';

const path = 'dist/career-skill-tree/life-plan-completion.html';
let html = await readFile(path, 'utf8');

const oldLink = '<a href="index.html#tree">← Return to Career Tree</a>';
const newLink = '<a class="career-tree-return" href="../career-tree-next/">← Return to Career Tree</a>';

if (!html.includes(oldLink)) {
  throw new Error('Work + Life Plan legacy Career Tree return link was not found');
}

html = html.replace(oldLink, newLink);
html = html.replace(
  '.topline a{color:#c8d8f4;text-decoration:none}',
  '.topline a{color:#c8d8f4;text-decoration:none}.career-tree-return{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:10px 16px;border:1px solid #5e79a5;border-radius:12px;background:#122747;color:#f2f6ff!important;font-weight:850;box-shadow:0 8px 24px #02081745;transition:.16s}.career-tree-return:hover,.career-tree-return:focus-visible{border-color:#58dfd0;transform:translateY(-1px);outline:none;box-shadow:0 0 0 3px #58dfd022,0 10px 28px #02081766}'
);

await writeFile(path, html);
console.log('Patched Work + Life Plan return control to /career-tree-next/.');
