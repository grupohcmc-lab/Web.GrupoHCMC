/* =========================================================
   Grupo HCMC — script.js
   Depende de: data.js (HCMC_CONFIG) e intl-tel-input
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    const CONFIG = (typeof HCMC_CONFIG !== 'undefined') ? HCMC_CONFIG : {};

    /* ---------- Logging condicional (solo en desarrollo) ---------- */
    const IS_DEV = location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1' ||
        location.protocol === 'file:';

    function logError(...args) {
        if (IS_DEV) console.error(...args);
    }

    /* ---------- Año ---------- */
    document.querySelectorAll('[data-year]').forEach(el => {
        el.textContent = new Date().getFullYear();
    });

    /* ---------- Header compacto + barra de progreso ---------- */
    const header = document.querySelector('.site-header');
    const progressBar = document.getElementById('scroll-progress-bar');
    let ticking = false;

    function onScroll() {
        const y = window.scrollY || window.pageYOffset;
        document.body.classList.toggle('scrolled', y > 20);
        if (progressBar) {
            const docH = document.documentElement.scrollHeight - window.innerHeight;
            const pct = docH > 0 ? Math.min(100, (y / docH) * 100) : 0;
            progressBar.style.width = pct + '%';
        }
        const toTop = document.getElementById('to-top');
        if (toTop) toTop.classList.toggle('show', y > 400);
    }
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => { onScroll(); ticking = false; });
            ticking = true;
        }
    }, { passive: true });
    onScroll();

    /* ---------- Volver arriba ---------- */
    const toTop = document.getElementById('to-top');
    if (toTop) toTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    /* ---------- Menú móvil ---------- */
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            const open = navLinks.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                navLinks.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /* ---------- Nav activo según scroll ---------- */
    const menuItems = Array.from(document.querySelectorAll('.nav-links a[data-page]'));
    const targets = menuItems.map(a => {
        const id = a.getAttribute('href').replace('#', '');
        return { link: a, section: document.getElementById(id) };
    }).filter(t => t.section);

    function setActiveLink(activeLink) {
        menuItems.forEach(a => a.classList.toggle('active', a === activeLink));
    }

    function updateActiveOnScroll() {
        if (!targets.length) return;
        const headerH = header ? header.offsetHeight : 0;
        const ref = headerH + 40;
        const scrollY = window.scrollY || window.pageYOffset;
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollY >= docH - 2) {
            setActiveLink(targets[targets.length - 1].link);
            return;
        }
        let active = targets[0].link;
        for (const t of targets) {
            if (t.section.getBoundingClientRect().top <= ref) active = t.link;
            else break;
        }
        setActiveLink(active);
    }
    window.addEventListener('scroll', updateActiveOnScroll, { passive: true });
    window.addEventListener('resize', updateActiveOnScroll);
    updateActiveOnScroll();

    menuItems.forEach(link => {
        link.addEventListener('click', (e) => {
            const id = link.getAttribute('href').replace('#', '');
            const section = document.getElementById(id);
            if (!section) return;
            e.preventDefault();
            setActiveLink(link);
            const headerH = header ? header.offsetHeight : 0;
            const top = section.getBoundingClientRect().top + window.scrollY - headerH - 12;
            window.scrollTo({ top, behavior: 'smooth' });
            if (history.replaceState) history.replaceState(null, '', '#' + id);
        });
    });

    /* ---------- Reveal ---------- */
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        revealEls.forEach(el => io.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('in'));
    }

    /* ---------- Carruseles ---------- */
    document.querySelectorAll('[data-carousel]').forEach(carousel => {
        const track = carousel.querySelector('.carousel-track');
        const prevBtn = carousel.querySelector('[data-carousel-prev]');
        const nextBtn = carousel.querySelector('[data-carousel-next]');
        const dotsWrap = carousel.querySelector('[data-carousel-dots]');
        if (!track) return;

        const items = Array.from(track.children);
        if (!items.length) return;

        if (dotsWrap) {
            dotsWrap.innerHTML = '';
            items.forEach((_, i) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.setAttribute('aria-label', 'Ir a la tarjeta ' + (i + 1));
                b.addEventListener('click', () => goTo(i));
                dotsWrap.appendChild(b);
            });
        }
        const dots = dotsWrap ? Array.from(dotsWrap.children) : [];

        function goTo(i) {
            i = Math.max(0, Math.min(i, items.length - 1));
            items[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
        }

        function currentIndex() {
            const trackLeft = track.getBoundingClientRect().left;
            let best = 0, bestDist = Infinity;
            items.forEach((it, i) => {
                const d = Math.abs(it.getBoundingClientRect().left - trackLeft);
                if (d < bestDist) { bestDist = d; best = i; }
            });
            return best;
        }

        function updateUI() {
            const maxScroll = track.scrollWidth - track.clientWidth;
            if (prevBtn) prevBtn.disabled = track.scrollLeft <= 2;
            if (nextBtn) nextBtn.disabled = track.scrollLeft >= maxScroll - 2;

            const idx = currentIndex();
            const firstW = items[0].getBoundingClientRect().width;
            const perView = Math.max(1, Math.floor(track.clientWidth / (firstW + 16)));
            const maxDot = Math.max(0, items.length - perView);

            dots.forEach((d, i) => {
                d.style.display = i > maxDot ? 'none' : '';
                d.classList.toggle('active', i === Math.min(idx, maxDot));
            });
        }

        if (prevBtn) prevBtn.addEventListener('click', () => goTo(currentIndex() - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => goTo(currentIndex() + 1));

        let tick = false;
        track.addEventListener('scroll', () => {
            if (!tick) {
                requestAnimationFrame(() => { updateUI(); tick = false; });
                tick = true;
            }
        }, { passive: true });

        window.addEventListener('resize', updateUI);

        track.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
            const maxScroll = track.scrollWidth - track.clientWidth;
            if (maxScroll <= 0) return;
            const atStart = track.scrollLeft <= 0 && e.deltaY < 0;
            const atEnd = track.scrollLeft >= maxScroll - 1 && e.deltaY > 0;
            if (atStart || atEnd) return;
            e.preventDefault();
            track.scrollLeft += e.deltaY;
        }, { passive: false });

        track.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') { e.preventDefault(); goTo(currentIndex() + 1); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(currentIndex() - 1); }
        });

        updateUI();
    });

    /* ---------- Modales ---------- */
    const modals = document.querySelectorAll('.modal');
    function openModal(id) {
        const m = document.getElementById(id);
        if (!m) return;
        m.classList.add('open');
        document.body.style.overflow = 'hidden';
        const closeBtn = m.querySelector('[data-modal-close]');
        if (closeBtn) closeBtn.focus({ preventScroll: true });
    }
    function closeModal(m) {
        m.classList.remove('open');
        document.body.style.overflow = '';
    }
    document.querySelectorAll('[data-modal-open]').forEach(btn => {
        btn.addEventListener('click', () => openModal(btn.dataset.modalOpen));
    });
    modals.forEach(m => {
        m.addEventListener('click', (e) => { if (e.target === m) closeModal(m); });
        m.querySelectorAll('[data-modal-close]').forEach(b => {
            b.addEventListener('click', () => closeModal(m));
        });
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') document.querySelectorAll('.modal.open').forEach(closeModal);
    });

    /* ---------- Selector de país para teléfono (intl-tel-input) ---------- */
    const telInput = document.getElementById('telefono');
    let iti = null;

    if (telInput && typeof window.intlTelInput === 'function') {
        iti = window.intlTelInput(telInput, {
            initialCountry: 'cr',
            preferredCountries: ['cr', 'us', 'es', 'mx', 'pa', 'ni'],
            separateDialCode: true,
            utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.0/build/js/utils.js'
        });
    }

    /* ---------- Servicio preseleccionado ---------- */
    const form = document.querySelector('#contact-form');
    const servicioInput = document.getElementById('servicio');
    const serviceChip = document.getElementById('service-chip');
    const serviceName = document.getElementById('service-name');
    const serviceClear = document.getElementById('service-clear');

    function setService(name) {
        if (!servicioInput) return;
        servicioInput.value = name;
        if (serviceName) serviceName.textContent = name;
        if (serviceChip) serviceChip.classList.add('show');
    }
    function clearService() {
        if (!servicioInput) return;
        servicioInput.value = '';
        if (serviceChip) serviceChip.classList.remove('show');
    }

    document.querySelectorAll('[data-service]').forEach(btn => {
        btn.addEventListener('click', () => {
            setService(btn.dataset.service);
            if (form) {
                const headerH = header ? header.offsetHeight : 0;
                const top = form.getBoundingClientRect().top + window.scrollY - headerH - 20;
                window.scrollTo({ top, behavior: 'smooth' });
                setTimeout(() => {
                    const first = document.getElementById('nombre');
                    if (first) first.focus({ preventScroll: true });
                }, 500);
            }
        });
    });

    document.querySelectorAll('[data-service-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            setService(btn.dataset.serviceModal);
            setTimeout(() => {
                if (form) {
                    const headerH = header ? header.offsetHeight : 0;
                    const top = form.getBoundingClientRect().top + window.scrollY - headerH - 20;
                    window.scrollTo({ top, behavior: 'smooth' });
                    const first = document.getElementById('nombre');
                    if (first) setTimeout(() => first.focus({ preventScroll: true }), 400);
                }
            }, 100);
        });
    });

    if (serviceClear) serviceClear.addEventListener('click', clearService);

    /* ---------- Envío del formulario (Apps Script) ---------- */
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const msg = form.querySelector('.form-msg');
            const submitBtn = form.querySelector('button[type="submit"]');
            const label = submitBtn.querySelector('.btn-label');
            const originalText = label ? label.textContent : submitBtn.textContent;

            const emailInput = document.getElementById('email');

            // Validación: al menos correo o teléfono
            emailInput.setCustomValidity('');

            const hasEmail = emailInput.value.trim() !== '';
            const hasTel = telInput.value.trim() !== '';

            if (!hasEmail && !hasTel) {
                emailInput.setCustomValidity('Debes ingresar al menos un correo o un teléfono.');
                emailInput.reportValidity();
                return;
            }

            // Validación nativa (nombre, formato de correo, mensaje)
            if (!form.reportValidity()) return;

            // Verificar que la URL del Apps Script esté configurada
            if (!CONFIG.appsScriptUrl || CONFIG.appsScriptUrl.includes('TU_URL')) {
                msg.textContent = 'El formulario aún no está conectado. Escríbenos a ' + (CONFIG.contactEmail || 'informacion@grupohcmc.com') + '.';
                msg.style.background = 'rgba(255,176,32,.15)';
                msg.style.color = '#A36A00';
                msg.classList.add('show');
                return;
            }

            // Preparar payload (teléfono con código de país si el plugin está activo)
            const telefonoCompleto = (iti && hasTel) ? iti.getNumber() : telInput.value.trim();

            const payload = {
                nombre: document.getElementById('nombre').value.trim(),
                email: emailInput.value.trim(),
                telefono: telefonoCompleto,
                servicio: document.getElementById('servicio').value || 'Consulta general',
                mensaje: document.getElementById('mensaje').value.trim()
            };

            // UI de carga
            submitBtn.disabled = true;
            if (label) {
                label.textContent = 'Enviando...';
                const spinner = document.createElement('span');
                spinner.className = 'btn-spinner';
                spinner.setAttribute('aria-hidden', 'true');
                submitBtn.insertBefore(spinner, label);
            }

            try {
                const res = await fetch(CONFIG.appsScriptUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (data.success) {
                    msg.textContent = '¡Gracias por tu mensaje! Te contactaremos pronto.';
                    msg.style.background = 'rgba(0,184,169,.12)';
                    msg.style.color = 'var(--teal-dark)';
                    msg.classList.add('show');
                    form.reset();
                    if (iti) iti.setNumber('');
                    clearService();
                } else {
                    throw new Error(data.error || 'Error desconocido');
                }
            } catch (err) {
                msg.textContent = 'No se pudo enviar el mensaje. Inténtalo de nuevo o escríbenos a ' + (CONFIG.contactEmail || 'informacion@grupohcmc.com') + '.';
                msg.style.background = 'rgba(255,60,60,.12)';
                msg.style.color = '#c0392b';
                msg.classList.add('show');
                logError('Error al enviar:', err);
            } finally {
                submitBtn.disabled = false;
                if (label) {
                    label.textContent = originalText;
                    const spinner = submitBtn.querySelector('.btn-spinner');
                    if (spinner) spinner.remove();
                }
            }
        });
    }

    /* ---------- Canvas del hero ---------- */
    const canvas = document.querySelector('.hero canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let w, h, nodes, rafId, visible = true;
        const NODE_COUNT = window.innerWidth < 720 ? 22 : 50;

        function resize() {
            w = canvas.width = canvas.offsetWidth * devicePixelRatio;
            h = canvas.height = canvas.offsetHeight * devicePixelRatio;
        }
        function initNodes() {
            nodes = Array.from({ length: NODE_COUNT }, () => ({
                x: Math.random() * w, y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.25 * devicePixelRatio,
                vy: (Math.random() - 0.5) * 0.25 * devicePixelRatio,
            }));
        }
        function draw() {
            if (!visible) { rafId = null; return; }
            ctx.clearRect(0, 0, w, h);
            const maxDist = 160 * devicePixelRatio;
            for (const n of nodes) {
                if (!prefersReduced) {
                    n.x += n.vx; n.y += n.vy;
                    if (n.x < 0 || n.x > w) n.vx *= -1;
                    if (n.y < 0 || n.y > h) n.vy *= -1;
                }
            }
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const a = nodes[i], b = nodes[j];
                    const dx = a.x - b.x, dy = a.y - b.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < maxDist) {
                        ctx.strokeStyle = `rgba(0,184,169,${(1 - d / maxDist) * 0.35})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
            for (const n of nodes) {
                ctx.fillStyle = 'rgba(0,184,169,0.85)';
                ctx.beginPath();
                ctx.arc(n.x, n.y, 1.8 * devicePixelRatio, 0, Math.PI * 2);
                ctx.fill();
            }
            rafId = requestAnimationFrame(draw);
        }
        function start() { if (!rafId) rafId = requestAnimationFrame(draw); }

        // Si el usuario prefiere movimiento reducido, dibujamos una vez y no animamos
        resize(); initNodes();
        if (prefersReduced) {
            // Dibujo estático: no se llama a requestAnimationFrame
            ctx.clearRect(0, 0, w, h);
            const maxDist = 160 * devicePixelRatio;
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const a = nodes[i], b = nodes[j];
                    const dx = a.x - b.x, dy = a.y - b.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < maxDist) {
                        ctx.strokeStyle = `rgba(0,184,169,${(1 - d / maxDist) * 0.35})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
            for (const n of nodes) {
                ctx.fillStyle = 'rgba(0,184,169,0.85)';
                ctx.beginPath();
                ctx.arc(n.x, n.y, 1.8 * devicePixelRatio, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            start();
            window.addEventListener('resize', () => { resize(); initNodes(); });
            if ('IntersectionObserver' in window) {
                new IntersectionObserver((entries) => {
                    entries.forEach(en => {
                        visible = en.isIntersecting;
                        if (visible) start();
                    });
                }, { threshold: 0 }).observe(canvas);
            }
        }
    }

});