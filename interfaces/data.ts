import { TripResolution } from "./tripResolution";

export interface GatheredData {
    outboundFlights: unknown;
    returnFlights: unknown;
    hotels: unknown;
    weather: unknown;
    content: unknown;
    maps: unknown;
    resolution: TripResolution;
}