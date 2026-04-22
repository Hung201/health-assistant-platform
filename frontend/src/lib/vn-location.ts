export type VnProvince = {
  code: number;
  name: string;
};

export type VnDistrict = {
  code: number;
  name: string;
};

export type VnWard = {
  code: number;
  name: string;
};

type ProvinceDepthResponse = {
  districts?: Array<{ code: number; name: string }>;
};

type DistrictDepthResponse = {
  wards?: Array<{ code: number; name: string }>;
};

const BASE_URL = 'https://provinces.open-api.vn/api';

export async function fetchVnProvinces(): Promise<VnProvince[]> {
  const res = await fetch(`${BASE_URL}/p/`);
  if (!res.ok) throw new Error('Không tải được danh sách Tỉnh/Thành');
  const rows = (await res.json()) as Array<{ code: number; name: string }>;
  return rows
    .map((r) => ({ code: Number(r.code), name: String(r.name) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

export async function fetchVnDistricts(provinceCode: string): Promise<VnDistrict[]> {
  if (!provinceCode) return [];
  const res = await fetch(`${BASE_URL}/p/${encodeURIComponent(provinceCode)}?depth=2`);
  if (!res.ok) throw new Error('Không tải được danh sách Quận/Huyện');
  const row = (await res.json()) as ProvinceDepthResponse;
  return (row.districts ?? [])
    .map((d) => ({ code: Number(d.code), name: String(d.name) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

export async function fetchVnWards(districtCode: string): Promise<VnWard[]> {
  if (!districtCode) return [];
  const res = await fetch(`${BASE_URL}/d/${encodeURIComponent(districtCode)}?depth=2`);
  if (!res.ok) throw new Error('Không tải được danh sách Phường/Xã');
  const row = (await res.json()) as DistrictDepthResponse;
  return (row.wards ?? [])
    .map((w) => ({ code: Number(w.code), name: String(w.name) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}
