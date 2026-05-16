import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  BusFront,
  Calculator,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Eye,
  ExternalLink,
  FileText,
  Heart,
  Home,
  Landmark,
  LineChart,
  LockKeyhole,
  MapPin,
  MapPinned,
  MessageCircle,
  Plus,
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

type Mode = 'prices' | 'ai' | 'listing' | 'directListings' | 'inheritance' | 'report' | 'notifications'
const appModes: Mode[] = ['prices', 'ai', 'listing', 'directListings', 'inheritance', 'report', 'notifications']
const isAppMode = (value: unknown): value is Mode => typeof value === 'string' && appModes.includes(value as Mode)
type OfficeArea = '강남' | '여의도' | '광화문' | '판교'
type MapFilterState = {
  tradeType: 'all' | 'brokered' | 'direct'
  pyeong: 'all' | 'p25' | 'p34' | 'under25' | 'over40'
  price: 'all' | 'under5' | 'between5and10' | 'between10and20' | 'between20and40' | 'over40'
  subway: 'all' | 'within5' | 'within10' | 'within15'
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

type AiPreferenceKey = 'budget' | 'pyeong' | 'subway' | 'commute' | 'growth' | 'newness' | 'direct'
type TradePyeongBandKey = 'under20' | 'p20' | 'p25' | 'p34' | 'p40' | 'over50'

type RecommendedApartment = {
  name: string
  region: string
  station: string
  pyeong: string
  priceEok: number
  previousEok: number
  recentDeals: Array<{
    date: string
    priceEok: number
    pyeong?: number
    tradeTypeLabel?: string
  }>
  budgetDistance: number
  recommendationScore: number
  commuteToOffice: number
  commuteRouteUrl: string
  commuteSource: 'kakao-route-link' | 'estimated'
  upsideScore: number
  developmentSignals: string[]
  fitReasons: string[]
  source: 'rtms' | 'curated'
  oneYearGrowthRate: number | null
  latestDealDate: string
  dealCount: number
}

type DevelopmentIssue = {
  rank: number
  title: string
  area: string
  buzzScore: number
  progress: number
  activeStageIndex: number
  expectedYear: string
  plainBrief: string
  phase: string
  nextMilestone: string
  priceImpact: string
  affectedDongs: string[]
  relatedApartments: string[]
  keywords: string[]
  body: string
  timeline: Array<{
    label: string
    status: 'done' | 'active' | 'watch'
  }>
}

type ReportNewsItem = {
  title: string
  link: string
  source: string
  publishedAt: string
  keyword: string
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
  lat?: number
  lng?: number
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

type AppNotification = {
  id: string
  kind: 'weekly-report' | 'system'
  title: string
  body: string
  region?: string
  createdAt: string
  read: boolean
}

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
  getCenter: () => KakaoLatLng
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
type KakaoPlaceResult = {
  id?: string
  place_name: string
  address_name: string
  road_address_name?: string
  x: string
  y: string
}
type KakaoPlaces = {
  keywordSearch: (
    keyword: string,
    callback: (result: KakaoPlaceResult[], status: string) => void,
    options?: {
      location?: KakaoLatLng
      radius?: number
      size?: number
    },
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
    Places: new () => KakaoPlaces
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
  hasPrice?: boolean
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

const navItems: Array<{
  id: Mode
  label: string
  icon: typeof BarChart3
}> = [
  { id: 'prices', label: '지도', icon: MapPinned },
  { id: 'ai', label: 'AI추천', icon: Sparkles },
  { id: 'listing', label: '직거래', icon: ShieldCheck },
  { id: 'report', label: '리포트', icon: FileText },
  { id: 'inheritance', label: '증여', icon: Calculator },
]

const weeklyReportRegionOptions = [
  '안양시 동안구',
  '안양시 만안구',
  '의왕시',
  '과천시',
]

const weeklyReportRegionKeywords: Record<string, string[]> = {
  '안양시 동안구': ['안양시동안구', '동안구', '평촌', '범계', '호계', '신촌', '귀인', '달안', '부림', '갈산', '비산', '관양', '인덕원'],
  '안양시 만안구': ['안양시만안구', '만안구', '안양동', '석수', '박달'],
  의왕시: ['의왕', '내손', '포일', '오전', '청계', '백운'],
  과천시: ['과천', '별양', '부림', '원문', '중앙', '갈현', '문원'],
}

const developmentStageLabels = ['이슈화', '계획', '인허가', '착공·공사', '완공·반영']

const officeAreaOptions: OfficeArea[] = ['강남', '여의도', '광화문', '판교']
const officeAreaDestinations: Record<OfficeArea, { name: string; lat: number; lng: number }> = {
  강남: { name: '강남역', lat: 37.4979, lng: 127.0276 },
  여의도: { name: '여의도역', lat: 37.5216, lng: 126.9243 },
  광화문: { name: '광화문역', lat: 37.5716, lng: 126.9769 },
  판교: { name: '판교역', lat: 37.3948, lng: 127.1112 },
}
const pyeongPreferenceOptions = [25, 32, 34, 40]
const subwayPreferenceOptions = [5, 8, 10, 15]
const commutePreferenceOptions = [20, 30, 40, 60]
const aiPreferenceOptions: Array<{ value: AiPreferenceKey; label: string; shortLabel: string }> = [
  { value: 'budget', label: '예산 적합도', shortLabel: '예산' },
  { value: 'pyeong', label: '선호 평형', shortLabel: '평형' },
  { value: 'subway', label: '역과의 거리', shortLabel: '역세권' },
  { value: 'commute', label: '직장과의 거리', shortLabel: '직장' },
  { value: 'growth', label: '최근 1년 상승률', shortLabel: '상승률' },
  { value: 'newness', label: '입주년차', shortLabel: '연식' },
  { value: 'direct', label: '직거래 사례', shortLabel: '직거래' },
]
const aiPreferenceLabelByKey = aiPreferenceOptions.reduce(
  (labels, option) => ({ ...labels, [option.value]: option.shortLabel }),
  {} as Record<AiPreferenceKey, string>,
)
const defaultMapFilters: MapFilterState = {
  tradeType: 'all',
  pyeong: 'all',
  price: 'all',
  subway: 'all',
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
    label: '거래금액대',
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
    key: 'subway',
    label: '역과의 거리',
    options: [
      ['all', '전체'],
      ['within5', '5분 이내'],
      ['within10', '10분 이내'],
      ['within15', '15분 이내'],
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
  '평촌·만안·과천·의왕': 'pyeongchon-core',
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
const formatMarkerPrice = (marker: MapValueMarker) =>
  marker.hasPrice === false || marker.priceEok <= 0 ? '' : formatEok(marker.priceEok)
const hasDisplayableMarkerPrice = (marker: MapValueMarker) => formatMarkerPrice(marker).length > 0
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
const formatKoreanDateTime = (date: string | number) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(typeof date === 'number' ? new Date(date) : new Date(date))
const formatReportDateRange = (startTime: number, endTime: number) => {
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  })
  return `${formatter.format(new Date(startTime))}~${formatter.format(new Date(endTime))}`
}
const matchesWeeklyReportRegion = (
  region: string,
  source: { aptName?: string; district?: string; legalDong?: string; address?: string },
) => {
  const keywords = weeklyReportRegionKeywords[region] ?? []
  const target = normalizeSearchText(
    `${source.aptName ?? ''} ${source.district ?? ''} ${source.legalDong ?? ''} ${source.address ?? ''}`,
  )

  return keywords.some((keyword) => target.includes(normalizeSearchText(keyword)))
}
const formatMarkerMonth = (date?: string) => {
  if (!date) return ''
  const normalized = date.includes('-') ? date : `20${date.replaceAll('.', '-')}`
  const [year, month] = normalized.split('-')
  return year && month ? `${year.slice(2)}.${month.padStart(2, '0')}` : ''
}
const parseDealTime = (date?: string) => {
  if (!date) return 0
  const normalized = date.includes('-') ? date : `20${date.replaceAll('.', '-')}`
  const time = new Date(`${normalized}T00:00:00+09:00`).getTime()
  return Number.isNaN(time) ? 0 : time
}
const formatSignedRate = (rate: number) => `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`
const anyangDevelopmentNews: DevelopmentIssue[] = [
  {
    rank: 1,
    title: '인덕원 교통축',
    area: '관양·평촌·내손',
    buzzScore: 96,
    progress: 62,
    activeStageIndex: 3,
    expectedYear: '2028~2030 예상',
    plainBrief: '인덕원역 환승·공사 일정이 구체화되는지 확인 중입니다.',
    phase: '철도 3축 동시 체크',
    nextMilestone: '다음 확인: 역 위치, 환승 동선, 공사 일정',
    priceImpact: '인덕원역 반경 1km 단지는 매물 회전과 호가 반응을 주간 체크',
    affectedDongs: ['관양동', '평촌동', '내손동', '포일동'],
    relatedApartments: ['인덕원센트럴자이', '평촌더샵아이파크', '의왕내손e편한세상'],
    keywords: ['GTX-C', '월곶판교선', '동탄인덕원선'],
    body: '인덕원역 GTX-C, 월곶판교선, 동탄인덕원선 이슈는 관양·평촌·내손권 접근성 프리미엄을 볼 때 계속 체크합니다.',
    timeline: [
      { label: '노선 확정', status: 'done' },
      { label: '공사·환승 설계', status: 'active' },
      { label: '역세권 상권 재평가', status: 'watch' },
    ],
  },
  {
    rank: 2,
    title: '평촌 정비사업',
    area: '평촌·범계·귀인',
    buzzScore: 92,
    progress: 55,
    activeStageIndex: 1,
    expectedYear: '2026~2028 구역 윤곽',
    plainBrief: '평촌 주요 단지가 정비구역으로 얼마나 빨리 묶이는지 보는 단계입니다.',
    phase: '1기 신도시 정비구역 선별',
    nextMilestone: '다음 확인: 선도구역 선정과 주민 동의율',
    priceImpact: '학군·역세권 대단지는 평형별 신고가 회복 여부가 핵심',
    affectedDongs: ['평촌동', '귀인동', '범계동', '부림동', '달안동'],
    relatedApartments: ['꿈마을', '향촌마을', '초원마을', '목련마을'],
    keywords: ['1기 신도시', '특별정비구역', '7,200호'],
    body: '1기 신도시 정비와 단지별 리모델링·재건축 추진 속도는 평형별 가격 탄력에 영향을 줄 수 있어 주간 리포트에 반영합니다.',
    timeline: [
      { label: '정비 기본계획', status: 'done' },
      { label: '선도·특별구역 경쟁', status: 'active' },
      { label: '이주·분담금 가시화', status: 'watch' },
    ],
  },
  {
    rank: 3,
    title: '만안 생활권 정비',
    area: '안양동·석수·박달',
    buzzScore: 87,
    progress: 48,
    activeStageIndex: 1,
    expectedYear: '2027년 이후 순차 진행',
    plainBrief: '안양역 주변 정비와 교통 개선 논의가 실제 사업으로 넘어가는지 확인 중입니다.',
    phase: '원도심 정비·교통망 관찰',
    nextMilestone: '다음 확인: 안양역 주변 정비 인허가',
    priceImpact: '상대적으로 낮은 진입가 단지의 거래량 회복 여부가 관건',
    affectedDongs: ['안양동', '석수동', '박달동'],
    relatedApartments: ['래미안안양메가트리아', '안양역푸르지오더샵', '석수두산위브'],
    keywords: ['경부선 지하화', '서부선 연장', '안양역 생활권'],
    body: '안양역·명학역·석수역 생활권 정비사업과 신축 공급 흐름은 만안구 저평가 단지 비교에 함께 반영합니다.',
    timeline: [
      { label: '생활권 정비 후보', status: 'done' },
      { label: '사업성·교통망 검토', status: 'active' },
      { label: '신축 공급 반응', status: 'watch' },
    ],
  },
  {
    rank: 4,
    title: '박달스마트시티',
    area: '박달·만안',
    buzzScore: 84,
    progress: 43,
    activeStageIndex: 1,
    expectedYear: '2027~2030 협의 관찰',
    plainBrief: '박달 일대 개발 구상이 실제 이전 협의로 이어지는지 지켜보는 단계입니다.',
    phase: '부지 이전·복합개발 협의',
    nextMilestone: '다음 확인: 이전 협의와 개발 배치안',
    priceImpact: '확정 전 기대감이 큰 테마라 실거래 반응은 보수적으로 해석',
    affectedDongs: ['박달동', '석수동', '안양동'],
    relatedApartments: ['한양수자인에듀파크', '박달금호타운', '석수LG빌리지'],
    keywords: ['스마트시티', '군용지 이전', '첨단산업'],
    body: '박달동 일대 군사시설 이전과 스마트 복합도시 조성 이슈는 만안구 장기 성장성 측면에서 별도 추적합니다.',
    timeline: [
      { label: '구상 발표', status: 'done' },
      { label: '이전 협의', status: 'active' },
      { label: '민간 참여 구조', status: 'watch' },
    ],
  },
  {
    rank: 5,
    title: '안양교도소 이전·부지 개발',
    area: '호계·평촌 인접권',
    buzzScore: 78,
    progress: 36,
    activeStageIndex: 0,
    expectedYear: '2026~2029 방향성 확인',
    plainBrief: '부지 이전과 활용 방향이 구체화되는지 먼저 확인해야 합니다.',
    phase: '정책 이슈·부지 활용 검토',
    nextMilestone: '다음 확인: 이전 후보지와 부지 활용안',
    priceImpact: '확정 전에는 호가보다 실제 신고가와 거래량 변화를 우선 관찰',
    affectedDongs: ['호계동', '범계동', '평촌동'],
    relatedApartments: ['호계럭키', '목련두산', '범계역인근 구축단지'],
    keywords: ['공공부지', '이전', '복합개발'],
    body: '안양교도소 이전과 부지 활용은 확정성보다 정책 이슈 성격이 강해, 실제 일정이 구체화되는지 중심으로 봅니다.',
    timeline: [
      { label: '이전 필요성 재점화', status: 'done' },
      { label: '관계기관 협의', status: 'active' },
      { label: '부지 개발안', status: 'watch' },
    ],
  },
]

const gwacheonDevelopmentNews: DevelopmentIssue[] = [
  {
    rank: 1,
    title: '과천 원도심 재건축',
    area: '별양·부림·중앙',
    buzzScore: 94,
    progress: 58,
    activeStageIndex: 2,
    expectedYear: '2026~2029 구역별 추진',
    plainBrief: '과천 원도심 주요 단지가 인허가와 사업 속도를 얼마나 앞당기는지 보는 단계입니다.',
    phase: '재건축 인허가·이주 일정 확인',
    nextMilestone: '다음 확인: 조합별 인허가, 이주 일정, 분양 일정',
    priceImpact: '역세권 구축 단지는 거래량보다 신고가 재등장 여부를 우선 체크',
    affectedDongs: ['별양동', '부림동', '중앙동', '원문동'],
    relatedApartments: ['과천주공4단지', '과천주공5단지', '과천위버필드'],
    keywords: ['과천 재건축', '원도심 정비', '이주 일정'],
    body: '과천 원도심은 단지별 사업 단계 차이가 커서 같은 과천 안에서도 가격 반응이 다르게 나타날 수 있습니다.',
    timeline: [
      { label: '정비계획', status: 'done' },
      { label: '인허가·이주', status: 'active' },
      { label: '분양·입주 반영', status: 'watch' },
    ],
  },
  {
    rank: 2,
    title: '과천지식정보타운',
    area: '갈현·문원 인접권',
    buzzScore: 89,
    progress: 72,
    activeStageIndex: 3,
    expectedYear: '2026~2028 생활권 안정',
    plainBrief: '신축 입주와 업무시설 입주가 생활권 가격에 얼마나 반영되는지 확인 중입니다.',
    phase: '입주·업무시설 활성화',
    nextMilestone: '다음 확인: 상권 형성, 학교·교통 이용 안정화',
    priceImpact: '신축 프리미엄은 전세가율과 실거래 회전 속도를 함께 봐야 합니다.',
    affectedDongs: ['갈현동', '문원동', '원문동'],
    relatedApartments: ['과천푸르지오라비엔오', '과천제이드자이', '과천르센토데시앙'],
    keywords: ['지식정보타운', '신축 입주', '업무시설'],
    body: '지식정보타운은 과천 내 신축 수요와 업무시설 출퇴근 수요가 만나는 축이라 주간 거래 변화가 중요합니다.',
    timeline: [
      { label: '택지 공급', status: 'done' },
      { label: '입주 진행', status: 'done' },
      { label: '상권·교통 안정화', status: 'active' },
    ],
  },
  {
    rank: 3,
    title: '정부과천청사역 교통축',
    area: '중앙·별양·갈현',
    buzzScore: 85,
    progress: 46,
    activeStageIndex: 1,
    expectedYear: '2027~2030 일정 확인',
    plainBrief: 'GTX-C와 환승 동선이 실제 생활 편의로 이어질지 지켜보는 단계입니다.',
    phase: '광역교통 일정 확인',
    nextMilestone: '다음 확인: 정거장 계획, 환승 동선, 착공 일정',
    priceImpact: '교통 기대감은 확정 일정이 나올 때 거래 박스권을 다시 확인해야 합니다.',
    affectedDongs: ['중앙동', '별양동', '갈현동'],
    relatedApartments: ['과천자이', '래미안슈르', '과천위버필드'],
    keywords: ['GTX-C', '정부과천청사역', '환승'],
    body: '정부과천청사역 주변 교통 개선은 원도심과 지식정보타운을 동시에 보는 핵심 이슈입니다.',
    timeline: [
      { label: '노선 논의', status: 'done' },
      { label: '정거장·환승 검토', status: 'active' },
      { label: '착공·운영 반영', status: 'watch' },
    ],
  },
]

const uiwangDevelopmentNews: DevelopmentIssue[] = [
  {
    rank: 1,
    title: '내손·포일 생활권 정비',
    area: '내손·포일',
    buzzScore: 90,
    progress: 52,
    activeStageIndex: 1,
    expectedYear: '2026~2028 구역별 확인',
    plainBrief: '내손·포일 구축 단지의 정비 속도와 인덕원 접근성 프리미엄을 함께 보는 단계입니다.',
    phase: '정비 추진·사업성 확인',
    nextMilestone: '다음 확인: 단지별 추진위, 동의율, 사업성 검토',
    priceImpact: '인덕원 생활권과 학군 수요가 겹치는 단지의 거래 회복이 중요합니다.',
    affectedDongs: ['내손동', '포일동'],
    relatedApartments: ['인덕원센트럴자이', '의왕내손e편한세상', '포일숲속마을'],
    keywords: ['내손동 정비', '포일동 아파트', '인덕원 생활권'],
    body: '내손·포일은 행정구역은 의왕이지만 인덕원·평촌 수요와 같이 움직이는 구간이라 별도 추적합니다.',
    timeline: [
      { label: '정비 기대감', status: 'done' },
      { label: '사업성 검토', status: 'active' },
      { label: '구역 확정', status: 'watch' },
    ],
  },
  {
    rank: 2,
    title: '인덕원역 연결 효과',
    area: '내손·포일·관양 인접',
    buzzScore: 87,
    progress: 61,
    activeStageIndex: 3,
    expectedYear: '2028~2030 예상',
    plainBrief: '인덕원역 교통축이 내손·포일 단지 가격에 얼마나 반영되는지 보는 중입니다.',
    phase: '철도 공사·환승 동선 체크',
    nextMilestone: '다음 확인: GTX-C, 월곶판교선, 동탄인덕원선 일정',
    priceImpact: '역 접근 시간이 짧은 단지일수록 신고가 회복 속도를 따로 봅니다.',
    affectedDongs: ['내손동', '포일동', '관양동'],
    relatedApartments: ['인덕원센트럴자이', '포일자이', '평촌더샵아이파크'],
    keywords: ['인덕원역', 'GTX-C', '월곶판교선'],
    body: '인덕원역 다중 철도 이슈는 내손·포일권의 가장 큰 외부 변수입니다.',
    timeline: [
      { label: '노선 확정', status: 'done' },
      { label: '공사·환승 설계', status: 'active' },
      { label: '역세권 반영', status: 'watch' },
    ],
  },
  {
    rank: 3,
    title: '백운·오전 생활권 확장',
    area: '의왕 남부 연계',
    buzzScore: 76,
    progress: 44,
    activeStageIndex: 1,
    expectedYear: '2027년 이후 관찰',
    plainBrief: '의왕 내 생활권 확장이 내손·포일 수요를 얼마나 나눌지 확인하는 단계입니다.',
    phase: '생활권 확장 관찰',
    nextMilestone: '다음 확인: 신규 공급, 상권 안정, 전세 수요 이동',
    priceImpact: '내손·포일과 백운권의 가격 차이가 줄어드는지 확인해야 합니다.',
    affectedDongs: ['내손동', '포일동', '오전동'],
    relatedApartments: ['백운밸리', '포일숲속마을', '내손라구역 인접단지'],
    keywords: ['의왕 생활권', '백운밸리', '신규 공급'],
    body: '의왕 내부 신규 생활권은 내손·포일의 상대 매력도를 비교할 때 함께 봐야 합니다.',
    timeline: [
      { label: '신규 생활권 형성', status: 'done' },
      { label: '가격 차이 관찰', status: 'active' },
      { label: '수요 재배분', status: 'watch' },
    ],
  },
]

const reportDevelopmentNewsByRegion: Record<string, DevelopmentIssue[]> = {
  '안양시 동안구': anyangDevelopmentNews.filter((item) =>
    item.affectedDongs.some((dong) =>
      ['평촌동', '범계동', '호계동', '신촌동', '귀인동', '달안동', '부림동', '갈산동', '비산동', '관양동', '내손동', '포일동'].includes(dong),
    ),
  ),
  '안양시 만안구': anyangDevelopmentNews.filter((item) =>
    item.affectedDongs.some((dong) => ['안양동', '석수동', '박달동'].includes(dong)),
  ),
  의왕시: uiwangDevelopmentNews,
  과천시: gwacheonDevelopmentNews,
}

const getReportDevelopmentNews = (region: string) =>
  reportDevelopmentNewsByRegion[region]?.length ? reportDevelopmentNewsByRegion[region] : anyangDevelopmentNews

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
  ['안양시 동안구', '41173'],
  ['과천시', '41290'],
  ['의왕시', '41430'],
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

const getLatestSaturdayMorning = (baseDate = new Date()) => {
  const saturdayMorning = new Date(baseDate)
  const daysSinceSaturday = (saturdayMorning.getDay() + 1) % 7
  saturdayMorning.setDate(saturdayMorning.getDate() - daysSinceSaturday)
  saturdayMorning.setHours(8, 0, 0, 0)

  if (saturdayMorning.getTime() > baseDate.getTime()) {
    saturdayMorning.setDate(saturdayMorning.getDate() - 7)
  }

  return saturdayMorning
}

const getLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const withCurrentWeeklyReportNotification = (notifications: AppNotification[]): AppNotification[] => {
  const latestSaturdayMorning = getLatestSaturdayMorning()
  const notificationId = `weekly-report-${getLocalDateKey(latestSaturdayMorning)}`
  const normalizedNotifications = notifications
    .map((notification) =>
      notification.kind === 'weekly-report'
        ? {
            ...notification,
            title: '이번 주 우리동네 리포트 도착',
            body: '토요일 아침 갱신 · 우리동네 실거래, 개발 소식, 화제 단지를 확인하세요.',
            region: notification.region ?? weeklyReportRegionOptions[0],
          }
        : notification,
    )
    .filter((notification, index, source) => {
      if (notification.kind !== 'weekly-report') return true

      const notificationDateKey = notification.createdAt
        ? getLocalDateKey(new Date(notification.createdAt))
        : notification.id

      return (
        source.findIndex((candidate) => {
          if (candidate.kind !== 'weekly-report') return false
          const candidateDateKey = candidate.createdAt
            ? getLocalDateKey(new Date(candidate.createdAt))
            : candidate.id
          return candidateDateKey === notificationDateKey
        }) === index
      )
    })

  if (normalizedNotifications.some((notification) => notification.id === notificationId)) {
    return normalizedNotifications
  }

  const weeklyReportNotification: AppNotification = {
    id: notificationId,
    kind: 'weekly-report',
    title: '이번 주 우리동네 리포트 도착',
    body: '토요일 아침 갱신 · 우리동네 실거래, 개발 소식, 화제 단지를 확인하세요.',
    region: weeklyReportRegionOptions[0],
    createdAt: latestSaturdayMorning.toISOString(),
    read: false,
  }

  return [weeklyReportNotification, ...normalizedNotifications].slice(0, 30)
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

const clampScore = (value: number) => Math.min(100, Math.max(0, value))

const uniqueAiPreferenceRanks = (ranks: AiPreferenceKey[]) => {
  const fallback: AiPreferenceKey[] = ['budget', 'commute', 'growth', 'pyeong']
  const uniqueRanks = ranks.filter((rank, index) => ranks.indexOf(rank) === index)

  fallback.forEach((rank) => {
    if (uniqueRanks.length < 3 && !uniqueRanks.includes(rank)) {
      uniqueRanks.push(rank)
    }
  })

  aiPreferenceOptions.forEach((option) => {
    if (uniqueRanks.length < 3 && !uniqueRanks.includes(option.value)) {
      uniqueRanks.push(option.value)
    }
  })

  return uniqueRanks.slice(0, 4)
}

const getRecommendationDealKey = (deal: LiveRtmsDeal) =>
  deal.aptSeq || normalizeSearchText(`${deal.aptName}-${deal.address}-${deal.jibun}`)

const getOneYearGrowth = (deals: LiveRtmsDeal[]) => {
  const sortedDeals = dedupeDeals(deals)
    .filter((deal) => deal.status === 'active')
    .sort((a, b) => dealTimestamp(a) - dealTimestamp(b))
  const latestDeal = sortedDeals.at(-1)

  if (!latestDeal) return null

  const latestTime = dealTimestamp(latestDeal)
  const startDate = new Date(latestTime)
  startDate.setFullYear(startDate.getFullYear() - 1)

  const firstComparableDeal =
    sortedDeals.find((deal) => dealTimestamp(deal) >= startDate.getTime()) ?? sortedDeals[0]

  if (!firstComparableDeal || firstComparableDeal.id === latestDeal.id) return null

  return ((latestDeal.priceEok - firstComparableDeal.priceEok) / Math.max(firstComparableDeal.priceEok, 0.1)) * 100
}

const getRtmsStationHint = (deal: LiveRtmsDeal, subwayMinutes: number) => {
  const target = `${deal.aptName} ${deal.address} ${deal.legalDong}`

  if (target.includes('범계')) return `범계역 ${subwayMinutes}분권`
  if (target.includes('평촌')) return `평촌역 ${subwayMinutes}분권`
  if (target.includes('인덕원') || target.includes('관양')) return `인덕원역 ${subwayMinutes}분권`
  if (target.includes('과천')) return `과천권 ${subwayMinutes}분권`
  if (target.includes('내손') || target.includes('포일')) return `인덕원·내손 ${subwayMinutes}분권`
  if (target.includes('비산')) return `비산·안양 ${subwayMinutes}분권`

  return `생활권 ${subwayMinutes}분권`
}

const estimateRtmsSubwayMinutes = (deal: LiveRtmsDeal) => {
  const target = `${deal.aptName} ${deal.address} ${deal.legalDong}`

  if (target.includes('역세권') || target.includes('센트럴')) return 5
  if (target.includes('범계') || target.includes('평촌') || target.includes('인덕원')) return 7
  if (target.includes('관양') || target.includes('호계') || target.includes('과천')) return 9
  if (target.includes('비산') || target.includes('내손') || target.includes('포일')) return 11
  if (deal.district.includes('서울')) return 10

  return 13
}

const estimateRtmsCommuteMinutes = (deal: LiveRtmsDeal, officeArea: OfficeArea) => {
  const region = `${deal.district} ${deal.legalDong} ${deal.address}`
  const baseByOffice: Record<OfficeArea, number> = { 강남: 44, 여의도: 52, 광화문: 60, 판교: 38 }

  if (region.includes('과천시')) {
    return ({ 강남: 30, 여의도: 42, 광화문: 48, 판교: 36 } as Record<OfficeArea, number>)[officeArea]
  }
  if (region.includes('안양시 동안구')) {
    return ({ 강남: 38, 여의도: 48, 광화문: 56, 판교: 29 } as Record<OfficeArea, number>)[officeArea]
  }
  if (region.includes('안양시 만안구')) {
    return ({ 강남: 46, 여의도: 44, 광화문: 55, 판교: 38 } as Record<OfficeArea, number>)[officeArea]
  }
  if (region.includes('의왕시')) {
    return ({ 강남: 41, 여의도: 53, 광화문: 60, 판교: 26 } as Record<OfficeArea, number>)[officeArea]
  }
  if (region.includes('분당구')) {
    return ({ 강남: 34, 여의도: 58, 광화문: 66, 판교: 14 } as Record<OfficeArea, number>)[officeArea]
  }
  if (region.includes('서초구') || region.includes('강남구')) {
    return ({ 강남: 18, 여의도: 34, 광화문: 38, 판교: 28 } as Record<OfficeArea, number>)[officeArea]
  }

  return baseByOffice[officeArea]
}

const scoreRecommendationPreference = (
  preference: AiPreferenceKey,
  context: {
    priceEok: number
    budgetEok: number
    pyeong: number
    preferredPyeong: number
    subwayMinutes: number
    maxSubwayMinutes: number
    commuteMinutes: number
    maxCommuteMinutes: number
    buildYear: number
    oneYearGrowthRate: number | null
    directDealCount: number
  },
) => {
  switch (preference) {
    case 'budget':
      return clampScore(100 - Math.abs(context.priceEok - context.budgetEok) * 9)
    case 'pyeong':
      return clampScore(100 - Math.abs(context.pyeong - context.preferredPyeong) * 8)
    case 'subway':
      return clampScore(100 - Math.max(0, context.subwayMinutes - context.maxSubwayMinutes) * 12 - context.subwayMinutes * 1.4)
    case 'commute':
      return clampScore(100 - Math.max(0, context.commuteMinutes - context.maxCommuteMinutes) * 4 - context.commuteMinutes * 0.45)
    case 'growth':
      return context.oneYearGrowthRate === null ? 50 : clampScore(54 + context.oneYearGrowthRate * 4.5)
    case 'newness':
      return clampScore(102 - Math.max(0, currentYear - context.buildYear) * 2.6)
    case 'direct':
      return context.directDealCount > 0 ? 100 : 58
    default:
      return 50
  }
}

const formatGrowth = (value: number | null) => (value === null ? '산정중' : formatPercent(value))

const tradePyeongBands: Array<{
  key: TradePyeongBandKey
  label: string
  min: number
  max: number
}> = [
  { key: 'under20', label: '20평 이하', min: 0, max: 20.9 },
  { key: 'p20', label: '20평대', min: 21, max: 23.9 },
  { key: 'p25', label: '25평형대', min: 24, max: 29.9 },
  { key: 'p34', label: '34평형대', min: 30, max: 37.9 },
  { key: 'p40', label: '40평대', min: 38, max: 49.9 },
  { key: 'over50', label: '50평 이상', min: 50, max: 999 },
]

const getTradePyeongBand = (pyeong: number) =>
  tradePyeongBands.find((band) => pyeong >= band.min && pyeong <= band.max) ?? tradePyeongBands.at(-1)!

const getPreferredPyeongHistory = (history: LiveRtmsDeal[], preferredPyeong: number) => {
  const preferredBand = getTradePyeongBand(preferredPyeong).key
  const sameBandHistory = history.filter((deal) => getTradePyeongBand(deal.pyeong).key === preferredBand)

  if (sameBandHistory.length > 0) return sameBandHistory

  const closestPyeong = history.reduce<number | null>((closest, deal) => {
    if (closest === null) return deal.pyeong
    return Math.abs(deal.pyeong - preferredPyeong) < Math.abs(closest - preferredPyeong) ? deal.pyeong : closest
  }, null)

  if (closestPyeong === null) return history

  return history.filter((deal) => Math.abs(deal.pyeong - closestPyeong) <= 1.2)
}

const buildKakaoRouteUrl = ({
  originName,
  lat,
  lng,
  officeArea,
}: {
  originName: string
  lat?: number
  lng?: number
  officeArea: OfficeArea
}) => {
  const destination = officeAreaDestinations[officeArea]

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return `https://m.map.kakao.com/scheme/search?q=${encodeURIComponent(`${originName} ${destination.name} 대중교통`)}`
  }

  return `https://m.map.kakao.com/scheme/route?sp=${lat},${lng}&ep=${destination.lat},${destination.lng}&by=publictransit`
}

const calculateDistanceMeters = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
  const earthRadiusMeters = 6371000
  const toRadians = (degree: number) => (degree * Math.PI) / 180
  const latDelta = toRadians(to.lat - from.lat)
  const lngDelta = toRadians(to.lng - from.lng)
  const fromLat = toRadians(from.lat)
  const toLat = toRadians(to.lat)
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) ** 2

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const formatNearbyDistance = (meters: number) =>
  meters < 1000 ? `${Math.max(50, Math.round(meters / 10) * 10)}m` : `${(meters / 1000).toFixed(1)}km`

const transitDevelopmentHubs = [
  {
    name: '인덕원역',
    lat: 37.4019,
    lng: 126.9768,
    radiusMeters: 1000,
    label: 'GTX-C·동탄인덕원선·월곶판교선 교통축',
    score: 18,
  },
  {
    name: '정부과천청사역',
    lat: 37.4266,
    lng: 126.9899,
    radiusMeters: 950,
    label: 'GTX-C·과천 업무지구 접근',
    score: 17,
  },
  {
    name: '평촌역',
    lat: 37.3943,
    lng: 126.9638,
    radiusMeters: 850,
    label: '4호선 평촌 업무·상권축',
    score: 12,
  },
  {
    name: '범계역',
    lat: 37.3897,
    lng: 126.9507,
    radiusMeters: 850,
    label: '4호선 범계 상권축',
    score: 12,
  },
]

const getRegionPreferenceBonus = (regionText: string) => {
  const normalized = normalizeSearchText(regionText)

  if (normalized.includes('서울')) {
    return {
      score: 8,
      label: '서울 입지 가점',
    }
  }

  return {
    score: 0,
    label: '',
  }
}

const getDevelopmentSignals = (regionText: string, location?: { lat?: number; lng?: number }) => {
  const normalized = normalizeSearchText(regionText)
  const signals: string[] = []
  let score = 0
  const hasLocation = typeof location?.lat === 'number' && typeof location.lng === 'number'

  if (hasLocation) {
    const nearbyHub = transitDevelopmentHubs
      .map((hub) => ({
        ...hub,
        distance: calculateDistanceMeters({ lat: location.lat!, lng: location.lng! }, hub),
      }))
      .filter((hub) => hub.distance <= hub.radiusMeters)
      .sort((a, b) => a.distance - b.distance)
      .at(0)

    if (nearbyHub) {
      signals.push(`인근 ${formatNearbyDistance(nearbyHub.distance)} ${nearbyHub.name} ${nearbyHub.label}`)
      score += nearbyHub.score
    }
  }

  if (['인덕원', '관양', '평촌', '호계', '범계'].some((keyword) => normalized.includes(normalizeSearchText(keyword)))) {
    signals.push('인덕원·평촌 생활권 교통 수요')
    score += hasLocation ? 8 : 14
  }

  if (['과천', '정부과천청사', '별양', '부림', '원문'].some((keyword) => normalized.includes(normalizeSearchText(keyword)))) {
    signals.push('과천 재건축·업무지구 접근')
    score += 16
  }

  if (['내손', '포일', '의왕'].some((keyword) => normalized.includes(normalizeSearchText(keyword)))) {
    signals.push('의왕·인덕원 배후 생활권')
    score += 12
  }

  if (['비산', '안양', '만안', '박달', '석수'].some((keyword) => normalized.includes(normalizeSearchText(keyword)))) {
    signals.push('안양 원도심 정비 수요')
    score += 10
  }

  if (['센트럴', '자이', '푸르지오', '래미안', '더샵'].some((keyword) => normalized.includes(normalizeSearchText(keyword)))) {
    signals.push('브랜드 단지 선호')
    score += 6
  }

  return {
    score: Math.min(score, 30),
    signals: Array.from(new Set(signals)).slice(0, 2),
  }
}

const calculateUpsideScore = (history: LiveRtmsDeal[], regionText: string, location?: { lat?: number; lng?: number }) => {
  const oneYearGrowthRate = getOneYearGrowth(history)
  const sixMonthChange = calculateSixMonthChange(history)
  const development = getDevelopmentSignals(regionText, location)
  const dealCountScore = Math.min(history.length, 16) * 1.2
  const oneYearTrendScore =
    oneYearGrowthRate === null ? 10 : clampScore(15 + oneYearGrowthRate * 2.8)
  const sixMonthTrendScore =
    sixMonthChange === null ? 8 : clampScore(12 + sixMonthChange.changeRate * 2.2)
  const score = Math.round(Math.min(99, oneYearTrendScore * 0.36 + sixMonthTrendScore * 0.24 + development.score + dealCountScore))

  return {
    score,
    signals: development.signals,
  }
}

const buildRtmsRecommendationCandidates = ({
  deals,
  preferenceRanks,
  budgetEok,
  minPriceEok,
  maxPriceEok,
  preferredPyeong,
  maxSubwayMinutes,
  officeArea,
  maxCommuteMinutes,
}: {
  deals: LiveRtmsDeal[]
  preferenceRanks: AiPreferenceKey[]
  budgetEok: number
  minPriceEok: number
  maxPriceEok: number
  preferredPyeong: number
  maxSubwayMinutes: number
  officeArea: OfficeArea
  maxCommuteMinutes: number
}): RecommendedApartment[] => {
  const rankedPreferences = uniqueAiPreferenceRanks(preferenceRanks)
  const groupedDeals = Array.from(
    deals
      .filter((deal) => deal.status === 'active' && deal.priceEok >= minPriceEok && deal.priceEok <= maxPriceEok)
      .reduce((group, deal) => {
        const key = getRecommendationDealKey(deal)
        group.set(key, [...(group.get(key) ?? []), deal])
        return group
      }, new Map<string, LiveRtmsDeal[]>())
      .values(),
  )

  return groupedDeals
    .map((groupDeals): RecommendedApartment | null => {
      const history = dedupeDeals(groupDeals)
      const preferredHistory = getPreferredPyeongHistory(history, preferredPyeong)
      const latestDeal = preferredHistory[0]

      if (!latestDeal) return null

      const oneYearGrowthRate = getOneYearGrowth(preferredHistory)
      const subwayMinutes = estimateRtmsSubwayMinutes(latestDeal)
      const commuteToOffice = estimateRtmsCommuteMinutes(latestDeal, officeArea)
      const budgetDistance = Math.abs(latestDeal.priceEok - budgetEok)
      const directDealCount = preferredHistory.filter((deal) => deal.tradeType === 'direct').length
      const upside = calculateUpsideScore(
        preferredHistory,
        `${latestDeal.aptName} ${latestDeal.district} ${latestDeal.legalDong} ${latestDeal.address}`,
        { lat: latestDeal.lat, lng: latestDeal.lng },
      )
      const regionPremium = getRegionPreferenceBonus(`${latestDeal.district} ${latestDeal.legalDong} ${latestDeal.address}`)
      const context = {
        priceEok: latestDeal.priceEok,
        budgetEok,
        pyeong: latestDeal.pyeong,
        preferredPyeong,
        subwayMinutes,
        maxSubwayMinutes,
        commuteMinutes: commuteToOffice,
        maxCommuteMinutes,
        buildYear: latestDeal.buildYear,
        oneYearGrowthRate,
        directDealCount,
      }
      const preferenceWeights = [0.38, 0.27, 0.2, 0.11]
      const preferenceScore = rankedPreferences.reduce(
        (score, preference, index) => score + scoreRecommendationPreference(preference, context) * preferenceWeights[index],
        0,
      )
      const baseFitScore =
        scoreRecommendationPreference('budget', context) * 0.03 +
        scoreRecommendationPreference('pyeong', context) * 0.01 +
        Math.min(preferredHistory.length, 12) * 0.35
      const recommendationScore = Math.round(Math.min(99, preferenceScore + baseFitScore + regionPremium.score))
      const recentDeals = preferredHistory.slice(0, 5).map((deal) => ({
        date: formatShortDate(deal.dealDate),
        priceEok: deal.priceEok,
        pyeong: deal.pyeong,
        tradeTypeLabel: deal.tradeTypeLabel,
      }))

      return {
        name: latestDeal.aptName,
        region: `${latestDeal.district} ${latestDeal.legalDong}`.trim() || latestDeal.address,
        station: getRtmsStationHint(latestDeal, subwayMinutes),
        pyeong: `${Math.round(latestDeal.pyeong)}평`,
        priceEok: latestDeal.priceEok,
        previousEok: history[1]?.priceEok ?? latestDeal.priceEok,
        recentDeals,
        budgetDistance,
        recommendationScore,
        commuteToOffice,
        commuteRouteUrl: buildKakaoRouteUrl({
          originName: latestDeal.aptName,
          lat: latestDeal.lat,
          lng: latestDeal.lng,
          officeArea,
        }),
        commuteSource: typeof latestDeal.lat === 'number' && typeof latestDeal.lng === 'number' ? 'kakao-route-link' : 'estimated',
        upsideScore: upside.score,
        developmentSignals: upside.signals,
        source: 'rtms' as const,
        oneYearGrowthRate,
        latestDealDate: latestDeal.dealDate,
        dealCount: preferredHistory.length,
        fitReasons: [
          `${rankedPreferences.map((rank, index) => `${index + 1}순위 ${aiPreferenceLabelByKey[rank]}`).join(' · ')}`,
          regionPremium.label || `입지 ${getRtmsStationHint(latestDeal, subwayMinutes)}`,
          `최근 실거래 ${formatShortDate(latestDeal.dealDate)} · ${Math.round(latestDeal.pyeong)}평 · ${formatEok(latestDeal.priceEok)}`,
          `1년 상승률 ${formatGrowth(oneYearGrowthRate)}`,
          upside.signals[0] ? `호재 ${upside.signals[0]}` : `상승여력 ${upside.score}점`,
          `${officeArea} 대중교통 ${commuteToOffice}분`,
          directDealCount > 0 ? `직거래 ${directDealCount}건 포함` : `동일 평형권 ${preferredHistory.length}건 분석`,
        ],
      }
    })
    .filter((candidate): candidate is RecommendedApartment => candidate !== null)
}

const buildCuratedRecommendationCandidates = ({
  preferenceRanks,
  budgetEok,
  minPriceEok,
  maxPriceEok,
  preferredPyeong,
  maxSubwayMinutes,
  officeArea,
  maxCommuteMinutes,
}: {
  preferenceRanks: AiPreferenceKey[]
  budgetEok: number
  minPriceEok: number
  maxPriceEok: number
  preferredPyeong: number
  maxSubwayMinutes: number
  officeArea: OfficeArea
  maxCommuteMinutes: number
}) =>
  apartments
    .filter((apartment) => apartment.priceEok >= minPriceEok && apartment.priceEok <= maxPriceEok)
    .map((apartment): RecommendedApartment => {
      const rankedPreferences = uniqueAiPreferenceRanks(preferenceRanks)
      const apartmentPyeong = Number(apartment.pyeong.replace('평', ''))
      const oneYearGrowthRate =
        apartment.previousEok > 0 ? ((apartment.priceEok - apartment.previousEok) / apartment.previousEok) * 100 : null
      const commuteToOffice = apartment.commuteMinutes[officeArea]
      const curatedHistory = apartment.recentDeals.map((deal, index) => ({
        id: `curated-${apartment.name}-${index}`,
        aptSeq: `curated-${apartment.name}`,
        aptName: apartment.name,
        address: apartment.region,
        legalDong: apartment.region.split(' ').at(-1) ?? '',
        jibun: '',
        umdCd: '',
        bonbun: '',
        bubun: '',
        landCd: '',
        lawdCd: getLawdCdFromRegion(apartment.region),
        district: apartment.region,
        dealDate: `20${deal.date.replaceAll('.', '-').replace(/-$/, '')}`,
        priceEok: deal.priceEok,
        areaM2: apartmentPyeong / 0.3025,
        pyeong: apartmentPyeong,
        lat: apartment.lat,
        lng: apartment.lng,
        floor: 0,
        buildYear: apartment.approvalYear,
        tradeType: 'brokered' as const,
        tradeTypeLabel: '표본',
        buyerType: '',
        sellerType: '',
        status: 'active' as const,
        registeredAt: '',
      }))
      const upside = calculateUpsideScore(
        curatedHistory,
        `${apartment.name} ${apartment.region} ${apartment.station}`,
        { lat: apartment.lat, lng: apartment.lng },
      )
      const regionPremium = getRegionPreferenceBonus(apartment.region)
      const context = {
        priceEok: apartment.priceEok,
        budgetEok,
        pyeong: apartmentPyeong,
        preferredPyeong,
        subwayMinutes: apartment.subwayMinutes,
        maxSubwayMinutes,
        commuteMinutes: commuteToOffice,
        maxCommuteMinutes,
        buildYear: apartment.approvalYear,
        oneYearGrowthRate,
        directDealCount: apartment.tags.includes('직거래') ? 1 : 0,
      }
      const preferenceWeights = [0.38, 0.27, 0.2, 0.11]
      const preferenceScore = rankedPreferences.reduce(
        (score, preference, index) => score + scoreRecommendationPreference(preference, context) * preferenceWeights[index],
        0,
      )
      const budgetDistance = Math.abs(apartment.priceEok - budgetEok)
      const recommendationScore = Math.round(
        Math.min(99, preferenceScore + scoreRecommendationPreference('budget', context) * 0.03 + regionPremium.score),
      )

      return {
        name: apartment.name,
        region: apartment.region,
        station: apartment.station,
        pyeong: apartment.pyeong,
        priceEok: apartment.priceEok,
        previousEok: apartment.previousEok,
        recentDeals: apartment.recentDeals.map((deal) => ({
          ...deal,
          pyeong: apartmentPyeong,
          tradeTypeLabel: '표본',
        })),
        budgetDistance,
        recommendationScore,
        commuteToOffice,
        commuteRouteUrl: buildKakaoRouteUrl({
          originName: apartment.name,
          lat: apartment.lat,
          lng: apartment.lng,
          officeArea,
        }),
        commuteSource: 'kakao-route-link',
        upsideScore: upside.score,
        developmentSignals: upside.signals,
        fitReasons: [
          `${rankedPreferences.map((rank, index) => `${index + 1}순위 ${aiPreferenceLabelByKey[rank]}`).join(' · ')}`,
          regionPremium.label || `입지 ${apartment.station}`,
          `최근 실거래 ${apartment.recentDeals[0]?.date ?? '확인중'} · ${apartment.pyeong} · ${formatEok(apartment.priceEok)}`,
          `1년 상승률 ${formatGrowth(oneYearGrowthRate)}`,
          upside.signals[0] ? `호재 ${upside.signals[0]}` : `상승여력 ${upside.score}점`,
          `${officeArea} 대중교통 ${commuteToOffice}분`,
        ],
        source: 'curated',
        oneYearGrowthRate,
        latestDealDate: apartment.recentDeals[0]?.date ?? '',
        dealCount: apartment.recentDeals.length,
      }
    })

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

  const subwayMinutes = estimateRtmsSubwayMinutes(deal)
  if (filters.subway === 'within5' && subwayMinutes > 5) return false
  if (filters.subway === 'within10' && subwayMinutes > 10) return false
  if (filters.subway === 'within15' && subwayMinutes > 15) return false

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
  const [priceHeaderMinimized, setPriceHeaderMinimized] = useState(false)
  const [activeReportRegion, setActiveReportRegion] = useState(weeklyReportRegionOptions[0])
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [focusApartment, setFocusApartment] = useState<Apartment | null>(null)
  const selectedRegion = '평촌·만안·과천·의왕'
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
  const [aiPreferenceRanks, setAiPreferenceRanks] = useState<AiPreferenceKey[]>(['budget', 'commute', 'growth', 'pyeong'])
  const [userListings, setUserListings] = useState<UserListing[]>([])
  const [focusListing, setFocusListing] = useState<UserListing | null>(null)
  const [capitalLiveDeals, setCapitalLiveDeals] = useState<LiveRtmsDeal[]>([])
  const [focusLiveDeal, setFocusLiveDeal] = useState<LiveRtmsDeal | null>(null)
  const [appToast, setAppToast] = useState('')
  const [filterOpenRequest, setFilterOpenRequest] = useState(0)
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>(() => {
    try {
      return withCurrentWeeklyReportNotification(
        JSON.parse(window.localStorage.getItem('jipjiggu-app-notifications') ?? '[]') as AppNotification[],
      )
    } catch {
      return withCurrentWeeklyReportNotification([])
    }
  })
  const contentPanelRef = useRef<HTMLElement | null>(null)
  const modeRef = useRef<Mode>(mode)
  const historyReadyRef = useRef(false)
  const restoringHistoryRef = useRef(false)
  const lastHistoryModeRef = useRef<Mode | null>(null)
  const unreadNotificationCount = appNotifications.filter((notification) => !notification.read).length

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    const state = { jipjiggu: true, mode: modeRef.current }
    window.history.replaceState(state, '', window.location.href)
    historyReadyRef.current = true
    lastHistoryModeRef.current = modeRef.current

    const handlePopState = (event: PopStateEvent) => {
      const nextState = event.state as { jipjiggu?: boolean; mode?: unknown } | null

      if (nextState?.jipjiggu && isAppMode(nextState.mode)) {
        restoringHistoryRef.current = true
        setMode(nextState.mode)
        setPriceHeaderMinimized(false)
        return
      }

      window.history.pushState({ jipjiggu: true, mode: modeRef.current }, '', window.location.href)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!historyReadyRef.current) return

    modeRef.current = mode
    if (restoringHistoryRef.current) {
      restoringHistoryRef.current = false
      lastHistoryModeRef.current = mode
      return
    }

    if (lastHistoryModeRef.current === mode) return

    window.history.pushState({ jipjiggu: true, mode }, '', window.location.href)
    lastHistoryModeRef.current = mode
  }, [mode])

  const handleHomeClick = useCallback(() => {
    setPriceHeaderMinimized(false)

    if (mode !== 'prices') {
      setMode('prices')
    }

    window.setTimeout(() => {
      contentPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 30)
  }, [mode])

  useEffect(() => {
    const panel = contentPanelRef.current
    if (!panel || mode !== 'prices') return

    const handlePanelScroll = () => {
      const shouldMinimizeHeader = panel.scrollTop > 180
      setPriceHeaderMinimized((current) => (current === shouldMinimizeHeader ? current : shouldMinimizeHeader))
    }

    panel.addEventListener('scroll', handlePanelScroll, { passive: true })
    return () => panel.removeEventListener('scroll', handlePanelScroll)
  }, [mode])

  const mergeCapitalLiveDeals = useCallback((deals: LiveRtmsDeal[]) => {
    setCapitalLiveDeals((currentDeals) => {
      const mergedDeals = new Map(currentDeals.map((deal) => [deal.id, deal]))

      deals.forEach((deal) => {
        const currentDeal = mergedDeals.get(deal.id)
        mergedDeals.set(deal.id, currentDeal ? { ...currentDeal, ...deal } : deal)
      })

      return dedupeDeals(Array.from(mergedDeals.values())).slice(0, 50000)
    })
  }, [])

  const handleSearchFilterOpen = useCallback(() => {
    if (mode !== 'prices') {
      setMode('prices')
    }
    setFilterOpenRequest((request) => request + 1)
  }, [mode])

  const filteredApartments = useMemo(() => {
    const normalized = query.trim()

    return apartments.filter((apartment) => {
      const regionMatch =
        selectedRegion === '평촌·만안·과천·의왕'
          ? ['안양시 동안구', '안양시 만안구', '과천시', '의왕시'].some((region) =>
              apartment.region.includes(region),
            )
        : selectedRegion === '서울·경기·인천 전체'
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

  useEffect(() => {
    window.localStorage.setItem('jipjiggu-app-notifications', JSON.stringify(appNotifications.slice(0, 30)))
  }, [appNotifications])

  const handleOpenNotifications = useCallback(() => {
    setMode('notifications')
    setAppNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({ ...notification, read: true })),
    )
  }, [])

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

  const handleOpenReport = (region?: unknown) => {
    const nextRegion =
      typeof region === 'string' && weeklyReportRegionOptions.includes(region) ? region : activeReportRegion

    setActiveReportRegion(nextRegion)
    setSearchFocused(false)
    setMode('report')
    setPriceHeaderMinimized(false)

    window.requestAnimationFrame(() => {
      contentPanelRef.current?.scrollTo({ top: 0, behavior: 'auto' })
      window.scrollTo({ top: 0, behavior: 'auto' })
    })
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
  const recommendedApartments = useMemo<RecommendedApartment[]>(() => {
    const rtmsCandidates = buildRtmsRecommendationCandidates({
      deals: capitalLiveDeals,
      preferenceRanks: aiPreferenceRanks,
      budgetEok: recommendationBudgetEok,
      minPriceEok: normalizedMinTradePriceEok,
      maxPriceEok: normalizedMaxTradePriceEok,
      preferredPyeong,
      maxSubwayMinutes,
      officeArea,
      maxCommuteMinutes,
    })
    const curatedCandidates = buildCuratedRecommendationCandidates({
      preferenceRanks: aiPreferenceRanks,
      budgetEok: recommendationBudgetEok,
      minPriceEok: normalizedMinTradePriceEok,
      maxPriceEok: normalizedMaxTradePriceEok,
      preferredPyeong,
      maxSubwayMinutes,
      officeArea,
      maxCommuteMinutes,
    })
    const candidatesByName = new Map<string, RecommendedApartment>()

    ;[...rtmsCandidates, ...curatedCandidates].forEach((candidate) => {
      const key = normalizeSearchText(`${candidate.name}-${candidate.region}`)
      const current = candidatesByName.get(key)
      if (!current || candidate.source === 'rtms' || candidate.recommendationScore > current.recommendationScore) {
        candidatesByName.set(key, candidate)
      }
    })

    return Array.from(candidatesByName.values()).sort((a, b) => {
      const scoreGap = b.recommendationScore - a.recommendationScore
      if (Math.abs(scoreGap) > 3) return scoreGap

      return (
        b.upsideScore - a.upsideScore ||
        (b.oneYearGrowthRate ?? -999) - (a.oneYearGrowthRate ?? -999) ||
        b.dealCount - a.dealCount ||
        a.budgetDistance - b.budgetDistance
      )
    })
  },
    [
      aiPreferenceRanks,
      capitalLiveDeals,
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
      <section
        className={`mobile-stage mode-${mode}${priceHeaderMinimized ? ' map-header-minimized' : ''}`}
        aria-label="집직구 모바일 앱 미리보기"
      >
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
              <span className="brand-emblem" aria-hidden="true">
                <Home size={17} strokeWidth={2.7} />
              </span>
              <div className="brand-type">
                <span>ZIP JIKGU</span>
                <strong>집직구</strong>
              </div>
            </div>
            <span className="brand-subtitle">전국민 안심 직거래</span>
          </div>
          <button
            className="icon-button notification-button"
            aria-label="앱 알림함"
            type="button"
            onClick={handleOpenNotifications}
          >
            <Bell size={20} />
            {unreadNotificationCount > 0 && <span className="notification-badge">{unreadNotificationCount}</span>}
          </button>
        </header>

        {mode !== 'report' && (
          <section className="search-hero">
            <div className="search-box">
              <Search size={19} />
              <input
                id="search"
                value={query}
                onChange={(event) => handleSearchChange(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => window.setTimeout(() => setSearchFocused(false), 140)}
                placeholder="아파트, 지역, 역 이름 검색"
              />
              <button
                className="search-filter-button"
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={handleSearchFilterOpen}
                aria-label="실거래 필터 열기"
              >
                <SlidersHorizontal size={18} />
              </button>
            </div>

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
          </section>
        )}

        <section className="content-panel" ref={contentPanelRef}>
          {mode === 'prices' && (
            <PriceView
              apartments={filteredApartments}
              selectedRegion={selectedRegion}
              focusApartment={focusApartment}
              userListings={userListings}
              focusListing={focusListing}
              focusLiveDeal={focusLiveDeal}
              onLiveDealsChange={mergeCapitalLiveDeals}
              filterOpenRequest={filterOpenRequest}
              onOpenReport={handleOpenReport}
            />
          )}

          {mode === 'report' && (
            <NeighborhoodReportView
              liveDeals={capitalLiveDeals}
              initialRegion={activeReportRegion}
              onRegionChange={setActiveReportRegion}
            />
          )}

          {mode === 'notifications' && (
            <NotificationCenterView
              notifications={appNotifications}
              onOpenReport={(region) => handleOpenReport(region)}
              onOpenMap={() => setMode('prices')}
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
              aiPreferenceRanks={aiPreferenceRanks}
              setAiPreferenceRanks={setAiPreferenceRanks}
              budget={recommendationBudgetEok}
              stretch={recommendationStretchEok}
              apartments={recommendedApartments}
            />
          )}

          {mode === 'listing' && (
            <DirectListingsView
              userListings={userListings}
              liveDeals={capitalLiveDeals}
              onRegister={() => setMode('directListings')}
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

          {mode === 'directListings' && (
            <ListingView
              salePrice={salePrice}
              setSalePrice={setSalePrice}
              brokerage={brokerage}
              listingCandidates={listingApartmentCandidates}
              onCreateListing={handleListingCreate}
            />
          )}

          {mode === 'inheritance' && <InheritanceView />}
        </section>

        <nav className="bottom-nav" aria-label="하단 메뉴">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = mode === item.id || (mode === 'directListings' && item.id === 'listing')
            return (
              <button
                key={item.id}
                className={isActive ? 'active' : ''}
                onClick={() => {
                  setMode(item.id)
                  if (item.id === 'prices') {
                    setPriceHeaderMinimized(false)
                  }
                }}
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
  focusApartment,
  userListings,
  focusListing,
  focusLiveDeal,
  onLiveDealsChange,
  filterOpenRequest,
  onOpenReport,
}: {
  apartments: Apartment[]
  selectedRegion: string
  focusApartment: Apartment | null
  userListings: UserListing[]
  focusListing: UserListing | null
  focusLiveDeal: LiveRtmsDeal | null
  onLiveDealsChange: (deals: LiveRtmsDeal[]) => void
  filterOpenRequest: number
  onOpenReport: (region?: string) => void
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
  const latestApartmentDeals = useLatestApartmentDeals(apartments)
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
          scrollContainer.scrollTo({ top: Math.max(0, targetTop), behavior: 'auto' })
        } else {
          detailNode.scrollIntoView({ behavior: 'auto', block: 'start' })
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

      if (!marker.hasPrice && marker.lawdCd) {
        void fetchLatestDealForPlaceMarker(marker.lawdCd, marker.aptName).then((latestDeal) => {
          if (!latestDeal) return

          const enrichedMarker = markerFromLatestDeal(marker, latestDeal)
          setSelectedMapMarker((current) => (current?.id === marker.id ? enrichedMarker : current))
        })
      }

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
        `/api/rtms/map-markers?scope=${rtmsScope}&dealYmd=${defaultDealYmd}&monthsBack=60&limit=1200&geocodeLimit=180`,
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

      const markerDeals = dedupeDeals(
        payload.markers.flatMap((marker) =>
          (marker.relatedDeals ?? []).map((deal) => ({
            ...deal,
            lat: marker.lat,
            lng: marker.lng,
          })),
        ),
      )
      if (markerDeals.length > 0) {
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
  }, [defaultDealYmd, onLiveDealsChange, rtmsScope])

  useEffect(() => {
    if (filterOpenRequest <= 0) return undefined

    const timerId = window.setTimeout(() => {
      setFilterOpen(true)
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [filterOpenRequest])

  useEffect(() => {
    const controller = new AbortController()
    const mapTimer = window.setTimeout(() => {
      void fetchServerMapMarkers(controller.signal)
    }, 0)
    const dealsTimer = window.setTimeout(() => {
      void fetchRtmsDeals(controller.signal)
    }, 1800)

    return () => {
      window.clearTimeout(mapTimer)
      window.clearTimeout(dealsTimer)
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
      <section className="local-report-entry" aria-label="우리동네 리포트 바로가기">
        <button className="local-report-main" type="button" onClick={() => onOpenReport('안양시 동안구')}>
          <strong>우리 동네 리포트 보기</strong>
        </button>
      </section>

      <div className="section-title">
        <div>
          <span>지도</span>
          <h2>서울·경기·인천 실거래 지도</h2>
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

      {view === 'map' ? (
        <ApartmentMap
          liveDeals={mapDeals}
          serverMarkers={filteredServerMapMarkers}
          apartments={apartments}
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
          onReportClick={onOpenReport}
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

function NeighborhoodReportView({
  liveDeals,
  initialRegion,
  onRegionChange,
}: {
  liveDeals: LiveRtmsDeal[]
  initialRegion: string
  onRegionChange: (region: string) => void
}) {
  const region = initialRegion
  const [reportExpanded, setReportExpanded] = useState(true)
  const [reportSubscribed, setReportSubscribed] = useState(false)
  const [reportNewsItems, setReportNewsItems] = useState<ReportNewsItem[]>([])
  const [reportNewsUpdatedAt, setReportNewsUpdatedAt] = useState('')
  const reportDetailRef = useRef<HTMLElement | null>(null)
  const fallbackReferenceTime = useMemo(() => new Date().getTime(), [])

  const handleRegionSelect = (nextRegion: string) => {
    onRegionChange(nextRegion)
    setReportExpanded(true)
  }

  useEffect(() => {
    const controller = new AbortController()

    void (async () => {
      try {
        const response = await fetch(`/api/report/anyang-news?region=${encodeURIComponent(region)}`, {
          signal: controller.signal,
        })
        const payload = (await response.json()) as {
          items?: ReportNewsItem[]
          updatedAt?: string
        }

        if (!controller.signal.aborted) {
          setReportNewsItems(Array.isArray(payload.items) ? payload.items.slice(0, 6) : [])
          setReportNewsUpdatedAt(payload.updatedAt ?? '')
        }
      } catch {
        if (!controller.signal.aborted) {
          setReportNewsItems([])
          setReportNewsUpdatedAt('')
        }
      }
    })()

    return () => controller.abort()
  }, [region])

  const regionDeals = useMemo(
    () =>
      dedupeDeals(
        liveDeals.filter((deal) =>
          matchesWeeklyReportRegion(region, {
            aptName: deal.aptName,
            district: deal.district,
            legalDong: deal.legalDong,
            address: deal.address,
          }),
        ),
      ),
    [liveDeals, region],
  )
  const sortedRegionDeals = useMemo(
    () => [...regionDeals].sort((a, b) => dealTimestamp(b) - dealTimestamp(a)),
    [regionDeals],
  )
  const referenceTime = sortedRegionDeals[0] ? parseDealTime(sortedRegionDeals[0].dealDate) : fallbackReferenceTime
  const weekCutoffTime = referenceTime - 7 * 24 * 60 * 60 * 1000
  const monthCutoffTime = referenceTime - 30 * 24 * 60 * 60 * 1000
  const weeklyDeals = sortedRegionDeals.filter((deal) => parseDealTime(deal.dealDate) >= weekCutoffTime)
  const monthlyDeals = sortedRegionDeals.filter((deal) => parseDealTime(deal.dealDate) >= monthCutoffTime)
  const reportTradeWindowLabel = sortedRegionDeals.length
    ? `최근 공개 7일 · ${formatReportDateRange(weekCutoffTime, referenceTime)}`
    : '실거래 캐시 준비중'
  const developmentIssues = useMemo(() => getReportDevelopmentNews(region), [region])
  const growthLeaders = useMemo(() => {
    const groupedDeals = new Map<string, LiveRtmsDeal[]>()
    const oneYearCutoffTime = referenceTime - 365 * 24 * 60 * 60 * 1000

    sortedRegionDeals
      .filter((deal) => parseDealTime(deal.dealDate) >= oneYearCutoffTime)
      .forEach((deal) => {
        const key = `${deal.aptSeq || `${deal.aptName}-${deal.address}`}-${Math.round(deal.pyeong)}`
        groupedDeals.set(key, [...(groupedDeals.get(key) ?? []), deal])
      })

    return Array.from(groupedDeals.values())
      .map((deals) => {
        const orderedDeals = [...deals].sort((a, b) => parseDealTime(a.dealDate) - parseDealTime(b.dealDate))
        const firstDeal = orderedDeals[0]
        const latestDeal = orderedDeals.at(-1)

        if (!firstDeal || !latestDeal || orderedDeals.length < 2 || firstDeal.priceEok <= 0) return null

        const growthRate = ((latestDeal.priceEok - firstDeal.priceEok) / firstDeal.priceEok) * 100
        return {
          key: `${latestDeal.aptSeq}-${Math.round(latestDeal.pyeong)}`,
          name: latestDeal.aptName,
          pyeong: Math.round(latestDeal.pyeong),
          growthRate,
          firstPrice: firstDeal.priceEok,
          latestPrice: latestDeal.priceEok,
          latestDate: latestDeal.dealDate,
          dealCount: orderedDeals.length,
        }
      })
      .filter((leader): leader is NonNullable<typeof leader> => Boolean(leader))
      .sort((a, b) => b.growthRate - a.growthRate)
      .slice(0, 5)
  }, [referenceTime, sortedRegionDeals])
  const topIssue = developmentIssues
    .slice()
    .sort((a, b) => b.buzzScore - a.buzzScore)
    .at(0)

  const openPublishedReport = () => {
    setReportExpanded(true)
    window.setTimeout(() => reportDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  return (
    <div className="view-stack report-view">
      <section className="report-hero">
        <span>매주 토요일 아침 갱신</span>
        <h2>우리동네 리포트 보기</h2>
        <p>지역을 고르면 실거래와 개발 소식이 바로 열립니다.</p>
        <button className="report-hero-action" type="button" onClick={openPublishedReport}>
          리포트 바로 보기
          <ChevronRight size={15} />
        </button>
      </section>

      <section className="report-region-tabs" aria-label="보고서 지역 선택">
        <div className="report-region-guide">
          <span>지역 선택</span>
          <strong>{region} 리포트</strong>
        </div>
        {weeklyReportRegionOptions.map((option) => (
          <button
            className={region === option ? 'active' : ''}
            key={option}
            type="button"
            onClick={() => handleRegionSelect(option)}
          >
            {option}
          </button>
        ))}
      </section>

      {reportExpanded && (
        <section className="report-detail-card" ref={reportDetailRef} aria-label="집직구 주간 리포트 본문">
          <div className="report-detail-title">
            <span>{formatShortDate(new Date(referenceTime).toISOString().slice(0, 10))} 발간</span>
            <h3>{region} 우리동네 리포트</h3>
            <p>이번 주 실거래, 개발 소식, 관심 단지만 짧게 정리했습니다.</p>
          </div>

          <div className="report-live-brief">
            <div>
              <span>이번 주 핵심</span>
              <strong>{reportTradeWindowLabel}</strong>
            </div>
            <p>
              {topIssue
                ? topIssue.plainBrief
                : '이번 주 핵심 개발 이슈를 수집중입니다.'}
            </p>
          </div>

          <div className="report-metric-row">
            <div>
              <span>최근 7일 거래</span>
              <strong>{weeklyDeals.length}건</strong>
            </div>
            <div>
              <span>최근 30일 거래</span>
              <strong>{monthlyDeals.length}건</strong>
            </div>
            <div>
              <span>상승률 TOP</span>
              <strong>{growthLeaders[0] ? formatSignedRate(growthLeaders[0].growthRate) : '집계중'}</strong>
            </div>
            <div>
              <span>뉴스 스캔</span>
              <strong>{reportNewsItems.length || '대기'}</strong>
            </div>
          </div>

          <div className="report-section">
            <div className="detail-section-head">
              <span>
                <LineChart size={15} />
                개발 진척도 레이더
              </span>
              <em>공정·일정·가격 영향</em>
            </div>
            <div className="development-tracker">
              {developmentIssues
                .slice()
                .sort((a, b) => b.buzzScore - a.buzzScore)
                .map((item) => (
                  <article key={`development-${item.title}`}>
                    <div className="development-head">
                      <span>{item.area}</span>
                      <strong>{item.title}</strong>
                      <em>{item.expectedYear}</em>
                    </div>
                    <div className="development-score-row">
                      <span>진척도 {item.progress}%</span>
                      <b>{item.plainBrief}</b>
                    </div>
                    <div className="development-progress" aria-label={`${item.title} 진척도 ${item.progress}%`}>
                      <span style={{ width: `${item.progress}%` }} />
                    </div>
                    <div className="development-stage-map" aria-label={`${item.title} 전체 사업 단계`}>
                      {developmentStageLabels.map((stageLabel, index) => (
                        <span
                          className={
                            index < item.activeStageIndex
                              ? 'done'
                              : index === item.activeStageIndex
                                ? 'active'
                                : 'watch'
                          }
                          key={`${item.title}-${stageLabel}`}
                        >
                          <i>{index + 1}</i>
                          {stageLabel}
                        </span>
                      ))}
                    </div>
                    <div className="development-timeline">
                      {item.timeline.map((step) => (
                        <span className={step.status} key={`${item.title}-${step.label}`}>
                          {step.label}
                        </span>
                      ))}
                    </div>
                    <p>{item.nextMilestone}</p>
                    <dl>
                      <div>
                        <dt>관찰 동네</dt>
                        <dd>{item.affectedDongs.join(' · ')}</dd>
                      </div>
                      <div>
                        <dt>관련 단지</dt>
                        <dd>{item.relatedApartments.slice(0, 3).join(' · ')}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
            </div>
          </div>

          <div className="report-section">
            <div className="detail-section-head">
              <span>
                <ExternalLink size={15} />
                요번주 동네뉴스
              </span>
              <em>{reportNewsUpdatedAt ? `${formatKoreanDateTime(reportNewsUpdatedAt)} 갱신` : '자동 수집'}</em>
            </div>
            <div className="report-news-scan">
              {reportNewsItems.length > 0 ? (
                reportNewsItems.map((item) => (
                  <a href={item.link} target="_blank" rel="noreferrer" key={`${item.link}-${item.title}`}>
                    <span>{item.keyword}</span>
                    <strong>{item.title}</strong>
                    <em>
                      {item.source || '뉴스'} · {formatKoreanDateTime(item.publishedAt)}
                    </em>
                  </a>
                ))
              ) : (
                <article>
                  <span>수집중</span>
                  <strong>우리동네 개발·교통 뉴스 스캔 대기</strong>
                  <em>서버가 최신 뉴스 목록을 가져오면 이 영역에 자동 반영됩니다.</em>
                </article>
              )}
            </div>
          </div>

          <ReportDealList title="최근 일주일 거래" deals={weeklyDeals.slice(0, 6)} emptyText="최근 일주일 거래는 수집중입니다." />
          <ReportDealList title="최근 한달 거래" deals={monthlyDeals.slice(0, 8)} emptyText="최근 한달 거래는 수집중입니다." />

          <div className="report-section">
            <div className="detail-section-head">
              <span>
                <TrendingUp size={15} />
                상승률 높은 단지 TOP 5
              </span>
              <em>최근 1년 동일 평형대 기준</em>
            </div>
            <div className="report-rank-list">
              {growthLeaders.length > 0 ? (
                growthLeaders.map((leader, index) => (
                  <div key={leader.key}>
                    <strong>{index + 1}</strong>
                    <span>
                      {leader.name}
                      <small>{leader.pyeong}평 · {leader.dealCount}건</small>
                    </span>
                    <em>{formatSignedRate(leader.growthRate)}</em>
                  </div>
                ))
              ) : (
                <p>동일 평형대 거래가 2건 이상 쌓이면 상승률 순위가 자동 표시됩니다.</p>
              )}
            </div>
          </div>

          <div className="report-section">
            <div className="detail-section-head">
              <span>
                <Sparkles size={15} />
                우리동네 화제 지역 TOP 5
              </span>
              <em>뉴스·공시 언급 기준</em>
            </div>
            <div className="report-buzz-list">
              {developmentIssues
                .slice()
                .sort((a, b) => b.buzzScore - a.buzzScore)
                .map((item) => (
                <article key={item.title}>
                  <div>
                    <strong>{item.rank}</strong>
                    <span>{item.area}</span>
                  </div>
                  <section>
                    <h4>{item.title}</h4>
                    <p>{item.priceImpact}</p>
                    <em>{item.keywords.join(' · ')}</em>
                  </section>
                  <b>{item.buzzScore}</b>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="report-subscribe-card" aria-label="주간 리포트 알림 신청">
        <div>
          <span>매주 토요일 아침 갱신</span>
          <strong>앱 알림함에 받아보기</strong>
          <p>신청하면 새 리포트가 준비될 때 앱 안 알림함에 카드로 남겨둡니다.</p>
        </div>
        <button className="primary-action" type="button" onClick={() => setReportSubscribed(true)}>
          {reportSubscribed ? '신청완료' : '알림신청'}
          <Bell size={16} />
        </button>
      </section>
    </div>
  )
}

function ReportDealList({
  title,
  deals,
  emptyText,
}: {
  title: string
  deals: LiveRtmsDeal[]
  emptyText: string
}) {
  return (
    <div className="report-section">
      <div className="detail-section-head">
        <span>
          <FileText size={15} />
          {title}
        </span>
        <em>{deals.length ? `${deals.length}건 보기` : '수집중'}</em>
      </div>
      <div className="report-deal-list">
        {deals.length > 0 ? (
          deals.map((deal) => (
            <div key={`weekly-report-deal-${deal.id}`}>
              <span>
                <strong>{deal.aptName}</strong>
                <small>
                  {formatShortDate(deal.dealDate)} · {Math.round(deal.pyeong)}평 · {deal.floor}층 · {deal.tradeTypeLabel}
                </small>
              </span>
              <em>{formatEok(deal.priceEok)}</em>
            </div>
          ))
        ) : (
          <p>{emptyText}</p>
        )}
      </div>
    </div>
  )
}

function NotificationCenterView({
  notifications,
  onOpenReport,
  onOpenMap,
}: {
  notifications: AppNotification[]
  onOpenReport: (region?: string) => void
  onOpenMap: () => void
}) {
  return (
    <div className="view-stack notification-view">
      <section className="notification-hero">
        <span>집직구 앱 알림</span>
        <h2>우리동네 리포트</h2>
        <p>매주 토요일 아침, 동네 실거래와 개발 소식을 한 번에 확인하세요.</p>
      </section>

      {notifications.length > 0 ? (
        <section className="notification-list" aria-label="앱 알림 목록">
          {notifications.map((notification) => (
            <article className="notification-card" key={notification.id}>
              <div>
                <span>{formatShortDate(notification.createdAt.slice(0, 10))}</span>
                <strong>{notification.title}</strong>
                <p>{notification.body}</p>
              </div>
              <button
                className="secondary-action"
                type="button"
                onClick={() => {
                  if (notification.kind === 'weekly-report') {
                    onOpenReport(notification.region)
                    return
                  }

                  onOpenMap()
                }}
              >
                보기
                <ChevronRight size={15} />
              </button>
            </article>
          ))}
        </section>
      ) : (
        <section className="notification-empty">
          <Bell size={25} />
          <strong>아직 도착한 앱 알림이 없습니다</strong>
          <p>현재는 별도 알림 신청 없이 앱에서 우리동네 리포트를 바로 볼 수 있습니다.</p>
          <button className="primary-action" type="button" onClick={() => onOpenReport()}>
            리포트 보기
            <ChevronRight size={16} />
          </button>
        </section>
      )}
    </div>
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
      hasPrice: Boolean(officialDeal || latestDeal || apartment.priceEok > 0),
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
  const markerPrice = formatMarkerPrice(marker)
  button.className = `map-value-marker ${marker.tone}${markerPrice ? '' : ' no-price'}`
  button.setAttribute('aria-label', `${marker.label} ${markerPrice || '거래 없음'} ${marker.subLabel}`)
  button.addEventListener('click', onSelect)

  const label = document.createElement('span')
  label.className = 'marker-kind'
  label.textContent = marker.label

  const price = document.createElement('strong')
  price.textContent = markerPrice || ' '

  const date = document.createElement('small')
  date.className = 'marker-date'
  date.textContent = markerPrice ? marker.dateLabel || formatMarkerMonth(marker.dealDate) : ' '

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
        hasPrice: true,
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
            hasPrice: true,
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

const normalizeMarkerAptName = (value: string) =>
  normalizeSearchText(value)
    .replace(/아파트$/g, '')
    .replace(/주공$/g, '')

const latestPlaceDealCache = new Map<string, Promise<LiveRtmsDeal | null>>()

const fetchLatestDealForPlaceMarker = (lawdCd: string, aptName: string) => {
  const cacheKey = `${lawdCd}:${normalizeMarkerAptName(aptName)}`
  const cached = latestPlaceDealCache.get(cacheKey)
  if (cached) return cached

  const promise = (async () => {
    try {
      const params = new URLSearchParams({
        lawdCd,
        aptName,
        monthsBack: '60',
      })
      const response = await fetch(`/api/rtms/latest-apartment-deal?${params.toString()}`)
      const payload = response.ok ? ((await response.json()) as LatestApartmentDealResponse) : null
      return payload?.deal ?? null
    } catch {
      return null
    }
  })()

  latestPlaceDealCache.set(cacheKey, promise)
  return promise
}

const markerFromLatestDeal = (marker: MapValueMarker, latestDeal: LiveRtmsDeal): MapValueMarker => ({
  ...marker,
  id: `place-${latestDeal.aptSeq || latestDeal.id}`,
  label: latestDeal.tradeType === 'direct' ? '직거래' : '매매',
  aptName: latestDeal.aptName,
  address: latestDeal.address,
  lawdCd: latestDeal.lawdCd,
  aptSeq: latestDeal.aptSeq,
  dealDate: latestDeal.dealDate,
  tradeTypeLabel: '최근 5년 확인',
  priceEok: latestDeal.priceEok,
  hasPrice: true,
  dateLabel: formatMarkerMonth(latestDeal.dealDate),
  subLabel: `${latestDeal.pyeong}평`,
  tone: latestDeal.tradeType === 'direct' ? 'direct' : 'sale',
  relatedDeals: [latestDeal],
})

const createEmptyPlaceMarker = (place: KakaoPlaceResult): MapValueMarker | null => {
  const lat = Number(place.y)
  const lng = Number(place.x)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const address = place.road_address_name || place.address_name
  const lawdCd = getLawdCdFromRegion(address)

  return {
    id: `place-${place.id || normalizeSearchText(`${place.place_name}-${address}`)}`,
    label: '단지',
    aptName: place.place_name,
    address,
    lawdCd,
    tradeTypeLabel: '최근 5년 거래 없음',
    priceEok: 0,
    hasPrice: false,
    dateLabel: '',
    subLabel: '거래 없음',
    lat,
    lng,
    tone: 'office',
    relatedDeals: [],
  }
}

const placeMarkerSearchCache = new Map<string, Promise<MapValueMarker[]>>()

const getKakaoLatLngNumber = (position: KakaoLatLng, method: 'getLat' | 'getLng') => {
  const getter = (position as { [key in 'getLat' | 'getLng']?: () => number })[method]
  const value = typeof getter === 'function' ? getter.call(position) : 0
  return Number.isFinite(value) ? value : 0
}

const getPlaceSearchCacheKey = (map: KakaoMapInstance) => {
  const center = map.getCenter()
  const lat = getKakaoLatLngNumber(center, 'getLat')
  const lng = getKakaoLatLngNumber(center, 'getLng')
  return `${map.getLevel()}:${lat.toFixed(3)}:${lng.toFixed(3)}`
}

const searchApartmentPlaceMarkers = (
  kakao: KakaoNamespace,
  map: KakaoMapInstance,
  existingMarkers: MapValueMarker[],
) => {
  const cacheKey = getPlaceSearchCacheKey(map)
  const cached = placeMarkerSearchCache.get(cacheKey)
  if (cached) return cached

  const promise = new Promise<MapValueMarker[]>((resolve) => {
    if (!kakao.maps.services?.Places) {
      resolve([])
      return
    }

    const places = new kakao.maps.services.Places()
    const statusOk = kakao.maps.services.Status.OK
    const existingNames = new Set(existingMarkers.map((marker) => normalizeMarkerAptName(marker.aptName)))

    places.keywordSearch(
      '아파트',
      (result, status) => {
        if (status !== statusOk || result.length === 0) {
          resolve([])
          return
        }

        const baseMarkers = result
          .map(createEmptyPlaceMarker)
          .filter((marker): marker is MapValueMarker => Boolean(marker))
          .filter((marker) => Boolean(marker.lawdCd))
          .filter((marker, index, list) => {
            const normalizedName = normalizeMarkerAptName(marker.aptName)
            return (
              normalizedName.length > 0 &&
              !existingNames.has(normalizedName) &&
              index === list.findIndex((candidate) => normalizeMarkerAptName(candidate.aptName) === normalizedName)
            )
          })
          .slice(0, 14)

        void Promise.all(
          baseMarkers.map(async (marker) => {
            if (!marker.lawdCd) return null

            const latestDeal = await fetchLatestDealForPlaceMarker(marker.lawdCd, marker.aptName)
            return latestDeal ? markerFromLatestDeal(marker, latestDeal) : null
          }),
        ).then((markers) =>
          resolve(
            markers
              .filter((marker): marker is MapValueMarker => Boolean(marker))
              .filter(hasDisplayableMarkerPrice),
          ),
        )
      },
      {
        location: map.getCenter(),
        radius: 1800,
        size: 15,
      },
    )
  })
  placeMarkerSearchCache.set(cacheKey, promise)
  return promise
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
  onReportClick,
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
  onReportClick: () => void
}) {
  const mapNode = useRef<HTMLDivElement | null>(null)
  const kakaoMapRef = useRef<KakaoMapInstance | null>(null)
  const selectedMarkerRef = useRef<MapValueMarker | null>(selectedMarker)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [placeFallbackCount, setPlaceFallbackCount] = useState(0)
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
        const center = new kakao.maps.LatLng(37.3963, 126.9651)
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

        const displayLiveMarkers = liveMarkers.filter(hasDisplayableMarkerPrice)
        const displayListingMarkers = listingMarkers.filter(hasDisplayableMarkerPrice)
        const liveMarkerNames = new Set(displayLiveMarkers.map((marker) => normalizeSearchText(marker.aptName)))
        const specMarkers = apartmentMarkers(apartments, latestApartmentDeals).filter(
          (marker) => !liveMarkerNames.has(normalizeSearchText(marker.aptName)) && hasDisplayableMarkerPrice(marker),
        )
        const markers = [...displayListingMarkers, ...displayLiveMarkers, ...specMarkers]

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
        let placeOverlays: KakaoOverlay[] = []
        let placeMarkerNodes: HTMLElement[] = []
        let placeRefreshTimer: number | null = null
        let activePlaceSearchKey = ''

        const focusedListingMarker = focusListing
          ? displayListingMarkers.find((marker) => marker.listing?.id === focusListing.id)
          : null
        const focusedLiveMarker = focusLiveDeal
          ? displayLiveMarkers.find((marker) =>
              marker.relatedDeals.some(
                (deal) =>
                  deal.id === focusLiveDeal.id ||
                  (focusLiveDeal.aptSeq && deal.aptSeq === focusLiveDeal.aptSeq),
              ),
            )
          : null
        const primaryMarker = focusedListingMarker ?? focusedLiveMarker ?? markers[0]
        if (primaryMarker) {
          map.setCenter(new kakao.maps.LatLng(primaryMarker.lat, primaryMarker.lng))
          map.setLevel(4)
        }

        const focusedMarker = focusedListingMarker ?? focusedLiveMarker
        if (focusedMarker && selectedMarkerRef.current?.id !== focusedMarker.id) {
          onSelectMarker(focusedMarker, { scrollToDetail: Boolean(focusListing) })
        }

        const updateDensity = () => {
          const visibleNodeCount = markerNodes.length + placeMarkerNodes.length
          const compact = map.getLevel() >= 6 || (visibleNodeCount > 45 && map.getLevel() >= 4)
          markerNodes.forEach((node) => node.classList.toggle('compact', compact))
          placeMarkerNodes.forEach((node) => node.classList.toggle('compact', compact))
        }

        const clearPlaceOverlays = () => {
          placeOverlays.forEach((overlay) => overlay.setMap(null))
          placeOverlays = []
          placeMarkerNodes = []
          if (!disposed) setPlaceFallbackCount(0)
        }

        const refreshPlaceFallbackMarkers = () => {
          if (placeRefreshTimer) window.clearTimeout(placeRefreshTimer)

          placeRefreshTimer = window.setTimeout(() => {
            placeRefreshTimer = null

            if (disposed || map.getLevel() > 5) {
              activePlaceSearchKey = ''
              clearPlaceOverlays()
              return
            }

            const placeSearchKey = getPlaceSearchCacheKey(map)
            if (placeSearchKey === activePlaceSearchKey && placeOverlays.length > 0) {
              updateDensity()
              return
            }
            activePlaceSearchKey = placeSearchKey

            void searchApartmentPlaceMarkers(kakao, map, markers).then((placeMarkers) => {
              if (disposed || placeSearchKey !== activePlaceSearchKey) return

              clearPlaceOverlays()
              placeMarkerNodes = placeMarkers.map((marker) => {
                const position = new kakao.maps.LatLng(marker.lat, marker.lng)
                const content = createValueMarkerElement(marker, () => {
                  onSelectMarker(marker)
                  map.setCenter(position)
                  map.setLevel(4)
                })
                const overlay = new kakao.maps.CustomOverlay({
                  position,
                  content,
                  xAnchor: 0.5,
                  yAnchor: 1,
                })
                overlay.setMap(map)
                placeOverlays.push(overlay)
                return content
              })
              setPlaceFallbackCount(placeMarkers.length)

              updateDensity()
            })
          }, 350)
        }

        updateDensity()
        kakao.maps.event?.addListener(map, 'zoom_changed', updateDensity)
        kakao.maps.event?.addListener(map, 'idle', refreshPlaceFallbackMarkers)
        refreshPlaceFallbackMarkers()

        setMapReady(true)
        cleanup = () => {
          if (placeRefreshTimer) window.clearTimeout(placeRefreshTimer)
          overlays.forEach((overlay) => overlay.setMap(null))
          clearPlaceOverlays()
        }
      })
      .catch(() => setMapError(true))

    return () => {
      disposed = true
      kakaoMapRef.current = null
      cleanup?.()
    }
  }, [apartments, focusListing, focusLiveDeal, kakaoKey, latestApartmentDeals, liveDeals, onSelectMarker, serverMarkers, userListings])

  const hasDisplayableMarkers =
    serverMarkers.some(hasDisplayableMarkerPrice) ||
    liveDeals.length > 0 ||
    userListings.length > 0 ||
    apartmentMarkers(apartments, latestApartmentDeals).some(hasDisplayableMarkerPrice) ||
    placeFallbackCount > 0
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
        <button className="map-report-cta" type="button" onClick={() => onReportClick()}>
          우리 동네 리포트 보기
          <FileText size={15} />
        </button>
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
                monthsBack: '60',
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

const markerHistoryCache = new Map<string, { deals: LiveRtmsDeal[]; status: 'ready' | 'fallback' }>()

const getMarkerHistoryCacheKey = (marker: MapValueMarker) =>
  [
    marker.lawdCd || 'no-lawd',
    marker.aptSeq || normalizeSearchText(marker.aptName),
    marker.dealDate || marker.dateLabel || 'no-date',
  ].join(':')

function useMarkerHistory(marker: MapValueMarker) {
  const seedDeals = useMemo(() => dedupeDeals(marker.relatedDeals), [marker])
  const historyCacheKey = useMemo(() => getMarkerHistoryCacheKey(marker), [marker])
  const cachedHistory = markerHistoryCache.get(historyCacheKey) ?? null
  const [remoteHistory, setRemoteHistory] = useState<{
    markerId: string
    deals: LiveRtmsDeal[]
    status: 'ready' | 'fallback'
  } | null>(null)

  useEffect(() => {
    if (!marker.lawdCd || !marker.dealDate) {
      return
    }

    if (cachedHistory) {
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
          const nextHistory = {
            deals: dedupeDeals([...remoteDeals, ...seedDeals]),
            status: 'ready' as const,
          }
          markerHistoryCache.set(historyCacheKey, nextHistory)
          setRemoteHistory({
            markerId: marker.id,
            ...nextHistory,
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

    const timerId = window.setTimeout(fetchHistory, 120)

    return () => {
      controller.abort()
      window.clearTimeout(timerId)
    }
  }, [cachedHistory, historyCacheKey, marker, seedDeals])

  const isCurrent = remoteHistory?.markerId === marker.id
  const resolvedHistory = cachedHistory ?? (isCurrent ? remoteHistory : null)

  return {
    history: resolvedHistory ? resolvedHistory.deals : seedDeals,
    status: resolvedHistory ? resolvedHistory.status : seedDeals.length > 0 ? 'fallback' : marker.lawdCd ? 'loading' : 'fallback',
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
  const [pyeongSelection, setPyeongSelection] = useState<{ markerId: string; band: TradePyeongBandKey }>({
    markerId: marker.id,
    band: 'p34',
  })
  const listing = marker.listing
  const isSpecMarker = Boolean(marker.apartment) && marker.tradeTypeLabel === '기본 스펙'
  const availablePyeongBands = useMemo(() => {
    const bandMap = new Map<TradePyeongBandKey, { key: TradePyeongBandKey; label: string; count: number }>()

    history.forEach((deal) => {
      const band = getTradePyeongBand(deal.pyeong)
      const current = bandMap.get(band.key)
      bandMap.set(band.key, {
        key: band.key,
        label: band.label,
        count: (current?.count ?? 0) + 1,
      })
    })

    return tradePyeongBands
      .map((band) => bandMap.get(band.key))
      .filter((band): band is { key: TradePyeongBandKey; label: string; count: number } => Boolean(band))
  }, [history])
  const selectedPyeongBand = pyeongSelection.markerId === marker.id ? pyeongSelection.band : 'p34'
  const defaultPyeongBand =
    availablePyeongBands.find((band) => band.key === 'p34')?.key ??
    (history[0] ? getTradePyeongBand(history[0].pyeong).key : 'p34')
  const activePyeongBand = availablePyeongBands.some((band) => band.key === selectedPyeongBand)
    ? selectedPyeongBand
    : defaultPyeongBand
  const selectedBandHistory = useMemo(
    () => history.filter((deal) => getTradePyeongBand(deal.pyeong).key === activePyeongBand),
    [activePyeongBand, history],
  )
  const chartSourceDeals = [...selectedBandHistory]
    .filter((deal) => deal.dealDate >= '2022-01-01')
    .sort((a, b) => dealTimestamp(a) - dealTimestamp(b))
  const latestDeal = selectedBandHistory[0] ?? history[0]
  const chartDeals = chartSourceDeals.length ? chartSourceDeals : latestDeal ? [latestDeal] : []
  const hasTradePrice = Boolean(latestDeal) || (marker.hasPrice !== false && marker.priceEok > 0)
  const prices = chartDeals.map((deal) => deal.priceEok)
  const minPrice = prices.length ? Math.min(...prices) : 0
  const maxPrice = prices.length ? Math.max(...prices) : 0
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
    : '최근 5년 거래 없음'

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
          <strong>{hasTradePrice ? formatEok(latestDeal?.priceEok ?? marker.priceEok) : '최근 5년 거래 없음'}</strong>
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
            {availablePyeongBands.length > 0 && (
              <div className="trend-pyeong-tabs" aria-label="평형별 매매 추이 선택">
                {availablePyeongBands.map((band) => (
                  <button
                    key={band.key}
                    className={activePyeongBand === band.key ? 'active' : ''}
                    type="button"
                    onClick={() => setPyeongSelection({ markerId: marker.id, band: band.key })}
                  >
                    {band.label}
                    <small>{band.count}건</small>
                  </button>
                ))}
              </div>
            )}

            {chartDeals.length > 0 ? (
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
            ) : (
              <div className="trend-empty">
                <strong>최근 5년 실거래 없음</strong>
                <p>단지 위치와 대장 정보는 그대로 확인할 수 있고, 거래가 신고되면 자동으로 가격 마커가 채워집니다.</p>
              </div>
            )}
          </div>

          {history.length > 0 && (
            <div className="history-list">
              {selectedBandHistory.slice(0, 5).map((deal) => (
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
      {!listing && <AiTrendAnalysisPanel marker={marker} history={selectedBandHistory.length ? selectedBandHistory : history} />}
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
  aiPreferenceRanks,
  setAiPreferenceRanks,
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
  aiPreferenceRanks: AiPreferenceKey[]
  setAiPreferenceRanks: (value: AiPreferenceKey[] | ((current: AiPreferenceKey[]) => AiPreferenceKey[])) => void
  budget: number
  stretch: number
  apartments: RecommendedApartment[]
}) {
  const [hasSearched, setHasSearched] = useState(false)
  const searchResults = useMemo(() => (hasSearched ? apartments.slice(0, 5) : []), [apartments, hasSearched])
  const rankedPreferences = uniqueAiPreferenceRanks(aiPreferenceRanks)

  const handleRecommendationSearch = () => {
    setHasSearched(true)
  }

  const handlePreferenceRankChange = (rankIndex: number, value: AiPreferenceKey) => {
    setAiPreferenceRanks((currentRanks) => {
      const nextRanks = uniqueAiPreferenceRanks([...currentRanks])
      const previousIndex = nextRanks.indexOf(value)

      if (previousIndex >= 0 && previousIndex !== rankIndex) {
        nextRanks[previousIndex] = nextRanks[rankIndex]
      }

      nextRanks[rankIndex] = value
      return uniqueAiPreferenceRanks(nextRanks)
    })
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
          <strong>1~4순위 기준으로 점수화</strong>
        </div>
        <p className="ai-ranking-note">
          선호 조건을 먼저 반영하되 서울 입지에는 가점을 주고, 점수가 비슷한 단지는 평형별 실거래 추이, 단지 내 상승률,
          인덕원·GTX-C·동탄인덕원선·월곶판교선 같은 교통 호재를 함께 반영합니다.
        </p>
        <div className="preference-rank-grid" aria-label="추천 우선순위">
          {rankedPreferences.map((rank, index) => (
            <label className="preference-rank-card" key={`ai-rank-${index + 1}`}>
              <span>{index + 1}순위</span>
              <select value={rank} onChange={(event) => handlePreferenceRankChange(index, event.target.value as AiPreferenceKey)}>
                {aiPreferenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
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
            <p>1~4순위 선호도를 먼저 반영하고, 나머지는 실거래 추이와 개발 호재를 함께 고려합니다.</p>
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
          searchResults.map((apartment, index) => {
            const latestRecommendationDeal = apartment.recentDeals[0]

            return (
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
                {apartment.region} · {apartment.station} · {officeArea} 대중교통 {apartment.commuteToOffice}분
              </p>
              {latestRecommendationDeal && (
                <div className="recommend-deal-strip" aria-label={`${apartment.name} 최근 실거래`}>
                  <span>최근 실거래</span>
                  <strong>{formatEok(latestRecommendationDeal.priceEok)}</strong>
                  <em>
                    {latestRecommendationDeal.date}
                    {latestRecommendationDeal.pyeong ? ` · ${Math.round(latestRecommendationDeal.pyeong)}평` : ''}
                    {latestRecommendationDeal.tradeTypeLabel ? ` · ${latestRecommendationDeal.tradeTypeLabel}` : ''}
                  </em>
                </div>
              )}
              <div className="recommend-meta-row">
                <span className={apartment.source === 'rtms' ? 'source-pill live' : 'source-pill'}>
                  {apartment.source === 'rtms' ? '실거래가 기반' : '초기 표본'}
                </span>
                <span className="upside-pill">상승여력 {apartment.upsideScore}점</span>
                <span className="growth-pill">1년 {formatGrowth(apartment.oneYearGrowthRate)}</span>
                <span>{apartment.dealCount}건 분석</span>
                {apartment.developmentSignals[0] && <span>호재 {apartment.developmentSignals[0]}</span>}
                <a
                  className="commute-link"
                  href={apartment.commuteRouteUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${apartment.name}에서 ${officeArea}까지 카카오맵 대중교통 경로 확인`}
                >
                  <BusFront size={12} />
                  카카오맵 대중교통 확인
                  <ExternalLink size={11} />
                </a>
              </div>
              <div className="tag-row">
                {apartment.fitReasons.map((reason) => (
                  <span key={reason}>{reason}</span>
                ))}
              </div>
            </div>
          </article>
            )
          })}
      </div>

      <p className="fine-print">
        추천은 입력값과 공개 실거래가 기반의 참고 정보입니다. 직장 시간은 카카오맵 대중교통 경로 확인 링크를 함께 제공하며,
        자동 산출 API 연결 전까지 권역별 기준값으로 비교합니다.
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
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [birth, setBirth] = useState('')
  const [gender, setGender] = useState('선택 안함')
  const [interest, setInterest] = useState('직거래 매물 알림')
  const [agreements, setAgreements] = useState({
    service: false,
    privacy: false,
    location: false,
    listingSafety: false,
    marketing: false,
  })
  const [submitted, setSubmitted] = useState(false)
  const requiredAgreed = agreements.service && agreements.privacy && agreements.location && agreements.listingSafety
  const canSubmit =
    userId.trim().length >= 4 &&
    password.trim().length >= 6 &&
    name.trim().length >= 2 &&
    phone.trim().length >= 8 &&
    requiredAgreed

  const updateAgreement = (key: keyof typeof agreements, value: boolean) => {
    setAgreements((current) => ({ ...current, [key]: value }))
    setSubmitted(false)
  }

  const handleAgreeAll = (value: boolean) => {
    setAgreements({
      service: value,
      privacy: value,
      location: value,
      listingSafety: value,
      marketing: value,
    })
    setSubmitted(false)
  }

  const handleSubmit = () => {
    if (!canSubmit) return

    void sendTelegramLead('signup', {
      아이디: userId.trim(),
      이름: name.trim(),
      연락처: phone.trim(),
      생년월일: birth.trim() || '미입력',
      성별: gender,
      관심서비스: interest,
      필수약관동의: requiredAgreed ? '완료' : '미완료',
      마케팅수신동의: agreements.marketing ? '동의' : '미동의',
    })
    setSubmitted(true)
  }

  return (
    <section className="membership-card" aria-label="집직구 회원가입">
      <div>
        <span>회원가입</span>
        <strong>매물 등록과 알림을 한 번에</strong>
        <p>아이디를 만들면 관심 단지 알림, 매물 등록, 실소유자 확인 진행 상태를 이어서 관리할 수 있습니다.</p>
      </div>
      <label>
        <span>아이디</span>
        <input
          value={userId}
          onChange={(event) => {
            setUserId(event.target.value)
            setSubmitted(false)
          }}
          autoComplete="username"
          placeholder="영문/숫자 4자 이상"
        />
      </label>
      <label>
        <span>비밀번호</span>
        <input
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setSubmitted(false)
          }}
          type="password"
          autoComplete="new-password"
          placeholder="6자 이상"
        />
      </label>
      <label>
        <span>이름</span>
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setSubmitted(false)
          }}
          autoComplete="name"
          placeholder="이름"
        />
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
      <div className="membership-row">
        <label>
          <span>생년월일</span>
          <input
            value={birth}
            onChange={(event) => setBirth(event.target.value)}
            inputMode="numeric"
            placeholder="예: 900101"
          />
        </label>
        <label>
          <span>성별</span>
          <select value={gender} onChange={(event) => setGender(event.target.value)}>
            <option>선택 안함</option>
            <option>남성</option>
            <option>여성</option>
          </select>
        </label>
      </div>
      <label>
        <span>관심 내용</span>
        <select value={interest} onChange={(event) => setInterest(event.target.value)}>
          <option>직거래 매물 알림</option>
          <option>내 집 추천 상담</option>
          <option>매도인 검증 매물 등록</option>
        </select>
      </label>
      <div className="terms-panel" aria-label="회원가입 약관 동의">
        <label className="terms-all">
          <input
            type="checkbox"
            checked={Object.values(agreements).every(Boolean)}
            onChange={(event) => handleAgreeAll(event.target.checked)}
          />
          <span>전체 동의</span>
        </label>
        <label>
          <input type="checkbox" checked={agreements.service} onChange={(event) => updateAgreement('service', event.target.checked)} />
          <span>[필수] 집직구 서비스 이용약관</span>
        </label>
        <label>
          <input type="checkbox" checked={agreements.privacy} onChange={(event) => updateAgreement('privacy', event.target.checked)} />
          <span>[필수] 개인정보 수집·이용 동의</span>
        </label>
        <label>
          <input type="checkbox" checked={agreements.location} onChange={(event) => updateAgreement('location', event.target.checked)} />
          <span>[필수] 위치기반 서비스 이용 동의</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={agreements.listingSafety}
            onChange={(event) => updateAgreement('listingSafety', event.target.checked)}
          />
          <span>[필수] 허위매물 금지 및 실소유자 확인 동의</span>
        </label>
        <label>
          <input type="checkbox" checked={agreements.marketing} onChange={(event) => updateAgreement('marketing', event.target.checked)} />
          <span>[선택] 마케팅 정보 수신 동의</span>
        </label>
      </div>
      <button className="secondary-action" type="button" disabled={!canSubmit} onClick={handleSubmit}>
        회원가입 완료하기
      </button>
      {submitted && <p className="lead-success">가입 신청이 접수되었습니다. 매물 등록과 관심 단지 알림을 이어서 도와드릴게요.</p>}
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
          <span>직거래</span>
          <h2>등록 매물부터 바로 확인</h2>
        </div>
        <Store size={22} />
      </div>

      <section className="listing-market-section listing-market-primary" aria-label="등록된 직거래 매물">
        <div className="detail-section-head listing-market-head">
          <span>
            <ShieldCheck size={15} />
            등록된 매물
          </span>
          <div>
            <em>{userListings.length ? `${userListings.length}건` : '모집중'}</em>
            <button className="round-add-button" type="button" onClick={onRegister} aria-label="매물 등록하기">
              <Plus size={18} />
            </button>
          </div>
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
            <button className="secondary-action" type="button" onClick={onRegister}>
              첫 매물 등록하기
              <Plus size={16} />
            </button>
          </div>
        )}
      </section>

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
