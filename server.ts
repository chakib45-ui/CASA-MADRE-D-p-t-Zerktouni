import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// High body limit for base64 antique photos
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy/safe initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

function cleanFileName(fileName: string): string {
  if (!fileName) return '';
  if (/whatsapp\s*image/i.test(fileName) || /^img[-_]/i.test(fileName) || /^pxl[-_]/i.test(fileName) || fileName.includes('23.15.51')) {
    return "Article d'Antiquité";
  }
  return fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Vision AI object identification endpoint for CASA MADRE
app.post('/api/analyze-vision', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', fileName = '' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 manquante' });
    }

    const fallbackName = cleanFileName(fileName) || "Article d'Antiquité";

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: false,
        name: fallbackName,
        category: 'Antiquités & Brocante',
        material: '',
        periodOrStyle: '',
        notice: 'GEMINI_API_KEY non configurée sur le serveur',
      });
    }

    // Strip prefix if present (e.g., data:image/jpeg;base64,)
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    const ai = getAi();
    const prompt =
      "Tu es un expert en antiquités, objets d'art et création de catalogues d'inventaire pour la maison CASA MADRE - Dépôt Antiquités.\n" +
      "Analyse cette photo d'article par vision IA.\n" +
      "DIRECTIVE STRICTE DE NOMMAGE : Attribue-lui UNIQUEMENT un nom simple, direct et précis en français (exemples de style attendu : Miroir doré Louis Philippe, Commode en marbre, Vase en céramique, Cassette VHS Disney, Disque vinyle 33T, Fauteuil cabriolet en noyer, Horloge comtoise en chêne, etc.).\n" +
      "Ne génère PAS de description longue dans le nom. Sois simple, fidèle et direct.\n" +
      "Identifie également sa catégorie générale d'antiquité, son matériau principal et son époque ou style estimé.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        },
        prompt,
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "Nom simple et direct de l'objet ou antiquité (ex: Miroir doré Louis Philippe, Commode en marbre, Vase en céramique)",
            },
            category: {
              type: Type.STRING,
              description: "Catégorie générale (ex: Mobilier d'époque, Miroiterie, Céramique, Musique & Vinyles)",
            },
            material: {
              type: Type.STRING,
              description: "Matière principale estimée (ex: Noyer massif, Bronze doré, Céramique émaillée)",
            },
            periodOrStyle: {
              type: Type.STRING,
              description: "Époque ou style estimé (ex: XIXe siècle, Époque Louis-Philippe, Années 1970)",
            },
          },
          required: ['name'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const finalName = parsed.name?.trim() || fallbackName;

    return res.json({
      success: true,
      name: finalName,
      category: parsed.category?.trim() || 'Antiquités & Brocante',
      material: parsed.material?.trim() || '',
      periodOrStyle: parsed.periodOrStyle?.trim() || '',
    });
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const isQuotaLimit =
      error?.status === 429 ||
      error?.code === 429 ||
      errorMsg.includes('429') ||
      errorMsg.includes('RESOURCE_EXHAUSTED') ||
      errorMsg.includes('quota') ||
      errorMsg.includes('rate-limits');

    if (isQuotaLimit) {
      console.warn('Quota API Vision temporairement atteint (429). Utilisation du nom standard par défaut.');
    } else {
      console.warn('Vision IA indisponible:', errorMsg);
    }

    const fallbackName = cleanFileName(req.body?.fileName) || "Article d'Antiquité";
    return res.json({
      success: false,
      name: fallbackName,
      category: 'Antiquités & Brocante',
      material: '',
      periodOrStyle: '',
      quotaExceeded: isQuotaLimit,
      notice: isQuotaLimit ? 'Quota temporairement atteint, nom par défaut appliqué.' : undefined,
    });
  }
});

async function startServer() {
  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
