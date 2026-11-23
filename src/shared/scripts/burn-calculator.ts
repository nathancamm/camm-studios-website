import {
  burnTimeMinutes,
  describeConditions,
  describeUvTable,
  formatBurnTime,
  spfLabel,
  uvRange,
  type BurnTimeInput,
  type SkinType,
} from '../lib/burn-time';

const form = document.querySelector<HTMLFormElement>('[data-burn-calculator]');
if (form) initCalculator(form);

function initCalculator(form: HTMLFormElement) {
  const fields = form.elements;
  const uvInput = fields.namedItem('uv') as HTMLInputElement;
  const cloudInput = fields.namedItem('cloud') as HTMLInputElement;
  const find = <T extends HTMLElement>(selector: string) => form.querySelector<T>(selector)!;
  const value = find('[data-calc-value]');
  const context = find('[data-calc-context]');
  const withSpf = find('[data-calc-with-spf]');
  const protection = find('[data-calc-protection]');
  const caption = find('[data-calc-caption]');
  const rows = [...form.querySelectorAll<HTMLTableRowElement>('[data-calc-row]')];

  // Read a number field, flag it when it is outside its range, and return null if so.
  function readNumber(input: HTMLInputElement, min: number, max: number, errorKey: string) {
    const number = input.value.trim() === '' ? Number.NaN : input.valueAsNumber;
    const valid = Number.isFinite(number) && number >= min && number <= max;
    input.setAttribute('aria-invalid', String(!valid));
    find(`[data-calc-error="${errorKey}"]`).hidden = valid;
    return valid ? number : null;
  }

  function update() {
    const uvIndex = readNumber(uvInput, uvRange.min, uvRange.max, 'uv');
    const cloudPercent = readNumber(cloudInput, 0, 100, 'cloud');
    const skinType = Number((fields.namedItem('skin') as RadioNodeList).value) as SkinType;
    const spf = Number((fields.namedItem('spf') as RadioNodeList).value);

    if (uvIndex === null || cloudPercent === null) {
      value.textContent = '—';
      context.textContent = 'No estimate. Check the inputs.';
      withSpf.hidden = true;
      protection.hidden = true;
      return;
    }

    // The headline is always the time without sunscreen. Sunscreen multiplies it by the SPF in the
    // app's maths, which reaches many hours at high UV, so it is shown only as a qualified second line.
    const input: BurnTimeInput = { skinType, uvIndex, spf: 0, cloudCover: cloudPercent / 100 };
    value.textContent = formatBurnTime(burnTimeMinutes(input));
    context.textContent = uvIndex > 0 ? describeConditions(input) : 'No estimate at UV 0.';

    withSpf.hidden = !(spf > 1 && uvIndex > 0);
    withSpf.textContent = `With ${spfLabel(spf)} at the tested amount: ${formatBurnTime(burnTimeMinutes({ ...input, spf }))}. Most people apply less, so real protection is lower. Reapply every two hours.`;
    protection.hidden = uvIndex < 3;

    caption.textContent = describeUvTable(input);
    for (const row of rows) {
      const uv = Number(row.dataset.calcRow);
      row.cells[1].textContent = formatBurnTime(burnTimeMinutes({ ...input, uvIndex: uv }));
      if (uv === uvIndex) row.setAttribute('aria-current', 'true');
      else row.removeAttribute('aria-current');
    }
  }

  form.addEventListener('input', update);
  form.addEventListener('submit', (event) => event.preventDefault());
  find<HTMLFieldSetElement>('[data-calc-inputs]').disabled = false;
  update();
}
