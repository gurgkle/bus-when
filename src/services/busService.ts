import { SERVICE_METADATA, SINGAPORE_BUS_STOPS } from '../data/singaporeStops';
import {
  BusFeature,
  BusLoad,
  BusOperator,
  BusServiceArrival,
  BusStopArrivalResponse,
  BusStopInfo,
  BusType,
  NextBusEstimate,
} from '../types/bus';

const OPERATORS: BusOperator[] = ['SBST', 'SMRT', 'TTS', 'GAS'];
const LOADS: BusLoad[] = ['SEA', 'SEA', 'SDA', 'SEA', 'LSD', 'SDA'];
const TYPES: BusType[] = ['DD', 'SD', 'DD', 'BD', 'SD'];

export interface ApiHealthStatus {
  ok: boolean;
  service: string;
  ltaEndpointVersion: string;
  ltaKeyConfigured: boolean;
  timestamp: string;
}

function deterministicHash(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getOperatorAndRoute(serviceNo: string): {
  operator: BusOperator;
  routeLabel: string;
} {
  const known = SERVICE_METADATA[serviceNo];
  if (known) {
    return known;
  }
  const h = deterministicHash(serviceNo);
  return {
    operator: OPERATORS[h % OPERATORS.length],
    routeLabel: `Service ${serviceNo}`,
  };
}

function createEstimate(
  stopCode: string,
  serviceNo: string,
  slotIndex: number,
  minutesFromEpochBase: number,
  nowMs: number
): NextBusEstimate {
  const h = deterministicHash(`${stopCode}:${serviceNo}:${slotIndex}`);
  const etaMs = nowMs + minutesFromEpochBase * 60_000;
  const load = LOADS[(h + slotIndex) % LOADS.length];
  const type = TYPES[(h + slotIndex * 2) % TYPES.length];
  const feature: BusFeature = h % 11 === 0 && slotIndex === 2 ? '' : 'WAB';

  return {
    OriginCode: stopCode,
    DestinationCode: `${((h % 8) + 1) * 10000 + (h % 99)}`,
    EstimatedArrival: new Date(etaMs).toISOString(),
    Latitude: '1.3048',
    Longitude: '103.8318',
    VisitNumber: '1',
    Load: load,
    Feature: feature,
    Type: type,
  };
}

function sortServicesNumerically(services: BusServiceArrival[]): BusServiceArrival[] {
  return [...services].sort((a, b) => {
    const numA = parseInt(a.ServiceNo, 10);
    const numB = parseInt(b.ServiceNo, 10);
    if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) {
      return numA - numB;
    }
    return a.ServiceNo.localeCompare(b.ServiceNo);
  });
}

function normalizeEstimate(est: NextBusEstimate | null | undefined): NextBusEstimate | null {
  if (!est || !est.EstimatedArrival) {
    return null;
  }
  return {
    ...est,
    Load: est.Load || 'SEA',
    Type: est.Type || 'SD',
    Feature: est.Feature || '',
  };
}

function normalizeLtaServices(rawServices: Array<Partial<BusServiceArrival>>): BusServiceArrival[] {
  const mapped: BusServiceArrival[] = rawServices
    .filter((svc): svc is Partial<BusServiceArrival> & { ServiceNo: string; NextBus: NextBusEstimate } =>
      Boolean(svc?.ServiceNo && svc?.NextBus)
    )
    .map((svc) => {
      const meta = SERVICE_METADATA[svc.ServiceNo];
      return {
        ServiceNo: svc.ServiceNo,
        Operator: svc.Operator ?? meta?.operator ?? 'SBST',
        routeLabel: meta?.routeLabel ?? `Service ${svc.ServiceNo}`,
        NextBus: {
          ...svc.NextBus,
          Load: svc.NextBus.Load || 'SEA',
          Type: svc.NextBus.Type || 'SD',
          Feature: svc.NextBus.Feature || '',
        },
        NextBus2: normalizeEstimate(svc.NextBus2),
        NextBus3: normalizeEstimate(svc.NextBus3),
      };
    });

  return sortServicesNumerically(mapped);
}

/**
 * Search Singapore bus stops by 5-digit code, road name, stop description, district, or service number.
 */
export function searchBusStops(query: string): BusStopInfo[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return SINGAPORE_BUS_STOPS;
  }

  return SINGAPORE_BUS_STOPS.filter((stop) => {
    if (stop.BusStopCode.includes(normalized)) return true;
    if (stop.Description.toLowerCase().includes(normalized)) return true;
    if (stop.RoadName.toLowerCase().includes(normalized)) return true;
    if (stop.District.toLowerCase().includes(normalized)) return true;
    if (stop.Services.some((svc) => svc.toLowerCase() === normalized)) return true;
    return false;
  });
}

export function getBusStopByCode(busStopCode: string): BusStopInfo | undefined {
  return SINGAPORE_BUS_STOPS.find((s) => s.BusStopCode === busStopCode.trim());
}

export async function fetchApiHealth(): Promise<ApiHealthStatus> {
  const response = await fetch('/api/health', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }
  return (await response.json()) as ApiHealthStatus;
}

function buildPreviewArrivals(
  cleanCode: string,
  serviceNoFilter?: string
): BusStopArrivalResponse {
  const stop = getBusStopByCode(cleanCode);
  if (!stop) {
    throw new Error(
      `Bus stop code "${cleanCode}" is not in the local directory. Configure LTA_ACCOUNT_KEY on the server to query any Singapore bus stop live.`
    );
  }

  const nowMs = Date.now();
  const minuteInCycle = Math.floor(nowMs / 60_000) % 12;

  const targetServices = serviceNoFilter
    ? stop.Services.filter((s) => s.toLowerCase() === serviceNoFilter.toLowerCase())
    : stop.Services;

  const services: BusServiceArrival[] = targetServices.map((serviceNo) => {
    const h = deterministicHash(`${cleanCode}:${serviceNo}`);
    const baseHeadway = 4 + (h % 7);
    const phaseOffset = h % baseHeadway;
    const firstBusMinutes =
      (phaseOffset - (minuteInCycle % baseHeadway) + baseHeadway) % baseHeadway;
    const adjustedFirst = firstBusMinutes === 0 ? 0.5 : firstBusMinutes;
    const secondBusMinutes = adjustedFirst + baseHeadway;
    const thirdBusMinutes = secondBusMinutes + baseHeadway + (h % 3);

    const { operator, routeLabel } = getOperatorAndRoute(serviceNo);

    return {
      ServiceNo: serviceNo,
      Operator: operator,
      routeLabel,
      NextBus: createEstimate(cleanCode, serviceNo, 0, adjustedFirst, nowMs),
      NextBus2: createEstimate(cleanCode, serviceNo, 1, secondBusMinutes, nowMs),
      NextBus3: createEstimate(cleanCode, serviceNo, 2, thirdBusMinutes, nowMs),
    };
  });

  return {
    BusStopCode: cleanCode,
    Services: sortServicesNumerically(services),
    fetchedAt: new Date(nowMs).toISOString(),
    isSimulated: true,
  };
}

/**
 * Fetches live arrival times via /api/busarrival (LTA DataMall v3 serverless proxy).
 * Falls back to curated preview timings only when LTA_ACCOUNT_KEY is not yet configured.
 */
export async function fetchBusArrivals(
  busStopCode: string,
  serviceNo?: string
): Promise<BusStopArrivalResponse> {
  const cleanCode = busStopCode.trim();
  const cleanService = serviceNo?.trim();

  const params = new URLSearchParams({ BusStopCode: cleanCode });
  if (cleanService) {
    params.set('ServiceNo', cleanService);
  }

  try {
    const response = await fetch(`/api/busarrival?${params.toString()}`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const data = (await response.json()) as {
        BusStopCode?: string;
        Services?: Array<Partial<BusServiceArrival>>;
        fetchedAt?: string;
      };

      return {
        BusStopCode: data.BusStopCode ?? cleanCode,
        Services: normalizeLtaServices(data.Services ?? []),
        fetchedAt: data.fetchedAt ?? new Date().toISOString(),
        isSimulated: false,
      };
    }

    const errBody = (await response.json().catch(() => ({}))) as {
      error?: string;
      code?: string;
    };

    if (response.status === 503 && errBody.code === 'MISSING_API_KEY') {
      return buildPreviewArrivals(cleanCode, cleanService);
    }

    throw new Error(
      errBody.error || `Unable to fetch bus arrivals (HTTP ${response.status}).`
    );
  } catch (err) {
    // If the serverless endpoint itself is unreachable (e.g. static bundle), fallback for curated stops
    if (err instanceof TypeError) {
      return buildPreviewArrivals(cleanCode, cleanService);
    }
    throw err;
  }
}

export function formatArrivalMinutes(
  isoTimestamp: string,
  nowMs: number = Date.now()
): { label: string; minutes: number; isArriving: boolean } {
  if (!isoTimestamp) {
    return { label: 'No est.', minutes: Number.POSITIVE_INFINITY, isArriving: false };
  }
  const targetMs = new Date(isoTimestamp).getTime();
  if (Number.isNaN(targetMs)) {
    return { label: 'No est.', minutes: Number.POSITIVE_INFINITY, isArriving: false };
  }
  const diffMin = Math.floor((targetMs - nowMs) / 60_000);
  if (diffMin <= 0) {
    return { label: 'Arr', minutes: 0, isArriving: true };
  }
  return { label: `${diffMin} min`, minutes: diffMin, isArriving: false };
}

export function formatClockTime(isoTimestamp: string): string {
  if (!isoTimestamp) return '--:--';
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function getLoadMeta(load: BusLoad): {
  label: string;
  bars: 1 | 2 | 3;
  textClass: string;
  barClass: string;
} {
  switch (load) {
    case 'SEA':
      return {
        label: 'Seats',
        bars: 1,
        textClass: 'text-emerald-700',
        barClass: 'bg-emerald-600',
      };
    case 'SDA':
      return {
        label: 'Standing',
        bars: 2,
        textClass: 'text-amber-700',
        barClass: 'bg-amber-600',
      };
    case 'LSD':
      return {
        label: 'Limited',
        bars: 3,
        textClass: 'text-red-700',
        barClass: 'bg-red-600',
      };
  }
}

export function getBusTypeLabel(type: BusType): string {
  switch (type) {
    case 'DD':
      return 'Double Deck';
    case 'BD':
      return 'Bendy';
    case 'SD':
      return 'Single Deck';
  }
}

export function getOperatorFullName(operator: BusOperator): string {
  switch (operator) {
    case 'SBST':
      return 'SBS Transit';
    case 'SMRT':
      return 'SMRT Buses';
    case 'TTS':
      return 'Tower Transit';
    case 'GAS':
      return 'Go-Ahead SG';
  }
}
