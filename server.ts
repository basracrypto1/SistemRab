import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/gemini/generate-rab", async (req, res) => {
    try {
      const { menu, budget } = req.body;
      
      const prompt = `Buatkan daftar bahan baku (RAB) untuk menu: "${menu}". 
      Budget harian sekitar Rp ${budget}. 
      Berikan respon dalam format JSON array of objects dengan properti:
      - uraian: string (nama bahan)
      - qty: number (jumlah estimasi)
      - satuan: string (kg, ikat, bungkus, dll)
      - harga: number (estimasi harga pasar dalam Rupiah)
      - keterangan: string (saran singkat/catatan penting, maksimal 3-5 kata, contoh: "Pilih yang segar", "Kualitas premium", "Bumbu pelengkap")
      
      Sesuaikan jumlah bahan untuk porsi standar SPPG (Sekolah Polisi Negara) yang biasanya melayani banyak orang, namun tetap upayakan totalnya mendekati budget jika memungkinkan.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                uraian: { type: Type.STRING },
                qty: { type: Type.NUMBER },
                satuan: { type: Type.STRING },
                harga: { type: Type.NUMBER },
                keterangan: { type: Type.STRING },
              },
              required: ["uraian", "qty", "satuan", "harga", "keterangan"],
            },
          },
        },
      });

      const result = JSON.parse(response.text || "[]");
      res.json(result);
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
