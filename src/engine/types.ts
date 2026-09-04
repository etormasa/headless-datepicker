export interface CalendarDay {
  date: Temporal.PlainDate
  isCurrentMonth: boolean
  isSelected: boolean
  isToday: boolean
  isActive: boolean
}

export type NavigationAnchor =
  | {
      type: 'day'
      day: number
    }
  | {
      type: 'end-of-month'
    }

export interface CalendarState {
  activeDate: Temporal.PlainDate
  selectedDate: Temporal.PlainDate
  navigationAnchor: NavigationAnchor
}
