import express from 'express';
import path from 'path';
import fs from 'fs';
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

// Helper to resolve base64 and mimeType from either imageBase64 or imageUrl
async function resolveImageData(
  imageBase64?: string,
  imageUrl?: string,
  fallbackMime: string = 'image/jpeg'
): Promise<{ data: string; mimeType: string } | null> {
  // 1. Direct base64 string or data-uri
  if (imageBase64) {
    if (imageBase64.startsWith('data:')) {
      const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return { mimeType: match[1], data: match[2] };
      }
    }
    const clean = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
    return { mimeType: fallbackMime, data: clean };
  }

  // 2. From imageUrl
  if (imageUrl) {
    if (imageUrl.startsWith('data:')) {
      const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return { mimeType: match[1], data: match[2] };
      }
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      try {
        const fetchRes = await fetch(imageUrl);
        if (fetchRes.ok) {
          const buffer = await fetchRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const headerMime = fetchRes.headers.get('content-type')?.split(';')[0];
          return {
            data: base64,
            mimeType: headerMime || fallbackMime,
          };
        }
      } catch (err) {
        console.warn('Erreur téléchargement imageUrl externe:', err);
      }
    }

    if (imageUrl.startsWith('/')) {
      try {
        const cleanPath = imageUrl.replace(/^\//, '');
        const localPath = path.join(process.cwd(), 'public', cleanPath);
        if (fs.existsSync(localPath)) {
          const buffer = fs.readFileSync(localPath);
          let mime = fallbackMime;
          if (cleanPath.endsWith('.svg')) mime = 'image/svg+xml';
          else if (cleanPath.endsWith('.png')) mime = 'image/png';
          else if (cleanPath.endsWith('.webp')) mime = 'image/webp';
          return { data: buffer.toString('base64'), mimeType: mime };
        }
      } catch (err) {
        console.warn('Erreur lecture image locale public:', err);
      }
    }
  }

  return null;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Full article analysis with Gemini AI for ArticleEditorModal
// Analyzes image to automatically populate material, period, dimensions, description, etc.
app.post('/api/gemini/analyze-article', async (req, res) => {
  try {
    const { imageBase64, imageUrl, mimeType = 'image/jpeg', currentName = '' } = req.body;

    const resolved = await resolveImageData(imageBase64, imageUrl, mimeType);
    if (!resolved || !resolved.data) {
      return res.status(400).json({
        success: false,
        error: 'Aucune donnée d\'image valide fournie pour l\'analyse.',
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        error: 'La clé GEMINI_API_KEY n\'est pas configurée dans les paramètres du serveur.',
      });
    }

    const ai = getAi();
    const prompt =
      "Tu es un conservateur et expert évaluateur en mobilier d'art, antiquités françaises et européennes, objets de collection et brocante de prestige pour la maison CASA MADRE - Dépôt Zerktouni.\n\n" +
      "Analyse attentivement cette photographie d'objet d'art ou meuble ancien pour rédiger sa notice d'inventaire professionnelle complète.\n\n" +
      "Fournis en français les informations d'expertise suivantes :\n" +
      "1. Matière : liste précise des essences de bois (noyer massif, chêne maillé, merisier, acajou...), métaux (bronze ciselé et doré, laiton, fer forgé...), marbres, céramiques, verres ou textiles.\n" +
      "2. Époque / Style : identification historique exacte du règne ou du style (ex: Époque Louis XV, XVIIIe siècle (vers 1750), Style Napoléon III, Art Déco circa 1930, etc.) avec datation ou siècle estimé.\n" +
      "3. Dimensions : estimation métrique réaliste et proportionnée pour ce type d'objet (ex: H: 86 cm × L: 120 cm × P: 58 cm, ou Diamètre: 35 cm).\n" +
      "4. Description : notice descriptive élégante et soignée pour le catalogue, détaillant l'ornementation, la structure, la facture, le travail d'ébénisterie ou de sculpture et les détails remarquables.\n" +
      "5. Nom : intitulé synthétique noble et concis de l'objet (ex: Commode sauteuse galbée Louis XV, Miroir à fronton doré, Enfilade de propriété en chêne).\n" +
      "6. État de conservation : appréciation sobre de la patine et de l'état visible (ex: Très bel état de conservation, patine d'origine, légères usures d'usage).\n" +
      "7. Catégorie : catégorie générale d'inventaire (ex: Mobilier d'époque, Miroiterie & Dorure, Céramique & Porcelaine, Sièges & Boiserie, Luminaires)." +
      (currentName ? `\n(Indication préliminaire de l'objet : "${currentName}")` : '');

    const candidateModels = ['gemini-2.5-flash', 'gemini-3.8-flash'];
    let lastError: any = null;
    let responseText = '';

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType: resolved.mimeType,
                data: resolved.data,
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
                  description: "Intitulé concis et professionnel de l'objet en français",
                },
                material: {
                  type: Type.STRING,
                  description: "Matière(s) et finitions principales (ex: Noyer massif sculpté, bronzes dorés au mercure)",
                },
                periodOrStyle: {
                  type: Type.STRING,
                  description: "Époque ou style artistique estimé (ex: Époque Louis XV, XVIIIe siècle)",
                },
                dimensions: {
                  type: Type.STRING,
                  description: "Dimensions réalistes estimées (ex: H: 86 cm × L: 120 cm × P: 58 cm)",
                },
                description: {
                  type: Type.STRING,
                  description: "Description détaillée et esthétique pour la notice du catalogue",
                },
                condition: {
                  type: Type.STRING,
                  description: "État de conservation estimé d'après le visuel",
                },
                category: {
                  type: Type.STRING,
                  description: "Catégorie générale d'inventaire de l'objet",
                },
              },
              required: ['material', 'periodOrStyle', 'dimensions', 'description'],
            },
          },
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Tentative avec le modèle ${model} échouée, essai du modèle suivant...`, err?.message || err);
      }
    }

    if (!responseText) {
      throw lastError || new Error('Aucune réponse obtenue des modèles Gemini.');
    }

    const parsed = JSON.parse(responseText || '{}');

    return res.json({
      success: true,
      name: parsed.name?.trim() || currentName || "Article d'Antiquité",
      material: parsed.material?.trim() || '',
      periodOrStyle: parsed.periodOrStyle?.trim() || '',
      dimensions: parsed.dimensions?.trim() || '',
      description: parsed.description?.trim() || '',
      condition: parsed.condition?.trim() || '',
      category: parsed.category?.trim() || "Mobilier d'époque",
    });
  } catch (error: any) {
    console.error('Erreur API analyze-article Gemini:', error);
    const errorMsg = error?.message || String(error);
    const isQuota =
      error?.status === 429 ||
      error?.code === 429 ||
      errorMsg.includes('429') ||
      errorMsg.includes('RESOURCE_EXHAUSTED');

    return res.status(isQuota ? 429 : 500).json({
      success: false,
      error: isQuota
        ? 'Limite de requêtes temporairement atteinte (429). Veuillez patienter quelques secondes avant de réessayer.'
        : `Erreur lors de l'analyse Gemini : ${errorMsg}`,
    });
  }
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
      model: 'gemini-3.8-flash',
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
