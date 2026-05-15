import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from './UI';
import countriesData from '../constants/countries.json';

// Types derived from the JSON structure
export interface Country {
    country: string;
    code: string;
    iso: string;
}

interface CountrySelectProps {
    value?: string; // Expects ISO code or Country Name? User said "Country Dropdown". Usually saving Name or ISO. Let's support ISO as value, but emit full object or value.
    // Based on ContactDetails, location is a string. Phone is a string.
    // For Location: value = "Nigeria" (Name)
    // For Phone: value = "234" (Code)
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

interface CountryCodeSelectProps {
    value?: string; // Expects phone code e.g. "1" or "234"
    onChange: (value: string) => void;
    className?: string;
}

// ----------------------------------------------------------------------------
// Simple Virtualized-like Searchable Dropdown
// ----------------------------------------------------------------------------

export function CountrySelect({ value, onChange, className, placeholder = "Select country..." }: CountrySelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    // Derived filtering
    const filteredCountries = useMemo(() => {
        if (!search) return countriesData;
        const lowerSearch = search.toLowerCase();
        return countriesData.filter(c =>
            c.country.toLowerCase().includes(lowerSearch) ||
            c.iso.toLowerCase().includes(lowerSearch)
        );
    }, [search]);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedCountry = countriesData.find(c => c.country === value);

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <span className="truncate flex items-center gap-2">
                    {selectedCountry ? (
                        <>
                            <span className="text-lg leading-none">{getFlagEmoji(selectedCountry.iso)}</span>
                            {selectedCountry.country}
                        </>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 max-h-[300px] w-full min-w-[200px] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2">
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Search country..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="max-h-[250px] overflow-y-auto p-1">
                        {filteredCountries.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">No country found.</div>
                        ) : (
                            filteredCountries.map((country) => (
                                <div
                                    key={country.iso}
                                    onClick={() => {
                                        onChange(country.country);
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                    className={cn(
                                        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                        value === country.country && "bg-accent text-accent-foreground"
                                    )}
                                >
                                    <span className="mr-2 text-lg leading-none">{getFlagEmoji(country.iso)}</span>
                                    <span className="flex-1 truncate">{country.country}</span>
                                    {value === country.country && (
                                        <Check className="ml-auto h-4 w-4" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function CountryCodeSelect({ value, onChange, className }: CountryCodeSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredCountries = useMemo(() => {
        if (!search) return countriesData;
        const lowerSearch = search.toLowerCase();
        return countriesData.filter(c =>
            c.country.toLowerCase().includes(lowerSearch) ||
            c.code.includes(lowerSearch) ||
            c.iso.toLowerCase().includes(lowerSearch)
        );
    }, [search]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Clean value to match code (sometimes codes have "1-234", basic match)
    // Assuming value is just the code like "1" or "234"
    const selectedCountry = countriesData.find(c => c.code === value) || (value ? { iso: 'UNK', code: value, country: 'Unknown' } : null);
    // Note: Finding by code is tricky because multiple countries share codes (e.g. +1).
    // Ideally we select by ISO but store Code.
    // If we only have code, we pick the first match.

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            >
                {selectedCountry ? (
                    <span className="text-sm font-medium flex items-center gap-1">
                        <span className="text-muted-foreground mr-1 text-xs text-xl leading-none">{getFlagEmoji(selectedCountry.iso)}</span>
                        +{selectedCountry.code}
                    </span>
                ) : (
                    <span className="text-xs font-medium text-muted-foreground">{value ? `+${value}` : '+'}</span>
                )}
            </button>

            {open && (
                <div className="absolute z-50 mt-1 max-h-[300px] w-[280px] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 left-0">
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Search country or code..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="max-h-[250px] overflow-y-auto p-1">
                        {filteredCountries.map((country) => (
                            <div
                                key={country.iso}
                                onClick={() => {
                                    onChange(country.code); // Returns Just the code e.g. "1" or "44"
                                    setOpen(false);
                                    setSearch("");
                                }}
                                className={cn(
                                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                    value === country.code && "bg-accent text-accent-foreground"
                                )}
                            >
                                <span className="mr-3 text-xl leading-none w-6 text-center">{getFlagEmoji(country.iso)}</span>
                                <span className="flex-1 truncate">{country.country}</span>
                                <span className="ml-auto text-xs text-muted-foreground font-mono">+{country.code}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Utility to convert ISO code to Emoji Flag
function getFlagEmoji(countryCode: string) {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
