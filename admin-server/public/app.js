// Comportements de l'interface admin (aucune donnée sensible ici).
(function () {
  // Formulaire de payout : opérateurs et indicatif selon le pays choisi.
  const form = document.querySelector('[data-payout-form]');
  const dataEl = document.getElementById('countries-data');
  if (form && dataEl) {
    let countries = [];
    try { countries = JSON.parse(dataEl.textContent || '[]'); } catch (e) { countries = []; }
    const countrySel = form.querySelector('[data-country]');
    const operatorSel = form.querySelector('[data-operator]');
    const currencyInput = form.querySelector('[data-currency]');
    const prefixEl = form.querySelector('[data-prefix]');
    const currencyLabel = form.querySelector('[data-currency-label]');

    const update = (keepSelection) => {
      const country = countries.find((c) => c.code === countrySel.value);
      const wanted = keepSelection ? operatorSel.dataset.selected : operatorSel.value;
      operatorSel.innerHTML = '';
      if (!country) {
        operatorSel.add(new Option('Choisir d’abord le pays', ''));
        prefixEl.textContent = '+…';
        currencyInput.value = '';
        currencyLabel.textContent = '';
        return;
      }
      const cur = country.currencies[0] || { currency: '', operators: [] };
      operatorSel.add(new Option('Choisir…', ''));
      cur.operators.forEach((o) => operatorSel.add(new Option(o.name, o.code, false, o.code === wanted)));
      prefixEl.textContent = '+' + country.prefix;
      currencyInput.value = cur.currency;
      currencyLabel.textContent = '(' + cur.currency + ')';
    };
    countrySel.addEventListener('change', () => update(false));
    update(true);
  }

  // Empêche le double envoi d'un formulaire sensible.
  document.querySelectorAll('form[data-once]').forEach((f) => {
    f.addEventListener('submit', () => {
      const btn = f.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours…'; }
    });
  });
})();
