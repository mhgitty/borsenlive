import { useCallback } from 'react'
import { useFormValue, set, unset, type StringInputProps } from 'sanity'
import { Select } from '@sanity/ui'

/**
 * Dropdown that lists the H2 headings currently in the document's `body`,
 * so an editor can point a custom hero quick link at one of them.
 * Stores the heading text; the frontend derives the anchor id via headingId().
 */
export function HeadingSelectInput(props: StringInputProps) {
  const { value, onChange } = props
  const body = useFormValue(['body']) as any[] | undefined

  const headings = (body || [])
    .filter((b) => b?._type === 'block' && b?.style === 'h2')
    .map((b) => (b.children || []).map((c: any) => c?.text || '').join('').trim())
    .filter(Boolean)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.currentTarget.value
      onChange(v ? set(v) : unset())
    },
    [onChange]
  )

  return (
    <Select value={value || ''} onChange={handleChange}>
      <option value="">— Select an H2 heading —</option>
      {value && !headings.includes(value) && (
        <option value={value}>{value} (not currently in body)</option>
      )}
      {headings.map((h, i) => (
        <option key={`${h}-${i}`} value={h}>
          {h}
        </option>
      ))}
    </Select>
  )
}
