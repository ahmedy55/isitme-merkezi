/**
 * AudiPro SaaS — Form & Veri Doğrulama Yardımcıları (validation.ts)
 */

/**
 * 11 Haneli TC Kimlik Numarası Algoritması Doğrulaması
 */
export function validateTcKn(tc: string): { isValid: boolean; error?: string } {
  if (!tc) return { isValid: false, error: 'TC Kimlik Numarası boş olamaz.' };
  const cleaned = tc.replace(/\D/g, '');
  if (cleaned.length !== 11) return { isValid: false, error: 'TC Kimlik Numarası 11 haneli olmalıdır.' };
  if (cleaned[0] === '0') return { isValid: false, error: 'TC Kimlik Numarası 0 ile başlayamaz.' };

  const digits = cleaned.split('').map(Number);
  
  const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sumEven = digits[1] + digits[3] + digits[5] + digits[7];
  
  const tenthDigit = ((sumOdd * 7) - sumEven) % 10;
  if (tenthDigit !== digits[9]) return { isValid: false, error: 'Geçersiz TC Kimlik Numarası.' };

  const sumFirst10 = digits.slice(0, 10).reduce((acc, curr) => acc + curr, 0);
  const eleventhDigit = sumFirst10 % 10;
  if (eleventhDigit !== digits[10]) return { isValid: false, error: 'Geçersiz TC Kimlik Numarası.' };

  return { isValid: true };
}

/**
 * Pozitif Mali Tutar Doğrulaması
 */
export function validatePositiveAmount(amount: number | string): { isValid: boolean; error?: string } {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num <= 0) {
    return { isValid: false, error: 'Tutar 0\'dan büyük pozitif bir sayı olmalıdır.' };
  }
  return { isValid: true };
}

/**
 * Gelecek / Bugün Tarihi Doğrulaması (Geçmiş randevu engeli)
 */
export function validateAppointmentDate(dateStr: string): { isValid: boolean; error?: string } {
  if (!dateStr) return { isValid: false, error: 'Tarih seçiniz.' };
  const selectedDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return { isValid: false, error: 'Randevu tarihi geçmiş bir gün olamaz.' };
  }
  return { isValid: true };
}
