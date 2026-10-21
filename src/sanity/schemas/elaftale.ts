import { defineField, defineType } from 'sanity'

/**
 * Elaftale — one electricity product/agreement from an elselskab (e.g.
 * "Spotpris", "Fastpris 12 mdr."). Shown in comparison tables and on the
 * company's review page. Has no page of its own.
 */
export const elaftaleType = defineType({
  name: 'elaftale',
  title: 'Elaftaler',
  type: 'document',
  fields: [
    defineField({
      name: 'elselskab',
      title: 'Elselskab',
      type: 'reference',
      to: [{ type: 'elselskab' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'name',
      title: 'Produktnavn',
      type: 'string',
      description: 'F.eks. "Spotpris" eller "Fastpris 12 mdr."',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'active',
      title: 'Aktiv',
      type: 'boolean',
      initialValue: true,
      description: 'Slå fra for at skjule aftalen overalt uden at slette den',
    }),
    defineField({
      name: 'priceType',
      title: 'Pristype',
      type: 'string',
      options: {
        list: [
          { title: 'Variabel (spotpris)', value: 'spot' },
          { title: 'Fastpris', value: 'fixed' },
          { title: 'Variabel (månedspris)', value: 'variable' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'spot',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'priceAreas',
      title: 'Prisområder',
      type: 'array',
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
    defineField({
      name: 'monthlyFee',
      title: 'Abonnement (kr./md.)',
      type: 'number',
      validation: (r) => r.min(0),
    }),
    defineField({
      name: 'markup',
      title: 'Tillæg (øre/kWh)',
      type: 'number',
      description: 'Elselskabets tillæg oven i spotprisen (inkl. moms)',
      hidden: ({ document }: any) => document?.priceType === 'fixed',
    }),
    defineField({
      name: 'fixedPrice',
      title: 'Fast kWh-pris (øre/kWh)',
      type: 'number',
      hidden: ({ document }: any) => document?.priceType !== 'fixed',
    }),
    defineField({ name: 'bindingMonths', title: 'Binding (måneder)', type: 'number', initialValue: 0, description: '0 = ingen binding' }),
    defineField({ name: 'noticePeriod', title: 'Opsigelse', type: 'string', description: 'F.eks. "Løbende måned + 1 måned"' }),
    defineField({ name: 'introOffer', title: 'Introtilbud', type: 'string', description: 'F.eks. "Gratis abonnement i 3 mdr."' }),
    defineField({ name: 'greenPower', title: 'Grøn strøm', type: 'boolean', initialValue: false }),
    defineField({
      name: 'url',
      title: 'Affiliate-link (valgfrit)',
      type: 'url',
      description: 'Overskriver elselskabets link for netop denne aftale',
      validation: (r) => r.uri({ scheme: ['http', 'https'], allowRelative: true }),
    }),
    defineField({ name: 'highlight', title: 'Fremhævet tekst', type: 'string', description: 'Lille badge, f.eks. "Mest populær"' }),
    defineField({ name: 'notes', title: 'Noter (vises under aftalen)', type: 'text', rows: 2 }),
  ],
  preview: {
    select: { name: 'name', company: 'elselskab.name', media: 'elselskab.logo', priceType: 'priceType', active: 'active', fee: 'monthlyFee' },
    prepare({ name, company, media, priceType, active, fee }: any) {
      const type = priceType === 'fixed' ? 'Fastpris' : priceType === 'variable' ? 'Variabel' : 'Spotpris'
      return {
        title: `${active === false ? '⏸ ' : ''}${company || '?'} — ${name || ''}`,
        subtitle: `${type}${fee != null ? ` · ${fee} kr./md.` : ''}`,
        media,
      }
    },
  },
})
