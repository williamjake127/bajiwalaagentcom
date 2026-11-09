export const DEFAULT_BRAND_NAME = 'Bajiwala Baji365';

export const defaultSettings = {
  site_name: DEFAULT_BRAND_NAME,
  site_logo: '/wp-content/uploads/2026/07/logo.png',
  site_icon: '/wp-content/uploads/2026/07/ChatGPT-Image-Jul-27-2026-06_49_47-PM.webp',
  complain_whatsapp: '27635215141',
  site_title: `${DEFAULT_BRAND_NAME} Official Agent List`,
  site_tagline: `Play Safe, Play Smart! Only deal with verified ${DEFAULT_BRAND_NAME} agents.`
};

export function sanitizeBrandText(text, targetBrand = DEFAULT_BRAND_NAME) {
  if (!text || typeof text !== 'string') return text;
  const brand = targetBrand || DEFAULT_BRAND_NAME;
  return text
    .replace(/9xbet\s*9wicket\s*9xbet9/gi, brand)
    .replace(/chorki\s*365/gi, brand)
    .replace(/chorki/gi, brand)
    .replace(/চরকি\s*(৩৬৫|365)/g, brand)
    .replace(/চরকি/g, brand)
    .replace(/\bVELKI\b/g, brand)
    .replace(/\bVelki\b/g, brand)
    .replace(/\bvelki\b/g, brand)
    .replace(/ভেলকি/g, brand)
    .replace(/Bhelki/gi, brand);
}

export function normalizeSiteName(name) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return DEFAULT_BRAND_NAME;
  }
  const trimmed = name.trim();
  if (/^(9xbet\s*9wicket\s*9xbet9|chorki\s*365|chorki|velki|bhelki|চরকি\s*৩৬৫|চরকি\s*365|চরকি|ভেলকি)$/i.test(trimmed)) {
    return DEFAULT_BRAND_NAME;
  }
  if (/9xbet\s*9wicket\s*9xbet9|chorki|চরকি|velki|ভেলকি|bhelki/i.test(trimmed)) {
    return sanitizeBrandText(trimmed, DEFAULT_BRAND_NAME);
  }
  return trimmed;
}

export const defaultAgents = [];
