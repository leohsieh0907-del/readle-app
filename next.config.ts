import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 已移除的診斷頁 → 導回首頁，避免舊書籤/歷史記錄一直 404
      { source: "/speech-test", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
