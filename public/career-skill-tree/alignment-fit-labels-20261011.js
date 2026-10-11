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
    const paragraph = document.querySelector('#matchResults .section-title p');
    if (!paragraph) return;
    paragraph.textContent = 'Career Tree combines your O*NET interest profile with the preferences you chose and groups the results into alignment levels. Stronger alignment means more of those clues point in the same direction; it is not a probability of success or a promise that a career is right for you. Choose up to five to carry into the next step, where you can explore local pay, openings, growth, and preparation.';
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
  }

  function refresh(root = document) {
    updateExplainer();
    updateCareerFitLabels(root);
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches?.('.career-fit') || node.querySelector?.('.career-fit')) refresh(node);
      }
    }
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
