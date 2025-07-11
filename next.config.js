/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**", 
      },
    ],
  },
};

module.exports = nextConfig;


// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "firebasestorage.googleapis.com",
//         pathname: "/**", // Allow all paths under Firebase Storage
//       },
//     ],
//   },
//   compiler: {
//     styledComponents: true, // Enable turbo compiler for styled-components
//   },
//   experimental: {
//     optimizeCss: true, // Reduce CSS processing time
//   },
// };

// module.exports = nextConfig;
