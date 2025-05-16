<script lang="ts">
	let { data } = $props()
</script>

<h1>Meine Module</h1>

<pre>{JSON.stringify(data.modules, null, 2)}</pre>
