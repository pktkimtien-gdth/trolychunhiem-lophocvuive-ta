export interface Affirmation {
  id: number;
  quote: string;
  author: string;
  category: 'Tự tin' | 'Kiên trì' | 'Sáng tạo' | 'Tình bạn' | 'Biết ơn' | 'Tập trung' | 'Tự hào';
  reflectionPrompt: string;
  themeEmoji: string;
  bgImage: string;
  bgGradient: string;
}

export const DAILY_AFFIRMATIONS: Affirmation[] = [
  {
    id: 1,
    quote: 'Mỗi ngày đến trường là một cơ hội để mình trở nên tốt hơn hôm qua. Mình tự tin và sẵn sàng học hỏi!',
    author: 'Lời nhắn gửi Lớp 5B.2',
    category: 'Tự tin',
    reflectionPrompt: 'Hôm nay em sẽ giơ tay phát biểu ít nhất 1 lần trong tiết học nhé!',
    themeEmoji: '☀️',
    bgImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
    bgGradient: 'from-amber-900/80 via-orange-950/75 to-slate-900/90',
  },
  {
    id: 2,
    quote: 'Khó khăn chỉ là bài học để mình thêm mạnh mẽ. Nếu chưa hiểu, mình sẽ mạnh dạn hỏi cô và bạn bè!',
    author: 'Cô Kim Tiến Number Hi!',
    category: 'Kiên trì',
    reflectionPrompt: 'Khi gặp bài toán khó, hãy hít thở sâu và chia nhỏ từng bước giải em nhé.',
    themeEmoji: '🌱',
    bgImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80',
    bgGradient: 'from-emerald-950/80 via-teal-950/75 to-slate-900/90',
  },
  {
    id: 3,
    quote: 'Một nụ cười và lời khen chân thành có thể thắp sáng cả một ngày của bạn cùng lớp.',
    author: 'Tình bạn 5B.2 Vui Vẻ',
    category: 'Tình bạn',
    reflectionPrompt: 'Hôm nay em hãy mỉm cười và nói một lời động viên với bạn ngồi cạnh bàn.',
    themeEmoji: '🌸',
    bgImage: 'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=1600&q=80',
    bgGradient: 'from-rose-950/80 via-purple-950/75 to-slate-900/90',
  },
  {
    id: 4,
    quote: 'Trí tưởng tượng của mình là đôi cánh kỳ diệu đưa mình bay đến muôn ngàn chân trời tri thức mới.',
    author: 'Góc Sáng Tạo Tuổi Thơ',
    category: 'Sáng tạo',
    reflectionPrompt: 'Em hãy thử tìm một cách giải bài mới hoặc vẽ một ý tưởng độc đáo vào vở!',
    themeEmoji: '🎨',
    bgImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    bgGradient: 'from-indigo-950/80 via-purple-950/75 to-slate-900/90',
  },
  {
    id: 5,
    quote: 'Mình không cần phải so sánh với ai khác. Chỉ cần hôm nay tiến bộ hơn hôm qua một chút là rất đáng tự hào!',
    author: 'Hạt Giống Tâm Hồn',
    category: 'Tự hào',
    reflectionPrompt: 'Điều gì em đã làm tốt hơn tuần trước? Hãy tự mỉm cười khen ngợi chính mình.',
    themeEmoji: '🌟',
    bgImage: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1600&q=80',
    bgGradient: 'from-amber-950/80 via-yellow-950/70 to-slate-900/90',
  },
  {
    id: 6,
    quote: 'Mỗi cuốn sách mở ra là một người bạn thông thái đang chờ mình trò chuyện và sẻ chia.',
    author: 'Thư Viện Lớp 5B.2',
    category: 'Tập trung',
    reflectionPrompt: 'Dành 15 phút giờ ra chơi để đọc tiếp một trang sách thú vị nhé!',
    themeEmoji: '📚',
    bgImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=80',
    bgGradient: 'from-blue-950/80 via-indigo-950/75 to-slate-900/90',
  },
  {
    id: 7,
    quote: 'Muốn đi nhanh hãy đi một mình, muốn đi xa và vui hãy cùng nhau gắn kết trong đại gia đình 5B.2!',
    author: 'Đoàn Kết Là Sức Mạnh',
    category: 'Tình bạn',
    reflectionPrompt: 'Hôm nay trong hoạt động nhóm, hãy lắng nghe ý kiến của bạn một cách chăm chú.',
    themeEmoji: '🤝',
    bgImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1600&q=80',
    bgGradient: 'from-emerald-950/80 via-cyan-950/75 to-slate-900/90',
  },
  {
    id: 8,
    quote: 'Biết ơn thầy cô dạy dỗ, biết ơn cha mẹ chăm lo, biết ơn chính mình đã luôn cố gắng mỗi ngày!',
    author: 'Lòng Biết Ơn',
    category: 'Biết ơn',
    reflectionPrompt: 'Em hãy gửi lời cảm ơn chân thành đến người đã giúp đỡ em hôm nay.',
    themeEmoji: '💖',
    bgImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&q=80',
    bgGradient: 'from-purple-950/80 via-pink-950/75 to-slate-900/90',
  },
  {
    id: 9,
    quote: 'Tập trung vào từng nhiệm vụ nhỏ lúc này sẽ tạo nên kết quả xuất sắc trong bài kiểm tra sắp tới.',
    author: 'Bí Kíp Học Tốt',
    category: 'Tập trung',
    reflectionPrompt: 'Tập trung lắng nghe bài giảng 20 phút đầu giờ, em sẽ thấy bài tập dễ hơn rất nhiều!',
    themeEmoji: '🎯',
    bgImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
    bgGradient: 'from-slate-950/85 via-indigo-950/75 to-slate-900/90',
  },
  {
    id: 10,
    quote: 'Hít một hơi thật sâu, mỉm cười thật tươi — mình có đủ năng lượng và sự thông minh để chinh phục ngày hôm nay!',
    author: 'Năng Lượng Tích Cực',
    category: 'Tự tin',
    reflectionPrompt: 'Tự nhủ thầm 3 lần: "Em tự tin, em chăm ngoan, em làm được!"',
    themeEmoji: '🚀',
    bgImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    bgGradient: 'from-cyan-950/80 via-blue-950/75 to-slate-900/90',
  },
];

/**
 * Returns today's default affirmation based on day of year,
 * ensuring students get a fresh affirmation each day.
 */
export function getAffirmationForToday(): Affirmation {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const index = Math.abs(dayOfYear) % DAILY_AFFIRMATIONS.length;
  return DAILY_AFFIRMATIONS[index];
}
