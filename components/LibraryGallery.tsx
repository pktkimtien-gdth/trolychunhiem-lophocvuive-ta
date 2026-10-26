import React, { useState, useMemo, useEffect } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { BookItem, BookCategory } from '../types';
import { INITIAL_BOOKS } from '../data/initialData';
import { soundEffects } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  Search,
  Heart,
  Star,
  Clock,
  Sparkles,
  Plus,
  Filter,
  Eye,
  Check,
  X,
  Bookmark,
  Share2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Layers,
  Award,
  BookMarked,
  Library,
  Compass,
  Smile,
  ExternalLink,
  Flame
} from 'lucide-react';

interface LibraryGalleryProps {
  onBackToLMS?: () => void;
}

export const LibraryGallery: React.FC<LibraryGalleryProps> = ({ onBackToLMS }) => {
  const { currentStudent, awardCoins, isTeacherLoggedIn, role } = useClassroom();

  // Books State with LocalStorage Persistence
  const [books, setBooks] = useState<BookItem[]>(() => {
    const saved = localStorage.getItem('vutoitruong_library_books');
    return saved ? JSON.parse(saved) : INITIAL_BOOKS;
  });

  useEffect(() => {
    localStorage.setItem('vutoitruong_library_books', JSON.stringify(books));
  }, [books]);

  // Favorite Books IDs State
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('vutoitruong_fav_books');
    return saved ? JSON.parse(saved) : ['book-1', 'book-3'];
  });

  useEffect(() => {
    localStorage.setItem('vutoitruong_fav_books', JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  // Read Books IDs State (Completed reading)
  const [readBookIds, setReadBookIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('vutoitruong_read_books');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('vutoitruong_read_books', JSON.stringify(readBookIds));
  }, [readBookIds]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewStyle, setViewStyle] = useState<'shelf' | 'grid'>('shelf');

  // Reader Modal State
  const [readingBook, setReadingBook] = useState<BookItem | null>(null);
  const [readerFontSize, setReaderFontSize] = useState<'normal' | 'large' | 'huge'>('normal');
  const [readerTheme, setReaderTheme] = useState<'warm' | 'white' | 'dark'>('warm');
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);

  // Add Book Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState<BookCategory>('van_hoc');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [newPagesCount, setNewPagesCount] = useState(120);
  const [newReadTime, setNewReadTime] = useState('20 phút');
  const [newSummary, setNewSummary] = useState('');
  const [newMoralLesson, setNewMoralLesson] = useState('');
  const [newPdfUrl, setNewPdfUrl] = useState('');
  const [newRewardCoins, setNewRewardCoins] = useState(15);

  const categories = [
    { id: 'all', label: 'Tất cả kệ sách' },
    { id: 'favorites', label: '❤️ Sách yêu thích' },
    { id: 'van_hoc', label: 'Văn học thiếu nhi' },
    { id: 'khoa_hoc', label: 'Khám phá khoa học' },
    { id: 'lich_su', label: 'Lịch sử hào hùng' },
    { id: 'ky_nang', label: 'Kỹ năng & Tâm hồn' },
    { id: 'truyen_tranh', label: 'Truyện cổ tích' },
    { id: 'sgk_tai_lieu', label: 'SGK & Tài liệu số' },
  ];

  // Filter books
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        book.summary.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        book.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      let matchCategory = true;
      if (selectedCategory === 'favorites') {
        matchCategory = favoriteIds.includes(book.id);
      } else if (selectedCategory !== 'all') {
        matchCategory = book.category === selectedCategory;
      }

      return matchSearch && matchCategory;
    });
  }, [books, searchQuery, selectedCategory, favoriteIds]);

  // Toggle Favorite
  const handleToggleFavorite = (book: BookItem, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playCoin();
    const isFav = favoriteIds.includes(book.id);

    if (isFav) {
      setFavoriteIds((prev) => prev.filter((id) => id !== book.id));
    } else {
      setFavoriteIds((prev) => [...prev, book.id]);
      if (currentStudent) {
        awardCoins(currentStudent.id, 1);
      }
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    }
  };

  // Open Book Reader
  const handleOpenReader = (book: BookItem) => {
    soundEffects.playClick();
    setReadingBook(book);
    setActiveChapterIdx(0);
  };

  // Congratulations reading modal state
  const [congratsReadingModal, setCongratsReadingModal] = useState<{
    title: string;
    rewardCoins: number;
  } | null>(null);

  // Finish Reading & Earn Coins
  const handleFinishReading = () => {
    if (!readingBook) return;
    const isAlreadyRead = readBookIds.includes(readingBook.id);
    const coins = readingBook.rewardCoins || 10;

    if (!isAlreadyRead) {
      setReadBookIds((prev) => [...prev, readingBook.id]);
      if (currentStudent) {
        awardCoins(currentStudent.id, coins);
      }
    }

    soundEffects.playWorksheetComplete();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    setCongratsReadingModal({
      title: readingBook.title,
      rewardCoins: coins,
    });
  };

  // Create Book Form Submit
  const handleCreateBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const catObj = categories.find((c) => c.id === newCategory);

    const fallbackCover =
      newCoverUrl.trim() ||
      (newCategory === 'van_hoc'
        ? 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
        : newCategory === 'khoa_hoc'
        ? 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80');

    const newBook: BookItem = {
      id: 'book-' + Date.now(),
      title: newTitle.trim(),
      author: newAuthor.trim() || 'Cô Kim Tiến & Tủ Sách 5B.2',
      category: newCategory,
      categoryLabel: catObj ? catObj.label : 'Tài liệu số',
      coverUrl: fallbackCover,
      pagesCount: Number(newPagesCount) || 100,
      readTimeEstimate: newReadTime || '20 phút',
      rating: 5.0,
      summary:
        newSummary.trim() ||
        'Tài liệu số và truyện đọc bồi dưỡng kiến thức văn hóa, khoa học cho học sinh Lớp 5.',
      moralLesson: newMoralLesson.trim() || 'Bồi dưỡng tình yêu đọc sách và tư duy sáng tạo.',
      pdfUrl: newPdfUrl.trim() || undefined,
      rewardCoins: Number(newRewardCoins) || 12,
      tags: ['Tủ sách 5B.2', 'Đọc sách mỗi ngày', 'Vui đến trường'],
      contentSample: [
        `Trích đoạn mở đầu: "${newTitle.trim()}" mở ra một thế giới tri thức kỳ diệu và tràn ngập niềm vui khám phá...`,
        'Bài học kết nối thực tế: Giúp học sinh vận dụng kiến thức vào các bài làm văn và cuộc sống hằng ngày...',
      ],
      isFeatured: false,
    };

    setBooks((prev) => [newBook, ...prev]);
    soundEffects.playWorksheetComplete();
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });

    // Reset Form
    setNewTitle('');
    setNewAuthor('');
    setNewCoverUrl('');
    setNewSummary('');
    setNewMoralLesson('');
    setNewPdfUrl('');
    setShowAddModal(false);
  };

  // Group books into shelves (3 or 4 books per shelf)
  const shelves = useMemo(() => {
    const chunk = 4;
    const result: BookItem[][] = [];
    for (let i = 0; i < filteredBooks.length; i += chunk) {
      result.push(filteredBooks.slice(i, i + chunk));
    }
    return result;
  }, [filteredBooks]);

  return (
    <div className="space-y-6 pb-16 font-['Quicksand',sans-serif]">
      {/* HERO BANNER: KỆ SÁCH VUI ĐẾN TRƯỜNG */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-800 via-orange-800 to-amber-900 text-white p-6 sm:p-8 shadow-xl shadow-amber-900/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center space-x-2 flex-wrap gap-1.5">
              <span className="bg-amber-400 text-amber-950 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center space-x-1 shadow-xs">
                <span>📖 LibraryGallery</span>
              </span>
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-0.5 rounded-full border border-white/20">
                Lớp 5B.2 • Vui đến trường
              </span>
              <span className="bg-emerald-400 text-emerald-950 text-xs font-black px-2.5 py-0.5 rounded-full">
                {books.length} Đầu Sách & Tài Liệu
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-xs">
              Kệ Sách Điện Tử • Thư Viện Tri Thức Lớp 5B.2
            </h1>

            <p className="text-amber-100 text-xs sm:text-sm leading-relaxed font-medium">
              Không gian đọc sách trực quan sinh động dành cho các em học sinh: truyện ngụ ngôn,
              văn học kinh điển, lược sử nước Việt, khám phá khoa học và tài liệu số phong phú.
              Đọc xong nhận thưởng <strong className="text-amber-300 font-black">+Xu rèn luyện</strong>!
            </p>

            <div className="flex items-center space-x-4 pt-1 text-xs text-amber-200 font-bold flex-wrap gap-y-1">
              <span>🌟 Mỗi trang sách một chân trời</span>
              <span>•</span>
              <span>❤️ Bấm thích lưu kệ sách riêng</span>
              <span>•</span>
              <span>🪙 Thưởng Xu khi đọc xong</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            {role === 'teacher' && (
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setShowAddModal(true);
                }}
                className="flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-5 py-3 rounded-2xl shadow-lg shadow-amber-400/30 hover:scale-[1.02] active:scale-98 transition-all text-xs sm:text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Sách & Tài Liệu Mới</span>
              </button>
            )}

            {onBackToLMS && (
              <button
                onClick={onBackToLMS}
                className="flex items-center justify-center space-x-1.5 bg-white/15 hover:bg-white/25 text-white font-bold px-4 py-2.5 rounded-2xl border border-white/20 transition-all text-xs"
              >
                <span>Về Hệ Thống LMS Chủ Nhiệm</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div className="bg-white rounded-2xl p-4 border border-amber-100/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên sách, tác giả, bài học, từ khóa..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Toggle & Favorites Count */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setViewStyle('shelf');
              soundEffects.playClick();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
              viewStyle === 'shelf'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span>Kệ Sách 3D</span>
          </button>

          <button
            onClick={() => {
              setViewStyle('grid');
              soundEffects.playClick();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
              viewStyle === 'grid'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Lưới Thẻ</span>
          </button>
        </div>
      </div>

      {/* CATEGORY TABS BAR */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              soundEffects.playClick();
            }}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-amber-600 text-white shadow-xs scale-[1.02]'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* EMPTY STATE */}
      {filteredBooks.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-amber-200 max-w-lg mx-auto">
          <BookOpen className="w-12 h-12 text-amber-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">
            Không tìm thấy cuốn sách nào phù hợp
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Thử tìm kiếm với từ khóa khác hoặc bấm nút thêm sách mới vào thư viện lớp 5B.2!
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl"
          >
            Xem toàn bộ kệ sách
          </button>
        </div>
      )}

      {/* VIEW 1: 3D BOOKSHELF VIEW (KỆ SÁCH TRỰC QUAN GỖ) */}
      {viewStyle === 'shelf' && filteredBooks.length > 0 && (
        <div className="space-y-10">
          {shelves.map((shelfBooks, shelfIdx) => (
            <div key={`shelf-${shelfIdx}`} className="relative pt-6">
              {/* Shelf Background Wall Accent */}
              <div className="bg-gradient-to-b from-amber-50/50 to-amber-100/30 rounded-3xl p-4 sm:p-6 pb-2 border border-amber-200/60 shadow-inner">
                {/* Books Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 items-end justify-items-center mb-1">
                  {shelfBooks.map((book) => {
                    const isFav = favoriteIds.includes(book.id);
                    const isRead = readBookIds.includes(book.id);

                    return (
                      <div
                        key={book.id}
                        onClick={() => handleOpenReader(book)}
                        className="group relative flex flex-col items-center cursor-pointer transition-all duration-300 hover:-translate-y-2"
                      >
                        {/* 3D Book Cover Container */}
                        <div className="relative w-32 sm:w-40 aspect-[2/3] rounded-r-xl rounded-l-sm overflow-hidden shadow-xl shadow-amber-950/20 group-hover:shadow-2xl transition-all duration-300 border-l-4 border-amber-950/50">
                          {/* Book Cover Image */}
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />

                          {/* 3D Book Spine Fold Effect */}
                          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none"></div>

                          {/* Gradient Sheen Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-85 group-hover:opacity-75 transition-opacity"></div>

                          {/* Category Badge Top */}
                          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                            <span className="bg-amber-400 text-amber-950 text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs truncate max-w-[85px]">
                              {book.categoryLabel}
                            </span>

                            {/* Favorite Button on Book Cover */}
                            <button
                              onClick={(e) => handleToggleFavorite(book, e)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                isFav
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-black/50 text-white hover:bg-rose-500'
                              }`}
                              title={isFav ? 'Bỏ yêu thích' : 'Yêu thích cuốn sách này'}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-white' : ''}`} />
                            </button>
                          </div>

                          {/* Completed Read Badge */}
                          {isRead && (
                            <div className="absolute top-8 left-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center space-x-0.5 shadow-sm">
                              <Check className="w-2.5 h-2.5" />
                              <span>Đã đọc</span>
                            </div>
                          )}

                          {/* Bottom Book Info On Cover */}
                          <div className="absolute bottom-2 left-2 right-2 text-white text-left">
                            <h4 className="font-black text-xs leading-tight line-clamp-2 drop-shadow-xs">
                              {book.title}
                            </h4>
                            <p className="text-[10px] text-amber-200 font-bold truncate mt-0.5">
                              {book.author}
                            </p>
                          </div>
                        </div>

                        {/* Title Under Book for Clarity */}
                        <div className="text-center mt-2.5 max-w-[130px] sm:max-w-[160px]">
                          <span className="text-xs font-bold text-slate-800 group-hover:text-amber-800 line-clamp-1">
                            {book.title}
                          </span>
                          <div className="flex items-center justify-center space-x-1 text-[11px] text-slate-500 mt-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="font-bold">{book.rating}</span>
                            <span>•</span>
                            <span className="text-amber-600 font-bold">+{book.rewardCoins} Xu</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Wooden Bookshelf Plank (Mặt Kệ Gỗ 3D) */}
                <div className="relative h-5 w-full bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 rounded-sm shadow-md flex items-center justify-center">
                  <div className="absolute inset-x-0 top-0 h-1 bg-amber-600/70"></div>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-950/60"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-200/40 select-none">
                    TỦ SÁCH LỚP 5B.2 • TẦNG {shelfIdx + 1}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: MODERN GRID VIEW */}
      {viewStyle === 'grid' && filteredBooks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBooks.map((book) => {
            const isFav = favoriteIds.includes(book.id);
            const isRead = readBookIds.includes(book.id);

            return (
              <div
                key={book.id}
                onClick={() => handleOpenReader(book)}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-amber-300 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-4 flex gap-4 cursor-pointer group"
              >
                {/* Book Cover */}
                <div className="relative w-28 aspect-[2/3] shrink-0 rounded-xl overflow-hidden shadow-md bg-slate-900">
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  {isRead && (
                    <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                      Đã đọc
                    </div>
                  )}
                </div>

                {/* Book Content */}
                <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-md truncate max-w-[120px]">
                        {book.categoryLabel}
                      </span>

                      <button
                        onClick={(e) => handleToggleFavorite(book, e)}
                        className={`p-1.5 rounded-full transition-colors ${
                          isFav ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                        }`}
                        title={isFav ? 'Bỏ yêu thích' : 'Yêu thích cuốn sách này'}
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
                      </button>
                    </div>

                    <h3 className="font-black text-slate-900 group-hover:text-amber-800 transition-colors text-sm sm:text-base leading-snug line-clamp-2">
                      {book.title}
                    </h3>

                    <p className="text-xs text-slate-500 font-semibold truncate">
                      Tác giả: {book.author}
                    </p>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {book.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-amber-600 font-black">+{book.rewardCoins} Xu</span>
                    <button
                      onClick={() => handleOpenReader(book)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors text-xs inline-flex items-center space-x-1"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Đọc sách</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* READING MODAL (TRÌNH ĐỌC SÁCH ĐIỆN TỬ TƯƠNG TÁC) */}
      {readingBook && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div
            className={`w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh] border transition-colors ${
              readerTheme === 'warm'
                ? 'bg-[#faf6ed] text-[#3d3224] border-amber-200'
                : readerTheme === 'dark'
                ? 'bg-slate-900 text-slate-100 border-slate-700'
                : 'bg-white text-slate-900 border-slate-200'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 ${
                readerTheme === 'dark'
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-amber-100/60 border-amber-200'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <span className="bg-amber-500 text-amber-950 px-2 py-0.5 rounded-md text-xs font-black shrink-0">
                  {readingBook.categoryLabel}
                </span>
                <h3 className="font-black text-sm sm:text-base truncate">
                  {readingBook.title}
                </h3>
                <span className="text-xs opacity-75 hidden sm:inline">
                  • {readingBook.author}
                </span>
              </div>

              {/* Reader Controls */}
              <div className="flex items-center space-x-2 shrink-0">
                {/* Font Size */}
                <div className="flex items-center bg-black/10 rounded-xl p-1 text-xs font-bold">
                  <button
                    onClick={() => setReaderFontSize('normal')}
                    className={`px-2 py-0.5 rounded-lg ${
                      readerFontSize === 'normal' ? 'bg-white shadow-2xs font-black' : ''
                    }`}
                  >
                    A
                  </button>
                  <button
                    onClick={() => setReaderFontSize('large')}
                    className={`px-2 py-0.5 rounded-lg ${
                      readerFontSize === 'large' ? 'bg-white shadow-2xs font-black text-sm' : ''
                    }`}
                  >
                    A+
                  </button>
                  <button
                    onClick={() => setReaderFontSize('huge')}
                    className={`px-2 py-0.5 rounded-lg ${
                      readerFontSize === 'huge' ? 'bg-white shadow-2xs font-black text-base' : ''
                    }`}
                  >
                    A++
                  </button>
                </div>

                {/* Theme Selector */}
                <div className="flex items-center bg-black/10 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setReaderTheme('warm')}
                    className={`w-6 h-6 rounded-lg bg-[#faf6ed] border ${
                      readerTheme === 'warm' ? 'ring-2 ring-amber-500' : ''
                    }`}
                    title="Giao diện ấm dịu mắt"
                  ></button>
                  <button
                    onClick={() => setReaderTheme('white')}
                    className={`w-6 h-6 rounded-lg bg-white border ml-1 ${
                      readerTheme === 'white' ? 'ring-2 ring-blue-500' : ''
                    }`}
                    title="Giao diện sáng trắng"
                  ></button>
                  <button
                    onClick={() => setReaderTheme('dark')}
                    className={`w-6 h-6 rounded-lg bg-slate-900 border ml-1 ${
                      readerTheme === 'dark' ? 'ring-2 ring-purple-500' : ''
                    }`}
                    title="Giao diện tối ban đêm"
                  ></button>
                </div>

                <button
                  onClick={() => setReadingBook(null)}
                  className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Book Content & Reader */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Book Metadata Spotlight */}
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center gap-4 ${
                  readerTheme === 'dark'
                    ? 'bg-slate-800/60 border-slate-700'
                    : 'bg-amber-50/80 border-amber-200'
                }`}
              >
                <img
                  src={readingBook.coverUrl}
                  alt={readingBook.title}
                  className="w-24 aspect-[2/3] object-cover rounded-xl shadow-md border"
                />

                <div className="space-y-1.5 flex-1 text-center sm:text-left">
                  <h2 className="text-lg sm:text-xl font-black">{readingBook.title}</h2>
                  <p className="text-xs font-bold opacity-80">
                    Tác giả: {readingBook.author} • Ước tính: {readingBook.readTimeEstimate} • {readingBook.pagesCount} trang
                  </p>
                  <p className="text-xs leading-relaxed opacity-90 pt-1">
                    {readingBook.summary}
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-2">
                    {readingBook.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-amber-200/50 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Moral Lesson Highlight (Bài học giáo dục tiểu học) */}
              {readingBook.moralLesson && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-amber-400/20 border-2 border-amber-400/40 space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-black text-amber-900">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Bài học bồi dưỡng tâm hồn & kỹ năng sống:</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-amber-950 leading-relaxed italic">
                    &ldquo;{readingBook.moralLesson}&rdquo;
                  </p>
                </div>
              )}

              {/* Sample Excerpt Chapters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black flex items-center space-x-2">
                    <BookMarked className="w-4 h-4 text-amber-600" />
                    <span>Nội Dung Trích Đoạn Đọc Mở Rộng:</span>
                  </h4>
                  <span className="text-xs font-bold opacity-75">
                    Trang {activeChapterIdx + 1} /{' '}
                    {readingBook.contentSample?.length || 1}
                  </span>
                </div>

                {readingBook.contentSample && readingBook.contentSample.length > 0 && (
                  <div
                    className={`p-6 rounded-2xl border leading-relaxed transition-all shadow-inner ${
                      readerFontSize === 'normal'
                        ? 'text-sm sm:text-base leading-relaxed'
                        : readerFontSize === 'large'
                        ? 'text-base sm:text-lg leading-loose'
                        : 'text-lg sm:text-xl leading-loose font-medium'
                    } ${
                      readerTheme === 'dark'
                        ? 'bg-slate-800 border-slate-700'
                        : 'bg-white border-amber-100'
                    }`}
                  >
                    <p className="whitespace-pre-line font-serif">
                      {readingBook.contentSample[activeChapterIdx]}
                    </p>
                  </div>
                )}

                {/* Chapter Navigation Buttons */}
                {readingBook.contentSample && readingBook.contentSample.length > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setActiveChapterIdx((p) => Math.max(0, p - 1))}
                      disabled={activeChapterIdx === 0}
                      className="px-3.5 py-1.5 rounded-xl border text-xs font-bold disabled:opacity-40 flex items-center space-x-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Đoạn trước</span>
                    </button>

                    <button
                      onClick={() =>
                        setActiveChapterIdx((p) =>
                          Math.min(readingBook.contentSample!.length - 1, p + 1)
                        )
                      }
                      disabled={
                        activeChapterIdx === readingBook.contentSample.length - 1
                      }
                      className="px-3.5 py-1.5 rounded-xl border text-xs font-bold disabled:opacity-40 flex items-center space-x-1"
                    >
                      <span>Đoạn tiếp theo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer: Finish Button & Reward */}
            <div
              className={`px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
                readerTheme === 'dark' ? 'bg-slate-800' : 'bg-amber-100/40'
              }`}
            >
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-800">
                <Award className="w-4 h-4 text-amber-600" />
                <span>
                  Hoàn thành việc đọc sách để nhận thưởng{' '}
                  <strong className="text-amber-600">+{readingBook.rewardCoins} Xu</strong>!
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setReadingBook(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-black/5"
                >
                  Đóng sách
                </button>

                <button
                  onClick={handleFinishReading}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-amber-600/30 flex items-center space-x-1.5 active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Em Đã Đọc Xong (+{readingBook.rewardCoins} Xu)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW BOOK MODAL (DÀNH CHO GIÁO VIÊN & QUẢN TRỊ VIÊN) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-amber-800 text-white flex items-center justify-between">
              <div>
                <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                  THƯ VIỆN LỚP 5B.2
                </span>
                <h3 className="text-base font-black text-white mt-1">
                  Thêm Sách / Truyện Đọc / Tài Liệu Số Mới
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBookSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên cuốn sách / tài liệu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ví dụ: Vừa Nhắm Mắt Vừa Mở Cửa Sổ"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tác giả</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Ngọc Thuần"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thể loại chủ đề</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="van_hoc">Văn học thiếu nhi</option>
                    <option value="khoa_hoc">Khám phá khoa học</option>
                    <option value="lich_su">Lịch sử hào hùng</option>
                    <option value="ky_nang">Kỹ năng & Tâm hồn</option>
                    <option value="truyen_tranh">Truyện cổ tích</option>
                    <option value="sgk_tai_lieu">SGK & Tài liệu số</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số trang ước tính</label>
                  <input
                    type="number"
                    min={10}
                    value={newPagesCount}
                    onChange={(e) => setNewPagesCount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phần thưởng (+Xu)</label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={newRewardCoins}
                    onChange={(e) => setNewRewardCoins(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Đường dẫn ảnh bìa sách (URL hình ảnh)
                </label>
                <input
                  type="url"
                  value={newCoverUrl}
                  onChange={(e) => setNewCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... (Để trống sẽ tự tạo ảnh bìa mẫu)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tóm tắt nội dung sách</label>
                <textarea
                  rows={2}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Nêu ngắn gọn nội dung cuốn sách gợi mở sự tò mò của học sinh..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bài học rút ra / Giá trị nhân văn
                </label>
                <input
                  type="text"
                  value={newMoralLesson}
                  onChange={(e) => setNewMoralLesson(e.target.value)}
                  placeholder="Ví dụ: Giúp các em biết yêu thương bạn bè và sống chan hòa với thiên nhiên."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold shadow-xs flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Đưa Vào Kệ Sách</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reading Completed Celebration Modal */}
      {congratsReadingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border border-amber-200 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center text-3xl shadow-inner">
              🎉
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase text-amber-600 tracking-wider">
                Rèn Luyện Thói Quen Đọc Sách
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Chúc Mừng Em Đã Đọc Xong!
              </h3>
              <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1 line-clamp-2">
                "{congratsReadingModal.title}"
              </p>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-900 flex items-center justify-center space-x-2 font-bold text-sm">
              <span>🪙</span>
              <span>Em đã nhận được <strong>+{congratsReadingModal.rewardCoins} Xu</strong> thưởng!</span>
            </div>
            <button
              onClick={() => {
                setCongratsReadingModal(null);
                setReadingBook(null);
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-2xl shadow-md transition-all text-sm"
            >
              Tiếp Tục Khám Phá Sách Mới ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
