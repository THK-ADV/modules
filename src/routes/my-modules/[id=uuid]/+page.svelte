<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import { onMount } from 'svelte'

	// this is just a dummy page to satisfy svelte's requirement. redirect to real content
	onMount(() => {
		goto(`/my-modules/${page.params.id}/general`, { replaceState: true })
	})
</script>
