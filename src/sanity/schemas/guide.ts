import { defineField, defineType } from 'sanity'
import { introField, bodyField, relatedPagesFields } from './page'
import { comparisonTableFields } from './comparisonTable'

/**
 * Guide — a page-like editorial document that lives under /guides/[slug]/.
 * Same content fields as a page.
 */
export const guideType = defineType({
  name: 'guide',
  title: 'Guides',
  type: 'document',
  __experimental_search: [
    { weight: 10, path: 'title' },
    { weight: 6, path: 'slug.current' },
    { weight: 3, path: 'metaTitle' },
    { weight: 0, path: 'body' },
    { weight: 0, path: 'intro' },
  ],
  groups: [
    { name: 'content', title: '📝 Indhold' },
    { name: 'seo',     title: '🔍 SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Titel (H1)', type: 'string', group: 'content', validation: (r) => r.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug', group: 'content',
      options: { source: 'title' },
      description: 'Bruges i URL: /guides/[slug]/',
      validation: (r) => r.required(),
    }),
    { ...introField, title: 'Intro', group: 'content' } as any,
    ...comparisonTableFields.map((f) => ({ ...f, group: 'content' })) as any,
    { ...bodyField, group: 'content' } as any,
    ...relatedPagesFields.map((f) => ({ ...f, group: 'content' })),
    defineField({ name: 'author', title: 'Forfatter', type: 'reference', to: [{ type: 'author' }], group: 'content', description: 'Vises i hero og som forfatterkort nederst' }),
    defineField({ name: 'factChecker', title: 'Faktatjekker', type: 'reference', to: [{ type: 'author' }], group: 'content' }),
    defineField({ name: 'hideAuthor', title: 'Skjul forfatter', type: 'boolean', group: 'content', initialValue: false }),
    defineField({ name: 'metaTitle', title: 'Meta title', type: 'string', group: 'seo' }),
    defineField({ name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3, group: 'seo' }),
    defineField({
      name: 'featuredImage', title: 'OG image', type: 'image', group: 'seo',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current' },
    prepare({ title, slug }: any) {
      return { title: title || '(untitled)', subtitle: `/guides/${slug || ''}/` }
    },
  },
})
