<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import * as ToggleGroup from '$lib/components/ui/toggle-group'
  import {
    Calendar,
    type EventInput,
    type EventSourceFunc,
    type EventSourceInput
  } from '@fullcalendar/core'
  import dayGridPlugin from '@fullcalendar/daygrid'
  import interactionPlugin from '@fullcalendar/interaction'
  import timeGridPlugin from '@fullcalendar/timegrid'
  import { ChevronLeft, ChevronRight } from '@lucide/svelte'
  import { onMount, untrack } from 'svelte'
  import { renderEventContent } from './event-content-rendering.js'
  import {
    type CalendarApi,
    type CalendarView,
    type DateSelectInfo,
    type EventClickInfo,
    type EventDropInfo,
    type EventSourceConfig,
    type FetcherEventSource,
    SELECTED_CALENDAR_VIEW_COOKIE_MAX_AGE,
    SELECTED_CALENDAR_VIEW_COOKIE_NAME
  } from './types.js'
  import { ca } from 'zod/v4/locales'

  interface Props {
    /**
     * Array of event source configurations.
     * Each source can have static events or a fetcher function.
     * The parent component controls which sources to include.
     */
    eventSources?: EventSourceConfig[]
    /** Initial view mode (week or month) */
    initialView?: CalendarView
    /** Whether events can be dragged and resized */
    editable?: boolean
    /** Whether users can select date ranges */
    selectable?: boolean
    /** Callback when a date range is selected */
    onDateSelect?: (info: DateSelectInfo) => void
    /** Callback when an event is clicked */
    onEventClick?: (info: EventClickInfo) => void
    /** Callback when an event is dragged to a new time/date */
    onEventDrop?: (info: EventDropInfo) => void
    /** Exposed calendar API for external control */
    api?: CalendarApi
    /** Additional CSS classes for the container */
    class?: string
  }

  let {
    eventSources = [],
    initialView = 'timeGridWeek',
    editable = false,
    selectable = false,
    onDateSelect,
    onEventClick,
    onEventDrop,
    api = $bindable(),
    class: className
  }: Props = $props()

  let calendarEl: HTMLDivElement
  let calendar: Calendar | null = null
  let currentTitle = $state('')
  // svelte-ignore state_referenced_locally
  let currentView = $state<CalendarView>(initialView)

  function handlePrev() {
    calendar?.prev()
  }

  function handleNext() {
    calendar?.next()
  }

  function handleToday() {
    calendar?.today()
  }

  function handleViewChange(value: string | undefined) {
    if (value === 'week' || value === 'month') {
      currentView = value === 'week' ? 'timeGridWeek' : 'dayGridMonth'
      document.cookie = `${SELECTED_CALENDAR_VIEW_COOKIE_NAME}=${currentView}; path=/; max-age=${SELECTED_CALENDAR_VIEW_COOKIE_MAX_AGE}`
      calendar?.changeView(currentView)
    }
  }

  /**
   * Type guard to check if source has a fetcher
   */
  function hasFetcher(config: EventSourceConfig): config is FetcherEventSource {
    return 'fetcher' in config && config.fetcher !== undefined
  }

  /**
   * Convert our EventSourceConfig to FullCalendar's EventSourceInput
   */
  function toFullCalendarSource(config: EventSourceConfig): EventSourceInput {
    let events: EventInput[] | EventSourceFunc

    if (hasFetcher(config)) {
      events = async (fetchInfo, successCallback, failureCallback) => {
        try {
          const events = await config.fetcher({
            start: fetchInfo.start,
            end: fetchInfo.end,
            startStr: fetchInfo.startStr,
            endStr: fetchInfo.endStr
          })
          successCallback(events)
        } catch (error) {
          failureCallback(error instanceof Error ? error : new Error(String(error)))
        }
      }
    } else {
      events = config.events
    }

    return {
      id: config.id,
      color: config.color,
      display: config.display,
      events
    }
  }

  onMount(() => {
    const startView = initialView
    const fcSources = eventSources.map(toFullCalendarSource)

    calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: startView,
      headerToolbar: false,
      editable,
      selectable,
      eventSources: fcSources,
      nowIndicator: true,
      dayMaxEvents: true,
      weekNumbers: true,
      allDaySlot: true,
      slotMinTime: '06:00:00',
      slotMaxTime: '22:00:00',
      expandRows: true,
      stickyHeaderDates: true,
      locale: 'de',
      firstDay: 1,
      weekends: false,
      slotDuration: '00:15:00', // Display 15-minute slots
      snapDuration: '00:15:00', // Snap to 15-minute intervals when dragging
      slotEventOverlap: true,
      // Format slot label as HH:mm without "Uhr"
      slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      },
      // Format event time as HH:mm without "Uhr"
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      },
      views: {
        timeGridWeek: {
          // Custom event rendering for week view only
          eventContent: renderEventContent
        }
      },
      weekNumberFormat: { week: 'numeric' },
      weekNumberContent: (arg) => {
        return { html: `<span>KW ${arg.num}</span>` }
      },
      allDayContent: () => {
        return { html: '<span>Ganztägig</span>' }
      },
      buttonText: {
        today: 'Heute',
        month: 'Monat',
        week: 'Woche',
        day: 'Tag'
      },
      select: (arg) => {
        onDateSelect?.({
          start: arg.start,
          end: arg.end,
          startStr: arg.startStr,
          endStr: arg.endStr,
          allDay: arg.allDay
        })
      },
      eventClick: (arg) => {
        onEventClick?.({
          event: {
            id: arg.event.id,
            title: arg.event.title,
            start: arg.event.start,
            end: arg.event.end,
            allDay: arg.event.allDay,
            extendedProps: arg.event.extendedProps as Record<string, unknown>
          },
          jsEvent: arg.jsEvent
        })
      },
      eventDrop: (arg) => {
        onEventDrop?.({
          event: {
            id: arg.event.id,
            title: arg.event.title,
            start: arg.event.start,
            end: arg.event.end,
            allDay: arg.event.allDay,
            extendedProps: arg.event.extendedProps as Record<string, unknown>
          },
          oldEvent: {
            id: arg.oldEvent.id,
            title: arg.oldEvent.title,
            start: arg.oldEvent.start,
            end: arg.oldEvent.end,
            allDay: arg.oldEvent.allDay
          },
          revert: arg.revert
        })
      },
      datesSet: () => {
        if (calendar) {
          currentTitle = calendar.view.title
        }
      }
    })

    calendar.render()
    currentTitle = calendar.view.title

    // Expose a simple API
    api = {
      prev: () => calendar?.prev(),
      next: () => calendar?.next(),
      today: () => calendar?.today(),
      changeView: (view) => calendar?.changeView(view),
      getTitle: () => calendar?.view.title ?? '',
      refetchEvents: () => calendar?.refetchEvents()
    }

    // TODO: debug option
    calendar.gotoDate(Date.parse('2025-10-06'))

    return () => {
      calendar?.destroy()
      calendar = null
    }
  })

  // Diff-based sync: only add/remove changed sources (avoids unnecessary refetches)
  $effect(() => {
    const sources = eventSources
    untrack(() => {
      if (!calendar) return

      const currentIds = new Set(calendar.getEventSources().map((s) => s.id))
      const newIds = new Set(sources.map((s) => s.id))

      for (const id of currentIds) {
        if (!newIds.has(id)) {
          calendar.getEventSourceById(id)?.remove()
        }
      }

      for (const config of sources) {
        if (!currentIds.has(config.id)) {
          calendar.addEventSource(toFullCalendarSource(config))
        }
      }
    })
  })
</script>

<div class="flex h-full flex-col {className}">
  <!-- Toolbar -->
  <div class="border-border bg-card flex items-center justify-between border-b px-4 py-3">
    <!-- Left: Navigation -->
    <div class="bg-muted flex items-center rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onclick={handlePrev}
        aria-label="Vorherige Woche"
        class="h-8 w-8 p-0"
      >
        <ChevronLeft class="size-4" />
      </Button>
      <div class="bg-border mx-0.5 h-5 w-px"></div>
      <Button variant="ghost" size="sm" onclick={handleToday} class="h-8 px-3 text-sm font-medium">
        Heute
      </Button>
      <div class="bg-border mx-0.5 h-5 w-px"></div>
      <Button
        variant="ghost"
        size="sm"
        onclick={handleNext}
        aria-label="Nächste Woche"
        class="h-8 w-8 p-0"
      >
        <ChevronRight class="size-4" />
      </Button>
    </div>

    <!-- Center: Title -->
    <h3 class="text-lg font-semibold">{currentTitle}</h3>

    <!-- Right: View Toggle -->
    <ToggleGroup.Root
      type="single"
      value={currentView === 'timeGridWeek' ? 'week' : 'month'}
      onValueChange={handleViewChange}
      class="bg-muted rounded-lg p-1"
    >
      <ToggleGroup.Item
        value="week"
        class="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground h-8 rounded-md px-3 text-sm font-medium transition-all data-[state=on]:shadow-sm"
      >
        Woche
      </ToggleGroup.Item>
      <ToggleGroup.Item
        value="month"
        class="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground h-8 rounded-md px-3 text-sm font-medium transition-all data-[state=on]:shadow-sm"
      >
        Monat
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  </div>

  <!-- Calendar -->
  <div bind:this={calendarEl} class="min-h-0 flex-1"></div>
</div>
