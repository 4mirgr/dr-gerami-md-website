import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const root = dirname(fileURLToPath(import.meta.url));
const host = '127.0.0.1';
const port = Number(process.env.ADMIN_PORT || 4173);
const token = randomBytes(24).toString('hex');
const maxBodyBytes = 2 * 1024 * 1024;

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8'
};

function runGit(args) {
  return spawnSync('git', args, { cwd: root, encoding: 'utf8' });
}

function jsonResponse(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(payload));
}

function validateContent(content) {
  if (!content || typeof content !== 'object') throw new Error('اطلاعات سایت معتبر نیست.');
  if (!content.site || typeof content.site !== 'object') throw new Error('اطلاعات برند سایت ناقص است.');
  if (!Array.isArray(content.videos)) throw new Error('فهرست ویدیوها معتبر نیست.');
  if (!Array.isArray(content.resources)) throw new Error('فهرست منابع معتبر نیست.');
  for (const video of content.videos) {
    if (!video || typeof video !== 'object' || !String(video.id || '').trim() || !String(video.title || '').trim()) {
      throw new Error('هر ویدیو باید عنوان و شناسه داشته باشد.');
    }
  }
  for (const resource of content.resources) {
    if (!resource || typeof resource !== 'object' || !String(resource.id || '').trim() || !String(resource.title || '').trim()) {
      throw new Error('هر منبع باید عنوان و شناسه داشته باشد.');
    }
  }
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) throw new Error('حجم اطلاعات بیش از حد مجاز است.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function publishChanges(request, response) {
  if (request.headers['x-admin-token'] !== token) {
    jsonResponse(response, 403, { ok: false, message: 'دسترسی پنل محلی معتبر نیست.' });
    return;
  }

  try {
    const workingTree = runGit(['status', '--porcelain']);
    if (workingTree.status !== 0) throw new Error(workingTree.stderr || 'وضعیت Git قابل بررسی نیست.');
    if (workingTree.stdout.trim()) {
      jsonResponse(response, 409, {
        ok: false,
        message: 'فایل‌های دیگری در پروژه تغییر کرده‌اند. ابتدا آن تغییرات را بررسی کنید و دوباره دکمه انتشار را بزنید.'
      });
      return;
    }

    const payload = await readJsonBody(request);
    validateContent(payload.content);
    if (typeof payload.themeCss !== 'string' || !payload.themeCss.includes(':root')) {
      throw new Error('تنظیمات ظاهر سایت معتبر نیست.');
    }

    const contentPath = join(root, 'data', 'site-content.json');
    const contentTempPath = `${contentPath}.tmp`;
    const themePath = join(root, 'theme-overrides.css');
    const themeTempPath = `${themePath}.tmp`;
    await writeFile(contentTempPath, `${JSON.stringify(payload.content, null, 2)}\n`, 'utf8');
    await writeFile(themeTempPath, `${payload.themeCss.trim()}\n`, 'utf8');
    await rename(contentTempPath, contentPath);
    await rename(themeTempPath, themePath);

    const add = runGit(['add', 'data/site-content.json', 'theme-overrides.css']);
    if (add.status !== 0) throw new Error(add.stderr || 'ذخیره تغییرات در Git ناموفق بود.');

    const diff = runGit(['diff', '--cached', '--quiet']);
    if (diff.status === 0) {
      jsonResponse(response, 200, { ok: true, changed: false, message: 'تغییر جدیدی برای انتشار وجود ندارد.' });
      return;
    }

    const commit = runGit(['commit', '-m', 'Update website from admin panel']);
    if (commit.status !== 0) throw new Error(commit.stderr || 'ساخت نسخه جدید ناموفق بود.');
    const commitSha = runGit(['rev-parse', '--short', 'HEAD']).stdout.trim();
    const push = runGit(['push', 'origin', 'main']);
    if (push.status !== 0) {
      jsonResponse(response, 500, {
        ok: false,
        committed: true,
        commit: commitSha,
        message: `تغییرات ذخیره شد اما ارسال به GitHub ناموفق بود: ${push.stderr.trim()}`
      });
      return;
    }

    jsonResponse(response, 200, {
      ok: true,
      changed: true,
      commit: commitSha,
      message: 'تغییرات با موفقیت ذخیره و به GitHub ارسال شد. انتشار سایت چند دقیقه زمان می‌برد.'
    });
  } catch (error) {
    jsonResponse(response, 400, { ok: false, message: error.message || 'خطای ناشناخته در انتشار سایت.' });
  }
}

async function serveFile(request, response, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/admin.html';
  const requestedPath = normalize(join(root, pathname));
  if (relative(root, requestedPath).startsWith('..')) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const fileStats = await stat(requestedPath);
    const filePath = fileStats.isDirectory() ? join(requestedPath, 'index.html') : requestedPath;
    const content = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    response.end(content);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${host}:${port}`);
  if (request.method === 'GET' && url.pathname === '/api/status') {
    const authenticated = request.headers['x-admin-token'] === token;
    if (!authenticated) {
      jsonResponse(response, 403, { ok: false });
      return;
    }
    const ghAuth = spawnSync('gh', ['auth', 'status'], { cwd: root, encoding: 'utf8' });
    jsonResponse(response, 200, {
      ok: true,
      local: true,
      githubAuthenticated: ghAuth.status === 0,
      branch: runGit(['branch', '--show-current']).stdout.trim()
    });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/publish') {
    await publishChanges(request, response);
    return;
  }
  if (request.method === 'GET' || request.method === 'HEAD') {
    await serveFile(request, response, url);
    return;
  }
  response.writeHead(405);
  response.end('Method not allowed');
});

server.listen(port, host, () => {
  const adminUrl = `http://${host}:${port}/admin.html?adminToken=${token}`;
  console.log('\nDr Gerami Website Manager is ready.');
  console.log('Keep this window open while editing.');
  console.log(adminUrl);
  if (process.env.NO_OPEN !== '1') {
    spawn('open', [adminUrl], { detached: true, stdio: 'ignore' }).unref();
  }
});
