import { describe, expect, it } from 'vitest';
import { validateAudiogramUpload } from '../audiogramUpload';

describe('validateAudiogramUpload', () => {
  it.each([
    ['malware.exe', 'application/x-msdownload'],
    ['payload.php', 'application/x-httpd-php'],
    ['script.svg', 'image/svg+xml'],
  ])('rejects active or executable file %s', (name, type) => {
    expect(validateAudiogramUpload({ name, type, size: 100 })).toBeTruthy();
  });

  it('accepts a small XML result with a matching MIME type', () => {
    expect(validateAudiogramUpload({ name: 'sonuc.xml', type: 'text/xml', size: 100 })).toBeNull();
  });

  it('rejects an allowed extension whose MIME type does not match', () => {
    expect(validateAudiogramUpload({ name: 'sonuc.xml', type: 'application/pdf', size: 100 })).toBeTruthy();
  });

  it('rejects empty and oversized files', () => {
    expect(validateAudiogramUpload({ name: 'sonuc.xml', type: 'text/xml', size: 0 })).toBeTruthy();
    expect(validateAudiogramUpload({ name: 'sonuc.xml', type: 'text/xml', size: 10 * 1024 * 1024 + 1 })).toBeTruthy();
  });
});
