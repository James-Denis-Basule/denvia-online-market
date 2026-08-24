import multer from 'multer';

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const fileFilter: multer.Options['fileFilter'] = (
  _req,
  file,
  cb,
) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(
    new Error(
      'Only JPEG, PNG, WebP, and GIF images are allowed',
    ),
  );
};

export const uploadProductImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});