<script lang="ts">
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { page } from '$app/state'
  import { onMount } from 'svelte'

  // this is just a dummy page to satisfy svelte's requirement. redirect to real content
  onMount(() => {
    if (page.params.id) {
      goto(resolve('/my-modules/[id=uuid]/general', { id: page.params.id }), { replaceState: true })
    } else {
      goto(resolve('/my-modules'), { replaceState: true })
    }
  })
</script>
