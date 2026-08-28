(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const html = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;

  // Theme: local, immediate, no flash on next visit.
  const savedTheme = localStorage.getItem('nala-theme');
  if (savedTheme) html.dataset.theme = savedTheme;
  $('#themeButton')?.addEventListener('click', () => {
    html.dataset.theme = html.dataset.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('nala-theme', html.dataset.theme);
  });

  // Header + reading progress use one passive scroll listener and one RAF.
  const navWrap = $('.nav-wrap');
  const scrollLine = $('#scrollLine');
  let scrollTick = false;
  const renderScroll = () => {
    const y = scrollY;
    navWrap?.classList.toggle('scrolled', y > 10);
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollLine.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    scrollTick = false;
  };
  addEventListener('scroll', () => { if (!scrollTick) { scrollTick = true; requestAnimationFrame(renderScroll); } }, { passive: true });
  renderScroll();

  // Mobile menu.
  const menuButton = $('#menuButton');
  const navLinks = $('#navLinks');
  menuButton?.addEventListener('click', () => {
    const open = !navLinks.classList.contains('open');
    navLinks.classList.toggle('open', open);
    menuButton.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
  });
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open'); menuButton?.classList.remove('open'); menuButton?.setAttribute('aria-expanded', 'false');
  }));

  // One-shot reveals; elements are unobserved once visible.
  if (!reduceMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        if (entry.target.id === 'dashboardCard') entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      });
    }, { threshold: .14, rootMargin: '0px 0px -5% 0px' });
    $$('.reveal').forEach(el => observer.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('visible'));
    $('#dashboardCard')?.classList.add('in-view');
  }

  // Phone preview: switch real screenshots instead of looping animation.
  const heroScreen = $('#heroScreen');
  const screenMap = {
    home: ['assets/screen-home.webp', 'NALA Home screen'],
    money: ['assets/screen-money.webp', 'NALA Money screen'],
    plan: ['assets/screen-plan.webp', 'NALA Plan screen']
  };
  $$('.screen-switch button').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.screen;
    if (!screenMap[key] || !heroScreen) return;
    $$('.screen-switch button').forEach(b => b.classList.toggle('active', b === button));
    heroScreen.animate([{ opacity: .2, transform: 'scale(.985)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' });
    heroScreen.src = screenMap[key][0]; heroScreen.alt = screenMap[key][1];
  }));

  // Very light pointer-depth effect: desktop only, one RAF, transforms only.
  if (!coarse && !reduceMotion) {
    const stage = $('#phoneStage');
    const devices = $$('[data-device-depth]');
    let targetX = 0, targetY = 0, frame = 0;
    stage?.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      targetX = (e.clientX - r.left) / r.width - .5;
      targetY = (e.clientY - r.top) / r.height - .5;
      if (!frame) frame = requestAnimationFrame(() => {
        devices.forEach(d => {
          const depth = Number(d.dataset.deviceDepth || .3);
          d.style.setProperty('--px', `${targetX * depth * 12}px`);
          d.style.setProperty('--py', `${targetY * depth * 9}px`);
          // CSS positions are preserved by modifying child shell, not device base transform.
          const shell = $('.device-shell', d);
          if (shell) shell.style.transform = `translate3d(${targetX * depth * 10}px,${targetY * depth * 8}px,0) rotateX(${-targetY * depth * 2}deg) rotateY(${targetX * depth * 3}deg)`;
        });
        frame = 0;
      });
    }, { passive: true });
    stage?.addEventListener('pointerleave', () => devices.forEach(d => { const shell = $('.device-shell', d); if (shell) shell.style.transform = ''; }));
  }

  // Card tilt: restrained, transform-only, desktop only.
  if (!coarse && !reduceMotion) {
    $$('.interactive-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(800px) rotateX(${-y * 2.2}deg) rotateY(${x * 2.2}deg) translateY(-2px)`;
      }, { passive: true });
      card.addEventListener('pointerleave', () => card.style.transform = '');
    });
  }

  // Spotlight cards: CSS variable only.
  if (!coarse) {
    $$('.spotlight').forEach(card => card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--sx', `${e.clientX-r.left}px`);
      card.style.setProperty('--sy', `${e.clientY-r.top}px`);
    }, { passive: true }));
  }

  // Magnetic buttons: tiny movement only.
  if (!coarse && !reduceMotion) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX-r.left-r.width/2)*.06}px,${(e.clientY-r.top-r.height/2)*.06}px)`;
      });
      el.addEventListener('pointerleave', () => el.style.transform = '');
    });
  }

  // NALA Brain illustrative calculator.
  const purchase = $('#purchase');
  const purchaseRange = $('#purchaseRange');
  const result = $('#brainResult');
  const safe = 800, days = 4;
  const updateBrain = value => {
    const amount = Math.max(0, Number(value) || 0);
    if (purchase) purchase.value = String(amount);
    if (purchaseRange && amount <= Number(purchaseRange.max)) purchaseRange.value = String(amount);
    const left = safe - amount;
    const daily = Math.max(0, Math.floor(left / days));
    const strong = $('strong', result); const para = $('p', result); const icon = $('.result-icon', result);
    if (left >= 400) {
      strong.textContent = 'This fits your current plan.'; icon.textContent='✓';
      para.innerHTML = `You would have <b>R${left.toLocaleString()}</b> left, or about <b>R${daily}/day</b> for the next ${days} days.`;
      result.style.borderColor='';
    } else if (left >= 0) {
      strong.textContent = 'You can, but it tightens the month.'; icon.textContent='!';
      para.innerHTML = `You would have <b>R${left.toLocaleString()}</b> left — about <b>R${daily}/day</b>. Consider whether it can wait.`;
      result.style.borderColor='rgba(255,159,90,.35)';
    } else {
      strong.textContent = 'This is outside your Safe to Spend.'; icon.textContent='×';
      para.innerHTML = `It is <b>R${Math.abs(left).toLocaleString()}</b> above the current safe amount. Protect tomorrow first.`;
      result.style.borderColor='rgba(239,95,104,.42)';
    }
  };
  purchase?.addEventListener('input', e => updateBrain(e.target.value));
  purchaseRange?.addEventListener('input', e => updateBrain(e.target.value));

  // Mode tabs.
  const modes = {
    adult:{k:'Adult mode',t:'Full clarity without the complexity.',d:'Safe to Spend, debt, bills, goals, budgets, money history, NALA Brain and personal planning.',l:['Safe to Spend','Debt & bills','Goals','NALA Brain']},
    family:{k:'Family mode',t:'One clearer household plan.',d:'Plan household costs together while keeping everyday money easy to understand.',l:['Shared plans','School & home','Family goals','Contributions']},
    teen:{k:'Teen mode',t:'Build the habit before the pressure.',d:'Allowance, income, limits and goals without heavy adult finance terminology.',l:['Allowance','Limits','Saving goals','Money lessons']},
    kids:{k:'Kids mode',t:'Money skills that feel like progress.',d:'Pocket money, save jars, missions and rewards make saving visual and fun.',l:['Pocket money','Save jars','Missions','Rewards']}
  };
  $$('.mode-tabs button').forEach(btn => btn.addEventListener('click', () => {
    const m=modes[btn.dataset.mode]; if(!m)return;
    $$('.mode-tabs button').forEach(b=>b.classList.toggle('active',b===btn));
    $('#modeKicker').textContent=m.k; $('#modeTitle').textContent=m.t; $('#modeText').textContent=m.d;
    $('#modeList').innerHTML=m.l.map(x=>`<span>${x}</span>`).join('');
    $('.mode-panel').animate([{opacity:.5,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.22,1,.36,1)'});
  }));

  // Toast for not-yet-live stores.
  const toast = $('#toast'); let toastTimer;
  $$('[data-toast]').forEach(el => el.addEventListener('click', () => {
    toast.textContent = el.dataset.toast; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('show'),2600);
  }));

  // Performance-conscious galaxy: capped DPR, low particle count, ~30 FPS, paused when hidden.
  const canvas = $('#space');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d', { alpha:true });
    let stars=[], w=0,h=0,dpr=1,last=0,running=true;
    const resize=()=>{
      dpr=Math.min(devicePixelRatio||1,1.5); w=innerWidth; h=innerHeight; canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
      const count = w<600?34:w<1000?52:76;
      stars=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,r:.35+Math.random()*1.05,a:.12+Math.random()*.5,s:.001+Math.random()*.002,p:Math.random()*Math.PI*2}));
    };
    const draw=t=>{
      if(!running)return; requestAnimationFrame(draw); if(t-last<32)return; last=t; ctx.clearRect(0,0,w,h);
      const dark=html.dataset.theme!=='light';
      const g=ctx.createRadialGradient(w*.72,h*.15,0,w*.72,h*.15,Math.min(w,h)*.75);g.addColorStop(0,dark?'rgba(105,72,255,.10)':'rgba(105,72,255,.055)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
      stars.forEach(st=>{const a=st.a*(.72+.28*Math.sin(t*st.s+st.p));ctx.beginPath();ctx.arc(st.x,st.y,st.r,0,Math.PI*2);ctx.fillStyle=dark?`rgba(205,200,255,${a})`:`rgba(91,68,160,${a*.4})`;ctx.fill()});
    };
    document.addEventListener('visibilitychange',()=>{running=!document.hidden;if(running){last=0;requestAnimationFrame(draw)}});
    addEventListener('resize',resize,{passive:true}); resize(); requestAnimationFrame(draw);
  }
})();
