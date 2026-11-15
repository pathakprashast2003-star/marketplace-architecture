(function initMotionAdvancedHow() {
  const pipelineScenarios = [
        {
          id: 'blipMarcus',
          name: 'Marcus Vance',
          city: 'Austin',
          craft: 'Commercial DP',
          rate: '$650/day',
          radarStatus: 'Marcus · DP · Austin',
          client: 'Need a DP with an Alexa 35 for a 2-day brand shoot in Austin. Budget $2,500.',
          sender: 'Marcus · Commercial DP',
          text: 'Available both days. ARRI package and Cooke lenses ready. Sending my reel now.',
          budget: 2500,
          trust: 'Reel and credits reviewed'
        },
        {
          id: 'blipClara',
          name: 'Clara Moreau',
          city: 'London',
          craft: 'Commercial DP',
          rate: '$780/day',
          radarStatus: 'Clara · DP · London',
          client: 'Looking for a DP in London for a 1-day product film. Budget $1,000.',
          sender: 'Clara · Commercial DP',
          text: 'Free next Thursday. I can bring a Sony VENICE kit. Want to hop on a call?',
          budget: 1000,
          trust: 'Portfolio reviewed'
        },
        {
          id: 'blipMaya',
          name: 'Maya Lin',
          city: 'Denver',
          craft: 'FPV & Drone',
          rate: '$580/day',
          radarStatus: 'Maya · FPV · Denver',
          client: 'Need an FPV pilot for a 3-day car shoot near Denver. Budget $2,500, drone included.',
          sender: 'Maya · Drone Pilot',
          text: 'Those dates work. Inspire 3 and FPV rigs ready, and I\'ll handle the airspace request.',
          budget: 2500,
          trust: 'FAA Part 107 license checked'
        },
        {
          id: 'blipNova',
          name: 'Nova Mercer',
          city: 'Los Angeles',
          craft: 'Pursuit Arm',
          rate: '$850/day',
          radarStatus: 'Nova · Pursuit · Los Angeles',
          client: 'Need a pursuit arm vehicle for a 5-day car commercial in LA. Budget $5,000.',
          sender: 'Nova · Pursuit Arm',
          text: 'Vehicle is prepped in Burbank and the crane is ready. Can you send the storyboard?',
          budget: 5000,
          trust: 'Credits and rig checked'
        }
      ];
      let scIdx = 0;
      let animTimeouts = [];
      let isPaused = false;
      function clearAnimTimeouts() {
        animTimeouts.forEach(t => clearTimeout(t));
        animTimeouts = [];
      }
      function updateScrubber(val) {
        const valNum = parseInt(val, 10);
        const fee = Math.round(valNum * 0.20);   // compared with a 20% marketplace fee
        const payoutEl = document.getElementById('nxCobaltPayout');
        const saveEl = document.getElementById('nxCobaltSavings');
        const numEl = document.getElementById('nxCobaltNum');
        if (payoutEl) payoutEl.textContent = '$' + valNum.toLocaleString('en-US');
        if (saveEl) saveEl.textContent = '+$' + fee.toLocaleString('en-US');
        if (numEl) numEl.textContent = '0%';
        document.querySelectorAll('#nxCobaltCard .nx-glass-pill').forEach(btn => {
          const btnVal = parseInt(btn.getAttribute('data-amount'), 10);
          btn.classList.toggle('is-active', btnVal === valNum);
        });
      }
      document.querySelectorAll('#nxCobaltCard .nx-glass-pill').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const amt = btn.getAttribute('data-amount');
          updateScrubber(amt);
        });
      });
      const p1 = document.getElementById('pipeStep1');
      const p2 = document.getElementById('pipeStep2');
      const p3 = document.getElementById('pipeStep3');
      const p4 = document.getElementById('pipeStep4');
      const card1 = document.getElementById('nxRadarCard');
      const card2 = document.getElementById('nxDispatchCard');
      const card3 = document.getElementById('nxCobaltCard');
      const card4 = document.getElementById('nxTrustCard');
      const allSteps = [p1, p2, p3, p4].filter(Boolean);
      const allCards = [card1, card2, card3, card4].filter(Boolean);
      function activateStep(n, fromLoop = false) {
        if (!fromLoop) {
          clearAnimTimeouts();
        }
        allSteps.forEach((s, i) => {
          s.classList.remove('is-active');
          if (i + 1 < n) s.classList.add('is-completed');
          else s.classList.remove('is-completed');
          if (i + 1 === n) {
            s.classList.remove('is-completed');
            void s.offsetWidth;
            s.classList.add('is-active');
          }
        });
        allCards.forEach((card, i) => {
          if (i + 1 === n) card.classList.add('is-card-active');
          else card.classList.remove('is-card-active');
        });
      }
      window.activateStep = activateStep;
      function playRealLifeSequence(idx) {
        clearAnimTimeouts();
        scIdx = idx % pipelineScenarios.length;
        const cur = pipelineScenarios[scIdx];
        const radarStatus = document.getElementById('nxRadarStatusText');
        const chatClient = document.getElementById('nxClientBody');
        const chatSender = document.getElementById('nxChatSender');
        const chatText = document.getElementById('nxChatText');
        const trustBadge = document.getElementById('nxTrustBadge');
        const typingPill = document.getElementById('nxChatTyping');
        document.querySelectorAll('#how .nx-radar-blip').forEach(b => b.classList.remove('is-correlated'));
        const activeBlip = document.getElementById(cur.id);
        if (activeBlip) activeBlip.classList.add('is-correlated');
        if (radarStatus) radarStatus.textContent = cur.radarStatus;
        updateScrubber(cur.budget);
        if (trustBadge) trustBadge.textContent = cur.trust;
        if (chatClient) chatClient.textContent = cur.client;
        if (chatSender) chatSender.textContent = cur.sender;
        if (chatText) chatText.textContent = cur.text;
        activateStep(1, true);
        animTimeouts.push(setTimeout(() => {
          activateStep(2, true);
          if (typingPill) typingPill.classList.add('is-active');
        }, 4000));
        animTimeouts.push(setTimeout(() => {
          if (typingPill) typingPill.classList.remove('is-active');
        }, 5400));
        animTimeouts.push(setTimeout(() => {
          activateStep(3, true);
          updateScrubber(cur.budget);
        }, 8000));
        animTimeouts.push(setTimeout(() => {
          activateStep(4, true);
        }, 12000));
        animTimeouts.push(setTimeout(() => {
          if (isPaused) return;
          playRealLifeSequence(scIdx + 1);
        }, 16000));
      }
      window.playRealLifeSequence = playRealLifeSequence;
      [p1, p2, p3, p4].forEach((step, idx) => {
        if (step) {
          step.addEventListener('click', (e) => {
            e.stopPropagation();
            clearAnimTimeouts();
            activateStep(idx + 1);
          });
        }
      });
      [card1, card2, card3, card4].forEach((card, idx) => {
        if (card) {
          card.addEventListener('click', (e) => {
            if (e.target.closest('button, a, input, [role="button"]')) return;
            e.stopPropagation();
            clearAnimTimeouts();
            activateStep(idx + 1);
          });
        }
      });
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => playRealLifeSequence(0));
      } else {
        playRealLifeSequence(0);
      }
    })();
