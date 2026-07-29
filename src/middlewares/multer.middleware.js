// this file configures multer for handling file uploads, it receives uploaded files from the client and temporarily stores them on our local server before they are processed (for eg -> uploaded to cloudinary)
// multer is a middleware for express used to handle file uploads, when a user uploads an image or video, multer extracts the file from the incoming request and stores it either in memory or on the local disk
// in our project, we temporarily store the file on the local server before uploading it to cloudinary
import multer from 'multer';

// configure where and how uploaded files should be stored
const storage = multer.diskStorage({
    // specify the folder where uploaded files will be saved
    destination: function (req, file, cb) {
        cb(null, './public/temp');
    },
    // specify the name of the uploaded file
    filename: function (req, file, cb) {
        cb(null, file.originalname); // keep the original file name
    },
});

// create and export the multer middleware using the storage configuration, this middleware will be used in routes to handle file uploads
export const upload = multer({ storage });