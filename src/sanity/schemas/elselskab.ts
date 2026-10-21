import { defineField, defineType } from 'sanity'
import { bodyField, introField, relatedPagesFields } from './page'

/**
 * Elselskab — an electricity company with its own review page at
 * /elselskaber/[slug]/. Products/prices live in separate `elaftale` documents
 * that reference the company, so one company can have several agreements.
 */
export const elselskabType = defineType({
  name: 'elselskab',
  title: 'Elselskaber',
  type: 'document',
  __experimental_search: [
    { weight: 10, path: 'name' },
    { weight: 8, path: 'titel' },
    { weight: 6, path: 'slug.current' },
    { weight: 3, path: 'metaTitle' },
    { weight: 0, path: 'body' },
  ],
  groups: [
    { name: 'info', title: '⚡ Info' },
    { name: 'content', title: '📝 Indhold' },
    { name: 'seo', title: '🔍 SEO' },
  ],
  fields: [
    // ── Identity ─────────────────────────────────────────────────────────────
    defineField({
      name: 'name',
      title: 'Navn',
      type: 'string',
      group: 'info',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'titel',
      title: 'Titel (H1)',
      type: 'string',
      group: 'info',
      description: 'Vises som H1 på anmeldelsessiden. Hvis tom: "[Navn] anmeldelse".',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'info',
      options: { source: 'name' },
      description: 'Bruges i URL: /elselskaber/[slug]/',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      group: 'info',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
    defineField({
      name: 'score',
      title: 'Vores vurdering (0–10)',
      type: 'number',
      group: 'info',
      validation: (r) => r.min(0).max(10),
    }),
    defineField({
      name: 'usp',
      title: 'USP',
      type: 'string',
      group: 'info',
      description: 'Kort salgsargument — vises på kort og i sammenligninger, f.eks. "Billigste spotpris uden binding"',
    }),

    // ── Company facts ────────────────────────────────────────────────────────
    defineField({
      name: 'priceAreas',
      title: 'Prisområder',
      type: 'array',
      group: 'info',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Vestdanmark (DK1)', value: 'DK1' },
          { title: 'Østdanmark (DK2)', value: 'DK2' },
        ],
        layout: 'grid',
      },
      initialValue: ['DK1', 'DK2'],
    }),
    defineField({ name: 'founded', title: 'Grundlagt', type: 'string', group: 'info', description: 'F.eks. "2015"' }),
    defineField({ name: 'trustpilotScore', title: 'Trustpilot-score (0–5)', type: 'number', group: 'info', validation: (r) => r.min(0).max(5) }),
    defineField({ name: 'trustpilotUrl', title: 'Trustpilot-link', type: 'url', group: 'info' }),
    defineField({ name: 'greenEnergy', title: 'Tilbyder grøn strøm', type: 'boolean', group: 'info', initialValue: false }),
    defineField({ name: 'hasApp', title: 'Har app', type: 'boolean', group: 'info', initialValue: false }),
    defineField({ name: 'evCharging', title: 'Tilbyder ladeboks / elbil-aftale', type: 'boolean', group: 'info', initialValue: false }),
    defineField({ name: 'customerService', title: 'Kundeservice', type: 'string', group: 'info', description: 'F.eks. "Telefon, chat og mail"' }),

    // ── Affiliate ────────────────────────────────────────────────────────────
    defineField({
      name: 'url',
      title: 'Affiliate-link',
      type: 'url',
      group: 'info',
      description: 'Bruges på "Gå til elselskab"-knappen. Kan også være et /go/-link.',
      validation: (r) => r.uri({ scheme: ['http', 'https'], allowRelative: true }),
    }),
    defineField({ name: 'ctaText', title: 'Knaptekst', type: 'string', group: 'info', description: 'Standard: "Gå til [Navn]"' }),
    defineField({ name: 'offer', title: 'Aktuelt tilbud', type: 'string', group: 'info', description: 'F.eks. "3 måneder uden abonnement"' }),
    defineField({ name: 'terms', title: 'Vilkår (kort)', type: 'text', rows: 2, group: 'info' }),

    // ── Content ──────────────────────────────────────────────────────────────
    { ...introField, title: 'Intro', group: 'content' } as any,
    defineField({ name: 'pros', title: '✅ Fordele', type: 'array', of: [{ type: 'string' }], group: 'content' }),
    defineField({ name: 'cons', title: '❌ Ulemper', type: 'array', of: [{ type: 'string' }], group: 'content' }),
    { ...bodyField, group: 'content' } as any,
    ...relatedPagesFields.map((f) => ({ ...f, group: 'content' })),
    defineField({ name: 'author', title: 'Forfatter', type: 'reference', to: [{ type: 'author' }], group: 'content' }),

    // ── SEO ──────────────────────────────────────────────────────────────────
    defineField({ name: 'metaTitle', title: 'Meta title', type: 'string', group: 'seo' }),
    defineField({ name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3, group: 'seo' }),
    defineField({
      name: 'ogImage', title: 'OG image', type: 'image', group: 'seo',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
  ],
  orderings: [
    { title: 'Score (høj–lav)', name: 'scoreDesc', by: [{ field: 'score', direction: 'desc' }] },
    { title: 'Navn A–Å', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'name', subtitle: 'usp', media: 'logo', score: 'score' },
    prepare({ title, subtitle, media, score }: any) {
      return { title: score != null ? `${title} · ★ ${score}` : title, subtitle, media }
    },
  },
})
