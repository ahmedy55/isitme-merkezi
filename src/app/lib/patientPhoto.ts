/** Resize a patient portrait before persisting it to avoid storing full camera uploads. */
export async function resizePatientPhoto(file: File): Promise<string> {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 512 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Fotoğraf işlenemedi.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  return canvas.toDataURL('image/webp', 0.82);
}

export function isSupportedPatientPhoto(file: File): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 5 * 1024 * 1024;
}
