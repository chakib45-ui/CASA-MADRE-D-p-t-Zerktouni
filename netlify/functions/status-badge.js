/**
 * Netlify Function: status-badge.js
 * 
 * Générateur de Badge SVG Dynamique pour CASA MADRE - Dépôt Zerktouni.
 * Renvoie une image SVG vectorielle avec headers no-cache en temps réel.
 * 
 * Usage : 
 * - https://votre-domaine.netlify.app/.netlify/functions/status-badge
 * - ou configuré sous /api/status-badge via netlify.toml
 */

exports.handler = async function(event, context) {
  // Récupérer le nombre d'articles via query param s'il est transmis (ex: ?count=40&expected=40)
  const params = event.queryStringParameters || {};
  const count = params.count !== undefined ? parseInt(params.count, 10) : 40;
  const expected = params.expected !== undefined ? parseInt(params.expected, 10) : 40;
  const folder = params.folder || 'Antiquités';

  const isComplete = !isNaN(count) && count >= expected;
  const isPartial = !isNaN(count) && count > 0 && count < expected;

  // Configuration des textes et couleurs
  const leftText = 'CASA MADRE';
  let rightText = '';
  let rightColor = '#2ea44f'; // Vert (succès)

  if (isComplete) {
    rightText = `${count} Articles - Stock OK`;
    rightColor = '#2da44e'; // Vert émeraude
  } else if (isPartial) {
    rightText = `${count}/${expected} - Incomplet`;
    rightColor = '#df6828'; // Orange ambre
  } else {
    rightText = 'Non synchronisé';
    rightColor = '#cf222e'; // Rouge
  }

  // Calcul dynamique de largeur proportionnelle
  const leftWidth = 100;
  const rightWidth = Math.max(120, Math.round(rightText.length * 7.8 + 20));
  const totalWidth = leftWidth + rightWidth;
  const height = 24;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}" role="img" aria-label="${leftText}: ${rightText}">
  <title>${leftText}: ${rightText}</title>
  <linearGradient id="overlay" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="rounded">
    <rect width="${totalWidth}" height="${height}" rx="5" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#rounded)">
    <!-- Fond gauche (Marron maison d'art Zerktouni) -->
    <rect width="${leftWidth}" height="${height}" fill="#2e231c"/>
    <!-- Fond droit (Statut vert/orange/rouge) -->
    <rect x="${leftWidth}" width="${rightWidth}" height="${height}" fill="${rightColor}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#overlay)"/>
  </g>
  <!-- Typographie avec double ombre portée vectorielle pour netteté absolue -->
  <g fill="#fff" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" font-weight="600" font-size="11">
    <!-- Partie Gauche -->
    <text x="${leftWidth / 2}" y="16" fill="#010101" fill-opacity=".3">${leftText}</text>
    <text x="${leftWidth / 2}" y="15" fill="#f5ede3">${leftText}</text>
    <!-- Partie Droite -->
    <text x="${leftWidth + rightWidth / 2}" y="16" fill="#010101" fill-opacity=".3">${rightText}</text>
    <text x="${leftWidth + rightWidth / 2}" y="15" fill="#ffffff">${rightText}</text>
  </g>
</svg>`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*'
    },
    body: svg
  };
};
