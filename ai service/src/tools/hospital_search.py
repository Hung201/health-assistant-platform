"""
Hospital Search Tool v2 – Tìm bệnh viện / phòng khám gần đây, lọc theo chuyên khoa.

Cải tiến:
  - Lọc theo chuyên khoa qua OSM tag mapping (20+ chuyên khoa tiếng Việt)
  - Ưu tiên kết quả khớp chuyên khoa trong sort
  - Giới hạn tối đa MAX_RESULTS kết quả
  - Overpass query sạch, không có dòng trùng lặp
  - Tự động failover qua nhiều Overpass endpoints khi bị rate-limit
"""
import logging
import time
from dataclasses import dataclass, field
from typing import List, Optional

import requests

from src.core.config import settings

logger = logging.getLogger(__name__)

# Danh sách Overpass API endpoints (failover nếu bị rate-limit)
OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
MAX_RESULTS = 10

# Mapping chuyên khoa tiếng Việt → OSM healthcare:speciality tags
SPECIALTY_TAG_MAP: dict = {
    "nha khoa": ["dentist"],
    "răng hàm mặt": ["dentist"],
    "nhãn khoa": ["ophthalmology"],
    "mắt": ["ophthalmology"],
    "nội thần kinh": ["neurology"],
    "thần kinh": ["neurology"],
    "tim mạch": ["cardiology"],
    "nội khoa": ["general"],
    "tai mũi họng": ["ent"],
    "da liễu": ["dermatology"],
    "chỉnh hình": ["orthopaedics"],
    "cơ xương khớp": ["orthopaedics"],
    "tiêu hóa": ["gastroenterology"],
    "sản phụ khoa": ["gynaecology"],
    "phụ khoa": ["gynaecology"],
    "nhi khoa": ["paediatrics"],
    "nhi": ["paediatrics"],
    "tâm thần": ["psychiatry"],
    "ung bướu": ["oncology"],
    "y học cổ truyền": ["tcm"],
    "đa khoa": ["general"],
}


def _get_osm_specialty_tags(specialty_hint: Optional[str]) -> List[str]:
    """Chuyển tên chuyên khoa tiếng Việt → OSM tags."""
    if not specialty_hint:
        return []
    lower = specialty_hint.lower().strip()
    for key, tags in SPECIALTY_TAG_MAP.items():
        if key in lower or lower in key:
            return tags
    return []


@dataclass
class HospitalResult:
    """Thông tin một cơ sở y tế."""
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    amenity_type: Optional[str] = None
    is_specialty_match: bool = False


@dataclass
class HospitalSearchSummary:
    """Tổng hợp kết quả tìm kiếm cơ sở y tế."""
    location_used: str
    search_radius_km: int
    results: List[HospitalResult] = field(default_factory=list)
    invitation_text: str = ""
    error: Optional[str] = None

    @property
    def found(self) -> bool:
        return len(self.results) > 0


def _build_address(tags: dict) -> Optional[str]:
    """Ghép địa chỉ từ OSM tags."""
    parts = []
    for key in ["addr:housenumber", "addr:street", "addr:suburb",
                "addr:district", "addr:city"]:
        val = tags.get(key, "")
        if val:
            parts.append(val)
    return ", ".join(parts) if parts else None


def _build_invitation_text(
    results: List[HospitalResult],
    location: str,
    specialty_hint: Optional[str],
    radius_km: int,
) -> str:
    """Tạo câu mời thân thiện."""
    n = len(results)
    if n == 0:
        return ""
    spec_phrase = f"chuyên khoa **{specialty_hint}**" if specialty_hint else "phù hợp"
    speciality_count = sum(1 for r in results if r.is_specialty_match)
    highlight = (
        f", trong đó có **{speciality_count} cơ sở chuyên sâu {spec_phrase}**"
        if speciality_count else ""
    )
    place_names = [r.name for r in results[:3]]
    names_str = ", ".join(f"*{p}*" for p in place_names)
    return (
        f"Dựa trên kết quả phân tích, tôi thấy bạn nên đến khám {spec_phrase} sớm. "
        f"Tôi đã tìm thấy **{n} cơ sở y tế** trong bán kính {radius_km}km gần "
        f"*{location}*{highlight}, bao gồm: {names_str}. "
        f"Bạn có muốn xem địa chỉ và thông tin liên hệ chi tiết không? 🏥"
    )


class HospitalSearchTool:
    """Tool tìm cơ sở y tế gần người dùng, ưu tiên đúng chuyên khoa."""

    def __init__(self):
        self.radius_m: int = settings.HOSPITAL_SEARCH_RADIUS_M
        self.radius_km: int = self.radius_m // 1000
        user_agent = settings.NOMINATIM_USER_AGENT
        # Nominatim cần Accept-Language để ưu tiên tên tiếng Việt
        self.nominatim_headers = {
            "User-Agent": user_agent,
            "Accept-Language": "vi,en",
        }
        # Overpass chỉ cần User-Agent, không cần Accept-Language
        self.overpass_headers = {
            "User-Agent": user_agent,
        }

    def _geocode(self, location: str) -> Optional[tuple]:
        """Chuyển địa chỉ → (lat, lon) dùng Nominatim."""
        try:
            resp = requests.get(
                NOMINATIM_URL,
                params={"q": location, "format": "json", "limit": 1},
                headers=self.nominatim_headers,
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            if not data:
                logger.warning(f"[HospitalSearch] Nominatim không tìm thấy: {location!r}")
                return None
            return float(data[0]["lat"]), float(data[0]["lon"])
        except Exception as e:
            logger.error(f"[HospitalSearch] Lỗi geocoding: {e}")
            return None

    def _build_overpass_query(
        self, lat: float, lon: float, osm_specialty_tags: List[str]
    ) -> str:
        """
        Build Overpass QL query sạch, không có dòng trùng lặp.
        Dùng set để đảm bảo mỗi filter chỉ xuất hiện một lần.
        """
        r = self.radius_m
        seen: set = set()
        lines: List[str] = []

        def add(selector: str) -> None:
            for el_type in ("node", "way"):
                line = f"  {el_type}(around:{r},{lat},{lon}){selector};"
                if line not in seen:
                    seen.add(line)
                    lines.append(line)

        # Phase A: Specialty-specific filters
        for tag in osm_specialty_tags:
            if tag == "dentist":
                # Nha khoa có amenity tag riêng trong OSM
                add("[amenity=dentist]")
                add("[healthcare:speciality=dentist]")
            else:
                add(f"[healthcare:speciality={tag}]")

        # Phase B: General healthcare fallback
        add("[amenity=hospital]")
        add("[amenity=clinic]")
        add("[amenity=doctors]")

        return "[out:json][timeout:25];\n(\n" + "\n".join(lines) + "\n);\nout body;\n"

    def _call_overpass(self, query: str) -> List[dict]:
        """
        Gọi Overpass API với tự động failover qua các endpoint dự phòng.
        Bỏ qua endpoint nếu trả về HTML (bị rate-limit).
        """
        for endpoint in OVERPASS_ENDPOINTS:
            try:
                logger.info(f"[HospitalSearch] Thử endpoint: {endpoint}")
                resp = requests.post(
                    endpoint,
                    data={"data": query},  # POST là chuẩn của Overpass API
                    headers=self.overpass_headers,
                    timeout=30,
                )

                # Log response body rõ ràng khi có lỗi
                if resp.status_code != 200:
                    logger.error(
                        f"[HospitalSearch] {endpoint} → HTTP {resp.status_code}\n"
                        f"Response body: {resp.text[:500]}"
                    )
                    resp.raise_for_status()

                # Kiểm tra response có phải JSON không (tránh HTML rate-limit page)
                ct = resp.headers.get("Content-Type", "")
                if "html" in ct or resp.text.strip().startswith("<"):
                    logger.warning(f"[HospitalSearch] {endpoint} → HTML (rate limit). Thử tiếp...")
                    time.sleep(2)
                    continue

                elements = resp.json().get("elements", [])
                logger.info(f"[HospitalSearch] ✅ {endpoint} → {len(elements)} elements")
                return elements

            except Exception as e:
                logger.warning(f"[HospitalSearch] {endpoint} lỗi: {e}. Thử tiếp...")
                time.sleep(1)
                continue

        logger.error("[HospitalSearch] Tất cả Overpass endpoints đều thất bại.")
        return []

    def _parse_elements(
        self, elements: List[dict], osm_specialty_tags: List[str]
    ) -> List[HospitalResult]:
        """Parse Overpass elements → HospitalResult list (sorted, capped)."""
        results: List[HospitalResult] = []
        seen_names: set = set()

        for el in elements:
            tags = el.get("tags", {})
            name = tags.get("name") or tags.get("name:vi")
            if not name or name in seen_names:
                continue
            seen_names.add(name)

            osm_spec = tags.get("healthcare:speciality", "")
            amenity = tags.get("amenity", "")

            # Kiểm tra khớp chuyên khoa
            is_match = False
            if osm_specialty_tags:
                if any(t in osm_spec for t in osm_specialty_tags):
                    is_match = True
                if amenity == "dentist" and "dentist" in osm_specialty_tags:
                    is_match = True

            results.append(HospitalResult(
                name=name,
                address=_build_address(tags),
                phone=tags.get("phone") or tags.get("contact:phone"),
                specialty=osm_spec or None,
                amenity_type=amenity or tags.get("healthcare"),
                is_specialty_match=is_match,
            ))

        # Sort: specialty match > amenity type > có địa chỉ
        priority = {"dentist": 0, "hospital": 1, "clinic": 2, "doctors": 3}
        results.sort(key=lambda x: (
            0 if x.is_specialty_match else 1,
            priority.get(x.amenity_type or "", 4),
            0 if x.address else 1,
        ))
        return results[:MAX_RESULTS]

    def search(
        self,
        location: str,
        specialty_hint: Optional[str] = None,
    ) -> HospitalSearchSummary:
        """
        Tìm cơ sở y tế gần `location`, ưu tiên đúng chuyên khoa.

        Args:
            location: Địa chỉ người dùng (VD: "Cầu Giấy, Hà Nội")
            specialty_hint: Tên chuyên khoa từ chẩn đoán (VD: "Nha khoa")
        """
        summary = HospitalSearchSummary(
            location_used=location,
            search_radius_km=self.radius_km,
        )

        logger.info(f"[HospitalSearch] Geocoding: {location!r} | Specialty: {specialty_hint!r}")
        coords = self._geocode(location)
        if not coords:
            summary.error = f"Không tìm được tọa độ cho địa chỉ: {location!r}"
            return summary

        lat, lon = coords
        logger.info(f"[HospitalSearch] ({lat:.4f}, {lon:.4f}) | Bán kính: {self.radius_km}km")

        time.sleep(1)  # Nominatim policy

        osm_tags = _get_osm_specialty_tags(specialty_hint)
        if osm_tags:
            logger.info(f"[HospitalSearch] OSM tags: {osm_tags}")

        query = self._build_overpass_query(lat, lon, osm_tags)
        elements = self._call_overpass(query)

        if not elements:
            summary.error = "Không tìm được cơ sở y tế nào từ Overpass API."
            return summary

        results = self._parse_elements(elements, osm_tags)
        summary.results = results

        specialty_count = sum(1 for r in results if r.is_specialty_match)
        logger.info(
            f"[HospitalSearch] Kết quả: {len(results)} cơ sở "
            f"({specialty_count} khớp chuyên khoa)"
        )

        if results:
            summary.invitation_text = _build_invitation_text(
                results, location, specialty_hint, self.radius_km
            )

        return summary
