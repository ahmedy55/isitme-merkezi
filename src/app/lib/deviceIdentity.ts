export interface DeviceIdentity { barcode?: string; serialNo?: string }

/** Keyboard-wedge readers send text and Enter. Preserve leading zeroes. */
export function parseDeviceScan(raw: string, target: 'barcode' | 'serialNo' = 'barcode'): DeviceIdentity {
  const value = raw.replace(/[\r\n]+$/g, '').trim();
  if (!value || value.length > 512) throw new Error('Geçerli bir barkod veya seri numarası okutun.');
  const text = value.replace(/^\]C1|^\]d2/, '');
  // Explicit GS1 human-readable AIs; never infer a serial from a product barcode.
  const gtin = text.match(/\(01\)(\d{14})(?=\(|$)/)?.[1];
  const serial = text.match(/\(21\)([^\x1d(]+)/)?.[1];
  if (gtin) return { barcode: gtin, ...(serial ? { serialNo: serial } : {}) };
  if (/^01\d{14}/.test(text) && (value.startsWith(']') || text.includes('\x1d'))) {
    const rest = text.slice(16).replace(/^\x1d/, '');
    if (!rest || /^21[^\x1d]+$/.test(rest)) return { barcode: text.slice(2, 16), ...(rest ? { serialNo: rest.slice(2) } : {}) };
    throw new Error('Bu birleşik etiketi ayrı barkod ve seri numarası alanlarına okutun.');
  }
  if (/[\x00-\x1f]/.test(text)) throw new Error('Etiket biçimi desteklenmiyor; barkod ve seri numarasını ayrı okutun.');
  return { [target]: text };
}

export function findScannedDevices<T extends DeviceIdentity>(devices: T[], raw: string): T[] {
  const identity = parseDeviceScan(raw);
  const code = identity.barcode;
  return devices.filter(d => identity.serialNo
    ? d.barcode === code && d.serialNo === identity.serialNo
    : d.barcode === code || d.serialNo === code);
}
