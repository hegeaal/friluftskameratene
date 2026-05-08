export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(
    "https://ut-backend-api-2-41145913385.europe-north1.run.app/internal/graphql",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://ut.no",
      },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  return Response.json(data);
}
