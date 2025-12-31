'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  text: string
  className?: string
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "copy-button p-2 rounded-lg hover:bg-primary/10 transition-all duration-200 hover:scale-110",
        className
      )}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500 transition-colors" />
      ) : (
        <Copy className="w-4 h-4 text-primary transition-colors" />
      )}
    </button>
  )
}