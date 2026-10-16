(() => {
  const cms = window.AIDICMS;
  const loginSection = document.getElementById('adminLogin');
  const dashboard = document.getElementById('adminDashboard');
  if (!loginSection || !dashboard) return;

  const pageLabels = {
    'index.html': 'Home',
    'about.html': 'About',
    'programs.html': 'Programmes',
    'where.html': 'Where We Work',
    'stories.html': 'Stories',
    'governance.html': 'Governance',
    'contact.html': 'Contact',
    'donate.html': 'Donate'
  };
  const $ = selector => document.querySelector(selector);
  const loginStatus = $('#loginStatus');
  const dashboardStatus = $('#dashboardStatus');
  let currentUser = null;
  let previewMode = false;
  let allFields = [];
  let siteValues = new Map();
  let storyImageUrl = '';

  function setStatus(element, message, isError = false) {
    element.textContent = message;
    if (isError) element.dataset.error = 'true';
    else delete element.dataset.error;
  }

  function showDashboard(user) {
    currentUser = user;
    previewMode = false;
    loginSection.hidden = true;
    dashboard.hidden = false;
    $('#signOut').textContent = 'Sign out';
    $('#signedInAs').textContent = user.email || 'Preview dashboard';
    loadContentEditor().catch(error => setStatus(dashboardStatus, error.message, true));
  }

  function showLogin() {
    currentUser = null;
    dashboard.hidden = true;
    loginSection.hidden = false;
    $('#signOut').textContent = 'Sign out';
  }

  function previewDashboard() {
    const previewUser = { email: 'preview@aidiuganda.local', id: 'preview-admin' };
    previewMode = true;
    loginSection.hidden = true;
    dashboard.hidden = false;
    $('#signedInAs').textContent = previewUser.email;
    $('#signOut').textContent = 'Back to sign in';
    currentUser = previewUser;
    setStatus(dashboardStatus, 'Preview mode: this dashboard is not connected to a live Supabase admin session yet.');
    renderPreviewContent();
    renderPreviewList('storyList', [
      ['Community story example', 'A sample story showing how published community updates will appear here.', 'Sample story content; real stories appear after Supabase is connected.', 'Sample only · Published']
    ]);
    renderPreviewList('messageList', [
      ['Sample contact message', 'visitor@example.org', 'This is example content only; real messages appear after Supabase is connected.', 'Sample only · New']
    ]);
    renderPreviewList('donationList', [
      ['Sample donation request', 'donor@example.org', 'This is example content only; real requests appear after Supabase is connected.', 'Sample only · New']
    ]);
    $('#messageCount').textContent = '1';
    $('#donationCount').textContent = '1';
  }

  function renderPreviewContent() {
    const filter = $('#contentPageFilter');
    filter.replaceChildren();
    for (const [value, label] of [['all', 'All pages'], ['index.html', 'Home']]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      filter.appendChild(option);
    }
    filter.disabled = true;
    const host = $('#contentList');
    host.replaceChildren();
    for (const [title, value] of [
      ['Home — Main heading', 'Empowering Communities, Growing Futures'],
      ['Home — Introductory text', 'AIDI Uganda is a community-rooted initiative.']
    ]) {
      const card = document.createElement('article');
      card.className = 'admin-content-card';
      const editor = document.createElement('div');
      const label = document.createElement('label');
      label.textContent = title;
      const input = document.createElement('textarea');
      input.value = value;
      input.disabled = true;
      const help = document.createElement('small');
      help.textContent = 'Sample preview only — connect Supabase to edit live website content.';
      editor.append(label, help, input);
      const save = document.createElement('button');
      save.className = 'admin-button admin-button-primary';
      save.type = 'button';
      save.textContent = 'Save';
      save.disabled = true;
      card.append(editor, save);
      host.appendChild(card);
    }
    $('#storyForm').querySelectorAll('input, textarea, button').forEach(control => { control.disabled = true; });
  }

  function renderPreviewList(hostId, entries) {
    const host = document.getElementById(hostId);
    host.replaceChildren();
    for (const [titleText, detailText, bodyText, statusText] of entries) {
      const card = document.createElement('article');
      card.className = hostId === 'storyList' ? 'admin-story-item' : 'admin-inbox-card';
      const title = document.createElement('h3');
      title.textContent = titleText;
      const detail = document.createElement('p');
      detail.textContent = detailText;
      const body = document.createElement('p');
      body.textContent = bodyText;
      const status = document.createElement('small');
      status.textContent = statusText;
      card.append(title, detail, body, status);
      host.appendChild(card);
    }
  }

  async function verifyAdmin(user) {
    const { data, error } = await cms.client
      .from('aidi_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw new Error(`Could not verify admin access: ${error.message}`);
    if (!data) throw new Error('This account can sign in, but it has not been approved as an AIDI administrator.');
  }

  async function startSession(session) {
    if (!session) {
      showLogin();
      return;
    }
    try {
      await verifyAdmin(session.user);
      showDashboard(session.user);
      setStatus(loginStatus, '');
    } catch (error) {
      await cms.client.auth.signOut();
      showLogin();
      setStatus(loginStatus, error.message, true);
    }
  }

  function createContentField(page, element) {
    const sharedLogo = element.matches('.logo-image');
    const key = sharedLogo ? 'site:logo' : `${page}:${cms.cssPath(element)}`;
    const isImage = element.matches('img, .hero-slide');
    const section = element.closest('section');
    const heroSlideNumber = element.matches('.hero-slide')
      ? Array.from(element.parentElement.querySelectorAll('.hero-slide')).indexOf(element) + 1
      : 0;
    const defaultValue = isImage
      ? (element.matches('.hero-slide')
          ? ((element.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/) || [])[1] || '')
          : element.getAttribute('src'))
      : element.textContent.trim();
    return {
      key,
      altKey: `${key}:alt`,
      page: sharedLogo ? 'site' : page,
      type: isImage ? 'image' : 'text',
      label: isImage
        ? (element.matches('.hero-slide')
            ? `Homepage banner photo ${heroSlideNumber}`
            : (element.getAttribute('alt') || element.getAttribute('aria-label') || `${element.localName} image`))
        : element.textContent.trim().replace(/\s+/g, ' ').slice(0, 110),
      value: defaultValue || '',
      alt: element.getAttribute('alt') || '',
      selector: cms.cssPath(element),
      section: section ? (section.querySelector('h1,h2,h3')?.textContent.trim() || 'Page section') : 'Site-wide'
    };
  }

  async function discoverAllFields() {
    const gathered = new Map();
    for (const page of cms.pages) {
      const response = await fetch(new URL(page, location.href), { cache: 'no-store' });
      if (!response.ok) throw new Error(`Could not read ${page} (${response.status}). Run the site through its web host or a local HTTP server.`);
      const parsed = new DOMParser().parseFromString(await response.text(), 'text/html');
      for (const element of parsed.querySelectorAll('h1, h2, h3, p, blockquote, cite, .timeline-year, img, .hero-slide, header .logo-image, footer .logo-image, .hero h1 > span')) {
        const excludedContainer = element.closest('header, footer, .admin-page');
        if (excludedContainer && !element.matches('.logo-image')) continue;
        if (!element.matches('img, .hero-slide') && element.children.length) continue;
        const field = createContentField(page, element);
        if (field.value || field.type === 'image') {
          if (!gathered.has(field.key)) gathered.set(field.key, field);
        }
      }
    }
    return Array.from(gathered.values());
  }

  async function loadContentEditor() {
    if (!cms.configured || !currentUser) return;
    setStatus(dashboardStatus, 'Loading editable website content…');
    const [fields, result] = await Promise.all([
      discoverAllFields(),
      cms.client.from('site_content').select('content_key,value,content_type')
    ]);
    if (result.error) throw new Error(`Could not load website content: ${result.error.message}`);
    allFields = fields;
    siteValues = new Map(result.data.map(row => [row.content_key, row]));

    const filter = $('#contentPageFilter');
    filter.replaceChildren();
    const pages = ['all', 'site', ...cms.pages];
    for (const page of pages) {
      const option = document.createElement('option');
      option.value = page;
      option.textContent = page === 'all' ? 'All pages' : page === 'site' ? 'Site-wide' : pageLabels[page];
      filter.appendChild(option);
    }
    filter.onchange = renderContentFields;
    renderContentFields();
    setStatus(dashboardStatus, `${allFields.length} editable text and image fields are ready.`);
    await Promise.all([loadStories(), loadInbox('contact_messages', 'messageList', 'messageCount'),
      loadInbox('donation_requests', 'donationList', 'donationCount')]);
  }

  function renderContentFields() {
    const host = $('#contentList');
    const selectedPage = $('#contentPageFilter').value;
    const fields = allFields.filter(field => selectedPage === 'all' || field.page === selectedPage);
    host.replaceChildren();
    if (!fields.length) {
      host.textContent = 'No editable fields were found for this page.';
      return;
    }
    let lastGroup = '';
    for (const field of fields) {
      const group = `${field.page}|${field.section}`;
      if (group !== lastGroup) {
        const heading = document.createElement('h3');
        heading.className = 'admin-content-group';
        heading.textContent = `${field.page === 'site' ? 'Site-wide' : pageLabels[field.page]} — ${field.section}`;
        host.appendChild(heading);
        lastGroup = group;
      }
      const card = document.createElement('article');
      card.className = 'admin-content-card';
      const editor = document.createElement('div');
      const label = document.createElement('label');
      label.textContent = field.type === 'image' ? `Photo: ${field.label}` : field.label;
      editor.appendChild(label);
      const help = document.createElement('small');
      help.textContent = field.type === 'image'
        ? 'Upload a JPG, PNG, WEBP, or GIF photo (maximum 10 MB).'
        : 'Changing this text does not alter the section layout.';
      editor.appendChild(help);

      const stored = siteValues.get(field.key);
      if (field.type === 'image') {
        const preview = document.createElement('img');
        preview.src = stored?.content_type === 'image' ? stored.value : field.value;
        preview.alt = field.alt || field.label;
        preview.hidden = !preview.src;
        editor.appendChild(preview);
        const file = document.createElement('input');
        file.type = 'file';
        file.accept = 'image/jpeg,image/png,image/webp,image/gif';
        file.setAttribute('aria-label', `Upload replacement for ${field.label}`);
        file.addEventListener('change', () => {
          if (file.files?.[0]) preview.src = URL.createObjectURL(file.files[0]);
        });
        editor.appendChild(file);
        const altLabel = document.createElement('label');
        altLabel.textContent = 'Accessible photo description';
        const alt = document.createElement('input');
        alt.type = 'text';
        alt.maxLength = 240;
        alt.value = siteValues.get(field.altKey)?.value ?? field.alt;
        alt.setAttribute('aria-label', `Photo description for ${field.label}`);
        editor.append(altLabel, alt);
        card.dataset.altKey = field.altKey;
        card.dataset.altValue = alt.value;
      } else {
        const textarea = document.createElement('textarea');
        textarea.maxLength = 5000;
        textarea.value = stored?.value ?? field.value;
        textarea.setAttribute('aria-label', `Edit ${field.label}`);
        editor.appendChild(textarea);
      }
      const actions = document.createElement('div');
      actions.className = 'admin-field-actions';
      const save = document.createElement('button');
      save.className = 'admin-button admin-button-primary';
      save.type = 'button';
      save.textContent = 'Save';
      save.addEventListener('click', () => saveContentField(field, card, save));
      actions.appendChild(save);
      card.append(editor, actions);
      card.dataset.key = field.key;
      card.dataset.type = field.type;
      host.appendChild(card);
    }
  }

  async function uploadImage(file, folder) {
    if (!file) return '';
    const allowed = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif'
    };
    if (!allowed[file.type]) throw new Error('Choose a JPG, PNG, WEBP, or GIF image.');
    if (file.size > 10 * 1024 * 1024) throw new Error('Image must be 10 MB or smaller.');
    const path = `${folder}/${crypto.randomUUID()}.${allowed[file.type]}`;
    const { error } = await cms.client.storage.from('site-media').upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false
    });
    if (error) throw new Error(`Photo upload failed: ${error.message}`);
    return cms.client.storage.from('site-media').getPublicUrl(path).data.publicUrl;
  }

  async function upsertContent(key, value, type) {
    const { error } = await cms.client.from('site_content').upsert({
      content_key: key,
      value,
      content_type: type,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString()
    }, { onConflict: 'content_key' });
    if (error) throw new Error(`Could not save content: ${error.message}`);
  }

  async function saveContentField(field, card, button) {
    button.disabled = true;
    try {
      if (field.type === 'image') {
        const file = card.querySelector('input[type="file"]').files?.[0];
        const current = siteValues.get(field.key);
        const url = file ? await uploadImage(file, 'content') : current?.value || field.value;
        if (!url) throw new Error('Choose a replacement photo before saving.');
        await upsertContent(field.key, url, 'image');
        const alt = card.querySelector('input[type="text"]').value.trim();
        await upsertContent(field.altKey, alt, 'image_alt');
        siteValues.set(field.key, { content_key: field.key, value: url, content_type: 'image' });
        siteValues.set(field.altKey, { content_key: field.altKey, value: alt, content_type: 'image_alt' });
      } else {
        const value = card.querySelector('textarea').value.trim();
        if (!value) throw new Error('Text content cannot be blank.');
        await upsertContent(field.key, value, 'text');
        siteValues.set(field.key, { content_key: field.key, value, content_type: 'text' });
      }
      setStatus(dashboardStatus, 'Saved. The published website will show this change on its next load.');
      if (field.type === 'image') {
        const preview = card.querySelector('img');
        preview.src = siteValues.get(field.key).value;
        preview.hidden = false;
      }
    } catch (error) {
      setStatus(dashboardStatus, error.message, true);
    } finally {
      button.disabled = false;
    }
  }

  function resetStoryForm() {
    $('#storyForm').reset();
    $('#storyId').value = '';
    $('#storyExistingImage').value = '';
    $('#storyImagePreview').hidden = true;
    $('#storyImagePreview').removeAttribute('src');
    $('#saveStory').textContent = 'Save story';
    $('#cancelStoryEdit').hidden = true;
    storyImageUrl = '';
  }

  async function loadStories() {
    const { data, error } = await cms.client.from('stories')
      .select('id,title,excerpt,body,image_url,published,published_at,created_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Could not load stories: ${error.message}`);
    const host = $('#storyList');
    host.replaceChildren();
    if (!data.length) {
      const empty = document.createElement('p');
      empty.className = 'admin-empty';
      empty.textContent = 'No stories yet. Add one using the form above.';
      host.appendChild(empty);
      return;
    }
    for (const story of data) {
      const card = document.createElement('article');
      card.className = 'admin-story-item';
      const heading = document.createElement('h3');
      heading.textContent = story.title;
      const excerpt = document.createElement('p');
      excerpt.textContent = story.excerpt;
      const status = document.createElement('small');
      status.textContent = story.published ? 'Published' : 'Draft';
      const actions = document.createElement('div');
      actions.className = 'admin-story-actions';
      const edit = document.createElement('button');
      edit.className = 'admin-button admin-button-secondary';
      edit.type = 'button';
      edit.textContent = 'Edit';
      edit.addEventListener('click', () => {
        $('#storyId').value = story.id;
        $('#storyTitle').value = story.title;
        $('#storyExcerpt').value = story.excerpt;
        $('#storyBody').value = story.body;
        $('#storyPublished').checked = story.published;
        $('#storyExistingImage').value = story.image_url || '';
        storyImageUrl = story.image_url || '';
        const preview = $('#storyImagePreview');
        preview.src = story.image_url || '';
        preview.hidden = !story.image_url;
        $('#saveStory').textContent = 'Update story';
        $('#cancelStoryEdit').hidden = false;
        $('#storyForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      const remove = document.createElement('button');
      remove.className = 'admin-button admin-button-danger';
      remove.type = 'button';
      remove.textContent = 'Delete';
      remove.addEventListener('click', async () => {
        if (!confirm(`Delete "${story.title}"? This cannot be undone.`)) return;
        const { error: deleteError } = await cms.client.from('stories').delete().eq('id', story.id);
        if (deleteError) setStatus(dashboardStatus, `Could not delete story: ${deleteError.message}`, true);
        else {
          setStatus(dashboardStatus, 'Story deleted.');
          await loadStories();
        }
      });
      actions.append(edit, remove);
      card.append(heading, excerpt, status, actions);
      host.appendChild(card);
    }
  }

  async function saveStory(event) {
    event.preventDefault();
    const button = $('#saveStory');
    button.disabled = true;
    try {
      const id = $('#storyId').value;
      const imageFile = $('#storyImage').files?.[0];
      const imageUrl = imageFile ? await uploadImage(imageFile, 'stories') : storyImageUrl;
      const published = $('#storyPublished').checked;
      const payload = {
        title: $('#storyTitle').value.trim(),
        excerpt: $('#storyExcerpt').value.trim(),
        body: $('#storyBody').value.trim(),
        image_url: imageUrl || null,
        published,
        published_at: published ? new Date().toISOString() : null,
        updated_by: currentUser.id,
        updated_at: new Date().toISOString()
      };
      const result = id
        ? await cms.client.from('stories').update(payload).eq('id', id)
        : await cms.client.from('stories').insert(payload);
      if (result.error) throw new Error(`Could not save story: ${result.error.message}`);
      setStatus(dashboardStatus, published ? 'Story saved and published.' : 'Story saved as a draft.');
      resetStoryForm();
      await loadStories();
    } catch (error) {
      setStatus(dashboardStatus, error.message, true);
    } finally {
      button.disabled = false;
    }
  }

  async function loadInbox(table, hostId, countId) {
    const { data, error } = await cms.client.from(table)
      .select('id,name,email,message,status,created_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Could not load ${table === 'contact_messages' ? 'messages' : 'donation requests'}: ${error.message}`);
    const host = document.getElementById(hostId);
    document.getElementById(countId).textContent = data.filter(item => item.status === 'new').length || '';
    host.replaceChildren();
    if (!data.length) {
      const empty = document.createElement('p');
      empty.className = 'admin-empty';
      empty.textContent = 'Nothing here yet.';
      host.appendChild(empty);
      return;
    }
    for (const item of data) {
      const card = document.createElement('article');
      card.className = 'admin-inbox-card';
      const content = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = item.name;
      const email = document.createElement('p');
      const emailLink = document.createElement('a');
      emailLink.href = `mailto:${item.email}`;
      emailLink.textContent = item.email;
      email.appendChild(emailLink);
      const message = document.createElement('pre');
      message.textContent = item.message;
      const date = document.createElement('small');
      date.textContent = new Date(item.created_at).toLocaleString();
      content.append(title, email, message, date);
      const tools = document.createElement('div');
      tools.className = 'admin-inbox-tools';
      const statusLabel = document.createElement('label');
      statusLabel.textContent = 'Status';
      const status = document.createElement('select');
      statusLabel.appendChild(status);
      for (const value of ['new', 'read', 'archived']) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value[0].toUpperCase() + value.slice(1);
        status.appendChild(option);
      }
      status.value = item.status;
      status.addEventListener('change', async () => {
        const { error: updateError } = await cms.client.from(table).update({ status: status.value }).eq('id', item.id);
        if (updateError) {
          setStatus(dashboardStatus, `Could not update status: ${updateError.message}`, true);
          status.value = item.status;
          return;
        }
        setStatus(dashboardStatus, 'Request status updated.');
        await loadInbox(table, hostId, countId);
      });
      const remove = document.createElement('button');
      remove.className = 'admin-button admin-button-danger';
      remove.type = 'button';
      remove.textContent = 'Delete';
      remove.addEventListener('click', async () => {
        if (!confirm('Delete this record permanently?')) return;
        const { error: deleteError } = await cms.client.from(table).delete().eq('id', item.id);
        if (deleteError) setStatus(dashboardStatus, `Could not delete record: ${deleteError.message}`, true);
        else {
          setStatus(dashboardStatus, 'Record deleted.');
          await loadInbox(table, hostId, countId);
        }
      });
      tools.append(statusLabel, remove);
      card.append(content, tools);
      host.appendChild(card);
    }
  }

  async function activatePanel(panelId) {
    document.querySelectorAll('.admin-tab').forEach(tab => {
      const active = tab.dataset.panel === panelId;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.admin-panel').forEach(panel => {
      panel.hidden = panel.id !== panelId;
    });
    if (previewMode) return;
    if (panelId === 'storiesPanel') await loadStories();
    if (panelId === 'messagesPanel') await loadInbox('contact_messages', 'messageList', 'messageCount');
    if (panelId === 'donationsPanel') await loadInbox('donation_requests', 'donationList', 'donationCount');
  }

  function initialize() {
    const loginButton = $('#previewDashboard');
    if (loginButton) {
      loginButton.addEventListener('click', () => {
        setStatus(loginStatus, 'Preview mode enabled. Connect Supabase to unlock real admin access.', false);
        previewDashboard();
      });
    }
    $('#signOut').addEventListener('click', async () => {
      if (previewMode) {
        previewMode = false;
        $('#contentPageFilter').disabled = false;
        $('#storyForm').querySelectorAll('input, textarea, button').forEach(control => { control.disabled = false; });
        showLogin();
        return;
      }
      const { error } = await cms.client.auth.signOut();
      if (error) setStatus(dashboardStatus, `Could not sign out: ${error.message}`, true);
      else showLogin();
    });
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => activatePanel(tab.dataset.panel)
        .catch(error => setStatus(dashboardStatus, error.message, true)));
    });

    if (!cms?.configured || !cms.client) {
      $('#configurationHelp').hidden = false;
      setStatus(loginStatus, 'The Supabase connection has not been configured.', true);
      return;
    }

    $('#loginForm').addEventListener('submit', async event => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('button[type="submit"]');
      button.disabled = true;
      setStatus(loginStatus, 'Signing in…');
      const { data, error } = await cms.client.auth.signInWithPassword({
        email: $('#loginEmail').value.trim(),
        password: $('#loginPassword').value
      });
      button.disabled = false;
      if (error) {
        setStatus(loginStatus, error.message, true);
        return;
      }
      await startSession(data.session);
    });

    $('#resetPassword').addEventListener('click', async () => {
      const email = $('#loginEmail').value.trim();
      if (!email) {
        setStatus(loginStatus, 'Enter your admin email address first.', true);
        return;
      }
      const { error } = await cms.client.auth.resetPasswordForEmail(email, {
        redirectTo: new URL('admin.html', location.href).href
      });
      setStatus(loginStatus, error ? error.message : 'Password reset email sent.', Boolean(error));
    });

    $('#storyForm').addEventListener('submit', saveStory);
    $('#cancelStoryEdit').addEventListener('click', resetStoryForm);
    $('#storyImage').addEventListener('change', event => {
      const file = event.currentTarget.files?.[0];
      if (!file) return;
      const preview = $('#storyImagePreview');
      preview.src = URL.createObjectURL(file);
      preview.hidden = false;
      storyImageUrl = $('#storyExistingImage').value;
    });
    cms.client.auth.getSession().then(({ data, error }) => {
      if (error) setStatus(loginStatus, `Could not restore session: ${error.message}`, true);
      else startSession(data.session);
    });
    cms.client.auth.onAuthStateChange((_event, session) => {
      if (!session && currentUser) showLogin();
    });
  }

  initialize();
})();
