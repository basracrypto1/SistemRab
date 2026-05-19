import { GoogleGenAI, SchemaType } from "@google/genai";

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY || "");

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { menu, budget } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel' });
    }

    const model = ai.getGenerativeModel({ 
      model: "gemini-1.5-flash", // Menggunakan model terbaru yang stabil
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              uraian: { type: SchemaType.STRING },
              qty: { type: SchemaType.NUMBER },
              satuan: { type: SchemaType.STRING },
              harga: { type: SchemaType.NUMBER },
              keterangan: { type: SchemaType.STRING },
            },
            required: ["uraian", "qty", "satuan", "harga", "keterangan"],
          },
        },
      }
    });

    const prompt = `Buatkan daftar bahan baku (RAB) untuk menu: "${menu}". 
    Budget harian sekitar Rp ${budget}. 
    Berikan respon dalam format JSON array of objects dengan properti:
    - uraian: string (nama bahan)
    - qty: number (jumlah estimasi)
    - satuan: string (kg, paket, bungkus, dll)
    - harga: number (estimasi harga per satuan dalam Rupiah)
    - keterangan: string (saran singkat maksimal 5 kata)
    
    Sesuaikan porsi untuk jumlah yang banyak sesuai budget.`;

    const result = await model.generateContent(prompt);
    const response = JSON.parse(result.response.text());
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message });
  }
}
