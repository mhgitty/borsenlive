import { PortableText } from '@portabletext/react'
import { getReviewSheetData } from '@/lib/elselskab-compare'
import { replaceDateVars, replaceDateVarsInBlocks } from '@/lib/dateVars'
import { ElprisInline } from './ElprisInline'
import styles from './ElselskabCard.module.css'

const kr = (n: number, d = 2) => n.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d })

const textComponents = {
  block: { normal: ({ children }: any) => <p>{children}</p> },
  list: { bullet: ({ children }: any) => <ul>{children}</ul>, number: ({ children }: any) => <ol>{children}</ol> },
  marks: {
    strong: ({ children }: any) => <strong>{children}</strong>,
    em: ({ children }: any) => <em>{children}</em>,
    link: ({ value, children }: any) => (
      <a href={value?.href} target={value?.blank ? '_blank' : undefined} rel={[value?.blank ? 'noopener noreferrer' : '', value?.nofollow ? 'nofollow' : ''].filter(Boolean).join(' ') || undefined}>{children}</a>
    ),
  },
  types: { elprisInline: ({ value }: any) => <ElprisInline value={value} /> },
}

/**
 * Body card for one electricity company (block "elselskabKortBlock").
 * Prices, product, campaign and the affiliate link come live from the Google
 * Sheet (matched on the company's review slug); the text is the editor's.
 */
export async function ElselskabCard({ value }: { value: any }) {
  const es = value?.elselskab
  if (!es) return null
  const data = es.slug ? await getReviewSheetData(es.slug).catch(() => null) : null
  const best = data?.best
  const name = es.name
  const logo = data?.logo || es.logoUrl
  const title = replaceDateVars(value.customTitle || name)
  const cta = best ? `/go/${best.ctaSlug}/` : es.url
  const reviewHref = es.slug ? `/elselskaber-i-danmark/${es.slug}/` : null
  const pros: string[] = value.pros || []
  const cons: string[] = value.cons || []
  const img = value.imageUrl
  const tags = best ? [
    /^variabel$/i.test(best.priceType) ? 'Variabel pris' : best.priceType,
    /^ingen$/i.test(best.binding) ? 'Ingen binding' : `Binding: ${best.binding}`,
    ...(data!.products.some((p) => p.intro) ? ['Introtilbud'] : []),
  ] : []

  return (
    <article className={styles.card}>
      <header className={styles.head}>
        {value.rank ? <span className={styles.rank}>{value.rank}</span> : null}
        <div className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo ? <img src={logo} alt={name} loading="lazy" /> : <span>{name}</span>}
        </div>
        <div className={styles.titleWrap}>
          {value.label && <span className={styles.label}>{value.label}</span>}
          <h3 className={styles.title}>{title}</h3>
          {best ? (
            <div className={styles.sub}>{best.title}{data!.rank <= 3 ? <span className={styles.rankNote}>Nr. {data!.rank} billigst lige nu</span> : null}</div>
          ) : es.usp ? <div className={styles.sub}>{es.usp}</div> : null}
        </div>
        {best && (
          <div className={styles.price}>
            <strong>{kr(best.dk1.total)}</strong><span> kr./kWh</span>
            <small>ca. {kr(Math.round(best.dk1.monthly), 0)} kr. pr. måned</small>
          </div>
        )}
      </header>

      {tags.length > 0 && (
        <ul className={styles.tags}>{tags.map((t) => <li key={t}>{t}</li>)}</ul>
      )}

      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.image} src={`${img}?w=1200&auto=format`} alt={value.image?.alt || title} loading="lazy" />
      )}

      {value.customBody?.length > 0 && (
        <div className={styles.text}>
          <PortableText value={replaceDateVarsInBlocks(value.customBody)} components={textComponents} />
        </div>
      )}

      {(pros.length > 0 || cons.length > 0) && (
        <div className={styles.pc}>
          {pros.length > 0 && (
            <div>
              <div className={styles.pcHead}>Fordele</div>
              <ul>{pros.map((p) => <li key={p} className={styles.pro}>{p}</li>)}</ul>
            </div>
          )}
          {cons.length > 0 && (
            <div>
              <div className={styles.pcHead}>Ulemper</div>
              <ul>{cons.map((c) => <li key={c} className={styles.con}>{c}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      <footer className={styles.foot}>
        {best?.campaign ? <span className={styles.campaign}>{best.campaign}</span> : <span />}
        <div className={styles.actions}>
          {reviewHref && <a href={reviewHref} className={styles.review}>Læs anmeldelsen</a>}
          {cta && <a href={cta} target="_blank" rel="nofollow sponsored noopener" className={styles.cta}>Gå til {name}</a>}
        </div>
      </footer>
    </article>
  )
}
