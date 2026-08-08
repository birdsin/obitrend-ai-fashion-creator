
const OpenAI = require("openai");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generate(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Please upload a clothing photo first."
      });
    }

    const {
      model = "fashion model",
      background = "luxury fashion location",
      pose = "standing naturally",
      style = "professional fashion photography",
      extra = ""
    } = req.body;

    const prompt = `
Create a realistic professional fashion campaign photograph.

Use the uploaded clothing item as the exact garment reference.

IMPORTANT:
- Preserve the exact garment design.
- Preserve the garment shape, color, stitching and details.
- Do not redesign the clothing.
- Do not add unwanted logos or text.
- Show the clothing clearly.
- Create a beautiful realistic fashion model wearing the garment.
- Make the result look like a professional fashion campaign.

MODEL:
${model}

BACKGROUND:
${background}

POSE:
${pose}

STYLE:
${style}

ADDITIONAL INSTRUCTIONS:
${extra}
`;

    const form = new FormData();

    form.append("model", "gpt-image-1");
    form.append("prompt", prompt);
    form.append("size", "1024x1024");

    form.append(
      "image",
      new Blob([req.file.buffer], {
        type: req.file.mimetype
      }),
      req.file.originalname
    );

    const response = await fetch(
      "https://api.openai.com/v1/images/edits",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: form
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Image generation failed."
      });
    }

    if (!data.data || !data.data[0]) {
      return res.status(500).json({
        error: "No image was returned by the server."
      });
    }

    const image = data.data[0];

    if (!image.b64_json) {
      return res.status(500).json({
        error: "The image API did not return image data."
      });
    }

    return res.status(200).json({
      image: `data:image/png;base64,${image.b64_json}`
    });

  } catch (error) {
    console.error("Generate error:", error);

    return res.status(500).json({
      error: error.message || "Something went wrong."
    });
  }
}

module.exports = {
  upload,
  generate
};
