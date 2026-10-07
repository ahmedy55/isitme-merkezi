const transliteratePdfText = (value: string) => value
  .replace(/[₺]/g, 'TRY ')
  .replace(/[ıİ]/g, match => match === 'ı' ? 'i' : 'I')
  .replace(/[şŞ]/g, match => match === 'ş' ? 's' : 'S')
  .replace(/[ğĞ]/g, match => match === 'ğ' ? 'g' : 'G')
  .replace(/[üÜ]/g, match => match === 'ü' ? 'u' : 'U')
  .replace(/[öÖ]/g, match => match === 'ö' ? 'o' : 'O')
  .replace(/[çÇ]/g, match => match === 'ç' ? 'c' : 'C')
  .replace(/[–—]/g, '-')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\x20-\x7E]/g, '?');

export function createReportPdf(lines: string[]): Blob {
  const wrappedLines = lines.flatMap(line => {
    const text = transliteratePdfText(line);
    const wrapped: string[] = [];
    for (let index = 0; index < text.length; index += 92) wrapped.push(text.slice(index, index + 92));
    return wrapped.length ? wrapped : [''];
  });
  const pages = Array.from({ length: Math.max(1, Math.ceil(wrappedLines.length / 48)) }, (_, index) => wrappedLines.slice(index * 48, (index + 1) * 48));
  const objects: string[] = [];
  const pageIds = pages.map((_, index) => 4 + index * 2);
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';

  pages.forEach((pageLines, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    const commands = pageLines.map((line, lineIndex) => {
      const escaped = line.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
      return `BT /F1 10 Tf 48 ${790 - lineIndex * 15} Td (${escaped}) Tj ET`;
    }).join('\n');
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}
