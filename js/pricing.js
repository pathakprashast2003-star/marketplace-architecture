(function () {
  'use strict';

  // 1. Commission Savings Calculator
  const slider = document.getElementById('calcSlider');
  const billingsDisplay = document.getElementById('calcBillingsDisplay');
  const upworkCutDisplay = document.getElementById('calcUpworkCut');
  const netSavingsDisplay = document.getElementById('calcNetSavings');

  function fmtMoney(num) {
    return '$' + Math.round(num).toLocaleString('en-US');
  }

  function updateCalculator() {
    if (!slider) return;
    const billings = parseFloat(slider.value) || 100000;
    
    // Upwork/Fiverr takes roughly 20% on creative billings
    const upworkCut = billings * 0.20;
    
    // Nexus charges $49/mo ($588/yr), with $0 for the first 90 days ($441 for year 1, $588 standard)
    const nexusCost = 588;
    const netSavings = upworkCut - nexusCost;

    if (billingsDisplay) billingsDisplay.textContent = fmtMoney(billings);
    if (upworkCutDisplay) upworkCutDisplay.textContent = '-' + fmtMoney(upworkCut);
    if (netSavingsDisplay) netSavingsDisplay.textContent = '+' + fmtMoney(netSavings);
  }

  if (slider) {
    slider.addEventListener('input', updateCalculator);
    updateCalculator();
  }

  // 2. Shortlist Badge Count Sync
  function updateShortlistCount() {
    try {
      const stored = localStorage.getItem('nexus_shortlist_v1');
      const list = stored ? JSON.parse(stored) : [];
      const badge = document.getElementById('shortlistBadgeCount');
      if (badge) {
        badge.textContent = Array.isArray(list) ? list.length : 0;
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  updateShortlistCount();
  window.addEventListener('storage', updateShortlistCount);

  // 3. Founding Roster 3D Flip Card
  function flipFoundingCard(flipToBack) {
    const banner = document.getElementById('foundingBanner');
    const flipper = document.getElementById('foundingFlipper');
    const front = document.querySelector('#founding .nx-found-front');
    const back = document.querySelector('#founding .nx-found-back');
    if (!banner || !flipper || !front || !back) return;
    if (flipToBack) {
      banner.classList.add('is-flipped');
      const backH = back.scrollHeight;
      const frontH = front.scrollHeight;
      if (backH > frontH) {
        flipper.style.minHeight = (backH + 4) + 'px';
      }
    } else {
      banner.classList.remove('is-flipped');
      flipper.style.minHeight = '';
    }
  }

  window.flipFoundingCard = flipFoundingCard;
})();
