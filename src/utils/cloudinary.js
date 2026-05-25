export const uploadToCloudinary = async (file) => {
  const cloudName = 'dpixwxfmx';
  const apiKey = '699389634167772';
  const apiSecret = 'rITHg25t7anx_Z0K3d_SZXr8SGE';

  // We generate the signature on the client.
  // Note: For production with high security, usually this is done via a backend endpoint or using unsigned presets.
  const timestamp = Math.floor(Date.now() / 1000);
  const stringToSign = `timestamp=${timestamp}${apiSecret}`;
  
  // Compute SHA-1 hash for the signature
  const msgBuffer = new TextEncoder().encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Cloudinary upload failed');
  }
  return data.secure_url;
};
