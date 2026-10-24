import { assess } from '../bestiary/assess'
import { DAMAGE_TYPES, STATUSES, isStatus, type Affliction, type Form } from '../bestiary/enemy'
import { DAMAGE_NAMES } from '../domain/names'
import { Section } from './Page'

export const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

export function AfflictionIcon({ affliction, size = 20, label }: { affliction: Affliction; size?: number; label?: string }) {
  return <img src={`damage/${affliction}.webp`} alt={label ?? ''} width={size} height={size} className="shrink-0 rounded" draggable={false} />
}

export function WeakIcons({ forms, named, center }: { forms: Form[]; named?: Affliction; center?: boolean }) {
  const verdict = assess(forms)
  const weak = verdict.weakTo.length ? verdict.weakTo : verdict.oneForm?.weakTo ?? []
  const lead: Affliction[] = named ? [named, ...weak.filter((k) => k !== named)] : weak
  const shown = [...lead, ...verdict.weakStatuses.filter((k) => !lead.includes(k))]
  if (!shown.length) return null
  return (
    <section aria-label="Weak to" className={`mt-3 flex flex-wrap gap-2 ${center ? 'justify-center' : ''}`}>
      {shown.map((k) => <AfflictionIcon key={k} affliction={k} size={28} label={DAMAGE_NAMES[k]} />)}
    </section>
  )
}

const isWeak = (v: number | 'immune', weakWhen: (v: number) => boolean) => v !== 'immune' && weakWhen(v)

export function NumbersTable({ forms }: { forms: Form[] }) {
  const labelled = forms.length > 1
  const cell = 'px-3 py-2.5 text-right tabular-nums'
  const row = (key: Affliction, value: (f: Form) => number | 'immune', weakWhen: (v: number) => boolean) => (
    <tr key={key} className={`shadow-[inset_0_-0.5px_0_var(--color-separator)] last:shadow-none ${forms.some((f) => isWeak(value(f), weakWhen)) ? 'bg-weak-row' : ''}`}>
      <th scope="row" className="px-4 py-2.5 text-left font-normal">
        <span className="flex items-center gap-2.5"><AfflictionIcon affliction={key} />{DAMAGE_NAMES[key]}</span>
      </th>
      {forms.map((f, i) => {
        const v = value(f)
        const tone = v === 'immune' ? 'text-immune' : weakWhen(v) ? 'font-semibold text-weak' : v === 0 ? 'text-label-2' : ''
        return <td key={i} className={`${cell} ${tone}`}>{v === 'immune' ? 'Immune' : isStatus(key) ? v : signed(v)}</td>
      })}
    </tr>
  )
  const head = labelled && (
    <thead>
      <tr>
        <td />
        {forms.map((f, i) => <th key={i} scope="col" className="px-3 pt-3 pb-1 text-right text-[13px] font-semibold text-label-2">{f.label}</th>)}
      </tr>
    </thead>
  )
  const lowestBuildup = Math.min(...forms.flatMap((f) => STATUSES.map((s) => f.buildup[s]).filter((v): v is number => v !== 'immune')))
  return (
    <>
      <Section title="Damage negation">
        <div className="surface overflow-x-auto rounded-card">
          <table className="w-full border-collapse text-base">
            {head}
            <tbody>{DAMAGE_TYPES.map((t) => row(t, (f) => f.negation[t], (v) => v < 0))}</tbody>
          </table>
        </div>
      </Section>
      <Section title="Status buildup">
        <div className="surface overflow-x-auto rounded-card">
          <table className="w-full border-collapse text-base">
            {head}
            <tbody>{STATUSES.map((s) => row(s, (f) => f.buildup[s], (v) => v === lowestBuildup))}</tbody>
          </table>
        </div>
      </Section>
    </>
  )
}
