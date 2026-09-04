
import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { fal } from "@fal-ai/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const upload = multer({ dest: path.join(__dirname, "uploads/"), limits: { fileSize: 10 * 1024 * 1024 } });

fs.mkdirSync(path.join(__dirname, "uploads"), { recursive: true });

const dbPath = path.join(__dirname, "data", "state.json");
const defaultState = { credits: 50, history: [] };

function loadState() {
  try { return JSON.parse(fs.readFileSync(dbPath, "utf8")); }
  catch { return structuredClone(defaultState); }
}
function saveState(state) {
  fs.writeFileSync(dbPath, JSON.stringify(state, null, 2));
}

app.use(express.json({ limit: "15mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/state", (req, res) => {
  res.json(loadState());
});

app.post("/api/reset-demo", (req, res) => {
  saveState(structuredClone(defaultState));
  res.json(loadState());
});

app.post("/api/generate", upload.single("image"), async (req, res) => {
  const state = loadState();
  if (state.credits < 1) return res.status(402).json({ error: "Niet genoeg credits." });

  const prompt = (req.body.prompt || "").trim();
  const negativePrompt = (req.body.negativePrompt || "").trim();
  const mode = req.body.mode || "text";
  const aspect = req.body.aspect || "square";
  const strength = Number(req.body.strength || 0.75);

  if (!prompt) return res.status(400).json({ error: "Vul eerst een prompt in." });

  const aspectMap = {
    square: { width: 1024, height: 1024 },
    portrait: { width: 1024, height: 1365 },
    landscape: { width: 1365, height: 1024 }
  };
  const size = aspectMap[aspect] || aspectMap.square;

  try {
    let imageUrl;

    if (!process.env.FAL_KEY) {
      imageUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1024&q=85";
    } else {
      fal.config({ credentials: process.env.FAL_KEY });

      if (mode === "image" && req.file) {
        const file = new Blob([fs.readFileSync(req.file.path)], { type: req.file.mimetype });
        const uploadedUrl = await fal.storage.upload(file);
        const result = await fal.subscribe("fal-ai/flux-general/image-to-image", {
          input: {
            prompt: negativePrompt ? `${prompt}\nAvoid: ${negativePrompt}` : prompt,
            image_url: uploadedUrl,
            strength,
            image_size: { width: size.width, height: size.height },
            num_images: 1
          }
        });
        imageUrl = result?.data?.images?.[0]?.url;
      } else {
        const result = await fal.subscribe("fal-ai/flux-2", {
          input: {
            prompt: negativePrompt ? `${prompt}\nAvoid: ${negativePrompt}` : prompt,
            image_size: { width: size.width, height: size.height },
            num_images: 1
          }
        });
        imageUrl = result?.data?.images?.[0]?.url;
      }
    }

    if (!imageUrl) throw new Error("Geen afbeelding teruggekregen.");

    state.credits -= 1;
    state.history.unshift({
      id: Date.now(),
      prompt,
      mode,
      imageUrl,
      createdAt: new Date().toISOString()
    });
    state.history = state.history.slice(0, 24);
    saveState(state);

    res.json({ imageUrl, credits: state.credits, history: state.history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err?.message || "Genereren mislukt." });
  } finally {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`AI Studio draait op http://localhost:${port}`);
});
