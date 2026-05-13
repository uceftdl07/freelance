import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// TJM market data per technology (based on Moroccan IT market benchmarks)
// Augmented by real DB data when available
const TECH_BENCHMARKS: Record<string, { junior: number; senior: number; lead: number; demand: "high" | "medium" | "low" }> = {
  "React":        { junior: 450, senior: 750, lead: 1000, demand: "high" },
  "Next.js":      { junior: 480, senior: 780, lead: 1050, demand: "high" },
  "Vue.js":       { junior: 400, senior: 680, lead: 900,  demand: "medium" },
  "Angular":      { junior: 420, senior: 700, lead: 950,  demand: "medium" },
  "TypeScript":   { junior: 450, senior: 750, lead: 1000, demand: "high" },
  "Node.js":      { junior: 430, senior: 720, lead: 950,  demand: "high" },
  "Python":       { junior: 420, senior: 730, lead: 980,  demand: "high" },
  "Java":         { junior: 400, senior: 700, lead: 950,  demand: "medium" },
  "Go":           { junior: 500, senior: 820, lead: 1100, demand: "medium" },
  "C#":           { junior: 390, senior: 680, lead: 920,  demand: "medium" },
  "PHP":          { junior: 320, senior: 550, lead: 750,  demand: "low" },
  "AWS":          { junior: 500, senior: 850, lead: 1150, demand: "high" },
  "Azure":        { junior: 480, senior: 820, lead: 1100, demand: "high" },
  "DevOps":       { junior: 500, senior: 850, lead: 1150, demand: "high" },
  "Docker":       { junior: 430, senior: 720, lead: 950,  demand: "high" },
  "Kubernetes":   { junior: 500, senior: 850, lead: 1150, demand: "high" },
  "Terraform":    { junior: 480, senior: 800, lead: 1100, demand: "medium" },
  "Data Science": { junior: 500, senior: 850, lead: 1150, demand: "high" },
  "Spark":        { junior: 550, senior: 900, lead: 1200, demand: "high" },
  "Databricks":   { junior: 580, senior: 950, lead: 1250, demand: "medium" },
  "SQL":          { junior: 350, senior: 600, lead: 800,  demand: "medium" },
  "PostgreSQL":   { junior: 370, senior: 630, lead: 850,  demand: "medium" },
  "MongoDB":      { junior: 400, senior: 680, lead: 900,  demand: "medium" },
  "GraphQL":      { junior: 450, senior: 750, lead: 1000, demand: "medium" },
  "Elasticsearch":{ junior: 480, senior: 800, lead: 1050, demand: "medium" },
};

/**
 * GET /api/stats/tjm
 * Returns TJM statistics per technology — public endpoint.
 * Merges benchmark data with real posted offers from the DB.
 */
export async function getTjmStats(_req: Request, res: Response): Promise<void> {
  try {
    // Fetch all ACTIVE freelance offers that have TJM set
    const offers = await prisma.jobOffer.findMany({
      where: { status: "ACTIVE", contractType: "FREELANCE", tjm: { not: null } },
      select: { tjm: true, tags: true },
    });

    // Build a map: skill → list of TJMs from real offers
    const realTjms: Record<string, number[]> = {};
    for (const offer of offers) {
      let tags: string[] = [];
      try { tags = JSON.parse(offer.tags); } catch { /* skip */ }
      for (const tag of tags) {
        const key = Object.keys(TECH_BENCHMARKS).find(
          (k) => k.toLowerCase() === tag.toLowerCase()
        );
        if (key && offer.tjm) {
          if (!realTjms[key]) realTjms[key] = [];
          realTjms[key].push(offer.tjm);
        }
      }
    }

    const stats = Object.entries(TECH_BENCHMARKS).map(([skill, bench]) => {
      const real = realTjms[skill] || [];
      const avgReal = real.length > 0
        ? Math.round(real.reduce((a, b) => a + b, 0) / real.length)
        : null;

      return {
        skill,
        junior: bench.junior,
        senior: bench.senior,
        lead: bench.lead,
        demand: bench.demand,
        avgPosted: avgReal,
        offersCount: real.length,
      };
    });

    // Sort by demand (high first) then by senior TJM desc
    const demandOrder = { high: 0, medium: 1, low: 2 };
    stats.sort((a, b) => {
      if (demandOrder[a.demand] !== demandOrder[b.demand]) {
        return demandOrder[a.demand] - demandOrder[b.demand];
      }
      return b.senior - a.senior;
    });

    // Summary numbers
    const allSenior = Object.values(TECH_BENCHMARKS).map((b) => b.senior);
    const summary = {
      avgSeniorTjm: Math.round(allSenior.reduce((a, b) => a + b, 0) / allSenior.length),
      topTech: stats[0]?.skill ?? "React",
      totalOffers: offers.length,
      lastUpdated: new Date().toISOString(),
    };

    res.json({ success: true, data: { stats, summary } });
  } catch (error) {
    console.error("[Stats] TJM error:", error);
    res.status(500).json({ success: false, message: "Erreur lors du calcul des statistiques." });
  }
}

/**
 * GET /api/stats/overview
 * Public platform numbers for homepage StatsBar.
 */
export async function getOverviewStats(_req: Request, res: Response): Promise<void> {
  try {
    const [profiles, offers, companies] = await Promise.all([
      prisma.profileCandidat.count({ where: { status: "PUBLISHED" } }),
      prisma.jobOffer.count({ where: { status: "ACTIVE" } }),
      prisma.profileRecruteur.count(),
    ]);

    res.json({
      success: true,
      data: { profiles, offers, companies },
    });
  } catch (error) {
    console.error("[Stats] Overview error:", error);
    res.status(500).json({ success: false, message: "Erreur stats." });
  }
}
