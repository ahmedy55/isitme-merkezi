const MAX_AUDIOGRAM_FILE_BYTES = 10 * 1024 * 1024;

const MIME_TYPES_BY_EXTENSION: Record<string, readonly string[]> = {
  xml: ['application/xml', 'text/xml'],
  pdf: ['application/pdf'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
};

export type AudiogramUploadFile = Pick<File, 'name' | 'size' | 'type'>;

export function validateAudiogramUpload(file: AudiogramUploadFile): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const allowedMimeTypes = MIME_TYPES_BY_EXTENSION[extension];

  if (!allowedMimeTypes) return 'Yalnızca XML, PDF, PNG veya JPG/JPEG dosyaları yüklenebilir.';
  if (!allowedMimeTypes.includes(file.type.toLowerCase())) return 'Dosya uzantısı ile içerik türü eşleşmiyor.';
  if (file.size <= 0) return 'Boş dosya yüklenemez.';
  if (file.size > MAX_AUDIOGRAM_FILE_BYTES) return 'Dosya boyutu 10 MB sınırını aşamaz.';

  return null;
}

export const AUDIOGRAM_BUCKET = 'patient-audiograms';
export const MAX_AUDIOGRAM_FILE_SIZE = MAX_AUDIOGRAM_FILE_BYTES;
