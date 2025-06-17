import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {

    return (
      <textarea
        dir="auto"
        className={cn(
          "flex min-h-[100px] md:min-h-[120px] w-full rounded-md border-2 border-input bg-background px-3 md:px-5 py-3 md:py-4 text-base md:text-lg font-medium leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-3 disabled:cursor-not-allowed disabled:opacity-50",
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
Textarea.displayName = "Textarea"

export { Textarea }