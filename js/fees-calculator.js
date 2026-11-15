/* ── INTERACTIVE SHOOT BUDGET SCRUBBER (#fees) & SPECULAR GLOW ── */
    (function () {
      const pillsWrap = document.getElementById('ctCalcPills');
      const savedEl = document.getElementById('ctCalcSaved');
      const fmtUSD = n => '$' + Math.round(n).toLocaleString('en-US');
      let curBudget = 5000;
      let animRaf = 0;
      function applyBudgetValues(v) {
        document.querySelectorAll('[data-calc-budget]').forEach(el => {
          el.textContent = fmtUSD(v);
        });
        document.querySelectorAll('[data-calc-toll="up"]').forEach(el => {
          el.textContent = '-' + fmtUSD(v * 0.20);
        });
        document.querySelectorAll('[data-calc-toll="ag"]').forEach(el => {
          el.textContent = '-' + fmtUSD(v * 0.25);
        });
        document.querySelectorAll('[data-calc-keep="nx"]').forEach(el => {
          el.textContent = fmtUSD(v);
        });
        if (savedEl) {
          savedEl.textContent = '+' + fmtUSD(v * 0.25);
        }
      }
      function animateToBudget(nextBudget) {
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (animRaf) cancelAnimationFrame(animRaf);
        if (reduceMotion || !window.anime || typeof window.anime.animate !== 'function') {
          curBudget = nextBudget;
          applyBudgetValues(nextBudget);
          return;
        }

        const budgetObj = { val: curBudget };
        window.anime.animate(budgetObj, {
          val: nextBudget,
          duration: 380,
          ease: 'out(1.675)',
          onUpdate: () => {
            curBudget = budgetObj.val;
            applyBudgetValues(curBudget);
          },
          onComplete: () => {
            curBudget = nextBudget;
            applyBudgetValues(nextBudget);
          }
        });

        if (savedEl) {
          window.anime.animate(savedEl, {
            scale: [1.08, 1],
            duration: 320,
            ease: 'out(1.675)',
            onComplete: (a) => {
              if (window.anime && typeof window.anime.cleanInlineStyles === 'function') {
                try { window.anime.cleanInlineStyles(a); } catch (_) {}
              }
              savedEl.style.transform = '';
            }
          });
        }
      }
      if (pillsWrap) {
        pillsWrap.querySelectorAll('.ct-calc-pill').forEach(btn => {
          btn.addEventListener('click', () => {
            const next = parseInt(btn.dataset.budget || '5000', 10);
            pillsWrap.querySelectorAll('.ct-calc-pill').forEach(b => b.classList.toggle('is-active', b === btn));
            animateToBudget(next);
          });
        });
        applyBudgetValues(5000);
      }
      /* Subtle cursor-reactive specular sheen on Royal Cobalt Nexus Card & Slate Obsidian Banner */
      if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
        document.querySelectorAll('#fees .ct-card.is-hero, #founding .nx-found-banner').forEach(surface => {
          surface.addEventListener('mousemove', (e) => {
            const r = surface.getBoundingClientRect();
            const mx = ((e.clientX - r.left) / Math.max(1, r.width)) * 100;
            const my = ((e.clientY - r.top) / Math.max(1, r.height)) * 100;
            surface.style.setProperty('--mx', mx.toFixed(1) + '%');
            surface.style.setProperty('--my', my.toFixed(1) + '%');
          }, { passive: true });
        });
      }
    })();
