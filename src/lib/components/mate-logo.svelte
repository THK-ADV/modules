<script lang="ts" module>
  const logos = {
    full: {
      light: '/brand/mate-logo-light.png',
      dark: '/brand/mate-logo-dark.png',
      width: 2459,
      height: 1634
    },
    landscape: {
      light: '/brand/mate-sidebar-light.png',
      dark: '/brand/mate-sidebar-dark.png',
      width: 3988,
      height: 946
    },
    compact: {
      light: '/brand/mate-icon-light.svg',
      dark: '/brand/mate-icon-dark.svg',
      width: 367,
      height: 179
    }
  } as const

  export type MateLogoVariant = keyof typeof logos
</script>

<script lang="ts">
  import { asset } from '$app/paths'
  import { cn } from '$lib/utils.js'

  let {
    variant = 'full',
    class: className = '',
    alt = 'MATE'
  }: {
    variant?: MateLogoVariant
    class?: string
    alt?: string
  } = $props()

  const logo = $derived(logos[variant])
</script>

<span class={cn('inline-flex shrink-0 items-center justify-center', className)}>
  <img
    src={asset(logo.light)}
    {alt}
    width={logo.width}
    height={logo.height}
    draggable="false"
    class="h-auto max-h-full w-full object-contain object-left dark:hidden"
  />
  <img
    src={asset(logo.dark)}
    {alt}
    width={logo.width}
    height={logo.height}
    draggable="false"
    class="hidden h-auto max-h-full w-full object-contain object-left dark:block"
  />
</span>
