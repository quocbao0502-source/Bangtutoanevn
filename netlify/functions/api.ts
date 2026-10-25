import { GoogleGenAI, Type } from '@google/genai';

export default async (req: Request) => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  // GET /api/health or /.netlify/functions/api/health
  if (pathname.endsWith('/health') && req.method === 'GET') {
    return new Response(
      JSON.stringify({
        status: 'ok',
        service: 'EVN PoleInspector API (Netlify Functions)',
        timestamp: new Date().toISOString(),
        geminiConfigured: !!process.env.GEMINI_API_KEY,
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  // POST /api/analyze-pole
  if (pathname.endsWith('/analyze-pole') && req.method === 'POST') {
    try {
      const body = await req.json();
      const { imageBase64, mimeType = 'image/jpeg' } = body || {};

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Vui lòng cung cấp dữ liệu hình ảnh (imageBase64).' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!supportedTypes.includes(mimeType)) {
        return new Response(
          JSON.stringify({ error: 'Chỉ hỗ trợ ảnh JPG, PNG và WebP.' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/[\w.+-]+;base64,/, '');

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            error: 'Chưa cấu hình GEMINI_API_KEY trên Netlify Environment Variables. Hãy thêm khóa trong Site configuration.',
          }),
          { status: 503, headers: corsHeaders }
        );
      }

      const aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

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
                description: 'Loại lắp đặt cây đà/xà: "balanced" hoặc "offset"',
              },
              crossarmDescription: {
                type: Type.STRING,
                description: 'Mô tả chi tiết vị trí và hướng lắp cây đà',
              },
              poleStructure: {
                type: Type.STRING,
                description: 'Kết cấu cột: "single", "double", "steel_tower"',
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
      if (!textOutput) throw new Error('Không nhận được dữ liệu phản hồi từ AI.');
      const parsedData = JSON.parse(textOutput);

      return new Response(
        JSON.stringify({ success: true, data: parsedData }),
        { status: 200, headers: corsHeaders }
      );
    } catch (err: any) {
      console.error('Error in Netlify function analyze-pole:', err);
      return new Response(
        JSON.stringify({ error: err.message || 'Lỗi xử lý phân tích AI.' }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Endpoint không tồn tại.' }),
    { status: 404, headers: corsHeaders }
  );
};
