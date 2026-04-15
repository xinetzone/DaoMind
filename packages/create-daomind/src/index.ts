#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prompts from 'prompts';
import { red, green, cyan, yellow, bold } from 'kolorist';
import minimist from 'minimist';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const argv = minimist(process.argv.slice(2), { string: ['_'] });
const cwd = process.cwd();

type Template = {
  name: string;
  display: string;
  color: (str: string) => string;
  description: string;
};

const TEMPLATES: Template[] = [
  {
    name: 'hello-world',
    display: 'Hello World',
    color: green,
    description: '最简单的入门示例',
  },
  {
    name: 'counter',
    display: 'Counter',
    color: cyan,
    description: '状态管理和不可变更新',
  },
  {
    name: 'todo-list',
    display: 'Todo List',
    color: yellow,
    description: 'CRUD 操作和数据管理',
  },
  {
    name: 'user-management',
    display: 'User Management',
    color: red,
    description: '用户管理和权限控制',
  },
];

async function init() {
  console.log();
  console.log(cyan('╔════════════════════════════════════════════╗'));
  console.log(cyan('║') + bold('  Create DaoMind Project             ') + cyan('    ║'));
  console.log(cyan('╚════════════════════════════════════════════╝'));
  console.log();

  let targetDir = argv._[0];
  let template = argv.template || argv.t;

  const defaultProjectName = 'daomind-project';

  let result: prompts.Answers<'projectName' | 'overwrite' | 'template'>;

  try {
    result = await prompts(
      [
        {
          type: targetDir ? null : 'text',
          name: 'projectName',
          message: '项目名称:',
          initial: defaultProjectName,
          onState: (state) =>
            (targetDir = state.value.trim() || defaultProjectName),
        },
        {
          type: () =>
            !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'confirm',
          name: 'overwrite',
          message: () =>
            (targetDir === '.'
              ? '当前目录'
              : `目录 "${targetDir}"`) +
            ' 不为空。是否删除现有文件并继续？',
        },
        {
          type: (_, { overwrite }: { overwrite?: boolean }) => {
            if (overwrite === false) {
              throw new Error(red('✖') + ' 操作已取消');
            }
            return null;
          },
          name: 'overwriteChecker',
        },
        {
          type: template ? null : 'select',
          name: 'template',
          message: '选择模板:',
          initial: 0,
          choices: TEMPLATES.map((t) => ({
            title: t.color(t.display),
            value: t.name,
            description: t.description,
          })),
        },
      ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ' 操作已取消');
        },
      }
    );
  } catch (cancelled: unknown) {
    console.log((cancelled as Error).message);
    return;
  }

  const { overwrite, template: selectedTemplate } = result;

  const root = path.join(cwd, targetDir);

  if (overwrite) {
    emptyDir(root);
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }

  template = selectedTemplate || template;

  console.log(`\n正在创建项目到 ${root}...\n`);

  const templateDir = path.resolve(
    __dirname,
    '../templates',
    `template-${template}`
  );

  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, file);
    if (content) {
      fs.writeFileSync(targetPath, content);
    } else {
      copy(path.join(templateDir, file), targetPath);
    }
  };

  const files = fs.readdirSync(templateDir);
  for (const file of files.filter((f) => f !== 'package.json')) {
    write(file);
  }

  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, 'package.json'), 'utf-8')
  );

  pkg.name = path.basename(root);

  write('package.json', JSON.stringify(pkg, null, 2));

  const pkgManager = getPkgManager();

  console.log(green('✓') + ' 项目创建完成！\n');
  console.log('下一步:\n');
  
  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`);
  }
  console.log(`  ${pkgManager === 'pnpm' ? 'pnpm install' : pkgManager === 'yarn' ? 'yarn' : 'npm install'}`);
  console.log(`  ${pkgManager === 'pnpm' ? 'pnpm dev' : pkgManager === 'yarn' ? 'yarn dev' : 'npm run dev'}`);
  console.log();
}

function copy(src: string, dest: string) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}

function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    copy(srcFile, destFile);
  }
}

function isEmpty(path: string) {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
}

function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue;
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
  }
}

function getPkgManager() {
  const userAgent = process.env.npm_config_user_agent;
  if (!userAgent) {
    return 'npm';
  }
  if (userAgent.startsWith('pnpm')) {
    return 'pnpm';
  }
  if (userAgent.startsWith('yarn')) {
    return 'yarn';
  }
  return 'npm';
}

init().catch((e) => {
  console.error(e);
});
