// Country only: never return or store the visitor's IP address.
export function onRequestGet({ request }) {
 const country = request.cf?.country === 'IT' ? 'IT' : null;
 return Response.json({ country }, { headers: { 'Cache-Control':'private, no-store', 'Vary':'Cookie', 'X-Content-Type-Options':'nosniff' } });
}
