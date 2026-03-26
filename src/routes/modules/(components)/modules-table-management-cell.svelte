<script lang="ts">
  import type { PersonShort } from '$lib/types/module'

  let { management }: { management: PersonShort[] } = $props()

  function moduleManagementLong(xs: ReadonlyArray<PersonShort>) {
    let res = ''
    for (const [i, x] of xs.entries()) {
      switch (x.kind) {
        case 'person':
          if (x.firstname && x.lastname) {
            res += `${x.lastname}, ${x.firstname.charAt(0)}.`
            if (i < xs.length - 1) {
              res += ' & '
            }
          }
          break
        case 'group':
          res += x.title
          break
        case 'unknown':
          res += x.title
          break
      }
    }
    return res
  }

  function moduleManagementShort(xs: ReadonlyArray<PersonShort>) {
    if (xs.length === 0) {
      return 'N/A'
    }
    const firstPerson = xs.find((x) => x.kind === 'person')
    if (firstPerson) {
      const name = firstPerson.lastname || firstPerson.firstname || firstPerson.abbreviation
      if (xs.length > 1) {
        return `${name} et al.`
      }
      return name
    }
    const first = xs[0]
    if (first.kind === 'unknown') {
      return first.title
    }
    return first.title
  }
</script>

<span class="md:hidden">{moduleManagementShort(management)}</span>
<span class="hidden md:inline">{moduleManagementLong(management)}</span>
