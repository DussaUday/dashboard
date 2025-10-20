export const uploadToCloudinary = async (file, onProgress = null) => {
  try {
    // 1️⃣ Get signature from backend
    const res = await fetch("http://localhost:5000/api/cloudinary/get-signature");
    const { timestamp, signature, cloudName, uploadPreset, apiKey, folder } = await res.json();

    // 2️⃣ Build FormData
    const formData = new FormData();
    formData.append("folder", folder); // must match backend signature
    formData.append("upload_preset", uploadPreset);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("api_key", apiKey);
    formData.append("file", file);

    // 3️⃣ Send to Cloudinary
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded * 100) / e.total);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          console.error("Cloudinary response:", xhr.responseText);
          reject(new Error("Upload failed"));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Upload failed")));

      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
      xhr.send(formData);
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
