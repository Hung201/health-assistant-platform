# Patient Doctor Location Guide

## Goal

Improve doctor discovery for patient flows by adding:

- Province/District filtering in patient doctor list
- "Near you" priority mode (based on patient profile location)
- Full clinic address display in patient doctor detail
- Quick "Open in Google Maps" link

## Implemented UI

### 0) Patient profile address (cascading dropdown)

File: `frontend/src/app/(patient)/patient/profile/page.tsx`

- Replaced free-text location code inputs with searchable `react-select` dropdowns:
  - Province
  - District (depends on selected province)
  - Ward (depends on selected district)
- Keeps stored values as administrative `code` strings to match backend fields:
  - `provinceCode`
  - `districtCode`
  - `wardCode`
- Added guard before save:
  - prevents invalid hierarchy (district without province, ward without district)

### 1) Patient doctor list

File: `frontend/src/app/(patient)/patient/doctors/page.tsx`

- Added `react-select` dropdown for:
  - Province
  - District (depends on selected province)
- Added `Near you` toggle button:
  - Uses `patientProfile.provinceCode` and `patientProfile.districtCode`
  - Prioritizes doctors in same district, then same province
- Added map toggle (`Bật map`):
  - Shows embedded Google Maps panel in-page
  - Lets user focus map on a selected doctor via quick chips
  - Each doctor card has `Map` action to jump/focus on that doctor location
- Kept existing filters:
  - Name search
  - Specialty
  - Price range

### 2) Patient doctor detail

File: `frontend/src/app/(patient)/patient/doctors/[doctorUserId]/page.tsx`

- Resolves location names from administrative codes
- Displays full clinic address block
- Adds link to Google Maps:
  - `https://www.google.com/maps/search/?api=1&query=...`

## Shared location helper

File: `frontend/src/lib/vn-location.ts`

Provides:

- `fetchVnProvinces()`
- `fetchVnDistricts(provinceCode)`
- `fetchVnWards(districtCode)`

Data source: `https://provinces.open-api.vn/api`

## Data assumptions

Doctor location data is expected from `doctorsApi` response:

- `workplaceAddress`
- `provinceCode`
- `districtCode`
- `wardCode`

Patient "near you" mode uses:

- `user.patientProfile.provinceCode`
- `user.patientProfile.districtCode`

## Notes

- Current "near you" behavior is administrative-priority sorting, not GPS radius.
- This approach avoids geolocation permission friction and works immediately.
- Future upgrade path:
  - Add doctor `lat/lng`
  - Use geolocation + distance calculation for accurate nearest-doctor ranking.
