function levelCost(n) {
  return 50 + 10 * n;
}

function tierFullCost(tier) {
  const start = (tier - 1) * 25 + 1;
  const end = tier * 25;
  let sum = 0;

  for (let n = start; n <= end; n += 1) {
    sum += levelCost(n);
  }

  return sum;
}

function partialCost(tier, uptoLevel) {
  const start = (tier - 1) * 25 + 1;
  let sum = 0;

  for (let n = start; n <= uptoLevel; n += 1) {
    sum += levelCost(n);
  }

  return sum;
}

function tierOf(level) {
  if (level <= 0) {
    return 0;
  }

  return Math.ceil(level / 25);
}

function computeCost(level, withReset) {
  const result = { total: 0, rows: [] };

  if (level <= 0) {
    return result;
  }

  const k = tierOf(level);
  const tierNames = { 1: '1–25', 2: '26–50', 3: '51–75', 4: '76–100' };

  for (let j = 1; j < k; j += 1) {
    const full = tierFullCost(j);
    const passes = withReset ? k - j + 1 : 1;
    const subtotal = full * passes;

    result.total += subtotal;
    result.rows.push({
      tier: j,
      range: tierNames[j],
      fullCost: full,
      passes,
      subtotal,
      isCurrent: false,
    });
  }

  const currFull = tierFullCost(k);
  const currPartial = partialCost(k, level);
  const isFull = currPartial === currFull;

  result.total += currPartial;
  result.rows.push({
    tier: k,
    range: tierNames[k] + (isFull ? '' : ` (up to Lv ${level})`),
    fullCost: currFull,
    passes: 1,
    subtotal: currPartial,
    isCurrent: true,
  });

  return result;
}

function render() {
  const levelInput = document.getElementById('level');
  const levelSlider = document.getElementById('levelSlider');
  const relicsInput = document.getElementById('relics');
  const resetModeInput = document.getElementById('resetMode');

  const level = Math.max(0, Math.min(100, parseInt(levelInput.value, 10) || 0));
  const relics = Math.max(1, parseInt(relicsInput.value, 10) || 1);
  const withReset = resetModeInput.checked;

  levelInput.value = level;
  levelSlider.value = level;

  const { total, rows } = computeCost(level, withReset);
  const grandTotal = total * relics;

  document.getElementById('totalAmount').textContent = grandTotal.toLocaleString();
  document.getElementById('totalLabel').textContent =
    relics > 1
      ? `Relic Tokens Needed  (${relics} relics × ${total.toLocaleString()})`
      : 'Relic Tokens Needed';

  const body = document.getElementById('breakdownBody');
  body.innerHTML = '';

  if (rows.length === 0) {
    body.innerHTML = '<tr><td colspan="5" style="color:var(--dim)">Level 0 — no cost yet.</td></tr>';
  } else {
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      if (row.isCurrent) {
        tr.className = 'current';
      }

      tr.innerHTML = `
        <td>Tier ${row.tier}</td>
        <td>${row.range}</td>
        <td class="num">${row.fullCost.toLocaleString()}</td>
        <td class="num">×${row.passes}</td>
        <td class="num">${row.subtotal.toLocaleString()}</td>
      `;

      body.appendChild(tr);
    });
  }

  document.getElementById('footnote').textContent = withReset
    ? 'Each ascension (Lv 25 / 50 / 75) resets the relic to level 1, so every earlier tier must be paid for again — that\'s why "Times Paid" is greater than 1 for completed tiers.'
    : 'Naive mode: straight sum of level costs from 1 to the target level, ignoring the ascension reset mechanic.';
}

document.getElementById('level').addEventListener('input', render);
document.getElementById('levelSlider').addEventListener('input', (event) => {
  document.getElementById('level').value = event.target.value;
  render();
});
document.getElementById('relics').addEventListener('input', render);
document.getElementById('resetMode').addEventListener('change', render);
document.querySelectorAll('.quick button').forEach((button) => {
  button.addEventListener('click', () => {
    document.getElementById('level').value = button.dataset.lvl;
    render();
  });
});

render();
