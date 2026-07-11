const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => nav.classList.toggle('open'));
}
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', () => nav?.classList.remove('open'));
});
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const sections = [...document.querySelectorAll('[data-section]')];
const menuLinks = [...document.querySelectorAll('.cabinet-menu a')];
if (sections.length) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        menuLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      }
    });
  }, { threshold: .35 });
  sections.forEach(section => observer.observe(section));
}

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[char]));

const safeUrl = value => {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^(https?:|mailto:|posts\/|\.\.\/posts\/|[\w-]+\.html)/.test(url)) return url;
  return '';
};

const chipList = tags => (tags || []).map(tag => `<span class="chip">${escapeHtml(tag)}</span>`).join('');

const getContentUrl = () => {
  const script = [...document.scripts].find(item => item.src && item.src.endsWith('script.js'));
  return script ? new URL('data/site-content.json', script.src).href : 'data/site-content.json';
};

async function loadSiteContent() {
  const contentTargets = document.querySelectorAll('[data-content-list]');
  if (!contentTargets.length) return null;
  try {
    const response = await fetch(getContentUrl(), { cache: 'no-store' });
    if (!response.ok) throw new Error(`Content file unavailable: ${response.status}`);
    const content = await response.json();
    renderContentLists(content);
    window.drGeramiContent = content;
    window.dispatchEvent(new CustomEvent('drgerami:content-loaded', { detail: content }));
    return content;
  } catch (error) {
    console.warn(error);
    window.dispatchEvent(new CustomEvent('drgerami:content-error', { detail: error }));
    return null;
  }
}

function renderContentLists(content) {
  document.querySelectorAll('[data-content-list="videos"]').forEach(target => {
    target.innerHTML = (content.videos || []).map(renderVideoCard).join('');
  });
  document.querySelectorAll('[data-content-list="resources"]').forEach(target => {
    target.innerHTML = (content.resources || []).map(renderResourceCard).join('');
  });
  document.querySelectorAll('[data-content-list="featured-videos"]').forEach(target => {
    target.innerHTML = (content.videos || []).slice(0, 3).map(renderFeaturedVideo).join('');
  });
}

function renderVideoCard(video) {
  const postUrl = safeUrl(video.postUrl);
  const youtubeUrl = safeUrl(video.youtubeUrl);
  const primaryUrl = youtubeUrl || postUrl;
  const primaryLabel = youtubeUrl ? 'دیدن ویدیو' : 'صفحه مکمل';
  return `<article class="simple-card content-card">
    <p class="eyebrow">{ ${escapeHtml(video.status || 'Draft')} }</p>
    <h3>${escapeHtml(video.title)}</h3>
    ${video.titleEn ? `<p class="ltr muted-line">${escapeHtml(video.titleEn)}</p>` : ''}
    <p>${escapeHtml(video.description)}</p>
    <div class="flow">${video.path ? `<span class="chip goldish">${escapeHtml(video.path)}</span>` : ''}${chipList(video.tags)}</div>
    ${primaryUrl ? `<div class="actions"><a class="btn primary" href="${escapeHtml(primaryUrl)}"${youtubeUrl ? ' target="_blank" rel="noopener"' : ''}>${primaryLabel}</a>${postUrl && youtubeUrl ? `<a class="btn secondary" href="${escapeHtml(postUrl)}">صفحه مکمل</a>` : ''}</div>` : ''}
  </article>`;
}

function renderResourceCard(resource) {
  const url = safeUrl(resource.url);
  return `<article class="simple-card content-card">
    <p class="eyebrow">{ ${escapeHtml(resource.type || 'Resource')} }</p>
    <h3>${escapeHtml(resource.title)}</h3>
    <p>${escapeHtml(resource.description)}</p>
    ${url ? `<a class="btn secondary" href="${escapeHtml(url)}" target="_blank" rel="noopener">Open resource</a>` : ''}
  </article>`;
}

function renderFeaturedVideo(video, index) {
  const postUrl = safeUrl(video.postUrl) || 'videos.html';
  const sizeClass = index === 0 ? 'wide' : 'small';
  return `<article class="tile ${sizeClass}">
    <div class="icon">${String(index + 1).padStart(2, '0')}</div>
    <h3>${escapeHtml(video.title)}</h3>
    <p>${escapeHtml(video.description)}</p>
    <div class="flow">${chipList(video.tags)}</div>
    <div class="actions"><a class="btn secondary" href="${escapeHtml(postUrl)}">باز کردن</a></div>
  </article>`;
}

loadSiteContent();

try {
  const theme = JSON.parse(localStorage.getItem('drGeramiThemeDraft') || 'null');
  if (theme) {
    const hexToRgba = (hex, alpha) => {
      const clean = hex.replace('#', '');
      const n = parseInt(clean, 16);
      return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
    };
    document.documentElement.style.setProperty('--bg', theme.bg);
    document.documentElement.style.setProperty('--bg2', theme.bg2);
    document.documentElement.style.setProperty('--panel', hexToRgba(theme.panelColor, Number(theme.panelOpacity) / 100));
    document.documentElement.style.setProperty('--panel2', hexToRgba(theme.panelColor, Math.min(.96, Number(theme.panelOpacity) / 100 + .14)));
    document.documentElement.style.setProperty('--cyan', theme.cyan);
    document.documentElement.style.setProperty('--cyan2', theme.cyan2);
    document.documentElement.style.setProperty('--gold', theme.gold);
    document.documentElement.style.setProperty('--text', theme.text);
    document.documentElement.style.setProperty('--muted', theme.muted);
    document.documentElement.style.setProperty('--r', `${theme.radius}px`);
  }
} catch (e) {}
