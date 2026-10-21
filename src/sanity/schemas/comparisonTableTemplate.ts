import { defineField, defineType } from 'sanity'

/**
 * Standalone template document for comparison tables.
 * Pages reference a template — change the template once, all pages update.
 */
export const comparisonTableTemplateType = defineType({
  name: 'comparisonTableTemplate',
  title: '📊 Sammenligningsskabeloner',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Skabelonnavn',
      type: 'string',
      description: 'Internt navn — vises kun i Studio. F.eks. "Forside – billigste spotpris"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'tableType',
      title: 'Vis',
      type: 'string',
      options: {
        list: [
          { title: '📄 Elaftaler (priser)', value: 'elaftale' },
          { title: '⚡ Elselskaber', value: 'elselskab' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'elaftale',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'elaftaler',
      title: 'Elaftaler',
      type: 'array',
      description: 'Træk for at ændre rækkefølge. Kun aktive aftaler kan tilføjes.',
      of: [{ type: 'reference', to: [{ type: 'elaftale' }], options: { disableNew: true, filter: 'active != false' } }],
      hidden: ({ document }: any) => document?.tableType !== 'elaftale',
    }),
    defineField({
      name: 'elselskaber',
      title: 'Elselskaber',
      type: 'array',
      description: 'Træk for at ændre rækkefølge.',
      of: [{ type: 'reference', to: [{ type: 'elselskab' }], options: { disableNew: true } }],
      hidden: ({ document }: any) => document?.tableType !== 'elselskab',
    }),
  ],
  preview: {
    select: { title: 'title', tableType: 'tableType', elaftaler: 'elaftaler', elselskaber: 'elselskaber' },
    prepare({ title, tableType, elaftaler, elselskaber }: any) {
      const isAftale = tableType !== 'elselskab'
      const count = isAftale ? (elaftaler || []).length : (elselskaber || []).length
      return { title, subtitle: `${count} ${isAftale ? 'elaftaler' : 'elselskaber'}` }
    },
  },
})
