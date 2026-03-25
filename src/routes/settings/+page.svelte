<script lang="ts">
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js'
  import { Monitor, Moon, Sun } from '@lucide/svelte'
  import { userPrefersMode } from 'mode-watcher'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()

  const [abbreviation, fullname] = $derived.by(() => {
    if (data.userInfo?.person) {
      return [
        data.userInfo.person.abbreviation,
        data.userInfo.person.firstname + ' ' + data.userInfo.person.lastname
      ]
    }
    if (data.user) {
      return [
        data.user.firstname.charAt(0).toUpperCase() + data.user.lastname.charAt(0).toUpperCase(),
        data.user.firstname + ' ' + data.user.lastname
      ]
    }
    return ['??', '??']
  })
</script>

<div class="mx-auto max-w-3xl space-y-10">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Einstellungen</h1>
    <p class="text-muted-foreground mt-1 text-sm">
      Darstellung und Kalenderquellen für diese Sitzung.
    </p>
  </div>

  <div class="grid gap-10 sm:grid-cols-[auto_1fr]">
    <div class="flex flex-col items-center space-y-2">
      <Avatar.Root class="size-14">
        <Avatar.Fallback class="text-lg">{abbreviation}</Avatar.Fallback>
      </Avatar.Root>
      <p class="text-center text-sm font-medium sm:text-left">{fullname}</p>
    </div>

    <div class="space-y-8">
      <!-- Theme -->
      <div class="space-y-3">
        <div class="text-sm font-medium">Erscheinungsbild</div>
        <ToggleGroup.Root type="single" bind:value={userPrefersMode.current}>
          <ToggleGroup.Item value="dark" aria-label="Dunkelmodus">
            <Moon class="size-4" />
          </ToggleGroup.Item>
          <ToggleGroup.Item value="system" aria-label="Systemeinstellung">
            <Monitor class="size-4" />
          </ToggleGroup.Item>
          <ToggleGroup.Item value="light" aria-label="Hellmodus">
            <Sun class="size-4" />
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>
    </div>
  </div>
</div>
