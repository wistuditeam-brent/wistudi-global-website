export async function onRequestGet({ request }) {
  const cfCountry = request.cf && request.cf.country ? request.cf.country : "";
  const headerCountry = request.headers.get("CF-IPCountry") || "";
  const country = String(cfCountry || headerCountry || "").trim().toUpperCase();
  return new Response(JSON.stringify({
    country,
    offer_language_selector: country === "VN"
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store"
    }
  });
}
