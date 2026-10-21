/**
 * Widgets ported from the WordPress plugins (Elselskab compare → ladebokse /
 * naturgas, and Elpris Chart). All are async Server Components (interactive
 * parts are separate 'use client' files) and can be rendered from Portable Text.
 *
 * SHORTCODE_WIDGETS — shortcode → component → props (shortcode attribute → prop)
 *
 *   [ladeboks_compare]                 → <LadeboksCompare />                    (attr brand → brand, optional)
 *   [ladeboks_brand brand="evdk"]      → <LadeboksBrand brand="evdk" />         (brand → brand, required;
 *                                        same as <LadeboksCompare brand="evdk" />; match is case-insensitive
 *                                        against the sheet's "Udbyder" column, e.g. "DCC Energi", "nrgi zapp")
 *   [naturgas_compare]                 → <NaturgasCompare />                    (no attributes)
 *   [elpris_chart]                     → <ElprisChart />                        (area → area: "DK1" | "DK2", default "DK2")
 *   [elpris_topkort]                   → <ElprisTopkort />                      (no attributes)
 *   [elpris_prisudvikling]             → <ElprisPrisudvikling />                (no attributes; optional area prop, default "DK2")
 *   [elpris_dag]                       → <ElprisDag />  = <ElprisTable type="day" />  (no attributes)
 *   [elpris_nu]                        → <ElprisNu />   = <ElprisTable type="now" />  (no attributes)
 *   [elpris_netselskab adresse="..."]  → <ElprisNetselskab adresse="..." />     (adresse → adresse)
 *
 * Not in these plugins (registered by elselskab-compare.php, not ported here):
 *   [elpris_month provider=".." area=".."], [elpris], [elselskab_compare], [elselskab_promo], [elselskab_<provider>]
 */
export { LadeboksCompare, LadeboksBrand } from './LadeboksCompare'
export { NaturgasCompare } from './NaturgasCompare'
export { ElprisChart } from './ElprisChart'
export { ElprisTopkort } from './ElprisTopkort'
export { ElprisPrisudvikling } from './ElprisPrisudvikling'
export { ElprisTable, ElprisDag, ElprisNu } from './ElprisTable'
export { ElprisNetselskab } from './ElprisNetselskab'

/** Machine-readable version of the table above, for the shortcode importer. */
export const SHORTCODE_WIDGETS = {
  ladeboks_compare: { component: 'LadeboksCompare', props: { brand: 'brand' } },
  ladeboks_brand: { component: 'LadeboksBrand', props: { brand: 'brand' } },
  naturgas_compare: { component: 'NaturgasCompare', props: {} },
  elpris_chart: { component: 'ElprisChart', props: { area: 'area' } },
  elpris_topkort: { component: 'ElprisTopkort', props: {} },
  elpris_prisudvikling: { component: 'ElprisPrisudvikling', props: {} },
  elpris_dag: { component: 'ElprisDag', props: {} },
  elpris_nu: { component: 'ElprisNu', props: {} },
  elpris_netselskab: { component: 'ElprisNetselskab', props: { adresse: 'adresse' } },
} as const satisfies Record<string, { component: string; props: Record<string, string> }>
