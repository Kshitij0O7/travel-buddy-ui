export interface TripResolution {
    originIATA: string;
    gatewayIATA: string;
    primaryCity: string;
    keyCities: string[];
    destinationLabel: string;
    currency: string;
    currencySymbol: string;
    isMultiCity: boolean;
}