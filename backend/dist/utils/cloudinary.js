"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = uploadImage;
exports.deleteImage = deleteImage;
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
async function uploadImage(fileBuffer, folder) {
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader
            .upload_stream({ folder: `sawab/${folder}` }, (error, result) => {
            if (error || !result)
                return reject(error);
            resolve(result.secure_url);
        })
            .end(fileBuffer);
    });
}
async function deleteImage(publicId) {
    await cloudinary_1.v2.uploader.destroy(publicId);
}
exports.default = cloudinary_1.v2;
//# sourceMappingURL=cloudinary.js.map