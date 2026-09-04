<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'

import {
  CalendarEngine,
} from '../engine/CalendarEngine'

type TransitionDirection =
  | 'forward'
  | 'backward'

const engine =
  new CalendarEngine()

const state =
  ref(engine.getState())

const days =
  ref(engine.getCalendarDays())

const isOpen =
  ref(false)

const transitionDirection =
  ref<TransitionDirection>('forward')

const datePickerRef =
  ref<HTMLElement | null>(null)

const calendarRef =
  ref<HTMLElement | null>(null)

const inputRef =
  ref<HTMLInputElement | null>(null)

let suppressOpenOnFocus = false

let shouldFocusAfterTransition = false

const weekDays = [
  {
    short: 'S',
    full: 'Sunday',
  },
  {
    short: 'M',
    full: 'Monday',
  },
  {
    short: 'T',
    full: 'Tuesday',
  },
  {
    short: 'W',
    full: 'Wednesday',
  },
  {
    short: 'T',
    full: 'Thursday',
  },
  {
    short: 'F',
    full: 'Friday',
  },
  {
    short: 'S',
    full: 'Saturday',
  },
]

const months =
  Array.from(
    {
      length: 12,
    },
    (_, index) => {
      const month =
        index + 1

      const date =
        Temporal.PlainDate.from({
          year: 2000,
          month,
          day: 1,
        })

      return {
        value: month,

        label:
          date.toLocaleString(
            'en-US',
            {
              month: 'short',
            },
          ),
      }
    },
  )

/*
  Stable year range:
  current year ±100.
*/
const referenceYear =
  Temporal.Now.plainDateISO().year

const years =
  Array.from(
    {
      length: 201,
    },
    (_, index) =>
      referenceYear -
      100 +
      index,
  )

const calendarPageKey =
  computed(
    () =>
      `${state.value.activeDate.year}-${state.value.activeDate.month}`,
  )

const activeViewLabel =
  computed(() =>
    state.value.activeDate
      .toLocaleString(
        'en-US',
        {
          month: 'long',
          year: 'numeric',
        },
      ),
  )

function handleDocumentPointerDown(
  event: PointerEvent,
): void {
  if (!isOpen.value) {
    return
  }

  const target = event.target as Node | null

  if (
    target &&
    datePickerRef.value?.contains(target)
  ) {
    return
  }

  isOpen.value = false
}  

function syncFromEngine(): void {
  state.value =
    engine.getState()

  days.value =
    engine.getCalendarDays()
}

function getPageKey(
  date: Temporal.PlainDate,
): string {
  return `${date.year}-${date.month}`
}

function getMonthIndex(
  date: Temporal.PlainDate,
): number {
  return (
    date.year * 12 +
    date.month
  )
}

function updateTransitionDirection(
  previousDate:
    Temporal.PlainDate,

  nextDate:
    Temporal.PlainDate,
): void {
  const previousMonth =
    getMonthIndex(
      previousDate,
    )

  const nextMonth =
    getMonthIndex(
      nextDate,
    )

  if (
    nextMonth >
    previousMonth
  ) {
    transitionDirection.value =
      'forward'
  } else if (
    nextMonth <
    previousMonth
  ) {
    transitionDirection.value =
      'backward'
  }
}

function navigateWithAnimation(
  action: () => void,
): void {
  const previousDate =
    state.value.activeDate

  action()

  const nextState =
    engine.getState()

  updateTransitionDirection(
    previousDate,
    nextState.activeDate,
  )

  state.value =
    nextState

  days.value =
    engine.getCalendarDays()
}

function goToPreviousMonth(): void {
  navigateWithAnimation(
    () =>
      engine.previousMonth(),
  )
}

function goToNextMonth(): void {
  navigateWithAnimation(
    () =>
      engine.nextMonth(),
  )
}

function goToPreviousYear(): void {
  navigateWithAnimation(
    () =>
      engine.previousYear(),
  )
}

function goToNextYear(): void {
  navigateWithAnimation(
    () =>
      engine.nextYear(),
  )
}

function handleMonthChange(
  event: Event,
): void {
  const select =
    event.target as HTMLSelectElement

  const previousDate =
    state.value.activeDate

  engine.setMonth(
    Number(
      select.value,
    ),
  )

  const nextState =
    engine.getState()

  updateTransitionDirection(
    previousDate,
    nextState.activeDate,
  )

  state.value =
    nextState

  days.value =
    engine.getCalendarDays()
}

function handleYearChange(
  event: Event,
): void {
  const select =
    event.target as HTMLSelectElement

  const previousDate =
    state.value.activeDate

  engine.setYear(
    Number(
      select.value,
    ),
  )

  const nextState =
    engine.getState()

  updateTransitionDirection(
    previousDate,
    nextState.activeDate,
  )

  state.value =
    nextState

  days.value =
    engine.getCalendarDays()
}

function formatAccessibleDate(
  date: Temporal.PlainDate,
): string {
  return date.toLocaleString(
    'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    },
  )
}

function handleInputFocus(): void {
  if (
    suppressOpenOnFocus
  ) {
    return
  }

  isOpen.value = true
}

async function focusActiveDay():
  Promise<void> {
  await nextTick()

  const activeDate =
    state.value.activeDate
      .toString()

  const page =
    calendarPageKey.value

  const activeButton =
    datePickerRef.value
      ?.querySelector<HTMLButtonElement>(
        `[data-page="${page}"] [data-date="${activeDate}"]`,
      )

  activeButton?.focus({
    preventScroll: true,
  })
}

async function focusCalendarDuringTransition():
  Promise<void> {
  await nextTick()

  calendarRef.value?.focus({
    preventScroll: true,
  })
}

function handleCalendarAfterEnter(): void {
  if (
    !shouldFocusAfterTransition
  ) {
    return
  }

  shouldFocusAfterTransition =
    false

  void focusActiveDay()
}

async function closeCalendar():
  Promise<void> {
  isOpen.value = false

  await nextTick()

  suppressOpenOnFocus =
    true

  inputRef.value?.focus({
    preventScroll: true,
  })

  suppressOpenOnFocus =
    false
}

function selectDate(
  date: Temporal.PlainDate,
): void {
  const previousDate =
    state.value.activeDate

  const previousPage =
    getPageKey(
      previousDate,
    )

  engine.selectDate(date)

  const nextState =
    engine.getState()

  const nextPage =
    getPageKey(
      nextState.activeDate,
    )

  updateTransitionDirection(
    previousDate,
    nextState.activeDate,
  )

  state.value =
    nextState

  days.value =
    engine.getCalendarDays()

  const changedMonth =
    previousPage !==
    nextPage

  if (changedMonth) {
    shouldFocusAfterTransition =
      true

    void focusCalendarDuringTransition()
  } else {
    void focusActiveDay()
  }
}

function moveActiveDate(
  amount: number,
): void {
  const previousDate =
    state.value.activeDate

  const previousPage =
    getPageKey(
      previousDate,
    )

  engine.moveActiveDate(
    amount,
  )

  const nextState =
    engine.getState()

  const nextPage =
    getPageKey(
      nextState.activeDate,
    )

  updateTransitionDirection(
    previousDate,
    nextState.activeDate,
  )

  state.value =
    nextState

  days.value =
    engine.getCalendarDays()

  const changedMonth =
    previousPage !==
    nextPage

  if (changedMonth) {
    /*
      The focused day belongs
      to the page Vue is about
      to remove.

      Temporarily focus the
      calendar container.
    */
    shouldFocusAfterTransition =
      true

    void focusCalendarDuringTransition()
  } else {
    void focusActiveDay()
  }
}

function handleKeydown(
    event: KeyboardEvent,
  ): void {
    if (
      event.key === 'Escape' &&
      isOpen.value
    ) {
      event.preventDefault()

      void closeCalendar()
      return
    }

    if (!isOpen.value) {
      return
    }

    const target =
      event.target as HTMLElement

    const isInput =
      target === inputRef.value

    const isCalendarDay =
      target.classList.contains(
        'calendar-day',
      )

    const isCalendar =
      target === calendarRef.value

    if (
      !isInput &&
      !isCalendarDay &&
      !isCalendar
    ) {
      return
    }

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        moveActiveDate(-1)
        break

      case 'ArrowRight':
        event.preventDefault()
        moveActiveDate(1)
        break

      case 'ArrowUp':
        event.preventDefault()
        moveActiveDate(-7)
        break

      case 'ArrowDown':
        event.preventDefault()
        moveActiveDate(7)
        break

      case 'Enter':
        event.preventDefault()

        engine.selectDate(
          state.value.activeDate,
        )

        syncFromEngine()

        void closeCalendar()
        break
    }
  }

  /*
    ESTOS VAN FUERA DE handleKeydown()
  */

  onMounted(() => {
    document.addEventListener(
      'pointerdown',
      handleDocumentPointerDown,
    )
  })

  onBeforeUnmount(() => {
    document.removeEventListener(
      'pointerdown',
      handleDocumentPointerDown,
    )
  })

</script>

<template>
  <div
    ref="datePickerRef"
    class="date-picker"
    @keydown="handleKeydown"
  >
    <label
      class="date-picker-label"
      for="date-picker-input"
    >
      Selected date
    </label>

    <input
      id="date-picker-input"
      ref="inputRef"
      type="text"
      readonly
      :value="
        state.selectedDate
          .toString()
      "
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      aria-controls="datepicker-calendar"
      @focus="handleInputFocus"
      @click="isOpen = true"
    >

    <div
      v-if="isOpen"
      id="datepicker-calendar"
      ref="calendarRef"
      class="calendar"
      role="dialog"
      aria-label="Choose date"
      tabindex="-1"
    >
      <p
        class="visually-hidden"
        aria-live="polite"
      >
        {{ activeViewLabel }}
      </p>

      <!-- MONTH / YEAR -->
      <div class="calendar-controls">

        <!-- MONTH -->
        <div
          class="calendar-control"
          aria-label="Month navigation"
        >
          <button
            type="button"
            class="nav-button"
            aria-label="Previous month"
            @click="
              goToPreviousMonth
            "
          >
            ‹
          </button>

          <div class="select-wrapper">
            <select
              class="calendar-select"
              aria-label="Choose month"
              :value="
                state.activeDate.month
              "
              @change="
                handleMonthChange
              "
            >
              <option
                v-for="month in months"
                :key="
                  month.value
                "
                :value="
                  month.value
                "
              >
                {{ month.label }}
              </option>
            </select>
          </div>

          <button
            type="button"
            class="nav-button"
            aria-label="Next month"
            @click="
              goToNextMonth
            "
          >
            ›
          </button>
        </div>

        <!-- YEAR -->
        <div
          class="calendar-control"
          aria-label="Year navigation"
        >
          <button
            type="button"
            class="nav-button"
            aria-label="Previous year"
            @click="
              goToPreviousYear
            "
          >
            ‹
          </button>

          <div class="select-wrapper">
            <select
              class="
                calendar-select
                calendar-select--year
              "
              aria-label="Choose year"
              :value="
                state.activeDate.year
              "
              @change="
                handleYearChange
              "
            >
              <option
                v-for="year in years"
                :key="year"
                :value="year"
              >
                {{ year }}
              </option>
            </select>
          </div>

          <button
            type="button"
            class="nav-button"
            aria-label="Next year"
            @click="
              goToNextYear
            "
          >
            ›
          </button>
        </div>
      </div>

      <!-- WEEKDAYS -->
      <div class="weekdays">
        <span
          v-for="
            weekDay in weekDays
          "
          :key="weekDay.full"
          class="weekday"
          :aria-label="
            weekDay.full
          "
        >
          <abbr
            :title="
              weekDay.full
            "
          >
            {{ weekDay.short }}
          </abbr>
        </span>
      </div>

      <!-- ANIMATED GRID -->
      <div
        class="calendar-grid-viewport"
      >
        <Transition
          :name="
            transitionDirection ===
            'forward'
              ? 'calendar-forward'
              : 'calendar-backward'
          "
          @after-enter="
            handleCalendarAfterEnter
          "
        >
          <div
            :key="
              calendarPageKey
            "
            class="
              days-grid
              calendar-page
            "
            :data-page="
              calendarPageKey
            "
          >
            <button
              v-for="day in days"
              :key="
                day.date.toString()
              "
              type="button"
              class="calendar-day"
              :class="{
                'calendar-day--outside':
                  !day.isCurrentMonth,

                'calendar-day--selected':
                  day.isSelected,

                'calendar-day--today':
                  day.isToday,

                'calendar-day--active':
                  day.isActive,
              }"
              :data-date="
                day.date.toString()
              "
              :tabindex="
                day.isActive
                  ? 0
                  : -1
              "
              :aria-pressed="
                day.isSelected
              "
              :aria-current="
                day.isToday
                  ? 'date'
                  : undefined
              "
              :aria-label="
                formatAccessibleDate(
                  day.date,
                )
              "
              @click="
                selectDate(
                  day.date,
                )
              "
            >
              {{ day.date.day }}
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.date-picker {
  /* COLORS */
  --datepicker-bg: hsl(0 0% 100%);
  --datepicker-surface: hsl(270 25% 96%);

  --datepicker-text: hsl(265 15% 18%);
  --datepicker-muted: hsl(265 8% 54%);
  --datepicker-border: hsl(265 14% 86%);

  --datepicker-primary: hsl(265 45% 48%);
  --datepicker-primary-hover: hsl(265 45% 42%);
  --datepicker-primary-soft: hsl(265 45% 94%);

  --datepicker-on-primary: hsl(0 0% 100%);

  /* SHAPE */
  --datepicker-radius-sm: 10px;
  --datepicker-radius-md: 14px;
  --datepicker-radius-lg: 20px;

  /* TYPOGRAPHY */
  --datepicker-font-xs: 0.78rem;
  --datepicker-font-sm: 0.9rem;
  --datepicker-font-md: 1rem;

  /* SHADOW */
  --datepicker-shadow:
    0 16px 40px
    hsl(265 20% 20% / 0.14);

  position: relative;

  width: 420px;

  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  color: var(--datepicker-text);
}


/* LABEL */

.date-picker-label {
  display: block;

  margin-bottom: 7px;

  color: var(--datepicker-muted);

  font-size: var(--datepicker-font-sm);
  font-weight: 600;
}


/* INPUT */

.date-picker input {
  width: 100%;

  box-sizing: border-box;

  padding: 14px 16px;

  font: inherit;

  color: var(--datepicker-text);
  background: var(--datepicker-bg);

  border:
    1px solid
    var(--datepicker-border);

  border-radius:
    var(--datepicker-radius-md);

  outline: none;

  cursor: pointer;

  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;
}

.date-picker input:hover {
  border-color:
    var(--datepicker-muted);
}

.date-picker input:focus {
  border-color:
    var(--datepicker-primary);

  box-shadow:
    0 0 0 3px
    var(--datepicker-primary-soft);
}


/* POPOVER */

.calendar {
  position: absolute;

  z-index: 20;

  top: calc(100% + 10px);
  left: 0;

  width: 100%;

  box-sizing: border-box;

  padding: 22px;

  background:
    var(--datepicker-bg);

  border:
    1px solid
    var(--datepicker-border);

  border-radius:
    var(--datepicker-radius-lg);

  box-shadow:
    var(--datepicker-shadow);

  outline: none;
}


/* MONTH / YEAR */

.calendar-controls {
  display: grid;

  grid-template-columns:
    1fr 1fr;

  gap: 16px;

  margin-bottom: 22px;
}

.calendar-control {
  display: grid;

  grid-template-columns:
    40px 1fr 40px;

  align-items: center;

  gap: 4px;
}


/* NAV BUTTON */

.nav-button {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 40px;
  height: 40px;

  padding: 0;

  border: 0;

  border-radius:
    var(--datepicker-radius-sm);

  color:
    var(--datepicker-muted);

  background:
    transparent;

  font-size: 24px;
  line-height: 1;

  cursor: pointer;

  transition:
    color 130ms ease,
    background 130ms ease,
    transform 90ms ease;
}

.nav-button:hover {
  color:
    var(--datepicker-text);

  background:
    var(--datepicker-primary-soft);
}

.nav-button:active {
  transform:
    scale(0.92);
}

.nav-button:focus-visible {
  outline:
    2px solid
    var(--datepicker-primary);

  outline-offset: 2px;
}


/* SELECT WRAPPER */

.select-wrapper {
  position: relative;

  min-width: 0;
}

.select-wrapper::after {
  content: '▾';

  position: absolute;

  top: 50%;
  right: 10px;

  transform:
    translateY(-50%);

  color:
    var(--datepicker-muted);

  font-size: 20px;

  pointer-events: none;
}


/* SELECT */

.calendar-select {
  appearance: none;

  width: 100%;

  box-sizing: border-box;

  padding:
    9px 28px
    9px 10px;

  border:
    1px solid transparent;

  border-radius:
    var(--datepicker-radius-sm);

  color:
    var(--datepicker-text);

  background:
    transparent;

  font: inherit;
  font-weight: 600;

  text-align: center;

  cursor: pointer;

  transition:
    background 130ms ease,
    border-color 130ms ease;
}

.calendar-select:hover {
  background:
    var(--datepicker-primary-soft);
}

.calendar-select:focus-visible {
  outline:
    2px solid
    var(--datepicker-primary);

  outline-offset: 2px;
}


/* WEEKDAYS */

.weekdays {
  display: grid;

  grid-template-columns:
    repeat(7, 1fr);

  margin-bottom: 12px;

  text-align: center;
}

.weekday {
  display: flex;

  align-items: center;
  justify-content: center;

  height: 38px;

  color:
    var(--datepicker-muted);

  font-size:
    var(--datepicker-font-xs);

  font-weight: 650;
}

.weekday abbr {
  text-decoration: none;

  cursor: help;
}


/* VIEWPORT */

.calendar-grid-viewport {
  position: relative;

  height: 314px;
  box-sizing: border-box;

  padding: 5px;

  overflow: hidden;
}

.calendar-page {
  position: absolute;

  inset: 5px;

  width: auto;

  will-change: transform;
}


/* GRID */

.days-grid {
  display: grid;

  grid-template-columns:
    repeat(7, 1fr);

  row-gap: 4px;

  text-align: center;
}



/* DAY */

.calendar-day {
  display: flex;

  align-items: center;
  justify-content: center;

  width: 46px;
  height: 46px;

  margin: auto;

  padding: 0;

  border: 0;
  border-radius: 999px;

  color:
    var(--datepicker-text);

  background:
    transparent;

  font: inherit;

  font-size:
    var(--datepicker-font-sm);

  font-weight: 500;

  cursor: pointer;

  outline: none;

  transition:
    background 130ms ease,
    color 130ms ease,
    transform 90ms ease;
}

.calendar-day:hover {
  background:
    var(--datepicker-primary-soft);
}

.calendar-day:active {
  transform:
    scale(0.9);
}


/* ADJACENT MONTH */

.calendar-day--outside {
  color:
    var(--datepicker-muted);

  opacity: 0.5;
}

.calendar-day--outside:hover {
  opacity: 1;
}


/* TODAY */

.calendar-day--today {
  color:
    var(--datepicker-primary);

  box-shadow:
    inset 0 0 0 1.5px
    var(--datepicker-primary);
}


/* SELECTED */

.calendar-day--selected {
  color:
    var(--datepicker-on-primary);

  background:
    var(--datepicker-primary);

  font-weight: 650;

  box-shadow: none;
}

.calendar-day--selected:hover {
  background:
    var(--datepicker-primary-hover);
}


/* ACTIVE */

.calendar-day--active {
  outline:
    2px solid
    var(--datepicker-text);

  outline-offset: 2px;
}

.calendar-day--selected.calendar-day--active {
  outline-color:
    var(--datepicker-primary);

  outline-offset: 3px;
}


/* FOCUS */

.calendar-day:focus-visible {
  outline:
    2px solid
    var(--datepicker-text);

  outline-offset: 2px;
}


/* TRANSITION */

.calendar-forward-enter-active,
.calendar-forward-leave-active,
.calendar-backward-enter-active,
.calendar-backward-leave-active {
  transition:
    transform 320ms
    cubic-bezier(0.2, 0, 0, 1);
}


/* NEXT MONTH */

.calendar-forward-enter-from {
  transform:
    translate3d(0, 100%, 0);
}

.calendar-forward-enter-to {
  transform:
    translate3d(0, 0, 0);
}

.calendar-forward-leave-from {
  transform:
    translate3d(0, 0, 0);
}

.calendar-forward-leave-to {
  transform:
    translate3d(0, -100%, 0);
}


/* PREVIOUS MONTH */

.calendar-backward-enter-from {
  transform:
    translate3d(0, -100%, 0);
}

.calendar-backward-enter-to {
  transform:
    translate3d(0, 0, 0);
}

.calendar-backward-leave-from {
  transform:
    translate3d(0, 0, 0);
}

.calendar-backward-leave-to {
  transform:
    translate3d(0, 100%, 0);
}


/* REDUCED MOTION */

@media (
  prefers-reduced-motion:
  reduce
) {
  .calendar-forward-enter-active,
  .calendar-forward-leave-active,
  .calendar-backward-enter-active,
  .calendar-backward-leave-active {
    transition: none;
  }
}


/* SCREEN READER ONLY */

.visually-hidden {
  position: absolute;

  width: 1px;
  height: 1px;

  padding: 0;
  margin: -1px;

  overflow: hidden;

  clip:
    rect(0 0 0 0);

  white-space: nowrap;

  border: 0;
}
</style>
