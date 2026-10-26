import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useClassroom } from '../../context/ClassroomContext';
import { supabase } from '../../lib/supabase';
import { getStudentNeutralAvatar } from '../../utils/studentAvatar';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Users,
  Database,
  RefreshCw,
  Sparkles,
  ClipboardPaste,
  ShieldCheck,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../../utils/soundEffects';

interface ParsedStudentRow {
  stt?: number | string;
  name: string;
  group?: string;
  studentCode?: string;
  parentPin?: string;
  notes?: string;
}

interface AdminStudentExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminStudentExcelImportModal: React.FC<AdminStudentExcelImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { importRealStudents, students, role, isTeacherLoggedIn } = useClassroom();

  const [activeMode, setActiveMode] = useState<'upload' | 'paste'>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [rawText, setRawText] = useState('');
  const [importOption, setImportOption] = useState<'replace' | 'append'>('replace');
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    success: boolean;
    count: number;
    supabaseSynced: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  // Giới hạn quyền cập nhật danh sách học sinh: Chỉ GVCN hoặc Quản trị viên
  if (!isTeacherLoggedIn && role !== 'admin') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full text-center space-y-4 border-2 border-rose-200 shadow-2xl">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-black text-slate-800 text-lg">Giới Hạn Quyền Hạn</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Chỉ Giáo viên chủ nhiệm hoặc Quản trị viên mới có quyền cập nhật và nhập danh sách học sinh để bảo vệ an toàn cho dữ liệu lớp học 5B.2.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Đã Hiểu & Đóng
          </button>
        </div>
      </div>
    );
  }

  // Xử lý đọc file .xlsx, .xls, .csv thông qua thư viện SheetJS (xlsx)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setSyncStatus(null);
    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      setSheetNames(workbook.SheetNames);
      const sheetName = workbook.SheetNames[0];
      setSelectedSheet(sheetName);

      processWorksheet(workbook, sheetName);
    } catch (err) {
      console.error('Lỗi khi đọc file Excel/CSV:', err);
      alert('Không thể đọc tệp tin. Vui lòng kiểm tra định dạng .xlsx hoặc .csv.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processWorksheet = (workbook: XLSX.WorkBook, sheetName: string) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    // Chuyển sheet sang dạng mảng 2 chiều (header: 1)
    const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

    if (!rawData || rawData.length === 0) {
      setParsedRows([]);
      return;
    }

    // Tìm dòng tiêu đề (header row)
    let headerRowIdx = 0;
    let nameColIdx = -1;
    let groupColIdx = -1;
    let codeColIdx = -1;
    let pinColIdx = -1;

    for (let r = 0; r < Math.min(rawData.length, 10); r++) {
      const row = rawData[r];
      if (!Array.isArray(row)) continue;

      for (let c = 0; c < row.length; c++) {
        const cell = String(row[c] || '').toLowerCase().trim();
        if (
          cell.includes('họ và tên') ||
          cell.includes('họ tên') ||
          cell.includes('tên học sinh') ||
          cell.includes('học sinh') ||
          cell === 'tên' ||
          cell === 'name'
        ) {
          nameColIdx = c;
          headerRowIdx = r;
        }
        if (
          cell.includes('tổ') ||
          cell.includes('nhóm') ||
          cell.includes('dãy') ||
          cell === 'group'
        ) {
          groupColIdx = c;
        }
        if (
          cell.includes('mã') ||
          cell.includes('mã hs') ||
          cell.includes('mshs') ||
          cell.includes('stt')
        ) {
          codeColIdx = c;
        }
        if (cell.includes('pin') || cell.includes('mật khẩu')) {
          pinColIdx = c;
        }
      }
      if (nameColIdx !== -1) break;
    }

    // Nếu không tìm thấy cột có chữ 'họ tên', mặc định lấy cột có chuỗi chữ dài nhất
    const studentsList: ParsedStudentRow[] = [];
    const startRow = nameColIdx !== -1 ? headerRowIdx + 1 : 0;

    for (let r = startRow; r < rawData.length; r++) {
      const row = rawData[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      let name = '';
      if (nameColIdx !== -1) {
        name = String(row[nameColIdx] || '').trim();
      } else {
        // Tìm ô đầu tiên có dạng tên người (chuỗi chữ dài > 2 ký tự)
        for (let c = 0; c < row.length; c++) {
          const val = String(row[c] || '').trim();
          if (val.length >= 3 && !/^\d+$/.test(val)) {
            name = val;
            break;
          }
        }
      }

      // Bỏ qua dòng trống hoặc dòng chỉ có số
      if (!name || /^\d+$/.test(name) || name.toLowerCase().includes('tổng số')) continue;

      // Chuẩn hóa tên (bỏ số thứ tự đầu dòng nếu có ví dụ "1. Nguyễn Văn A")
      const cleanedName = name.replace(/^\d+[\.\-\s]+/, '').trim();
      if (!cleanedName) continue;

      // Xác định Tổ
      let groupStr = '';
      if (groupColIdx !== -1 && row[groupColIdx] !== undefined) {
        const gVal = String(row[groupColIdx]).trim();
        if (gVal) {
          if (/^\d+$/.test(gVal)) {
            groupStr = `Tổ ${gVal}`;
          } else if (gVal.toLowerCase().startsWith('tổ') || gVal.toLowerCase().startsWith('nhóm')) {
            groupStr = gVal;
          } else {
            groupStr = `Tổ ${gVal}`;
          }
        }
      }

      // Nếu chưa có tổ, gán xoay vòng 4 tổ
      if (!groupStr) {
        groupStr = `Tổ ${(studentsList.length % 4) + 1}`;
      }

      // Xác định Mã HS
      let codeStr = '';
      if (codeColIdx !== -1 && row[codeColIdx]) {
        codeStr = String(row[codeColIdx]).trim();
      }
      if (!codeStr || /^\d+$/.test(codeStr)) {
        codeStr = `HS5B2-${String(studentsList.length + 1).padStart(2, '0')}`;
      }

      studentsList.push({
        stt: studentsList.length + 1,
        name: cleanedName,
        group: groupStr,
        studentCode: codeStr,
        parentPin: pinColIdx !== -1 && row[pinColIdx] ? String(row[pinColIdx]).trim() : '1234',
      });
    }

    setParsedRows(studentsList);
  };

  // Xử lý dán trực tiếp danh sách (Copy-paste từ Excel hoặc Word)
  const handleParsePastedText = () => {
    if (!rawText.trim()) return;

    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const result: ParsedStudentRow[] = [];

    lines.forEach((line, idx) => {
      // Tách theo Tab (khi copy từ Excel) hoặc dấu phẩy
      const parts = line.split(/\t|,|;/).map((p) => p.trim()).filter(Boolean);
      let name = '';
      let group = '';
      let code = '';

      if (parts.length >= 2) {
        // Cột 1 có thể là STT hoặc Mã, cột 2 là Tên
        if (/^\d+$/.test(parts[0]) && parts[1]) {
          name = parts[1];
          if (parts[2]) group = parts[2];
        } else {
          name = parts[0];
          if (parts[1]) group = parts[1];
        }
      } else {
        name = line.replace(/^\d+[\.\-\s]+/, '').trim();
      }

      if (!name || name.toLowerCase().includes('họ và tên') || name.toLowerCase().includes('tên học sinh')) return;

      if (!group || /^\d+$/.test(group)) {
        group = group ? `Tổ ${group}` : `Tổ ${(idx % 4) + 1}`;
      }

      code = `HS5B2-${String(idx + 1).padStart(2, '0')}`;

      result.push({
        stt: idx + 1,
        name,
        group,
        studentCode: code,
        parentPin: '1234',
      });
    });

    setParsedRows(result);
  };

  // Xác nhận lưu vào hệ thống & Đẩy vào Supabase
  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;

    setIsProcessing(true);
    soundEffects.playClick();

    try {
      // 1. Cập nhật dữ liệu vào React Context & LocalStorage của ứng dụng
      const importResult = importRealStudents(
        parsedRows.map((r) => ({
          name: r.name,
          group: r.group,
          studentCode: r.studentCode,
          parentPin: r.parentPin,
          notes: r.notes,
        })),
        importOption
      );

      // 2. Đẩy dữ liệu vào Supabase bảng 'students'
      let supabaseSuccess = false;
      try {
        const recordsToSync = parsedRows.map((r, idx) => ({
          name: r.name,
          student_code: r.studentCode || `HS5B2-${String(idx + 1).padStart(2, '0')}`,
          class_name: 'Lớp 5B.2',
          class_group: r.group || `Tổ ${(idx % 4) + 1}`,
          coins: 20,
          stars: 5,
          parent_pin: r.parentPin || '1234',
          avatar_svg: getStudentNeutralAvatar(r.name),
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase.from('students').upsert(recordsToSync, {
          onConflict: 'student_code',
        });

        if (!error) {
          supabaseSuccess = true;
        } else {
          console.warn('Ghi chú kết nối Supabase (Bảng students có thể chưa kích hoạt schema):', error.message);
        }
      } catch (sbErr) {
        console.warn('Supabase sync bypass:', sbErr);
      }

      setSyncStatus({
        success: true,
        count: importResult.count,
        supabaseSynced: supabaseSuccess,
        message: `Đã cập nhật thành công ${importResult.count} học sinh vào hệ thống Lớp 5B.2!${
          supabaseSuccess ? ' (Đã đồng bộ lên Supabase Cloud)' : ' (Đã lưu trữ an toàn trên thiết bị)'
        }`,
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      soundEffects.playWorksheetComplete();

      setTimeout(() => {
        onClose();
      }, 2200);
    } catch (err: any) {
      console.error('Lỗi khi import học sinh:', err);
      alert('Có lỗi xảy ra trong quá trình cập nhật. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border-4 border-indigo-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              📊
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-amber-400 text-amber-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin 5B.2
                </span>
                <span className="text-blue-100 text-xs font-semibold">
                  Năm học 2026 - 2027
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-0.5">
                Import Danh Sách Học Sinh (Excel .xlsx / .csv)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs font-bold">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveMode('upload')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeMode === 'upload'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Tải File Excel (.xlsx / .csv)</span>
            </button>

            <button
              onClick={() => setActiveMode('paste')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeMode === 'paste'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardPaste className="w-4 h-4 text-purple-600" />
              <span>Dán Bảng (Copy từ Excel/Word)</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-semibold">Hiện có trong lớp:</span>
            <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-black">
              {students.length} học sinh
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Strict Rule Notice */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 flex items-start space-x-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                Quy định dữ liệu học sinh thật (Tuyệt đối không dùng dữ liệu giả):
              </p>
              <p className="text-blue-800 text-[11px] mt-0.5">
                Dữ liệu học sinh sẽ được trích xuất 100% từ tệp tin hoặc bảng danh sách bạn nhập vào. Hệ thống sẽ tự động gán hình minh họa trung tính dễ thương (hoa, lá, mây, mặt trời, ngôi sao...) và phân bổ vào 4 Tổ của Lớp 5B.2.
              </p>
            </div>
          </div>

          {/* Mode 1: Upload File */}
          {activeMode === 'upload' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                1. Chọn tệp Excel hoặc CSV từ máy tính:
              </label>

              <div className="relative border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-3xl p-6 text-center transition-all group cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-14 h-14 mx-auto bg-white rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform mb-2">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <p className="text-sm font-extrabold text-indigo-950">
                  {fileName ? `Đã nạp file: ${fileName}` : 'Bấm hoặc kéo thả file Excel (.xlsx, .csv) vào đây'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Tương thích với định dạng Excel 2007+, Google Sheets export, và CSV UTF-8
                </p>
              </div>

              {sheetNames.length > 1 && (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-bold text-slate-700">Chọn bảng (Sheet):</span>
                  <select
                    value={selectedSheet}
                    onChange={(e) => setSelectedSheet(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl bg-white font-semibold"
                  >
                    {sheetNames.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Paste List */}
          {activeMode === 'paste' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                1. Dán danh sách tên học sinh (Mỗi bạn 1 dòng hoặc copy cột từ Excel):
              </label>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="1. Nguyễn Gia Huy	Tổ 1&#10;2. Trần Gia Hân	Tổ 2&#10;3. Lê Hoàng Nam	Tổ 3..."
                rows={6}
                className="w-full p-4 border border-slate-300 rounded-2xl text-xs sm:text-sm font-mono leading-relaxed focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden bg-slate-50"
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Trích xuất danh sách</span>
                </button>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <h3 className="font-black text-slate-800 text-sm sm:text-base">
                    Xem trước kết quả: Đã nhận diện{' '}
                    <strong className="text-emerald-700 font-black">{parsedRows.length} học sinh</strong>
                  </h3>
                </div>

                {/* Import Option: Replace or Append */}
                <div className="flex items-center space-x-2 text-xs font-bold">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importOption"
                      checked={importOption === 'replace'}
                      onChange={() => setImportOption('replace')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-indigo-900">
                      Thay thế danh sách lớp (Khuyên dùng cho 42 học sinh)
                    </span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer ml-3">
                    <input
                      type="radio"
                      name="importOption"
                      checked={importOption === 'append'}
                      onChange={() => setImportOption('append')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-600">Thêm tiếp vào danh sách</span>
                  </label>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">STT</th>
                      <th className="py-2.5 px-3">Họ và Tên Học Sinh</th>
                      <th className="py-2.5 px-3">Phân Tổ</th>
                      <th className="py-2.5 px-3">Mã Học Sinh</th>
                      <th className="py-2.5 px-3">Mã PIN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {parsedRows.map((st, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/50">
                        <td className="py-2 px-3 text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 text-slate-900 font-bold">
                          {st.name}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              st.group?.includes('1')
                                ? 'bg-blue-100 text-blue-800'
                                : st.group?.includes('2')
                                ? 'bg-purple-100 text-purple-800'
                                : st.group?.includes('3')
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {st.group || 'Tổ 1'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500">
                          {st.studentCode}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500">
                          {st.parentPin || '1234'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sync Status Banner */}
          {syncStatus && (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold flex items-center space-x-3 ${
                syncStatus.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-black">{syncStatus.message}</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  ✓ Sơ đồ lớp học (Seating Chart) và Sĩ số lớp đã được đồng bộ tự động!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-slate-500 font-semibold flex items-center space-x-1.5">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Lưu trữ dữ liệu: Cục bộ & Trực tuyến an toàn</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={parsedRows.length === 0 || isProcessing}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý & đẩy dữ liệu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>
                    Xác Nhận Import {parsedRows.length > 0 ? `(${parsedRows.length} Học Sinh)` : ''}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminStudentExcelImportModal;
