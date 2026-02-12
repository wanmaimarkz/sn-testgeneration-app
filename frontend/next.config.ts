import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // สั่งให้ Build ออกมาเป็นไฟล์ Static HTML
  // images: {
  //   unoptimized: true, // จำเป็นสำหรับการทำ Static Export
  // },
  trailingSlash: true, // ช่วยให้ระบบ Routing ของ Electron ทำงานได้ถูกต้อง

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV == "development"
          ? "http://127.0.0.1:8000/api/:path*"
          : "/api/"
      },
    ];
  },
};

export default nextConfig;