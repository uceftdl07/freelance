import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import { supabaseAdmin } from "../utils/supabase";
import { prisma } from "../utils/prisma";


// ─── Multer Config (memory storage for cloud uploads) ─

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: { mimetype: string; originalname: string },
  cb: multer.FileFilterCallback
) => {
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Seuls les fichiers PDF et Word (.doc, .docx) sont acceptés."));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single("cv");

// ─── Supabase Storage Bucket ──────────────────

const BUCKET = "resumes";

async function uploadToSupabase(
  buffer: Buffer,
  originalName: string,
  mimetype: string
): Promise<string> {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = path.extname(originalName);
  const fileName = `cv-${uniqueSuffix}${ext}`;

  // 10s timeout — prevents hanging if Supabase storage is misconfigured
  const uploadPromise = supabaseAdmin.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType: mimetype, upsert: false });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Supabase upload timeout")), 10000)
  );

  const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path);

  return publicUrl;
}

// ─── Skills Database (for matching) ───────────

const KNOWN_SKILLS: Record<string, string[]> = {
  // Frontend
  React: ["react", "reactjs", "react.js"],
  Vue: ["vue", "vuejs", "vue.js"],
  Angular: ["angular", "angularjs"],
  TypeScript: ["typescript", "ts"],
  JavaScript: ["javascript", "js", "es6", "ecmascript"],
  HTML: ["html", "html5"],
  CSS: ["css", "css3", "sass", "scss", "less"],
  "Next.js": ["next", "nextjs", "next.js"],
  "Tailwind CSS": ["tailwind", "tailwindcss"],
  // Backend
  "Node.js": ["node", "nodejs", "node.js"],
  Python: ["python", "python3"],
  Java: ["java", "jdk", "jvm"],
  "C#": ["c#", "csharp", ".net", "dotnet", "asp.net"],
  PHP: ["php", "laravel", "symfony"],
  Ruby: ["ruby", "rails", "ruby on rails"],
  Go: ["go", "golang"],
  Rust: ["rust"],
  // Data
  SQL: ["sql", "mysql", "postgresql", "postgres", "mariadb"],
  MongoDB: ["mongodb", "mongo", "nosql"],
  Redis: ["redis"],
  Elasticsearch: ["elasticsearch", "elastic"],
  // DevOps
  Docker: ["docker", "dockerfile", "container"],
  Kubernetes: ["kubernetes", "k8s"],
  AWS: ["aws", "amazon web services", "s3", "ec2", "lambda"],
  Azure: ["azure", "microsoft azure"],
  GCP: ["gcp", "google cloud"],
  "CI/CD": ["ci/cd", "cicd", "jenkins", "gitlab ci", "github actions"],
  Terraform: ["terraform", "iac"],
  Ansible: ["ansible"],
  // Data Science
  "Machine Learning": ["machine learning", "ml", "deep learning", "dl"],
  TensorFlow: ["tensorflow", "tf"],
  PyTorch: ["pytorch", "torch"],
  Pandas: ["pandas"],
  Spark: ["spark", "pyspark", "apache spark"],
  // Other
  Git: ["git", "github", "gitlab", "bitbucket"],
  Linux: ["linux", "ubuntu", "debian", "centos"],
  Agile: ["agile", "scrum", "kanban", "sprint"],
  REST: ["rest", "restful", "api rest"],
  GraphQL: ["graphql", "gql"],
  Cybersécurité: ["cybersecurité", "cybersecurity", "siem", "soc", "pentest"],
};

// ─── Parsing Engine ───────────────────────────

interface ParsedCV {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  skills: string[];
  yearsOfExperience: number;
  title: string;
  location: string;
  linkedIn: string;
  rawText: string;
}

function extractSkills(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found = new Set<string>();

  for (const [skill, aliases] of Object.entries(KNOWN_SKILLS)) {
    for (const alias of aliases) {
      // Word boundary matching to avoid false positives
      const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(lowerText)) {
        found.add(skill);
        break;
      }
    }
  }

  return Array.from(found);
}

function extractYearsOfExperience(text: string): number {
  // Patterns: "10 ans d'expérience", "5 years of experience", "8+ years", "expérience: 7 ans"
  const patterns = [
    /(\d{1,2})\s*(?:\+)?\s*ans?\s*(?:d['']?\s*)?expérien/i,
    /expérien\w*\s*(?:de\s+)?(\d{1,2})\s*ans?/i,
    /(\d{1,2})\s*(?:\+)?\s*years?\s*(?:of\s+)?experience/i,
    /experience\s*(?:of\s+)?(\d{1,2})\s*(?:\+)?\s*years?/i,
    /(\d{1,2})\s*(?:\+)?\s*ans?\s*dans/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseInt(match[1], 10);
  }

  // Fallback: count year ranges in experience sections
  const yearRanges = text.match(/20\d{2}\s*[-–—]\s*(?:20\d{2}|présent|present|actuel|aujourd)/gi);
  if (yearRanges && yearRanges.length > 0) {
    return Math.min(yearRanges.length * 2, 20); // Rough estimate
  }

  return 0;
}

function extractName(text: string): { firstName: string; lastName: string } {
  // Try to find name at the beginning of the CV (first few lines)
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim();
    // Name pattern: 2-3 capitalized words, no special chars
    const nameMatch = line.match(/^([A-ZÀ-Ü][a-zà-ü]+)\s+([A-ZÀ-Ü][A-ZÀ-Üa-zà-ü]+)(?:\s+([A-ZÀ-Ü][a-zà-ü]+))?$/);
    if (nameMatch) {
      return {
        firstName: nameMatch[1],
        lastName: nameMatch[3] ? `${nameMatch[2]} ${nameMatch[3]}` : nameMatch[2],
      };
    }
    // ALL CAPS last name: "Jean DUPONT"
    const capsMatch = line.match(/^([A-ZÀ-Ü][a-zà-ü]+)\s+([A-ZÀ-Ü]{2,})$/);
    if (capsMatch) {
      return { firstName: capsMatch[1], lastName: capsMatch[2] };
    }
  }

  return { firstName: "", lastName: "" };
}

function extractEmail(text: string): string {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : "";
}

function extractPhone(text: string): string {
  // French phone patterns
  const patterns = [
    /(?:\+33|0033|0)\s*[1-9](?:[\s.-]*\d{2}){4}/,
    /\+?\d{1,3}[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/,
  ];
  for (const p of patterns) {
    const match = text.match(p);
    if (match) return match[0].trim();
  }
  return "";
}

function extractLocation(text: string): string {
  const cities = [
    "Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Lille",
    "Nantes", "Strasbourg", "Rennes", "Nice", "Montpellier",
    "Grenoble", "Rouen", "Toulon", "Dijon", "Angers",
  ];
  const lowerText = text.toLowerCase();
  for (const city of cities) {
    if (lowerText.includes(city.toLowerCase())) return city;
  }
  // Try "Île-de-France", "Remote"
  if (lowerText.includes("île-de-france") || lowerText.includes("idf")) return "Paris (Île-de-France)";
  if (lowerText.includes("remote") || lowerText.includes("télétravail")) return "Remote";
  return "";
}

function extractTitle(text: string, skills: string[]): string {
  // Try to find job title in first 10 lines
  const titlePatterns = [
    /(?:développeur|developer|ingénieur|engineer|consultant|architecte|lead|chef de projet|product manager|data scientist|data engineer|devops|sre|designer)\s*[^\n]*/i,
  ];
  const lines = text.split("\n").slice(0, 15);
  for (const line of lines) {
    for (const pattern of titlePatterns) {
      const match = line.match(pattern);
      if (match) return match[0].trim().slice(0, 80);
    }
  }
  // Generate from skills
  if (skills.includes("React") || skills.includes("Vue") || skills.includes("Angular")) {
    return "Développeur Frontend";
  }
  if (skills.includes("Node.js") || skills.includes("Python") || skills.includes("Java")) {
    return "Développeur Backend";
  }
  if (skills.includes("Docker") || skills.includes("Kubernetes") || skills.includes("AWS")) {
    return "Ingénieur DevOps";
  }
  return "";
}

function extractLinkedIn(text: string): string {
  const match = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/);
  return match ? match[0] : "";
}

async function parseCVFromBuffer(buffer: Buffer, originalName: string): Promise<ParsedCV> {
  const ext = path.extname(originalName).toLowerCase();
  let rawText = "";

  if (ext === ".pdf") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require("pdf-parse");
    const fn = typeof pdfParse === "function" ? pdfParse : (pdfParse as any).default;
    const pdfData = await fn(buffer);
    rawText = pdfData.text;
  } else {
    // For Word docs, extract basic text (simplified)
    rawText = buffer.toString("utf-8");
  }

  const skills = extractSkills(rawText);
  const { firstName, lastName } = extractName(rawText);

  return {
    firstName,
    lastName,
    email: extractEmail(rawText),
    phone: extractPhone(rawText),
    skills,
    yearsOfExperience: extractYearsOfExperience(rawText),
    title: extractTitle(rawText, skills),
    location: extractLocation(rawText),
    linkedIn: extractLinkedIn(rawText),
    rawText: rawText.slice(0, 5000), // Limit for response
  };
}

// ─── Upload & Parse Controller ────────────────

export async function uploadAndParseCV(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Aucun fichier CV téléchargé.",
      });
      return;
    }

    const fileBuffer = req.file.buffer;
    const originalName = req.file.originalname;
    const mimetype = req.file.mimetype;

    // Upload to Supabase Storage
    let publicUrl: string | null = null;
    try {
      publicUrl = await uploadToSupabase(fileBuffer, originalName, mimetype);
      console.log("[CV] Uploaded to Supabase Storage:", publicUrl);
    } catch (uploadErr) {
      console.error("[CV] Supabase upload error (continuing with parse):", uploadErr);
    }

    // Parse the CV from the in-memory buffer
    const parsed = await parseCVFromBuffer(fileBuffer, originalName);

    res.json({
      success: true,
      message: "CV analysé avec succès.",
      data: {
        parsed: {
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          email: parsed.email,
          phone: parsed.phone,
          skills: parsed.skills,
          yearsOfExperience: parsed.yearsOfExperience,
          title: parsed.title,
          location: parsed.location,
          linkedIn: parsed.linkedIn,
        },
        file: {
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          url: publicUrl,
        },
      },
    });
  } catch (error) {
    console.error("[CV] Upload/Parse error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'analyse du CV.",
    });
  }
}

// ─── Save Parsed Profile ──────────────────────

export async function saveParsedProfile(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const {
      firstName, lastName, title, bio, skills,
      yearsOfExperience, availability, portfolioUrl,
      tjm, location, phone, linkedIn,
    } = req.body;

    const profile = await prisma.profileCandidat.upsert({
      where: { userId },
      update: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        title: title || undefined,
        bio: bio || undefined,
        skills: skills ? JSON.stringify(Array.isArray(skills) ? skills : []) : undefined,
        yearsOfExperience: yearsOfExperience ?? undefined,
        availability: availability || undefined,
        portfolioUrl: portfolioUrl || undefined,
        tjm: tjm ?? undefined,
        location: location || undefined,
        phone: phone || undefined,
        linkedIn: linkedIn || undefined,
      },
      create: {
        userId,
        firstName: firstName || "",
        lastName: lastName || "",
        title,
        bio,
        skills: JSON.stringify(Array.isArray(skills) ? skills : []),
        yearsOfExperience,
        availability: availability || "DISPONIBLE",
        portfolioUrl,
        tjm,
        location,
        phone,
        linkedIn,
      },
    });

    res.json({
      success: true,
      message: "Profil sauvegardé avec succès.",
      data: profile,
    });
  } catch (error) {
    console.error("[CV] SaveProfile error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la sauvegarde du profil.",
    });
  }
}
