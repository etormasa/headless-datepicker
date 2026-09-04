import type {
  CalendarDay,
  CalendarState,
  NavigationAnchor,
} from './types'

export class CalendarEngine {
  private state: CalendarState

  constructor() {
    const today = Temporal.Now.plainDateISO()

    const navigationAnchor: NavigationAnchor =
      today.day === today.daysInMonth
        ? {
            type: 'end-of-month',
          }
        : {
            type: 'day',
            day: today.day,
          }

    this.state = {
      activeDate: today,
      selectedDate: today,
      navigationAnchor,
    }
  }

  getState(): CalendarState {
    return {
      ...this.state,
      navigationAnchor: {
        ...this.state.navigationAnchor,
      },
    }
  }

  private getTargetDay(
    targetDate: Temporal.PlainDate,
  ): number {
    if (
      this.state.navigationAnchor.type ===
      'end-of-month'
    ) {
      return targetDate.daysInMonth
    }

    return Math.min(
      this.state.navigationAnchor.day,
      targetDate.daysInMonth,
    )
  }

  private navigateTo(
    months: number,
    years: number,
  ): void {
    const targetDate = this.state.activeDate
      .with({
        day: 1,
      })
      .add({
        months,
        years,
      })

    const targetDay =
      this.getTargetDay(targetDate)

    this.state.activeDate =
      targetDate.with({
        day: targetDay,
      })
  }

  nextMonth(): void {
    this.navigateTo(1, 0)
  }

  previousMonth(): void {
    this.navigateTo(-1, 0)
  }

  nextYear(): void {
    this.navigateTo(0, 1)
  }

  previousYear(): void {
    this.navigateTo(0, -1)
  }

  setMonth(month: number): void {
    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      throw new RangeError(
        'Month must be between 1 and 12',
      )
    }

    const targetDate = this.state.activeDate
      .with({
        day: 1,
      })
      .with({
        month,
      })

    const targetDay =
      this.getTargetDay(targetDate)

    this.state.activeDate =
      targetDate.with({
        day: targetDay,
      })
  }

  setYear(year: number): void {
    if (!Number.isInteger(year)) {
      throw new RangeError(
        'Year must be an integer',
      )
    }

    const targetDate = this.state.activeDate
      .with({
        day: 1,
      })
      .with({
        year,
      })

    const targetDay =
      this.getTargetDay(targetDate)

    this.state.activeDate =
      targetDate.with({
        day: targetDay,
      })
  }

  selectDate(
    date: Temporal.PlainDate,
  ): void {
    this.state.selectedDate = date
    this.state.activeDate = date

    if (
      date.day === date.daysInMonth
    ) {
      this.state.navigationAnchor = {
        type: 'end-of-month',
      }
    } else {
      this.state.navigationAnchor = {
        type: 'day',
        day: date.day,
      }
    }
  }

  moveActiveDate(
    days: number,
  ): void {
    const newActiveDate =
      this.state.activeDate.add({
        days,
      })

    this.state.activeDate =
      newActiveDate

    this.state.navigationAnchor =
      newActiveDate.day ===
      newActiveDate.daysInMonth
        ? {
            type: 'end-of-month',
          }
        : {
            type: 'day',
            day: newActiveDate.day,
          }
  }

  getCalendarDays(): CalendarDay[] {
    const firstDay =
      this.state.activeDate.with({
        day: 1,
      })

    const leadingDays =
      firstDay.dayOfWeek % 7

    const gridStart =
      firstDay.subtract({
        days: leadingDays,
      })

    const today =
      Temporal.Now.plainDateISO()

    const days: CalendarDay[] = []

    for (
      let index = 0;
      index < 42;
      index++
    ) {
      const date =
        gridStart.add({
          days: index,
        })

      const isCurrentMonth =
        date.month ===
          this.state.activeDate.month &&
        date.year ===
          this.state.activeDate.year

      const isSelected =
        date.equals(
          this.state.selectedDate,
        )

      const isToday =
        date.equals(today)

      const isActive =
        date.equals(
          this.state.activeDate,
        )

      days.push({
        date,
        isCurrentMonth,
        isSelected,
        isToday,
        isActive,
      })
    }

    return days
  }
}
