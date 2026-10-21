import { defineConfig, type InitialValueTemplateItem } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { media } from 'sanity-plugin-media'
import { schemaTypes } from './src/sanity/schemas'
import { WideStudioLayout } from './src/sanity/StudioLayout'
import { previewAction } from './src/sanity/previewAction'

export default defineConfig({
  name: 'default',
  title: 'Bosonlife.dk',
  basePath: '/studio',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,

  // "New elaftale" from inside a company's list pre-fills the company reference.
  templates: (prev: InitialValueTemplateItem[]) => [
    ...prev,
    {
      id: 'elaftale-for-company',
      title: 'Elaftale for elselskab',
      schemaType: 'elaftale',
      parameters: [{ name: 'companyId', type: 'string' }],
      value: (params: { companyId: string }) => ({
        elselskab: { _type: 'reference', _ref: params.companyId },
      }),
    },
  ],

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Indhold')
          .items([
            // ── Singletons ──────────────────────────────────────────────────
            S.listItem()
              .title('🏠 Homepage')
              .id('homepage')
              .child(
                S.document()
                  .schemaType('homepage')
                  .documentId('homepage')
              ),
            S.listItem()
              .title('⚙️ Site Settings')
              .id('siteSettings')
              .child(
                S.document()
                  .schemaType('siteSettings')
                  .documentId('siteSettings')
              ),
            S.divider(),

            // ── Elektricitet ───────────────────────────────────────────────
            S.listItem()
              .title('⚡ Elselskaber')
              .schemaType('elselskab')
              .child(
                S.documentTypeList('elselskab')
                  .title('Elselskaber')
                  .defaultOrdering([{ field: 'name', direction: 'asc' }])
              ),
            S.listItem()
              .title('📄 Elaftaler')
              .schemaType('elaftale')
              .child(
                S.list()
                  .title('Elaftaler')
                  .items([
                    S.listItem()
                      .title('Alle elaftaler')
                      .schemaType('elaftale')
                      .child(S.documentTypeList('elaftale').title('Alle elaftaler')),
                    S.listItem()
                      .title('Pr. elselskab')
                      .child(
                        S.documentTypeList('elselskab')
                          .title('Vælg elselskab')
                          .child((companyId: string) =>
                            S.documentTypeList('elaftale')
                              .title('Elaftaler')
                              .filter('_type == "elaftale" && elselskab._ref == $companyId')
                              .params({ companyId })
                              .initialValueTemplates([
                                S.initialValueTemplateItem('elaftale-for-company', { companyId }),
                              ])
                          )
                      ),
                  ])
              ),
            S.listItem()
              .title('📊 Sammenligningsskabeloner')
              .schemaType('comparisonTableTemplate')
              .child(S.documentTypeList('comparisonTableTemplate').title('Sammenligningsskabeloner')),
            S.divider(),

            // ── Content ──────────────────────────────────────────────────────
            S.listItem()
              .title('📄 Pages')
              .schemaType('page')
              .child(S.documentTypeList('page').title('Pages')),
            S.listItem()
              .title('📚 Guides')
              .schemaType('guide')
              .child(S.documentTypeList('guide').title('Guides')),

            // ── Shared / global content ──────────────────────────────────────
            S.listItem()
              .title('📝 Posts')
              .schemaType('post')
              .child(S.documentTypeList('post').title('All Posts')),
            S.listItem()
              .title('🔗 Redirects')
              .schemaType('redirect')
              .child(
                S.documentTypeList('redirect')
                  .title('Redirects (/go/...)')
              ),
            S.listItem()
              .title('↩ 301 Redirects')
              .schemaType('pageRedirect')
              .child(
                S.documentTypeList('pageRedirect')
                  .title('301 Redirects')
                  .defaultOrdering([{ field: 'from', direction: 'asc' }])
              ),
            S.divider(),
            S.listItem()
              .title('👤 Authors')
              .schemaType('author')
              .child(S.documentTypeList('author').title('Authors')),
            S.listItem()
              .title('🏷️ Categories')
              .schemaType('category')
              .child(S.documentTypeList('category').title('Categories')),
          ]),
    }),
    visionTool(),
    media(),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (prev, ctx) => {
      const PREVIEW_TYPES = ['homepage', 'post', 'page', 'guide', 'elselskab']
      if (PREVIEW_TYPES.includes(ctx.schemaType)) {
        return [previewAction, ...prev]
      }
      return prev
    },
  },

  studio: {
    components: {
      layout: WideStudioLayout,
    },
  },
})
