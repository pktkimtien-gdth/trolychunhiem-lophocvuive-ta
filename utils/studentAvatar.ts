/**
 * Bộ hình minh họa trang trí trung tính, thân thiện dành cho học sinh tiểu học Lớp 5B.2
 * TUYỆT ĐỐI TUÂN THỦ:
 * - Chỉ dùng các biểu tượng trung tính: bông hoa, chiếc lá, đám mây, mặt trời, cầu vồng, ngôi sao, giọt nước, mầm cây.
 * - Không dùng hình người, bé trai, bé gái, khuôn mặt người, nhân vật có đặc điểm giới tính, váy áo hoặc động vật.
 * - Định dạng SVG Data URI chuẩn hiển thị sắc nét, nhẹ và tải tức thì không phụ thuộc mạng ngoài.
 */

export interface NeutralAvatarDef {
  id: string;
  name: string;
  svg: string;
}

const createSvgDataUri = (bgGradient: [string, string], innerSvg: string): string => {
  const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgGradient[0]}" />
      <stop offset="100%" stop-color="${bgGradient[1]}" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.1" />
    </filter>
  </defs>
  <rect width="100" height="100" rx="50" fill="url(#grad)" />
  <g filter="url(#shadow)">
    ${innerSvg}
  </g>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(rawSvg.trim().replace(/\s+/g, ' '))}`;
};

// 1. Bông hoa 5 cánh xinh xắn (Flower)
const flowerSvg = createSvgDataUri(
  ['#FFF1F2', '#FFE4E6'],
  `<g transform="translate(50, 50)">
    <circle cx="0" cy="-18" r="11" fill="#FB7185" />
    <circle cx="17" cy="-6" r="11" fill="#FB7185" />
    <circle cx="11" cy="15" r="11" fill="#FB7185" />
    <circle cx="-11" cy="15" r="11" fill="#FB7185" />
    <circle cx="-17" cy="-6" r="11" fill="#FB7185" />
    <circle cx="0" cy="0" r="13" fill="#FBBF24" />
    <circle cx="-4" cy="-2" r="2" fill="#78350F" />
    <circle cx="4" cy="-2" r="2" fill="#78350F" />
    <path d="M -4 4 Q 0 8 4 4" stroke="#78350F" stroke-width="1.8" stroke-linecap="round" fill="none" />
  </g>`
);

// 2. Chiếc lá xanh mầm non (Leaf)
const leafSvg = createSvgDataUri(
  ['#ECFDF5', '#D1FAE5'],
  `<g transform="translate(50, 50)">
    <path d="M 0 -26 C 22 -24, 28 8, 0 26 C -28 8, -22 -24, 0 -26 Z" fill="#34D399" />
    <path d="M 0 -20 L 0 24" stroke="#059669" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 0 -8 Q 8 -13 14 -12" stroke="#059669" stroke-width="2" stroke-linecap="round" fill="none" />
    <path d="M 0 -2 Q -8 -7 -14 -6" stroke="#059669" stroke-width="2" stroke-linecap="round" fill="none" />
    <path d="M 0 8 Q 8 3 13 4" stroke="#059669" stroke-width="2" stroke-linecap="round" fill="none" />
  </g>`
);

// 3. Đám mây vui vẻ (Cloud)
const cloudSvg = createSvgDataUri(
  ['#F0F9FF', '#E0F2FE'],
  `<g transform="translate(50, 50)">
    <path d="M -24 10 C -32 10, -34 -4, -22 -6 C -22 -18, -4 -22, 6 -14 C 12 -22, 28 -16, 26 -4 C 34 -2, 34 10, 24 10 Z" fill="#38BDF8" />
    <circle cx="-6" cy="1" r="2.2" fill="#0369A1" />
    <circle cx="8" cy="1" r="2.2" fill="#0369A1" />
    <path d="M -2 4 Q 1 7 4 4" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round" fill="none" />
    <circle cx="-12" cy="3" r="2" fill="#BAE6FD" />
    <circle cx="14" cy="3" r="2" fill="#BAE6FD" />
  </g>`
);

// 4. Mặt trời rạng rỡ (Sun)
const sunSvg = createSvgDataUri(
  ['#FEFCE8', '#FEF08A'],
  `<g transform="translate(50, 50)">
    <circle cx="0" cy="0" r="18" fill="#F59E0B" />
    <circle cx="0" cy="0" r="15" fill="#FBBF24" />
    <!-- Tia nắng -->
    <line x1="0" y1="-26" x2="0" y2="-21" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round" />
    <line x1="0" y1="21" x2="0" y2="26" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round" />
    <line x1="-26" y1="0" x2="-21" y2="0" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round" />
    <line x1="21" y1="0" x2="26" y2="0" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round" />
    <line x1="-18" y1="-18" x2="-14" y2="-14" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round" />
    <line x1="14" y1="14" x2="18" y2="18" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round" />
    <line x1="18" y1="-18" x2="14" y2="-14" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round" />
    <line x1="-14" y1="14" x2="-18" y2="18" stroke="#F59E0B" stroke-width="3.5" stroke-linecap="round" />
    <!-- Nụ cười -->
    <circle cx="-5" cy="-2" r="2" fill="#92400E" />
    <circle cx="5" cy="-2" r="2" fill="#92400E" />
    <path d="M -4 3 Q 0 8 4 3" stroke="#92400E" stroke-width="2" stroke-linecap="round" fill="none" />
  </g>`
);

// 5. Cầu vồng rực rỡ (Rainbow)
const rainbowSvg = createSvgDataUri(
  ['#FAF5FF', '#F3E8FF'],
  `<g transform="translate(50, 56)">
    <!-- Vòng cung ngoài -->
    <path d="M -26 0 A 26 26 0 0 1 26 0" stroke="#F87171" stroke-width="5" fill="none" stroke-linecap="round" />
    <!-- Vòng cung giữa -->
    <path d="M -20 0 A 20 20 0 0 1 20 0" stroke="#FBBF24" stroke-width="5" fill="none" stroke-linecap="round" />
    <!-- Vòng cung trong -->
    <path d="M -14 0 A 14 14 0 0 1 14 0" stroke="#60A5FA" stroke-width="5" fill="none" stroke-linecap="round" />
    <!-- 2 Đám mây nhỏ ở chân cầu vồng -->
    <circle cx="-25" cy="2" r="6" fill="#E2E8F0" />
    <circle cx="-20" cy="1" r="5" fill="#E2E8F0" />
    <circle cx="25" cy="2" r="6" fill="#E2E8F0" />
    <circle cx="20" cy="1" r="5" fill="#E2E8F0" />
  </g>`
);

// 6. Ngôi sao sáng lung linh (Star)
const starSvg = createSvgDataUri(
  ['#FFFBEB', '#FEF3C7'],
  `<g transform="translate(50, 50)">
    <polygon points="0,-25 7,-9 24,-7 12,5 15,22 0,14 -15,22 -12,5 -24,-7 -7,-9" fill="#F59E0B" stroke="#D97706" stroke-width="1.5" stroke-linejoin="round" />
    <polygon points="0,-21 6,-7 20,-5 10,4 12,18 0,11 -12,18 -10,4 -20,-5 -6,-7" fill="#FBBF24" />
    <circle cx="-4" cy="-1" r="1.8" fill="#78350F" />
    <circle cx="4" cy="-1" r="1.8" fill="#78350F" />
    <path d="M -3 3 Q 0 6 3 3" stroke="#78350F" stroke-width="1.5" stroke-linecap="round" fill="none" />
  </g>`
);

// 7. Giọt nước trong lành (Waterdrop)
const waterdropSvg = createSvgDataUri(
  ['#F0FDFA', '#CCFBF1'],
  `<g transform="translate(50, 52)">
    <path d="M 0 -26 C -18 -4, -18 16, 0 22 C 18 16, 18 -4, 0 -26 Z" fill="#2DD4BF" stroke="#0D9488" stroke-width="1.5" />
    <!-- Vệt sáng phản chiếu -->
    <path d="M -7 -6 C -12 2, -11 12, -4 16" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.8" />
    <circle cx="3" cy="2" r="2" fill="#042F2E" />
    <circle cx="-3" cy="2" r="2" fill="#042F2E" />
    <path d="M -2 7 Q 0 10 2 7" stroke="#042F2E" stroke-width="1.6" stroke-linecap="round" fill="none" />
  </g>`
);

// 8. Cỏ bốn lá may mắn (Lucky Clover)
const cloverSvg = createSvgDataUri(
  ['#F0FDF4', '#DCFCE7'],
  `<g transform="translate(50, 48)">
    <circle cx="0" cy="-12" r="9" fill="#22C55E" />
    <circle cx="12" cy="0" r="9" fill="#22C55E" />
    <circle cx="0" cy="12" r="9" fill="#22C55E" />
    <circle cx="-12" cy="0" r="9" fill="#22C55E" />
    <circle cx="0" cy="0" r="6" fill="#16A34A" />
    <path d="M 0 10 Q 3 24 10 25" stroke="#15803D" stroke-width="3" stroke-linecap="round" fill="none" />
  </g>`
);

// 9. Hoa cúc nhỏ (Daisy Flower)
const daisySvg = createSvgDataUri(
  ['#F8FAFC', '#E2E8F0'],
  `<g transform="translate(50, 50)">
    <circle cx="0" cy="-16" r="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1" />
    <circle cx="14" cy="-7" r="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1" />
    <circle cx="12" cy="11" r="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1" />
    <circle cx="-4" cy="16" r="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1" />
    <circle cx="-15" cy="4" r="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1" />
    <circle cx="-10" cy="-13" r="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1" />
    <circle cx="0" cy="0" r="10" fill="#EAB308" />
  </g>`
);

// 10. Mầm cây tươi mới (Sprout)
const sproutSvg = createSvgDataUri(
  ['#F0FDF4', '#BBF7D0'],
  `<g transform="translate(50, 50)">
    <!-- Thân mầm -->
    <path d="M 0 24 Q 0 4 -2 -6" stroke="#15803D" stroke-width="3.5" stroke-linecap="round" fill="none" />
    <!-- Lá trái -->
    <path d="M -2 -6 C -18 -8, -16 -24, 0 -18 C -2 -12, -2 -6, -2 -6 Z" fill="#4ADE80" stroke="#16A34A" stroke-width="1.2" />
    <!-- Lá phải -->
    <path d="M -2 -6 C 14 -12, 20 2, 2 2 C 0 -1, -2 -6, -2 -6 Z" fill="#22C55E" stroke="#15803D" stroke-width="1.2" />
    <!-- Mặt đất nhỏ -->
    <ellipse cx="0" cy="24" rx="14" ry="4" fill="#86EFAC" />
  </g>`
);

export const NEUTRAL_AVATARS: NeutralAvatarDef[] = [
  { id: 'flower', name: 'Bông hoa vui vẻ', svg: flowerSvg },
  { id: 'leaf', name: 'Chiếc lá xanh', svg: leafSvg },
  { id: 'cloud', name: 'Đám mây dịu êm', svg: cloudSvg },
  { id: 'sun', name: 'Mặt trời rạng rỡ', svg: sunSvg },
  { id: 'rainbow', name: 'Cầu vồng tươi sáng', svg: rainbowSvg },
  { id: 'star', name: 'Ngôi sao chăm ngoan', svg: starSvg },
  { id: 'waterdrop', name: 'Giọt nước mát lành', svg: waterdropSvg },
  { id: 'clover', name: 'Cỏ bốn lá may mắn', svg: cloverSvg },
  { id: 'daisy', name: 'Hoa cúc nhỏ', svg: daisySvg },
  { id: 'sprout', name: 'Mầm cây hy vọng', svg: sproutSvg },
];

/**
 * Lấy hình minh họa trung tính ổn định cho học sinh theo ID hoặc Tên.
 * Đảm bảo 100% trung tính, không suy đoán giới tính, không dùng hình mặt người/bé trai/bé gái.
 */
export function getStudentNeutralAvatar(seedOrId?: string): string {
  if (!seedOrId) return NEUTRAL_AVATARS[0].svg;

  // Tính hash đơn giản để giữ hình minh họa cố định cho từng học sinh
  let hash = 0;
  for (let i = 0; i < seedOrId.length; i++) {
    hash = (hash << 5) - hash + seedOrId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % NEUTRAL_AVATARS.length;
  return NEUTRAL_AVATARS[index].svg;
}

/**
 * Kiểm tra xem avatar có phải là avatar cũ phân loại giới tính (dicebear adventurer/bottts) không
 */
export function isLegacyGenderedAvatar(avatarUrl?: string): boolean {
  if (!avatarUrl) return true;
  if (avatarUrl.includes('dicebear.com')) return true;
  if (avatarUrl.includes('adventurer') || avatarUrl.includes('bottts') || avatarUrl.includes('avataaars')) return true;
  return false;
}

/**
 * Chuẩn hóa avatar của học sinh để đảm bảo luôn dùng hình minh họa trung tính (trừ khi là ảnh do giáo viên tải lên)
 */
export function sanitizeStudentAvatar(student: { id: string; name?: string; avatar?: string }): string {
  if (!student.avatar || isLegacyGenderedAvatar(student.avatar)) {
    return getStudentNeutralAvatar(student.id || student.name || 'hs');
  }
  return student.avatar;
}
