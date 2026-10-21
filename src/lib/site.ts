// Central site constants — change here, not in individual routes.
export const BASE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://borsenlive.dk').replace(/\/$/, '')
export const SITE_NAME = 'Borsenlive'
export const SITE_DOMAIN = 'Borsenlive.dk'
/** BCP-47 language tag used in <html lang> and JSON-LD inLanguage. */
export const LANG = 'da-DK'
/** Locale used for date formatting. */
export const DATE_LOCALE = 'da-DK'
