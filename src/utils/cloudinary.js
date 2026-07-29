// this file contains utility functions for uploading files to cloudinary, it uploads images/ videos from our local server to cloudinary and returns the uploaded file's information (such as its url)
// cloudinary is a cloud-based media storage service used to upload, store and manage images, videos and other files, instead of storing uploaded files on our own server, we upload them to cloudinary, cloudinary safely stores the files and returns a url
// we then save that url in our mongodb database instead of saving the actual file, making our application faster and reducing server storage

import { v2 as cloudinary } from 'cloudinary';  // import the cloudinary sdk, used to upload images and videos to cloudinary cloud storage
import fs from 'fs';    // node's built-in file system module, used to delete temporary files stored on our local server

// configure cloudinary using credentials stored in environment variables, this connects our backend application to our cloudinary account
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// uploads a local file to cloudinary
// localFilePath -> path of the file stored temporarily on our server
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;    // if no file path is provided, nothing can be uploaded
        
        // upload the file to cloudinary
        // resource_type: 'auto' automatically detects whether the file is an image, video or another supported file type
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });
        console.log('File is upload on cloudinary', response.url);
        return response;    // return the complete response object received from cloudinary
    } catch (error) {
        fs.unlinkSync(localFilePath);   // if upload fails delete the temporary file, so unnecessary files don't remain on our server
        return null;
    }
};
