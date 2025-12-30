import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb', // Zwiększamy limit z 1MB na 10MB
        },
    },
};

export default nextConfig;
