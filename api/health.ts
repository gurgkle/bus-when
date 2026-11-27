export interface ServerlessRequest {
  method?: string;
  query: Record<string, unknown>;
}

export interface ServerlessResponse {
  status(code: number): ServerlessResponse;
  json(body: unknown): unknown;
  setHeader(name: string, value: string): unknown;
}

export default function handler(
  req: ServerlessRequest,
  res: ServerlessResponse
): void {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(200).json({
    ok: true,
    service: 'buswatch-sg-api',
    ltaEndpointVersion: 'v3',
    ltaKeyConfigured: Boolean(process.env.LTA_ACCOUNT_KEY?.trim()),
    timestamp: new Date().toISOString(),
  });
}
