<script lang="ts">
	import { page } from '$app/state'
</script>

<pre>{page.status}: {JSON.stringify(page, null, 2)}</pre>
