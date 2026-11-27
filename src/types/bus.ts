export type BusOperator = 'SBST' | 'SMRT' | 'TTS' | 'GAS';

export type BusLoad = 'SEA' | 'SDA' | 'LSD';

export type BusFeature = 'WAB' | '';

export type BusType = 'SD' | 'DD' | 'BD';

export interface NextBusEstimate {
  OriginCode: string;
  DestinationCode: string;
  EstimatedArrival: string;
  Latitude: string;
  Longitude: string;
  VisitNumber: string;
  Load: BusLoad;
  Feature: BusFeature;
  Type: BusType;
}

export interface BusServiceArrival {
  ServiceNo: string;
  Operator: BusOperator;
  NextBus: NextBusEstimate;
  NextBus2: NextBusEstimate | null;
  NextBus3: NextBusEstimate | null;
  routeLabel: string;
}

export interface BusStopArrivalResponse {
  BusStopCode: string;
  Services: BusServiceArrival[];
  fetchedAt: string;
  isSimulated: boolean;
}

export interface BusStopInfo {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  District: string;
  Services: string[];
}

export interface FavoriteStop {
  BusStopCode: string;
  Description: string;
  RoadName: string;
  District: string;
  alias?: string;
  pinnedAt: number;
}
