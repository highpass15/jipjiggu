import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  Calculator,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileText,
  Heart,
  Home,
  Landmark,
  LineChart,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import './App.css'

type Mode = 'prices' | 'ai' | 'listing' | 'directListings' | 'inheritance'
type OfficeArea = '강남' | '여의도' | '광화문' | '판교'
type MapFilterState = {
  tradeType: 'all' | 'brokered' | 'direct'
  pyeong: 'all' | 'p25' | 'p34' | 'under25' | 'over40'
  price: 'all' | 'under5' | 'between5and10' | 'between10and20' | 'between20and40' | 'over40'
  households: 'all' | 'over500' | 'over1000' | 'over3000'
  approval: 'all' | 'within10' | 'within20' | 'over30'
  jeonseRatio: 'all' | 'over60' | 'over70'
  gapPrice: 'all' | 'under3' | 'under5'
  parking: 'all' | 'over1' | 'over13'
}

type Apartment = {
  name: string
  region: string
  mapOnly?: boolean
  station: string
  pyeong: string
  subwayMinutes: number
  commuteMinutes: Record<OfficeArea, number>
  lat: number
  lng: number
  markerPosition: {
    x: number
    y: number
  }
  priceEok: number
  previousEok: number
  recentDeals: Array<{
    date: string
    priceEok: number
  }>
  volume: number
  fit: number
  verified: string
  households: number
  parkingSpaces: number
  floorAreaRatio: number
  approvalYear: number
  tags: string[]
}

type RecommendedApartment = Apartment & {
  budgetDistance: number
  recommendationScore: number
  commuteToOffice: number
  fitReasons: string[]
}

type LiveRtmsDeal = {
  id: string
  aptSeq: string
  aptName: string
  address: string
  legalDong: string
  jibun: string
  umdCd: string
  bonbun: string
  bubun: string
  landCd: string
  lawdCd: string
  district: string
  dealDate: string
  priceEok: number
  areaM2: number
  pyeong: number
  floor: number
  buildYear: number
  tradeType: 'direct' | 'brokered' | 'unknown'
  tradeTypeLabel: string
  buyerType: string
  sellerType: string
  status: 'active' | 'cancelled'
  registeredAt: string
}

type SearchSuggestion = {
  id: string
  title: string
  subtitle: string
  apartment: Apartment | null
  deal: LiveRtmsDeal | null
}

type UserListing = {
  id: string
  aptName: string
  address: string
  detailAddress: string
  buildingDong: string
  unitHo: string
  priceEok: number
  pyeong: number
  floor: number
  ownerName: string
  ownerPhone: string
  memo: string
  photos: Array<{
    id: string
    name: string
    dataUrl: string
  }>
  verificationStatus: 'owner-checking' | 'verified'
  createdAt: string
}

type LeadPayload = Record<string, string | number | boolean | null | undefined>

type ListingApartmentCandidate = {
  id: string
  name: string
  address: string
  region: string
  pyeong?: number
  latestPriceEok?: number
  latestDealDate?: string
  source: 'rtms' | 'curated'
  searchText: string
}

type RtmsMeta = {
  source: string
  lawdCd: string
  district: string
  dealYmd: string
  fromDealYmd?: string
  toDealYmd?: string
  monthsBack?: number
  resultCode: string
  resultMessage: string
  totalCount: number
  rawCount: number
  filteredCount: number
  returnedCount?: number
  canceledCount: number
  directCount: number
  searchedDistricts?: number
  searchedMonths?: number
}

type RtmsResponse = {
  meta: RtmsMeta
  deals: LiveRtmsDeal[]
}

type RtmsMapMarkerResponse = {
  meta: RtmsMeta & {
    resultCode: string
    resultMessage: string
    markerCount?: number
    candidateMarkerCount?: number
    missingCoordinateCount?: number
    needsKakaoRestApiKey?: boolean
  }
  markers: MapValueMarker[]
}

type LatestApartmentDealResponse = {
  meta: {
    source: string
    resultCode: string
    resultMessage: string
    searchedMonths: number
    updatedAt: string
  }
  deal: LiveRtmsDeal | null
}

type RtmsStatus = 'loading' | 'refreshing' | 'ready' | 'error'

type BuildingLedger = {
  source: string
  buildingName: string
  address: string
  registerType: string
  registerKind: string
  mainUsage: string
  structure: string
  roof: string
  householdCount: number
  familyCount: number
  parkingCount: number
  floorAreaRatio: number
  buildingCoverageRatio: number
  totalAreaM2: number
  groundFloors: number
  undergroundFloors: number
  approvalDate: string
}

type BuildingLedgerResponse = {
  meta: {
    source: string
    resultCode: string
    resultMessage: string
    totalCount: number
    isFallback: boolean
    updatedAt: string
  }
  ledger: BuildingLedger
}

type KakaoLatLng = unknown
type KakaoBounds = {
  extend: (position: KakaoLatLng) => void
}
type KakaoMapInstance = {
  setBounds: (bounds: KakaoBounds) => void
  setCenter: (position: KakaoLatLng) => void
  setLevel: (level: number) => void
  getLevel: () => number
}
type KakaoOverlay = {
  setMap: (map: KakaoMapInstance | null) => void
}
type KakaoRoadviewInstance = {
  setPanoId: (panoId: number, position: KakaoLatLng) => void
  relayout?: () => void
}
type KakaoRoadviewClient = {
  getNearestPanoId: (
    position: KakaoLatLng,
    radius: number,
    callback: (panoId: number | null) => void,
  ) => void
}
type KakaoGeocoderResult = {
  x: string
  y: string
}
type KakaoGeocoder = {
  addressSearch: (
    address: string,
    callback: (result: KakaoGeocoderResult[], status: string) => void,
  ) => void
}
type KakaoMapsApi = {
  load: (callback: () => void) => void
  LatLng: new (lat: number, lng: number) => KakaoLatLng
  Map: new (
    container: HTMLElement,
    options: {
      center: KakaoLatLng
      level: number
    },
  ) => KakaoMapInstance
  LatLngBounds: new () => KakaoBounds
  Roadview: new (container: HTMLElement) => KakaoRoadviewInstance
  RoadviewClient: new () => KakaoRoadviewClient
  CustomOverlay: new (options: {
    position: KakaoLatLng
    content: HTMLElement
    xAnchor?: number
    yAnchor?: number
  }) => KakaoOverlay
  services?: {
    Geocoder: new () => KakaoGeocoder
    Status: {
      OK: string
    }
  }
  event?: {
    addListener: (target: KakaoMapInstance, type: string, handler: () => void) => void
  }
}
type KakaoNamespace = {
  maps: KakaoMapsApi
}

type MapValueMarker = {
  id: string
  label: string
  aptName: string
  address: string
  lawdCd?: string
  aptSeq?: string
  dealDate?: string
  tradeTypeLabel?: string
  priceEok: number
  dateLabel?: string
  subLabel: string
  lat: number
  lng: number
  tone: 'sale' | 'direct' | 'office' | 'listing'
  dealCount?: number
  relatedDeals: LiveRtmsDeal[]
  nearbyDeals?: LiveRtmsDeal[]
  listing?: UserListing
  apartment?: Apartment
}

declare global {
  interface Window {
    kakao?: KakaoNamespace
    __kakaoMapSdkLoading?: Promise<void>
  }
}

const ensureKakaoMapSdk = (kakaoKey: string) => {
  if (window.kakao?.maps) {
    return Promise.resolve()
  }

  if (!window.__kakaoMapSdkLoading) {
    window.__kakaoMapSdkLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false&libraries=services`
      script.async = true
      script.onload = () => {
        if (!window.kakao?.maps) {
          reject(new Error('Kakao Maps SDK is unavailable'))
          return
        }
        window.kakao.maps.load(() => resolve())
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  return window.__kakaoMapSdkLoading
}

const KAKAO_MAP_PUBLIC_JS_KEY = '42ca8463bf3a2c6fc7b2698cfacd9461'
const LEGACY_KAKAO_MAP_JS_KEY = '10929e60c7dc672c23f88e4473300e9a'
const getKakaoMapKey = () => {
  const envKey = import.meta.env.VITE_KAKAO_MAP_JS_KEY || import.meta.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY

  return !envKey || envKey === LEGACY_KAKAO_MAP_JS_KEY ? KAKAO_MAP_PUBLIC_JS_KEY : envKey
}

const apartments: Apartment[] = [
  {
    name: '래미안 원베일리',
    region: '서울 서초구 반포동',
    station: '고속터미널역 6분',
    pyeong: '34평',
    subwayMinutes: 6,
    commuteMinutes: { 강남: 18, 여의도: 23, 광화문: 28, 판교: 42 },
    lat: 37.5075,
    lng: 127.0046,
    markerPosition: { x: 56, y: 45 },
    priceEok: 51.6,
    previousEok: 49.4,
    recentDeals: [
      { date: '25.04.21', priceEok: 51.6 },
      { date: '25.03.18', priceEok: 50.2 },
      { date: '25.02.07', priceEok: 49.4 },
    ],
    volume: 9,
    fit: 86,
    verified: '등기 검토 가능',
    households: 2990,
    parkingSpaces: 5385,
    floorAreaRatio: 299,
    approvalYear: 2023,
    tags: ['한강권', '초품아', '대단지'],
  },
  {
    name: '헬리오시티',
    region: '서울 송파구 가락동',
    station: '송파역 4분',
    pyeong: '25평',
    subwayMinutes: 4,
    commuteMinutes: { 강남: 25, 여의도: 39, 광화문: 42, 판교: 36 },
    lat: 37.4974,
    lng: 127.1073,
    markerPosition: { x: 33, y: 52 },
    priceEok: 20.7,
    previousEok: 20.1,
    recentDeals: [
      { date: '25.04.12', priceEok: 20.7 },
      { date: '25.03.29', priceEok: 20.5 },
      { date: '25.02.16', priceEok: 20.1 },
    ],
    volume: 18,
    fit: 91,
    verified: '직거래 후보 3건',
    households: 9510,
    parkingSpaces: 12210,
    floorAreaRatio: 284,
    approvalYear: 2018,
    tags: ['거래량', '역세권', '학군'],
  },
  {
    name: '판교푸르지오그랑블',
    region: '경기 성남시 분당구',
    station: '판교역 9분',
    pyeong: '32평',
    subwayMinutes: 9,
    commuteMinutes: { 강남: 35, 여의도: 55, 광화문: 58, 판교: 8 },
    lat: 37.3913,
    lng: 127.1116,
    markerPosition: { x: 76, y: 28 },
    priceEok: 23.4,
    previousEok: 22.8,
    recentDeals: [
      { date: '25.04.09', priceEok: 23.4 },
      { date: '25.03.11', priceEok: 23.0 },
      { date: '25.01.24', priceEok: 22.8 },
    ],
    volume: 7,
    fit: 88,
    verified: '소유자 확인중',
    households: 948,
    parkingSpaces: 1520,
    floorAreaRatio: 199,
    approvalYear: 2011,
    tags: ['판교', '직주근접', '신축급'],
  },
  {
    name: '광교중흥S클래스',
    region: '경기 수원시 영통구',
    station: '광교중앙역 8분',
    pyeong: '34평',
    subwayMinutes: 8,
    commuteMinutes: { 강남: 44, 여의도: 65, 광화문: 67, 판교: 27 },
    lat: 37.2852,
    lng: 127.0574,
    markerPosition: { x: 47, y: 68 },
    priceEok: 15.6,
    previousEok: 15.2,
    recentDeals: [
      { date: '25.04.19', priceEok: 15.6 },
      { date: '25.03.02', priceEok: 15.4 },
      { date: '25.02.10', priceEok: 15.2 },
    ],
    volume: 12,
    fit: 94,
    verified: '계약검증 가능',
    households: 2231,
    parkingSpaces: 3650,
    floorAreaRatio: 229,
    approvalYear: 2019,
    tags: ['호수공원', '가성비', '신분당선'],
  },
  {
    name: '반포자이',
    region: '서울 서초구 반포동',
    station: '고속터미널역 8분',
    pyeong: '34평',
    subwayMinutes: 8,
    commuteMinutes: { 강남: 16, 여의도: 24, 광화문: 31, 판교: 44 },
    lat: 37.5071,
    lng: 127.0118,
    markerPosition: { x: 59, y: 49 },
    priceEok: 38.2,
    previousEok: 36.8,
    recentDeals: [
      { date: '25.04.16', priceEok: 38.2 },
      { date: '25.03.08', priceEok: 37.4 },
      { date: '25.01.20', priceEok: 36.8 },
    ],
    volume: 11,
    fit: 89,
    verified: '등기 검토 가능',
    households: 3410,
    parkingSpaces: 6075,
    floorAreaRatio: 269,
    approvalYear: 2009,
    tags: ['반포', '대단지', '학군'],
  },
  {
    name: '잠실엘스',
    region: '서울 송파구 잠실동',
    station: '잠실새내역 5분',
    pyeong: '34평',
    subwayMinutes: 5,
    commuteMinutes: { 강남: 22, 여의도: 38, 광화문: 42, 판교: 39 },
    lat: 37.5112,
    lng: 127.0848,
    markerPosition: { x: 39, y: 48 },
    priceEok: 27.9,
    previousEok: 26.7,
    recentDeals: [
      { date: '25.04.11', priceEok: 27.9 },
      { date: '25.03.04', priceEok: 27.2 },
      { date: '25.02.03', priceEok: 26.7 },
    ],
    volume: 16,
    fit: 90,
    verified: '직거래 후보 2건',
    households: 5678,
    parkingSpaces: 7220,
    floorAreaRatio: 275,
    approvalYear: 2008,
    tags: ['잠실', '역세권', '대단지'],
  },
  {
    name: '마포래미안푸르지오',
    region: '서울 마포구 아현동',
    station: '아현역 3분',
    pyeong: '25평',
    subwayMinutes: 3,
    commuteMinutes: { 강남: 36, 여의도: 18, 광화문: 16, 판교: 58 },
    lat: 37.5532,
    lng: 126.9564,
    markerPosition: { x: 23, y: 34 },
    priceEok: 16.8,
    previousEok: 16.1,
    recentDeals: [
      { date: '25.04.18', priceEok: 16.8 },
      { date: '25.03.12', priceEok: 16.5 },
      { date: '25.01.29', priceEok: 16.1 },
    ],
    volume: 14,
    fit: 92,
    verified: '계약검증 가능',
    households: 3885,
    parkingSpaces: 4650,
    floorAreaRatio: 259,
    approvalYear: 2014,
    tags: ['마포', '도심접근', '역세권'],
  },
  {
    name: '철산래미안자이',
    region: '경기 광명시 철산동',
    station: '철산역 7분',
    pyeong: '25평',
    subwayMinutes: 7,
    commuteMinutes: { 강남: 41, 여의도: 24, 광화문: 38, 판교: 58 },
    lat: 37.4766,
    lng: 126.8684,
    markerPosition: { x: 18, y: 61 },
    priceEok: 10.3,
    previousEok: 9.9,
    recentDeals: [
      { date: '25.04.14', priceEok: 10.3 },
      { date: '25.02.26', priceEok: 10.1 },
      { date: '25.01.18', priceEok: 9.9 },
    ],
    volume: 10,
    fit: 87,
    verified: '소유자 확인중',
    households: 2072,
    parkingSpaces: 2650,
    floorAreaRatio: 249,
    approvalYear: 2009,
    tags: ['광명', '가성비', '7호선'],
  },
  {
    name: '인덕원센트럴자이',
    region: '경기 의왕시 내손동',
    station: '인덕원역 12분',
    pyeong: '34평',
    subwayMinutes: 12,
    commuteMinutes: { 강남: 38, 여의도: 48, 광화문: 56, 판교: 27 },
    lat: 37.3939,
    lng: 126.9778,
    markerPosition: { x: 52, y: 58 },
    priceEok: 14.4,
    previousEok: 13.9,
    recentDeals: [
      { date: '25.04.10', priceEok: 14.4 },
      { date: '25.03.06', priceEok: 14.1 },
      { date: '25.01.17', priceEok: 13.9 },
    ],
    volume: 6,
    fit: 85,
    verified: '실거래 확인중',
    households: 2540,
    parkingSpaces: 3302,
    floorAreaRatio: 245,
    approvalYear: 2019,
    tags: ['인덕원', 'GTX권', '의왕'],
  },
  {
    name: '송도더샵센트럴파크',
    region: '인천 연수구 송도동',
    station: '센트럴파크역 6분',
    pyeong: '40평',
    subwayMinutes: 6,
    commuteMinutes: { 강남: 78, 여의도: 56, 광화문: 64, 판교: 84 },
    lat: 37.3937,
    lng: 126.6387,
    markerPosition: { x: 74, y: 74 },
    priceEok: 13.2,
    previousEok: 12.7,
    recentDeals: [
      { date: '25.04.07', priceEok: 13.2 },
      { date: '25.03.03', priceEok: 13.0 },
      { date: '25.01.22', priceEok: 12.7 },
    ],
    volume: 8,
    fit: 82,
    verified: '계약검증 가능',
    households: 1729,
    parkingSpaces: 2440,
    floorAreaRatio: 238,
    approvalYear: 2010,
    tags: ['송도', '공원', '국제업무'],
  },
]

const createMapOnlyApartment = ({
  name,
  region,
  lat,
  lng,
  pyeong = '34평',
  approvalYear = 0,
  households = 0,
  recentDeal,
}: {
  name: string
  region: string
  lat: number
  lng: number
  pyeong?: string
  approvalYear?: number
  households?: number
  recentDeal?: {
    date: string
    priceEok: number
  }
}): Apartment => ({
  name,
  region,
  mapOnly: true,
  station: '실거래 조회중',
  pyeong,
  subwayMinutes: 0,
  commuteMinutes: { 강남: 0, 여의도: 0, 광화문: 0, 판교: 0 },
  lat,
  lng,
  markerPosition: { x: 50, y: 50 },
  priceEok: recentDeal?.priceEok ?? 0,
  previousEok: recentDeal?.priceEok ?? 0,
  recentDeals: recentDeal ? [recentDeal] : [],
  volume: 0,
  fit: 0,
  verified: 'RTMS 최신 거래 조회',
  households,
  parkingSpaces: 0,
  floorAreaRatio: 0,
  approvalYear,
  tags: ['실거래 조회'],
})

const mapOnlyApartments: Apartment[] = [
  createMapOnlyApartment({
    name: '반포르엘아파트',
    region: '서울 서초구 반포동',
    lat: 37.5049,
    lng: 127.0082,
    pyeong: '34평',
    recentDeal: { date: '26.02.07', priceEok: 52.8 },
  }),
  createMapOnlyApartment({
    name: '반포르엘2차',
    region: '서울 서초구 반포동',
    lat: 37.5089,
    lng: 127.0069,
    pyeong: '41평',
    recentDeal: { date: '26.04.25', priceEok: 49 },
  }),
  createMapOnlyApartment({
    name: '신반포2차',
    region: '서울 서초구 반포동',
    lat: 37.5109,
    lng: 127.0046,
    pyeong: '38평',
    recentDeal: { date: '26.04.24', priceEok: 49.5 },
  }),
  createMapOnlyApartment({
    name: '신반포4차',
    region: '서울 서초구 반포동',
    lat: 37.5087,
    lng: 127.0157,
    pyeong: '34평',
    recentDeal: { date: '26.03.07', priceEok: 64.8 },
  }),
  createMapOnlyApartment({
    name: '반포센트럴자이',
    region: '서울 서초구 잠원동',
    lat: 37.5044,
    lng: 127.0107,
    pyeong: '34평',
    recentDeal: { date: '26.04.01', priceEok: 50 },
  }),
  createMapOnlyApartment({
    name: '반포써밋',
    region: '서울 서초구 반포동',
    lat: 37.5021,
    lng: 127.0124,
    pyeong: '34평',
    recentDeal: { date: '26.01.24', priceEok: 44.9 },
  }),
  createMapOnlyApartment({
    name: '래미안퍼스티지',
    region: '서울 서초구 반포동',
    lat: 37.5048,
    lng: 126.9998,
    pyeong: '34평',
    recentDeal: { date: '26.04.20', priceEok: 70 },
  }),
  createMapOnlyApartment({
    name: '아크로리버파크',
    region: '서울 서초구 반포동',
    lat: 37.5107,
    lng: 126.9984,
    pyeong: '34평',
  }),
  createMapOnlyApartment({
    name: '반포미도',
    region: '서울 서초구 반포동',
    lat: 37.5028,
    lng: 126.9939,
    pyeong: '34평',
  }),
  createMapOnlyApartment({
    name: '잠원한신',
    region: '서울 서초구 잠원동',
    lat: 37.5124,
    lng: 127.0117,
    pyeong: '34평',
  }),
]

const navItems: Array<{
  id: Mode
  label: string
  icon: typeof BarChart3
}> = [
  { id: 'prices', label: '실거래가', icon: BarChart3 },
  { id: 'ai', label: 'AI 집추천', icon: Sparkles },
  { id: 'listing', label: '직거래', icon: ShieldCheck },
  { id: 'directListings', label: '직거래 매물보기', icon: Store },
  { id: 'inheritance', label: '상속증여', icon: Calculator },
]

const regionOptions = [
  '서울·경기·인천 전체',
  '서울 전체',
  '경기 전체',
  '인천 전체',
  '강남3구',
  '마포·용산',
  '분당·판교',
  '광교·수원',
]

const officeAreaOptions: OfficeArea[] = ['강남', '여의도', '광화문', '판교']
const pyeongPreferenceOptions = [25, 32, 34, 40]
const subwayPreferenceOptions = [5, 8, 10, 15]
const commutePreferenceOptions = [20, 30, 40, 60]
const defaultMapFilters: MapFilterState = {
  tradeType: 'all',
  pyeong: 'all',
  price: 'all',
  households: 'all',
  approval: 'all',
  jeonseRatio: 'all',
  gapPrice: 'all',
  parking: 'all',
}
const currentYear = 2026

const mapFilterGroups = [
  {
    key: 'tradeType',
    label: '매매 유형',
    options: [
      ['all', '전체'],
      ['brokered', '중개거래'],
      ['direct', '직거래'],
    ],
  },
  {
    key: 'pyeong',
    label: '평형',
    options: [
      ['all', '전체'],
      ['p25', '25평 기준'],
      ['p34', '국평 34평'],
      ['under25', '소형 25평 이하'],
      ['over40', '40평 이상'],
    ],
  },
  {
    key: 'price',
    label: '가격',
    options: [
      ['all', '전체'],
      ['under5', '5억 이하'],
      ['between5and10', '5~10억'],
      ['between10and20', '10~20억'],
      ['between20and40', '20~40억'],
      ['over40', '40억 이상'],
    ],
  },
  {
    key: 'households',
    label: '세대수',
    options: [
      ['all', '전체'],
      ['over500', '500세대+'],
      ['over1000', '1,000세대+'],
      ['over3000', '3,000세대+'],
    ],
  },
  {
    key: 'approval',
    label: '사용승인일',
    options: [
      ['all', '전체'],
      ['within10', '10년 이내'],
      ['within20', '20년 이내'],
      ['over30', '30년 이상'],
    ],
  },
  {
    key: 'jeonseRatio',
    label: '전세가율',
    options: [
      ['all', '전체'],
      ['over60', '60% 이상'],
      ['over70', '70% 이상'],
    ],
  },
  {
    key: 'gapPrice',
    label: '갭가격',
    options: [
      ['all', '전체'],
      ['under3', '3억 이하'],
      ['under5', '5억 이하'],
    ],
  },
  {
    key: 'parking',
    label: '주차공간',
    options: [
      ['all', '전체'],
      ['over1', '1.0대+'],
      ['over13', '1.3대+'],
    ],
  },
] satisfies Array<{
  key: keyof MapFilterState
  label: string
  options: Array<[MapFilterState[keyof MapFilterState], string]>
}>

const rtmsScopeByRegion: Record<string, string> = {
  '서울·경기·인천 전체': 'capital',
  '서울 전체': 'seoul',
  '경기 전체': 'gyeonggi',
  '인천 전체': 'incheon',
  강남3구: 'gangnam3',
  '마포·용산': 'mapo-yongsan',
  '분당·판교': 'bundang-pangyo',
  '광교·수원': 'gwanggyo-suwon',
}

const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replaceAll('레미안', '래미안')
    .replaceAll('세트럴', '센트럴')

const fuzzyIncludes = (target: string, query: string) => {
  let cursor = 0

  for (const char of query) {
    cursor = target.indexOf(char, cursor)
    if (cursor === -1) return false
    cursor += 1
  }

  return true
}

const apartmentSearchAliases: Record<string, string> = {
  '래미안 원베일리': '반포래미안 반포원베일리 래미안원베일리 레미안원베일리',
  헬리오시티: '송파헬리오 가락헬리오',
  판교푸르지오그랑블: '판교푸르지오 판교그랑블',
  인덕원센트럴자이: '인덕원센트럴 인덕원세트럴 인덕원자이 내손동센트럴자이 의왕인덕원',
}

const matchesApartmentQuery = (apartment: Apartment, query: string) => {
  const normalizedQuery = normalizeSearchText(query)
  const target = normalizeSearchText(
    `${apartment.name} ${apartment.region} ${apartment.station} ${apartmentSearchAliases[apartment.name] ?? ''}`,
  )

  return normalizedQuery.length > 0 && (target.includes(normalizedQuery) || fuzzyIncludes(target, normalizedQuery))
}

const formatEok = (amount: number) => `${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(1)}억`
const formatManwon = (amount: number) => `${Math.round(amount).toLocaleString('ko-KR')}만원`
const formatListingStatus = (status: UserListing['verificationStatus']) =>
  status === 'verified' ? '실소유자 확인 완료' : '실소유자 확인중'
const getDefaultRtmsDealYmd = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
}
const getMapRtmsDealYmd = () => 'auto'
const formatShortDate = (date: string) => date.slice(2).replaceAll('-', '.')
const formatMarkerMonth = (date?: string) => {
  if (!date) return ''
  const normalized = date.includes('-') ? date : `20${date.replaceAll('.', '-')}`
  const [year, month] = normalized.split('-')
  return year && month ? `${year.slice(2)}.${month.padStart(2, '0')}` : ''
}
const sendTelegramLead = async (type: string, payload: LeadPayload) => {
  try {
    await fetch('/api/telegram/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    })
  } catch {
    // 알림 실패가 사용자 접수 흐름을 막지 않도록 조용히 처리합니다.
  }
}
const toDealYmd = (date: string) => date.slice(0, 7).replace('-', '')

const getMonthCountFrom2022 = (baseYmd: string) => {
  const year = Number(baseYmd.slice(0, 4))
  const month = Number(baseYmd.slice(4, 6))
  return Math.max(1, (year - 2022) * 12 + month)
}

const maxDealYmd = (left: string, right: string) => (left.localeCompare(right) >= 0 ? left : right)

const lawdCdByRegionKeyword: Array<[string, string]> = [
  ['서초구', '11650'],
  ['강남구', '11680'],
  ['송파구', '11710'],
  ['마포구', '11440'],
  ['용산구', '11170'],
  ['분당구', '41135'],
  ['수원시 영통구', '41117'],
  ['광명시', '41210'],
  ['연수구', '28185'],
]

const getLawdCdFromRegion = (region: string) =>
  lawdCdByRegionKeyword.find(([keyword]) => region.includes(keyword))?.[1] ?? ''

const normalizeApartmentName = (value: string) =>
  value
    .replace(/\([^)]*\)/g, '')
    .replace(/제?\d+동/g, '')
    .replace(/\d+차/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()

const dealTimestamp = (deal: LiveRtmsDeal) => new Date(deal.dealDate).getTime()

const dedupeDeals = (deals: LiveRtmsDeal[]) =>
  Array.from(new Map(deals.map((deal) => [deal.id, deal])).values()).sort(
    (a, b) => dealTimestamp(b) - dealTimestamp(a),
  )

const getMsUntilNextDailySync = (hour: number) => {
  const now = new Date()
  const nextSync = new Date(now)
  nextSync.setHours(hour, 0, 0, 0)

  if (nextSync <= now) {
    nextSync.setDate(nextSync.getDate() + 1)
  }

  return nextSync.getTime() - now.getTime()
}

const buildReviewNotes = (marker: MapValueMarker) => {
  const directReview =
    marker.relatedDeals.some((deal) => deal.tradeType === 'direct') || marker.label === '직거래'
      ? '직거래 이력 확인 가능'
      : '중개거래 중심 단지'
  const priceTone = marker.priceEok >= 30 ? '고가 단지라 권리·세금 검토 수요가 큽니다.' : '예산권 진입 상담 문의가 꾸준합니다.'

  return [
    {
      author: '실거주 검토자',
      rating: 4.8,
      text: `${marker.aptName}은 최근 거래 기준 가격 확인이 쉬워 매수 타이밍을 비교하기 좋았습니다.`,
    },
    {
      author: '직거래 상담',
      rating: 4.6,
      text: `${directReview}. 등기와 잔금 체크리스트가 같이 있으면 안심하고 문의할 수 있습니다.`,
    },
    {
      author: '데이터 리포트',
      rating: 4.7,
      text: priceTone,
    },
  ]
}

const calculateSixMonthChange = (deals: LiveRtmsDeal[]) => {
  const sortedDeals = dedupeDeals(deals).sort((a, b) => dealTimestamp(a) - dealTimestamp(b))
  const latestDeal = sortedDeals.at(-1)

  if (!latestDeal) return null

  const latestTime = dealTimestamp(latestDeal)
  const startDate = new Date(latestTime)
  startDate.setMonth(startDate.getMonth() - 6)

  const windowDeals = sortedDeals.filter((deal) => dealTimestamp(deal) >= startDate.getTime())

  if (windowDeals.length < 2) return null

  const firstDeal = windowDeals[0]
  const changeRate = ((latestDeal.priceEok - firstDeal.priceEok) / Math.max(firstDeal.priceEok, 0.1)) * 100

  return {
    changeRate,
    latestDeal,
    firstDeal,
    dealCount: windowDeals.length,
  }
}

const calculateNearbySixMonthChange = (deals: LiveRtmsDeal[]) => {
  const grouped = Array.from(
    deals
      .reduce((group, deal) => {
        const key = deal.aptSeq || `${deal.aptName}-${deal.jibun}`
        group.set(key, [...(group.get(key) ?? []), deal])
        return group
      }, new Map<string, LiveRtmsDeal[]>())
      .values(),
  )
  const changes = grouped
    .map((groupDeals) => calculateSixMonthChange(groupDeals))
    .filter((change): change is NonNullable<ReturnType<typeof calculateSixMonthChange>> => Boolean(change))

  if (changes.length === 0) return null

  return changes.reduce((sum, change) => sum + change.changeRate, 0) / changes.length
}

const formatNearbyComparisonNames = (deals: LiveRtmsDeal[], currentAptName: string) => {
  const uniqueNames = Array.from(
    new Set(
      deals
        .map((deal) => deal.aptName.trim())
        .filter((name) => name && name !== currentAptName),
    ),
  )

  if (uniqueNames.length === 0) return ''

  const visibleNames = uniqueNames.slice(0, 2).join(', ')
  return `(${visibleNames}${uniqueNames.length > 2 ? ' 등' : ''})`
}

const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`

const estimateDealFacts = (deal: LiveRtmsDeal) => {
  const aptSeed = deal.aptSeq
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const householdCount = deal.aptName.includes('헬리오')
    ? 9510
    : deal.aptName.includes('래미안')
      ? 2990
      : deal.aptName.includes('푸르지오')
        ? 1200
        : 420 + (aptSeed % 3200)
  const jeonseRatio = Math.min(78, Math.max(48, 74 - deal.priceEok * 0.45 + (aptSeed % 8)))
  const parkingPerHousehold = Math.min(1.8, 0.75 + (aptSeed % 9) / 10)
  const gapPrice = Math.max(0.8, deal.priceEok * (1 - jeonseRatio / 100))

  return {
    householdCount,
    jeonseRatio,
    parkingPerHousehold,
    gapPrice,
    approvalAge: currentYear - deal.buildYear,
  }
}

const getActiveMapFilterCount = (filters: MapFilterState) =>
  Object.entries(filters).filter(([key, value]) => value !== defaultMapFilters[key as keyof MapFilterState]).length

const passesMapFilters = (deal: LiveRtmsDeal, filters: MapFilterState) => {
  const facts = estimateDealFacts(deal)

  if (filters.tradeType === 'brokered' && deal.tradeType !== 'brokered') return false
  if (filters.tradeType === 'direct' && deal.tradeType !== 'direct') return false

  if (filters.pyeong === 'p25' && Math.abs(deal.pyeong - 25) > 1) return false
  if (filters.pyeong === 'p34' && Math.abs(deal.pyeong - 34) > 2) return false
  if (filters.pyeong === 'under25' && deal.pyeong > 25) return false
  if (filters.pyeong === 'over40' && deal.pyeong < 40) return false

  if (filters.price === 'under5' && deal.priceEok > 5) return false
  if (filters.price === 'between5and10' && (deal.priceEok < 5 || deal.priceEok > 10)) return false
  if (filters.price === 'between10and20' && (deal.priceEok < 10 || deal.priceEok > 20)) return false
  if (filters.price === 'between20and40' && (deal.priceEok < 20 || deal.priceEok > 40)) return false
  if (filters.price === 'over40' && deal.priceEok < 40) return false

  if (filters.households === 'over500' && facts.householdCount < 500) return false
  if (filters.households === 'over1000' && facts.householdCount < 1000) return false
  if (filters.households === 'over3000' && facts.householdCount < 3000) return false

  if (filters.approval === 'within10' && facts.approvalAge > 10) return false
  if (filters.approval === 'within20' && facts.approvalAge > 20) return false
  if (filters.approval === 'over30' && facts.approvalAge < 30) return false

  if (filters.jeonseRatio === 'over60' && facts.jeonseRatio < 60) return false
  if (filters.jeonseRatio === 'over70' && facts.jeonseRatio < 70) return false

  if (filters.gapPrice === 'under3' && facts.gapPrice > 3) return false
  if (filters.gapPrice === 'under5' && facts.gapPrice > 5) return false

  if (filters.parking === 'over1' && facts.parkingPerHousehold < 1) return false
  if (filters.parking === 'over13' && facts.parkingPerHousehold < 1.3) return false

  return true
}

function App() {
  const [mode, setMode] = useState<Mode>('prices')
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [focusApartment, setFocusApartment] = useState<Apartment | null>(null)
  const [selectedRegion, setSelectedRegion] = useState('서울·경기·인천 전체')
  const [salePrice, setSalePrice] = useState(5)
  const [income, setIncome] = useState(9000)
  const [assets, setAssets] = useState(30000)
  const [debt, setDebt] = useState(7000)
  const [preferredPyeong, setPreferredPyeong] = useState(34)
  const [maxSubwayMinutes, setMaxSubwayMinutes] = useState(10)
  const [officeArea, setOfficeArea] = useState<OfficeArea>('강남')
  const [maxCommuteMinutes, setMaxCommuteMinutes] = useState(40)
  const [minTradePriceEok, setMinTradePriceEok] = useState(0)
  const [maxTradePriceEok, setMaxTradePriceEok] = useState(80)
  const [userListings, setUserListings] = useState<UserListing[]>([])
  const [focusListing, setFocusListing] = useState<UserListing | null>(null)
  const [capitalLiveDeals, setCapitalLiveDeals] = useState<LiveRtmsDeal[]>([])
  const [focusLiveDeal, setFocusLiveDeal] = useState<LiveRtmsDeal | null>(null)
  const [appToast, setAppToast] = useState('')
  const contentPanelRef = useRef<HTMLElement | null>(null)

  const handleHomeClick = useCallback(() => {
    if (mode !== 'prices') {
      setMode('prices')
    }

    window.setTimeout(() => {
      contentPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 30)
  }, [mode])

  const filteredApartments = useMemo(() => {
    const normalized = query.trim()

    return apartments.filter((apartment) => {
      const regionMatch =
        selectedRegion === '서울·경기·인천 전체'
          ? true
          : selectedRegion === '서울 전체'
          ? apartment.region.startsWith('서울')
          : selectedRegion === '경기 전체'
            ? apartment.region.startsWith('경기')
            : selectedRegion === '인천 전체'
              ? apartment.region.startsWith('인천')
            : selectedRegion === '강남3구'
              ? ['서초구', '송파구', '강남구'].some((region) =>
                  apartment.region.includes(region),
                )
              : selectedRegion === '마포·용산'
                ? ['마포구', '용산구'].some((region) => apartment.region.includes(region))
                : selectedRegion === '분당·판교'
                  ? ['분당구', '판교'].some((region) => apartment.region.includes(region))
                  : ['수원시', '광교'].some((region) => apartment.region.includes(region))

      const searchMatch =
        !normalized ||
        matchesApartmentQuery(apartment, normalized) ||
        [apartment.name, apartment.region, apartment.station, ...apartment.tags]
          .join(' ')
          .toLowerCase()
          .includes(normalized.toLowerCase())

      return regionMatch && searchMatch
    })
  }, [query, selectedRegion])

  useEffect(() => {
    if (!appToast) return

    const timerId = window.setTimeout(() => setAppToast(''), 4200)
    return () => window.clearTimeout(timerId)
  }, [appToast])

  const searchSuggestions = useMemo<SearchSuggestion[]>(() => {
    const normalized = query.trim()

    if (normalized.length < 2) return []

    const apartmentSuggestions = apartments
      .filter((apartment) => matchesApartmentQuery(apartment, normalized))
      .slice(0, 3)
      .map((apartment) => ({
        id: `sample-${apartment.name}`,
        title: apartment.name,
        subtitle: `${apartment.region} · ${apartment.pyeong}`,
        apartment,
        deal: null as LiveRtmsDeal | null,
      }))
    const liveDealSuggestions = Array.from(
      capitalLiveDeals
        .reduce((group, deal) => {
          const key = deal.aptSeq || `${deal.aptName}-${deal.address}`
          const current = group.get(key)
          if (!current || dealTimestamp(deal) > dealTimestamp(current)) {
            group.set(key, deal)
          }
          return group
        }, new Map<string, LiveRtmsDeal>())
        .values(),
    )
      .filter((deal) => {
        const target = normalizeSearchText(`${deal.aptName} ${deal.address} ${deal.legalDong}`)
        const normalizedQuery = normalizeSearchText(normalized)
        return target.includes(normalizedQuery) || fuzzyIncludes(target, normalizedQuery)
      })
      .slice(0, 5 - apartmentSuggestions.length)
      .map((deal) => ({
        id: `live-${deal.aptSeq || deal.id}`,
        title: deal.aptName,
        subtitle: `${deal.address} · ${deal.pyeong}평 · ${formatShortDate(deal.dealDate)}`,
        apartment: null as Apartment | null,
        deal,
      }))

    return [...apartmentSuggestions, ...liveDealSuggestions]
  }, [capitalLiveDeals, query])

  const defaultSearchSuggestions = useMemo<SearchSuggestion[]>(() => {
    const latestLiveSuggestions = Array.from(
      capitalLiveDeals
        .reduce((group, deal) => {
          const key = deal.aptSeq || `${deal.aptName}-${deal.address}`
          const current = group.get(key)
          if (!current || dealTimestamp(deal) > dealTimestamp(current)) {
            group.set(key, deal)
          }
          return group
        }, new Map<string, LiveRtmsDeal>())
        .values(),
    )
      .sort((a, b) => dealTimestamp(b) - dealTimestamp(a))
      .slice(0, 3)
      .map((deal) => ({
        id: `popular-live-${deal.aptSeq || deal.id}`,
        title: deal.aptName,
        subtitle: `${deal.address} · 최근 ${formatEok(deal.priceEok)}`,
        apartment: null,
        deal,
      }))

    const fallbackSuggestions = apartments
      .filter(
        (apartment) =>
          !latestLiveSuggestions.some((suggestion) =>
            normalizeSearchText(suggestion.title).includes(normalizeSearchText(apartment.name)),
          ),
      )
      .slice(0, Math.max(0, 4 - latestLiveSuggestions.length))
      .map((apartment) => ({
        id: `popular-${apartment.name}`,
        title: apartment.name,
        subtitle: `${apartment.region} · ${apartment.pyeong}`,
        apartment,
        deal: null,
      }))

    return [...latestLiveSuggestions, ...fallbackSuggestions]
  }, [capitalLiveDeals])

  const visibleSearchSuggestions = query.trim().length < 2 ? defaultSearchSuggestions : searchSuggestions
  const searchHasNoResults = searchFocused && query.trim().length >= 2 && searchSuggestions.length === 0

  const listingApartmentCandidates = useMemo<ListingApartmentCandidate[]>(() => {
    const candidates = new Map<string, ListingApartmentCandidate>()
    const latestDeals = [...capitalLiveDeals].sort((a, b) => dealTimestamp(b) - dealTimestamp(a))

    latestDeals.forEach((deal) => {
      const key = normalizeSearchText(`${deal.aptName}-${deal.address}`)
      if (candidates.has(key)) return

      candidates.set(key, {
        id: `rtms-${deal.aptSeq || deal.id}`,
        name: deal.aptName,
        address: deal.address,
        region: `${deal.district} ${deal.legalDong}`.trim(),
        pyeong: Math.round(deal.pyeong),
        latestPriceEok: deal.priceEok,
        latestDealDate: deal.dealDate,
        source: 'rtms',
        searchText: normalizeSearchText(`${deal.aptName} ${deal.address} ${deal.legalDong} ${deal.district}`),
      })
    })

    apartments.forEach((apartment) => {
      const key = normalizeSearchText(`${apartment.name}-${apartment.region}`)
      if (candidates.has(key)) return

      candidates.set(key, {
        id: `curated-${apartment.name}`,
        name: apartment.name,
        address: apartment.region,
        region: apartment.region,
        pyeong: Number.parseInt(apartment.pyeong, 10),
        latestPriceEok: apartment.priceEok,
        latestDealDate: apartment.recentDeals[0]?.date,
        source: 'curated',
        searchText: normalizeSearchText(
          `${apartment.name} ${apartment.region} ${apartment.station} ${apartmentSearchAliases[apartment.name] ?? ''}`,
        ),
      })
    })

    return Array.from(candidates.values()).slice(0, 600)
  }, [capitalLiveDeals])

  const handleSearchChange = (value: string) => {
    setQuery(value)
    setFocusApartment(null)
  }

  const handleSearchSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title)
    setFocusApartment(suggestion.apartment)
    setFocusLiveDeal(suggestion.deal)
    setFocusListing(null)
    setMode('prices')
    setAppToast(`${suggestion.title} 실거래 상세를 열었습니다.`)
    setSearchFocused(false)
  }

  const handleListingCreate = (listing: UserListing) => {
    setUserListings((currentListings) => [listing, ...currentListings])
    setFocusListing(listing)
    setFocusApartment(null)
    setFocusLiveDeal(null)
    setMode('prices')
    setAppToast('매물 등록 접수 완료. 지도에 노란 매물 박스로 반영했습니다.')
    void sendTelegramLead('listing', {
      아파트: listing.aptName,
      주소: listing.address,
      동호수: listing.detailAddress,
      희망가: formatEok(listing.priceEok),
      평형: `${listing.pyeong}평`,
      층: `${listing.floor}층`,
      소유자: listing.ownerName || '미입력',
      연락처: listing.ownerPhone || '미입력',
      사진수: `${listing.photos.length}장`,
      설명: listing.memo || '미입력',
      접수시각: new Date(listing.createdAt).toLocaleString('ko-KR'),
    })

    window.setTimeout(() => {
      contentPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }, 60)
  }

  const brokerage = useMemo(() => {
    const legalCapBothSides = salePrice * 10000 * 0.008
    const jipjigguFee = legalCapBothSides * 0.2
    return {
      legalCapBothSides,
      jipjigguFee,
      savings: legalCapBothSides - jipjigguFee,
    }
  }, [salePrice])

  const recommendationBudgetEok = Math.max(3.5, (assets + income * 4.2 - debt) / 10000)
  const recommendationStretchEok = recommendationBudgetEok * 1.12
  const normalizedMinTradePriceEok = Math.min(Math.max(0, minTradePriceEok), Math.max(0, maxTradePriceEok))
  const normalizedMaxTradePriceEok = Math.max(Math.max(0, minTradePriceEok), Math.max(0, maxTradePriceEok))
  const recommendedApartments = useMemo<RecommendedApartment[]>(
    () =>
      apartments
        .filter(
          (apartment) =>
            apartment.priceEok >= normalizedMinTradePriceEok &&
            apartment.priceEok <= normalizedMaxTradePriceEok,
        )
        .map((apartment) => {
          const apartmentPyeong = Number(apartment.pyeong.replace('평', ''))
          const budgetDistance = Math.abs(apartment.priceEok - recommendationBudgetEok)
          const commuteToOffice = apartment.commuteMinutes[officeArea]
          const budgetScore = Math.max(0, 35 - Math.min(budgetDistance * 3.2, 35))
          const pyeongGap = Math.abs(apartmentPyeong - preferredPyeong)
          const pyeongScore = Math.max(0, 20 - Math.min(pyeongGap * 1.8, 20))
          const subwayScore = Math.max(0, 20 - Math.max(0, apartment.subwayMinutes - maxSubwayMinutes) * 3)
          const commuteScore = Math.max(0, 25 - Math.max(0, commuteToOffice - maxCommuteMinutes) * 0.8)
          const recommendationScore = Math.round(
            Math.min(99, budgetScore + pyeongScore + subwayScore + commuteScore),
          )

          return {
            ...apartment,
            budgetDistance,
            recommendationScore,
            commuteToOffice,
            fitReasons: [
              `${formatEok(apartment.priceEok)} 실거래`,
              `${officeArea} ${commuteToOffice}분`,
              `역 도보 ${apartment.subwayMinutes}분`,
              `${apartment.pyeong} 추천`,
            ],
          }
        })
        .sort(
          (a, b) =>
            b.recommendationScore - a.recommendationScore ||
            a.budgetDistance - b.budgetDistance,
        ),
    [
      officeArea,
      maxCommuteMinutes,
      maxSubwayMinutes,
      normalizedMaxTradePriceEok,
      normalizedMinTradePriceEok,
      preferredPyeong,
      recommendationBudgetEok,
    ],
  )

  return (
    <main className="app">
      <section className={`mobile-stage mode-${mode}`} aria-label="집직구 모바일 앱 미리보기">
        <header className="topbar">
          <button
            className="icon-button"
            aria-label={mode === 'prices' ? '지도 맨 위로 이동' : '홈'}
            onClick={handleHomeClick}
            type="button"
          >
            <Home size={20} />
          </button>
          <div className="brand-lockup" aria-label="집직구">
            <div className="brand-logo">
              <img src="/jipjiggu-logo.png" alt="집직구" />
            </div>
            <span className="brand-subtitle">전국민 안심 직거래</span>
          </div>
          <button className="icon-button" aria-label="알림">
            <Bell size={20} />
          </button>
        </header>

        <section className="search-hero">
          <label className="search-box" htmlFor="search">
            <Search size={19} />
            <input
              id="search"
              value={query}
              onChange={(event) => handleSearchChange(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setSearchFocused(false), 140)}
              placeholder="아파트, 지역, 역 이름 검색"
            />
            <SlidersHorizontal size={18} />
          </label>

          {searchFocused && (visibleSearchSuggestions.length > 0 || searchHasNoResults) && (
            <div
              className={searchHasNoResults ? 'search-suggestions empty' : 'search-suggestions'}
              role="listbox"
              aria-label="추천 검색어"
            >
              {query.trim().length < 2 && visibleSearchSuggestions.length > 0 && (
                <span className="suggestion-kicker">많이 찾는 단지</span>
              )}
              {visibleSearchSuggestions.map((apartment) => (
                <button
                  key={`${apartment.id}-suggestion`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSearchSuggestionClick(apartment)}
                >
                  <strong>{apartment.title}</strong>
                  <span>{apartment.subtitle}</span>
                </button>
              ))}
              {searchHasNoResults && (
                <div className="suggestion-empty">
                  <strong>검색 결과가 아직 없습니다</strong>
                  <span>아파트명은 붙여쓰기나 일부 이름으로도 다시 찾아볼 수 있어요.</span>
                </div>
              )}
            </div>
          )}

          <div className="quick-actions" aria-label="주요 기능">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  className={mode === item.id ? 'quick-action active' : 'quick-action'}
                  onClick={() => setMode(item.id)}
                  type="button"
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="content-panel" ref={contentPanelRef}>
          {mode === 'prices' && (
            <PriceView
              apartments={filteredApartments}
              selectedRegion={selectedRegion}
              setSelectedRegion={setSelectedRegion}
              focusApartment={focusApartment}
              userListings={userListings}
              focusListing={focusListing}
              focusLiveDeal={focusLiveDeal}
              onLiveDealsChange={setCapitalLiveDeals}
            />
          )}

          {mode === 'ai' && (
            <AiView
              income={income}
              assets={assets}
              debt={debt}
              setIncome={setIncome}
              setAssets={setAssets}
              setDebt={setDebt}
              preferredPyeong={preferredPyeong}
              maxSubwayMinutes={maxSubwayMinutes}
              officeArea={officeArea}
              maxCommuteMinutes={maxCommuteMinutes}
              setPreferredPyeong={setPreferredPyeong}
              setMaxSubwayMinutes={setMaxSubwayMinutes}
              setOfficeArea={setOfficeArea}
              setMaxCommuteMinutes={setMaxCommuteMinutes}
              minTradePriceEok={minTradePriceEok}
              maxTradePriceEok={maxTradePriceEok}
              setMinTradePriceEok={setMinTradePriceEok}
              setMaxTradePriceEok={setMaxTradePriceEok}
              budget={recommendationBudgetEok}
              stretch={recommendationStretchEok}
              apartments={recommendedApartments}
            />
          )}

          {mode === 'listing' && (
            <ListingView
              salePrice={salePrice}
              setSalePrice={setSalePrice}
              brokerage={brokerage}
              listingCandidates={listingApartmentCandidates}
              onCreateListing={handleListingCreate}
            />
          )}

          {mode === 'directListings' && (
            <DirectListingsView
              userListings={userListings}
              liveDeals={capitalLiveDeals}
              onRegister={() => setMode('listing')}
              onOpenListing={(listing) => {
                setFocusListing(listing)
                setFocusApartment(null)
                setFocusLiveDeal(null)
                setMode('prices')
                setAppToast(`${listing.aptName} 직거래 매물을 지도에서 열었습니다.`)
              }}
              onOpenDeal={(deal) => {
                setFocusLiveDeal(deal)
                setFocusApartment(null)
                setFocusListing(null)
                setMode('prices')
                setAppToast(`${deal.aptName} 직거래 신고 사례를 열었습니다.`)
              }}
            />
          )}

          {mode === 'inheritance' && <InheritanceView />}
        </section>

        <nav className="bottom-nav" aria-label="하단 메뉴">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={mode === item.id ? 'active' : ''}
                onClick={() => setMode(item.id)}
                type="button"
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {appToast && (
          <div className="app-toast" role="status">
            <CheckCircle2 size={17} />
            <span>{appToast}</span>
          </div>
        )}
      </section>

      <aside className="desktop-rail" aria-label="서비스 요약">
        <div className="rail-card primary">
          <div>
            <span className="rail-kicker">MVP STATUS</span>
            <h2>트래픽은 실거래가로, 전환은 AI 추천으로</h2>
          </div>
          <p>Phase 1은 국토부 실거래가, 복비 절약 계산기, 추천 리포트, 수동 검증 매물 등록으로 시작합니다.</p>
        </div>

        <div className="rail-grid">
          <Metric icon={TrendingUp} label="검색 진입" value="실거래가" tone="blue" />
            <Metric icon={WalletCards} label="전환 모델" value="직거래" tone="green" />
            <Metric icon={BadgeCheck} label="신뢰 장치" value="4중 검증" tone="orange" />
            <Metric icon={Sparkles} label="리드 전환" value="AI 집추천" tone="rose" />
        </div>

        <div className="rail-card">
          <h3>API 준비 순서</h3>
          <ol>
            <li>Firebase 프로젝트</li>
            <li>국토부 실거래가 인증키</li>
            <li>Kakao 지도 JavaScript 키</li>
            <li>도로명주소 검색 승인키</li>
            <li>Gemini 서버 키</li>
          </ol>
        </div>
      </aside>
    </main>
  )
}

function PriceView({
  apartments,
  selectedRegion,
  setSelectedRegion,
  focusApartment,
  userListings,
  focusListing,
  focusLiveDeal,
  onLiveDealsChange,
}: {
  apartments: Apartment[]
  selectedRegion: string
  setSelectedRegion: (region: string) => void
  focusApartment: Apartment | null
  userListings: UserListing[]
  focusListing: UserListing | null
  focusLiveDeal: LiveRtmsDeal | null
  onLiveDealsChange: (deals: LiveRtmsDeal[]) => void
}) {
  const [view, setView] = useState<'map' | 'list'>('map')
  const [rtmsData, setRtmsData] = useState<RtmsResponse | null>(null)
  const [serverMapMarkers, setServerMapMarkers] = useState<MapValueMarker[]>([])
  const [rtmsStatus, setRtmsStatus] = useState<RtmsStatus>('loading')
  const [rtmsError, setRtmsError] = useState('')
  const [mapMarkerNotice, setMapMarkerNotice] = useState('')
  const [syncTick, setSyncTick] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)
  const [mapFilters, setMapFilters] = useState<MapFilterState>(defaultMapFilters)
  const [selectedMapMarker, setSelectedMapMarker] = useState<MapValueMarker | null>(null)
  const rtmsScope = rtmsScopeByRegion[selectedRegion] ?? 'capital'
  const liveDeals = useMemo(() => rtmsData?.deals ?? [], [rtmsData])
  const filteredLiveDeals = useMemo(
    () => liveDeals.filter((deal) => passesMapFilters(deal, mapFilters)),
    [liveDeals, mapFilters],
  )
  const filteredServerMapMarkers = useMemo(
    () =>
      serverMapMarkers.filter((marker) => {
        const [latestDeal] = marker.relatedDeals ?? []
        return latestDeal ? passesMapFilters(latestDeal, mapFilters) : true
      }),
    [mapFilters, serverMapMarkers],
  )
  const mapApartmentCandidates = useMemo(() => [...mapOnlyApartments, ...apartments], [apartments])
  const latestApartmentDeals = useLatestApartmentDeals(mapApartmentCandidates)
  const activeFilterCount = getActiveMapFilterCount(mapFilters)
  const mapDeals = useMemo(() => filteredLiveDeals, [filteredLiveDeals])
  const defaultDealYmd = useMemo(() => getMapRtmsDealYmd(), [])
  const retryTimerRef = useRef<number | null>(null)
  const markerRetryTimerRef = useRef<number | null>(null)
  const latestAverage =
    apartments.reduce((sum, apartment) => sum + apartment.priceEok, 0) / Math.max(apartments.length, 1)
  const totalVolume = apartments.reduce((sum, apartment) => sum + apartment.volume, 0)
  const liveAverage =
    filteredLiveDeals.reduce((sum, deal) => sum + deal.priceEok, 0) / Math.max(filteredLiveDeals.length, 1)

  const scrollTradeDetailIntoView = useCallback(() => {
    const tryScroll = (attempt = 0) => {
      const detailNode = document.getElementById('trade-detail-panel')

      if (detailNode) {
        const scrollContainer = detailNode.closest('.content-panel')
        if (scrollContainer instanceof HTMLElement) {
          const containerRect = scrollContainer.getBoundingClientRect()
          const detailRect = detailNode.getBoundingClientRect()
          const targetTop = scrollContainer.scrollTop + detailRect.top - containerRect.top - 6
          scrollContainer.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
        } else {
          detailNode.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        return
      }

      if (attempt < 8) {
        window.setTimeout(() => tryScroll(attempt + 1), 60)
      }
    }

    window.requestAnimationFrame(() => tryScroll())
  }, [])

  const handleMapMarkerSelect = useCallback(
    (marker: MapValueMarker, options: { scrollToDetail?: boolean } = {}) => {
      setSelectedMapMarker(marker)

      if (options.scrollToDetail !== false) {
        scrollTradeDetailIntoView()
      }
    },
    [scrollTradeDetailIntoView],
  )

  const handleApartmentCardOpen = useCallback(
    (apartment: Apartment) => {
      const [marker] = apartmentMarkers([apartment], latestApartmentDeals)

      if (!marker) return

      setView('map')
      handleMapMarkerSelect(marker)
    },
    [handleMapMarkerSelect, latestApartmentDeals],
  )

  useEffect(() => {
    if (!focusApartment) return

    const [marker] = apartmentMarkers([focusApartment], latestApartmentDeals)
    if (!marker) return

    const timerId = window.setTimeout(() => {
      setView('map')
      handleMapMarkerSelect(marker, { scrollToDetail: false })
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [focusApartment, handleMapMarkerSelect, latestApartmentDeals])

  const fetchRtmsDeals = useCallback(async (signal?: AbortSignal) => {
    if (signal?.aborted) return

    setRtmsStatus((current) => (current === 'refreshing' ? 'refreshing' : 'loading'))
    setRtmsError('')
    try {
      const response = await fetch(
        `/api/rtms/apt-trades?scope=${rtmsScope}&dealYmd=${defaultDealYmd}&monthsBack=3&numOfRows=1000&limit=50000`,
        signal ? { signal } : undefined,
      )
      const payload = (await response.json()) as RtmsResponse | { error?: string }

      if (!response.ok || 'error' in payload) {
        throw new Error('error' in payload ? payload.error : 'RTMS API 호출 실패')
      }

      const rtmsPayload = payload as RtmsResponse
      setRtmsData(rtmsPayload)
      onLiveDealsChange(rtmsPayload.deals)
      setRtmsStatus(rtmsPayload.meta.resultCode === 'REFRESHING' ? 'refreshing' : 'ready')

      if (rtmsPayload.meta.resultCode === 'REFRESHING') {
        if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current)
        retryTimerRef.current = window.setTimeout(() => {
          setSyncTick((tick) => tick + 1)
        }, 12000)
      }
    } catch (error) {
      if (signal?.aborted) return
      const message = error instanceof Error ? error.message : 'RTMS API 호출 실패'
      console.warn(message)
      setRtmsStatus('error')
      setRtmsError(message)
    }
  }, [defaultDealYmd, onLiveDealsChange, rtmsScope])

  const fetchServerMapMarkers = useCallback(async (signal?: AbortSignal) => {
    if (signal?.aborted) return

    try {
      const response = await fetch(
        `/api/rtms/map-markers?scope=${rtmsScope}&dealYmd=${defaultDealYmd}&monthsBack=36&limit=5000&geocodeLimit=500`,
        signal ? { signal } : undefined,
      )
      const payload = (await response.json()) as RtmsMapMarkerResponse | { error?: string }

      if (!response.ok && !('markers' in payload)) {
        throw new Error('error' in payload ? payload.error : '지도 마커 캐시 호출 실패')
      }

      if (!('markers' in payload)) return

      setServerMapMarkers(payload.markers)
      setMapMarkerNotice(
        payload.markers.length > 0
          ? ''
          : payload.meta.needsKakaoRestApiKey
            ? 'Render의 jipjiggu 서비스 환경변수에 KAKAO_REST_API_KEY가 연결되면 서울·경기·인천 단지 좌표 캐시가 생성됩니다. 환경변수 그룹만 만들었다면 서비스에 연결해 주세요.'
            : payload.meta.resultMessage || '',
      )

      const markerDeals = dedupeDeals(payload.markers.flatMap((marker) => marker.relatedDeals ?? []))
      if (markerDeals.length > 0 && liveDeals.length === 0) {
        onLiveDealsChange(markerDeals)
      }

      if (payload.meta.resultCode === 'REFRESHING' || payload.meta.resultCode === 'PARTIAL') {
        if (markerRetryTimerRef.current) window.clearTimeout(markerRetryTimerRef.current)
        markerRetryTimerRef.current = window.setTimeout(() => {
          setSyncTick((tick) => tick + 1)
        }, payload.markers.length > 0 ? 45000 : 12000)
      }
    } catch (error) {
      if (signal?.aborted) return
      console.warn(error instanceof Error ? error.message : '지도 마커 캐시 호출 실패')
    }
  }, [defaultDealYmd, liveDeals.length, onLiveDealsChange, rtmsScope])

  useEffect(() => {
    const controller = new AbortController()
    const initialTimer = window.setTimeout(() => {
      void fetchRtmsDeals(controller.signal)
      void fetchServerMapMarkers(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(initialTimer)
      controller.abort()
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current)
        retryTimerRef.current = null
      }
      if (markerRetryTimerRef.current) {
        window.clearTimeout(markerRetryTimerRef.current)
        markerRetryTimerRef.current = null
      }
    }
  }, [fetchRtmsDeals, fetchServerMapMarkers, syncTick])

  useEffect(() => {
    let timerId: number

    const scheduleDailySync = () => {
      timerId = window.setTimeout(() => {
        setSyncTick((tick) => tick + 1)
        scheduleDailySync()
      }, getMsUntilNextDailySync(1))
    }

    scheduleDailySync()

    return () => window.clearTimeout(timerId)
  }, [])

  return (
    <div className="view-stack price-view">
      <div className="section-title">
        <div>
          <span>실거래가</span>
          <h2>서울·경기·인천 실제 API 지도</h2>
        </div>
        <div className="view-switch" aria-label="보기 방식">
          <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')} type="button">
            지도
          </button>
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} type="button">
            목록
          </button>
        </div>
      </div>

      <div className="region-scroll" aria-label="지역 필터">
        {regionOptions.map((region) => (
          <button
            key={region}
            className={selectedRegion === region ? 'region-chip active' : 'region-chip'}
            onClick={() => setSelectedRegion(region)}
            type="button"
          >
            {region}
          </button>
        ))}
      </div>

      {view === 'map' ? (
        <ApartmentMap
          liveDeals={mapDeals}
          serverMarkers={filteredServerMapMarkers}
          apartments={mapApartmentCandidates}
          latestApartmentDeals={latestApartmentDeals}
          activeFilterCount={activeFilterCount}
          userListings={userListings}
          focusListing={focusListing}
          focusLiveDeal={focusLiveDeal}
          rtmsStatus={rtmsStatus}
          rtmsError={rtmsError}
          mapMarkerNotice={mapMarkerNotice}
          onFilterClick={() => setFilterOpen(true)}
          selectedMarker={selectedMapMarker}
          onSelectMarker={handleMapMarkerSelect}
          onClearMarker={() => setSelectedMapMarker(null)}
        />
      ) : (
        <div className="apartment-list">
          {apartments.map((apartment) => (
            <ApartmentCard
              key={`${apartment.name}-${apartment.pyeong}`}
              apartment={apartment}
              onOpenDetail={handleApartmentCardOpen}
            />
          ))}
        </div>
      )}

      <div className="insight-strip">
        <div>
          <span>평균 거래가</span>
          <strong>{formatEok(filteredLiveDeals.length ? liveAverage : latestAverage)}</strong>
        </div>
        <div>
          <span>필터 결과</span>
          <strong>{rtmsData ? `${filteredLiveDeals.length}건` : `${totalVolume}건`}</strong>
        </div>
        <div>
          <span>직거래</span>
          <strong>{rtmsData ? `${filteredLiveDeals.filter((deal) => deal.tradeType === 'direct').length}건` : '확인중'}</strong>
        </div>
      </div>

      {filterOpen && (
        <MapFilterSheet
          filters={mapFilters}
          resultCount={filteredLiveDeals.length}
          onChange={setMapFilters}
          onReset={() => setMapFilters(defaultMapFilters)}
          onClose={() => setFilterOpen(false)}
        />
      )}
    </div>
  )
}

function MapFilterSheet({
  filters,
  resultCount,
  onChange,
  onReset,
  onClose,
}: {
  filters: MapFilterState
  resultCount: number
  onChange: (filters: MapFilterState) => void
  onReset: () => void
  onClose: () => void
}) {
  const updateFilter = <Key extends keyof MapFilterState>(key: Key, value: MapFilterState[Key]) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <section className="map-filter-sheet" aria-label="실거래가 상세 필터">
      <div className="filter-sheet-card">
        <div className="filter-sheet-head">
          <div>
            <span>상세 필터</span>
            <h3>조건에 맞는 실거래 검색</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="필터 닫기">
            닫기
          </button>
        </div>

        <div className="filter-control-grid">
          {mapFilterGroups.map((group) => (
            <label className="filter-control" key={group.key}>
              <span>{group.label}</span>
              <select
                value={filters[group.key]}
                onChange={(event) =>
                  updateFilter(group.key, event.target.value as MapFilterState[typeof group.key])
                }
              >
                {group.options.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="filter-extra-grid" aria-label="추가 필터 항목">
          {['용적률', '건폐율', '임대사업율', '월세수익률', '현관구조', '난방방식'].map((label) => (
            <button type="button" key={label}>
              {label}
            </button>
          ))}
        </div>

        <div className="filter-sheet-actions">
          <button type="button" onClick={onReset}>
            초기화
          </button>
          <button type="button" onClick={onClose}>
            {resultCount}건 보기
          </button>
        </div>
      </div>
    </section>
  )
}

const apartmentMarkers = (
  apartments: Apartment[],
  latestDealsByApartment: Record<string, LiveRtmsDeal> = {},
): MapValueMarker[] =>
  apartments.flatMap((apartment) => {
    const officialDeal = latestDealsByApartment[apartment.name]
    const latestDeal = apartment.recentDeals[0]

    if (apartment.mapOnly && !officialDeal && !latestDeal) {
      return []
    }

    const markerDealDate = officialDeal?.dealDate ?? (latestDeal ? `20${latestDeal.date.replaceAll('.', '-')}` : undefined)
    const markerPyeong = officialDeal ? `${officialDeal.pyeong}평` : apartment.pyeong
    const hasTradeSnapshot = Boolean(officialDeal || latestDeal)
    const curatedDeals = apartment.recentDeals.map((deal, index) => ({
      id: `${apartment.name}-${deal.date}-${index}`,
      aptSeq: apartment.name,
      aptName: apartment.name,
      address: apartment.region,
      legalDong: apartment.region.split(' ').at(-1) ?? '',
      jibun: '',
      umdCd: '',
      bonbun: '',
      bubun: '',
      landCd: '1',
      lawdCd: getLawdCdFromRegion(apartment.region),
      district: apartment.region.split(' ').slice(0, 2).join(' '),
      dealDate: `20${deal.date.replaceAll('.', '-')}`,
      priceEok: deal.priceEok,
      areaM2: 0,
      pyeong: Number(apartment.pyeong.replace('평', '')),
      floor: 0,
      buildYear: apartment.approvalYear,
      tradeType: 'brokered' as const,
      tradeTypeLabel: '참고 거래',
      buyerType: '',
      sellerType: '',
      status: 'active' as const,
      registeredAt: '',
    }))

    return {
      id: apartment.name,
      label: hasTradeSnapshot ? '매매' : '단지',
      aptName: apartment.name,
      address: apartment.region,
      lawdCd: officialDeal?.lawdCd ?? getLawdCdFromRegion(apartment.region),
      aptSeq: officialDeal?.aptSeq,
      dealDate: markerDealDate,
      tradeTypeLabel: officialDeal?.tradeTypeLabel ?? (latestDeal ? '최근 거래' : '기본 스펙'),
      priceEok: officialDeal?.priceEok ?? apartment.priceEok,
      dateLabel: formatMarkerMonth(markerDealDate),
      subLabel: markerPyeong,
      lat: apartment.lat,
      lng: apartment.lng,
      tone: officialDeal ? (officialDeal.tradeType === 'direct' ? 'direct' : 'sale') : latestDeal ? 'sale' : 'office',
      apartment,
      relatedDeals: dedupeDeals(officialDeal ? [officialDeal, ...curatedDeals] : curatedDeals),
    }
  })

const createValueMarkerElement = (marker: MapValueMarker, onSelect: () => void) => {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `map-value-marker ${marker.tone}`
  button.setAttribute('aria-label', `${marker.label} ${formatEok(marker.priceEok)} ${marker.subLabel}`)
  button.addEventListener('click', onSelect)

  const label = document.createElement('span')
  label.className = 'marker-kind'
  label.textContent = marker.label

  const price = document.createElement('strong')
  price.textContent = formatEok(marker.priceEok)

  const date = document.createElement('small')
  date.className = 'marker-date'
  date.textContent = marker.dateLabel || formatMarkerMonth(marker.dealDate)

  const sub = document.createElement('em')
  sub.textContent = marker.subLabel

  button.append(label, price, date, sub)
  return button
}

const MAX_GEOCODED_TRADE_MARKERS = 1200

const geocodeDealMarkers = async (
  kakao: KakaoNamespace,
  deals: LiveRtmsDeal[],
): Promise<MapValueMarker[]> => {
  if (!kakao.maps.services || deals.length === 0) {
    return []
  }

  const geocoder = new kakao.maps.services.Geocoder()
  const statusOk = kakao.maps.services.Status.OK
  const groupedDeals = Array.from(
    deals
      .reduce((group, deal) => {
        const key = deal.aptSeq || `${deal.lawdCd}-${deal.legalDong}-${deal.aptName}-${deal.jibun}`
        group.set(key, [...(group.get(key) ?? []), deal])
        return group
      }, new Map<string, LiveRtmsDeal[]>())
      .entries(),
  )
    .map(([groupId, relatedDeals]) => {
      const history = dedupeDeals(relatedDeals)
      const latestDeal = history[0]

      return {
        id: groupId,
        latestDeal,
        hasDirectDeal: history.some((deal) => deal.tradeType === 'direct'),
        history,
      }
    })
    .sort((a, b) => dealTimestamp(b.latestDeal) - dealTimestamp(a.latestDeal))
    .slice(0, MAX_GEOCODED_TRADE_MARKERS)

  const markers: MapValueMarker[] = []

  for (let index = 0; index < groupedDeals.length; index += 12) {
    const batch = groupedDeals.slice(index, index + 12)
    const batchMarkers = await Promise.all(
      batch.map(
        ({ id, latestDeal, hasDirectDeal, history }) =>
          new Promise<MapValueMarker | null>((resolve) => {
            geocoder.addressSearch(latestDeal.address, (result, status) => {
              if (status !== statusOk || !result[0]) {
                resolve(null)
                return
              }

              resolve({
                id,
                label: hasDirectDeal ? '직거래' : '매매',
                aptName: latestDeal.aptName,
                address: latestDeal.address,
                lawdCd: latestDeal.lawdCd,
                aptSeq: latestDeal.aptSeq,
                dealDate: latestDeal.dealDate,
        tradeTypeLabel: `최근 거래 · ${history.length}건`,
        priceEok: latestDeal.priceEok,
        dateLabel: formatMarkerMonth(latestDeal.dealDate),
        subLabel: `${latestDeal.pyeong}평`,
        lat: Number(result[0].y),
        lng: Number(result[0].x),
                tone: hasDirectDeal ? 'direct' : 'sale',
                dealCount: history.length,
                relatedDeals: history,
                nearbyDeals: dedupeDeals(
                  deals.filter(
                    (candidate) =>
                      candidate.legalDong === latestDeal.legalDong &&
                      candidate.lawdCd === latestDeal.lawdCd &&
                      candidate.aptSeq !== latestDeal.aptSeq,
                  ),
                ),
              })
            })
          }),
      ),
    )

    markers.push(...batchMarkers.filter((marker): marker is MapValueMarker => Boolean(marker)))
  }

  return markers
}

const geocodeListingMarkers = async (
  kakao: KakaoNamespace,
  listings: UserListing[],
): Promise<MapValueMarker[]> => {
  if (!kakao.maps.services || listings.length === 0) {
    return []
  }

  const geocoder = new kakao.maps.services.Geocoder()
  const statusOk = kakao.maps.services.Status.OK
  const markers = await Promise.all(
    listings.map(
      (listing) =>
        new Promise<MapValueMarker | null>((resolve) => {
          geocoder.addressSearch(listing.address, (result, status) => {
            if (status !== statusOk || !result[0]) {
              resolve(null)
              return
            }

            resolve({
              id: `listing-${listing.id}`,
              label: '매물',
              aptName: listing.aptName,
              address: listing.address,
            tradeTypeLabel: formatListingStatus(listing.verificationStatus),
            priceEok: listing.priceEok,
            dateLabel: '매물',
            subLabel: `${listing.pyeong}평`,
            lat: Number(result[0].y),
            lng: Number(result[0].x),
              tone: 'listing',
              relatedDeals: [],
              listing,
            })
          })
        }),
    ),
  )

  return markers.filter((marker): marker is MapValueMarker => Boolean(marker))
}

function ApartmentMap({
  liveDeals,
  serverMarkers,
  apartments,
  latestApartmentDeals,
  activeFilterCount,
  userListings,
  focusListing,
  focusLiveDeal,
  rtmsStatus,
  rtmsError,
  mapMarkerNotice,
  onFilterClick,
  selectedMarker,
  onSelectMarker,
  onClearMarker,
}: {
  liveDeals: LiveRtmsDeal[]
  serverMarkers: MapValueMarker[]
  apartments: Apartment[]
  latestApartmentDeals: Record<string, LiveRtmsDeal>
  activeFilterCount: number
  userListings: UserListing[]
  focusListing: UserListing | null
  focusLiveDeal: LiveRtmsDeal | null
  rtmsStatus: RtmsStatus
  rtmsError: string
  mapMarkerNotice: string
  onFilterClick: () => void
  selectedMarker: MapValueMarker | null
  onSelectMarker: (marker: MapValueMarker, options?: { scrollToDetail?: boolean }) => void
  onClearMarker: () => void
}) {
  const mapNode = useRef<HTMLDivElement | null>(null)
  const kakaoMapRef = useRef<KakaoMapInstance | null>(null)
  const selectedMarkerRef = useRef<MapValueMarker | null>(selectedMarker)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(false)
  const kakaoKey = getKakaoMapKey()

  useEffect(() => {
    selectedMarkerRef.current = selectedMarker
  }, [selectedMarker])

  useEffect(() => {
    if (!selectedMarker || !window.kakao?.maps || !kakaoMapRef.current) return

    const position = new window.kakao.maps.LatLng(selectedMarker.lat, selectedMarker.lng)
    kakaoMapRef.current.setCenter(position)
    kakaoMapRef.current.setLevel(4)
  }, [selectedMarker])

  useEffect(() => {
    if (!kakaoKey || !mapNode.current) {
      setMapError(true)
      return
    }

    let disposed = false
    let cleanup: (() => void) | undefined

    ensureKakaoMapSdk(kakaoKey)
      .then(async () => {
        if (!mapNode.current || !window.kakao?.maps) return

        const kakao = window.kakao
        const center = new kakao.maps.LatLng(37.5075, 127.0046)
        const map = new kakao.maps.Map(mapNode.current, {
          center,
          level: 5,
        })
        kakaoMapRef.current = map

        const [liveMarkers, listingMarkers] = await Promise.all([
          serverMarkers.length > 0 ? Promise.resolve(serverMarkers) : geocodeDealMarkers(kakao, liveDeals),
          geocodeListingMarkers(kakao, userListings),
        ])
        if (disposed) return

        const liveMarkerNames = new Set(liveMarkers.map((marker) => normalizeSearchText(marker.aptName)))
        const specMarkers = apartmentMarkers(apartments, latestApartmentDeals).filter(
          (marker) => !liveMarkerNames.has(normalizeSearchText(marker.aptName)),
        )
        const markers = [...listingMarkers, ...liveMarkers, ...specMarkers]
        if (markers.length === 0) {
          setMapReady(true)
          return
        }

        const markerNodes: HTMLElement[] = []
        const overlays = markers.map((marker) => {
          const position = new kakao.maps.LatLng(marker.lat, marker.lng)
          const content = createValueMarkerElement(marker, () => {
            onSelectMarker(marker)
            map.setCenter(position)
            map.setLevel(4)
          })
          markerNodes.push(content)

          const overlay = new kakao.maps.CustomOverlay({
            position,
            content,
            xAnchor: 0.5,
            yAnchor: 1,
          })
          overlay.setMap(map)
          return overlay
        })

        const focusedListingMarker = focusListing
          ? listingMarkers.find((marker) => marker.listing?.id === focusListing.id)
          : null
        const focusedLiveMarker = focusLiveDeal
          ? liveMarkers.find((marker) =>
              marker.relatedDeals.some(
                (deal) =>
                  deal.id === focusLiveDeal.id ||
                  (focusLiveDeal.aptSeq && deal.aptSeq === focusLiveDeal.aptSeq),
              ),
            )
          : null
        const primaryMarker = focusedListingMarker ?? focusedLiveMarker ?? markers[0]
        map.setCenter(new kakao.maps.LatLng(primaryMarker.lat, primaryMarker.lng))
        map.setLevel(4)

        const focusedMarker = focusedListingMarker ?? focusedLiveMarker
        if (focusedMarker && selectedMarkerRef.current?.id !== focusedMarker.id) {
          onSelectMarker(focusedMarker, { scrollToDetail: Boolean(focusListing) })
        }

        const updateDensity = () => {
          const compact = map.getLevel() >= 6 || (markers.length > 45 && map.getLevel() >= 4)
          markerNodes.forEach((node) => node.classList.toggle('compact', compact))
        }

        updateDensity()
        kakao.maps.event?.addListener(map, 'zoom_changed', updateDensity)

        setMapReady(true)
        cleanup = () => overlays.forEach((overlay) => overlay.setMap(null))
      })
      .catch(() => setMapError(true))

    return () => {
      disposed = true
      kakaoMapRef.current = null
      cleanup?.()
    }
  }, [apartments, focusListing, focusLiveDeal, kakaoKey, latestApartmentDeals, liveDeals, onSelectMarker, serverMarkers, userListings])

  const hasDisplayableMarkers =
    serverMarkers.length > 0 ||
    liveDeals.length > 0 ||
    userListings.length > 0 ||
    apartmentMarkers(apartments, latestApartmentDeals).length > 0
  const shouldShowMapStatus = !mapReady || mapError || (!hasDisplayableMarkers && rtmsStatus !== 'loading')

  return (
    <section className="map-panel">
      <div className="map-toolbar">
        <span>
          <MapPin size={14} />
          실제 API 거래
        </span>
        <em>{mapReady ? 'Kakao 지도' : '미리보기 지도'}</em>
      </div>

      <div className="map-canvas">
        <div ref={mapNode} className={mapReady ? 'kakao-map visible' : 'kakao-map'} />
        {shouldShowMapStatus && (
          <MapDataStatus status={rtmsStatus} error={rtmsError} mapError={mapError} notice={mapMarkerNotice} />
        )}
        <div className="map-filter-overlay" aria-label="지도 거래 필터">
          <button className="active" type="button">실거래</button>
          <button type="button">매매</button>
          <button type="button">임대</button>
          <button type="button" onClick={onFilterClick}>
            필터{activeFilterCount ? ` ${activeFilterCount}` : ''}
          </button>
        </div>
        <div className="map-side-tools" aria-label="지도 보기 옵션">
          <button type="button">거리</button>
          <button type="button">면적</button>
        </div>
        <button className="map-new-deal" type="button">
          주변 직거래 매물 보기
          <ChevronRight size={16} />
        </button>
      </div>

      {selectedMarker && <TradeInsightCard marker={selectedMarker} onClose={onClearMarker} />}
    </section>
  )
}

function MapDataStatus({
  status,
  error,
  mapError,
  notice,
}: {
  status: RtmsStatus
  error: string
  mapError: boolean
  notice: string
}) {
  return (
    <div className="map-data-status" aria-live="polite">
      <div className="map-river" />
      <div className="map-park park-a" />
      <div className="map-park park-b" />
      <div className="road road-main" />
      <div className="road road-cross" />
      <div className="road road-side" />
      <div className="map-data-message">
        <Building2 size={22} />
        <strong>
          {mapError
            ? 'Kakao 지도 도메인 등록 필요'
            : notice
              ? '지도 좌표 캐시 준비 필요'
            : status === 'loading'
              ? '서울·경기·인천 실거래 API 불러오는 중'
              : status === 'refreshing'
                ? '서울·경기·인천 실거래 캐시 수집중'
                : '표시할 실제 실거래가 없습니다'}
        </strong>
        <p>
          {mapError
            ? 'Kakao Developers의 JavaScript 키 Web 도메인에 https://jipjiggu.onrender.com 을 추가하면 지도가 표시됩니다.'
            : notice
              ? notice
            : status === 'error'
            ? error || '공공데이터포털 응답을 다시 확인하고 있습니다.'
            : status === 'refreshing'
              ? '매일 새벽 1시에 실제 RTMS 데이터를 캐시에 저장합니다. 오늘은 공공데이터 호출 한도 회복 후 자동 반영됩니다.'
            : '매일 새벽 1시에 서울·경기·인천 RTMS 캐시를 갱신합니다. 샘플 단지는 섞지 않습니다.'}
        </p>
      </div>
    </div>
  )
}

function useLatestApartmentDeals(apartments: Apartment[]) {
  const [latestDeals, setLatestDeals] = useState<Record<string, LiveRtmsDeal>>({})
  const requestedNamesRef = useRef(new Set<string>())
  const requestKey = useMemo(() => apartments.map((apartment) => apartment.name).join('|'), [apartments])

  useEffect(() => {
    if (apartments.length === 0) return

    let disposed = false

    const fetchLatestDeals = async () => {
      const candidates = apartments.filter((apartment) => {
        if (requestedNamesRef.current.has(apartment.name)) return false
        return Boolean(getLawdCdFromRegion(apartment.region))
      })

      for (let index = 0; index < candidates.length; index += 3) {
        if (disposed) return

        const batch = candidates.slice(index, index + 3)
        const entries = await Promise.all(
          batch.map(async (apartment) => {
            const lawdCd = getLawdCdFromRegion(apartment.region)

            try {
              const params = new URLSearchParams({
                lawdCd,
                aptName: apartment.name,
                monthsBack: '36',
              })
              const response = await fetch(`/api/rtms/latest-apartment-deal?${params.toString()}`)
              const payload = response.ok ? ((await response.json()) as LatestApartmentDealResponse) : null
              requestedNamesRef.current.add(apartment.name)

              return payload?.deal ? ([apartment.name, payload.deal] as const) : null
            } catch {
              return null
            }
          }),
        )

        if (disposed) return

        const resolvedEntries = entries.filter((entry): entry is readonly [string, LiveRtmsDeal] => Boolean(entry))
        if (resolvedEntries.length > 0) {
          setLatestDeals((current) => ({
            ...current,
            ...Object.fromEntries(resolvedEntries),
          }))
        }
      }
    }

    void fetchLatestDeals()

    return () => {
      disposed = true
    }
  }, [apartments, requestKey])

  return latestDeals
}

function useMarkerHistory(marker: MapValueMarker) {
  const seedDeals = useMemo(() => dedupeDeals(marker.relatedDeals), [marker])
  const [remoteHistory, setRemoteHistory] = useState<{
    markerId: string
    deals: LiveRtmsDeal[]
    status: 'ready' | 'fallback'
  } | null>(null)

  useEffect(() => {
    if (!marker.lawdCd || !marker.dealDate) {
      return
    }

    const controller = new AbortController()
    const selectedYmd = toDealYmd(marker.dealDate)
    const historyEndYmd = maxDealYmd(getDefaultRtmsDealYmd(), selectedYmd)
    const monthsBack = Math.min(getMonthCountFrom2022(historyEndYmd), 84)
    const officialAptSeq = marker.aptSeq && /^\d{5}-/.test(marker.aptSeq) ? marker.aptSeq : ''
    const normalizedMarkerName = normalizeApartmentName(marker.aptName)
    const compactMarkerName = normalizeSearchText(marker.aptName)

    const fetchHistory = async () => {
      try {
        const requestMonths = Array.from(
          new Set([monthsBack, Math.min(84, Math.max(monthsBack, 60)), 120].filter((month) => month <= 120)),
        )
        let remoteDeals: LiveRtmsDeal[] = []

        for (const requestMonth of requestMonths) {
          const response = await fetch(
            `/api/rtms/apt-trades?lawdCd=${marker.lawdCd}&dealYmd=${historyEndYmd}&monthsBack=${requestMonth}&numOfRows=1000&limit=8000`,
            { signal: controller.signal },
          )

          const payload = response.ok ? ((await response.json()) as RtmsResponse) : null
          remoteDeals =
            payload?.deals.filter((deal) => {
              if (officialAptSeq && deal.aptSeq === officialAptSeq) return true

              const dealName = normalizeApartmentName(deal.aptName)
              const compactDealName = normalizeSearchText(deal.aptName)
              return (
                dealName.includes(normalizedMarkerName) ||
                normalizedMarkerName.includes(dealName) ||
                compactDealName.includes(compactMarkerName) ||
                compactMarkerName.includes(compactDealName)
              )
            }) ?? []

          if (remoteDeals.length > seedDeals.length || remoteDeals.length >= 3) break
        }

        if (!controller.signal.aborted) {
          setRemoteHistory({
            markerId: marker.id,
            deals: dedupeDeals([...remoteDeals, ...seedDeals]),
            status: 'ready',
          })
        }
      } catch {
        if (!controller.signal.aborted) {
          setRemoteHistory({
            markerId: marker.id,
            deals: seedDeals,
            status: 'fallback',
          })
        }
      }
    }

    fetchHistory()

    return () => controller.abort()
  }, [marker, seedDeals])

  const isCurrent = remoteHistory?.markerId === marker.id

  return {
    history: isCurrent ? remoteHistory.deals : seedDeals,
    status: isCurrent ? remoteHistory.status : marker.lawdCd ? 'loading' : 'fallback',
  }
}

function useBuildingLedger(marker: MapValueMarker, latestDeal: LiveRtmsDeal | undefined) {
  const requestDeal = latestDeal ?? marker.relatedDeals[0]
  const requestKey = requestDeal
    ? [
        requestDeal.lawdCd,
        requestDeal.umdCd,
        requestDeal.landCd,
        requestDeal.bonbun,
        requestDeal.bubun,
        requestDeal.aptSeq,
      ].join('-')
    : marker.id
  const [ledgerState, setLedgerState] = useState<{
    requestKey: string
    status: 'ready' | 'fallback' | 'error'
    payload: BuildingLedgerResponse | null
  } | null>(null)

  useEffect(() => {
    if (!requestDeal?.lawdCd || !requestDeal.umdCd) {
      return
    }

    const controller = new AbortController()
    const params = new URLSearchParams({
      lawdCd: requestDeal.lawdCd,
      umdCd: requestDeal.umdCd,
      landCd: requestDeal.landCd || '1',
      bonbun: requestDeal.bonbun || '0000',
      bubun: requestDeal.bubun || '0000',
      aptName: marker.aptName,
      address: marker.address,
      buildYear: String(requestDeal.buildYear || 0),
    })

    const fetchLedger = async () => {
      try {
        const response = await fetch(`/api/building/ledger?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('건축물대장 API 호출 실패')
        }

        const payload = (await response.json()) as BuildingLedgerResponse
        if (!controller.signal.aborted) {
          setLedgerState({
            requestKey,
            status: payload.meta.isFallback ? 'fallback' : 'ready',
            payload,
          })
        }
      } catch {
        if (!controller.signal.aborted) {
          setLedgerState({
            requestKey,
            status: 'error',
            payload: null,
          })
        }
      }
    }

    fetchLedger()

    return () => controller.abort()
  }, [marker.address, marker.aptName, requestDeal, requestKey])

  const isCurrent = ledgerState?.requestKey === requestKey

  return isCurrent
    ? ledgerState
    : {
        requestKey,
        status: requestDeal?.lawdCd ? ('loading' as const) : ('fallback' as const),
        payload: null,
      }
}

function RoadviewPanel({ marker }: { marker: MapValueMarker }) {
  const roadviewNode = useRef<HTMLDivElement | null>(null)
  const [roadviewStatus, setRoadviewStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading')
  const kakaoKey = getKakaoMapKey()

  useEffect(() => {
    if (!kakaoKey || !roadviewNode.current) {
      return
    }

    let disposed = false

    ensureKakaoMapSdk(kakaoKey)
      .then(() => {
        if (!roadviewNode.current || !window.kakao?.maps || disposed) return

        const kakao = window.kakao
        const position = new kakao.maps.LatLng(marker.lat, marker.lng)
        const roadview = new kakao.maps.Roadview(roadviewNode.current)
        const roadviewClient = new kakao.maps.RoadviewClient()

        roadviewClient.getNearestPanoId(position, 80, (panoId) => {
          if (disposed) return

          if (!panoId) {
            setRoadviewStatus('empty')
            return
          }

          roadview.setPanoId(panoId, position)
          window.setTimeout(() => roadview.relayout?.(), 120)
          setRoadviewStatus('ready')
        })
      })
      .catch(() => {
        if (!disposed) setRoadviewStatus('error')
      })

    return () => {
      disposed = true
    }
  }, [kakaoKey, marker.lat, marker.lng])

  return (
    <section className="detail-section roadview-card" aria-label={`${marker.aptName} 로드뷰와 사진`}>
      <div className="detail-section-head">
        <span>
          <Camera size={15} />
          사진·로드뷰
        </span>
        <em>{roadviewStatus === 'ready' ? 'Kakao Roadview' : '주변 사진 확인'}</em>
      </div>
      <div className="roadview-frame">
        <div ref={roadviewNode} className={roadviewStatus === 'ready' ? 'roadview-node ready' : 'roadview-node'} />
        {roadviewStatus !== 'ready' && (
          <div className="roadview-fallback">
            <Eye size={24} />
            <strong>{roadviewStatus === 'loading' ? '로드뷰 찾는 중' : '로드뷰 준비중'}</strong>
            <p>{marker.address}</p>
          </div>
        )}
      </div>
      <div className="photo-chips">
        <span>외관 확인</span>
        <span>주변 도로</span>
        <span>역·상권 동선</span>
      </div>
    </section>
  )
}

function ListingMediaPanel({ marker }: { marker: MapValueMarker }) {
  const listing = marker.listing

  if (!listing) return null

  return (
    <section className="detail-section listing-detail-card" aria-label={`${marker.aptName} 등록 매물 정보`}>
      <div className="detail-section-head">
        <span>
          <ShieldCheck size={15} />
          안심 직거래 매물
        </span>
        <em>{formatListingStatus(listing.verificationStatus)}</em>
      </div>

      <div className="listing-detail-price">
        <div>
          <span>희망가</span>
          <strong>{formatEok(listing.priceEok)}</strong>
        </div>
        <div>
          <span>평형·층</span>
          <strong>
            {listing.pyeong}평 · {listing.floor}층
          </strong>
        </div>
      </div>

      <p className="listing-detail-address">
        {listing.address} · {listing.detailAddress}
      </p>
      <p className="listing-detail-memo">{listing.memo || '매도인이 사진과 설명을 등록한 직거래 매물입니다.'}</p>

      {listing.photos.length > 0 ? (
        <div className="listing-detail-photos" aria-label="매물 사진">
          {listing.photos.map((photo) => (
            <img key={photo.id} src={photo.dataUrl} alt={photo.name} />
          ))}
        </div>
      ) : (
        <div className="listing-photo-empty">
          <Camera size={18} />
          <span>사진 등록 대기</span>
        </div>
      )}

      <div className="owner-check-card">
        <strong>실소유자 확인 단계</strong>
        <p>등기부상 소유자, 연락처, 허위매물 여부를 중개사가 확인한 뒤 공개 상태로 전환합니다.</p>
      </div>
    </section>
  )
}

function BuildingLedgerPanel({
  marker,
  latestDeal,
}: {
  marker: MapValueMarker
  latestDeal: LiveRtmsDeal | undefined
}) {
  const ledgerState = useBuildingLedger(marker, latestDeal)
  const ledger = ledgerState.payload?.ledger
  const apartment = marker.apartment
  const householdFamilyValue = ledger
    ? [
        ledger.householdCount ? `${ledger.householdCount.toLocaleString('ko-KR')}세대` : '',
        ledger.familyCount ? `${ledger.familyCount.toLocaleString('ko-KR')}가구` : '',
      ]
        .filter(Boolean)
        .join(' / ') || '확인중'
    : apartment
      ? `${apartment.households.toLocaleString('ko-KR')}세대`
      : '확인중'
  const metrics = [
    ['주용도', ledger?.mainUsage || '공동주택'],
    [
      '승인일',
      ledger?.approvalDate || (latestDeal?.buildYear ? `${latestDeal.buildYear}` : apartment ? `${apartment.approvalYear}` : '확인중'),
    ],
    ['층수', ledger ? `${ledger.groundFloors || '-'}F / B${ledger.undergroundFloors || '-'}` : '확인중'],
    ['총 세대수/가구수', householdFamilyValue],
    ['용적률', ledger?.floorAreaRatio ? `${ledger.floorAreaRatio}%` : apartment ? `${apartment.floorAreaRatio}%` : '확인중'],
    [
      '주차',
      ledger?.parkingCount
        ? `${ledger.parkingCount.toLocaleString('ko-KR')}대`
        : apartment
          ? `${apartment.parkingSpaces.toLocaleString('ko-KR')}대`
          : '확인중',
    ],
  ]

  return (
    <section className="detail-section ledger-card" aria-label={`${marker.aptName} 건축물대장 정보`}>
      <div className="detail-section-head">
        <span>
          <FileText size={15} />
          집합건축물대장
        </span>
        <em>
          {ledgerState.status === 'loading'
            ? '조회중'
            : ledgerState.status === 'ready'
              ? '건축HUB'
              : '보완 필요'}
        </em>
      </div>

      <strong className="ledger-title">{ledger?.buildingName || marker.aptName}</strong>
      <p className="ledger-address">{ledger?.address || marker.address}</p>
      {ledger && (
        <div className="ledger-chips" aria-label="대장 구분">
          <span>{ledger.registerType}</span>
          <span>{ledger.registerKind}</span>
        </div>
      )}

      <div className="ledger-grid">
        {metrics.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

function AiTrendAnalysisPanel({
  marker,
  history,
}: {
  marker: MapValueMarker
  history: LiveRtmsDeal[]
}) {
  const ownTrend = calculateSixMonthChange(history)
  const nearbyDeals = marker.nearbyDeals ?? []
  const nearbyTrend = calculateNearbySixMonthChange(nearbyDeals)
  const nearbyComparisonNames = formatNearbyComparisonNames(nearbyDeals, marker.aptName)
  const gap = ownTrend && nearbyTrend !== null ? ownTrend.changeRate - nearbyTrend : null
  const directionLabel = ownTrend
    ? ownTrend.changeRate >= 0
      ? '상승'
      : '하락'
    : '확인중'
  const summary =
    ownTrend && gap !== null
      ? `${marker.aptName}은 최근 6개월 ${formatPercent(ownTrend.changeRate)} ${directionLabel}했고, 같은 동 비교군 평균보다 ${Math.abs(gap).toFixed(1)}%p ${gap >= 0 ? '더 강했습니다' : '약했습니다'}.`
      : ownTrend
        ? `${marker.aptName}은 최근 6개월 ${formatPercent(ownTrend.changeRate)} ${directionLabel}했습니다. 같은 동 비교군은 거래 표본을 더 모으는 중입니다.`
        : `${marker.aptName}은 최근 6개월 내 비교 가능한 거래가 충분하지 않아, 최신 실거래와 장기 추이를 함께 확인하는 중입니다.`

  return (
    <section className="detail-section ai-trend-card" aria-label={`${marker.aptName} AI 실거래가 추이 분석`}>
      <div className="detail-section-head">
        <span>
          <Sparkles size={15} />
          AI 실거래가 추이 분석
        </span>
        <em>6개월 비교</em>
      </div>

      <div className="ai-trend-summary">
        <strong>{summary}</strong>
        <p>
          인근 비교군{nearbyComparisonNames}은 같은 법정동 내 다른 아파트 실거래 사례를 기준으로 계산합니다.
        </p>
      </div>

      <div className="ai-trend-grid">
        <div>
          <span>이 단지</span>
          <strong>{ownTrend ? formatPercent(ownTrend.changeRate) : '확인중'}</strong>
        </div>
        <div>
          <span>인근 평균</span>
          <strong>{nearbyTrend !== null ? formatPercent(nearbyTrend) : '표본 부족'}</strong>
        </div>
        <div>
          <span>비교</span>
          <strong>{gap !== null ? `${gap >= 0 ? '+' : ''}${gap.toFixed(1)}%p` : '분석중'}</strong>
        </div>
      </div>
    </section>
  )
}

function ReviewsPanel({ marker }: { marker: MapValueMarker }) {
  const reviews = buildReviewNotes(marker)
  const [reviewer, setReviewer] = useState('')
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const canSubmitReview = reviewText.trim().length >= 5

  const handleSubmitReview = () => {
    if (!canSubmitReview) return

    void sendTelegramLead('review', {
      아파트: marker.aptName,
      주소: marker.address,
      작성자: reviewer.trim() || '익명',
      평점: rating.toFixed(1),
      후기: reviewText.trim(),
    })
    setSubmitted(true)
    setReviewText('')
  }

  return (
    <section className="detail-section reviews-card" aria-label={`${marker.aptName} 리뷰 및 후기`}>
      <div className="detail-section-head">
        <span>
          <MessageCircle size={15} />
          리뷰·후기
        </span>
        <em>베타 수집</em>
      </div>

      <div className="review-list">
        {reviews.map((review) => (
          <article key={review.author}>
            <div>
              <strong>{review.author}</strong>
              <span>
                <Star size={12} />
                {review.rating.toFixed(1)}
              </span>
            </div>
            <p>{review.text}</p>
          </article>
        ))}
      </div>

      <div className="review-compose">
        <div className="review-compose-row">
          <label>
            <span>이름</span>
            <input value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder="익명 가능" />
          </label>
          <label>
            <span>평점</span>
            <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
              {[5, 4.5, 4, 3.5, 3].map((score) => (
                <option key={score} value={score}>
                  {score.toFixed(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <span>리뷰 작성</span>
          <textarea
            value={reviewText}
            onChange={(event) => {
              setReviewText(event.target.value)
              setSubmitted(false)
            }}
            rows={3}
            placeholder="거주, 거래, 단지 분위기 등을 남겨주세요"
          />
        </label>
        <button className="secondary-action" type="button" disabled={!canSubmitReview} onClick={handleSubmitReview}>
          리뷰 보내기
        </button>
        {submitted && <p className="lead-success">리뷰가 접수되었습니다. 운영자가 확인 후 반영합니다.</p>}
      </div>
    </section>
  )
}

function TradeInsightCard({ marker, onClose }: { marker: MapValueMarker; onClose: () => void }) {
  const { history, status } = useMarkerHistory(marker)
  const listing = marker.listing
  const isSpecMarker = Boolean(marker.apartment) && marker.tradeTypeLabel === '기본 스펙'
  const chartSourceDeals = [...history]
    .filter((deal) => deal.dealDate >= '2022-01-01')
    .sort((a, b) => dealTimestamp(a) - dealTimestamp(b))
  const latestDeal = history[0]
  const chartDeals = chartSourceDeals.length ? chartSourceDeals : latestDeal ? [latestDeal] : []
  const prices = chartDeals.map((deal) => deal.priceEok)
  const minPrice = Math.min(...prices, marker.priceEok)
  const maxPrice = Math.max(...prices, marker.priceEok)
  const range = Math.max(maxPrice - minPrice, 0.1)
  const width = 320
  const height = 210
  const chartLeft = 36
  const chartRight = width - 18
  const chartTop = 30
  const chartBottom = height - 48
  const maxLabelY = chartTop - 8
  const dateLabelY = height - 12
  const minLabelY = chartBottom + (dateLabelY - chartBottom) / 2 + 5
  const firstChartDeal = chartDeals[0]
  const firstChartDate = firstChartDeal
    ? new Date(firstChartDeal.dealDate)
    : new Date(marker.dealDate ?? `${currentYear}-05-01`)
  const startDate = new Date(firstChartDate.getFullYear(), firstChartDate.getMonth(), 1)
  const fallbackLatestTime = marker.dealDate ? new Date(marker.dealDate).getTime() : new Date(`${currentYear}-01-01`).getTime()
  const latestTime = Math.max(
    ...chartDeals.map((deal) => dealTimestamp(deal)),
    latestDeal ? dealTimestamp(latestDeal) : fallbackLatestTime,
  )
  const currentChartTime = new Date('2026-05-01').getTime()
  const endBaseDate = new Date(Math.max(latestTime, currentChartTime))
  const endDate = new Date(endBaseDate.getFullYear(), endBaseDate.getMonth() + 1, 0)
  const startTime = startDate.getTime()
  const endTime = endDate.getTime()
  const timeRange = Math.max(endTime - startTime, 1)
  const monthSpan =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 + endDate.getMonth() - startDate.getMonth() + 1
  const tickInterval = monthSpan <= 8 ? 2 : monthSpan <= 18 ? 3 : monthSpan <= 36 ? 6 : 12
  const timeTicks: Date[] = []

  for (let date = new Date(startDate); date.getTime() <= endTime; date.setMonth(date.getMonth() + tickInterval)) {
    timeTicks.push(new Date(date))
  }

  const lastTick = timeTicks.at(-1)
  if (!lastTick || lastTick.getFullYear() !== endDate.getFullYear() || lastTick.getMonth() !== endDate.getMonth()) {
    timeTicks.push(new Date(endDate.getFullYear(), endDate.getMonth(), 1))
  }

  const formatTickLabel = (date: Date) =>
    monthSpan > 36
      ? String(date.getFullYear()).slice(2)
      : `${String(date.getFullYear()).slice(2)}.${String(date.getMonth() + 1).padStart(2, '0')}`
  const xForDate = (date: string) =>
    chartLeft + ((new Date(date).getTime() - startTime) / timeRange) * (chartRight - chartLeft)
  const points = chartDeals
    .map((deal) => {
      const x = xForDate(deal.dealDate)
      const y = chartBottom - ((deal.priceEok - minPrice) / range) * (chartBottom - chartTop)
      return `${x},${y}`
    })
    .join(' ')
  const latestChartDeal = chartDeals.at(-1)
  const trendSummary = latestChartDeal
    ? `${formatShortDate(latestChartDeal.dealDate)} · ${formatEok(latestChartDeal.priceEok)}`
    : `${formatShortDate(marker.dealDate ?? '')} · ${formatEok(marker.priceEok)}`

  return (
    <section id="trade-detail-panel" className="trade-detail" aria-label={`${marker.aptName} 실거래 상세`}>
      <div className="trade-detail-head">
        <div>
          <span>{listing ? '직거래 매물 상세' : isSpecMarker ? '단지 기본 스펙' : status === 'loading' ? '과거 추이 불러오는 중' : '실거래 상세'}</span>
          <h3>{marker.aptName}</h3>
          <p>{listing ? `${marker.address} · ${listing.detailAddress}` : marker.address}</p>
        </div>
        <button className="round-link" type="button" aria-label="상세 닫기" onClick={onClose}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="trade-summary-grid">
        <div>
          <span>{listing ? '희망가' : isSpecMarker ? '최근 기준가' : '최근 거래'}</span>
          <strong>{formatEok(latestDeal?.priceEok ?? marker.priceEok)}</strong>
        </div>
        <div>
          <span>평형</span>
          <strong>{listing ? `${listing.pyeong}평` : latestDeal ? `${latestDeal.pyeong}평` : marker.subLabel}</strong>
        </div>
        <div>
          <span>{listing ? '검증' : '구분'}</span>
          <strong>{listing ? formatListingStatus(listing.verificationStatus) : latestDeal?.tradeTypeLabel ?? marker.tradeTypeLabel ?? marker.label}</strong>
        </div>
      </div>

      {!listing && (
        <>
          <div className="trend-card">
            <div className="trend-card-head">
              <span>
                <LineChart size={15} />
                과거 매매 추이
              </span>
              <em>{trendSummary}</em>
            </div>

            <svg className="trend-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="과거 실거래가 추이">
              <line x1={chartLeft} y1={chartTop} x2={chartLeft} y2={chartBottom} />
              <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} />
              {timeTicks.map((date) => {
                const x = chartLeft + ((date.getTime() - startTime) / timeRange) * (chartRight - chartLeft)
                return (
                  <g key={`${date.getFullYear()}-${date.getMonth()}`} className="trend-year">
                    <line x1={x} y1={chartTop} x2={x} y2={chartBottom} />
                    <text x={x} y={dateLabelY}>
                      {formatTickLabel(date)}
                    </text>
                  </g>
                )
              })}
              {points && <polyline points={points} />}
              {chartDeals.map((deal, index) => {
                const point = points.split(' ')[index]
                const [cx, cy] = point.split(',').map(Number)
                return <circle key={deal.id} cx={cx} cy={cy} r={index === chartDeals.length - 1 ? 5 : 3.5} />
              })}
              <text className="trend-value-label" x={chartLeft} y={maxLabelY}>
                {formatEok(maxPrice)}
              </text>
              <text className="trend-value-label" x={chartLeft} y={minLabelY}>
                {formatEok(minPrice)}
              </text>
            </svg>
          </div>

          {history.length > 0 && (
            <div className="history-list">
              {history.slice(0, 5).map((deal) => (
                <article key={deal.id}>
                  <div>
                    <strong>{formatShortDate(deal.dealDate)}</strong>
                    <span>
                      {deal.pyeong}평 · {deal.floor || '-'}층 · {deal.tradeTypeLabel}
                    </span>
                  </div>
                  <b>{formatEok(deal.priceEok)}</b>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      <ListingMediaPanel marker={marker} />
      <RoadviewPanel marker={marker} />
      <BuildingLedgerPanel marker={marker} latestDeal={latestDeal} />
      {!listing && <AiTrendAnalysisPanel marker={marker} history={history} />}
      <ReviewsPanel marker={marker} />
    </section>
  )
}

function ApartmentCard({
  apartment,
  onOpenDetail,
}: {
  apartment: Apartment
  onOpenDetail: (apartment: Apartment) => void
}) {
  const delta = apartment.priceEok - apartment.previousEok
  const maxDealPrice = Math.max(...apartment.recentDeals.map((deal) => deal.priceEok))
  const minDealPrice = Math.min(...apartment.recentDeals.map((deal) => deal.priceEok))
  const openDetail = () => onOpenDetail(apartment)

  return (
    <article
      className="apartment-card"
      role="button"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openDetail()
        }
      }}
      aria-label={`${apartment.name} 실거래 상세 보기`}
    >
      <div className="card-main">
        <div className="apartment-heading">
          <div>
            <h3>{apartment.name}</h3>
            <p>
              {apartment.region} · {apartment.station}
            </p>
          </div>
          <button
            className="heart-button"
            aria-label={`${apartment.name} 저장`}
            type="button"
            onClick={(event) => event.stopPropagation()}
          >
            <Heart size={18} />
          </button>
        </div>

        <div className="price-row">
          <strong>{formatEok(apartment.priceEok)}</strong>
          <span>{apartment.pyeong}</span>
          <em>+{formatEok(delta)}</em>
        </div>

        <div className="deal-chart" aria-label={`${apartment.name} 최근 실거래`}>
          <div className="deal-bars" aria-hidden="true">
            {apartment.recentDeals.map((deal) => {
              const range = Math.max(maxDealPrice - minDealPrice, 0.1)
              const height = 42 + ((deal.priceEok - minDealPrice) / range) * 46
              return <span key={`${deal.date}-bar`} style={{ height: `${height}%` }} />
            })}
          </div>
          <div className="deal-grid">
            {apartment.recentDeals.map((deal) => (
              <div className="deal-item" key={deal.date}>
                <span>{deal.date}</span>
                <strong>{formatEok(deal.priceEok)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="complex-metrics" aria-label={`${apartment.name} 건축물대장 결합 정보`}>
          <span>{apartment.households.toLocaleString('ko-KR')}세대</span>
          <span>주차 {(apartment.parkingSpaces / apartment.households).toFixed(1)}대/세대</span>
          <span>용적률 {apartment.floorAreaRatio}%</span>
        </div>
      </div>

      <div className="card-footer">
        <span className="verified-badge">
          <BadgeCheck size={15} />
          {apartment.verified}
        </span>
        <button className="round-link" aria-label={`${apartment.name} 상세 보기`} type="button">
          <ChevronRight size={18} />
        </button>
      </div>
    </article>
  )
}

function AiView({
  income,
  assets,
  debt,
  preferredPyeong,
  maxSubwayMinutes,
  officeArea,
  maxCommuteMinutes,
  setIncome,
  setAssets,
  setDebt,
  setPreferredPyeong,
  setMaxSubwayMinutes,
  setOfficeArea,
  setMaxCommuteMinutes,
  minTradePriceEok,
  maxTradePriceEok,
  setMinTradePriceEok,
  setMaxTradePriceEok,
  budget,
  stretch,
  apartments,
}: {
  income: number
  assets: number
  debt: number
  preferredPyeong: number
  maxSubwayMinutes: number
  officeArea: OfficeArea
  maxCommuteMinutes: number
  setIncome: (value: number) => void
  setAssets: (value: number) => void
  setDebt: (value: number) => void
  setPreferredPyeong: (value: number) => void
  setMaxSubwayMinutes: (value: number) => void
  setOfficeArea: (value: OfficeArea) => void
  setMaxCommuteMinutes: (value: number) => void
  minTradePriceEok: number
  maxTradePriceEok: number
  setMinTradePriceEok: (value: number) => void
  setMaxTradePriceEok: (value: number) => void
  budget: number
  stretch: number
  apartments: RecommendedApartment[]
}) {
  const [hasSearched, setHasSearched] = useState(false)
  const searchResults = useMemo(() => (hasSearched ? apartments.slice(0, 5) : []), [apartments, hasSearched])

  const handleRecommendationSearch = () => {
    setHasSearched(true)
  }

  return (
    <div className="view-stack">
      <div className="section-title">
        <div>
          <span>AI 집추천</span>
          <h2>조건에 맞는 1~5순위 단지</h2>
        </div>
        <Sparkles size={22} />
      </div>

      <div className="input-grid">
        <NumberField label="연소득" value={income} unit="만원" onChange={setIncome} />
        <EokNumberField label="가용자산" valueManwon={assets} onChangeManwon={setAssets} />
        <NumberField label="기존부채" value={debt} unit="만원" onChange={setDebt} />
      </div>

      <section className="preference-panel" aria-label="아파트 추천 선호 조건">
        <div className="preference-head">
          <span>선호 조건</span>
          <strong>통근과 생활동선까지 반영</strong>
        </div>
        <div className="preference-grid">
          <SelectField
            label="직장권역"
            value={officeArea}
            options={officeAreaOptions.map((area) => ({ label: area, value: area }))}
            onChange={(value) => setOfficeArea(value as OfficeArea)}
          />
          <SelectField
            label="선호 평형"
            value={String(preferredPyeong)}
            options={pyeongPreferenceOptions.map((pyeong) => ({
              label: `${pyeong}평`,
              value: String(pyeong),
            }))}
            onChange={(value) => setPreferredPyeong(Number(value))}
          />
          <SelectField
            label="역 도보"
            value={String(maxSubwayMinutes)}
            options={subwayPreferenceOptions.map((minutes) => ({
              label: `${minutes}분 이내`,
              value: String(minutes),
            }))}
            onChange={(value) => setMaxSubwayMinutes(Number(value))}
          />
          <SelectField
            label="직장 거리"
            value={String(maxCommuteMinutes)}
            options={commutePreferenceOptions.map((minutes) => ({
              label: `${minutes}분 이내`,
              value: String(minutes),
            }))}
            onChange={(value) => setMaxCommuteMinutes(Number(value))}
          />
        </div>
        <div className="price-range-row" aria-label="실거래 가격대">
          <NumberField label="최소 가격" value={minTradePriceEok} unit="억" onChange={setMinTradePriceEok} />
          <NumberField label="최대 가격" value={maxTradePriceEok} unit="억" onChange={setMaxTradePriceEok} />
        </div>
      </section>

      <button className="primary-action ai-search-action" type="button" onClick={handleRecommendationSearch}>
        조건으로 검색하기
        <ChevronRight size={18} />
      </button>

      <section className="budget-band">
        <div>
          <span>보수 예산</span>
          <strong>{formatEok(budget)}</strong>
        </div>
        <div>
          <span>확장 예산</span>
          <strong>{formatEok(stretch)}</strong>
        </div>
      </section>

      <div className="recommend-list" aria-label="AI 집추천 결과">
        {!hasSearched && (
          <section className="recommend-empty">
            <Sparkles size={20} />
            <strong>조건을 고른 뒤 검색하기를 눌러주세요</strong>
            <p>예산, 가격대, 평형, 역 도보, 직장 거리 조건을 반영해 적합도 순으로 5개 단지를 보여드립니다.</p>
          </section>
        )}

        {hasSearched && searchResults.length === 0 && (
          <section className="recommend-empty">
            <Search size={20} />
            <strong>조건에 맞는 단지가 아직 없습니다</strong>
            <p>가격대를 조금 넓히거나 직장 거리·역 도보 조건을 완화해서 다시 검색해보세요.</p>
          </section>
        )}

        {hasSearched &&
          searchResults.map((apartment, index) => (
          <article className="recommend-card" key={`rec-${apartment.name}`}>
            <span className="rank-badge">{index + 1}순위</span>
            <div
              className="score-ring"
              style={{
                background: `conic-gradient(var(--accent) 0 ${apartment.recommendationScore}%, #e5eeec ${apartment.recommendationScore}% 100%)`,
              }}
            >
              <span>{apartment.recommendationScore}</span>
            </div>
            <div>
              <h3>
                {apartment.name} {apartment.pyeong}
              </h3>
              <p>
                {apartment.region} · {apartment.station} · {officeArea} {apartment.commuteToOffice}분
              </p>
              <div className="tag-row">
                {apartment.fitReasons.map((reason) => (
                  <span key={reason}>{reason}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="fine-print">
        추천은 입력값과 공개 실거래가 기반의 참고 정보입니다. 대출 가능 여부, 세금, 등기 권리관계는 별도 확인이 필요합니다.
      </p>
    </div>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ label: string; value: string }>
  onChange: (value: string) => void
}) {
  return (
    <label className="select-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function NumberField({
  label,
  value,
  unit,
  onChange,
}: {
  label: string
  value: number
  unit: string
  onChange: (value: number) => void
}) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <div>
        <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <em>{unit}</em>
      </div>
    </label>
  )
}

function EokNumberField({
  label,
  valueManwon,
  onChangeManwon,
}: {
  label: string
  valueManwon: number
  onChangeManwon: (value: number) => void
}) {
  const eokValue = Number((valueManwon / 10000).toFixed(1))

  return (
    <label className="number-field">
      <span>{label}</span>
      <div>
        <input
          type="number"
          min="0"
          step="0.1"
          value={eokValue}
          onChange={(event) => onChangeManwon(Math.round(Number(event.target.value) * 10000))}
        />
        <em>억원</em>
      </div>
    </label>
  )
}

function ListingView({
  salePrice,
  setSalePrice,
  brokerage,
  listingCandidates,
  onCreateListing,
}: {
  salePrice: number
  setSalePrice: (value: number) => void
  brokerage: { legalCapBothSides: number; jipjigguFee: number; savings: number }
  listingCandidates: ListingApartmentCandidate[]
  onCreateListing: (listing: UserListing) => void
}) {
  const [registrationOpen, setRegistrationOpen] = useState(false)
  const [aptName, setAptName] = useState('센트럴파크푸르지오써밋')
  const [address, setAddress] = useState('경기 과천시 부림동 96')
  const [buildingDong, setBuildingDong] = useState('101')
  const [unitHo, setUnitHo] = useState('1103')
  const [aptSearchFocused, setAptSearchFocused] = useState(false)
  const [listingPriceEok, setListingPriceEok] = useState(salePrice)
  const [listingPyeong, setListingPyeong] = useState(24)
  const [listingFloor, setListingFloor] = useState(11)
  const [ownerName, setOwnerName] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [memo, setMemo] = useState('실거주 관리 상태 양호, 잔금일 협의 가능합니다.')
  const [photos, setPhotos] = useState<UserListing['photos']>([])
  const steps = [
    { icon: LockKeyhole, title: '직접 탐색', detail: '매수인과 매도인이 매물과 조건을 직접 확인' },
    { icon: Building2, title: '위험 확인', detail: '공인중개사가 권리관계와 거래상 위험사항 사전 점검' },
    { icon: ClipboardCheck, title: '진위 검증', detail: '실소유자 일치 여부와 허위매물 여부 확인' },
    { icon: Landmark, title: '계약서 작성', detail: '중개상한 20% 수수료로 공인중개사와 계약서 작성' },
  ]
  const apartmentSuggestions = useMemo(() => {
    const normalized = normalizeSearchText(aptName)
    if (normalized.length < 2) return []

    return listingCandidates
      .filter(
        (candidate) =>
          candidate.searchText.includes(normalized) ||
          fuzzyIncludes(candidate.searchText, normalized) ||
          normalizeSearchText(candidate.name).includes(normalized),
      )
      .slice(0, 6)
  }, [aptName, listingCandidates])
  const normalizedBuildingDong = buildingDong.trim().replace(/동$/, '')
  const normalizedUnitHo = unitHo.trim().replace(/호$/, '')
  const detailAddress = `${normalizedBuildingDong}동 ${normalizedUnitHo}호`
  const canSubmitListing = Boolean(
    aptName.trim() &&
      address.trim() &&
      normalizedBuildingDong &&
      normalizedUnitHo &&
      listingPriceEok > 0,
  )

  const handleApartmentCandidateSelect = (candidate: ListingApartmentCandidate) => {
    setAptName(candidate.name)
    setAddress(candidate.address)
    if (candidate.pyeong) setListingPyeong(candidate.pyeong)
    if (candidate.latestPriceEok) {
      setListingPriceEok(Number(candidate.latestPriceEok.toFixed(1)))
      setSalePrice(Number(candidate.latestPriceEok.toFixed(1)))
    }
    setAptSearchFocused(false)
  }

  const handlePhotoChange = async (files: FileList | null) => {
    if (!files) return

    const selectedFiles = Array.from(files).slice(0, 6)
    const previews = await Promise.all(
      selectedFiles.map(
        (file) =>
          new Promise<UserListing['photos'][number]>((resolve) => {
            const reader = new FileReader()
            reader.onload = () =>
              resolve({
                id: `${file.name}-${file.lastModified}`,
                name: file.name,
                dataUrl: String(reader.result),
              })
            reader.readAsDataURL(file)
          }),
      ),
    )

    setPhotos(previews)
  }

  const handleSubmitListing = () => {
    if (!canSubmitListing) return

    onCreateListing({
      id: `${Date.now()}`,
      aptName: aptName.trim(),
      address: address.trim(),
      detailAddress: detailAddress.trim(),
      buildingDong: normalizedBuildingDong,
      unitHo: normalizedUnitHo,
      priceEok: listingPriceEok,
      pyeong: listingPyeong,
      floor: listingFloor,
      ownerName: ownerName.trim(),
      ownerPhone: ownerPhone.trim(),
      memo: memo.trim(),
      photos,
      verificationStatus: 'owner-checking',
      createdAt: new Date().toISOString(),
    })
    setRegistrationOpen(false)
  }

  return (
    <div className="view-stack">
      <div className="section-title">
        <div>
          <span>직거래</span>
          <h2>검증형 직거래로 안전하게 연결</h2>
        </div>
        <ShieldCheck size={22} />
      </div>

      <section className="service-model">
        <span>집직구 모델</span>
        <strong>직접 찾고, 공인중개사가 계약 전 위험을 확인합니다</strong>
        <p>
          매수인과 매도인이 직접 물건을 알아보고 계약하되, 계약 전 공인중개사가 거래 시 위험사항,
          실소유자 일치 여부, 허위매물 여부 등을 확인합니다. 계약서는 공인중개사와 함께 작성하고
          수수료는 중개보수 상한 대비 20% 수준으로 설계합니다.
        </p>
      </section>

      <section className="calculator-panel">
        <label htmlFor="direct-sale-price">거래금액</label>
        <div className="price-input-row">
          <input
            id="direct-sale-price"
            type="number"
            min="3"
            max="30"
            step="0.5"
            value={salePrice}
            onChange={(event) => setSalePrice(Number(event.target.value))}
          />
          <span>억원</span>
        </div>
        <input
          className="range"
          type="range"
          min="3"
          max="30"
          step="0.5"
          value={salePrice}
          onChange={(event) => setSalePrice(Number(event.target.value))}
          aria-label="거래금액 조절"
        />
      </section>

      <div className="savings-hero direct">
        <span>중개상한 대비 20% 계약 수수료</span>
        <strong>{formatManwon(brokerage.savings)}</strong>
        <p>{formatEok(salePrice)} 기준, 기존 중개보수 상한 대비 예상 절약액</p>
      </div>

      <div className="compare-grid">
        <div>
          <span>기존 중개</span>
          <strong>{formatManwon(brokerage.legalCapBothSides)}</strong>
        </div>
        <div>
          <span>집직구 계약</span>
          <strong>{formatManwon(brokerage.jipjigguFee)}</strong>
        </div>
      </div>

      <section className="listing-cta">
        <span>첫 거래 베타</span>
        <strong>매도인 수수료 0원 검토</strong>
        <p>초기 성공 사례 확보를 위해 서울·경기 검증 가능 매물을 우선 모집합니다.</p>
        <button className="primary-action" type="button" onClick={() => setRegistrationOpen(true)}>
          매물 등록 시작
          <ChevronRight size={18} />
        </button>
      </section>

      {registrationOpen && (
        <section className="listing-registration" aria-label="직거래 매물 등록">
          <div className="listing-registration-head">
            <div>
              <span>매물등록</span>
              <h3>매물 정보 입력 후 실소유자 확인으로 넘어갑니다</h3>
            </div>
            <strong>허위매물 차단</strong>
          </div>

          <div className="listing-form-grid">
            <label className="apartment-suggest-field">
              <span>아파트명</span>
              <div className="apartment-suggest-input">
                <Search size={18} />
                <input
                  value={aptName}
                  onChange={(event) => {
                    setAptName(event.target.value)
                    setAptSearchFocused(true)
                  }}
                  onFocus={() => setAptSearchFocused(true)}
                  onBlur={() => window.setTimeout(() => setAptSearchFocused(false), 140)}
                  placeholder="아파트명을 입력하세요"
                />
              </div>
              {aptSearchFocused && apartmentSuggestions.length > 0 && (
                <div className="listing-apartment-suggestions" role="listbox">
                  {apartmentSuggestions.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleApartmentCandidateSelect(candidate)}
                    >
                      <strong>{candidate.name}</strong>
                      <span>{candidate.address}</span>
                      <em>
                        {candidate.latestPriceEok ? formatEok(candidate.latestPriceEok) : '주소 확인'}
                        {candidate.pyeong ? ` · ${candidate.pyeong}평` : ''}
                        {candidate.latestDealDate ? ` · ${formatShortDate(candidate.latestDealDate)}` : ''}
                      </em>
                    </button>
                  ))}
                </div>
              )}
            </label>
            <label>
              <span>주소</span>
              <input value={address} onChange={(event) => setAddress(event.target.value)} />
            </label>
            <div className="listing-address-preview">
              <Building2 size={16} />
              <span>{address || '아파트를 선택하면 주소가 자동으로 들어갑니다'}</span>
            </div>
            <div className="listing-form-row compact">
              <label>
                <span>동</span>
                <input
                  inputMode="numeric"
                  value={buildingDong}
                  onChange={(event) => setBuildingDong(event.target.value)}
                  placeholder="101"
                />
                <em>동</em>
              </label>
              <label>
                <span>호수</span>
                <input
                  inputMode="numeric"
                  value={unitHo}
                  onChange={(event) => setUnitHo(event.target.value)}
                  placeholder="1103"
                />
                <em>호</em>
              </label>
            </div>
            <div className="listing-form-row">
              <label>
                <span>희망가</span>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={listingPriceEok}
                  onChange={(event) => setListingPriceEok(Number(event.target.value))}
                />
                <em>억원</em>
              </label>
              <label>
                <span>평형</span>
                <input
                  type="number"
                  min="1"
                  value={listingPyeong}
                  onChange={(event) => setListingPyeong(Number(event.target.value))}
                />
                <em>평</em>
              </label>
              <label>
                <span>층</span>
                <input
                  type="number"
                  value={listingFloor}
                  onChange={(event) => setListingFloor(Number(event.target.value))}
                />
                <em>층</em>
              </label>
            </div>
            <label>
              <span>소유자 성명</span>
              <input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} placeholder="검증용" />
            </label>
            <label>
              <span>연락처</span>
              <input value={ownerPhone} onChange={(event) => setOwnerPhone(event.target.value)} placeholder="검증용" />
            </label>
            <label>
              <span>매물 설명</span>
              <textarea value={memo} onChange={(event) => setMemo(event.target.value)} rows={3} />
            </label>
          </div>

          <label className="photo-uploader">
            <Camera size={18} />
            <span>사진 업로드</span>
            <input type="file" accept="image/*" multiple onChange={(event) => void handlePhotoChange(event.target.files)} />
          </label>

          {photos.length > 0 && (
            <div className="listing-photo-preview" aria-label="업로드 사진 미리보기">
              {photos.map((photo) => (
                <img key={photo.id} src={photo.dataUrl} alt={photo.name} />
              ))}
            </div>
          )}

          <div className="owner-verification-flow">
            <div className="active">
              <strong>1</strong>
              <span>매물정보 입력</span>
            </div>
            <div className="active">
              <strong>2</strong>
              <span>등기·실소유자 확인</span>
            </div>
            <div>
              <strong>3</strong>
              <span>지도 매물 노출</span>
            </div>
          </div>

          <p className="listing-register-note">
            등록 즉시 지도에는 노란 매물 박스로 반영하고, 실제 운영에서는 등기부·신분확인·소유자 일치 검증을 통과한 매물만 공개합니다.
          </p>

          <button
            className="primary-action"
            type="button"
            disabled={!canSubmitListing}
            onClick={handleSubmitListing}
          >
            실소유자 확인 단계로 이동
            <ChevronRight size={18} />
          </button>
        </section>
      )}

      <div className="safety-timeline">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <div className="timeline-step" key={step.title}>
              <span>
                <Icon size={18} />
              </span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </div>
              <CheckCircle2 size={18} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MembershipSignupCard() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [interest, setInterest] = useState('직거래 매물 알림')
  const [submitted, setSubmitted] = useState(false)
  const canSubmit = phone.trim().length >= 8

  const handleSubmit = () => {
    if (!canSubmit) return

    void sendTelegramLead('signup', {
      이름: name.trim() || '미입력',
      연락처: phone.trim(),
      관심서비스: interest,
    })
    setSubmitted(true)
  }

  return (
    <section className="membership-card" aria-label="집직구 회원가입">
      <div>
        <span>멤버십</span>
        <strong>직거래 매물 알림 받기</strong>
        <p>원하는 매물과 검증 진행 알림을 받을 연락처를 남겨주세요.</p>
      </div>
      <label>
        <span>이름</span>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="선택" />
      </label>
      <label>
        <span>연락처</span>
        <input
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value)
            setSubmitted(false)
          }}
          inputMode="tel"
          placeholder="010-0000-0000"
        />
      </label>
      <label>
        <span>관심 내용</span>
        <select value={interest} onChange={(event) => setInterest(event.target.value)}>
          <option>직거래 매물 알림</option>
          <option>내 집 추천 상담</option>
          <option>매도인 검증 매물 등록</option>
        </select>
      </label>
      <button className="secondary-action" type="button" disabled={!canSubmit} onClick={handleSubmit}>
        회원가입 알림 보내기
      </button>
      {submitted && <p className="lead-success">접수되었습니다. 새 매물과 상담 가능 여부를 확인해드릴게요.</p>}
    </section>
  )
}

function DirectListingsView({
  userListings,
  liveDeals,
  onRegister,
  onOpenListing,
  onOpenDeal,
}: {
  userListings: UserListing[]
  liveDeals: LiveRtmsDeal[]
  onRegister: () => void
  onOpenListing: (listing: UserListing) => void
  onOpenDeal: (deal: LiveRtmsDeal) => void
}) {
  const directDeals = useMemo(
    () =>
      liveDeals
        .filter((deal) => deal.tradeType === 'direct' && deal.status === 'active')
        .sort((a, b) => dealTimestamp(b) - dealTimestamp(a))
        .slice(0, 6),
    [liveDeals],
  )

  return (
    <div className="view-stack">
      <div className="section-title">
        <div>
          <span>직거래 매물보기</span>
          <h2>확인중 매물과 직거래 신고 사례를 함께 봅니다</h2>
        </div>
        <Store size={22} />
      </div>

      <section className="listing-market-hero">
        <span>집직구 안심 직거래</span>
        <strong>매도인이 올리고, 중개사가 실소유자와 허위매물을 확인합니다</strong>
        <p>등록 매물은 지도에 노란색 매물 박스로 표시되고, 확인 단계가 끝나면 공개 매물로 전환됩니다.</p>
        <button className="primary-action" type="button" onClick={onRegister}>
          매물 등록하기
          <ChevronRight size={18} />
        </button>
      </section>

      <MembershipSignupCard />

      <section className="listing-market-section" aria-label="등록된 직거래 매물">
        <div className="detail-section-head">
          <span>
            <ShieldCheck size={15} />
            등록된 매물
          </span>
          <em>{userListings.length ? `${userListings.length}건` : '모집중'}</em>
        </div>

        {userListings.length > 0 ? (
          <div className="listing-market-list">
            {userListings.map((listing) => (
              <button key={listing.id} type="button" onClick={() => onOpenListing(listing)}>
                <div>
                  <strong>{listing.aptName}</strong>
                  <span>
                    {listing.address} · {listing.pyeong}평 · {listing.floor}층
                  </span>
                  <em>{formatListingStatus(listing.verificationStatus)}</em>
                </div>
                <b>{formatEok(listing.priceEok)}</b>
              </button>
            ))}
          </div>
        ) : (
          <div className="listing-market-empty">
            <strong>아직 공개된 직거래 매물이 없습니다</strong>
            <span>첫 매물을 등록하면 실소유자 확인 후 지도에 노란 매물 박스로 노출됩니다.</span>
          </div>
        )}
      </section>

      <section className="listing-market-section" aria-label="최근 직거래 신고 사례">
        <div className="detail-section-head">
          <span>
            <BarChart3 size={15} />
            최근 직거래 신고 사례
          </span>
          <em>국토부 RTMS</em>
        </div>

        <div className="listing-market-list compact">
          {directDeals.length > 0 ? (
            directDeals.map((deal) => (
              <button key={deal.id} type="button" onClick={() => onOpenDeal(deal)}>
                <div>
                  <strong>{deal.aptName}</strong>
                  <span>
                    {deal.address} · {deal.pyeong}평 · {formatShortDate(deal.dealDate)}
                  </span>
                  <em>
                    {deal.buyerType} 매수 · {deal.sellerType} 매도
                  </em>
                </div>
                <b>{formatEok(deal.priceEok)}</b>
              </button>
            ))
          ) : (
            <div className="listing-market-empty">
              <strong>최근 직거래 신고 사례를 수집중입니다</strong>
              <span>새벽 1시 RTMS 캐시 갱신 후 직거래 신고 건이 있으면 자동 표시됩니다.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function InheritanceView() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [apartmentName, setApartmentName] = useState('반포자이')
  const [dongHo, setDongHo] = useState('')
  const [concern, setConcern] = useState('자녀 증여')
  const [desiredAppraisalEok, setDesiredAppraisalEok] = useState('18.5')
  const [inquiry, setInquiry] = useState('자녀 증여를 고민 중이고 세무상 인정 가능한 탁상 감정가 범위를 알고 싶습니다.')
  const [submitted, setSubmitted] = useState(false)
  const canSubmit = Boolean(
    phone.trim() &&
      apartmentName.trim() &&
      dongHo.trim() &&
      desiredAppraisalEok.trim() &&
      inquiry.trim().length >= 5,
  )

  const handleSubmit = () => {
    if (!canSubmit) return

    void sendTelegramLead('appraisal', {
      이름: name.trim() || '미입력',
      연락처: phone.trim(),
      아파트: apartmentName.trim(),
      동명호수: dongHo.trim(),
      문의유형: concern,
      감정희망금액: `${desiredAppraisalEok.trim()}억원`,
      문의사항: inquiry.trim(),
    })
    setSubmitted(true)
  }

  return (
    <div className="view-stack">
      <div className="section-title">
        <div>
          <span>상속증여상담</span>
          <h2>내 아파트 탁상 감정 무료 받아보기</h2>
        </div>
        <Calculator size={22} />
      </div>

      <section className="appraisal-hero">
        <span>무료 탁상 검토</span>
        <strong>동·호수와 희망 감정가를 남기면 협력 감정평가사에게 전달됩니다</strong>
        <p>자녀 증여, 상속 대비, 감정가 범위 고민을 남겨주시면 접수 내용을 확인해 연락드릴게요.</p>
      </section>

      <section className="appraisal-form" aria-label="탁상 감정 신청">
        <div className="listing-form-row compact">
          <label>
            <span>이름</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="선택" />
          </label>
          <label>
            <span>연락처</span>
            <input
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value)
                setSubmitted(false)
              }}
              inputMode="tel"
              placeholder="010-0000-0000"
            />
          </label>
        </div>

        <label>
          <span>아파트명</span>
          <input value={apartmentName} onChange={(event) => setApartmentName(event.target.value)} />
        </label>

        <div className="listing-form-row compact">
          <label>
            <span>동명호수</span>
            <input
              value={dongHo}
              onChange={(event) => {
                setDongHo(event.target.value)
                setSubmitted(false)
              }}
              placeholder="101동 1203호"
            />
          </label>
          <label>
            <span>감정희망금액</span>
            <input
              value={desiredAppraisalEok}
              onChange={(event) => {
                setDesiredAppraisalEok(event.target.value)
                setSubmitted(false)
              }}
              inputMode="decimal"
              placeholder="18.5"
            />
            <em>억원</em>
          </label>
        </div>

        <label>
          <span>문의 유형</span>
          <select value={concern} onChange={(event) => setConcern(event.target.value)}>
            <option>자녀 증여</option>
            <option>상속 대비</option>
            <option>공동명의·배우자 증여</option>
            <option>감정가 범위 확인</option>
          </select>
        </label>

        <label>
          <span>문의사항</span>
          <textarea
            value={inquiry}
            onChange={(event) => {
              setInquiry(event.target.value)
              setSubmitted(false)
            }}
            rows={4}
            placeholder="자녀 증여로 인한 고민, 나왔으면 하는 감정가 등을 적어주세요"
          />
        </label>

        <button className="primary-action" type="button" disabled={!canSubmit} onClick={handleSubmit}>
          탁상 감정 요청하기
          <ChevronRight size={18} />
        </button>

        {submitted && (
          <div className="appraisal-success" role="status">
            <BadgeCheck size={18} />
            <span>접수되었습니다. 협력 감정평가사에게 전달하고 확인 후 연락드릴게요.</span>
          </div>
        )}
      </section>

      <p className="fine-print">
        탁상 검토는 상담용 사전 안내입니다. 실제 세무상 시가 인정, 감정평가 가능 범위, 신고 전략은 감정평가사와
        세무 전문가 검토가 필요합니다.
      </p>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof TrendingUp
  label: string
  value: string
  tone: string
}) {
  return (
    <div className={`metric ${tone}`}>
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default App
