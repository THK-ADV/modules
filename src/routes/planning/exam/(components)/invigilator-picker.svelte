<script lang="ts">
  import MultiSelectCombobox from '$lib/components/multi-select-combobox.svelte'

  let {
    id,
    label,
    options,
    value,
    onValueChange,
    disabled = false
  }: {
    id?: string
    /** Accessible name of the picker. */
    label: string
    /** Persons labeled `Nachname, Vorname`, with their load as hint. */
    options: { id: string; label: string; hint?: string }[]
    value: string[]
    onValueChange: (value: string[]) => void
    disabled?: boolean
  } = $props()

  /** `Nachname, V.`; labels without first name stay as they are. */
  const short = (label: string) => {
    const [last, first] = label.split(', ')
    return first ? `${last}, ${first.charAt(0)}.` : label
  }
</script>

<MultiSelectCombobox
  {id}
  {label}
  {disabled}
  {value}
  {onValueChange}
  options={options.map((o) => ({ ...o, abbrev: short(o.label) }))}
/>
