import * as React from "react"

import { cn } from "@/lib/utils"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-12 md:h-14 w-full rounded-md border-2 border-input bg-background px-3 md:px-5 py-3 md:py-4 text-base md:text-lg font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-3 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

export { Select }