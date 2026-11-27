const LTA_BUS_ARRIVAL_V3_URL =
  'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival';

const BUS_STOP_CODE_REGEX = /^\d{5}$/;
const SERVICE_NO_REGEX = /^[A-Za-z0-9]{1,5}$/;

export interface ServerlessRequest {
  method?: string;
  query: Record<string, unknown>;
}

export interface ServerlessResponse {
  status(code: number): ServerlessResponse;
  json(body: unknown): unknown;
  setHeader(name: string, value: string): unknown;
}

function readSingleQueryParam(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0].trim();
  }
  return '';
}

export default async function handler(
  req: ServerlessRequest,
  res: ServerlessResponse
): Promise<void> {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.setHeader('Cache-Control', 'no-store, max-age=0');

  const busStopCode = readSingleQueryParam(req.query?.BusStopCode);
  const serviceNo = readSingleQueryParam(req.query?.ServiceNo);

  if (!BUS_STOP_CODE_REGEX.test(busStopCode)) {
    res.status(400).json({
      error: 'Invalid or missing BusStopCode. Expected a 5-digit Singapore bus stop code.',
      code: 'INVALID_BUS_STOP_CODE',
    });
    return;
  }

  if (serviceNo && !SERVICE_NO_REGEX.test(serviceNo)) {
    res.status(400).json({
      error: 'Invalid ServiceNo format.',
      code: 'INVALID_SERVICE_NO',
    });
    return;
  }

  const accountKey = process.env.LTA_ACCOUNT_KEY?.trim();
  if (!accountKey) {
    res.status(503).json({
      error: 'Server LTA_ACCOUNT_KEY is not configured yet.',
      code: 'MISSING_API_KEY',
    });
    return;
  }

  const upstreamUrl = new URL(LTA_BUS_ARRIVAL_V3_URL);
  upstreamUrl.searchParams.set('BusStopCode', busStopCode);
  if (serviceNo) {
    upstreamUrl.searchParams.set('ServiceNo', serviceNo);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!upstreamResponse.ok) {
      const status = upstreamResponse.status >= 500 ? 502 : upstreamResponse.status;
      res.status(status).json({
        error: `LTA DataMall returned status ${upstreamResponse.status}.`,
        code: 'UPSTREAM_ERROR',
      });
      return;
    }

    const payload = (await upstreamResponse.json()) as {
      BusStopCode?: string;
      Services?: unknown[];
    };

    res.status(200).json({
      BusStopCode: payload.BusStopCode ?? busStopCode,
      Services: Array.isArray(payload.Services) ? payload.Services : [],
      fetchedAt: new Date().toISOString(),
      source: 'lta-datamall-v3',
    });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    res.status(isAbort ? 504 : 502).json({
      error: isAbort
        ? 'LTA DataMall request timed out.'
        : 'Unable to reach LTA DataMall upstream service.',
      code: isAbort ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNREACHABLE',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
