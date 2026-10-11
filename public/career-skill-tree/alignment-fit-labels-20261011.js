(() => {
  const LEVELS = [
    { min: 85, label: 'Strong Alignment', meter: 88 },
    { min: 70, label: 'Good Alignment', meter: 72 },
    { min: 55, label: 'Moderate Alignment', meter: 56 },
    { min: 0, label: 'Possible Alignment', meter: 40 }
  ];

  function levelFor(score) {
    return LEVELS.find(level => score >= level.min) || LEVELS[LEVELS.length - 1];
  }

  function updateExplainer() {
    const section = document.querySelector('#matchResults .section-title');
    if (!section) return;
    const paragraph = section.querySelector('p');
    if (paragraph) paragraph.textContent = 'Choose up to five possibilities to carry into the next step, where you can compare local pay, openings, growth, and preparation.';

    let note = section.querySelector('.alignment-surface-note');
    if (!note) {
      note = document.createElement('div');
      note.className = 'alignment-surface-note';
      section.appendChild(note);
    }
    note.innerHTML = '<strong>Why these careers surfaced</strong><span>Career Tree combined your O*NET interest clues with the work preferences you selected. Careers appear higher when more of those clues point in the same direction. These are possibilities to explore—not recommendations or guarantees.</span>';
  }

  function updateCareerFitLabels(root = document) {
    root.querySelectorAll?.('.career-fit').forEach(element => {
      const valueNode = element.querySelector('strong');
      if (!valueNode) return;

      const score = Number.parseInt(valueNode.textContent, 10);
      if (!Number.isFinite(score)) return;

      const level = levelFor(score);
      const labelNode = element.querySelector('span');
      const meter = element.querySelector('.career-fit-track i');

      if (labelNode) labelNode.textContent = 'Career alignment';
      valueNode.textContent = level.label;
      if (meter) meter.style.width = `${level.meter}%`;
      element.setAttribute('aria-label', `Career alignment: ${level.label}`);
      element.dataset.alignmentLevel = level.label;
    });

    root.querySelectorAll?.('#careerCards .career-card .why').forEach(element => {
      element.hidden = true;
      element.setAttribute('aria-hidden', 'true');
    });
  }

  function addStyles() {
    if (document.getElementById('alignment-surface-note-styles')) return;
    const style = document.createElement('style');
    style.id = 'alignment-surface-note-styles';
    style.textContent = `
      #matchResults .alignment-surface-note{margin-top:16px;padding:16px 18px;border:1px solid rgba(114,215,255,.28);border-radius:16px;background:rgba(114,215,255,.07);display:grid;gap:5px;max-width:900px}
      #matchResults .alignment-surface-note strong{color:#dff7ff;font-size:.95rem}
      #matchResults .alignment-surface-note span{color:#b9c7df;line-height:1.5;font-size:.9rem}
      #careerCards .career-card .why[hidden]{display:none!important}
    `;
    document.head.appendChild(style);
  }

  function refresh(root = document) {
    addStyles();
    updateExplainer();
    updateCareerFitLabels(root);
  }

  const observer = new MutationObserver(mutations => {
    let needsRefresh = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches?.('.career-card,.career-fit,.section-title') || node.querySelector?.('.career-card,.career-fit,.section-title')) {
          needsRefresh = true;
          break;
        }
      }
      if (needsRefresh) break;
    }
    if (needsRefresh) refresh();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      refresh();
      observer.observe(document.body, { childList: true, subtree: true });
    }, { once: true });
  } else {
    refresh();
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
