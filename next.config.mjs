/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The app moved under /app (change C32). Old addresses, from bookmarks or
  // links in chats, still land on the same screen.
  async redirects() {
    const moved = ["log", "play", "games", "history", "profile", "teams", "admin"];
    return [
      ...moved.flatMap((part) => [
        { source: `/${part}`, destination: `/app/${part}`, permanent: true },
        { source: `/${part}/:path*`, destination: `/app/${part}/:path*`, permanent: true },
      ]),
      { source: "/welcome", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
