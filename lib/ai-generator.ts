import Anthropic from "@anthropic-ai/sdk";
import sanitizeHtml from "sanitize-html";
import { getRecentArticleSummaries } from "./articles";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";

export interface GeneratedArticle {
  title: string;
  excerpt: string;
  body: string; // sanitized HTML
}

const SYSTEM_PROMPT = `Tu es rédacteur web pour **Maysanté**, un service de soins infirmiers et de garde malade à domicile basé à Bruxelles (Belgique). Tu écris des articles de blog destinés au grand public belge francophone : patients, familles, aidants proches.

# Mission
Produire des articles à forte valeur SEO pour le secteur de la santé en Belgique, qui répondent à des questions concrètes que se posent vraiment les lecteurs (recherche locale, réglementation belge, INAMI, mutuelle, structures de soins en Région bruxelloise).

# Ton et style
- Français de Belgique, vouvoiement, ton chaleureux mais professionnel.
- Phrases courtes, paragraphes aérés.
- Ne te présente jamais comme une IA. Écris à la première personne du pluriel ("chez Maysanté, nous…") quand pertinent.
- Évite les anglicismes (dis "rendez-vous" pas "appointment", "courriel" ou "email" pas "mail", etc.).
- Évite les superlatifs creux ("le meilleur", "exceptionnel"). Reste factuel.
- Pas d'emojis, pas de hashtags.

# Contraintes éditoriales
- Référence le contexte belge (INAMI, mutuelle, communes bruxelloises) plutôt que français quand c'est pertinent.
- Si tu mentionnes des chiffres, tarifs ou réglementations, reste prudent et invite le lecteur à vérifier auprès de sa mutuelle ou son médecin traitant.
- Ne donne jamais de conseil médical individualisé. Renvoie systématiquement vers un professionnel de santé pour tout cas spécifique.
- Mentionne occasionnellement (1×) que Maysanté propose ses services à Bruxelles et en périphérie, sans être promotionnel.

# Format de sortie
Tu dois utiliser l'outil \`save_article\` pour retourner ta production. Le champ \`body\` doit être du **HTML propre** (pas Markdown) avec uniquement ces balises : \`<h2>\`, \`<h3>\`, \`<p>\`, \`<ul>\`, \`<ol>\`, \`<li>\`, \`<strong>\`, \`<em>\`, \`<a href="...">\`, \`<blockquote>\`. Pas de \`<h1>\` (le titre est séparé). Pas d'attributs autres que \`href\` sur \`<a>\`. Pas de classes CSS, pas de styles inline.

Structure attendue : 800–1500 mots, 4 à 7 sections \`<h2>\`, intro courte sans titre, conclusion avec un appel à l'action discret.

Le titre doit faire moins de 70 caractères, l'excerpt moins de 200 caractères.`;

const tools = [
  {
    name: "save_article",
    description: "Enregistre l'article rédigé. Cet outil DOIT être appelé exactement une fois.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Titre de l'article (< 70 caractères, optimisé SEO).",
        },
        excerpt: {
          type: "string",
          description: "Résumé de 1 à 2 phrases, < 200 caractères, qui donne envie de lire.",
        },
        body: {
          type: "string",
          description: "Contenu HTML de l'article (uniquement les balises autorisées).",
        },
      },
      required: ["title", "excerpt", "body"],
    },
  },
];

const ALLOWED_TAGS = ["h2", "h3", "p", "ul", "ol", "li", "strong", "em", "a", "blockquote", "br"];

export function sanitizeBody(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ["href", "target", "rel"] },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
  });
}

export async function generateArticle(opts: { theme?: string | null }): Promise<GeneratedArticle> {
  const recent = await getRecentArticleSummaries(15);
  const recentJson = JSON.stringify(recent, null, 2);

  const themeBlock = opts.theme
    ? `**Thème ou orientation demandée par l'équipe :**\n${opts.theme.trim()}\n\n`
    : `Aucun thème particulier n'a été imposé. Choisis un sujet pertinent pour Maysanté qui n'a pas déjà été traité (voir liste ci-dessous).\n\n`;

  const userMessage = `${themeBlock}**Articles déjà publiés (à NE PAS dupliquer, mais pour t'inspirer du registre éditorial) :**
\`\`\`json
${recentJson}
\`\`\`

Choisis un angle original et utile, puis appelle l'outil \`save_article\`.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    tools,
    tool_choice: { type: "tool", name: "save_article" },
    messages: [{ role: "user", content: userMessage }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Le modèle n'a pas appelé l'outil save_article");
  }

  const input = toolUse.input as { title?: string; excerpt?: string; body?: string };
  if (!input.title || !input.excerpt || !input.body) {
    throw new Error("Réponse IA incomplète (title/excerpt/body manquant)");
  }

  return {
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    body: sanitizeBody(input.body),
  };
}
