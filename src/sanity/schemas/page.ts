import { defineField, defineType } from 'sanity'

import { TableBlockInput } from '../components/TableBlockInput'
import { FaqBlockInput } from '../components/FaqBlockInput'
import { ProsConsBlockInput } from '../components/ProsConsBlockInput'
import { HeadingSelectInput } from '../components/HeadingSelectInput'
import { comparisonTableFields } from './comparisonTable'

// Minimal rich-text field for intro/lead text — supports inline formatting + links only
export const introField = defineField({
  name: 'intro',
  title: 'Intro text',
  type: 'array',
  of: [{
    type: 'block',
    styles: [{ title: 'Normal', value: 'normal' }],
    lists: [],
    marks: {
      decorators: [
        { title: 'Bold',   value: 'strong' },
        { title: 'Italic', value: 'em' },
      ],
      annotations: [
        {
          name: 'link',
          type: 'object',
          title: 'Link',
          fields: [
            { name: 'href',     type: 'url',     title: 'URL',
              validation: (r: any) => r.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }) },
            { name: 'blank',    type: 'boolean', title: 'Open in new tab', initialValue: false },
            { name: 'nofollow', type: 'boolean', title: 'Nofollow',        initialValue: false },
          ],
        },
      ],
    },
  }],
})

// ── Related pages (bottom of page) ────────────────────────────────────────────
// Shared by every content type that renders a "Related pages" block.
export const relatedPagesFields = [
  defineField({
    name: 'relatedTitle',
    title: 'Related pages heading (optional)',
    type: 'string',
    description: 'Overrides the site-wide default heading for this page only',
  }),
  defineField({
    name: 'relatedPages',
    title: 'Related pages',
    type: 'array',
    description: 'Pick the pages to link to at the bottom. Nothing is shown unless you add them here.',
    of: [{
      type: 'object',
      name: 'relatedPageItem',
      fields: [
        {
          name: 'page',
          title: 'Page',
          type: 'reference',
          to: [
            { type: 'page' }, { type: 'guide' }, { type: 'elselskab' }, { type: 'post' },
          ],
          validation: (r: any) => r.required(),
        },
        {
          name: 'label',
          title: 'Link text (optional)',
          type: 'string',
          description: 'What the link says on the frontend. Leave empty to use the page title.',
        },
      ],
      preview: {
        select: { label: 'label', title: 'page.title', name: 'page.name' },
        prepare({ label, title, name }: any) {
          const target = title || name || 'Page'
          return { title: label || target, subtitle: label ? target : undefined }
        },
      },
    }],
  }),
]

export const bodyField = defineField({
  name: 'body',
  title: 'Content',
  type: 'array',
  of: [
    {
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
        { title: 'Quote', value: 'blockquote' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              { name: 'href',     type: 'url',     title: 'URL' },
              { name: 'blank',    type: 'boolean', title: 'Open in new tab', initialValue: false },
              { name: 'nofollow', type: 'boolean', title: 'Nofollow (rel="nofollow")', initialValue: false },
            ],
          },
        ],
      },
    },
    {
      type: 'image',
      options: { hotspot: true },
      fields: [
        { name: 'alt', title: 'Alt text', type: 'string', description: 'Describe the image for accessibility and SEO' },
      ],
    },
    {
      type: 'object',
      name: 'calloutBlock',
      title: 'Info / Tip / Quote box',
      fields: [
        {
          name: 'variant', title: 'Type', type: 'string',
          options: {
            list: [
              { title: 'ℹ️ Info', value: 'info' },
              { title: '💡 Tip', value: 'tip' },
              { title: '⚠️ Warning', value: 'warning' },
              { title: '❝ Quote', value: 'quote' },
            ],
            layout: 'radio', direction: 'horizontal',
          },
          initialValue: 'info',
        },
        {
          name: 'author', title: 'Quoted by (optional)', type: 'reference',
          to: [{ type: 'author' }],
          description: 'Credits this box to an author — shows their photo, name and role underneath',
        },
        { name: 'title', title: 'Heading', type: 'string' },
        {
          name: 'body',
          title: 'Content',
          type: 'array',
          of: [{
            type: 'block',
            styles: [{ title: 'Normal', value: 'normal' }],
            lists: [
              { title: 'Bullet list', value: 'bullet' },
              { title: 'Numbered list', value: 'number' },
            ],
            marks: {
              decorators: [
                { title: 'Bold', value: 'strong' },
                { title: 'Italic', value: 'em' },
              ],
              annotations: [
                {
                  name: 'link',
                  type: 'object',
                  title: 'Link',
                  fields: [
                    { name: 'href', type: 'url', title: 'URL' },
                    { name: 'blank', type: 'boolean', title: 'Open in new tab' },
                  ],
                },
              ],
            },
          }],
        },
      ],
      preview: {
        select: { title: 'title', variant: 'variant' },
        prepare({ title, variant }: any) {
          const icons: Record<string, string> = { info: 'ℹ️', tip: '💡', warning: '⚠️' }
          return { title: title || 'Callout', subtitle: `${icons[variant] || 'ℹ️'} ${variant || 'info'}` }
        },
      },
    },
    {
      type: 'object',
      name: 'faqBlock',
      title: 'FAQ',
      components: { input: FaqBlockInput },
      fields: [
        {
          name: 'items', title: 'Questions & answers', type: 'array',
          of: [{
            type: 'object', name: 'faqItem',
            fields: [
              { name: 'question', title: 'Question', type: 'string' },
              { name: 'answer', title: 'Answer', type: 'text', rows: 3 },
            ],
            preview: { select: { title: 'question', subtitle: 'answer' } },
          }],
        },
      ],
      preview: {
        select: { items: 'items' },
        prepare({ items }: any) {
          return { title: 'FAQ', subtitle: `${(items || []).length} questions` }
        },
      },
    },
    {
      type: 'object',
      name: 'pageLinksBlock',
      title: 'Page Links (boxes)',
      description: 'A grid of link boxes pointing at pages you choose',
      fields: [
        {
          name: 'heading', title: 'Heading (optional)', type: 'string',
          description: 'Shown above the boxes, e.g. "Popular guides"',
        },
        {
          name: 'items', title: 'Links', type: 'array',
          of: [{
            type: 'object',
            name: 'pageLinkItem',
            fields: [
              {
                name: 'page', title: 'Page', type: 'reference',
                to: [
                  { type: 'page' }, { type: 'guide' }, { type: 'elselskab' }, { type: 'post' },
                ],
                validation: (r: any) => r.required(),
              },
              {
                name: 'label', title: 'Box text (optional)', type: 'string',
                description: 'What the box says. Leave empty to use the page title.',
              },
            ],
            preview: {
              select: { label: 'label', title: 'page.title', name: 'page.name' },
              prepare({ label, title, name }: any) {
                const target = title || name || 'Page'
                return { title: label || target, subtitle: label ? target : undefined }
              },
            },
          }],
        },
      ],
      preview: {
        select: { heading: 'heading', items: 'items' },
        prepare({ heading, items }: any) {
          const n = (items || []).length
          return {
            title: heading || 'Page Links',
            subtitle: `${n} ${n === 1 ? 'box' : 'boxes'}`,
          }
        },
      },
    },
    {
      type: 'object',
      name: 'prosConsBlock',
      title: 'Pros & Cons',
      components: { input: ProsConsBlockInput },
      fields: [
        { name: 'title', title: 'Heading (optional)', type: 'string' },
        { name: 'pros', title: 'Pros ✅', type: 'array', of: [{ type: 'string' }] },
        { name: 'cons', title: 'Cons ❌', type: 'array', of: [{ type: 'string' }] },
      ],
      preview: {
        select: { title: 'title', pros: 'pros', cons: 'cons' },
        prepare({ title, pros, cons }: any) {
          return { title: title || 'Pros & Cons', subtitle: `✅ ${(pros || []).length}  ❌ ${(cons || []).length}` }
        },
      },
    },
    {
      type: 'object',
      name: 'latestPostsBlock',
      title: 'Latest articles',
      fields: [
        { name: 'title', title: 'Heading', type: 'string', initialValue: 'Latest guides & articles' },
        {
          name: 'count', title: 'Number of articles', type: 'number',
          options: { list: [2, 3, 4, 6], layout: 'radio', direction: 'horizontal' },
          initialValue: 4,
        },
        { name: 'showViewAll', title: 'Show "View all" link', type: 'boolean', initialValue: true },
      ],
      preview: {
        select: { title: 'title', count: 'count' },
        prepare({ title, count }: any) {
          return { title: title || 'Latest articles', subtitle: `${count || 4} articles` }
        },
      },
    },
    {
      type: 'object',
      name: 'dropdownBlock',
      title: 'Dropdown / Accordion',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          description: 'The clickable heading shown when collapsed.',
          validation: (r: any) => r.required(),
        },
        {
          name: 'content',
          title: 'Content',
          type: 'array',
          description: 'The text shown when expanded.',
          of: [{
            type: 'block',
            styles: [
              { title: 'Normal', value: 'normal' },
              { title: 'H3', value: 'h3' },
              { title: 'H4', value: 'h4' },
            ],
            lists: [
              { title: 'Bullet', value: 'bullet' },
              { title: 'Numbered', value: 'number' },
            ],
            marks: {
              decorators: [
                { title: 'Bold', value: 'strong' },
                { title: 'Italic', value: 'em' },
              ],
              annotations: [{
                name: 'link', type: 'object', title: 'Link',
                fields: [
                  { name: 'href', type: 'url', title: 'URL', validation: (r: any) => r.uri({ scheme: ['http', 'https', 'mailto'] }) },
                  { name: 'blank', type: 'boolean', title: 'Open in new tab', initialValue: false },
                ],
              }],
            },
          }],
        },
        {
          name: 'defaultOpen',
          title: 'Open by default',
          type: 'boolean',
          initialValue: false,
          description: 'If enabled, the dropdown will be expanded when the page loads.',
        },
      ],
      preview: {
        select: { title: 'title', defaultOpen: 'defaultOpen' },
        prepare({ title, defaultOpen }: any) {
          return { title: `▾ ${title || 'Dropdown'}`, subtitle: defaultOpen ? 'Open by default' : 'Collapsed by default' }
        },
      },
    },
    {
      type: 'object',
      name: 'ctaButton',
      title: 'CTA Button',
      fields: [
        { name: 'text', title: 'Button text', type: 'string' },
        { name: 'url',  title: 'URL',         type: 'url' },
      ],
      preview: {
        select: { title: 'text', subtitle: 'url' },
        prepare({ title, subtitle }: any) {
          return { title: title || 'CTA Button', subtitle: subtitle || '' }
        },
      },
    },
    // ── Elselskab card ───────────────────────────────────────────────────────
    {
      type: 'object',
      name: 'elselskabKortBlock',
      title: '⚡ Elselskab-kort',
      fields: [
        {
          name: 'elselskab',
          title: 'Vælg elselskab',
          type: 'reference',
          to: [{ type: 'elselskab' }],
          validation: (r: any) => r.required(),
        },
        { name: 'customTitle', title: 'Titel (valgfri)', type: 'string' },
        { name: 'image', title: 'Billede (valgfrit)', type: 'image', options: { hotspot: true } },
        {
          name: 'customBody',
          title: 'Brødtekst',
          type: 'array',
          of: [{ type: 'block', styles: [{ title: 'Normal', value: 'normal' }], lists: [{ title: 'Bullet list', value: 'bullet' }, { title: 'Numbered list', value: 'number' }], marks: { decorators: [{ title: 'Bold', value: 'strong' }, { title: 'Italic', value: 'em' }] } }],
        },
        { name: 'pros', title: '✅ Fordele', type: 'array', of: [{ type: 'string' }] },
        { name: 'cons', title: '❌ Ulemper', type: 'array', of: [{ type: 'string' }] },
      ],
      preview: {
        select: { customTitle: 'customTitle', name: 'elselskab.name', logo: 'elselskab.logo' },
        prepare({ customTitle, name, logo }: any) {
          return { title: customTitle || name || 'Elselskab-kort', subtitle: name, media: logo }
        },
      },
    },
    {
      type: 'object',
      name: 'detailsTable',
      title: 'Details Table (Area / Details)',
      fields: [
        {
          name: 'rows',
          title: 'Rows',
          type: 'array',
          of: [{
            type: 'object',
            name: 'tableRow',
            title: 'Row',
            fields: [
              { name: 'area', title: 'Area', type: 'string' },
              { name: 'details', title: 'Details', type: 'string' },
            ],
            preview: {
              select: { area: 'area', details: 'details' },
              prepare({ area, details }: any) { return { title: area, subtitle: details } },
            },
          }],
        },
      ],
      preview: {
        select: { rows: 'rows' },
        prepare({ rows }: any) {
          return { title: 'Details Table', subtitle: `${(rows || []).length} rows` }
        },
      },
    },
    {
      type: 'object',
      name: 'tableBlock',
      title: 'Table',
      components: { input: TableBlockInput },
      fields: [
        { name: 'title', title: 'Heading (optional)', type: 'string' },
        {
          name: 'headers',
          title: 'Column headers',
          type: 'array',
          of: [{ type: 'string' }],
        },
        {
          name: 'rows',
          title: 'Rows',
          type: 'array',
          of: [{
            type: 'object',
            name: 'tableRow',
            title: 'Row',
            fields: [{ name: 'cells', title: 'Cells', type: 'array', of: [{ type: 'string' }] }],
            preview: {
              select: { cells: 'cells' },
              prepare({ cells }: any) { return { title: (cells || []).join(' | ') || '(empty row)' } },
            },
          }],
        },
      ],
      preview: {
        select: { title: 'title', headers: 'headers', rows: 'rows' },
        prepare({ title, headers, rows }: any) {
          return { title: title || 'Table', subtitle: `${(headers || []).length} columns · ${(rows || []).length} rows` }
        },
      },
    },
    {
      type: 'object',
      name: 'howToBlock',
      title: 'How-to',
      fields: [
        {
          name: 'title',
          title: 'Section title',
          type: 'string',
          initialValue: 'How It Works',
        },
        {
          name: 'intro',
          title: 'Intro (optional)',
          type: 'text',
          rows: 3,
          description: 'Short text shown under the title, above the steps',
        },
        {
          name: 'totalMinutes',
          title: 'Time to complete (minutes, optional)',
          type: 'number',
          description: 'Shown as a "≈ X min" badge and added to the HowTo structured data',
          validation: (r: any) => r.min(1).max(1000),
        },
        {
          name: 'items',
          title: 'Steps',
          type: 'array',
          of: [{
            type: 'object',
            name: 'howToItem',
            title: 'Step',
            fields: [
              { name: 'title', title: 'Step title', type: 'string' },
              {
                name: 'body', title: 'Body text', type: 'array',
                of: [{
                  type: 'block',
                  styles: [{ title: 'Normal', value: 'normal' }],
                  lists: [],
                  marks: {
                    decorators: [
                      { title: 'Bold', value: 'strong' },
                      { title: 'Italic', value: 'em' },
                    ],
                    annotations: [{
                      name: 'link', type: 'object', title: 'Link',
                      fields: [
                        { name: 'href', type: 'url', title: 'URL',
                          validation: (r: any) => r.uri({ scheme: ['http', 'https', 'mailto', 'tel'], allowRelative: true }) },
                        { name: 'blank', type: 'boolean', title: 'Open in new tab', initialValue: false },
                        { name: 'nofollow', type: 'boolean', title: 'Nofollow', initialValue: false },
                      ],
                    }],
                  },
                }],
              },
            ],
            preview: {
              select: { title: 'title' },
            },
          }],
        },
      ],
      preview: {
        select: { title: 'title', items: 'items' },
        prepare({ title, items }: any) {
          return { title: title || 'How-to', subtitle: `${(items || []).length} steps` }
        },
      },
    },
  ],
})

export const pageType = defineType({
  name: 'page',
  title: 'Pages',
  type: 'document',
  __experimental_search: [
    { weight: 10, path: 'title' },
    { weight: 6, path: 'slug.current' },
    { weight: 3, path: 'metaTitle' },
    { weight: 0, path: 'body' },
    { weight: 0, path: 'intro' },
  ],
  groups: [
    { name: 'content', title: 'Content' },
    { name: 'seo',     title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', group: 'content', validation: (r) => r.required() }),
    defineField({ name: 'slug',  title: 'Slug',  type: 'slug',   group: 'content', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({
      name: 'parent',
      title: 'Parent page',
      type: 'reference',
      weak: true,
      to: [{ type: 'page' }],
      group: 'content',
      options: {
        disableNew: true,
        filter: ({ document }: any) => ({
          filter: '_type == "page" && _id != $id && !(_id in path("drafts.**"))',
          params: {
            id: (document as any)._id?.replace(/^drafts\./, '') || '',
          },
        }),
      },
      description: 'Optional — nests this page under a parent (e.g. /parent/this-page/). ',
    }),
    { ...introField, title: 'Intro', group: 'content' } as any,
    ...comparisonTableFields.map(f => ({ ...f, group: 'content' })) as any,
    { ...bodyField, group: 'content' } as any,
    defineField({
      name: 'heroQuickLinks',
      title: 'Custom quick links (hero)',
      type: 'array',
      group: 'content',
      description: 'Extra hero buttons that scroll to an H2 heading in the body of this page.',
      of: [{
        type: 'object',
        name: 'heroQuickLink',
        fields: [
          defineField({ name: 'label', title: 'Button text', type: 'string', validation: (r: any) => r.required() }),
          defineField({
            name: 'headingText',
            title: 'Target H2 heading',
            type: 'string',
            components: { input: HeadingSelectInput },
            description: 'Pick an H2 from the body above. The button scrolls there.',
            validation: (r: any) => r.required(),
          }),
        ],
        preview: {
          select: { title: 'label', subtitle: 'headingText' },
          prepare({ title, subtitle }: any) {
            return { title: title || 'Quick link', subtitle: subtitle ? `→ ${subtitle}` : undefined }
          },
        },
      }],
    }),
    ...relatedPagesFields.map((f) => ({ ...f, group: 'content' })),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      group: 'content',
      description: 'Shown in hero and as author card at the bottom of the page',
    }),
    defineField({
      name: 'factChecker',
      title: 'Fact checker',
      type: 'reference',
      to: [{ type: 'author' }],
      group: 'content',
      description: 'Shown next to the author in the hero section',
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Last updated',
      type: 'date',
      group: 'content',
      readOnly: true,
      hidden: true,
      description: 'Automatic — the hero and structured data now use the real publish time. This field is no longer used.',
    }),
    defineField({
      name: 'hideAuthor',
      title: 'Hide author',
      type: 'boolean',
      group: 'content',
      initialValue: false,
      description: 'When enabled, the author bar and author card are not shown on this page (e.g. About us, Privacy Policy)',
    }),
    defineField({ name: 'metaTitle', title: 'Meta title', type: 'string', group: 'seo' }),
    defineField({ name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3, group: 'seo' }),
    defineField({
      name: 'featuredImage', title: 'OG image', type: 'image', group: 'seo',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
      a1: 'parent.slug.current',
      a2: 'parent.parent.slug.current',
      a3: 'parent.parent.parent.slug.current',
      a4: 'parent.parent.parent.parent.slug.current',
    },
    prepare({ title, slug, a1, a2, a3, a4 }: any) {
      const parts = [a4, a3, a2, a1, slug].filter(Boolean)
      return { title: title || '(untitled)', subtitle: `/${parts.join('/')}/` }
    },
  },
})
