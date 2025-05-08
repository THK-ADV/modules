<script lang="ts" module>
	export type FilterData = {
		label: string
		id: string
	}

	type Props = {
		data: FilterData[]
		selectedId: string | undefined
		placeholder: string
	}
</script>

<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar'
	import Check from '@lucide/svelte/icons/check'
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down'
	import Search from '@lucide/svelte/icons/search'
	import * as Command from '$lib/components/ui/command'
	import * as Popover from '$lib/components/ui/popover'
	import X from '@lucide/svelte/icons/x.svelte'

	import { tick } from 'svelte'

	let { data, selectedId = $bindable(), placeholder }: Props = $props()

	let open = $state(false)
	let triggerRef = $state<HTMLButtonElement>(null!)
	const selectedValue = $derived(data.find((a) => a.id === selectedId)?.label)

	function closeAndFocusTrigger() {
		open = false
		tick().then(() => {
			triggerRef?.focus()
		})
	}

	function clearSelection(e: MouseEvent) {
		e.stopPropagation()
		selectedId = ''
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			e.stopPropagation()
			selectedId = ''
		}
	}
</script>

<Sidebar.GroupContent>
	<Popover.Root bind:open>
		<Popover.Trigger bind:ref={triggerRef}>
			{#snippet child({ props })}
				<button
					{...props}
					class="flex w-full items-center justify-between rounded-md border border-muted-foreground/20 px-3 py-2 text-left text-sm hover:bg-muted/50 focus:outline-none"
					aria-expanded={open}
				>
					<span class="flex min-w-0 flex-1 items-center">
						<Search class="mr-2 size-4 text-muted-foreground" />
						<span class="truncate">{selectedValue || placeholder}</span>
					</span>
					<span class="flex items-center">
						{#if selectedId}
							<span
								role="button"
								tabindex="0"
								class="mr-1.5 cursor-pointer rounded-full p-1 hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-primary/50"
								onclick={clearSelection}
								onkeydown={handleKeyDown}
								aria-label="Clear selection"
							>
								<X class="size-3 text-foreground/70" />
							</span>
						{/if}
						<ChevronsUpDown class="size-4 shrink-0 opacity-50" />
					</span>
				</button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-[350px] p-0" side="bottom" align="start" sideOffset={5}>
			<Command.Root>
				<Command.Input placeholder="Suche…" />
				<Command.List>
					<Command.Empty>Keine Ergebnisse</Command.Empty>
					<Command.Group>
						{#each data as data (data.id)}
							<Command.Item
								value={data.label}
								onSelect={() => {
									selectedId = data.id
									closeAndFocusTrigger()
								}}
							>
								<span class="mr-2 flex w-4 justify-center">
									{#if selectedId === data.id}
										<Check class="size-4" />
									{/if}
								</span>
								{data.label}
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
</Sidebar.GroupContent>
