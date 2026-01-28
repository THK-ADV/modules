<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import * as ToggleGroup from '$lib/components/ui/toggle-group'
  import { Calendar } from '@fullcalendar/core'
  import dayGridPlugin from '@fullcalendar/daygrid'
  import interactionPlugin from '@fullcalendar/interaction'
  import timeGridPlugin from '@fullcalendar/timegrid'
  import { ChevronLeft, ChevronRight } from '@lucide/svelte'
  import { onMount, untrack } from 'svelte'
  import {
    monthViewEventClassNames,
    renderWeekViewEventContent
  } from './event-content-rendering.js'
  import {
    SELECTED_CALENDAR_DATE_COOKIE_MAX_AGE,
    SELECTED_CALENDAR_DATE_COOKIE_NAME,
    SELECTED_CALENDAR_VIEW_COOKIE_MAX_AGE,
    SELECTED_CALENDAR_VIEW_COOKIE_NAME,
    type CalendarApi,
    type CalendarEvent,
    type CalendarEventProps,
    type CalendarView,
    type DateRangeInfo,
    type DateSelectInfo,
    type EventClickInfo,
    type EventDropInfo
  } from './types.js'

  interface Props {
    /**
     * Array of calendar events to display.
     * The parent component manages filtering and source toggling.
     */
    events?: CalendarEvent[]
    /** Initial view mode (week or month) */
    initialView?: CalendarView
    /** Initial date to display */
    initialDate?: Date | string
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
    /** Callback when the date range is set */
    onDateRangeSet?: (info: DateRangeInfo) => void
    /** Exposed calendar API for external control */
    api?: CalendarApi
    /** Additional CSS classes for the container */
    class?: string
  }

  let {
    events = [],
    initialView = 'timeGridWeek',
    initialDate,
    editable = false,
    selectable = false,
    onDateSelect,
    onEventClick,
    onEventDrop,
    onDateRangeSet,
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

  function handleViewChange(value: string) {
    currentView = value as CalendarView
    document.cookie = `${SELECTED_CALENDAR_VIEW_COOKIE_NAME}=${value}; path=/; max-age=${SELECTED_CALENDAR_VIEW_COOKIE_MAX_AGE}`
    calendar?.changeView(value)
  }

  onMount(() => {
    const startView = initialView
    const startDate = initialDate

    calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: startView,
      initialDate: startDate,
      headerToolbar: false,
      editable,
      selectable,
      events: [],
      nowIndicator: true,
      dayMaxEvents: true,
      weekNumbers: true,
      allDaySlot: true,
      slotMinTime: '08:30:00',
      slotMaxTime: '21:00:00',
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
          eventContent: renderWeekViewEventContent
        },
        dayGridMonth: {
          eventClassNames: monthViewEventClassNames()
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
            extendedProps: arg.event.extendedProps as CalendarEventProps
          },
          jsEvent: arg.jsEvent
        })
      },
      eventDrop: (arg) => {
        onEventDrop?.({
          event: {
            id: arg.event.id,
            extendedProps: arg.event.extendedProps as CalendarEventProps
          },
          oldEvent: {
            id: arg.oldEvent.id,
            extendedProps: arg.oldEvent.extendedProps as CalendarEventProps
          },
          revert: arg.revert
        })
      },
      datesSet: (arg) => {
        if (calendar) {
          currentTitle = calendar.view.title
          const currentDate = calendar.getDate().toISOString()
          document.cookie = `${SELECTED_CALENDAR_DATE_COOKIE_NAME}=${currentDate}; path=/; max-age=${SELECTED_CALENDAR_DATE_COOKIE_MAX_AGE}`
        }
        onDateRangeSet?.({
          start: arg.start,
          end: arg.end,
          startStr: arg.startStr,
          endStr: arg.endStr
        })
      }
    })

    calendar.render()
    currentTitle = calendar.view.title

    // Add ResizeObserver to handle container size changes
    let resizeTimeout: ReturnType<typeof setTimeout>
    const resizeObserver = new ResizeObserver(() => {
      // Debounce to avoid excessive updates during animation
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        calendar?.updateSize()
      }, 150) // Wait for sidebar animation to complete
    })

    resizeObserver.observe(calendarEl)

    // Expose a simple API
    api = {
      prev: () => calendar?.prev(),
      next: () => calendar?.next(),
      today: () => calendar?.today(),
      changeView: (view) => calendar?.changeView(view),
      getTitle: () => calendar?.view.title ?? ''
    }

    return () => {
      clearTimeout(resizeTimeout)
      resizeObserver.disconnect()
      calendar?.destroy()
      calendar = null
    }
  })

  // Update calendar events when the events prop changes
  $effect(() => {
    const currentEvents = events
    untrack(() => {
      if (!calendar) return
      calendar.removeAllEvents()
      calendar.addEventSource(currentEvents)
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
      value={currentView}
      onValueChange={handleViewChange}
      class="bg-muted rounded-lg p-1"
    >
      <ToggleGroup.Item
        value="dayGridDay"
        class="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground h-8 rounded-md px-3 text-sm font-medium transition-all data-[state=on]:shadow-sm"
      >
        Tag
      </ToggleGroup.Item>
      <ToggleGroup.Item
        value="timeGridWeek"
        class="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground h-8 rounded-md px-3 text-sm font-medium transition-all data-[state=on]:shadow-sm"
      >
        Woche
      </ToggleGroup.Item>
      <ToggleGroup.Item
        value="dayGridMonth"
        class="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground h-8 rounded-md px-3 text-sm font-medium transition-all data-[state=on]:shadow-sm"
      >
        Monat
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  </div>

  <!-- Calendar -->
  <div bind:this={calendarEl} class="min-h-0 flex-1"></div>
</div>
