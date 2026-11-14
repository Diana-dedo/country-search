export interface RawCountryResponse {
    name: { common: string; official?: string } | string;
    flags?: { svg?: string; png?: string };
    capital?: string[] | string;
    region?: string;
    population?: number;
    languages?: Record<string, string> | Array<{ name: string }>;
    currencies?:
        | Record<string, { name: string; symbol?: string }>
        | Array<{ name: string; symbol?: string }>;
    borders?: string[];
    area?: number;
}
export interface Country {
    name: string;
    flag: string;
    capital: string;
    region: string;
    population: number;
    languages: string[];
    currencies: string[];
    borders: string[];
    area: number;
}
