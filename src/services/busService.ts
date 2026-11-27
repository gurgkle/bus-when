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
    routeLabel: `Service ${serviceNo} Trunk Route`,
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

/**
 * Fetches live arrival times for a 5-digit Singapore bus stop code.
 *
 * API INTEGRATION NOTE:
 * Replace the body of this function with a call to your backend proxy for LTA DataMall:
 *   const res = await fetch(`/api/bus-arrival?BusStopCode=${encodeURIComponent(busStopCode)}`);
 *   if (!res.ok) throw new Error('Unable to fetch bus arrivals');
 *   return res.json();
 */
export async function fetchBusArrivals(
  busStopCode: string
): Promise<BusStopArrivalResponse> {
  const cleanCode = busStopCode.trim();
  const stop = getBusStopByCode(cleanCode);

  // Brief realistic async latency so skeleton/refresh states feel crisp and responsive
  await new Promise((resolve) => setTimeout(resolve, 220));

  if (!stop) {
    throw new Error(`Bus stop code "${cleanCode}" was not found in the local directory.`);
  }

  const nowMs = Date.now();
  // Cycle every 6 minutes smoothly so simulated buses actually advance and roll over
  const minuteInCycle = Math.floor(nowMs / 60_000) % 12;

  const services: BusServiceArrival[] = stop.Services.map((serviceNo) => {
    const h = deterministicHash(`${cleanCode}:${serviceNo}`);
    const baseHeadway = 4 + (h % 7); // 4 to 10 min cadence
    const phaseOffset = h % baseHeadway;
    const firstBusMinutes = ((phaseOffset - (minuteInCycle % baseHeadway) + baseHeadway) % baseHeadway);
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

  // Sort numerically (e.g., 2, 7, 14, 36, 174) like official LTA displays
  services.sort((a, b) => {
    const numA = parseInt(a.ServiceNo, 10);
    const numB = parseInt(b.ServiceNo, 10);
    if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) {
      return numA - numB;
    }
    return a.ServiceNo.localeCompare(b.ServiceNo);
  });

  return {
    BusStopCode: cleanCode,
    Services: services,
    fetchedAt: new Date(nowMs).toISOString(),
    isSimulated: true,
  };
}

export function formatArrivalMinutes(
  isoTimestamp: string,
  nowMs: number = Date.now()
): { label: string; minutes: number; isArriving: boolean } {
  const targetMs = new Date(isoTimestamp).getTime();
  const diffMin = Math.floor((targetMs - nowMs) / 60_000);
  if (diffMin <= 0) {
    return { label: 'Arr', minutes: 0, isArriving: true };
  }
  return { label: `${diffMin} min`, minutes: diffMin, isArriving: false };
}

export function formatClockTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
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
