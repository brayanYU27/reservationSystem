export const getGoogleMapsUrl = (
    address: string,
    city: string,
    lat?: number | null,
    lng?: number | null
): string => {
    if (lat && lng) {
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
    const query = encodeURIComponent(`${address}, ${city}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
};
