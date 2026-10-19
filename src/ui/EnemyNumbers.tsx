import { assess } from '../bestiary/assess'
import { DAMAGE_TYPES, STATUSES, isStatus, type Affliction, type Form } from '../bestiary/enemy'
import { DAMAGE_NAMES } from '../domain/names'
import { Section } from './Page'

export const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

export function AfflictionIcon({ affliction, size = 20 }: { affliction: Affliction; size?: number }) {
  return <img src={`damage/${affliction}.webp`} alt="" width={size} height={size} className="shrink-0 rounded" draggable={false} />
}

/** The weakness the game names leads, ahead of what the numbers say. */
export function WeakTo({ forms, named }: { forms: Form[]; named?: Affliction }) {
  const verdict = assess(forms)
  const oneForm = !verdict.weakTo.length ? verdict.oneForm : null
  const weak = verdict.weakTo.length ? verdict.weakTo : oneForm?.weakTo ?? []
  const lead: Affliction[] = named ? [named, ...weak.filter((k) => k !== named)] : weak
  const valueOf = (k: Affliction): string => {
    if (isStatus(k)) return String(verdict.buildup[k])
    return signed(oneForm ? oneForm.by : verdict.negation[k])
  }
  return (
    <section aria-label="Weak to" className="surface rounded-card px-5 py-4">
      <h2 className="m-0 mb-2.5 text-[13px] font-semibold tracking-wide text-label-2 uppercase">
        {oneForm?.label ? `Weak to · ${oneForm.label}` : 'Weak to'}
      </h2>
      {lead.length ? (
        <div className="flex flex-col gap-2">
          {lead.map((k) => {
            return (
              <span key={k} className="flex items-center gap-2.5 text-[28px] leading-tight font-bold">
                <AfflictionIcon affliction={k} size={32} />
                {DAMAGE_NAMES[k]}
                <span className="text-xl text-weak tabular-nums">{valueOf(k)}</span>
              </span>
            )
          })}
        </div>
      ) : (
        <p className="m-0 text-[28px] leading-tight font-bold text-label-2">No damage weakness</p>
      )}
      {verdict.weakStatuses.length > 0 && (
        <p className="m-0 mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-[15px] text-label-2 shadow-[inset_0_0.5px_0_var(--color-separator)]">
          Fastest status
          {verdict.weakStatuses.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 text-label">
              <AfflictionIcon affliction={s} />{DAMAGE_NAMES[s]} <b className="text-weak tabular-nums">{verdict.fastestAt}</b>
            </span>
          ))}
        </p>
      )}
    </section>
  )
}

export function NumbersTable({ forms }: { forms: Form[] }) {
  const labelled = forms.length > 1
  const cell = 'px-3 py-2.5 text-right tabular-nums'
  const row = (key: Affliction, value: (f: Form) => number | 'immune', weakWhen: (v: number) => boolean) => (
    <tr key={key} className="shadow-[inset_0_-0.5px_0_var(--color-separator)] last:shadow-none">
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
      <Section title="Damage negation · below zero takes more">
        <div className="surface overflow-x-auto rounded-card">
          <table className="w-full border-collapse text-base">
            {head}
            <tbody>{DAMAGE_TYPES.map((t) => row(t, (f) => f.negation[t], (v) => v < 0))}</tbody>
          </table>
        </div>
      </Section>
      <Section title="Status buildup · lower procs faster">
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
