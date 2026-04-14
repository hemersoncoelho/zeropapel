// Currency utilities — all monetary values stored in centavos (integers)

/**
 * Format centavos to Brazilian Real display format
 * e.g. 150000 → "R$ 1.500,00"
 */
export function formatCurrency(centavos: number): string {
  const reais = centavos / 100
  return reais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Parse a user-typed string to centavos integer
 * e.g. "1.500,00" → 150000
 */
export function parseToCentavos(value: string): number {
  // Remove currency symbol, spaces
  const cleaned = value.replace(/[R$\s]/g, '')
  // Replace Brazilian decimal separator: "1.500,50" → "1500.50"
  const normalized = cleaned.replace(/\./g, '').replace(',', '.')
  const float = parseFloat(normalized)
  if (isNaN(float)) return 0
  return Math.round(float * 100)
}

/**
 * Format date to Brazilian format
 * e.g. "2024-01-15" → "15/01/2024"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('pt-BR')
}

/**
 * Format date to short month format
 * e.g. "2024-01-15" → "15 Jan"
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

/**
 * Get initials from a name
 * e.g. "João Silva" → "JS"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')
}

/**
 * Format CNPJ for display
 * e.g. "12345678000195" → "12.345.678/0001-95"
 */
export function formatDocument(doc: string): string {
  const digits = doc.replace(/\D/g, '')
  if (digits.length === 14) {
    return digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    )
  }
  if (digits.length === 11) {
    return digits.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
      '$1.$2.$3-$4'
    )
  }
  return doc
}
