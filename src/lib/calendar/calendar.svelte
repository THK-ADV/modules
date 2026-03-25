<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import * as ToggleGroup from '$lib/components/ui/toggle-group'
  import { uiStore } from '$lib/stores/ui.svelte.js'
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
    type CalendarApi,
    type CalendarEvent,
    type CalendarEventProps,
    type DateRangeInfo,
    type DateSelectInfo,
    type EventClickInfo,
    type EventCopyInfo,
    type EventDropInfo,
    type EventResizeInfo
  } from './types.js'

  interface Props {
    /**
     * Array of calendar events to display.
     * The parent component manages filtering and source toggling.
     */
    events?: CalendarEvent[]
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
  let monthShort = $state('')

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
    if (!value) return
    uiStore.selectedCalendarView = value
    calendar?.changeView(value)
  }

  onMount(() => {
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
      initialView: uiStore.selectedCalendarView,
      initialDate: uiStore.selectedCalendarDate,
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
        timeGridDay: {
          eventContent: renderWeekViewEventContent,
          dayHeaderContent: (arg) => {
            const dateLabel = `${arg.date.getDate().toString().padStart(2, '0')}.${(arg.date.getMonth() + 1).toString().padStart(2, '0')}.`
            return {
              html: `<span class="inline sm:hidden">${arg.text}, ${dateLabel}</span><span class="hidden sm:inline">${arg.text}</span>`
            }
          }
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
        return { html: '<span>Tag</span>' }
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
          uiStore.selectedCalendarDate = currentDate
          monthShort = calendar.getDate().toLocaleString('de-DE', { month: 'short' }) + '.'
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
  <div class="flex flex-wrap items-center justify-between gap-3 border-b py-3">
    <!-- Title: hidden on mobile unless dayGridMonth (abbreviated) -->
    <h3
      class="order-first hidden w-full text-center text-lg font-semibold sm:order-2 sm:block sm:w-auto sm:flex-1"
    >
      {currentTitle}
    </h3>

    {#if uiStore.selectedCalendarView === 'dayGridMonth'}
      <span class="order-2 flex-1 text-center text-lg font-semibold sm:hidden">
        {monthShort}
      </span>
    {/if}

    <!-- Navigation -->
    <div class="bg-muted order-1 flex items-center rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onclick={handlePrev}
        aria-label="Zurück"
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
        aria-label="Weiter"
        class="h-8 w-8 p-0"
      >
        <ChevronRight class="size-4" />
      </Button>
    </div>

    <!-- View Toggle -->
    <ToggleGroup.Root
      type="single"
      value={uiStore.selectedCalendarView}
      onValueChange={handleViewChange}
      class="bg-muted order-3 rounded-lg p-1"
    >
      <ToggleGroup.Item
        value="timeGridDay"
        class="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground h-8 rounded-md px-2.5 text-sm font-medium transition-all data-[state=on]:shadow-sm sm:px-3"
      >
        Tag
      </ToggleGroup.Item>
      <ToggleGroup.Item
        value="timeGridWeek"
        class="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground h-8 rounded-md px-2.5 text-sm font-medium transition-all data-[state=on]:shadow-sm sm:px-3"
      >
        Woche
      </ToggleGroup.Item>
      <ToggleGroup.Item
        value="dayGridMonth"
        class="text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground h-8 rounded-md px-2.5 text-sm font-medium transition-all data-[state=on]:shadow-sm sm:px-3"
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
