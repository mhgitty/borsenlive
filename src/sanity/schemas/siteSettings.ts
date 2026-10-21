import { defineField, defineType } from 'sanity'

// ── Shared link fields ────────────────────────────────────────────────────────
// Pick a page, elselskab, guide or blog post — or type a custom URL.
const linkFields = [
  defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required() }),
  defineField({
    name: 'pageRef',
    title: 'Page (select from CMS)',
    type: 'reference',
    to: [{ type: 'page' }],
    description: 'Select a page — URL is auto-filled',
  }),
  defineField({
    name: 'elselskabRef',
    title: 'Elselskab (select from CMS)',
    type: 'reference',
    to: [{ type: 'elselskab' }],
    description: 'Select an electricity company — URL is auto-filled',
  }),
  defineField({
    name: 'postRef',
    title: 'Blog post (select from CMS)',
    type: 'reference',
    to: [{ type: 'post' }],
    description: 'Select a blog post — URL is auto-filled',
  }),
  defineField({
    name: 'guideRef',
    title: 'Guide (select from CMS)',
    type: 'reference',
    to: [{ type: 'guide' }],
    description: 'Select a guide — URL is auto-filled',
  }),
  defineField({
    name: 'url',
    title: 'URL (custom / external)',
    type: 'string',
    description: 'Only used if you don\'t select a reference above. E.g. /elselskaber/ or https://...',
  }),
]

// ── Shared preview for link items ───────────────────────────────────────────────
const linkPreview = {
  select: {
    title: 'label',
    pageRef: 'pageRef.slug.current',
    elselskabRef: 'elselskabRef.slug.current',
    postRef: 'postRef.slug.current',
    guideRef: 'guideRef.slug.current',
    url: 'url',
  },
  prepare({ title, pageRef, elselskabRef, postRef, guideRef, url }: any) {
    const resolved = pageRef ? `/${pageRef}/`
      : elselskabRef ? `/elselskaber/${elselskabRef}/`
      : postRef ? `/${postRef}/`
      : guideRef ? `/guides/${guideRef}/`
      : url
    return { title, subtitle: resolved }
  },
}

// ── 3rd-level item — can hold a 4th-level sub-menu ───────────────────────────────
const subSubNavItemFields = [
  ...linkFields,
  defineField({
    name: 'children',
    title: 'Sub-menu (nested)',
    type: 'array',
    description: 'Optional — another nested sub-menu level',
    of: [{
      type: 'object',
      name: 'subSubSubNavItem',
      fields: linkFields,
      preview: linkPreview,
    }],
  }),
]

// ── Sub-menu item (2nd level) — can hold its own nested sub-menus (3rd/4th level) ──
const subNavItemFields = [
  ...linkFields,
  defineField({
    name: 'children',
    title: 'Sub-menu (nested)',
    type: 'array',
    description: 'Optional — gives this dropdown entry its own nested flyout sub-menu',
    of: [{
      type: 'object',
      name: 'subSubNavItem',
      fields: subSubNavItemFields,
      preview: linkPreview,
    }],
  }),
]

// ── Top-level nav item ─────────────────────────────────────────────────────────
const navItemFields = [
  ...linkFields,
  defineField({
    name: 'icon',
    title: 'Icon',
    type: 'string',
    description: 'Solar icon name — renders in green duotone. Good picks: bolt, lightbulb, sun, leaf, home, chart-2, wallet, book-2, calculator, plug-circle. Browse all at icon-sets.iconify.design/solar',
  }),
  defineField({ name: 'isHighlighted', title: 'Highlighted (CTA button)', type: 'boolean', initialValue: false }),
  defineField({
    name: 'children',
    title: 'Dropdown',
    type: 'array',
    description: 'Add sub-items to create a dropdown menu',
    of: [{
      type: 'object',
      name: 'subNavItem',
      fields: subNavItemFields,
      preview: {
        select: {
    title: 'label',
    pageRef: 'pageRef.slug.current',
    elselskabRef: 'elselskabRef.slug.current',
    postRef: 'postRef.slug.current',
    guideRef: 'guideRef.slug.current',
    url: 'url',
  },
  prepare({ title, pageRef, elselskabRef, postRef, guideRef, url }: any) {
    const resolved = pageRef ? `/${pageRef}/`
      : elselskabRef ? `/elselskaber/${elselskabRef}/`
      : postRef ? `/${postRef}/`
      : guideRef ? `/guides/${guideRef}/`
      : url
    return { title, subtitle: resolved }
  },
      },
    }],
  }),
]

// ── Footer link fields ────────────────────────────────────────────────────────
const footerLinkFields = [...linkFields]

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: '⚙️ Site Settings',
  type: 'document',
  groups: [
    { name: 'general', title: '⚙️ General' },
    { name: 'header',  title: '🔝 Header' },
    { name: 'footer',  title: '🔻 Footer' },
  ],
  fields: [
    // ── Logos ───────────────────────────────────────────────────────────────────
    defineField({
      name: 'logo',
      title: 'Logo (default — dark)',
      type: 'image',
      group: 'general',
      description: 'Used in the header on light backgrounds.',
      options: { hotspot: false },
    }),
    defineField({
      name: 'logoWhite',
      title: 'Logo (white — for dark backgrounds)',
      type: 'image',
      group: 'general',
      description: 'Used in the footer and any dark-background areas.',
      options: { hotspot: false },
    }),

    // ── Default author ──────────────────────────────────────────────────────────
    defineField({
      name: 'relatedPagesTitle',
      title: 'Related pages heading',
      type: 'string',
      group: 'general',
      description: 'Site-wide heading for the related pages block at the bottom of pages, e.g. "Other pages you may like". Can be overridden per page.',
      initialValue: 'Andre sider du måske kan lide',
    }),
    defineField({
      name: 'defaultAuthor',
      title: 'Default author',
      type: 'reference',
      to: [{ type: 'author' }],
      group: 'general',
      description: 'Shown as author card at the bottom of all pages and elselskab reviews',
    }),

    // ── Header ──────────────────────────────────────────────────────────────────
    defineField({
      name: 'headerNav',
      title: 'Header navigation',
      type: 'array',
      group: 'header',
      description: 'Items in the top menu. Drag to reorder.',
      of: [{
        type: 'object',
        name: 'navItem',
        fields: navItemFields,
        preview: {
          select: {
            title: 'label',
            isHighlighted: 'isHighlighted',
            pageRef: 'pageRef.slug.current',
            elselskabRef: 'elselskabRef.slug.current',
            postRef: 'postRef.slug.current',
            guideRef: 'guideRef.slug.current',
            url: 'url',
            children: 'children',
          },
          prepare({ title, isHighlighted, pageRef, elselskabRef, postRef, guideRef, url, children }: any) {
            const resolvedUrl = pageRef ? `/${pageRef}/`
              : elselskabRef ? `/elselskaber/${elselskabRef}/`
              : postRef ? `/${postRef}/`
              : guideRef ? `/guides/${guideRef}/`
              : url
            const hasChildren = children?.length > 0
            return {
              title: `${isHighlighted ? '⚡ ' : ''}${hasChildren ? '▾ ' : ''}${title}`,
              subtitle: resolvedUrl,
            }
          },
        },
      }],
    }),

    // ── Footer ──────────────────────────────────────────────────────────────────
    defineField({
      name: 'footerTagline',
      title: 'Footer tagline',
      type: 'text',
      rows: 2,
      group: 'footer',
      initialValue: 'Bosonlife.dk sammenligner elselskaber og elpriser, så du nemt kan finde den bedste elaftale.',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social links',
      type: 'object',
      group: 'footer',
      description: 'Add a URL for any channel — the icon shows in the footer only when a link is filled in.',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({ name: 'facebook', title: 'Facebook', type: 'url' }),
        defineField({ name: 'x', title: 'X (Twitter)', type: 'url' }),
        defineField({ name: 'instagram', title: 'Instagram', type: 'url' }),
        defineField({ name: 'youtube', title: 'YouTube', type: 'url' }),
        defineField({ name: 'tiktok', title: 'TikTok', type: 'url' }),
        defineField({ name: 'twitch', title: 'Twitch', type: 'url' }),
        defineField({ name: 'linkedin', title: 'LinkedIn', type: 'url' }),
        defineField({ name: 'discord', title: 'Discord', type: 'url' }),
        defineField({ name: 'telegram', title: 'Telegram', type: 'url' }),
      ],
    }),
    defineField({
      name: 'footerColumns',
      title: 'Footer columns',
      type: 'array',
      group: 'footer',
      description: 'Up to 4 link columns shown in the footer grid.',
      validation: (r) => r.max(4),
      of: [{
        type: 'object',
        name: 'footerColumn',
        fields: [
          defineField({ name: 'title', title: 'Column title', type: 'string', validation: (r) => r.required() }),
          defineField({
            name: 'items',
            title: 'Links',
            type: 'array',
            of: [{
              type: 'object',
              name: 'navItem',
              fields: footerLinkFields,
              preview: {
                select: {
    title: 'label',
    pageRef: 'pageRef.slug.current',
    elselskabRef: 'elselskabRef.slug.current',
    postRef: 'postRef.slug.current',
    guideRef: 'guideRef.slug.current',
    url: 'url',
  },
  prepare({ title, pageRef, elselskabRef, postRef, guideRef, url }: any) {
    const resolved = pageRef ? `/${pageRef}/`
      : elselskabRef ? `/elselskaber/${elselskabRef}/`
      : postRef ? `/${postRef}/`
      : guideRef ? `/guides/${guideRef}/`
      : url
    return { title, subtitle: resolved }
  },
              },
            }],
          }),
        ],
        preview: {
          select: { title: 'title', items: 'items' },
          prepare({ title, items }: any) {
            return { title, subtitle: `${(items || []).length} links` }
          },
        },
      }],
    }),
    // ── Footer — disclaimer (long text above trust section) ─────────────────────
    defineField({
      name: 'footerLongDisclaimer',
      title: 'Disclaimer text (above trust icons)',
      type: 'text',
      rows: 4,
      group: 'footer',
      description: 'Longer disclaimer paragraph shown above trust icons. Leave blank to hide.',
    }),

    // ── Footer — media logos ─────────────────────────────────────────────────────
    defineField({
      name: 'footerMediaLogos',
      title: 'Media logos ("As seen in")',
      type: 'array',
      group: 'footer',
      description: 'Upload logos of media outlets. Each can have an optional link.',
      of: [{
        type: 'object',
        name: 'mediaLogo',
        fields: [
          defineField({ name: 'alt', title: 'Name / alt text', type: 'string', validation: r => r.required() }),
          defineField({ name: 'image', title: 'Logo image', type: 'image', options: { hotspot: false } }),
          defineField({ name: 'url', title: 'Link URL (optional)', type: 'string' }),
        ],
        preview: {
          select: { title: 'alt', media: 'image' },
          prepare({ title, media }: any) { return { title, media } },
        },
      }],
    }),

    // ── Footer — trust icons ─────────────────────────────────────────────────────
    defineField({
      name: 'footerTrustIcons',
      title: 'Trust icons',
      type: 'array',
      group: 'footer',
      description: 'Small badge images shown in the trust strip. Each can have an optional link.',
      of: [{
        type: 'object',
        name: 'trustIcon',
        fields: [
          defineField({ name: 'alt', title: 'Name / alt text', type: 'string', validation: r => r.required() }),
          defineField({ name: 'image', title: 'Icon image', type: 'image', options: { hotspot: false } }),
          defineField({ name: 'url', title: 'Link URL (optional)', type: 'string' }),
        ],
        preview: {
          select: { title: 'alt', media: 'image' },
          prepare({ title, media }: any) { return { title, media } },
        },
      }],
    }),

    // ── Footer — bottom bar ──────────────────────────────────────────────────────
    defineField({
      name: 'footerNote',
      title: 'Footer bottom bar — left text',
      type: 'string',
      group: 'footer',
      initialValue: '© Bosonlife.dk',
    }),
    defineField({
      name: 'footerDisclaimer',
      title: 'Footer bottom bar — right text',
      type: 'string',
      group: 'footer',
      initialValue: 'Siden indeholder affiliate-links · Priser kan ændre sig',
    }),
    defineField({
      name: 'footerBottomNav',
      title: 'Footer bottom bar — nav links',
      type: 'array',
      group: 'footer',
      description: 'Small links shown in the bottom bar (e.g. Privacy Policy, Terms).',
      of: [{
        type: 'object',
        name: 'bottomNavItem',
        fields: footerLinkFields,
        preview: {
          select: {
            title: 'label',
            pageRef: 'pageRef.slug.current',
            url: 'url',
          },
          prepare({ title, pageRef, url }: any) {
            return { title, subtitle: pageRef ? `/${pageRef}/` : url }
          },
        },
      }],
    }),
  ],
  preview: {
    prepare() { return { title: 'Site Settings' } },
  },
})
