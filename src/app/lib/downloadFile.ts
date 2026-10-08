/**
 * Reliable browser file download helper.
 * 
 * Prevents Chromium from falling back to raw Blob UUIDs as the filename.
 * In Chromium-based browsers (Chrome, Edge), if an <a> element is removed
 * immediately or if the blob is unattached to file metadata, Chrome's download
 * manager falls back to the URL's path (the UUID string) without a file extension.
 * 
 * Wrapping the blob in a File object and deferring element cleanup ensures the
 * designated filename and extension are always preserved.
 */
export function downloadFile(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;

  // Modern browsers support the File constructor which attaches filename metadata
  // to the underlying blob representation in the browser's blob registry.
  const file = typeof File !== 'undefined'
    ? new File([blob], filename, { type: blob.type })
    : blob;

  const url = URL.createObjectURL(file);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.setAttribute('download', filename);
  link.setAttribute('target', '_self');
  link.setAttribute('rel', 'noopener noreferrer');
  link.setAttribute('aria-hidden', 'true');
  link.style.position = 'fixed';
  link.style.left = '-10000px';
  link.style.top = '-10000px';
  link.style.width = '1px';
  link.style.height = '1px';
  link.style.opacity = '0';

  document.body.appendChild(link);

  try {
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(clickEvent);
  } catch {
    link.click();
  }

  // Defer removal so Chromium's background download thread finishes reading the anchor's download attribute.
  window.setTimeout(() => {
    try {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      URL.revokeObjectURL(url);
    } catch {}
  }, 60_000);
}
