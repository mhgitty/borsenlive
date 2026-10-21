import { defineField, defineType } from 'sanity'
import { bodyField, introField } from './page'
import { comparisonTableFields } from './comparisonTable'

export const homepageType = defineType({
  name: 'homepage',
  title: '🏠 Homepage',
  type: 'document',
  groups: [
    { name: 'hero',    title: 'Hero' },
    { name: 'content', title: 'Content' },
    { name: 'seo',     title: 'SEO' },
  ],
  fields: [
    // Hero
    defineField({
      name: 'heroHeading',
      title: 'Hero heading',
      type: 'string',
      group: 'hero',
      initialValue: 'Find det billigste elselskab',
    }),
    { ...introField, title: 'Intro', group: 'hero', description: 'Short text below the heading in the hero section' } as any,

    // Comparison table (renders above body text)
    ...comparisonTableFields.map(f => ({ ...f, group: 'content' })) as any,

    // Body content
    { ...bodyField, group: 'content' } as any,

    defineField({
      name: 'howItWorksTitle',
      title: 'Section title',
      type: 'string',
      group: 'content',
      initialValue: 'Sådan virker det',
    }),
    defineField({
      name: 'howItWorksItems',
      title: 'Steps',
      type: 'array',
      group: 'content',
      of: [{
        type: 'object',
        name: 'howItWorksItem',
        title: 'Step',
        fields: [
          { name: 'title', title: 'Title', type: 'string' },
          { name: 'body',  title: 'Body text', type: 'text', rows: 4 },
        ],
        preview: {
          select: { title: 'title', subtitle: 'body' },
        },
      }],
    }),

    // ── Section headings ───────────────────────────────────────────────────
    defineField({ name: 'latestSectionTitle',    title: 'Latest section heading',          type: 'string', group: 'content', initialValue: 'Seneste artikler' }),
    defineField({ name: 'elselskaberTitle',      title: 'Elselskaber section heading',     type: 'string', group: 'content', initialValue: 'Populære elselskaber' }),
    defineField({ name: 'showElselskaber',       title: 'Show elselskaber section',        type: 'boolean', group: 'content', initialValue: true }),

    // ── Trust section ──────────────────────────────────────────────────────
    defineField({
      name: 'trustItems',
      title: 'Trust items',
      type: 'array',
      group: 'content',
      description: 'Three trust/USP cards shown at the bottom of the homepage. Each uses a Solar icon.',
      of: [{
        type: 'object',
        name: 'trustItem',
        title: 'Trust item',
        fields: [
          defineField({ name: 'icon',  title: 'Solar icon name (e.g. "shield-check")', type: 'string' }),
          defineField({ name: 'title', title: 'Title', type: 'string', validation: (r: any) => r.required() }),
          defineField({ name: 'body',  title: 'Body text', type: 'text', rows: 3, validation: (r: any) => r.required() }),
        ],
        preview: {
          select: { title: 'title', subtitle: 'body' },
          prepare: ({ title, subtitle }: any) => ({ title: title || 'Trust item', subtitle }),
        },
      }],
      validation: (r: any) => r.max(3),
    }),

    // SEO
    defineField({ name: 'metaTitle', title: 'Meta title', type: 'string', group: 'seo', initialValue: 'Sammenlign elselskaber og elpriser' }),
    defineField({ name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3, group: 'seo', initialValue: 'Find det billigste elselskab. Vi sammenligner spotpriser, fastpriser og abonnementer hos alle de store elselskaber.' }),
    defineField({
      name: 'featuredImage', title: 'OG image', type: 'image', group: 'seo',
      description: 'Image shown when the page is shared on social media',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'heroHeading' },
    prepare({ title }) {
      return { title: title || 'Homepage' }
    },
  },
})
