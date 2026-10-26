import React from 'react';
import { AdminStudentExcelImportModal } from './admin/AdminStudentExcelImportModal';

interface StudentListImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentListImportModal: React.FC<StudentListImportModalProps> = (props) => {
  return <AdminStudentExcelImportModal {...props} />;
};

export default StudentListImportModal;
