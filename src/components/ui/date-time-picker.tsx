"use client"

import * as React from "react"
import { Popover } from "@base-ui/react/popover"
import { CalendarIcon, ClockIcon, XIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  value: string // Format: YYYY-MM-DDTHH:MM
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  className?: string
}

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export function DateTimePicker({
  value,
  onChange,
  error,
  placeholder = "Select date & time...",
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Sync calendar view month with selected value, defaulting to today
  const [viewMonth, setViewMonth] = React.useState<Date>(() => {
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) return d
    }
    return new Date()
  })

  // Keep viewMonth synced if value changes from outside when popover is closed
  React.useEffect(() => {
    if (!open && value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        setViewMonth(d)
      }
    }
  }, [value, open])

  // Parse the current value
  const parsed = React.useMemo(() => {
    if (!value) return null
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
    if (!match) return null

    const [, yStr, mStr, dStr, hStr, minStr] = match
    const year = parseInt(yStr)
    const month = parseInt(mStr) // 1-indexed
    const day = parseInt(dStr)
    const hour24 = parseInt(hStr)
    const minute = parseInt(minStr)

    const ampm = hour24 >= 12 ? "PM" : "AM"
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12

    return {
      year,
      month,
      day,
      hour24,
      hour12,
      minute,
      ampm,
    }
  }, [value])

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault()
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault()
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleDateSelect = (day: number) => {
    const year = viewMonth.getFullYear()
    const month = viewMonth.getMonth() + 1 // 1-indexed

    const currentHour24 = parsed ? parsed.hour24 : 12
    const currentMinute = parsed ? parsed.minute : 0

    const yyyy = String(year).padStart(4, "0")
    const mm = String(month).padStart(2, "0")
    const dd = String(day).padStart(2, "0")
    const hh = String(currentHour24).padStart(2, "0")
    const min = String(currentMinute).padStart(2, "0")

    onChange(`${yyyy}-${mm}-${dd}T${hh}:${min}`)
  }

  const handleTimeChange = (type: "hour" | "minute" | "ampm", newVal: number | string) => {
    const today = new Date()
    const year = parsed ? parsed.year : today.getFullYear()
    const month = parsed ? parsed.month : today.getMonth() + 1
    const day = parsed ? parsed.day : today.getDate()

    let h12 = parsed ? parsed.hour12 : 12
    let m = parsed ? parsed.minute : 0
    let ap = parsed ? parsed.ampm : "PM"

    if (type === "hour") h12 = newVal as number
    if (type === "minute") m = newVal as number
    if (type === "ampm") ap = newVal as "AM" | "PM"

    let hour24 = h12 % 12
    if (ap === "PM") {
      hour24 += 12
    }

    const yyyy = String(year).padStart(4, "0")
    const mm = String(month).padStart(2, "0")
    const dd = String(day).padStart(2, "0")
    const hh = String(hour24).padStart(2, "0")
    const min = String(m).padStart(2, "0")

    onChange(`${yyyy}-${mm}-${dd}T${hh}:${min}`)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange("")
  }

  // Format value for trigger button display
  const displayString = React.useMemo(() => {
    if (!parsed) return placeholder
    const d = new Date(parsed.year, parsed.month - 1, parsed.day)
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" })
    const monthName = d.toLocaleDateString("en-US", { month: "short" })
    const displayHour = String(parsed.hour12).padStart(2, "0")
    const displayMin = String(parsed.minute).padStart(2, "0")
    return `${weekday}, ${parsed.day} ${monthName} ${parsed.year} · ${displayHour}:${displayMin} ${parsed.ampm}`
  }, [parsed, placeholder])

  // Calendar logic helpers
  const year = viewMonth.getFullYear()
  const monthIndex = viewMonth.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const firstDayIndex = new Date(year, monthIndex, 1).getDay()

  const calendarDays = React.useMemo(() => {
    const days: (number | null)[] = []
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }, [firstDayIndex, daysInMonth])

  // Time arrays
  const hoursList = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutesList = Array.from({ length: 12 }, (_, i) => i * 5)
  const ampms = ["AM", "PM"]

  return (
    <div className={cn("relative w-full", className)}>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <div className="relative flex items-center">
          <Popover.Trigger
            type="button"
            className={cn(
              "w-full text-left px-4 py-3 rounded-xl text-sm bg-[var(--cream-soft)] border text-[var(--green-ink)] outline-none focus:border-[var(--green)] transition-all flex items-center justify-between",
              error ? "border-[var(--danger)] bg-[rgba(179,58,42,0.04)]" : "border-[var(--surface-border)]",
              !value && "text-[var(--ink-mute)]"
            )}
          >
            <span className="truncate">{displayString}</span>
            <div className="flex items-center gap-2">
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-0.5 rounded-full hover:bg-[var(--cream-deep)] text-[var(--ink-mute)] hover:text-[var(--green-ink)] transition-colors"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
              <CalendarIcon className="size-4 text-[var(--ink-mute)] shrink-0" />
            </div>
          </Popover.Trigger>
        </div>

        <Popover.Portal>
          <Popover.Positioner side="bottom" align="start" sideOffset={6} className="isolate z-50">
            <Popover.Popup
              className="outline-none overflow-hidden rounded-2xl bg-[var(--cream-soft)] border border-[var(--surface-border)] text-[var(--green-ink)] shadow-2xl p-5 select-none animate-in fade-in-0 zoom-in-95 duration-100 max-w-[95vw] sm:max-w-none"
            >
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Calendar Panel */}
                <div className="flex-1 min-w-[260px]">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-lg hover:bg-[var(--cream-deep)] border border-[var(--surface-border)] transition-colors text-[var(--green-ink)]"
                    >
                      <ChevronLeftIcon className="size-4" />
                    </button>
                    <span className="font-semibold text-sm tracking-wide text-[var(--green-ink)]">
                      {MONTH_NAMES[monthIndex]} {year}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-lg hover:bg-[var(--cream-deep)] border border-[var(--surface-border)] transition-colors text-[var(--green-ink)]"
                    >
                      <ChevronRightIcon className="size-4" />
                    </button>
                  </div>

                  {/* Weekdays */}
                  <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                    {DAYS_OF_WEEK.map((day) => (
                      <span key={day} className="text-[10px] uppercase font-bold tracking-wider text-[var(--ink-mute)] py-1">
                        {day}
                      </span>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, idx) => {
                      if (day === null) {
                        return <div key={`empty-${idx}`} />
                      }

                      const isSelected =
                        parsed &&
                        parsed.year === year &&
                        parsed.month === monthIndex + 1 &&
                        parsed.day === day

                      const today = new Date()
                      const isToday =
                        today.getFullYear() === year &&
                        today.getMonth() === monthIndex &&
                        today.getDate() === day

                      return (
                        <button
                          key={`day-${day}`}
                          type="button"
                          onClick={() => handleDateSelect(day)}
                          className={cn(
                            "h-8 text-xs font-medium rounded-lg transition-all flex items-center justify-center border",
                            isSelected
                              ? "bg-[var(--green)] border-[var(--green)] text-[var(--cream)] font-bold shadow-sm"
                              : isToday
                              ? "border-[var(--green)] text-[var(--green-ink)] font-semibold"
                              : "border-transparent hover:bg-[var(--cream-deep)] text-[var(--green-ink)]"
                          )}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden sm:block w-[1px] bg-[var(--surface-border)]" />
                <div className="sm:hidden h-[1px] bg-[var(--surface-border)] w-full" />

                {/* Time Picker Panel */}
                <div className="flex flex-col min-w-[150px]">
                  <div className="flex items-center gap-1 text-[var(--ink-mute)] font-semibold text-xs tracking-wider uppercase mb-3">
                    <ClockIcon className="size-3.5" />
                    <span>Select Time</span>
                  </div>

                  <div className="flex gap-2.5 h-[160px]">
                    {/* Hour Column */}
                    <TimeColumn
                      label="Hour"
                      items={hoursList}
                      selected={parsed ? parsed.hour12 : undefined}
                      onChange={(h) => handleTimeChange("hour", h)}
                    />

                    {/* Minute Column */}
                    <TimeColumn
                      label="Min"
                      items={minutesList}
                      selected={parsed ? parsed.minute : undefined}
                      formatValue={(m) => String(m).padStart(2, "0")}
                      onChange={(m) => handleTimeChange("minute", m)}
                    />

                    {/* AM/PM Column */}
                    <TimeColumn
                      label="AM/PM"
                      items={ampms}
                      selected={parsed ? parsed.ampm : undefined}
                      onChange={(ap) => handleTimeChange("ampm", ap)}
                    />
                  </div>
                </div>
              </div>

              {/* Action/Footer Area */}
              <div className="mt-5 pt-3 border-t border-[var(--surface-border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[var(--green)] text-[var(--cream)] hover:bg-[var(--green-deep)] transition-colors shadow-sm"
                >
                  Done
                </button>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}

interface TimeColumnProps<T> {
  label: string
  items: T[]
  selected?: T
  formatValue?: (val: T) => string
  onChange: (val: T) => void
}

function TimeColumn<T extends number | string>({
  label,
  items,
  selected,
  formatValue = (val) => String(val),
  onChange,
}: TimeColumnProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const itemRefs = React.useRef<{ [key: string]: HTMLButtonElement | null }>({})

  // Automatically scroll selected item into view
  React.useEffect(() => {
    if (selected !== undefined && itemRefs.current[selected]) {
      itemRefs.current[selected]?.scrollIntoView({ block: "nearest", behavior: "auto" })
    }
  }, [selected])

  return (
    <div className="flex-1 flex flex-col items-center">
      <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--ink-mute)] mb-1">
        {label}
      </span>
      <div
        ref={containerRef}
        className="w-full flex-1 overflow-y-auto pr-1 flex flex-col gap-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[var(--surface-border)] h-[135px]"
        style={{ scrollbarWidth: "thin" }}
      >
        {items.map((item) => {
          const isSelected = selected === item
          const stringVal = String(item)

          return (
            <button
              key={stringVal}
              ref={(el) => {
                itemRefs.current[stringVal] = el
              }}
              type="button"
              onClick={() => onChange(item)}
              className={cn(
                "w-full h-7 rounded-md text-[11px] font-semibold flex items-center justify-center transition-colors shrink-0",
                isSelected
                  ? "bg-[var(--green)] text-[var(--cream)]"
                  : "hover:bg-[var(--cream-deep)] text-[var(--green-ink)] animate-none"
              )}
            >
              {formatValue(item)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
