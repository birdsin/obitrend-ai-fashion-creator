import "dotenv/config";
import express from "express";
import multer from "multer";
import OpenAI from "openai";
import fs from "node:fs";
import { toFile } from "openai";
const app = express();
const port = process.env.PORT || 3000;
const upload = multer({
  dest: "tmp/",
  limits: { fileSize: 12 * 1024 * 1024 }
});

app.use(express.static("."));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: "OBITREND AI Fashion Creator" });
});

app.post("/api/generate", upload.single("garment"), async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured." });
  }
  if (!req.file) {
    return res.status(400).json({ error: "Upload a clothing image first." });
  }

  const {
    model = "Elegant adult woman",
    background = "Luxury fashion studio",
    pose = "Standing editorial pose",
    style = "Luxury",
    extra = ""
  } = req.body;

  const prompt = [
    "Create a photorealistic commercial fashion campaign image from the uploaded garment reference.",
    "Preserve the garment as faithfully as possible: silhouette, neckline, sleeves, seams, proportions, colors, prints and construction details.",
    "Do not redesign the garment or add/remove important garment details.",
    `Model: ${model}.`,
    `Background: ${background}.`,
    `Pose: ${pose}.`,
    `Style: ${style}.`,
    "Use realistic anatomy, premium lighting, realistic fabric texture and high-end fashion photography.",
    extra ? `Additional instruction: ${extra}` : ""
  ].filter(Boolean).join("\n");

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const imageFile = await toFile(
  fs.readFileSync(req.file.path),
  "garment.jpg",
  { type: "image/jpeg" }
);

const result = await client.images.edit({
  model: "gpt-image-1",
  image: imageFile,
  prompt,
  size: "1024x1024"
});

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image was returned by the image service.");

    res.json({ ok: true, image: `data:image/png;base64,${b64}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err?.message || "Generation failed." });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

app.listen(port, () => {
  console.log(`OBITREND running at http://localhost:${port}`);
});
