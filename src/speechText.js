function splitLongSegment(segment, maxLength) {
  const characters = Array.from(segment);
  const pieces = [];
  let offset = 0;

  while (characters.length - offset > maxLength) {
    let splitAt = maxLength;
    for (let index = maxLength - 1; index > maxLength * 0.6; index -= 1) {
      if (/\s/u.test(characters[offset + index])) {
        splitAt = index;
        break;
      }
    }
    pieces.push(characters.slice(offset, offset + splitAt).join("").trim());
    offset += splitAt;
    while (/\s/u.test(characters[offset] ?? "")) offset += 1;
  }
  if (offset < characters.length) pieces.push(characters.slice(offset).join("").trim());
  return pieces.filter(Boolean);
}

export function splitSpeechText(text, maxLength = 1800) {
  const segments = text.match(/[^.!?。！？\n]+[.!?。！？]*\n*|[.!?。！？]+\n*|\n+/gu) ?? [text];
  const chunks = [];
  let current = "";

  for (const rawSegment of segments) {
    const segment = rawSegment.trim();
    if (!segment) continue;

    for (const piece of splitLongSegment(segment, maxLength)) {
      if (current && Array.from(current).length + 1 + Array.from(piece).length > maxLength) {
        chunks.push(current);
        current = "";
      }
      current = current ? `${current} ${piece}` : piece;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}
