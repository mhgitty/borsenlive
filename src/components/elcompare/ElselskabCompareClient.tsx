'use client'
import { useMemo, useState, useRef, useEffect } from 'react'
import styles from './ElselskabCompare.module.css'
import type { ElselskabProvider } from '@/lib/elselskab-price'
import { KWH_PRESETS, REFERENCE_KWH_ANNUAL, priceFor } from '@/lib/elselskab-price'

type Area = 'DK1' | 'DK2'

const fmt = (n: number, d: number) =>
  n.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d })

const USAGE_HELP: [string, string][] = [
  ['1.000 kWh', 'Lille lejlighed, 1 person, lavt forbrug'],
  ['2.000 kWh', 'Lejlighed, 1-2 personer, ingen elvarme'],
  ['4.000 kWh', 'Hus/lejlighed, lille familie, ingen elvarme'],
  ['6.000 kWh', 'Hus, familie, evt. elbil eller elvarme'],
  ['8.000 kWh', 'Hus med elbil eller delvis elopvarmning'],
  ['10.000 kWh', 'Stor husstand med elvarme, elbil eller varmepumpe'],
]

interface Props {
  providers: ElselskabProvider[]
  raw: Record<Area, number>
  /** Hide the filter panel (brand lists: DK1, 4,000 kWh, no filters). */
  showFilters?: boolean
}

export function ElselskabCompareClient({ providers, raw, showFilters = true }: Props) {
  const [area, setArea] = useState<Area>('DK1')
  const [presetIdx, setPresetIdx] = useState(KWH_PRESETS.indexOf(REFERENCE_KWH_ANNUAL))
  const [introOnly, setIntroOnly] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const helpRef = useRef<HTMLDivElement>(null)
  const annual = KWH_PRESETS[presetIdx] ?? REFERENCE_KWH_ANNUAL

  useEffect(() => {
    if (!helpOpen) return
    const close = (e: MouseEvent) => { if (helpRef.current && !helpRef.current.contains(e.target as Node)) setHelpOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [helpOpen])

  const rows = useMemo(() => {
    return providers
      .map((p) => ({ p, price: priceFor(p, raw[area], area, annual) }))
      .filter(({ p }) => !introOnly || p.intro)
      .sort((a, b) => a.price.total - b.price.total)
  }, [providers, raw, area, annual, introOnly])

  return (
    <div className={styles.wrap}>
      {showFilters && (
        <>
          <button type="button" className={`${styles.mobileToggle} ${filtersOpen ? styles.isOpen : ''}`} onClick={() => setFiltersOpen((o) => !o)}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            Filter
          </button>

          <div className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : ''}`}>
            <div className={`${styles.group} ${styles.groupKwh}`}>
              <div className={styles.label}>Dit årlige elforbrug</div>
              <div className={styles.sliderRow}>
                <div className={styles.sliderValue}>
                  <strong>{fmt(annual, 0)}</strong> <span>kWh/år</span>
                </div>
                <div className={styles.sliderTrack}>
                  <input
                    type="range" min={0} max={KWH_PRESETS.length - 1} step={1} value={presetIdx}
                    onChange={(e) => setPresetIdx(parseInt(e.target.value, 10))}
                    className={styles.slider}
                    aria-label="Årligt elforbrug"
                    style={{ ['--fill' as any]: `${(presetIdx / (KWH_PRESETS.length - 1)) * 100}%` }}
                  />
                  <div className={styles.sliderLabels}>
                    {KWH_PRESETS.map((p) => <span key={p}>{fmt(p, 0)}</span>)}
                  </div>
                </div>
              </div>
              <div className={styles.help} ref={helpRef}>
                <button type="button" className={styles.helpToggle} onClick={(e) => { e.stopPropagation(); setHelpOpen((o) => !o) }}>
                  <span className={styles.helpIcon}>?</span> Jeg kender ikke mit forbrug
                </button>
                {helpOpen && (
                  <div className={styles.helpPopup} role="dialog">
                    <div className={styles.helpTitle}>Hvad er et typisk elforbrug?</div>
                    <p>Dit elforbrug afhænger af din boligtype, antal personer og opvarmningsform. Her er nogle pejlemærker:</p>
                    <ul>
                      {USAGE_HELP.map(([k, v]) => <li key={k}><strong>{k}:</strong> {v}</li>)}
                    </ul>
                    <p className={styles.helpTip}>Tip: Du kan finde dit præcise forbrug på din seneste elregning eller ved at logge ind hos dit nuværende elselskab.</p>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.group}>
              <div className={styles.label}>Bopæl ift. Storebælt</div>
              <div className={styles.areaToggle} data-area={area}>
                <span className={styles.areaThumb} />
                <button type="button" className={area === 'DK1' ? styles.areaActive : ''} onClick={() => setArea('DK1')} aria-pressed={area === 'DK1'}>Vest</button>
                <button type="button" className={area === 'DK2' ? styles.areaActive : ''} onClick={() => setArea('DK2')} aria-pressed={area === 'DK2'}>Øst</button>
              </div>
            </div>

            <div className={styles.group}>
              <label className={styles.introLabel}>
                <span>Vis kun introtilbud</span>
                <button
                  type="button" role="switch" aria-checked={introOnly}
                  className={`${styles.switch} ${introOnly ? styles.switchOn : ''}`}
                  onClick={() => setIntroOnly((v) => !v)}
                >
                  <span className={styles.switchKnob} />
                </button>
              </label>
            </div>
          </div>
        </>
      )}

      <ol className={styles.list}>
        {rows.map(({ p, price }, i) => (
          <li key={p.key} className={`${styles.card} ${showFilters && i === 0 ? styles.cardTop : ''} ${showFilters ? '' : styles.cardPlain}`}>
            {showFilters ? <div className={styles.rank} aria-label={`Nummer ${i + 1}`}>{i + 1}</div> : <div className={styles.rank} aria-hidden="true" />}

            <div className={styles.colLogo}>
              <div className={styles.logo}>
                {p.logo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={p.logo} alt={p.name} loading="lazy" />
                  : <span>{p.name}</span>}
              </div>
              {p.reviewUrl && <a href={p.reviewUrl} className={styles.reviewLink}>Læs anmeldelse</a>}
            </div>

            <div className={styles.colInfo}>
              {showFilters && i === 0 && <span className={styles.topBadge}>Billigst lige nu</span>}
              <div className={styles.title}>{p.title}</div>
              <div className={styles.company}>{p.name}</div>
              <ul className={styles.tags}>
                <li>{/^variabel$/i.test(p.priceType) ? "Variabel pris" : p.priceType}</li>
                <li>{/^ingen$/i.test(p.binding) ? "Ingen binding" : `Binding: ${p.binding}`}</li>
                {p.intro && <li className={styles.tagIntro}>Introtilbud</li>}
              </ul>
              {p.campaign && <div className={styles.campaign}>{p.campaign}</div>}
            </div>

            <div className={styles.colPrice}>
              <div className={styles.priceValue}>{fmt(price.total, 2)}<small> kr./kWh</small></div>
              <div className={styles.priceMonth}>ca. {fmt(Math.round(price.monthly), 0)} kr. pr. måned</div>
              <div className={styles.breakdown} tabIndex={0}>
                <span className={styles.infoIcon} aria-hidden="true">i</span>
                <span>Sådan er prisen regnet ud</span>
                <div className={styles.tooltip} role="tooltip">
                  <div className={styles.tooltipTitle}>Prisen pr. kWh består af</div>
                  <Row label="Rå elpris (spot)" v={price.raw} />
                  <Row label={`Tillæg hos ${p.name}`} v={price.kwhTillaeg} />
                  <Row label={`Abonnement hos ${p.name}`} v={price.aboPerKwh} />
                  <Row label="Netselskab" v={price.netselskab} />
                  <Row label="Energinet" v={price.energinet} />
                  <Row label="Elafgift (staten)" v={price.staten} />
                  <div className={styles.tooltipDivider} />
                  <Row label="Faste tillæg i alt" v={price.staticSum} strong />
                  <Row label="Samlet pris" v={price.total} strong />
                  <p className={styles.tooltipNote}>
                    Beregnet ud fra {fmt(annual, 0)} kWh om året. Den rå elpris er sidste måneds gennemsnit fra Energi Data Service.
                    Nettariffer: N1 i Vest, Radius i Øst.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.colCta}>
              <a href={`/go/${p.ctaSlug}/`} className={styles.cta} target="_blank" rel="nofollow sponsored noopener">Gå til tilbud</a>
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <li className={styles.empty}>{providers.length ? 'Ingen elselskaber har introtilbud lige nu. Slå filteret fra for at se alle.' : 'Priserne kunne ikke hentes lige nu. Prøv igen om lidt.'}</li>
        )}
      </ol>
    </div>
  )
}

function Row({ label, v, strong }: { label: string; v: number; strong?: boolean }) {
  return (
    <div className={`${styles.tooltipRow} ${strong ? styles.tooltipStrong : ''}`}>
      <span>{label}</span>
      <span>{fmt(v, 4)} kr./kWh</span>
    </div>
  )
}
