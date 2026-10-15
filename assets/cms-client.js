(() => {
  const config = window.AIDI_SUPABASE_CONFIG || {};
  const configured = Boolean(
    window.supabase &&
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url || '') &&
    typeof config.anonKey === 'string' &&
    config.anonKey.length > 20
  );
  const client = configured
    ? window.supabase.createClient(config.url, config.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      })
    : null;
  const editableSelector = 'h1, h2, h3, p, blockquote, cite, .timeline-year, img, .hero-slide, header .logo-image, footer .logo-image, .hero h1 > span';
  const pages = [
    'index.html',
    'about.html',
    'programs.html',
    'where.html',
    'stories.html',
    'governance.html',
    'contact.html',
    'donate.html'
  ];

  function cssPath(element) {
    const parts = [];
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE && current !== current.ownerDocument.body) {
      let part = current.localName;
      if (current.id) {
        part = `#${CSS.escape(current.id)}`;
        parts.unshift(part);
        break;
      }
      let index = 1;
      for (let sibling = current.previousElementSibling; sibling; sibling = sibling.previousElementSibling) {
        if (sibling.localName === current.localName) index += 1;
      }
      part += `:nth-of-type(${index})`;
      parts.unshift(part);
      current = current.parentElement;
    }
    return `${parts[0].startsWith('#') ? '' : 'body > '}${parts.join(' > ')}`;
  }

  function pageName(documentRef = document) {
    const path = new URL(documentRef.URL).pathname;
    return path.split('/').filter(Boolean).pop() || 'index.html';
  }

  function discoverEditable(documentRef = document, pageOverride) {
    const page = pageOverride || pageName(documentRef);
    return Array.from(documentRef.querySelectorAll(editableSelector))
      .filter(element => {
        const excludedContainer = element.closest('header, footer, .admin-page');
        return !excludedContainer || element.matches('.logo-image');
      })
      .filter(element => element.matches('img, .hero-slide') || element.children.length === 0)
      .map(element => {
        const isImage = element.matches('img, .hero-slide');
        const key = element.matches('.logo-image') ? 'site:logo' : `${page}:${cssPath(element)}`;
        const section = element.closest('section');
        const imageUrl = element.matches('.hero-slide')
          ? ((element.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/) || [])[1] || '')
          : element.getAttribute('src');
        return {
          key,
          altKey: `${key}:alt`,
          page: element.matches('.logo-image') ? 'site' : page,
          type: isImage ? 'image' : 'text',
          label: isImage
            ? (element.getAttribute('alt') || element.getAttribute('aria-label') || `${element.localName} image`)
            : element.textContent.trim().replace(/\s+/g, ' ').slice(0, 110),
          value: isImage ? imageUrl : element.textContent.trim(),
          alt: element.getAttribute('alt') || '',
          selector: cssPath(element),
          section: section ? (section.querySelector('h1,h2,h3')?.textContent.trim() || 'Page section') : 'Site-wide'
        };
      })
      .filter(field => field.value || field.type === 'image');
  }

  async function applyPublishedContent() {
    if (!client) return;
    const { data, error } = await client.from('site_content').select('content_key,value,content_type');
    if (error) {
      console.error('Could not load published site content:', error.message);
      return;
    }
    const values = new Map(data.map(item => [item.content_key, item]));
    const page = pageName();
    for (const field of discoverEditable()) {
      const stored = values.get(field.key);
      const element = document.querySelector(field.selector);
      if (!stored || !element) continue;
      if (stored.content_type === 'image') {
        if (element.matches('.hero-slide')) element.style.backgroundImage = `url("${stored.value.replace(/["\\\\]/g, '')}")`;
        else element.setAttribute('src', stored.value);
        if (field.key === 'site:logo') {
          document.querySelectorAll('link[rel~="icon"]').forEach(icon => icon.setAttribute('href', stored.value));
        }
        const alt = values.get(field.altKey);
        if (alt && element.matches('img')) element.setAttribute('alt', alt.value);
      } else if (stored.content_type === 'text' && field.page === page) {
        element.textContent = stored.value;
      }
    }
    await renderPublishedStories(client);
  }

  async function renderPublishedStories(supabaseClient = client) {
    const host = document.getElementById('publishedStories');
    if (!host || !supabaseClient) return;
    const { data, error } = await supabaseClient
      .from('stories')
      .select('id,title,excerpt,body,image_url,published_at')
      .eq('published', true)
      .order('published_at', { ascending: false });
    if (error) {
      console.error('Could not load published stories:', error.message);
      return;
    }
    host.replaceChildren();
    if (!data.length) {
      host.textContent = 'New community stories will appear here.';
      return;
    }
    for (const story of data) {
      const article = document.createElement('article');
      article.className = 'cms-story-card';
      if (story.image_url) {
        const image = document.createElement('img');
        image.src = story.image_url;
        image.alt = story.title;
        image.loading = 'lazy';
        article.appendChild(image);
      }
      const content = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = story.title;
      const excerpt = document.createElement('p');
      excerpt.textContent = story.excerpt;
      const body = document.createElement('p');
      body.className = 'cms-story-body';
      body.textContent = story.body;
      content.append(title, excerpt, body);
      if (story.published_at) {
        const date = document.createElement('time');
        date.dateTime = story.published_at;
        date.textContent = new Date(story.published_at).toLocaleDateString();
        content.appendChild(date);
      }
      article.appendChild(content);
      host.appendChild(article);
    }
  }

  window.AIDICMS = {
    client,
    configured,
    pages,
    cssPath,
    pageName,
    discoverEditable,
    applyPublishedContent,
    renderPublishedStories
  };

  if (client) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyPublishedContent, { once: true });
    } else {
      applyPublishedContent();
    }
  }
})();
