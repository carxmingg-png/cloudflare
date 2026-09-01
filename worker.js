export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy all backend API calls to the Node.js / Express backend server
    if (url.pathname.startsWith("/api/")) {
      const backendBase = env.BACKEND_URL || "https://myanmar-carx-street.onrender.com";
      const targetUrl = new URL(url.pathname + url.search, backendBase);

      const headers = new Headers(request.headers);
      headers.set("Host", new URL(backendBase).host);
      headers.set("X-Forwarded-Host", url.host);
      headers.set("X-Forwarded-Proto", url.protocol.replace(":", ""));

      const requestInit = {
        method: request.method,
        headers: headers,
        redirect: "follow",
      };

      if (request.method !== "GET" && request.method !== "HEAD") {
        requestInit.body = request.body;
      }

      try {
        const response = await fetch(targetUrl.toString(), requestInit);
        return response;
      } catch (err) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Backend server is currently offline or unreachable. Please check your backend URL configuration.",
            error: err.message,
          }),
          {
            status: 502,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Serve frontend static assets (React Single Page Application)
    return env.ASSETS.fetch(request);
  },
};
