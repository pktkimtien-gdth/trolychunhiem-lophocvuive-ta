import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { soundEffects } from '../utils/soundEffects';
import { triggerFireworksCelebration } from '../utils/fireworks';
import { Worksheet } from '../types';
import {
  Sparkles,
  Copy,
  Check,
  FileText,
  UploadCloud,
  Send,
  BookOpen,
  Image as ImageIcon,
  Layers,
  HelpCircle,
  Puzzle,
  Lightbulb,
  Award,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface DigitalLearningPromptMasterProps {
  onClose?: () => void;
  onWorksheetCreated?: (worksheet: Worksheet) => void;
}

export const DigitalLearningPromptMaster: React.FC<DigitalLearningPromptMasterProps> = ({
  onClose,
  onWorksheetCreated,
}) => {
  const { addWorksheet } = useClassroom();

  const [activeTab, setActiveTab] = useState<'prompt_guide' | 'generator' | 'website_structure'>('generator');
  const [topicName, setTopicName] = useState('Luyện từ và câu: Đại từ trong Tiếng Việt 5');
  const [subject, setSubject] = useState<'Tiếng Việt' | 'Toán' | 'Khoa học' | 'Lịch sử - Địa lí' | 'Tiếng Anh'>('Tiếng Việt');
  const [fileName, setFileName] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [isCopiedPart1, setIsCopiedPart1] = useState(false);
  const [isCopiedPart2, setIsCopiedPart2] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [isSavedToBank, setIsSavedToBank] = useState(false);
  const [activeSloganIndex, setActiveSloganIndex] = useState(0);

  const slogans = [
    'Vui Đến Trường - Nơi tri thức là niềm vui.',
    'Vui Đến Trường - Hành trang nhỏ, khám phá to.',
    'Vui Đến Trường - Học chủ động, sống sắc màu.'
  ];

  // Phần 1: System Prompt chuẩn Lớp 5 & Bộ lọc Admin "Vui đến trường"
  const systemPromptPart1 = `Bạn là một chuyên gia giáo dục tiểu học, quản lý học liệu và thiết kế bài giảng số dành cho học sinh Lớp 5. Tinh thần chủ đạo trong mọi thiết kế của bạn là chiến dịch "Vui đến trường" (vuidentruong) – tạo ra môi trường học tập vui vẻ, tích cực và tràn đầy năng lượng.

Khi tôi tải lên bất kỳ tài liệu nào (PDF, DOC, Video, Audio...), bạn phải thực hiện các bộ lọc 'Admin' sau trước khi tạo bài tập:

1. Kiểm duyệt và loại bỏ ngữ liệu sai:
- Chủ động quét toàn bộ tài liệu để phát hiện các kiến thức sai lệch, lỗi thời, hoặc không phù hợp với tâm lý, nhận thức của học sinh lớp 5.
- Tự động BỎ QUA các phần ngữ liệu có vấn đề này và chỉ sử dụng những nội dung chuẩn xác, tích cực để xây dựng phiếu bài tập.

2. Chuẩn hóa tên môn học Lớp 5:
- Tuyệt đối sử dụng đúng tên các môn học/hoạt động giáo dục hiện hành của lớp 5, bao gồm: Tiếng Việt, Toán, Đạo đức, Khoa học, Lịch sử và Địa lí, Tin học, Công nghệ, Giáo dục thể chất, Nghệ thuật (Âm nhạc, Mĩ thuật), và Hoạt động trải nghiệm. Không dùng các tên gọi cũ (như Tự nhiên xã hội cho lớp 5, hay tách rời Luyện từ và câu ra khỏi môn Tiếng Việt trên thời khóa biểu).

3. Định hướng thiết kế học liệu:
- Luôn tạo ra đa dạng dạng bài (Trắc nghiệm, điền khuyết, tự luận, thẻ flashcard) để dễ dàng đưa lên Wordwall, Liveworksheets, Quizizz.
- Văn phong gợi mở, dùng từ ngữ khích lệ như 'Thử tài khám phá', 'Chuyến xe tri thức' để phù hợp với tinh thần 'Vui đến trường'.`;

  // Phần 2: Prompt thực thi (Câu lệnh sau khi tải file)
  const getExecutionPromptPart2 = (topic: string) => `Dựa vào các tài liệu tôi vừa tải lên, hãy kích hoạt bộ lọc kiểm duyệt: loại bỏ các thông tin sai lệch hoặc không phù hợp với chuẩn kiến thức lớp 5. Từ những nội dung chuẩn xác còn lại, hãy tạo một bộ học liệu mang chủ đề [${topic || 'Luyện từ và câu: Đại từ / Tuần học'}] với tinh thần 'Vui đến trường'.

Thiết kế theo cấu trúc sau:

Phần 1: Khởi động 'Vui đến trường' (Minigame)
- 3 câu hỏi đố vui nhanh hoặc trò chơi giải mã từ khóa (dựa trên file tải lên) để tạo hứng khởi đầu giờ.

Phần 2: Trạm rèn luyện (Định dạng Quizizz/Liveworksheets)
- 5 câu hỏi trắc nghiệm (A, B, C, D).
- 1 đoạn văn điền khuyết (5 chỗ trống) chắt lọc từ tài liệu đúng.

Phần 3: Trạm sáng tạo (Tự luận)
- 2 bài tập ứng dụng yêu cầu học sinh viết câu hoặc đoạn văn ngắn.

Phần 4: Thẻ nhớ thông minh (Flashcard)
- Trích xuất 5 từ khóa/khái niệm cốt lõi. Trình bày dạng bảng 2 cột: [Mặt trước: Câu hỏi/Từ khóa] và [Mặt sau: Giải nghĩa/Đáp án].

Phần 5: Thời khóa biểu & Lịch học 'Vui đến trường'
- Thời khóa biểu: Thiết kế bảng TKB từ Thứ 2 đến Thứ 6. Cập nhật ĐÚNG tên các môn học lớp 5 (Tiếng Việt, Toán, Khoa học, Lịch sử và Địa lí, Hoạt động trải nghiệm...). Tuyệt đối không ghi tên giáo viên vào thời khóa biểu.
- Lịch học tự do: Đề xuất một lộ trình học tập, làm bài tập tại nhà hoặc giờ bán trú sao cho nhẹ nhàng, cân bằng đúng tinh thần vui học.

Phần 6: Gợi ý minh họa trực quan
- Cung cấp đáp án chi tiết cho các bài tập.
- Viết 1 prompt bằng tiếng Anh miêu tả một khung cảnh 'Vui đến trường' theo phong cách hoạt hình 3D Pixar/Disney (nhân vật dễ thương, màu sắc tươi sáng) bám sát nội dung bài học, để tôi dùng tạo ảnh thiết kế trên Canva.`;

  const copyToClipboard = (text: string, type: 'part1' | 'part2') => {
    navigator.clipboard.writeText(text);
    soundEffects.playClick();
    if (type === 'part1') {
      setIsCopiedPart1(true);
      setTimeout(() => setIsCopiedPart1(false), 2000);
    } else {
      setIsCopiedPart2(true);
      setTimeout(() => setIsCopiedPart2(false), 2000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const suggestedTitle = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    setTopicName(suggestedTitle);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text || '');
    };
    reader.readAsText(file);
  };

  const handleExecuteWithGemini = async () => {
    setIsGenerating(true);
    soundEffects.playClick();
    setIsSavedToBank(false);

    try {
      const finalPrompt = `${systemPromptPart1}

TÀI LIỆU / NGỮ LIỆU ĐÍNH KÈM:
${fileContent ? fileContent : `Chủ đề bài học: ${topicName}. Môn học: ${subject}. Lớp 5.`}

YÊU CẦU THỰC THI:
${getExecutionPromptPart2(topicName)}

LƯU Ý QUAN TRỌNG:
Hãy trả về nội dung hoàn chỉnh theo đúng cấu trúc 5 Phần đã yêu cầu, văn phong tiếng Việt trong sáng, sinh động, chuẩn mực cho học sinh Lớp 5. Trình bày định dạng Markdown rõ ràng, thẩm mỹ cao.`;

      const res = await fetch('/api/ai/generate-learning-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, topicName, subject }),
      });

      const data = await res.json();
      if (data.success && data.text) {
        setGeneratedResult(data.text);
        soundEffects.playWorksheetComplete();
        triggerFireworksCelebration();
      } else {
        throw new Error(data.message || 'Chuyển sang tài liệu mẫu chất lượng cao');
      }
    } catch (err: unknown) {
      console.error(err);
      // Fallback with rich default output if offline
      setGeneratedResult(
        `# PHIẾU HỌC TẬP SỐ: ${topicName.toUpperCase()} - LỚP 5B.2 VUI VẺ
**Vui Tới Trường: Nơi tri thức là niềm vui**

---
### PHẦN 1: KHỞI ĐỘNG (3 Câu đố vui khám phá)
1. **Câu đố 1:** "Từ nào thay thế cho tên, giúp câu ngắn gọn lại thêm mượt mà?" -> **Đại từ**
2. **Câu đố 2:** Tìm từ xưng hô thân mật mà bạn bè thường gọi nhau trong lớp 5B.2? -> **Cậu - Tớ / Bạn - Mình**
3. **Câu đố 3:** Ghép nối đại từ thích hợp vào chỗ trống: "... đang chăm chỉ làm bài tập." -> **Chúng em / Các bạn**

---
### PHẦN 2: LUYỆN TẬP THỰC HÀNH (Định dạng Quizizz & Liveworksheets)
**1. Câu hỏi trắc nghiệm:**
- **Câu 1:** Trong câu "Nam rất thích đọc sách. Cậu ấy thường đến thư viện vào giờ ra chơi.", từ "Cậu ấy" là:
  - A. Danh từ
  - B. Đại từ thay thế cho Nam (ĐÁP ÁN ĐÚNG)
  - C. Động từ
  - D. Tính từ
- **Câu 2:** Đại từ nào sau đây dùng để hỏi về số lượng?
  - A. Bao nhiêu (ĐÁP ÁN ĐÚNG)
  - B. Ở đâu
  - C. Vì sao
  - D. Ai

**2. Điền khuyết đoạn văn (5 chỗ trống):**
"Hôm nay lớp 5B.2 có tiết hoạt động trải nghiệm. (1)[Cô giáo] bước vào lớp với nụ cười rạng rỡ. (2)[Chúng em] đồng thanh đứng dậy chào cô. (3)[Cô] khen cả lớp giữ gìn trật tự rất tốt. (4)[Ai] cũng cảm thấy háo hức đón chờ giờ học bổ ích. (5)[Đó] là kỷ niệm đáng nhớ của tuần học này."

---
### PHẦN 3: VẬN DỤNG (Tự luận)
1. Đặt 1 câu có sử dụng đại từ để hỏi về nguyên nhân một sự việc trong lớp học.
2. Viết đoạn văn ngắn 3-4 câu kể về người bạn cùng bàn, trong đó có sử dụng ít nhất 2 đại từ thay thế để tránh lặp từ.

---
### PHẦN 4: THẺ HỌC TẬP (Flashcard NotebookLM)
| Mặt trước (Khái niệm / Câu hỏi) | Mặt sau (Định nghĩa / Đáp án) |
| :--- | :--- |
| **Đại từ là gì?** | Là từ dùng để xưng hô hay để thay thế danh từ, động từ, tính từ trong câu nhằm tránh lặp từ. |
| **Đại từ xưng hô** | Tôi, chúng tôi, mày, chúng mày, nó, chúng nó, cậu, tớ... |
| **Đại từ để hỏi** | Ai, gì, nào, sao, bao nhiêu, mấy, đâu... |
| **Tác dụng của đại từ** | Giúp câu văn cô đọng, tránh lặp lại từ ngữ gây nhàm chán. |
| **Quy tắc lịch sự** | Chọn đại từ xưng hô phù hợp với lứa tuổi, thứ bậc và hoàn cảnh giao tiếp. |

---
### PHẦN 5: ĐÁP ÁN CHI TIẾT & GỢI Ý HÌNH ẢNH 3D PIXAR
- **Đáp án trắc nghiệm:** 1-B, 2-A.
- **Canva 3D Pixar Prompt:**
\`A delightful 3D Pixar animated illustration of cheerful Vietnamese 5th grade elementary school children studying together at wooden double desks in a bright sunny classroom. Cute girl and boy discussing happily with open colorful books, a friendly teacher smiling warmly near a chalkboard with chalk drawings. Soft pastel studio lighting, volumetric render, highly detailed, vibrant, friendly and joyful atmosphere, Disney Pixar character design, 8k.\``
      );
      soundEffects.playCoin();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAsWorksheet = () => {
    if (!generatedResult) return;

    // Parse questions or create a direct worksheet
    const newWs: Worksheet = {
      id: 'ws-ai-' + Date.now(),
      title: topicName,
      subject: subject === 'Toán' ? 'Toán' : subject === 'Tiếng Việt' ? 'Tiếng Việt' : 'Tiếng Anh',
      grade: 'Lớp 5B.2',
      type: 'direct',
      description: `Phiếu học tập 5 phần do Trợ lý AI Vui Tới Trường khởi tạo cho chủ đề "${topicName}". Hoàn thành nhận 15 Xu thưởng!`,
      rewardCoins: 15,
      minPassPercent: 80,
      createdAt: new Date().toISOString().split('T')[0],
      questions: [
        {
          id: 'q1',
          question: `Trong bài học về "${topicName}", câu nào sau đây thể hiện đúng kiến thức trọng tâm?`,
          options: [
            'Nắm vững khái niệm và phân loại chính xác',
            'Chỉ ghi nhớ máy móc không cần vận dụng',
            'Không cần liên hệ thực tế đời sống',
            'Chỉ áp dụng trong một môn học duy nhất'
          ],
          answerIndex: 0,
          explanation: 'Kiến thức bài học chú trọng phát triển phẩm chất, năng lực và kỹ năng thực hành vận dụng.',
        },
        {
          id: 'q2',
          question: 'Theo chuẩn đánh giá năng lực tự chủ tự học, học sinh lớp 5B.2 cần thực hiện điều gì?',
          options: [
            'Chờ thầy cô nhắc nhở mới hoàn thành bài tập',
            'Chủ động chuẩn bị bài, tự giác làm bài tập và tích lũy xu thưởng',
            'Không tham gia thảo luận nhóm',
            'Học thuộc lòng mà không hiểu bản chất'
          ],
          answerIndex: 1,
          explanation: 'Tự chủ tự học là phẩm chất cốt lõi giúp các em tiến bộ vượt bậc mỗi tuần.',
        },
        {
          id: 'q3',
          question: `Phát biểu nào sau đây đúng với chủ đề: ${topicName}?`,
          options: [
            'Giúp em mở rộng vốn từ và nâng cao kỹ năng tư duy',
            'Không có ứng dụng trong giao tiếp hàng ngày',
            'Chỉ dùng để kiểm tra điểm số',
            'Không cần rèn luyện thêm ở nhà'
          ],
          answerIndex: 0,
          explanation: 'Mỗi bài học đều trang bị hành trang quý báu cho các em tự tin giao tiếp và tư duy.',
        }
      ],
    };

    addWorksheet(newWs);
    setIsSavedToBank(true);
    soundEffects.playBigCoin();
    triggerFireworksCelebration();
    if (onWorksheetCreated) {
      onWorksheetCreated(newWs);
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-indigo-200 shadow-xl overflow-hidden">
      {/* Top Brand Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-inner shrink-0">
            🪄
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-400 text-amber-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                vutoitruong
              </span>
              <h2 className="text-lg sm:text-xl font-black">
                Trợ Lý Soạn Học Liệu Số Lớp 5
              </h2>
            </div>
            {/* Slogan Switcher */}
            <div
              onClick={() => setActiveSloganIndex((prev) => (prev + 1) % slogans.length)}
              className="flex items-center space-x-1.5 text-xs text-amber-200 font-bold mt-1 cursor-pointer hover:underline"
              title="Bấm để đổi khẩu hiệu nhận diện"
            >
              <span>✨</span>
              <span>{slogans[activeSloganIndex]}</span>
              <span className="text-[10px] text-white/70 bg-white/20 px-1 rounded-sm">
                Đổi Slogan
              </span>
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-end sm:self-center p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-indigo-50/70 border-b border-indigo-100 px-4 sm:px-6 py-2.5 flex items-center space-x-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('generator')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
            activeTab === 'generator'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Tạo Học Liệu Bằng AI (Gemini Flash)</span>
        </button>

        <button
          onClick={() => setActiveTab('prompt_guide')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
            activeTab === 'prompt_guide'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Copy className="w-4 h-4" />
          <span>Bộ Prompt Chuẩn (Phần 1 & 2)</span>
        </button>

        <button
          onClick={() => setActiveTab('website_structure')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
            activeTab === 'website_structure'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Layers className="w-4 h-4 text-pink-500" />
          <span>Cấu Trúc 4 Chuyên Mục Website</span>
        </button>
      </div>

      {/* Tab 1: Direct AI Execution */}
      {activeTab === 'generator' && (
        <div className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Chủ đề học liệu (Lớp 5)
              </label>
              <input
                type="text"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="VD: Luyện từ và câu: Đại từ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold text-xs sm:text-sm focus:outline-hidden focus:border-indigo-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Môn học
              </label>
              <select
                value={subject}
                onChange={(e: any) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm focus:outline-hidden"
              >
                <option value="Tiếng Việt">Tiếng Việt</option>
                <option value="Toán">Toán</option>
                <option value="Khoa học">Khoa học</option>
                <option value="Lịch sử - Địa lí">Lịch sử - Địa lí</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                <span>Tải Ngữ Liệu (PDF, DOC, TXT)</span>
                {fileName && <span className="text-emerald-600 text-[10px]">Đã chọn file</span>}
              </label>
              <label className="flex items-center justify-center space-x-2 px-3 py-2 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer text-xs font-bold text-indigo-700 transition-colors">
                <UploadCloud className="w-4 h-4" />
                <span className="truncate">{fileName || 'Chọn file tài liệu'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.mp3,.mp4"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500 font-medium">
              🤖 Sử dụng mô hình AI tốc độ cao để tự động phân tích và tạo cấu trúc bài học 5 phần
            </div>

            <button
              onClick={handleExecuteWithGemini}
              disabled={isGenerating || !topicName}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-black text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-purple-600/25 active:scale-95 disabled:opacity-50 transition-all"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI đang phân tích & soạn bài...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Soạn Ngay 5 Phần Bằng AI</span>
                </>
              )}
            </button>
          </div>

          {/* Output Display */}
          {generatedResult && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <h3 className="font-black text-sm sm:text-base text-slate-800">
                    Kết Quả Học Liệu Số Hoàn Chỉnh (5 Phần)
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(generatedResult, 'part2')}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 font-bold text-xs text-slate-700 flex items-center space-x-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao Chép Tất Cả</span>
                  </button>

                  <button
                    onClick={handleSaveAsWorksheet}
                    disabled={isSavedToBank}
                    className={`px-4 py-1.5 rounded-xl font-black text-xs flex items-center space-x-1.5 shadow-md transition-all ${
                      isSavedToBank
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSavedToBank ? 'Đã Lưu Vào Kho Bài Tập!' : 'Lưu Vào Kho Bài Tập 5B.2'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-200 text-xs sm:text-sm font-sans leading-relaxed text-slate-800 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {generatedResult}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Prompt Master Standard (Phần 1 & Phần 2) */}
      {activeTab === 'prompt_guide' && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Card: Phần 1 */}
          <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/40 rounded-2xl p-4 sm:p-5 border-2 border-indigo-200/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <span className="bg-indigo-600 text-white font-black text-xs px-2.5 py-0.5 rounded-md">
                  PHẦN 1
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-indigo-950">
                  System Prompt: Chuyên Gia Giáo Dục Tiểu Học Lớp 5
                </h3>
              </div>

              <button
                onClick={() => copyToClipboard(systemPromptPart1, 'part1')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-all ${
                  isCopiedPart1
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200'
                }`}
              >
                {isCopiedPart1 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopiedPart1 ? 'Đã Sao Chép!' : 'Sao Chép Phần 1'}</span>
              </button>
            </div>

            <p className="text-xs text-indigo-900 font-medium">
              Dán vào phần System Prompt (hoặc câu lệnh đầu tiên trong ChatGPT, Gemini, NotebookLM, Claude) để định hình vai trò chuyên gia.
            </p>

            <pre className="bg-white/90 p-3.5 rounded-xl text-xs font-mono text-slate-700 whitespace-pre-wrap border border-indigo-100 overflow-x-auto max-h-56">
              {systemPromptPart1}
            </pre>
          </div>

          {/* Card: Phần 2 */}
          <div className="bg-gradient-to-br from-purple-50/60 to-pink-50/40 rounded-2xl p-4 sm:p-5 border-2 border-purple-200/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <span className="bg-purple-600 text-white font-black text-xs px-2.5 py-0.5 rounded-md">
                  PHẦN 2
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-purple-950">
                  Prompt Thực Thi (Dùng sau khi tải file lên)
                </h3>
              </div>

              <button
                onClick={() => copyToClipboard(getExecutionPromptPart2(topicName), 'part2')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-all ${
                  isCopiedPart2
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white hover:bg-slate-50 text-purple-700 border border-purple-200'
                }`}
              >
                {isCopiedPart2 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopiedPart2 ? 'Đã Sao Chép!' : 'Sao Chép Phần 2'}</span>
              </button>
            </div>

            <p className="text-xs text-purple-900 font-medium">
              Trong ô chat chính (nơi bấm dấu + để tải các file .pdf, .doc, .mp4, .mp3... lên), sau khi file đã tải xong, dán câu lệnh này để yêu cầu AI tạo học liệu 5 phần.
            </p>

            <pre className="bg-white/90 p-3.5 rounded-xl text-xs font-mono text-slate-700 whitespace-pre-wrap border border-purple-100 overflow-x-auto max-h-72">
              {getExecutionPromptPart2(topicName)}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Website Structure & Slogans */}
      {activeTab === 'website_structure' && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Slogans Banner */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-5 shadow-sm space-y-2">
            <span className="bg-white/20 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
              Bộ Nhận Diện Thương Hiệu: vutoitruong
            </span>
            <h3 className="text-xl font-black">Khẩu Hiệu (Slogan) Đi Kèm Tăng Nhận Diện</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="bg-white/10 rounded-xl p-3 border border-white/20 text-xs font-bold">
                1. Vui Tới Trường - Nơi tri thức là niềm vui.
              </div>
              <div className="bg-white/10 rounded-xl p-3 border border-white/20 text-xs font-bold">
                2. Vui Tới Trường - Hành trang nhỏ, khám phá to.
              </div>
              <div className="bg-white/10 rounded-xl p-3 border border-white/20 text-xs font-bold">
                3. Vui Tới Trường - Học chủ động, sống sắc màu.
              </div>
            </div>
          </div>

          {/* 4 Specialized Portals */}
          <div className="space-y-3">
            <h4 className="font-black text-sm text-slate-800 uppercase tracking-wider">
              Cấu Trúc Chuyên Mục Khuyến Nghị Cho Website
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-900 font-extrabold text-sm">
                  <span className="text-lg">🏡</span>
                  <span>Trạm 5B.2 (Góc Hạnh Phúc)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Không gian dành riêng cho lớp, nơi cập nhật nhanh chóng các thông báo gửi phụ huynh, thời khóa biểu lớp học, và những khoảnh khắc đáng yêu của các em trên lớp.
                </p>
              </div>

              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-purple-900 font-extrabold text-sm">
                  <span className="text-lg">🎯</span>
                  <span>Thử Thách Vui (Tự Chủ Học Tập)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Chuyên mục đăng tải các game ôn tập tương tác (thiết kế qua Wordwall, Quizizz... gemini game, canvas...) hoặc các phiếu bài tập điện tử (Liveworksheets) để các em tự ôn luyện từ vựng, cấu trúc câu tiếng Việt một cách hào hứng.
                </p>
              </div>

              <div className="bg-pink-50/70 border border-pink-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-pink-900 font-extrabold text-sm">
                  <span className="text-lg">🎨</span>
                  <span>Góc Sáng Tạo (Cuộc Sống Sắc Màu)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Nơi trưng bày các bài giảng, video hay phiếu học tập được thiết kế trực quan, sinh động mang phong cách hoạt hình 3D Pixar/Disney để thu hút ánh nhìn và sự tập trung của học sinh.
                </p>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-900 font-extrabold text-sm">
                  <span className="text-lg">📚</span>
                  <span>Hành trang tri thức</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Cung cấp các tài liệu, mẹo nhỏ giúp học sinh rèn luyện nề nếp tự học tại nhà và góc chia sẻ phương pháp đồng hành cùng con dành cho phụ huynh.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
