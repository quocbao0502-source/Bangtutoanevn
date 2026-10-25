import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config({ path: ['.env.local', '.env'], quiet: true });
if (process.argv.includes('--production')) process.env.NODE_ENV = 'production';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Shared server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API endpoint to analyze electric pole images
app.post('/api/analyze-pole', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (typeof imageBase64 !== 'string' || !imageBase64) {
      return res.status(400).json({ error: 'Vui lòng cung cấp dữ liệu hình ảnh (imageBase64).' });
    }

    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(mimeType)) {
      return res.status(400).json({ error: 'Chỉ hỗ trợ ảnh JPG, PNG và WebP.' });
    }
    const cleanBase64 = imageBase64.replace(/^data:image\/[\w.+-]+;base64,/, '');
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(cleanBase64) || !cleanBase64) {
      return res.status(400).json({ error: 'Dữ liệu ảnh base64 không hợp lệ.' });
    }
    if (Buffer.byteLength(cleanBase64, 'base64') > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'Ảnh vượt quá giới hạn 10 MB.' });
    }
    if (!aiClient) {
      return res.status(503).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên server. Vui lòng kiểm tra biến môi trường.',
      });
    }

    // Clean base64 string if it contains data URI header

    const prompt = `Bạn là chuyên gia giám định kỹ thuật lưới điện và đường dây truyền tải EVN Việt Nam.
Hãy phân tích bức ảnh cây trụ điện này một cách chi tiết và kỹ lưỡng:
1. Đếm chính xác số lượng cục sứ cách điện (insulators: đếm tổng số cục sứ đứng, sứ chuỗi néo, sứ đỡ, bát sứ treo trên tất cả các pha).
2. Kiểm tra cây đà (xà đỡ dây dẫn): đà được lắp cân đối (balanced) hay lắp lệch hẳn sang một bên (offset, thường dùng khi tránh hành lang an toàn cây cối hoặc nhà dân).
3. Nhận dạng kết cấu thân trụ: Trụ đơn (bê tông ly tâm 1 cột), Trụ đôi (kết cấu 2 cột dạng chữ H hoặc chữ A hoặc giằng néo đôi), hay Trụ tháp sắt / cột thép lưới (steel_tower).
4. Ước tính cấp điện áp của tuyến đường dây qua loại sứ và kết cấu: '0.4kV' (hạ thế), '22kV' (trung thế phổ biến), '35kV' (trung thế cao), '110kV' (cao thế).
5. Đánh giá sơ bộ tình trạng kỹ thuật và rủi ro quan sát thấy (sứ bẩn, rỉ sét, xà nghiêng, dây võng, cây vướng...).
6. Đưa ra 2-3 đề xuất bảo trì, vệ sinh hoặc bảo dưỡng tương ứng.
Hãy trả về kết quả bằng định dạng JSON chuẩn theo Schema.`;

    const response = await aiClient.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insulatorCount: {
              type: Type.INTEGER,
              description: 'Tổng số cục sứ cách điện đếm được trên trụ điện',
            },
            crossarmType: {
              type: Type.STRING,
              description: 'Loại lắp đặt cây đà/xà: "balanced" (lắp cân) hoặc "offset" (lắp lệch)',
            },
            crossarmDescription: {
              type: Type.STRING,
              description: 'Mô tả chi tiết vị trí và hướng lắp cây đà',
            },
            poleStructure: {
              type: Type.STRING,
              description: 'Kết cấu cột: "single" (trụ đơn), "double" (trụ đôi/chữ H), "steel_tower" (tháp sắt)',
            },
            voltageLevelEstimate: {
              type: Type.STRING,
              description: 'Cấp điện áp ước tính: "0.4kV", "22kV", "35kV", "110kV"',
            },
            conditionAssessment: {
              type: Type.STRING,
              description: 'Tóm tắt nhận xét tình trạng kỹ thuật hiện tại của trụ',
            },
            maintenanceRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Danh sách các hạng mục bảo trì đề xuất',
            },
            confidenceScore: {
              type: Type.NUMBER,
              description: 'Độ tin cậy của phân tích ảnh (0.0 đến 1.0)',
            },
          },
          required: [
            'insulatorCount',
            'crossarmType',
            'crossarmDescription',
            'poleStructure',
            'voltageLevelEstimate',
            'conditionAssessment',
            'maintenanceRecommendations',
          ],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Không nhận được dữ liệu phản hồi từ AI.');
    }

    const parsedData = JSON.parse(textOutput);
    if (!Number.isInteger(parsedData.insulatorCount) || parsedData.insulatorCount < 0 ||
        !['balanced', 'offset'].includes(parsedData.crossarmType) ||
        !['single', 'double', 'steel_tower'].includes(parsedData.poleStructure) ||
        !['0.4kV', '22kV', '35kV', '110kV'].includes(parsedData.voltageLevelEstimate) ||
        typeof parsedData.crossarmDescription !== 'string' ||
        typeof parsedData.conditionAssessment !== 'string' ||
        !Array.isArray(parsedData.maintenanceRecommendations) ||
        !parsedData.maintenanceRecommendations.every((v: unknown) => typeof v === 'string')) {
      throw new Error('AI trả về dữ liệu không hợp lệ.');
    }
    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error analyzing pole image:', error);
    return res.status(500).json({
      error: 'Không thể phân tích ảnh. Kiểm tra cấu hình khóa, tên mô hình hoặc thử lại sau.',
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!apiKey,
  });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'API không tồn tại.' }));
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Dữ liệu ảnh quá lớn.' });
  return res.status(400).json({ error: 'Nội dung yêu cầu không hợp lệ.' });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startServer().catch(error => { console.error('Không thể khởi động máy chủ:', error); process.exitCode = 1; });
}
