<script lang="ts">
	import { routesMap } from '$lib/routes.svelte'
	import { marked } from 'marked'
	import type { PageProps } from './$types'

	let { data }: PageProps = $props()
	const { metadata, deContent } = data.module

	routesMap.selectedModule = { id: data.module.id, title: metadata.title }
</script>

<div class="prose max-w-none p-4">
	<h1>{metadata.title}</h1>

	<h2>Angestrebte Lernergebnisse</h2>
	{#if deContent.learningOutcome}
		<div>{@html marked.parse(deContent.learningOutcome)}</div>
	{:else}
		<p>Keine Angabe</p>
	{/if}

	<h2>Modulinhalte</h2>
	{#if deContent.content}
		<div>{@html marked.parse(deContent.content)}</div>
	{:else}
		<p>Keine Angabe</p>
	{/if}

	<h2>Lehr- und Lernmethoden (Medienformen)</h2>
	{#if deContent.teachingAndLearningMethods}
		<div>{@html marked.parse(deContent.teachingAndLearningMethods)}</div>
	{:else}
		<p>Keine Angabe</p>
	{/if}

	<h2>Empfohlene Literatur</h2>
	{#if deContent.recommendedReading}
		<div>{@html marked.parse(deContent.recommendedReading)}</div>
	{:else}
		<p>Keine Angabe</p>
	{/if}

	<h2>Besonderheiten</h2>
	{#if deContent.particularities}
		<div>{@html marked.parse(deContent.particularities)}</div>
	{:else}
		<p>Keine Angabe</p>
	{/if}

	<!-- <div>{@html marked.parse(page)}</div> -->
</div>
