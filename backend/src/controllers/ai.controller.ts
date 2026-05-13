import { Request, Response } from "express";
import Groq from "groq-sdk";
import { z } from "zod";
import { env } from "../config/env";

function getClient(): Groq {
  if (!env.GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured.");
  return new Groq({ apiKey: env.GROQ_API_KEY });
}

// ─── Schemas ──────────────────────────────────────────────────────

const optimizeProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  title: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  yearsOfExperience: z.number().optional(),
  tjm: z.number().optional(),
  location: z.string().optional(),
  experiences: z.array(z.object({
    title: z.string(),
    company: z.string(),
    description: z.string().optional(),
  })).optional(),
});

const optimizeMissionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(""),
  location: z.string().optional(),
  remote: z.boolean().optional(),
  tjm: z.number().optional(),
  tags: z.array(z.string()).optional(),
  contractType: z.string().optional(),
});

const analyzeCvSchema = z.object({
  cvText: z.string().min(50).max(10000),
  targetTitle: z.string().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────

async function callGroq(prompt: string, systemPrompt: string): Promise<string> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
}

// ─── Controllers ──────────────────────────────────────────────────

/**
 * POST /api/ai/optimize-profile
 * Generate an optimized bio + pitch for a freelance candidate.
 */
export async function optimizeProfile(req: Request, res: Response): Promise<void> {
  try {
    const validation = optimizeProfileSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, message: "Données invalides.", errors: validation.error.flatten().fieldErrors });
      return;
    }

    const d = validation.data;
    const skillsStr = (d.skills || []).join(", ") || "non spécifiées";
    const xpStr = d.yearsOfExperience ? `${d.yearsOfExperience} ans d'expérience` : "";
    const expStr = (d.experiences || [])
      .map((e) => `${e.title} chez ${e.company}${e.description ? ` — ${e.description}` : ""}`)
      .join("\n") || "Non précisées";

    const prompt = `
Freelance IT au Maroc :
- Nom : ${d.firstName} ${d.lastName}
- Titre actuel : ${d.title || "Non renseigné"}
- Compétences : ${skillsStr}
- Expérience : ${xpStr}
- TJM : ${d.tjm ? `${d.tjm} MAD/jour` : "Non renseigné"}
- Localisation : ${d.location || "Non renseignée"}
- Expériences professionnelles :
${expStr}
- Bio actuelle : ${d.bio || "Aucune"}
`.trim();

    const systemPrompt = `Tu es un expert en personal branding pour les freelances IT au Maroc.
Tu génères des profils percutants et professionnels pour des plateformes comme FreelanceIT.ma.
Tu dois répondre UNIQUEMENT en JSON valide avec ces champs :
{
  "title": "titre professionnel optimisé (ex: Expert React.js & Node.js | 8 ans)",
  "bio": "présentation professionnelle (3-4 phrases, percutante, en français)",
  "pitch": "pitch commercial en 2 phrases max pour convaincre un recruteur",
  "suggestedSkills": ["skill1", "skill2", ...] // jusqu'à 3 compétences complémentaires suggérées
}`;

    const raw = await callGroq(prompt, systemPrompt);
    let parsed: unknown;
    try {
      // Extract JSON even if wrapped in markdown code block
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);
    } catch {
      parsed = { bio: raw };
    }

    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error("[AI] OptimizeProfile error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la génération IA." });
  }
}

/**
 * POST /api/ai/optimize-mission
 * Generate an optimized job description for a recruiter.
 */
export async function optimizeMission(req: Request, res: Response): Promise<void> {
  try {
    const validation = optimizeMissionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, message: "Données invalides.", errors: validation.error.flatten().fieldErrors });
      return;
    }

    const d = validation.data;
    const prompt = `
Mission IT à optimiser :
- Titre : ${d.title}
- Description actuelle : ${d.description || "Non renseignée"}
- Localisation : ${d.location || "Non renseignée"}
- Remote : ${d.remote ? "Oui" : "Non"}
- TJM : ${d.tjm ? `${d.tjm} MAD/jour` : "Non renseigné"}
- Tags : ${(d.tags || []).join(", ") || "Non renseignés"}
- Type de contrat : ${d.contractType || "FREELANCE"}
`.trim();

    const systemPrompt = `Tu es un expert RH spécialisé dans le recrutement IT au Maroc.
Tu optimises les offres de mission pour attirer les meilleurs freelances sur FreelanceIT.ma.
Tu dois répondre UNIQUEMENT en JSON valide avec ces champs :
{
  "title": "titre optimisé et accrocheur",
  "description": "description complète et structurée (contexte, missions, profil recherché, avantages) en français, 200-300 mots",
  "suggestedTags": ["tag1", "tag2", ...], // jusqu'à 5 compétences clés à ajouter
  "tips": "1-2 conseils pour rendre l'offre plus attractive"
}`;

    const raw = await callGroq(prompt, systemPrompt);
    let parsed: unknown;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);
    } catch {
      parsed = { description: raw };
    }

    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error("[AI] OptimizeMission error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de la génération IA." });
  }
}

/**
 * POST /api/ai/analyze-cv
 * Analyze a CV text and suggest missing skills + improvements.
 */
export async function analyzeCv(req: Request, res: Response): Promise<void> {
  try {
    const validation = analyzeCvSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, message: "Données invalides.", errors: validation.error.flatten().fieldErrors });
      return;
    }

    const { cvText, targetTitle } = validation.data;
    const prompt = `
CV à analyser :
${cvText}
${targetTitle ? `\nObjectif professionnel ciblé : ${targetTitle}` : ""}
`.trim();

    const systemPrompt = `Tu es un coach carrière spécialisé pour les freelances IT au Maroc.
Tu analyses les CVs et fournis des recommandations concrètes et actionnables.
Tu dois répondre UNIQUEMENT en JSON valide avec ces champs :
{
  "strengths": ["point fort 1", "point fort 2", ...], // 2-4 points forts identifiés
  "missingSkills": ["skill1", "skill2", ...], // 3-5 compétences manquantes pour le marché IT marocain actuel
  "improvements": ["amélioration 1", "amélioration 2", ...], // 3-5 suggestions d'amélioration concrètes
  "estimatedLevel": "JUNIOR | INTERMEDIATE | SENIOR | LEAD",
  "marketabilityScore": 75, // score 0-100 représentant l'attractivité sur le marché freelance IT marocain
  "summary": "analyse globale en 2-3 phrases"
}`;

    const raw = await callGroq(prompt, systemPrompt);
    let parsed: unknown;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);
    } catch {
      parsed = { summary: raw };
    }

    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error("[AI] AnalyzeCV error:", error);
    res.status(500).json({ success: false, message: "Erreur lors de l'analyse IA." });
  }
}
