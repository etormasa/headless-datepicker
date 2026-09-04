# Headless Date Picker

A framework-independent date picker engine built with TypeScript and the native Temporal API, with a Vue 3 presentation layer.

The main goal of this project is to keep calendar logic decoupled from the UI framework.

## Features

- Framework-independent calendar engine
- Native Temporal API for date calculations
- Previous and next month navigation
- Previous and next year navigation
- Direct month and year selection
- Leading and trailing days from adjacent months
- Date selection
- Keyboard navigation with arrow keys
- Enter to select the active date
- Escape to close the calendar
- Click outside to close
- Accessible date labels and focus management
- CSS custom properties for theming
- Reduced-motion support
- Animated month transitions

## Architecture

The project is divided into two main layers:

```text
CalendarEngine.ts
        ↓
Calendar state and date calculations
        ↓
DatePicker.vue
        ↓
Vue rendering and user interaction
```

### Calendar Engine

`CalendarEngine.ts` contains the calendar domain logic.

It is independent from Vue and is responsible for:

- Managing the active date
- Managing the selected date
- Month and year navigation
- Preserving navigation intent between months
- Generating the calendar grid
- Determining whether a date is selected, active, today, or outside the current month

The engine does not contain Vue, DOM, CSS, or presentation-specific logic.

### Vue Presentation Layer

`DatePicker.vue` is responsible for rendering and user interaction.

It handles:

- Rendering the input and calendar
- Opening and closing the calendar popover
- Keyboard events
- Focus management
- Month transition animations
- Accessibility attributes
- Synchronizing Vue reactive state with the calendar engine

Vue does not perform the calendar calculations directly. It asks the engine to perform an operation and then retrieves the updated state.

## State Bridge

The `CalendarEngine` intentionally does not use Vue reactivity.

The Vue component creates a normal instance of the engine:

```ts
const engine = new CalendarEngine()
```

Vue stores snapshots of the engine state:

```ts
const state = ref(engine.getState())
const days = ref(engine.getCalendarDays())
```

After an engine operation, Vue retrieves the updated data:

```ts
engine.nextMonth()

state.value = engine.getState()
days.value = engine.getCalendarDays()
```

This keeps the calendar logic reusable while still allowing Vue to reactively render the result.

## Calendar Grid

The engine generates 42 calendar cells:

```text
7 days × 6 weeks = 42 cells
```

It first finds the first day of the active month and determines how many days from the previous month are needed before it.

From that starting date, the engine generates 42 consecutive `Temporal.PlainDate` values.

Each calendar day contains metadata:

```ts
interface CalendarDay {
  date: Temporal.PlainDate
  isCurrentMonth: boolean
  isSelected: boolean
  isToday: boolean
  isActive: boolean
}
```

The Vue layer can then decide how each day should look without performing date calculations itself.

## Navigation Behavior

The engine uses a navigation anchor to preserve the intended day while moving between months.

For example:

```text
January 30
→ February 28
→ March 30
```

If the active date represents the end of a month, the engine preserves that intention:

```text
January 31
→ February 28
→ March 31
→ April 30
```

For shorter months, the target day is clamped to the last valid day of that month.

## Temporal API

The project uses the JavaScript `Temporal` API for date calculations instead of a third-party date library.

Examples include:

```ts
Temporal.Now.plainDateISO()

date.add({ months: 1 })

date.with({ day: 1 })

date.subtract({ days: 3 })
```

Temporal also handles calendar rollover automatically.

For example:

```text
December 2026 + 1 month
→ January 2027
```

This means the engine does not need custom logic for cases such as month 13 or moving from January to December of the previous year.

## Keyboard Support

When the calendar is open:

```text
Arrow Left   → Previous day
Arrow Right  → Next day
Arrow Up     → Previous week
Arrow Down   → Next week
Enter        → Select active date and close
Escape       → Close calendar
```

When keyboard navigation crosses into another month, focus is temporarily kept on the calendar container while the transition occurs and is then moved to the new active date.

## Styling

The Date Picker uses CSS custom properties for theme values such as:

```css
--datepicker-bg
--datepicker-text
--datepicker-primary
--datepicker-border
--datepicker-radius-lg
```

This keeps visual configuration in the presentation layer and separate from the calendar engine.

The component also respects:

```css
prefers-reduced-motion
```

to disable transition animations for users who prefer reduced motion.

## Project Structure

```text
src/
├── components/
│   └── DatePicker.vue
│
├── engine/
│   ├── CalendarEngine.ts
│   └── types.ts
│
├── App.vue
├── main.ts
└── style.css
```

### `CalendarEngine.ts`

Contains framework-independent calendar state and date calculations.

### `types.ts`

Contains the TypeScript interfaces and types used by the calendar engine.

### `DatePicker.vue`

Contains the Vue presentation layer, user interaction, keyboard handling, focus management, accessibility, and animations.

### `App.vue`

Root Vue component used to display the Date Picker demo.

### `main.ts`

Application entry point that creates and mounts the Vue application.

## Running the Project

Clone the repository:

```bash
git clone https://github.com/etormasa/headless-datepicker.git
```

Enter the project:

```bash
cd headless-datepicker
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

## Tech Stack

- Vue 3
- TypeScript
- Vite
- Temporal API
- CSS

## Main Design Decision

The main architectural decision was keeping the calendar engine independent from Vue.

The engine owns calendar state and date calculations.

Vue owns rendering, focus, keyboard interaction, animations, and presentation.

This separation keeps the domain logic easier to understand and allows the engine to be reused with another presentation layer without rewriting the calendar calculations.
