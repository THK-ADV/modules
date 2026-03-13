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
    renderMonthViewEventContent,
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
    type EventCopyInfo,
    type EventClickInfo,
    type EventDropInfo,
    type EventResizeInfo
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
    /** Callback when a date range is selected */
    onDateSelect?: (info: DateSelectInfo) => void
    /** Callback when an event is clicked */
    onEventClick?: (info: EventClickInfo) => void
    /** Callback when an event is dragged to a new time/date */
    onEventDrop?: (info: EventDropInfo) => void
    /** Callback when Option/Alt + dragging an event to copy it */
    onEventCopy?: (info: EventCopyInfo) => void
    /** Callback when an event is resized (start/end changed) */
    onEventResize?: (info: EventResizeInfo) => void
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
    onDateSelect,
    onEventClick,
    onEventDrop,
    onEventCopy,
    onEventResize,
    onDateRangeSet,
    api = $bindable(),
    class: className
  }: Props = $props()

  let calendarEl: HTMLDivElement
  let calendar: Calendar | null = null
  let currentTitle = $state('')
  let copyModifierHeld = false
  let dragStartedWithCopyModifier = false
  let isEventDragging = false
  let isCopyDragging = $state(false)
  let draggedEventEl: HTMLElement | null = null
  let harnessObserver: MutationObserver | null = null
  // svelte-ignore state_referenced_locally
  let currentView = $state<CalendarView>(initialView)

  function showOriginalEventAsCopy(show: boolean) {
    const harness = draggedEventEl?.closest(
      '.fc-timegrid-event-harness, .fc-daygrid-event-harness'
    ) as HTMLElement | null
    if (!harness) return

    if (show) {
      harness.style.visibility = 'visible'
      harness.style.opacity = '0.5'
      harnessObserver?.disconnect()
      harnessObserver = new MutationObserver(() => {
        if (harness.style.visibility === 'hidden') {
          harnessObserver!.disconnect()
          harness.style.visibility = 'visible'
          harnessObserver!.observe(harness, { attributeFilter: ['style'] })
        }
      })
      harnessObserver.observe(harness, { attributeFilter: ['style'] })
    } else {
      harnessObserver?.disconnect()
      harnessObserver = null
      harness.style.opacity = ''
    }
  }

  function setCopyCursorIndicator(active: boolean) {
    document.body.classList.toggle('calendar-copy-cursor', active)
    const wasCopyDragging = isCopyDragging
    isCopyDragging = active && isEventDragging
    if (isCopyDragging !== wasCopyDragging) {
      showOriginalEventAsCopy(isCopyDragging)
    }
  }

  function isMacPlatform() {
    const platformHint = navigator.userAgent
    return /Mac|iPhone|iPad|iPod/i.test(platformHint)
  }

  function isCopyModifierPressed(event: { altKey: boolean; ctrlKey: boolean }) {
    if (!onEventCopy) return false
    if (isMacPlatform()) return event.altKey
    // Keep Alt as fallback for Linux setups that forward it.
    return event.ctrlKey || event.altKey
  }

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
    const supportsCopy = Boolean(onEventCopy)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Alt' && event.key !== 'Control') return
      copyModifierHeld = isCopyModifierPressed(event)
      if (!isEventDragging) return
      dragStartedWithCopyModifier = copyModifierHeld
      setCopyCursorIndicator(dragStartedWithCopyModifier)
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key !== 'Alt' && event.key !== 'Control') return
      copyModifierHeld = isCopyModifierPressed(event)
      if (!isEventDragging) return
      dragStartedWithCopyModifier = copyModifierHeld
      setCopyCursorIndicator(dragStartedWithCopyModifier)
    }
    const handleWindowBlur = () => {
      copyModifierHeld = false
      dragStartedWithCopyModifier = false
      setCopyCursorIndicator(false)
    }

    if (supportsCopy) {
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
      window.addEventListener('blur', handleWindowBlur)
    }

    calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: startView,
      initialDate: startDate,
      height: 'auto',
      headerToolbar: false,
      editable: onEventDrop || onEventCopy || onEventResize ? true : false,
      eventStartEditable: onEventDrop || onEventCopy ? true : false,
      eventDurationEditable: onEventResize ? true : false,
      eventResizableFromStart: onEventResize ? true : false,
      selectable: onDateSelect ? true : false,
      selectMinDistance: onDateSelect ? 15 : 0, // Only trigger date selection after a drag gesture (15 min range), not simple clicks.
      events: [],
      nowIndicator: true,
      dayMaxEvents: true,
      weekNumbers: true,
      allDaySlot: true,
      slotMinTime: '08:00:00',
      slotMaxTime: '21:00:00',
      expandRows: false,
      stickyHeaderDates: true,
      locale: 'de',
      firstDay: 1,
      weekends: false,
      slotDuration: '00:30:00',
      slotLabelInterval: '01:00:00',
      snapDuration: '00:15:00',
      slotEventOverlap: false,
      eventMinHeight: 22,
      eventShortHeight: 22,
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
          fixedWeekCount: false,
          dayMaxEvents: 6,
          eventContent: renderMonthViewEventContent
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
        if (arg.allDay) {
          return
        }
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
      eventDragStart: (arg) => {
        if (arg.event.extendedProps.source !== 'schedule') {
          return
        }
        isEventDragging = true
        draggedEventEl = arg.el
        dragStartedWithCopyModifier = copyModifierHeld || isCopyModifierPressed(arg.jsEvent)
        setCopyCursorIndicator(dragStartedWithCopyModifier)
      },
      eventDrop: (arg) => {
        if (arg.event.extendedProps.source !== 'schedule') {
          arg.revert()
          return
        }

        const dropInfo = {
          eventId: arg.event.id,
          extendedProps: arg.event.extendedProps as CalendarEventProps,
          newStart: arg.event.start,
          newEnd: arg.event.end,
          revert: arg.revert
        }

        const isCopyGesture = dragStartedWithCopyModifier || isCopyModifierPressed(arg.jsEvent)

        showOriginalEventAsCopy(false)
        isEventDragging = false
        isCopyDragging = false
        draggedEventEl = null
        dragStartedWithCopyModifier = false
        setCopyCursorIndicator(false)

        if (onEventCopy && isCopyGesture) {
          arg.revert()
          onEventCopy(dropInfo)
          return
        }

        if (onEventDrop) {
          onEventDrop(dropInfo)
          return
        }

        // If dragging is enabled only for copy, revert non-copy drags.
        arg.revert()
      },
      eventDragStop: (arg) => {
        if (arg.event.extendedProps.source !== 'schedule') {
          return
        }
        showOriginalEventAsCopy(false)
        isEventDragging = false
        isCopyDragging = false
        draggedEventEl = null
        dragStartedWithCopyModifier = false
        setCopyCursorIndicator(false)
      },
      eventResize: (arg) => {
        if (arg.event.extendedProps.source !== 'schedule') {
          arg.revert()
          return
        }
        const resizeInfo = {
          eventId: arg.event.id,
          extendedProps: arg.event.extendedProps as CalendarEventProps,
          newStart: arg.event.start,
          newEnd: arg.event.end,
          revert: arg.revert
        }

        if (onEventResize) {
          onEventResize(resizeInfo)
          return
        }

        arg.revert()
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
      if (supportsCopy) {
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('keyup', handleKeyUp)
        window.removeEventListener('blur', handleWindowBlur)
      }
      harnessObserver?.disconnect()
      setCopyCursorIndicator(false)
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

<div class="flex flex-col {className}">
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
  <div bind:this={calendarEl} class="w-full" class:calendar-copy-dragging={isCopyDragging}></div>
</div>

<style>
  :global(body.calendar-copy-cursor),
  :global(body.calendar-copy-cursor *) {
    cursor: copy !important;
  }

  .calendar-copy-dragging :global(.fc-event-mirror) {
    opacity: 1 !important;
  }
</style>
