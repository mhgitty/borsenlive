const MONTHS_DA = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
]

/** Today's date parts in Copenhagen (servers run in UTC). */
function nowDk() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Copenhagen', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date())
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  return { year: get('year'), month: get('month') - 1, day: get('day') }
}

/**
 * Replace [year], [month], [date] tokens with current Danish date values.
 * Safe to call with null/undefined — returns the input unchanged.
 */
export function replaceDateVars(str: string | null | undefined): string {
  if (!str) return str ?? ''
  const now = nowDk()
  const year  = now.year.toString()
  const month = MONTHS_DA[now.month]
  const date  = now.day.toString()
  return str
    .replace(/\[year\]/gi,         year)
    .replace(/%%currentyear%%/gi,  year)
    .replace(/\[month\]/gi,        month)
    .replace(/%%currentmonth%%/gi, month)
    .replace(/\[date\]/gi,         date)
    .replace(/%%currentdate%%/gi,  date)
}

/**
 * Walk a Portable Text block array and replace date tokens in every text span.
 * Returns a new array — does not mutate the original.
 */
export function replaceDateVarsInBlocks(blocks: any[]): any[] {
  if (!Array.isArray(blocks)) return blocks
  return blocks.map((block) => {
    if (block._type === 'block' && Array.isArray(block.children)) {
      return {
        ...block,
        children: block.children.map((child: any) =>
          child._type === 'span' && typeof child.text === 'string'
            ? { ...child, text: replaceDateVars(child.text) }
            : child
        ),
      }
    }
    return block
  })
}
