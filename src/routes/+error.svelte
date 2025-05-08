<script lang="ts">
	import { page } from '$app/state'
</script>

<h1>{page.status}: {JSON.stringify(page.error)}</h1>
