import multer from 'multer';
import { ValidationError } from './errors';

const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

export const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (EXCEL_MIME_TYPES.includes(file.mimetype) || /\.(xlsx|xls)$/i.test(file.originalname)) {
      callback(null, true);
    } else {
      callback(new ValidationError('El archivo debe ser un Excel (.xlsx o .xls)'));
    }
  },
});
