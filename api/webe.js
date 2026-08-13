const ALLOWED_METHODS = new Set(["GET", "POST"]);

module.exports = async function handler(req, res) {
  if (!ALLOWED_METHODS.has(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { WEBE_EMAIL, WEBE_API_KEY, WEBE_API_URL } = process.env;
  if (!WEBE_EMAIL || !WEBE_API_KEY || !WEBE_API_URL) {
    return res.status(500).json({ error: "Webe API is not configured" });
  }

  let upstream;
  try {
    upstream = new URL(WEBE_API_URL);
  } catch {
    return res.status(500).json({ error: "Invalid WEBE_API_URL" });
  }

  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const headers = {
    Accept: "application/json",
    Authorization: `Basic ${Buffer.from(`${WEBE_EMAIL}:${WEBE_API_KEY}`).toString("base64")}`,
  };

  let body;
  if (req.method === "POST") {
    headers["Content-Type"] = "application/json";
    body = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
  }

  try {
    const response = await fetch(`${upstream.toString()}${query}`, {
      method: req.method,
      headers,
      body,
    });
    const text = await response.text();
    res.status(response.status);
    res.setHeader("Content-Type", response.headers.get("content-type") || "application/json");
    return res.send(text);
  } catch {
    return res.status(502).json({ error: "Webe API request failed" });
  }
}
