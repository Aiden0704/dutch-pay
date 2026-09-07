export function escapeHtml(value: string): string {
  if (!value) {
    return value;
  }

  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return value.replace(/[&<>"']/g, (char) => {
    return htmlEntities[char];
  });
}
