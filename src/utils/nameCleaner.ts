export function getCleanArticleName(name: string): string {
  if (!name || /whatsapp\s*image/i.test(name) || name.includes('23.15.51')) {
    return "Article d'Antiquité";
  }
  return name;
}

export function getCleanPeriod(period?: string): string {
  if (!period || /style et époque préservés/i.test(period)) {
    return '';
  }
  return period;
}

export function getCleanMaterial(material?: string): string {
  if (!material || /matière et patine d'origine/i.test(material)) {
    return '';
  }
  return material;
}

export function shouldShowRef(ref?: string): boolean {
  if (!ref) return false;
  if (ref === 'CM-0001' || ref === 'CM-0002') return false;
  return true;
}
