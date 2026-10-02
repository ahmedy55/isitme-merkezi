export interface RecallMetricRecord {
  status: string;
  planDate: string;
}

const monthNumbers: Record<string, string> = {
  oca: '01', ocak: '01',
  şub: '02', sub: '02', şubat: '02', subat: '02',
  mar: '03', mart: '03',
  nis: '04', nisan: '04',
  may: '05', mayıs: '05', mayis: '05',
  haz: '06', haziran: '06',
  tem: '07', temmuz: '07',
  ağu: '08', agu: '08', ağustos: '08', agustos: '08',
  eyl: '09', eylül: '09', eylul: '09',
  eki: '10', ekim: '10',
  kas: '11', kasım: '11', kasim: '11',
  ara: '12', aralık: '12', aralik: '12',
};

export function toRecallDateKey(value: string): string {
  const trimmed = value.trim();
  const isoDate = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;

  const turkishDate = trimmed.toLocaleLowerCase('tr-TR').match(/^(\d{1,2})\s+([\p{L}]+)\s+(\d{4})$/u);
  if (!turkishDate) return '';

  const [, day, monthName, year] = turkishDate;
  const month = monthNumbers[monthName];
  return month ? `${year}-${month}-${day.padStart(2, '0')}` : '';
}

export function isRecallOverdue(record: RecallMetricRecord, today: string): boolean {
  const planDate = toRecallDateKey(record.planDate);
  return record.status === 'Tarihi Geçti'
    || (record.status === 'Bekliyor' && Boolean(planDate) && planDate < today);
}

export function getRecallCounts<T extends RecallMetricRecord>(records: T[], today: string) {
  return records.reduce((counts, record) => {
    if (isRecallOverdue(record, today)) counts.overdue += 1;
    else if (record.status === 'Bekliyor') counts.pending += 1;
    if (record.status === 'Gönderildi') counts.sent += 1;

    return counts;
  }, { total: records.length, pending: 0, sent: 0, overdue: 0 });
}
