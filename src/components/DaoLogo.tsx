import React from 'react'

export function DaoLogo({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="道衍"
    >
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M16 2 C16 2, 8 9, 16 16 C24 23, 16 30, 16 30"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="16" cy="9" r="2.5" fill="currentColor" />
      <circle cx="16" cy="23" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  )
}
