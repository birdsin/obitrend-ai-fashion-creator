const fs = require("fs");
const formidable = require("formidable");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DETECTION_MODEL = process.env.OBITREND_DETECTION_MODEL || "gpt-5.6-luna";
const IMAGE_MODEL = "gpt-image-2";

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false, keepExtensions: true, maxFileSize: 12 * 1024 * 1024 });
    form.parse(req, (err, fields, files) => err ? reject(err) : resolve({ fields, files }));
  });
}
function firstValue(v) { return Array.isArray(v) ? v[0] : v; }
function findUploadedFile(files) {
  const names = ["image","garment","clothing","clothingImage","file","photo","upload"];
  for (const name of names) { const v = files[name]; if (!v) continue; if (Array.isArray(v) && v.length) return v[0]; if (v.filepath) return v; }
  for (const key of Object.keys(files || {})) { const v = files[key]; if (Array.isArray(v) && v.length) return v[0]; if (v && v.filepath) return v; }
  return null;
}
function parseJson(text) {
  try { return JSON.parse(text); } catch (_) {}
  const m = String(text || "").match(/\{[\s\S]*\}/);
  try { return m ? JSON.parse(m[0]) : null; } catch (_) { return null; }
}

async function detectSubject(dataUrl, userPrompt) {
  const instruction = "Analyze this uploaded image for OBITREND. Classify the primary visible subject as exactly one of: man, woman, child, children, family, group_of_people, object, house. man/woman means one adult; child means one child; children means multiple children; family means a family-style adult/child grouping; group_of_people means multiple non-family people; house means a property/building is the main subject; object means another non-human primary subject. Do not invent subjects. Return ONLY JSON with keys category,count,confidence,summary,visibleClothing,scene,needsGarmentPreservation. Confidence must be 0 to 1. Do not identify anyone. User request: " + (userPrompt || "");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: "Bearer " + OPENAI_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: DETECTION_MODEL,
      input: [{ role: "user", content: [{ type: "input_text", text: instruction }, { type: "input_image", image_url: dataUrl, detail: "high" }] }],
      max_output_tokens: 500
    })
  });
  const raw = await response.text();
  let apiResult; try { apiResult = JSON.parse(raw); } catch (_) { throw new Error("Automatic subject detection returned an invalid response."); }
  if (!response.ok) throw new Error(apiResult?.error?.message || "Automatic subject detection failed.");
  const detected = parseJson(apiResult.output_text);
  const allowed = new Set(["man","woman","child","children","family","group_of_people","object","house"]);
  if (!detected || !allowed.has(detected.category)) throw new Error("Automatic subject detection could not classify the image.");
  detected.count = Number.isFinite(Number(detected.count)) ? Number(detected.count) : 0;
  detected.confidence = Math.max(0, Math.min(1, Number(detected.confidence) || 0));
  return detected;
}

const RULES = {
  man: "Create a realistic adult male subject with natural anatomy, hands, skin and proportions.",
  woman: "Create a realistic adult female subject with natural anatomy, hands, skin and proportions.",
  child: "Create one age-appropriate child. Never sexualize the child. Use age-appropriate clothing, pose and styling.",
  children: "Create the detected children naturally. Keep every child age-appropriate and never sexualize children.",
  family: "Create a natural family scene matching the detected family structure. Keep adults and children age-appropriate and naturally interacting.",
  group_of_people: "Create a realistic group matching the detected people. Keep natural spacing, anatomy and plausible activities.",
  object: "Keep the detected object as the primary subject. Preserve its identity, shape, proportions, materials, colors, markings and distinctive details.",
  house: "Keep the detected house/property as the primary subject. Preserve architecture, proportions, roof, windows, doors, facade, materials and distinctive details."
};

function buildPrompt(d, userPrompt) {
  const preservation = d.needsGarmentPreservation ? "If clothing is visible, preserve it as the strict visual source of truth: shape, construction, neckline, sleeves, colors, fabric, seams, graphics, logos, labels, text, stripes, borders and placement. Do not invent belts, waistbands, trims, panels or graphics. Keep the same garment when the subject is a person." : "Preserve the uploaded primary subject as the visual source of truth, including visible identity, proportions, materials, colors and distinctive details.";
  return [
    "OBITREND AUTOMATIC PROMPT ENGINE",
    "Detected category: " + d.category,
    "Detected count: " + d.count,
    "Detection summary: " + (d.summary || ""),
    "Scene: " + (d.scene || ""),
    "SUBJECT RULE: " + (RULES[d.category] || RULES.object),
    "REFERENCE PRESERVATION: " + preservation,
    "USER REQUEST: " + (userPrompt || "Create a photorealistic professional image based on the uploaded reference."),
    "Generate a photorealistic professional image. Keep the detected subject as the visual priority. Do not silently change the subject category. Do not add people when they are not requested. Use realistic lighting, depth, perspective, materials, shadows and anatomy. Follow requested environment, pose, camera and aspect ratio when supplied."
  ].join("\n\n");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
  let imagePath = null;
  try {
    const { fields, files } = await parseForm(req);
    const uploadedFile = findUploadedFile(files);
    if (!uploadedFile?.filepath) return res.status(400).json({ error: "No image was uploaded" });
    imagePath = uploadedFile.filepath;
    const userPrompt = firstValue(fields.prompt || fields.description || "");
    const imageBuffer = fs.readFileSync(imagePath);
    let mimeType = uploadedFile.mimetype || "image/jpeg";
    if (!/^image\/(png|jpeg|jpg|webp)$/i.test(mimeType)) mimeType = "image/jpeg";
    const dataUrl = "data:" + mimeType + ";base64," + imageBuffer.toString("base64");
    console.log("[OBITREND] Automatic detection started");
    const detection = await detectSubject(dataUrl, userPrompt);
    const finalPrompt = buildPrompt(detection, userPrompt);
    const form = new FormData();
    form.append("model", IMAGE_MODEL);
    form.append("prompt", finalPrompt);
    form.append("quality", "high");
    form.append("size", "auto");
    form.append("output_format", "png");
    form.append("n", "1");
    form.append("image", new Blob([imageBuffer], { type: mimeType }), uploadedFile.originalFilename || "reference.jpg");
    const response = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: "Bearer " + OPENAI_API_KEY }, body: form });
    const raw = await response.text();
    let result; try { result = JSON.parse(raw); } catch (_) { return res.status(502).json({ error: "OpenAI returned an unexpected response" }); }
    if (!response.ok) return res.status(response.status).json({ error: result?.error?.message || "Image generation failed" });
    const base64Image = result?.data?.[0]?.b64_json;
    if (!base64Image) return res.status(502).json({ error: "OpenAI did not return a generated image" });
    return res.status(200).json({ success: true, imageUrl: "data:image/png;base64," + base64Image, b64_json: base64Image, mimeType: "image/png", detection: { category: detection.category, count: detection.count, confidence: detection.confidence, summary: detection.summary }, promptEngine: true });
  } catch (error) {
    console.error("[OBITREND] Auto generation error:", error);
    return res.status(500).json({ error: error?.message || "Automatic generation failed" });
  } finally {
    try { if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } catch (e) { console.error("[OBITREND] Cleanup error:", e); }
  }
};