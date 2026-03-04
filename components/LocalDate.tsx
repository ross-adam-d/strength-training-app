'use client'

interface LocalDateProps {
  date: string | Date
  options?: Intl.DateTimeFormatOptions
}

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}

export function LocalDate({ date, options = DEFAULT_OPTIONS }: LocalDateProps) {
  return <>{new Date(date).toLocaleDateString(undefined, options)}</>
}
