// Comportements de l'interface admin (aucune donnée sensible ici).
(function () {
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // ── Menu latéral (mobile) ──
  const openMenu = () => document.body.classList.add('menu-open');
  const closeMenu = () => document.body.classList.remove('menu-open');
  $$('[data-open-menu]').forEach((b) => b.addEventListener('click', openMenu));
  $$('[data-close-menu]').forEach((b) => b.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  // ── Codes 2FA : chiffres uniquement, groupés par 3 ──
  $$('input.otp').forEach((input) => {
    input.addEventListener('input', () => {
      const d = input.value.replace(/\D/g, '').slice(0, 6);
      input.value = d.length > 3 ? d.slice(0, 3) + ' ' + d.slice(3) : d;
    });
  });

  // ── Formulaire de payout ──
  const form = $('[data-payout-form]');
  const dataEl = $('#countries-data');
  if (form && dataEl) {
    let countries = [];
    try { countries = JSON.parse(dataEl.textContent || '[]'); } catch (e) { countries = []; }
    const countrySel = $('[data-country]', form);
    const opsBox = $('[data-operators]', form);
    const opInput = $('[data-operator]', form);
    const currencyInput = $('[data-currency]', form);
    const prefixEl = $('[data-prefix]', form);
    const currencyLabel = $('[data-currency-label]', form);
    const phoneInput = $('[data-phone]', form);
    const amountInput = $('[data-amount]', form);
    const beneficiaryInput = $('[data-beneficiary]', form);
    const balanceHint = $('[data-balance-hint]', form);
    const maxAmount = Number(amountInput.dataset.max || 0);
    const fmt = (n) => Number(n).toLocaleString('fr-FR');
    const set = (sel, text) => { const el = $(sel, form); if (el) el.textContent = text || '—'; };

    let country = null;
    let currency = null;

    const renderSummary = () => {
      set('[data-sum-country]', country ? country.flag + ' ' + country.name : '');
      const op = currency && currency.operators.find((o) => o.code === opInput.value);
      set('[data-sum-operator]', op ? op.name : '');
      const phone = phoneInput.value.replace(/\D/g, '');
      set('[data-sum-phone]', phone ? (country ? '+' + country.prefix + ' ' : '') + phone : '');
      set('[data-sum-beneficiary]', beneficiaryInput.value.trim());
      const amount = Number(amountInput.value.replace(/\D/g, ''));
      set('[data-sum-amount]', amount ? fmt(amount) + ' ' + (currency ? currency.currency : '') : '');

      let hint = maxAmount ? 'Maximum par payout : ' + fmt(maxAmount) : '';
      let warn = false;
      if (currency && currency.balance != null) {
        hint = 'Solde payout disponible : ' + fmt(currency.balance) + ' ' + currency.currency + (hint ? ' · ' + hint : '');
        if (amount && amount > currency.balance) warn = true;
      }
      if (maxAmount && amount > maxAmount) warn = true;
      balanceHint.textContent = hint;
      balanceHint.classList.toggle('warn', warn);
    };

    const renderOperators = (keep) => {
      country = countries.find((c) => c.code === countrySel.value) || null;
      currency = country ? country.currencies[0] || null : null;
      opsBox.innerHTML = '';
      if (!country || !currency) {
        opsBox.innerHTML = '<p class="muted small">Choisissez d’abord le pays.</p>';
        prefixEl.textContent = '+ …';
        currencyInput.value = '';
        currencyLabel.textContent = '—';
        opInput.value = '';
        renderSummary();
        return;
      }
      prefixEl.textContent = '+' + country.prefix;
      currencyInput.value = currency.currency;
      currencyLabel.textContent = currency.currency;
      if (!keep || !currency.operators.some((o) => o.code === opInput.value)) opInput.value = '';
      if (currency.operators.length === 1) opInput.value = currency.operators[0].code;
      currency.operators.forEach((o) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'op' + (o.code === opInput.value ? ' active' : '');
        b.setAttribute('aria-pressed', o.code === opInput.value ? 'true' : 'false');
        const initials = document.createElement('span');
        initials.className = 'op-logo op-' + o.code;
        initials.textContent = o.name.charAt(0).toUpperCase();
        const label = document.createElement('span');
        label.textContent = o.name;
        b.append(initials, label);
        b.addEventListener('click', () => {
          opInput.value = o.code;
          $$('.op', opsBox).forEach((x) => { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
          b.classList.add('active');
          b.setAttribute('aria-pressed', 'true');
          opsBox.classList.remove('invalid');
          renderSummary();
        });
        opsBox.appendChild(b);
      });
      renderSummary();
    };

    countrySel.addEventListener('change', () => renderOperators(false));
    [phoneInput, beneficiaryInput].forEach((el) => el.addEventListener('input', renderSummary));
    amountInput.addEventListener('input', () => {
      const digits = amountInput.value.replace(/\D/g, '');
      amountInput.value = digits ? fmt(digits) : '';
      renderSummary();
    });
    form.addEventListener('submit', (e) => {
      if (!opInput.value) {
        e.preventDefault();
        opsBox.classList.add('invalid');
        opsBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    if (amountInput.value) amountInput.value = fmt(amountInput.value.replace(/\D/g, '') || 0);
    renderOperators(true);
  }

  // ── Empêche le double envoi des formulaires sensibles ──
  $$('form[data-once]').forEach((f) => {
    f.addEventListener('submit', () => {
      const btn = $('button[type="submit"]', f);
      if (btn) { btn.disabled = true; btn.classList.add('loading'); btn.lastChild.textContent = ' Envoi en cours…'; }
    });
  });
})();
