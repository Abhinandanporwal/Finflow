import * as React from "react"

interface CodeProps extends React.HTMLAttributes<HTMLElement> {}

const Code = React.forwardRef<HTMLElement, CodeProps>(({ className, ...props }, ref) => {
  return (
    <pre className="relative rounded bg-muted px-3 py-1.5 font-mono text-sm font-semibold" data-v9y="1">
      <code className={className} ref={ref} {...props} />
    </pre>
  )
})
Code.displayName = "Code"

export { Code }

