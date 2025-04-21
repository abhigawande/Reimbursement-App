// const upload = require('../config/multerConfig');

// const uploadSingleFile = (req, res, next) => {
//     upload.single('bill_docs')(req, res, (err) => {
//         if (err) return res.status(400).json({ error: err.message });
//         next();
//     });
// };

// module.exports = { uploadSingleFile };

const upload = require('../config/multerConfig');

const uploadMultipleFiles = (req, res, next) => {
    upload.any('bill_docs', 10)(req, res, (err) => {  // Accept up to 10 files
        if (err) return res.status(400).json({ error: err.message });
        console.log('Uploaded File:', req.files);
        next();
    });
};

module.exports = { uploadMultipleFiles };
