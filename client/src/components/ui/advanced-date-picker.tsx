"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { format, setYear, setMonth, setDate as setDay, getYear, getMonth, getDate, isValid, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, isSameDay, isSameMonth, addYears, subYears } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

type ViewMode = "year" | "month" | "day"

interface AdvancedDatePickerProps {
  date?: Date
  onSelect?: (date: Date) => void
  className?: string
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export function AdvancedDatePicker({
  date,
  onSelect,
  className,
}: AdvancedDatePickerProps) {
  const [view, setView] = React.useState<ViewMode>("year")
  const [currentDate, setCurrentDate] = React.useState<Date>(date || new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [inputValue, setInputValue] = React.useState<string>(date ? format(date, "dd/MM/yyyy") : "")
  
  // Range for year view pagination
  const [yearRangeStart, setYearRangeStart] = React.useState<number>(Math.floor(getYear(new Date()) / 12) * 12)

  // Update internal state if prop changes
  React.useEffect(() => {
    if (date) {
      setCurrentDate(date)
      setSelectedDate(date)
      setInputValue(format(date, "dd/MM/yyyy"))
      setYearRangeStart(Math.floor(getYear(date) / 12) * 12)
    }
  }, [date])

  const handleYearSelect = (year: number) => {
    const newDate = setYear(currentDate, year)
    setCurrentDate(newDate)
    setView("month")
  }

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(currentDate, monthIndex)
    setCurrentDate(newDate)
    setView("day")
  }

  const handleDaySelect = (dayDate: Date) => {
    if (!isValid(dayDate)) return
    
    setSelectedDate(dayDate)
    setCurrentDate(dayDate)
    setInputValue(format(dayDate, "dd/MM/yyyy"))
    
    if (onSelect) {
      onSelect(dayDate)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only numbers and slashes
    if (!/^[\d/]*$/.test(value)) return
    
    setInputValue(value)

    // Validate date format dd/MM/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split('/').map(Number)
      const parsedDate = new Date(year, month - 1, day)
      
      if (isValid(parsedDate) && parsedDate.getFullYear() === year && parsedDate.getMonth() === month - 1 && parsedDate.getDate() === day) {
        setCurrentDate(parsedDate)
        setSelectedDate(parsedDate)
        setView("day")
        if (onSelect) onSelect(parsedDate)
      }
    }
  }

  const years = React.useMemo(() => {
    const yearsList = []
    for (let i = 0; i < 12; i++) {
      yearsList.push(yearRangeStart + i)
    }
    return yearsList
  }, [yearRangeStart])

  const calendarDays = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate))
    const end = endOfWeek(endOfMonth(currentDate))
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const handlePrev = () => {
    if (view === "year") {
      setYearRangeStart(prev => prev - 12)
    } else if (view === "month") {
      setCurrentDate(setYear(currentDate, getYear(currentDate) - 1))
    } else {
      setCurrentDate(subMonths(currentDate, 1))
    }
  }

  const handleNext = () => {
    if (view === "year") {
      setYearRangeStart(prev => prev + 12)
    } else if (view === "month") {
      setCurrentDate(setYear(currentDate, getYear(currentDate) + 1))
    } else {
      setCurrentDate(addMonths(currentDate, 1))
    }
  }

  const getHeaderText = () => {
    if (view === "year") return `${yearRangeStart} - ${yearRangeStart + 11}`
    if (view === "month") return format(currentDate, "yyyy")
    return format(currentDate, "MMMM yyyy")
  }

  return (
    <div className={cn("w-[300px] sm:w-[320px] bg-card border border-border rounded-lg shadow-lg overflow-hidden flex flex-col", className)}>
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-border bg-secondary/10 shrink-0">
        <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            if (view === "day") setView("month")
            else if (view === "month") setView("year")
          }}
          className="font-semibold text-sm hover:bg-secondary/50 px-2"
        >
          {getHeaderText()}
        </Button>

        <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* View Content */}
      <div className="p-3 flex-1 min-h-[300px]">
        {view === "year" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 h-full content-start animate-in fade-in zoom-in-95 duration-200">
            {years.map((year) => (
              <Button
                key={year}
                variant={getYear(currentDate) === year ? "default" : "ghost"}
                onClick={() => handleYearSelect(year)}
                className={cn(
                  "h-12 text-sm w-full", 
                  getYear(currentDate) === year && "bg-primary text-primary-foreground shadow-md"
                )}
              >
                {year}
              </Button>
            ))}
          </div>
        )}

        {view === "month" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 h-full content-start animate-in fade-in zoom-in-95 duration-200">
            {MONTH_NAMES.map((month, index) => (
              <Button
                key={month}
                variant={getMonth(currentDate) === index ? "default" : "outline"}
                onClick={() => handleMonthSelect(index)}
                className={cn(
                  "h-12 text-sm w-full font-medium",
                  getMonth(currentDate) === index && "bg-primary text-primary-foreground shadow-md"
                )}
              >
                {month}
              </Button>
            ))}
          </div>
        )}

        {view === "day" && (
          <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2 font-medium">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="flex items-center justify-center h-8">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isToday = isSameDay(day, new Date())

                return (
                  <Button
                    key={i}
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDaySelect(day)}
                    disabled={!isCurrentMonth} 
                    className={cn(
                      "h-9 w-full p-0 font-normal text-sm aria-selected:opacity-100 transition-all",
                      !isCurrentMonth && "text-muted-foreground opacity-20 invisible pointer-events-none", // Hide days from other months for cleaner look or disable them
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-sm scale-105",
                      isToday && !isSelected && "bg-accent text-accent-foreground font-bold border border-primary/20",
                    )}
                  >
                    {format(day, "d")}
                  </Button>
                )
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer - Manual Input */}
      <div className="p-3 border-t border-border bg-secondary/5 shrink-0">
        <div className="relative">
          <input 
            type="text"
            placeholder="DD/MM/YYYY"
            value={inputValue}
            onChange={handleInputChange}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-center tracking-widest font-mono uppercase placeholder:normal-case placeholder:tracking-normal"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
            NUMERIC
          </div>
        </div>
      </div>
    </div>
  )
}
