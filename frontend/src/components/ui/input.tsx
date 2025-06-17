import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {

    return (
      <input
        type={type}
        dir="auto"
        className={cn(
          "flex h-12 md:h-14 w-full rounded-md border-2 border-input bg-background px-3 md:px-5 py-3 md:py-4 text-base md:text-lg font-medium ring-offset-background file:border-0 file:bg-transparent file:text-base md:file:text-lg file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-3 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={(node) => {
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }