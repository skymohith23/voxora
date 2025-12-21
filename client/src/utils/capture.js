// capture helpers: capture video frame to dataURL or base64-only
export function captureFrameToDataURL(videoEl, scale = 1.0) {
    const w = videoEl.videoWidth || 640;
    const h = videoEl.videoHeight || 480;
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(w * scale);
    canvas.height = Math.floor(h * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8); // data:image/jpeg;base64,...
  }
  
  export function dataURLtoBase64(dataURL) {
    // return raw base64 without prefix if needed: but backend accepts either
    return dataURL.split(",")[1];
  }
  