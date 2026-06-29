import { v2 as cloudinary } from 'cloudinary';
export declare function uploadImage(fileBuffer: Buffer, folder: string): Promise<string>;
export declare function deleteImage(publicId: string): Promise<void>;
export default cloudinary;
//# sourceMappingURL=cloudinary.d.ts.map