export function inferCashPaymentMethod(accountName: string): string {
  const account = accountName.toLocaleLowerCase('tr-TR');
  if (account.includes('kredi') || account.includes('kart') || account.includes('pos')) return 'Kredi Kartı';
  if (account.includes('banka') || account.includes('havale') || account.includes('eft')) return 'Havale';
  return 'Nakit';
}
