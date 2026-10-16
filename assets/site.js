
/* ============================================================
   AIDI UGANDA v5.0: INTERACTIVE JAVASCRIPT
   ============================================================ */

// HERO SLIDESHOW
const heroSlides = document.querySelectorAll('.hero-slide');
const heroDots = document.querySelectorAll('.hero-dot');
let currentHeroSlide = 0;
let slideshowInterval;
const heroSection = document.querySelector('.hero');

function goToHeroSlide(n) {
  heroSlides.forEach((s, i) => { s.classList.remove('active'); if (i === n) { void s.offsetWidth; s.classList.add('active'); } });
  heroDots.forEach((d, i) => { d.classList.remove('active'); if (i === n) { void d.offsetWidth; d.classList.add('active'); } });
  currentHeroSlide = n;
}
function nextHeroSlide() { goToHeroSlide((currentHeroSlide + 1) % heroSlides.length); }
function startSlideshow() { slideshowInterval = setInterval(nextHeroSlide, 8000); }
function stopSlideshow() { clearInterval(slideshowInterval); }
if (heroSlides.length && heroDots.length) {
  startSlideshow();
  heroDots.forEach(dot => { dot.addEventListener('click', () => { stopSlideshow(); goToHeroSlide(+dot.dataset.slide); startSlideshow(); }); });
}
if (heroSection) {
  heroSection.addEventListener('mouseenter', stopSlideshow);
  heroSection.addEventListener('mouseleave', startSlideshow);
}

// CUSTOM CURSOR
const dot = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
if (dot && ring) {
  document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; dot.style.left = mouseX + 'px'; dot.style.top = mouseY + 'px'; });
  function animateRing() { ringX += (mouseX - ringX) * 0.15; ringY += (mouseY - ringY) * 0.15; ring.style.left = ringX + 'px'; ring.style.top = ringY + 'px'; requestAnimationFrame(animateRing); }
  animateRing();
  document.querySelectorAll('a, button, .card, .contact-card, .filter-btn, .carousel-dot, .hero-dot, .objective-card, .governance-card, .timeline-item').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });
  document.addEventListener('mousedown', () => ring.classList.add('click'));
  document.addEventListener('mouseup', () => ring.classList.remove('click'));
}

// SCROLL PROGRESS
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = document.getElementById('progress');
  if (progress && docHeight > 0) progress.style.width = (scrollTop / docHeight) * 100 + '%';
});

// THEME TOGGLE
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('aidi-theme');
if (savedTheme === 'dark' || savedTheme === 'light') document.body.setAttribute('data-theme', savedTheme);
if (themeToggle) {
  const updateThemeToggle = () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
    themeToggle.setAttribute('aria-label', label);
    themeToggle.title = label;
  };
  updateThemeToggle();
  themeToggle.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    localStorage.setItem('aidi-theme', next);
    updateThemeToggle();
    const heroWave = document.querySelector('.hero-wave path');
    if (heroWave) heroWave.setAttribute('fill', next === 'dark' ? '#1A1D1A' : '#FAF8F3');
  });
}

// LIVE CLOCK
function updateClock() {
  const now = new Date();
  const ugandaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
  const h = String(ugandaTime.getHours()).padStart(2, '0');
  const m = String(ugandaTime.getMinutes()).padStart(2, '0');
  const clock = document.getElementById('clock');
  if (clock) clock.textContent = `${h}:${m}`;
}
if (document.getElementById('clock')) {
  updateClock();
  setInterval(updateClock, 30000);
}

// MOBILE MENU
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', () => document.querySelector('nav ul').classList.remove('open'));
});

// STATS MARQUEE AND COUNTERS
const statsTrack = document.querySelector('.stats-track');
const statsGrid = statsTrack && statsTrack.querySelector('.stats-grid');
if (statsTrack && statsGrid) {
  const statsClone = statsGrid.cloneNode(true);
  statsClone.setAttribute('aria-hidden', 'true');
  statsClone.inert = true;
  statsClone.querySelectorAll('[data-count]').forEach(counter => {
    counter.textContent = Number(counter.dataset.count).toLocaleString();
    counter.removeAttribute('data-count');
  });
  statsTrack.appendChild(statsClone);

  const statsViewport = document.querySelector('.stats-viewport');
  if (statsViewport) {
    let dragStartX = 0;
    let startTime = 0;
    let startOffset = 0;
    let dragAnimation = null;

    const wrap = (value, distance) => ((value % distance) + distance) % distance - distance;
    const wrapTime = (value, duration) => ((value % duration) + duration) % duration;

    statsViewport.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;

      const firstGrid = statsTrack.children[0];
      const clonedGrid = statsTrack.children[1];
      const distance = Math.abs(clonedGrid.getBoundingClientRect().left - firstGrid.getBoundingClientRect().left);
      if (!distance) return;

      dragAnimation = statsTrack.getAnimations()[0] || null;
      dragAnimation?.pause();
      dragStartX = event.clientX;
      startTime = Number(dragAnimation?.currentTime) || 0;
      startOffset = 0;
      if (!dragAnimation) {
        const transform = new DOMMatrixReadOnly(getComputedStyle(statsTrack).transform);
        startOffset = transform.m41;
      }
      statsViewport.classList.add('is-dragging');
      statsViewport.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    statsViewport.addEventListener('pointermove', event => {
      if (!statsViewport.hasPointerCapture(event.pointerId)) return;

      const firstGrid = statsTrack.children[0];
      const clonedGrid = statsTrack.children[1];
      const distance = Math.abs(clonedGrid.getBoundingClientRect().left - firstGrid.getBoundingClientRect().left);
      if (!distance) return;

      const delta = event.clientX - dragStartX;
      if (dragAnimation) {
        const duration = Number(dragAnimation.effect?.getTiming().duration);
        if (duration) dragAnimation.currentTime = wrapTime(startTime - delta / distance * duration, duration);
      } else {
        statsTrack.style.transform = `translateX(${wrap(startOffset + delta, distance)}px)`;
      }
    });

    const endStatsDrag = event => {
      if (!statsViewport.hasPointerCapture(event.pointerId)) return;
      statsViewport.releasePointerCapture(event.pointerId);
      statsViewport.classList.remove('is-dragging');
      dragAnimation?.play();
      dragAnimation = null;
    };

    statsViewport.addEventListener('pointerup', endStatsDrag);
    statsViewport.addEventListener('pointercancel', endStatsDrag);
    statsViewport.addEventListener('lostpointercapture', () => {
      statsViewport.classList.remove('is-dragging');
      dragAnimation?.play();
      dragAnimation = null;
    });
  }
}
const statCounters = document.querySelectorAll('.stats-grid .stat-num[data-count]');
if (statCounters.length) {
  const animateStats = entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      statCounters.forEach(counter => {
        if (counter.dataset.animated) return;
        counter.dataset.animated = 'true';
        const target = Number(counter.dataset.count);
        const duration = 1400;
        const startedAt = performance.now();
        const update = now => {
          const progress = Math.min((now - startedAt) / duration, 1);
          counter.textContent = Math.floor(target * progress).toLocaleString();
          if (progress < 1) requestAnimationFrame(update);
          else counter.textContent = target.toLocaleString();
        };
        requestAnimationFrame(update);
      });
      statsCounterObserver.disconnect();
    });
  };
  const statsCounterObserver = new IntersectionObserver(animateStats, { threshold: 0.2 });
  const statsViewport = document.querySelector('.stats-viewport');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    statCounters.forEach(counter => {
      counter.textContent = Number(counter.dataset.count).toLocaleString();
      counter.dataset.animated = 'true';
    });
  } else if (statsViewport) {
    statsCounterObserver.observe(statsViewport);
  }
}

// SCROLL REVEAL + COUNTERS
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.fade-up, .fade-left, .fade-right').forEach(el => observer.observe(el));
document.querySelectorAll('.objective-card, .governance-card, .team-card, .timeline-item, .work-option, .donation-request-panel, .contact-card, .cms-story-card, .location-card, .card').forEach((el, index) => {
  el.classList.add('motion-reveal');
  el.style.setProperty('--motion-delay', `${(index % 4) * 70}ms`);
  observer.observe(el);
});

// FILTER
const objectiveTitles = document.querySelectorAll('.objective-title');
function updateObjectiveTitleRules() {
  objectiveTitles.forEach(title => {
    const range = document.createRange();
    range.selectNodeContents(title);
    const lineWidths = Array.from(range.getClientRects(), rect => rect.width);
    if (lineWidths.length) {
      title.style.setProperty('--objective-rule-width', `${Math.max(...lineWidths)}px`);
    }
  });
}
if (objectiveTitles.length) {
  updateObjectiveTitleRules();
  window.addEventListener('resize', updateObjectiveTitleRules, { passive: true });
  if (document.fonts) document.fonts.ready.then(updateObjectiveTitleRules);
}
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('.objective-card[data-category]').forEach(card => {
      card.style.display = (filter === 'all' || card.dataset.category === filter) ? '' : 'none';
    });
    updateObjectiveTitleRules();
  });
});

// MODAL DATA
const modalData = {
  education: {
    title: 'Education & Family Capacity',
    desc: 'We promote formal and informal educational activities that build families\' skills, including adult literacy, vocational education, and support for school infrastructure. Education is the foundation on which every other form of progress is built.',
    list: ['Adult literacy programmes for community members', 'Vocational education and skills training', 'Support for school infrastructure development', 'Building family capacity through practical skills', 'Promoting both formal and informal learning']
  },
  agriculture: {
    title: 'Climate-Resilient & Sustainable Agriculture',
    desc: 'Farming is the backbone of the economy we serve, and it is under pressure. AIDI promotes climate-resilient and sustainable agriculture, farming that withstands shocks and leaves the land better than it found it.',
    list: ['Household-level food security initiatives', 'Resource recovery and sustainable land management', 'Environmentally sensitive approaches protecting soil, water, and pasture', 'Reversing low yields and weak practices', 'Demonstration-to-scale expansion of climate-smart methods']
  },
  support: {
    title: 'Wholesome Community Support',
    desc: 'Our constitution names social inclusion and human rights among our core objectives. In practice, that means standing with the vulnerable, the displaced, the elderly, women, children, and persons with disabilities, and making sure their concerns are heard.',
    list: ['Psycho-social counselling for community members', 'Community health promotion', 'Human rights defence and advocacy', 'Protection work as a foundation for livelihoods', 'Structured social inclusion programmes']
  },
  economic: {
    title: 'Economic Programmes for Community Livelihoods',
    desc: 'AIDI\'s economic objective is explicit: to promote economic programmes that enhance community livelihoods and enable participation in national development. Support that compounds. Every shilling circulated through a structured local scheme keeps working, member after member, season after season.',
    list: ['Member-run savings and lending schemes: structured, transparent, community-governed', 'Collective bargaining for agricultural inputs and produce', 'Enterprise skills creating income beyond subsistence farming', 'Financial literacy and savings habit development', 'Path toward digital financial tools where they genuinely serve households']
  },
  partnership: {
    title: 'Partnership & Resource Mobilisation',
    desc: 'AIDI was not founded to work alone. Our constitution names partnership with other actors, international donors, and government authorities as a central strategy: cooperating with Local Governments while retaining administrative control over our own funds, personnel, and assets.',
    list: ['Cooperation with Government and Local Government Authorities', 'Partnership with international donors and development actors', 'Locally-led development: not a local partner hired to implement someone else\'s design', 'Accountability running downward to the members we serve', 'Contribution to the wider movement toward localisation']
  },
  environment: {
    title: 'Environmental Protection',
    desc: 'Healthy land, water, and ecosystems are essential to community wellbeing and lasting livelihoods. AIDI promotes practical community action to care for and protect the environment.',
    list: ['Promoting responsible use of natural resources', 'Protecting soil, water, and local ecosystems', 'Encouraging tree growing and sustainable land care', 'Building awareness of environmental protection', 'Connecting environmental care with climate-resilient livelihoods']
  }
};

function openModal(key) {
  const data = modalData[key];
  const modal = document.getElementById('modal');
  if (!data || !modal) return;
  document.getElementById('modalTitle').textContent = data.title;
  document.getElementById('modalDesc').textContent = data.desc;
  document.getElementById('modalList').innerHTML = data.list.map(item => `<li>${item}</li>`).join('');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) modal.classList.remove('show');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// TESTIMONIAL CAROUSEL
let currentSlide = 0;
const slides = document.querySelectorAll('.testimonial-slide');
const carouselDots = document.querySelectorAll('.carousel-dot');
const testimonialTrack = document.querySelector('.testimonial-track');
const testimonialsCarousel = document.querySelector('.carousel');
let testimonialInterval;
function goToSlide(n) {
  if (!slides.length || !testimonialTrack) return;
  currentSlide = (n + slides.length) % slides.length;
  testimonialTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
  carouselDots.forEach((dot, index) => {
    const active = index === currentSlide;
    dot.classList.toggle('active', active);
    if (active) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
  });
}
function startTestimonialRotation() {
  clearInterval(testimonialInterval);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  testimonialInterval = setInterval(() => goToSlide(currentSlide + 1), 7000);
}
if (slides.length && carouselDots.length && testimonialTrack && testimonialsCarousel) {
  carouselDots.forEach(dot => dot.addEventListener('click', () => {
    goToSlide(Number(dot.dataset.slide));
    startTestimonialRotation();
  }));
  let voicePointerId = null;
  let voiceStartX = 0;
  let voiceDeltaX = 0;
  testimonialsCarousel.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('button')) return;
    voicePointerId = event.pointerId;
    voiceStartX = event.clientX;
    voiceDeltaX = 0;
    testimonialsCarousel.setPointerCapture(event.pointerId);
    testimonialsCarousel.classList.add('is-dragging');
    clearInterval(testimonialInterval);
  });
  testimonialsCarousel.addEventListener('pointermove', event => {
    if (event.pointerId !== voicePointerId) return;
    voiceDeltaX = event.clientX - voiceStartX;
    testimonialTrack.style.transform = `translateX(calc(-${currentSlide * 100}% + ${voiceDeltaX}px))`;
  });
  const endVoiceDrag = event => {
    if (event.pointerId !== voicePointerId) return;
    const threshold = Math.max(40, testimonialsCarousel.clientWidth * 0.12);
    if (Math.abs(voiceDeltaX) >= threshold) {
      goToSlide(currentSlide + (voiceDeltaX < 0 ? 1 : -1));
    } else {
      goToSlide(currentSlide);
    }
    voicePointerId = null;
    voiceDeltaX = 0;
    testimonialsCarousel.classList.remove('is-dragging');
    if (testimonialsCarousel.hasPointerCapture(event.pointerId)) {
      testimonialsCarousel.releasePointerCapture(event.pointerId);
    }
    startTestimonialRotation();
  };
  testimonialsCarousel.addEventListener('pointerup', endVoiceDrag);
  testimonialsCarousel.addEventListener('pointercancel', endVoiceDrag);
  testimonialsCarousel.addEventListener('mouseenter', () => clearInterval(testimonialInterval));
  testimonialsCarousel.addEventListener('mouseleave', startTestimonialRotation);
  testimonialsCarousel.addEventListener('focusin', () => clearInterval(testimonialInterval));
  testimonialsCarousel.addEventListener('focusout', event => {
    if (!testimonialsCarousel.contains(event.relatedTarget)) startTestimonialRotation();
  });
  startTestimonialRotation();
}

// DONATION INFORMATION REQUEST
function toggleDonationRequest() {
  const form = document.getElementById('donationRequestForm');
  const toggle = document.querySelector('.donation-request-toggle');
  if (!form || !toggle) return;
  const opening = form.hidden;
  form.hidden = !opening;
  toggle.setAttribute('aria-expanded', String(opening));
  toggle.textContent = opening ? 'Close request form' : 'Request donation information';
  if (opening) {
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    form.querySelector('#donationName').focus({ preventScroll: true });
  }
}
async function submitDonationRequest(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const fields = new FormData(form);
  const name = String(fields.get('name') || '').trim();
  const email = String(fields.get('email') || '').trim();
  const message = String(fields.get('message') || '').trim();
  const status = document.getElementById('donationRequestStatus');
  const button = form.querySelector('button[type="submit"]');
  if (!window.AIDICMS?.client) {
    status.textContent = 'The online request inbox is not connected yet. Please email info@aidiuganda.com directly.';
    return;
  }
  button.disabled = true;
  status.textContent = 'Sending your request…';
  try {
    const { error } = await window.AIDICMS.client.from('donation_requests').insert({ name, email, message });
    if (error) throw error;
    status.textContent = 'Thank you. Your donation information request has been sent to AIDI.';
    form.reset();
  } catch (error) {
    console.error('Donation information request failed:', error);
    status.textContent = 'We could not send your request. Please try again or email info@aidiuganda.com.';
  } finally {
    button.disabled = false;
  }
}
if (window.location.hash === '#donationRequestForm') toggleDonationRequest();

// CONTACT FORM
async function submitForm(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const name = form.querySelector('#name').value.trim();
  const email = form.querySelector('#email').value.trim();
  const message = form.querySelector('#message').value.trim();
  const notice = document.getElementById('formSuccess');
  const button = form.querySelector('button[type="submit"]');
  if (!window.AIDICMS?.client) {
    notice.textContent = 'The online message inbox is not connected yet. Please email info@aidiuganda.com directly.';
    notice.classList.add('show');
    return;
  }
  button.disabled = true;
  notice.textContent = 'Sending your message…';
  notice.classList.add('show');
  try {
    const { error } = await window.AIDICMS.client.from('contact_messages').insert({ name, email, message });
    if (error) throw error;
    notice.textContent = 'Thank you. Your message has been sent to AIDI.';
    form.reset();
  } catch (error) {
    console.error('Contact message submission failed:', error);
    notice.textContent = 'We could not send your message. Please try again or email info@aidiuganda.com.';
  } finally {
    button.disabled = false;
  }
}

// NEWSLETTER
function subscribe(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const email = form.querySelector('input[name="email"]').value.trim();
  const honeypot = form.querySelector('input[name="website"]').value;
  const msg = document.getElementById('newsletterMsg');
  const endpoint = window.AIDI_NEWSLETTER_ENDPOINT || '';
  if (honeypot) return;
  if (!endpoint) {
    msg.textContent = 'Newsletter sign-up is not connected yet. Please email info@aidiuganda.com to join the mailing list.';
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  msg.textContent = 'Submitting your email...';
  fetch(endpoint, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ email, website: honeypot })
  }).then(() => {
    msg.textContent = 'Thank you. Your email has been submitted for AIDI updates.';
    form.reset();
  }).catch(error => {
    console.error('Newsletter sign-up failed:', error);
    msg.textContent = 'We could not submit your email. Please try again or email info@aidiuganda.com.';
  }).finally(() => {
    button.disabled = false;
  });
}

// CONFETTI
function celebrate(e) {
  const link = e && e.target && e.target.closest('a');
  if (link && link.getAttribute('href') === '#donate') e.preventDefault();
  const colors = ['#F58220', '#4CAF50', '#FFC107', '#2E7D32', '#8BC34A'];
  for (let i = 0; i < 60; i++) {
    setTimeout(() => {
      const conf = document.createElement('div');
      conf.className = 'confetti';
      conf.style.left = Math.random() * 100 + 'vw';
      conf.style.top = '-10px';
      conf.style.background = colors[Math.floor(Math.random() * colors.length)];
      conf.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      conf.style.width = (Math.random() * 8 + 6) + 'px';
      conf.style.height = conf.style.width;
      conf.style.animationDuration = (Math.random() * 2 + 2) + 's';
      document.body.appendChild(conf);
      setTimeout(() => conf.remove(), 4000);
    }, i * 20);
  }
  const donateSection = document.getElementById('donate');
  if (donateSection && e && e.target && e.target.closest('a[href="#donate"]')) {
    setTimeout(() => donateSection.scrollIntoView({ behavior: 'smooth' }), 100);
  }
}

// HEADER SHADOW
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (window.scrollY > 50) header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
  else header.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
});

// SMOOTH SCROLL
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

console.log('%cAIDI Uganda: Website v5.0', 'color:#F58220;font-size:20px;font-weight:bold;');
console.log('%cEmpowering Communities, Growing Futures', 'color:#4CAF50;font-size:14px;');
console.log('%c"We don\'t just serve communities. We grow with them."', 'color:#FFC107;font-size:12px;font-style:italic;');
