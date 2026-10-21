import { defineField, defineType } from 'sanity'
import { bodyField } from './page'

export const postType = defineType({
  name: 'post',
  title: 'Blog Posts',
  type: 'document',
  __experimental_search: [
    { weight: 10, path: 'title' },
    { weight: 6, path: 'slug.current' },
    { weight: 3, path: 'metaTitle' },
    { weight: 2, path: 'excerpt' },
    { weight: 0, path: 'body' },
  ],
  groups: [
    { name: 'content', title: 'Content' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', group: 'content', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', group: 'content', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3, group: 'content' }),
    defineField({
      name: 'featuredImage', title: 'Featured image', type: 'image', group: 'content',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alt text', type: 'string', description: 'Describe the image for search engines and screen readers' }),
      ],
    }),
    defineField({ name: 'category', title: 'Category', type: 'reference', to: [{ type: 'category' }], group: 'content' }),
    defineField({ name: 'author', title: 'Author', type: 'reference', to: [{ type: 'author' }], group: 'content' }),
    { ...bodyField, group: 'content' } as any,
    defineField({ name: 'readingTime', title: 'Reading time (minutes)', type: 'number', group: 'content' }),
    defineField({ name: 'publishedAt', title: 'Published date', type: 'datetime', group: 'content' }),
    defineField({ name: 'lastUpdated', title: 'Last updated', type: 'datetime', group: 'content', readOnly: true, hidden: true, description: 'Automatic — the hero and structured data now use the real publish time. This field is no longer used.' }),
    defineField({ name: 'metaTitle', title: 'Meta title', type: 'string', group: 'seo' }),
    defineField({ name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3, group: 'seo' }),
    defineField({
      name: 'ogImage', title: 'OG image (optional)', type: 'image', group: 'seo',
      description: 'Override the featured image with a separate image for social media',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'excerpt', media: 'featuredImage' },
  },
})
