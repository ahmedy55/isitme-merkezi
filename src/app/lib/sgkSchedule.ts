export function monthKey(date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit' }).format(date);
}
export function expectedPaymentMonth(invoiceMonth: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(invoiceMonth)) throw new Error('Geçerli bir fatura dönemi seçin.');
  const [year, month] = invoiceMonth.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + 2, 1));
  return date.toISOString().slice(0, 7);
}
export function monthsUntil(expected: string, current = monthKey()): number {
  const [ey, em] = expected.split('-').map(Number);
  const [cy, cm] = current.split('-').map(Number);
  return (ey - cy) * 12 + em - cm;
}
export function monthLabel(value: string): string {
  return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}-01T00:00:00Z`));
}
