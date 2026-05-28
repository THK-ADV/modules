import DOMPurify from 'isomorphic-dompurify'
import { marked } from 'marked'

/** Parse markdown and sanitize HTML for safe {@html} rendering. */
export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown) as string
  return DOMPurify.sanitize(html)
}

/** Sanitize raw HTML for safe {@html} rendering. */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html)
}
