/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router ဖြစ်နေရင် Server Action တို API Route တွေအတွက် Body size limit ကို ဒီလို သတ်မှတ်နိုင်ပါတယ်
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

module.exports = nextConfig;
