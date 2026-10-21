import { pageType } from './page'
import { postType } from './post'
import { authorType } from './author'
import { categoryType } from './category'
import { homepageType } from './homepage'
import { comparisonTableTemplateType } from './comparisonTableTemplate'
import { siteSettingsType } from './siteSettings'
import { redirectType } from './redirect'
import { pageRedirectType } from './pageRedirect'
import { guideType } from './guide'
import { elselskabType } from './elselskab'
import { elaftaleType } from './elaftale'

export const schemaTypes = [
  siteSettingsType,
  homepageType,
  elselskabType,
  elaftaleType,
  comparisonTableTemplateType,
  postType,
  pageType,
  guideType,
  authorType,
  categoryType,
  redirectType,
  pageRedirectType,
]
