import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import {
  BadgeCheck,
  BarChart3,
  ArrowLeft,
  Bell,
  Building2,
  BusFront,
  Calculator,
  CalendarDays,
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

type Mode =
  | 'prices'
  | 'ai'
  | 'listing'
  | 'directListings'
  | 'inheritance'
  | 'report'
  | 'subscription'
  | 'notifications'
const appModes: Mode[] = [
  'prices',
  'ai',
  'listing',
  'directListings',
  'inheritance',
  'report',
  'subscription',
  'notifications',
]
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

type AiPreferenceKey = 'pyeong' | 'subway' | 'commute' | 'growth' | 'newness' | 'direct'
type TradePyeongBandKey = 'under20' | 'p20' | 'p25' | 'p34' | 'p40' | 'over50'
type WorkplaceLocation = {
  address: string
  lat: number
  lng: number
  label: string
}

type WorkplaceAddressSuggestion = WorkplaceLocation & {
  id: string
  roadAddress?: string
  jibunAddress?: string
  source?: string
}

type MortgageRuleProfile = {
  ltvRatio: number
  priceCapEok: number
  isRegulatedArea: boolean
}

type FinancingPlan = {
  annualIncomeManwon: number
  assetsManwon: number
  existingDebtManwon: number
  estimatedExistingAnnualDebtManwon: number
  dsrRoomAnnualManwon: number
  dsrLimitLoanEok: number
  displayMaxPurchaseEok: number
  baseRatePercent: number
  stressRatePercent: number
  dsrCapPercent: number
  termYears: number
  assumedRegionLabel: string
  assumedRule: MortgageRuleProfile
  baseMonthlyPaymentManwon: number
  stressMonthlyPaymentManwon: number
}

type CandidateMortgagePlan = {
  isAffordable: boolean
  loanEok: number
  cashNeededEok: number
  cashBufferEok: number
  monthlyPaymentManwon: number
  stressMonthlyPaymentManwon: number
  dsrPercent: number
  ltvPercent: number
  rule: MortgageRuleProfile
}

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
  commuteSource: 'address-geocoded' | 'kakao-route-link' | 'estimated'
  upsideScore: number
  developmentSignals: string[]
  fitReasons: string[]
  source: 'rtms' | 'curated'
  oneYearGrowthRate: number | null
  latestDealDate: string
  dealCount: number
  mortgage: CandidateMortgagePlan
}

type DevelopmentTimelineItem = {
  label: string
  status: 'done' | 'active' | 'watch'
}

type DevelopmentProjectStatus = {
  name: string
  currentStage: string
  noticeDate?: string
  source?: string
  note?: string
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
  sourceName?: string
  sourceUrl?: string
  sourcePriority?: string[]
  stageLabels?: string[]
  projects?: DevelopmentProjectStatus[]
  timeline: DevelopmentTimelineItem[]
}

type ReportNewsItem = {
  title: string
  link: string
  source: string
  publishedAt: string
  keyword: string
}

type SubscriptionNotice = {
  id: string
  title: string
  address: string
  region: '전국' | '서울' | '경기' | '인천' | '부산'
  category: 'private' | 'public' | 'result'
  source: '청약홈' | 'LH 청약플러스' | 'SH 서울주택도시공사'
  status: string
  deadlineLabel: string
  visitors: number
  alerts: number
  isPopular?: boolean
  url: string
  updatedAt: string
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

type LiveDealSuggestionEntry = {
  deal: LiveRtmsDeal
  searchText: string
}

type UserListing = {
  id: string
  intent?: 'sell' | 'want'
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

type ListingsResponse = {
  ok: boolean
  listings: UserListing[]
  updatedAt?: string
}

type ListingComplexGroup = {
  key: string
  aptName: string
  address: string
  listings: UserListing[]
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
  contain?: (position: KakaoLatLng) => boolean
}
type KakaoMapInstance = {
  setBounds: (bounds: KakaoBounds) => void
  setCenter: (position: KakaoLatLng) => void
  setLevel: (level: number) => void
  getLevel: () => number
  getCenter: () => KakaoLatLng
  getBounds?: () => KakaoBounds
  relayout?: () => void
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

const blurActiveTextInput = () => {
  const activeElement = document.activeElement
  if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLSelectElement
  ) {
    activeElement.blur()
  }
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
    verified: '소유자 검증 대기',
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
    verified: '소유자 검증 대기',
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
    verified: '실거래 검증 대기',
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
  { id: 'subscription', label: '청약', icon: CalendarDays },
]

const seoulReportRegionOptions = [
  '서울 종로구',
  '서울 중구',
  '서울 용산구',
  '서울 성동구',
  '서울 광진구',
  '서울 동대문구',
  '서울 중랑구',
  '서울 성북구',
  '서울 강북구',
  '서울 도봉구',
  '서울 노원구',
  '서울 은평구',
  '서울 서대문구',
  '서울 마포구',
  '서울 양천구',
  '서울 강서구',
  '서울 구로구',
  '서울 금천구',
  '서울 영등포구',
  '서울 동작구',
  '서울 관악구',
  '서울 서초구',
  '서울 강남구',
  '서울 송파구',
  '서울 강동구',
]

const weeklyReportRegionOptions = [
  '안양시 동안구',
  '안양시 만안구',
  '의왕시',
  '과천시',
  ...seoulReportRegionOptions,
]

const baseWeeklyReportRegionKeywords: Record<string, string[]> = {
  '안양시 동안구': ['안양시동안구', '동안구', '평촌', '범계', '호계', '신촌', '귀인', '달안', '부림', '갈산', '비산', '관양', '인덕원'],
  '안양시 만안구': ['안양시만안구', '만안구', '안양동', '석수', '박달'],
  의왕시: ['의왕', '내손', '포일', '오전', '청계', '백운'],
  과천시: ['과천', '별양', '부림', '원문', '중앙', '갈현', '문원'],
}

const weeklyReportRegionKeywords: Record<string, string[]> = {
  ...baseWeeklyReportRegionKeywords,
  ...Object.fromEntries(
    seoulReportRegionOptions.map((region) => {
      const district = region.replace('서울 ', '')
      return [region, [region, district, district.replace('구', '')]]
    }),
  ),
}

const subscriptionRegionOptions: Array<SubscriptionNotice['region']> = ['전국', '서울', '경기', '인천', '부산']
const subscriptionTabOptions: Array<{
  id: SubscriptionNotice['category']
  label: string
}> = [
  { id: 'private', label: '민간분양' },
  { id: 'public', label: '공공분양' },
  { id: 'result', label: '분양결과' },
]

const fallbackSubscriptionNotices: SubscriptionNotice[] = [
  {
    id: 'applyhome-suwon-honors',
    title: '수원역아너스빌플라츠',
    address: '경기도 수원시 팔달구 고등동',
    region: '경기',
    category: 'private',
    source: '청약홈',
    status: '청약접수',
    deadlineLabel: 'D-2',
    visitors: 44192,
    alerts: 279,
    url: 'https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancListView.do',
    updatedAt: '2026-05-16',
  },
  {
    id: 'applyhome-wonjong',
    title: '중앙하이츠원종역',
    address: '경기도 부천시 오정구 원종동',
    region: '경기',
    category: 'private',
    source: '청약홈',
    status: '특별공급',
    deadlineLabel: 'D-2',
    visitors: 41273,
    alerts: 285,
    url: 'https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancListView.do',
    updatedAt: '2026-05-16',
  },
  {
    id: 'applyhome-onam',
    title: '오남역서희스타힐스여의재3단지',
    address: '경기도 남양주시 오남읍 양지리',
    region: '경기',
    category: 'private',
    source: '청약홈',
    status: '특별공급',
    deadlineLabel: 'D-10',
    visitors: 198046,
    alerts: 3157,
    isPopular: true,
    url: 'https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancListView.do',
    updatedAt: '2026-05-16',
  },
  {
    id: 'sh-godeok-gangil',
    title: '고덕강일 공공주택지구',
    address: '서울특별시 강동구 고덕강일지구',
    region: '서울',
    category: 'public',
    source: 'SH 서울주택도시공사',
    status: '공급공고 확인',
    deadlineLabel: '공고중',
    visitors: 32810,
    alerts: 612,
    url: 'https://www.i-sh.co.kr/main/lay2/program/S1T1C220/subMain2.do',
    updatedAt: '2026-05-16',
  },
  {
    id: 'sh-magok',
    title: '마곡지구 공공주택',
    address: '서울특별시 강서구 마곡동',
    region: '서울',
    category: 'public',
    source: 'SH 서울주택도시공사',
    status: '청약정보 확인',
    deadlineLabel: '서울공급',
    visitors: 28760,
    alerts: 541,
    url: 'https://www.i-sh.co.kr/main/lay2/program/S1T1C220/subMain2.do',
    updatedAt: '2026-05-16',
  },
  {
    id: 'lh-public-gyeonggi',
    title: 'LH 경기권 공공분양',
    address: '경기도권 신규 공공주택 공급',
    region: '경기',
    category: 'public',
    source: 'LH 청약플러스',
    status: '모집공고 확인',
    deadlineLabel: '공공분양',
    visitors: 62410,
    alerts: 1430,
    url: 'https://apply.lh.or.kr/lhapply/main.do',
    updatedAt: '2026-05-16',
  },
  {
    id: 'lh-incheon',
    title: 'LH 인천권 공공분양',
    address: '인천광역시 검단·계양권',
    region: '인천',
    category: 'public',
    source: 'LH 청약플러스',
    status: '모집공고 확인',
    deadlineLabel: '공공분양',
    visitors: 37500,
    alerts: 720,
    url: 'https://apply.lh.or.kr/lhapply/main.do',
    updatedAt: '2026-05-16',
  },
  {
    id: 'applyhome-result-seoul',
    title: '서울 민간분양 당첨자 발표',
    address: '서울 주요 분양 단지 결과',
    region: '서울',
    category: 'result',
    source: '청약홈',
    status: '당첨자 발표',
    deadlineLabel: '결과확인',
    visitors: 51220,
    alerts: 860,
    url: 'https://www.applyhome.co.kr/wa/waa/selectAptPrzwinCnfrmnList.do',
    updatedAt: '2026-05-16',
  },
  {
    id: 'lh-busan',
    title: '부산권 공공분양 모집',
    address: '부산광역시 공공주택 공급',
    region: '부산',
    category: 'public',
    source: 'LH 청약플러스',
    status: '모집공고 확인',
    deadlineLabel: '공공분양',
    visitors: 22480,
    alerts: 390,
    url: 'https://apply.lh.or.kr/lhapply/main.do',
    updatedAt: '2026-05-16',
  },
]

const developmentStageLabels = ['이슈화', '계획', '인허가', '착공·공사', '완공·반영']
const maintenanceStageLabels = [
  '정비구역지정',
  '추진위승인',
  '조합설립인가',
  '사업시행인가',
  '시공사선정',
  '관리처분인가',
  '이주',
  '철거신고',
  '착공신고',
  '준공인가',
  '이전고시',
  '조합해산',
]
const broadToMaintenanceStageIndex = [0, 2, 3, 8, 9]

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
  { value: 'growth', label: '상승여력·관심도', shortLabel: '상승여력' },
  { value: 'commute', label: '직장과의 거리', shortLabel: '직장' },
  { value: 'subway', label: '역과의 거리', shortLabel: '역세권' },
  { value: 'pyeong', label: '선호 평형', shortLabel: '평형' },
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
const formatRate = (value: number) => `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`
const formatListingStatus = (status: UserListing['verificationStatus']) =>
  status === 'verified' ? '실소유자 확인 완료' : '실소유자 검증 대기'
const getListingComplexKey = (listing: UserListing) =>
  normalizeSearchText(`${listing.aptName}-${listing.address}`).slice(0, 120)
const formatListingArea = (listing: UserListing) => `${listing.pyeong}평 / ${Math.round(listing.pyeong * 3.3058)}m²`
const formatListingFloor = (floor: number) => {
  if (!Number.isFinite(floor) || floor <= 0) return '층 확인'
  if (floor <= 3) return `${floor}층 · 저층`
  if (floor >= 20) return `${floor}층 · 고층`
  return `${floor}층`
}
const summarizeListingMemo = (listing: UserListing) => {
  const memo = listing.memo.trim()
  if (memo) {
    return memo
      .split(/[,·\n]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(', ')
  }

  return listing.intent === 'want' ? '매수 희망 조건 등록' : '입주협의, 실소유자 확인중'
}
const getDefaultRtmsDealYmd = () => {
  const date = new Date()
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
}
const getMapRtmsDealYmd = () => 'auto'
const EMPTY_LATEST_APARTMENT_DEALS: Record<string, LiveRtmsDeal> = Object.freeze({})
const MAX_BROWSER_LIVE_DEALS = 15000
const MAX_SEARCH_INDEX_DEALS = 3000
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
    plainBrief: '인덕원역 환승·공사 일정이 구체화되는지 지켜볼 단계입니다.',
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
    plainBrief: '안양역 주변 정비와 교통 개선 논의가 실제 사업으로 넘어가는지 지켜볼 단계입니다.',
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
    plainBrief: '신축 입주와 업무시설 입주가 생활권 가격에 얼마나 반영되는지 지켜볼 단계입니다.',
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

type SeoulIssueSeed = {
  title: string
  area: string
  buzzScore: number
  progress: number
  activeStageIndex: number
  expectedYear: string
  plainBrief: string
  phase?: string
  nextMilestone?: string
  priceImpact?: string
  affectedDongs: string[]
  relatedApartments: string[]
  keywords: string[]
  sourceName?: string
  sourceUrl?: string
  sourcePriority?: string[]
  stageLabels?: string[]
  currentStage?: string
  projects?: DevelopmentProjectStatus[]
  timeline?: DevelopmentTimelineItem[]
}

const seoulCleanupSourceName = '자치구 고시·서울시 정비사업 정보몽땅'
const seoulCleanupSearchUrl = 'https://cleanup.seoul.go.kr/cleanup/bsnssttus/lscrMainIndx.do'
const maintenanceKeywordPattern = /구역|뉴타운|재건축|재개발|모아타운|정비|가로주택|신속통합|전략정비/

const isMaintenanceStageSet = (stageLabels: string[]) =>
  stageLabels.length === maintenanceStageLabels.length && stageLabels[0] === maintenanceStageLabels[0]

const getMaintenanceSourcePriority = (district?: string) => [
  `${district ?? '자치구'} 고시·공고`,
  '정비사업 정보몽땅 추진경과',
  '서울시·국토부 발표',
]

const buildDevelopmentTimeline = (stageLabels: string[], activeStageIndex: number): DevelopmentTimelineItem[] => [
  { label: stageLabels[Math.max(0, activeStageIndex - 1)] ?? stageLabels[0] ?? '확인', status: 'done' },
  { label: stageLabels[activeStageIndex] ?? stageLabels[0] ?? '진행', status: 'active' },
  {
    label: stageLabels[Math.min(stageLabels.length - 1, activeStageIndex + 1)] ?? stageLabels.at(-1) ?? '다음',
    status: 'watch',
  },
]

const getIssueStageLabels = (seed: SeoulIssueSeed) => seed.stageLabels ?? maintenanceStageLabels

const getIssueActiveStageIndex = (seed: SeoulIssueSeed, stageLabels: string[]) => {
  if (seed.currentStage) {
    return Math.max(0, stageLabels.indexOf(seed.currentStage))
  }

  if (stageLabels === maintenanceStageLabels) {
    return broadToMaintenanceStageIndex[seed.activeStageIndex] ?? seed.activeStageIndex
  }

  return seed.activeStageIndex
}

const extractMaintenanceProjectNames = (seed: SeoulIssueSeed) => {
  const candidates = [seed.title, ...seed.keywords]
    .map((value) => value.trim())
    .filter((value) => maintenanceKeywordPattern.test(value))
  const unique = Array.from(new Set(candidates))

  return unique.length ? unique.slice(0, 3) : [seed.title]
}

const buildMaintenanceProjectStatuses = (
  seed: SeoulIssueSeed,
  stageLabels: string[],
  activeStageIndex: number,
  district?: string,
) => {
  if (seed.projects?.length) {
    return seed.projects
  }

  if (!isMaintenanceStageSet(stageLabels)) {
    return undefined
  }

  const currentStage = seed.currentStage ?? stageLabels[activeStageIndex] ?? '추진경과 확인'

  return extractMaintenanceProjectNames(seed).map((name) => ({
    name,
    currentStage,
    source: `${district ?? '자치구'} 고시·정비사업 정보몽땅`,
    note: '구역별 최신 고시를 우선 확인하고, 정비몽땅 추진경과로 보완합니다.',
  }))
}

const getProjectStageIndex = (stageLabels: string[], currentStage: string) => stageLabels.indexOf(currentStage)

const getProjectStageMeta = (stageLabels: string[], currentStage: string, noticeDate?: string) => {
  const stageIndex = getProjectStageIndex(stageLabels, currentStage)

  if (stageIndex < 0) {
    return noticeDate ? `${noticeDate} 고시 확인` : '공식 단계 업데이트 예정'
  }

  return noticeDate ? `${noticeDate} · ${stageIndex + 1}/${stageLabels.length}단계` : `${stageIndex + 1}/${stageLabels.length}단계`
}

const getProjectStageProgress = (stageLabels: string[], currentStage: string) => {
  const stageIndex = getProjectStageIndex(stageLabels, currentStage)
  return stageIndex < 0 ? 8 : Math.round(((stageIndex + 1) / stageLabels.length) * 100)
}

const toSeoulIssue = (seed: SeoulIssueSeed, rank: number, district?: string): DevelopmentIssue => {
  const stageLabels = getIssueStageLabels(seed)
  const activeStageIndex = getIssueActiveStageIndex(seed, stageLabels)
  const projects = buildMaintenanceProjectStatuses(seed, stageLabels, activeStageIndex, district)

  return {
    rank,
    title: seed.title,
    area: seed.area,
    buzzScore: seed.buzzScore,
    progress: seed.progress,
    activeStageIndex,
    expectedYear: seed.expectedYear,
    plainBrief: seed.plainBrief,
    phase: seed.phase ?? '정비사업 진행상황 확인',
    nextMilestone:
      seed.nextMilestone ?? '다음 확인: 자치구 고시, 정비사업 정보몽땅 추진경과, 관리처분·이주·분양 일정',
    priceImpact: seed.priceImpact ?? '사업 단계가 올라간 구역 주변 단지는 실거래와 전세가율을 함께 봐야 합니다.',
    affectedDongs: seed.affectedDongs,
    relatedApartments: seed.relatedApartments,
    keywords: seed.keywords,
    body: `${seed.area} 핵심 사업은 ${seed.keywords.join(' · ')} 흐름을 기준으로 주간 리포트에서 계속 추적합니다.`,
    sourceName: seed.sourceName ?? seoulCleanupSourceName,
    sourceUrl: seed.sourceUrl ?? seoulCleanupSearchUrl,
    sourcePriority:
      seed.sourcePriority ??
      (isMaintenanceStageSet(stageLabels)
        ? getMaintenanceSourcePriority(district)
        : ['서울시·국토부 발표', '자치구 고시·공고', '사업자 공지']),
    stageLabels,
    projects,
    timeline: seed.timeline ?? buildDevelopmentTimeline(stageLabels, activeStageIndex),
  }
}

const seoulIssueSeedsByDistrict: Record<string, SeoulIssueSeed[]> = {
  종로구: [
    {
      title: '세운·사직 도심 정비',
      area: '종로·사직·세운',
      buzzScore: 84,
      progress: 46,
      activeStageIndex: 2,
      expectedYear: '2026~2029 인허가 확인',
      plainBrief: '도심 정비와 노후 주거지 개선이 실제 착공으로 넘어가는지 보는 단계입니다.',
      affectedDongs: ['사직동', '종로', '세운상가 일대'],
      relatedApartments: ['경희궁자이', '광화문풍림스페이스본', '인왕산아이파크'],
      keywords: ['세운재정비', '사직2구역', '도심정비'],
    },
    {
      title: '창신·숭인 재생 전환',
      area: '창신·숭인',
      buzzScore: 72,
      progress: 34,
      activeStageIndex: 1,
      expectedYear: '2027~2030 방향성 확인',
      plainBrief: '재생지역이 정비사업으로 얼마나 전환되는지 확인해야 합니다.',
      affectedDongs: ['창신동', '숭인동'],
      relatedApartments: ['창신쌍용', '숭인한양', '동묘역 인근 단지'],
      keywords: ['창신숭인', '도시재생', '정비구역'],
    },
  ],
  중구: [
    {
      title: '세운·을지로 재정비',
      area: '을지로·충무로',
      buzzScore: 82,
      progress: 48,
      activeStageIndex: 2,
      expectedYear: '2026~2029 인허가 확인',
      plainBrief: '도심 재정비 구역별 인허가와 착공 일정이 핵심입니다.',
      affectedDongs: ['을지로', '충무로', '입정동'],
      relatedApartments: ['남산타운', '신당KCC스위첸', '서울역센트럴자이'],
      keywords: ['세운재정비', '도심정비', '을지로'],
    },
    {
      title: '신당·황학 생활권 정비',
      area: '신당·황학',
      buzzScore: 76,
      progress: 39,
      activeStageIndex: 1,
      expectedYear: '2027년 이후 관찰',
      plainBrief: '신당역·청구역 주변 노후 주거지 정비 속도를 봅니다.',
      affectedDongs: ['신당동', '황학동'],
      relatedApartments: ['롯데캐슬베네치아', '신당삼성', '청구e편한세상'],
      keywords: ['신당동 정비', '모아타운', '가로주택'],
    },
  ],
  용산구: [
    {
      title: '한남뉴타운 1~5구역',
      area: '한남·보광·동빙고',
      buzzScore: 98,
      progress: 64,
      activeStageIndex: 2,
      expectedYear: '2026 인가·관리처분 체크',
      plainBrief: '한남1~5구역은 단계가 각각 달라, 구역별 고시와 이주 일정을 따로 봐야 합니다.',
      nextMilestone: '다음 확인: 한남5 사업시행인가 이후 관리처분 준비, 한남3 관리처분 이후 이주 일정',
      priceImpact: '한남동 신축·고급 단지와 보광동 구축의 가격 차이를 함께 봐야 합니다.',
      affectedDongs: ['한남동', '보광동', '동빙고동'],
      relatedApartments: ['나인원한남', '한남더힐', '래미안첼리투스'],
      keywords: ['한남1구역', '한남2구역', '한남3구역', '한남4구역', '한남5구역', '재개발'],
      sourceUrl: 'https://cleanup.seoul.go.kr/assc/scrin-bbs/execute.do?cafeId=170900000102I07',
      currentStage: '사업시행인가',
      projects: [
        {
          name: '한남1구역',
          currentStage: '추진경과 확인',
          source: '용산구 고시·정비사업 정보몽땅',
          note: '최신 구역계·고시 공개분을 우선 확인하는 관찰 구역입니다.',
        },
        {
          name: '한남2구역',
          currentStage: '추진경과 확인',
          source: '용산구 고시·정비사업 정보몽땅',
          note: '조합 일정과 시공·인허가 변경 고시를 분리해서 확인합니다.',
        },
        {
          name: '한남3구역',
          currentStage: '관리처분인가',
          source: '용산구 고시·정비사업 정보몽땅',
          note: '관리처분 이후 이주·철거 일정이 가격 민감 구간입니다.',
        },
        {
          name: '한남4구역',
          currentStage: '시공사선정',
          source: '용산구 고시·정비사업 정보몽땅',
          note: '시공사 선정 이후 사업시행 변경·관리처분 일정을 봅니다.',
        },
        {
          name: '한남5구역',
          currentStage: '사업시행인가',
          noticeDate: '26.04.30',
          source: '용산구 고시·정비사업 정보몽땅',
          note: '고시 이후 관리처분 준비 단계 진입 여부를 확인합니다.',
        },
      ],
    },
    {
      title: '용산정비창 국제업무지구',
      area: '한강로·이촌·용산역',
      buzzScore: 91,
      progress: 45,
      activeStageIndex: 1,
      expectedYear: '2027~2030 계획 구체화',
      plainBrief: '용산역 일대 개발계획이 토지이용·착공 일정으로 구체화되는지 보는 단계입니다.',
      affectedDongs: ['한강로동', '이촌동', '용산동'],
      relatedApartments: ['용산푸르지오써밋', '래미안첼리투스', '한강맨션'],
      keywords: ['용산정비창', '국제업무지구', '용산역'],
      sourceName: '서울시·국토부 발표 확인',
    },
  ],
  성동구: [
    {
      title: '성수전략정비구역',
      area: '성수동·한강변',
      buzzScore: 94,
      progress: 55,
      activeStageIndex: 2,
      expectedYear: '2026~2029 인허가 확인',
      plainBrief: '성수 한강변 정비구역의 조합·인허가 일정이 가격 반응의 핵심입니다.',
      affectedDongs: ['성수동1가', '성수동2가'],
      relatedApartments: ['트리마제', '아크로서울포레스트', '성수전략정비 인접단지'],
      keywords: ['성수전략정비구역', '서울숲', '한강변'],
    },
    {
      title: '왕십리·마장 생활권 재편',
      area: '왕십리·마장·행당',
      buzzScore: 79,
      progress: 42,
      activeStageIndex: 1,
      expectedYear: '2027~2030 관찰',
      plainBrief: '역세권·준공업지 주변 정비 흐름을 확인하는 단계입니다.',
      affectedDongs: ['행당동', '마장동', '왕십리'],
      relatedApartments: ['텐즈힐', '서울숲리버뷰자이', '마장세림'],
      keywords: ['왕십리역', '마장동 정비', '역세권'],
    },
  ],
  광진구: [
    {
      title: '자양·구의 정비사업',
      area: '자양·구의',
      buzzScore: 84,
      progress: 47,
      activeStageIndex: 2,
      expectedYear: '2026~2029 인허가 확인',
      plainBrief: '구의역·자양동 주변 정비사업이 착공까지 이어지는지 확인합니다.',
      affectedDongs: ['자양동', '구의동'],
      relatedApartments: ['자양현대', '구의현대프라임', '광진트라팰리스'],
      keywords: ['자양동 정비', '구의역', '한강변'],
    },
    {
      title: '광장동 구축 재건축 관찰',
      area: '광장·아차산',
      buzzScore: 75,
      progress: 33,
      activeStageIndex: 1,
      expectedYear: '2027년 이후 관찰',
      plainBrief: '광장동 구축 단지의 재건축 추진 가능성을 봅니다.',
      affectedDongs: ['광장동'],
      relatedApartments: ['광장현대', '워커힐아파트', '광장극동'],
      keywords: ['광장동', '구축 재건축', '학군'],
    },
  ],
  동대문구: [
    {
      title: '청량리 재정비',
      area: '청량리·전농',
      buzzScore: 91,
      progress: 68,
      activeStageIndex: 3,
      expectedYear: '2026~2028 입주·상권 반영',
      plainBrief: '청량리역 일대 신축 입주와 상권 변화가 가격에 반영되는지 봅니다.',
      affectedDongs: ['청량리동', '전농동', '답십리동'],
      relatedApartments: ['청량리역롯데캐슬SKY-L65', '전농SK', '래미안크레시티'],
      keywords: ['청량리역', '재정비촉진', 'GTX'],
    },
    {
      title: '이문·휘경 뉴타운',
      area: '이문·휘경',
      buzzScore: 86,
      progress: 70,
      activeStageIndex: 3,
      expectedYear: '2026~2029 입주·분양',
      plainBrief: '이문·휘경권 대규모 입주가 주변 구축 가격에 미치는 영향을 봅니다.',
      affectedDongs: ['이문동', '휘경동'],
      relatedApartments: ['래미안라그란데', '이문아이파크자이', '휘경자이디센시아'],
      keywords: ['이문휘경뉴타운', '대규모 입주', '외대앞'],
    },
  ],
  중랑구: [
    {
      title: '상봉·망우 역세권',
      area: '상봉·망우',
      buzzScore: 78,
      progress: 42,
      activeStageIndex: 1,
      expectedYear: '2027~2030 관찰',
      plainBrief: '상봉터미널·망우역 일대 개발계획이 구체화되는지 확인합니다.',
      affectedDongs: ['상봉동', '망우동'],
      relatedApartments: ['상봉프레미어스엠코', '망우금호어울림', '상봉듀오트리스'],
      keywords: ['상봉터미널', '망우역', '역세권'],
    },
    {
      title: '면목동 모아타운',
      area: '면목',
      buzzScore: 73,
      progress: 36,
      activeStageIndex: 1,
      expectedYear: '2026~2028 지정 확인',
      plainBrief: '면목동 저층 주거지의 소규모 정비 지정 여부를 봅니다.',
      affectedDongs: ['면목동'],
      relatedApartments: ['사가정센트럴아이파크', '면목두산', '면목신성'],
      keywords: ['면목동', '모아타운', '가로주택정비'],
    },
  ],
  성북구: [
    {
      title: '장위뉴타운',
      area: '장위·석관',
      buzzScore: 88,
      progress: 66,
      activeStageIndex: 3,
      expectedYear: '2026~2029 구역별 입주',
      plainBrief: '장위뉴타운 구역별 분양·입주 일정이 가격을 나눕니다.',
      affectedDongs: ['장위동', '석관동'],
      relatedApartments: ['래미안장위포레카운티', '꿈의숲아이파크', '장위자이레디언트'],
      keywords: ['장위뉴타운', '구역별 입주', '석관동'],
    },
    {
      title: '길음·미아 생활권',
      area: '길음·하월곡',
      buzzScore: 80,
      progress: 53,
      activeStageIndex: 2,
      expectedYear: '2026~2028 인허가 확인',
      plainBrief: '길음뉴타운 주변 추가 정비와 교통 접근성을 확인합니다.',
      affectedDongs: ['길음동', '하월곡동', '돈암동'],
      relatedApartments: ['래미안길음센터피스', '길음뉴타운푸르지오', '돈암삼성'],
      keywords: ['길음뉴타운', '하월곡', '4호선'],
    },
  ],
  강북구: [
    {
      title: '미아뉴타운·번동 정비',
      area: '미아·번동',
      buzzScore: 78,
      progress: 52,
      activeStageIndex: 2,
      expectedYear: '2026~2029 구역별 추진',
      plainBrief: '미아뉴타운 잔여 구역과 번동 정비사업 속도를 봅니다.',
      affectedDongs: ['미아동', '번동'],
      relatedApartments: ['꿈의숲해링턴플레이스', '래미안트리베라', '북서울자이폴라리스'],
      keywords: ['미아뉴타운', '번동', '재개발'],
    },
    {
      title: '수유·우이 교통 접근성',
      area: '수유·우이',
      buzzScore: 70,
      progress: 40,
      activeStageIndex: 1,
      expectedYear: '2027~2030 관찰',
      plainBrief: '경전철 연결성과 역세권 정비가 거래에 반영되는지 봅니다.',
      affectedDongs: ['수유동', '우이동'],
      relatedApartments: ['수유벽산', '우이대우', '번동주공'],
      keywords: ['우이신설선', '경전철', '역세권'],
      sourceName: '서울시 교통자료 확인',
    },
  ],
  도봉구: [
    {
      title: '창동·상계 신경제중심지',
      area: '창동·도봉',
      buzzScore: 83,
      progress: 45,
      activeStageIndex: 1,
      expectedYear: '2027~2030 계획 확인',
      plainBrief: '창동역 일대 광역개발과 GTX-C 일정이 핵심입니다.',
      affectedDongs: ['창동', '도봉동'],
      relatedApartments: ['창동주공', '창동동아청솔', '도봉한신'],
      keywords: ['창동역', 'GTX-C', '창동상계'],
      sourceName: '서울시·국토부 발표 확인',
    },
    {
      title: '쌍문·방학 소규모 정비',
      area: '쌍문·방학',
      buzzScore: 68,
      progress: 34,
      activeStageIndex: 1,
      expectedYear: '2026~2029 관찰',
      plainBrief: '쌍문·방학동 저층 주거지 정비사업 지정 여부를 봅니다.',
      affectedDongs: ['쌍문동', '방학동'],
      relatedApartments: ['쌍문한양', '방학삼성래미안', '방학신동아'],
      keywords: ['쌍문동', '방학동', '모아타운'],
    },
  ],
  노원구: [
    {
      title: '상계주공 재건축',
      area: '상계·중계',
      buzzScore: 92,
      progress: 42,
      activeStageIndex: 1,
      expectedYear: '2026~2030 단지별 추진',
      plainBrief: '상계주공 단지별 안전진단·정비계획 속도가 핵심입니다.',
      affectedDongs: ['상계동', '중계동'],
      relatedApartments: ['상계주공', '중계그린', '은빛아파트'],
      keywords: ['상계주공', '재건축', '노후대단지'],
    },
    {
      title: '광운대역세권·동북권 교통',
      area: '월계·공릉',
      buzzScore: 84,
      progress: 50,
      activeStageIndex: 2,
      expectedYear: '2026~2029 착공 확인',
      plainBrief: '광운대역세권 개발과 GTX-C 일정이 월계·공릉권 변수입니다.',
      affectedDongs: ['월계동', '공릉동'],
      relatedApartments: ['월계시영', '공릉태강', '월계센트럴아이파크'],
      keywords: ['광운대역세권', 'GTX-C', '월계동'],
      sourceName: '서울시·국토부 발표 확인',
    },
  ],
  은평구: [
    {
      title: '수색·증산 뉴타운',
      area: '수색·증산',
      buzzScore: 89,
      progress: 69,
      activeStageIndex: 3,
      expectedYear: '2026~2029 입주 반영',
      plainBrief: '수색·증산권 신축 입주와 DMC 접근성이 가격에 반영되는지 봅니다.',
      affectedDongs: ['수색동', '증산동'],
      relatedApartments: ['DMC파인시티자이', 'DMC센트럴자이', 'DMC롯데캐슬더퍼스트'],
      keywords: ['수색증산뉴타운', 'DMC', '신축입주'],
    },
    {
      title: '불광·대조 재개발',
      area: '불광·대조',
      buzzScore: 78,
      progress: 55,
      activeStageIndex: 2,
      expectedYear: '2026~2028 인허가 확인',
      plainBrief: '불광·대조동 재개발 구역별 인허가와 착공 일정을 확인합니다.',
      affectedDongs: ['불광동', '대조동'],
      relatedApartments: ['북한산힐스테이트', '불광롯데캐슬', '대조삼성타운'],
      keywords: ['불광동', '대조동', '재개발'],
    },
  ],
  서대문구: [
    {
      title: '북아현뉴타운',
      area: '북아현·충정로',
      buzzScore: 91,
      progress: 62,
      activeStageIndex: 2,
      expectedYear: '2026~2029 구역별 인허가',
      plainBrief: '북아현 구역별 인허가와 이주 일정이 핵심입니다.',
      affectedDongs: ['북아현동', '충정로'],
      relatedApartments: ['e편한세상신촌', '아현역푸르지오', '충정로SK뷰'],
      keywords: ['북아현뉴타운', '재개발', '신촌'],
    },
    {
      title: '홍제·홍은 정비사업',
      area: '홍제·홍은',
      buzzScore: 76,
      progress: 45,
      activeStageIndex: 1,
      expectedYear: '2027~2030 관찰',
      plainBrief: '홍제·홍은 일대 저층 주거지 정비가 구역 지정으로 이어지는지 봅니다.',
      affectedDongs: ['홍제동', '홍은동'],
      relatedApartments: ['홍제센트럴아이파크', '홍제한양', '홍은벽산'],
      keywords: ['홍제동', '홍은동', '재개발'],
    },
  ],
  마포구: [
    {
      title: '아현·공덕 재개발 잔여축',
      area: '아현·공덕',
      buzzScore: 88,
      progress: 58,
      activeStageIndex: 2,
      expectedYear: '2026~2028 인허가 확인',
      plainBrief: '아현·공덕권 잔여 정비구역의 인허가와 분양 일정이 핵심입니다.',
      affectedDongs: ['아현동', '공덕동', '염리동'],
      relatedApartments: ['마포래미안푸르지오', '공덕자이', '마포프레스티지자이'],
      keywords: ['아현뉴타운', '공덕', '재개발'],
    },
    {
      title: '성산시영 재건축',
      area: '성산·상암',
      buzzScore: 82,
      progress: 40,
      activeStageIndex: 1,
      expectedYear: '2026~2030 사업성 확인',
      plainBrief: '성산시영 재건축 추진 속도와 DMC 생활권 수요를 봅니다.',
      affectedDongs: ['성산동', '상암동'],
      relatedApartments: ['성산시영', '상암월드컵파크', 'DMC래미안클라시스'],
      keywords: ['성산시영', 'DMC', '재건축'],
    },
  ],
  양천구: [
    {
      title: '목동 1~14단지 재건축',
      area: '목동·신정',
      buzzScore: 96,
      progress: 51,
      activeStageIndex: 2,
      expectedYear: '2026~2030 단지별 인허가',
      plainBrief: '목동 단지별 정비계획과 안전진단 통과 여부가 핵심입니다.',
      affectedDongs: ['목동', '신정동'],
      relatedApartments: ['목동신시가지', '목동센트럴아이파크위브', '목동파크자이'],
      keywords: ['목동신시가지', '재건축', '학군'],
    },
    {
      title: '신월·신정 생활권 정비',
      area: '신월·신정',
      buzzScore: 72,
      progress: 38,
      activeStageIndex: 1,
      expectedYear: '2027년 이후 관찰',
      plainBrief: '신월·신정동 저층 주거지 정비와 교통 접근성 개선을 봅니다.',
      affectedDongs: ['신월동', '신정동'],
      relatedApartments: ['신정뉴타운', '신월시영', '목동센트럴아이파크위브'],
      keywords: ['신월동', '신정뉴타운', '모아타운'],
    },
  ],
  강서구: [
    {
      title: '마곡 업무지구·공항철도권',
      area: '마곡·발산',
      buzzScore: 88,
      progress: 76,
      activeStageIndex: 4,
      expectedYear: '2026 이후 상권 안정',
      plainBrief: '마곡 업무지구 입주 효과가 주거 수요로 안정되는지 봅니다.',
      affectedDongs: ['마곡동', '발산동'],
      relatedApartments: ['마곡엠밸리', '마곡힐스테이트', '마곡수명산파크'],
      keywords: ['마곡', '업무지구', '공항철도'],
      sourceName: '서울시·SH 공급 자료 확인',
    },
    {
      title: '화곡동 모아타운',
      area: '화곡·등촌',
      buzzScore: 78,
      progress: 37,
      activeStageIndex: 1,
      expectedYear: '2026~2029 지정 확인',
      plainBrief: '화곡동 저층 주거지 정비사업 지정과 사업성을 봅니다.',
      affectedDongs: ['화곡동', '등촌동'],
      relatedApartments: ['화곡푸르지오', '등촌주공', '강서힐스테이트'],
      keywords: ['화곡동', '모아타운', '가로주택'],
    },
  ],
  구로구: [
    {
      title: '신도림·구로역세권 재편',
      area: '신도림·구로',
      buzzScore: 80,
      progress: 43,
      activeStageIndex: 1,
      expectedYear: '2027~2030 계획 확인',
      plainBrief: '구로역·신도림역 주변 노후 상업·주거지 정비를 봅니다.',
      affectedDongs: ['신도림동', '구로동'],
      relatedApartments: ['신도림대림', '신도림태영타운', '구로두산'],
      keywords: ['신도림역', '구로역', '역세권정비'],
    },
    {
      title: '개봉·고척 정비사업',
      area: '개봉·고척',
      buzzScore: 72,
      progress: 38,
      activeStageIndex: 1,
      expectedYear: '2026~2029 관찰',
      plainBrief: '개봉·고척동 구축 단지와 저층 주거지 정비 속도를 봅니다.',
      affectedDongs: ['개봉동', '고척동'],
      relatedApartments: ['개봉한마을', '고척아이파크', '개봉푸르지오'],
      keywords: ['개봉동', '고척동', '정비사업'],
    },
  ],
  금천구: [
    {
      title: '가산G밸리·독산 역세권',
      area: '가산·독산',
      buzzScore: 78,
      progress: 44,
      activeStageIndex: 1,
      expectedYear: '2026~2029 계획 확인',
      plainBrief: 'G밸리 직주근접 수요와 독산역 주변 정비를 같이 봅니다.',
      affectedDongs: ['가산동', '독산동'],
      relatedApartments: ['롯데캐슬골드파크', '독산한신', '가산두산위브'],
      keywords: ['G밸리', '독산역', '역세권'],
    },
    {
      title: '신안산선 시흥사거리권',
      area: '시흥·독산',
      buzzScore: 83,
      progress: 60,
      activeStageIndex: 3,
      expectedYear: '2026~2028 교통 반영',
      plainBrief: '신안산선 개통 기대가 시흥·독산 생활권에 반영되는지 확인합니다.',
      affectedDongs: ['시흥동', '독산동'],
      relatedApartments: ['금천롯데캐슬골드파크', '시흥벽산', '독산중앙하이츠'],
      keywords: ['신안산선', '시흥사거리', '교통호재'],
      sourceName: '국토부·서울시 교통자료 확인',
    },
  ],
  영등포구: [
    {
      title: '여의도 재건축',
      area: '여의도',
      buzzScore: 94,
      progress: 50,
      activeStageIndex: 2,
      expectedYear: '2026~2030 단지별 인허가',
      plainBrief: '여의도 노후 단지별 정비계획과 사업시행 일정이 핵심입니다.',
      affectedDongs: ['여의도동'],
      relatedApartments: ['시범아파트', '공작아파트', '광장아파트'],
      keywords: ['여의도 재건축', '한강변', '금융업무지'],
    },
    {
      title: '신길뉴타운',
      area: '신길·대림',
      buzzScore: 86,
      progress: 72,
      activeStageIndex: 3,
      expectedYear: '2026~2029 입주·잔여구역',
      plainBrief: '신길뉴타운 신축 입주와 잔여 구역 추진 상황을 봅니다.',
      affectedDongs: ['신길동', '대림동'],
      relatedApartments: ['래미안에스티움', '보라매SK뷰', '신길센트럴자이'],
      keywords: ['신길뉴타운', '보라매', '신축입주'],
    },
  ],
  동작구: [
    {
      title: '노량진뉴타운',
      area: '노량진·대방',
      buzzScore: 91,
      progress: 60,
      activeStageIndex: 2,
      expectedYear: '2026~2029 구역별 인허가',
      plainBrief: '노량진 구역별 관리처분과 이주 일정이 핵심입니다.',
      affectedDongs: ['노량진동', '대방동'],
      relatedApartments: ['노량진뉴타운 인접단지', '대방현대', '상도더샵'],
      keywords: ['노량진뉴타운', '재개발', '여의도접근'],
    },
    {
      title: '흑석뉴타운·상도 정비',
      area: '흑석·상도',
      buzzScore: 88,
      progress: 67,
      activeStageIndex: 3,
      expectedYear: '2026~2028 입주·잔여구역',
      plainBrief: '흑석권 신축 입주와 잔여 구역 분양 일정을 봅니다.',
      affectedDongs: ['흑석동', '상도동'],
      relatedApartments: ['아크로리버하임', '흑석자이', '상도푸르지오클라베뉴'],
      keywords: ['흑석뉴타운', '상도동', '한강변'],
    },
  ],
  관악구: [
    {
      title: '봉천·신림 재개발',
      area: '봉천·신림',
      buzzScore: 84,
      progress: 52,
      activeStageIndex: 2,
      expectedYear: '2026~2029 구역별 추진',
      plainBrief: '봉천·신림동 구역별 인허가와 착공 일정을 봅니다.',
      affectedDongs: ['봉천동', '신림동'],
      relatedApartments: ['관악드림타운', 'e편한세상서울대입구', '신림푸르지오'],
      keywords: ['봉천동 재개발', '신림동', '서울대입구'],
    },
    {
      title: '신림선·서부선 교통축',
      area: '신림·낙성대',
      buzzScore: 77,
      progress: 45,
      activeStageIndex: 1,
      expectedYear: '2027~2030 확인',
      plainBrief: '경전철 이용성과 서부선 계획이 생활권 가치에 반영되는지 봅니다.',
      affectedDongs: ['신림동', '봉천동', '낙성대동'],
      relatedApartments: ['관악파크푸르지오', '봉천현대', '신림건영'],
      keywords: ['신림선', '서부선', '경전철'],
      sourceName: '서울시 교통자료 확인',
    },
  ],
  서초구: [
    {
      title: '반포·잠원 재건축',
      area: '반포·잠원',
      buzzScore: 96,
      progress: 73,
      activeStageIndex: 3,
      expectedYear: '2026~2029 입주·분양',
      plainBrief: '반포·잠원 한강변 재건축 입주와 잔여 단지 인허가를 봅니다.',
      affectedDongs: ['반포동', '잠원동'],
      relatedApartments: ['래미안원베일리', '아크로리버파크', '신반포 메이플자이'],
      keywords: ['반포 재건축', '잠원', '한강변'],
    },
    {
      title: '방배 재건축벨트',
      area: '방배·서리풀',
      buzzScore: 90,
      progress: 70,
      activeStageIndex: 3,
      expectedYear: '2026~2028 입주·분양',
      plainBrief: '방배권 대형 재건축 단지 입주와 분양 일정이 이어지는지 봅니다.',
      affectedDongs: ['방배동'],
      relatedApartments: ['디에이치방배', '방배그랑자이', '래미안원페를라'],
      keywords: ['방배 재건축', '서리풀', '일반분양'],
    },
  ],
  강남구: [
    {
      title: '압구정 재건축',
      area: '압구정·청담',
      buzzScore: 99,
      progress: 50,
      activeStageIndex: 2,
      expectedYear: '2026~2030 구역별 인허가',
      plainBrief: '압구정 특별계획구역별 정비계획과 조합 일정이 핵심입니다.',
      affectedDongs: ['압구정동', '청담동'],
      relatedApartments: ['현대아파트', '한양아파트', '미성아파트'],
      keywords: ['압구정 재건축', '한강변', '특별계획구역'],
    },
    {
      title: '개포·대치 재건축 잔여축',
      area: '개포·대치',
      buzzScore: 93,
      progress: 72,
      activeStageIndex: 3,
      expectedYear: '2026~2029 입주·잔여 인허가',
      plainBrief: '개포 신축 입주와 대치 재건축 추진 속도를 같이 봅니다.',
      affectedDongs: ['개포동', '대치동', '일원동'],
      relatedApartments: ['디에이치퍼스티어아이파크', '래미안블레스티지', '은마아파트'],
      keywords: ['개포 재건축', '대치동', '학군'],
    },
  ],
  송파구: [
    {
      title: '잠실주공5단지',
      area: '잠실·신천',
      buzzScore: 96,
      progress: 54,
      activeStageIndex: 2,
      expectedYear: '2026~2030 인허가 확인',
      plainBrief: '잠실주공5단지 사업 단계와 한강변 계획이 송파 핵심 변수입니다.',
      affectedDongs: ['잠실동', '신천동'],
      relatedApartments: ['잠실주공5단지', '엘스', '리센츠'],
      keywords: ['잠실주공5단지', '재건축', '잠실'],
    },
    {
      title: '거여·마천 재정비',
      area: '거여·마천',
      buzzScore: 83,
      progress: 58,
      activeStageIndex: 2,
      expectedYear: '2026~2029 구역별 추진',
      plainBrief: '거여·마천 구역별 인허가와 분양 일정을 봅니다.',
      affectedDongs: ['거여동', '마천동'],
      relatedApartments: ['e편한세상송파파크센트럴', '거여새마을', '마천금호어울림'],
      keywords: ['거여마천', '재정비촉진', '위례 인접'],
    },
  ],
  강동구: [
    {
      title: '둔촌·고덕 신축 공급',
      area: '둔촌·고덕',
      buzzScore: 90,
      progress: 82,
      activeStageIndex: 4,
      expectedYear: '2026 이후 입주 안정',
      plainBrief: '대규모 신축 입주 이후 전세가율과 매매 회복 속도를 봅니다.',
      affectedDongs: ['둔촌동', '고덕동'],
      relatedApartments: ['올림픽파크포레온', '고덕그라시움', '고덕아르테온'],
      keywords: ['둔촌주공', '고덕', '대단지입주'],
    },
    {
      title: '천호·성내 재정비',
      area: '천호·성내',
      buzzScore: 82,
      progress: 55,
      activeStageIndex: 2,
      expectedYear: '2026~2029 구역별 추진',
      plainBrief: '천호역 일대 재정비와 한강변 생활권 변화가 핵심입니다.',
      affectedDongs: ['천호동', '성내동'],
      relatedApartments: ['래미안강동팰리스', '천호태영', '성내올림픽파크한양수자인'],
      keywords: ['천호뉴타운', '성내동', '역세권정비'],
    },
  ],
}

const seoulInfraIssueSeedsByDistrict: Record<string, SeoulIssueSeed> = {
  종로구: {
    title: '광화문·종로 도심 보행축',
    area: '광화문·종각·종로',
    buzzScore: 76,
    progress: 58,
    activeStageIndex: 3,
    expectedYear: '2026~2028 상권 반영',
    plainBrief: '광화문광장과 종로 보행환경 개선이 업무·관광 상권 회복으로 이어지는지 봅니다.',
    phase: '도심 보행·상권 재편',
    nextMilestone: '다음 확인: 공실률, 관광객 회복, 업무지 임대수요',
    priceImpact: '도심 직주근접 단지는 정비사업보다 업무·관광 상권 회복 여부가 중요할 수 있습니다.',
    affectedDongs: ['사직동', '청진동', '종로1~4가'],
    relatedApartments: ['경희궁자이', '광화문풍림스페이스본', '인왕산아이파크'],
    keywords: ['광화문광장', '도심보행축', '업무상권'],
    sourceName: '서울시 도심정책 확인',
    sourceUrl: 'https://news.seoul.go.kr/',
  },
  중구: {
    title: '서울역·남대문 업무상권 재편',
    area: '서울역·남대문·명동',
    buzzScore: 78,
    progress: 52,
    activeStageIndex: 2,
    expectedYear: '2026~2029 계획 확인',
    plainBrief: '서울역 일대 연결성과 명동·남대문 상권 회복이 주거 수요로 이어지는지 봅니다.',
    phase: '도심 업무·관광 상권 회복',
    nextMilestone: '다음 확인: 서울역 일대 개발계획, 명동 공실률, 관광 회복',
    priceImpact: '남산·서울역 생활권 단지는 임대수요와 업무지 접근성을 함께 봐야 합니다.',
    affectedDongs: ['회현동', '명동', '중림동'],
    relatedApartments: ['서울역센트럴자이', '남산타운', '충정로SK뷰'],
    keywords: ['서울역', '명동상권', '남대문'],
    sourceName: '서울시 도심정책 확인',
    sourceUrl: 'https://news.seoul.go.kr/',
  },
  용산구: {
    title: '용산역 광역환승·업무축',
    area: '용산역·한강로',
    buzzScore: 93,
    progress: 47,
    activeStageIndex: 1,
    expectedYear: '2027~2031 단계 확인',
    plainBrief: '용산역 광역환승과 국제업무지구 일정이 실제 착공 단계로 가는지 봅니다.',
    phase: '광역환승·업무지구 계획',
    nextMilestone: '다음 확인: 기반시설 계획, 개발계획 확정, 착공 일정',
    priceImpact: '이촌·한강로 단지는 장기 호재 기대와 실제 거래량을 분리해서 봐야 합니다.',
    affectedDongs: ['한강로동', '이촌동', '용산동'],
    relatedApartments: ['용산푸르지오써밋', '래미안첼리투스', '한강맨션'],
    keywords: ['용산역', '국제업무지구', '광역환승'],
    sourceName: '서울시·국토부 발표 확인',
    sourceUrl: 'https://www.molit.go.kr/',
  },
  성동구: {
    title: '성수 준공업지·상권 확장',
    area: '성수·서울숲',
    buzzScore: 92,
    progress: 69,
    activeStageIndex: 3,
    expectedYear: '2026~2028 상권 반영',
    plainBrief: '성수 업무·상권 확장이 주거 선호와 임대수요에 얼마나 반영되는지 봅니다.',
    phase: '업무·상권 확장',
    nextMilestone: '다음 확인: 오피스 입주, 상권 임대료, 한강변 정비계획',
    priceImpact: '성수권은 정비사업뿐 아니라 상권 프리미엄이 가격을 강하게 움직입니다.',
    affectedDongs: ['성수동1가', '성수동2가'],
    relatedApartments: ['트리마제', '아크로서울포레스트', '서울숲리버뷰자이'],
    keywords: ['성수상권', '준공업지', '서울숲'],
    sourceName: '서울시 도시계획 확인',
    sourceUrl: 'https://urban.seoul.go.kr/',
  },
  광진구: {
    title: '동서울터미널·구의역세권',
    area: '구의·강변',
    buzzScore: 86,
    progress: 44,
    activeStageIndex: 1,
    expectedYear: '2027~2030 계획 확인',
    plainBrief: '동서울터미널 현대화와 구의역세권 개발 방향이 구체화되는지 봅니다.',
    phase: '터미널·역세권 개발',
    nextMilestone: '다음 확인: 개발계획 확정, 착공 일정, 상권 배치',
    priceImpact: '강변·구의권은 터미널 개발이 확정될 때 구축 단지 재평가가 가능합니다.',
    affectedDongs: ['구의동', '자양동', '광장동'],
    relatedApartments: ['구의현대프라임', '자양현대', '광장현대'],
    keywords: ['동서울터미널', '구의역세권', '강변역'],
    sourceName: '서울시 도시계획 확인',
    sourceUrl: 'https://urban.seoul.go.kr/',
  },
  동대문구: {
    title: 'GTX-B·C 청량리 환승축',
    area: '청량리·전농',
    buzzScore: 92,
    progress: 58,
    activeStageIndex: 3,
    expectedYear: '2026~2030 공정 확인',
    plainBrief: '청량리역 광역철도 환승축이 실제 통근시간 개선으로 이어지는지 봅니다.',
    phase: '광역철도 공사·환승',
    nextMilestone: '다음 확인: GTX-B·C 공정, 환승 동선, 역세권 상권',
    priceImpact: '청량리역 반경 신축은 교통 공정과 입주 물량을 같이 봐야 합니다.',
    affectedDongs: ['청량리동', '전농동', '제기동'],
    relatedApartments: ['청량리역롯데캐슬SKY-L65', '래미안크레시티', '전농SK'],
    keywords: ['GTX-B', 'GTX-C', '청량리역'],
    sourceName: '국토부 광역철도 자료 확인',
    sourceUrl: 'https://www.molit.go.kr/',
  },
  중랑구: {
    title: '면목선·상봉망우 교통축',
    area: '면목·상봉·망우',
    buzzScore: 80,
    progress: 35,
    activeStageIndex: 1,
    expectedYear: '2027~2031 계획 확인',
    plainBrief: '면목선 논의와 상봉·망우 환승 접근성이 실거주 수요를 끌어올리는지 봅니다.',
    phase: '도시철도·환승 계획',
    nextMilestone: '다음 확인: 면목선 사업 일정, 상봉역세권 개발계획',
    priceImpact: '교통 개선 확정 전에는 저가 메리트와 거래량을 먼저 봐야 합니다.',
    affectedDongs: ['면목동', '상봉동', '망우동'],
    relatedApartments: ['사가정센트럴아이파크', '상봉프레미어스엠코', '망우금호어울림'],
    keywords: ['면목선', '상봉역', '망우역'],
    sourceName: '서울시 도시철도망 자료 확인',
    sourceUrl: 'https://news.seoul.go.kr/traffic/',
  },
  성북구: {
    title: '동북선·월곡 생활권',
    area: '월곡·길음·정릉',
    buzzScore: 81,
    progress: 61,
    activeStageIndex: 3,
    expectedYear: '2026~2028 공정 확인',
    plainBrief: '동북선 개통 기대가 월곡·정릉·길음권 접근성 개선으로 이어지는지 봅니다.',
    phase: '도시철도 공사',
    nextMilestone: '다음 확인: 동북선 공정률, 환승역 이용성, 역세권 거래',
    priceImpact: '경전철 역세권 단지는 실제 통근시간 단축이 확인되어야 프리미엄이 유지됩니다.',
    affectedDongs: ['월곡동', '정릉동', '길음동'],
    relatedApartments: ['래미안길음센터피스', '정릉풍림아이원', '월곡두산위브'],
    keywords: ['동북선', '월곡', '정릉'],
    sourceName: '서울시 도시철도망 자료 확인',
    sourceUrl: 'https://news.seoul.go.kr/traffic/',
  },
  강북구: {
    title: '동북선 연계·북서울 생활권',
    area: '미아·번동·수유',
    buzzScore: 74,
    progress: 42,
    activeStageIndex: 1,
    expectedYear: '2027~2030 확인',
    plainBrief: '강북권 경전철·상권 개선이 4호선 생활권을 보완하는지 봅니다.',
    phase: '교통·생활권 개선',
    nextMilestone: '다음 확인: 경전철 공정, 역세권 상권 변화, 학교·공원 접근성',
    priceImpact: '강북구는 교통 개선 확정성과 가격 메리트가 같이 맞아야 합니다.',
    affectedDongs: ['미아동', '번동', '수유동'],
    relatedApartments: ['북서울자이폴라리스', '래미안트리베라', '번동주공'],
    keywords: ['동북선', '우이신설선', '북서울꿈의숲'],
    sourceName: '서울시 교통자료 확인',
    sourceUrl: 'https://news.seoul.go.kr/traffic/',
  },
  도봉구: {
    title: 'GTX-C 창동역·창동상계',
    area: '창동·도봉',
    buzzScore: 88,
    progress: 46,
    activeStageIndex: 1,
    expectedYear: '2027~2030 공정 확인',
    plainBrief: 'GTX-C 창동역과 창동상계 개발이 착공·상권 변화로 이어지는지 봅니다.',
    phase: '광역철도·복합개발',
    nextMilestone: '다음 확인: GTX-C 공정, 창동역 복합개발 착공',
    priceImpact: '창동역 인근 구축 단지는 교통 일정이 구체화될 때 거래 반응을 확인합니다.',
    affectedDongs: ['창동', '도봉동'],
    relatedApartments: ['창동주공', '창동동아청솔', '도봉한신'],
    keywords: ['GTX-C', '창동역', '창동상계'],
    sourceName: '국토부·서울시 발표 확인',
    sourceUrl: 'https://www.molit.go.kr/',
  },
  노원구: {
    title: '광운대역세권·GTX-C',
    area: '월계·상계·공릉',
    buzzScore: 90,
    progress: 52,
    activeStageIndex: 2,
    expectedYear: '2026~2030 착공 확인',
    plainBrief: '광운대역세권 개발과 GTX-C 일정이 노후 대단지 재평가와 연결되는지 봅니다.',
    phase: '역세권 개발·광역철도',
    nextMilestone: '다음 확인: 광운대역세권 착공, GTX-C 공정, 상계단지 정비계획',
    priceImpact: '상계·월계권은 교통 호재와 재건축 속도가 함께 맞을 때 상승 탄력이 큽니다.',
    affectedDongs: ['월계동', '상계동', '공릉동'],
    relatedApartments: ['월계시영', '상계주공', '공릉태강'],
    keywords: ['광운대역세권', 'GTX-C', '상계주공'],
    sourceName: '국토부·서울시 발표 확인',
    sourceUrl: 'https://www.molit.go.kr/',
  },
  은평구: {
    title: '신분당선 서북부·DMC 연결',
    area: '불광·연신내·수색',
    buzzScore: 82,
    progress: 31,
    activeStageIndex: 1,
    expectedYear: '2027~2031 방향성 확인',
    plainBrief: '서북권 철도 연장 논의와 DMC 접근성이 실제 사업으로 이어지는지 봅니다.',
    phase: '철도 연장·업무지 연결',
    nextMilestone: '다음 확인: 예타·사업계획, DMC 접근성 개선, 수색역세권 계획',
    priceImpact: '연장 사업은 확정 전 변동성이 커서 역세권 거래량을 보수적으로 봅니다.',
    affectedDongs: ['불광동', '연신내', '수색동'],
    relatedApartments: ['DMC파인시티자이', '북한산힐스테이트', '불광롯데캐슬'],
    keywords: ['신분당선 서북부', 'DMC', '수색역'],
    sourceName: '서울시·국토부 교통자료 확인',
    sourceUrl: 'https://www.molit.go.kr/',
  },
  서대문구: {
    title: '서부선·신촌 업무상권',
    area: '신촌·홍제·북아현',
    buzzScore: 80,
    progress: 39,
    activeStageIndex: 1,
    expectedYear: '2027~2031 사업성 확인',
    plainBrief: '서부선 계획과 신촌 상권 회복이 주거 선호로 이어지는지 봅니다.',
    phase: '도시철도·상권 회복',
    nextMilestone: '다음 확인: 서부선 사업 일정, 신촌 상권 공실률, 대학가 임대수요',
    priceImpact: '북아현 신축과 신촌·홍제 역세권의 가격 차이가 줄어드는지 봅니다.',
    affectedDongs: ['신촌동', '홍제동', '북아현동'],
    relatedApartments: ['e편한세상신촌', '홍제센트럴아이파크', '아현역푸르지오'],
    keywords: ['서부선', '신촌상권', '홍제역'],
    sourceName: '서울시 도시철도망 자료 확인',
    sourceUrl: 'https://news.seoul.go.kr/traffic/',
  },
  마포구: {
    title: 'DMC·공덕 업무 연결축',
    area: '상암·공덕·합정',
    buzzScore: 86,
    progress: 64,
    activeStageIndex: 3,
    expectedYear: '2026~2028 수요 반영',
    plainBrief: 'DMC·공덕 업무수요와 합정 상권이 매매·전세 수요를 지지하는지 봅니다.',
    phase: '업무·상권 수요 반영',
    nextMilestone: '다음 확인: DMC 임대수요, 공덕 오피스 수요, 합정 상권 회복',
    priceImpact: '마포는 광화문·여의도·DMC 접근성이 동시에 작동하는지가 중요합니다.',
    affectedDongs: ['상암동', '공덕동', '합정동'],
    relatedApartments: ['마포래미안푸르지오', '공덕자이', '상암월드컵파크'],
    keywords: ['DMC', '공덕역', '합정상권'],
    sourceName: '서울시 도시계획 확인',
    sourceUrl: 'https://urban.seoul.go.kr/',
  },
  양천구: {
    title: '목동선·서부트럭터미널',
    area: '목동·신정·신월',
    buzzScore: 84,
    progress: 36,
    activeStageIndex: 1,
    expectedYear: '2027~2031 계획 확인',
    plainBrief: '목동선과 서부트럭터미널 개발 방향이 목동 재건축과 함께 움직이는지 봅니다.',
    phase: '교통·복합개발 계획',
    nextMilestone: '다음 확인: 목동선 사업 일정, 터미널 부지 개발계획',
    priceImpact: '목동 학군 프리미엄에 교통·상권 개선이 더해지는지 확인합니다.',
    affectedDongs: ['목동', '신정동', '신월동'],
    relatedApartments: ['목동신시가지', '목동센트럴아이파크위브', '신월시영'],
    keywords: ['목동선', '서부트럭터미널', '학군'],
    sourceName: '서울시 도시철도망·도시계획 확인',
    sourceUrl: 'https://news.seoul.go.kr/traffic/',
  },
  강서구: {
    title: '마곡MICE·김포공항 연결',
    area: '마곡·방화·공항동',
    buzzScore: 88,
    progress: 62,
    activeStageIndex: 3,
    expectedYear: '2026~2029 상권 반영',
    plainBrief: '마곡 업무·MICE 기능과 공항 접근성이 주거 수요로 이어지는지 봅니다.',
    phase: '업무·MICE·공항 연결',
    nextMilestone: '다음 확인: 마곡 MICE 공정, 기업 입주, 공항철도 수요',
    priceImpact: '마곡 신축은 업무지 입주와 상권 성숙도가 가격 방어력을 만듭니다.',
    affectedDongs: ['마곡동', '방화동', '공항동'],
    relatedApartments: ['마곡엠밸리', '방화동부센트레빌', '강서힐스테이트'],
    keywords: ['마곡MICE', '김포공항', '공항철도'],
    sourceName: '서울시·SH 사업자료 확인',
    sourceUrl: 'https://www.i-sh.co.kr/',
  },
  구로구: {
    title: 'G밸리·신도림 업무축',
    area: '구로·신도림·가산 인접',
    buzzScore: 82,
    progress: 55,
    activeStageIndex: 2,
    expectedYear: '2026~2029 수요 확인',
    plainBrief: 'G밸리 업무수요와 신도림 환승 접근성이 주거 수요를 얼마나 받치는지 봅니다.',
    phase: '업무지·환승 수요 확인',
    nextMilestone: '다음 확인: G밸리 고용, 신도림 환승 상권, 구로역 개발계획',
    priceImpact: '구로는 업무수요는 강하지만 주거환경 개선 속도가 가격 차이를 만듭니다.',
    affectedDongs: ['구로동', '신도림동'],
    relatedApartments: ['신도림대림', '신도림태영타운', '구로두산'],
    keywords: ['G밸리', '신도림역', '구로역'],
    sourceName: '서울시 경제·도시계획 확인',
    sourceUrl: 'https://urban.seoul.go.kr/',
  },
  금천구: {
    title: '신안산선·G밸리 남부축',
    area: '독산·시흥·가산',
    buzzScore: 86,
    progress: 60,
    activeStageIndex: 3,
    expectedYear: '2026~2028 개통 확인',
    plainBrief: '신안산선 공정과 G밸리 출퇴근 수요가 시흥·독산 가격에 반영되는지 봅니다.',
    phase: '광역철도 공사·업무지 연결',
    nextMilestone: '다음 확인: 신안산선 공정, 역세권 정비, G밸리 고용',
    priceImpact: '교통 개선이 현실화되면 금천 저평가 단지의 거래 회복 속도가 중요합니다.',
    affectedDongs: ['시흥동', '독산동', '가산동'],
    relatedApartments: ['롯데캐슬골드파크', '시흥벽산', '독산중앙하이츠'],
    keywords: ['신안산선', 'G밸리', '시흥사거리'],
    sourceName: '국토부·서울시 교통자료 확인',
    sourceUrl: 'https://www.molit.go.kr/',
  },
  영등포구: {
    title: '여의도 금융중심·신안산선',
    area: '여의도·영등포·신길',
    buzzScore: 92,
    progress: 63,
    activeStageIndex: 3,
    expectedYear: '2026~2028 교통 반영',
    plainBrief: '여의도 금융업무지와 신안산선 접근성 개선이 주거 선호에 반영되는지 봅니다.',
    phase: '업무지·광역철도 반영',
    nextMilestone: '다음 확인: 신안산선 공정, 여의도 업무지 임대수요, 역세권 거래',
    priceImpact: '여의도·신길권은 업무지 접근성과 신축 공급이 동시에 작동합니다.',
    affectedDongs: ['여의도동', '영등포동', '신길동'],
    relatedApartments: ['시범아파트', '신길센트럴자이', '보라매SK뷰'],
    keywords: ['여의도 금융중심', '신안산선', '신길뉴타운'],
    sourceName: '국토부·서울시 교통자료 확인',
    sourceUrl: 'https://www.molit.go.kr/',
  },
  동작구: {
    title: '서부선·노량진 환승축',
    area: '노량진·상도·흑석',
    buzzScore: 87,
    progress: 39,
    activeStageIndex: 1,
    expectedYear: '2027~2031 사업성 확인',
    plainBrief: '서부선과 노량진 환승 접근성이 정비사업 가치에 더해지는지 봅니다.',
    phase: '도시철도·환승 계획',
    nextMilestone: '다음 확인: 서부선 일정, 노량진역 환승 편의, 흑석권 입주',
    priceImpact: '동작은 여의도·강남 접근성이 좋아 교통 확정성이 가격 탄력을 키웁니다.',
    affectedDongs: ['노량진동', '상도동', '흑석동'],
    relatedApartments: ['아크로리버하임', '흑석자이', '상도더샵'],
    keywords: ['서부선', '노량진역', '환승'],
    sourceName: '서울시 도시철도망 자료 확인',
    sourceUrl: 'https://news.seoul.go.kr/traffic/',
  },
  관악구: {
    title: '신림선·서부선 남부축',
    area: '신림·서울대입구·낙성대',
    buzzScore: 82,
    progress: 46,
    activeStageIndex: 1,
    expectedYear: '2027~2031 확인',
    plainBrief: '신림선 이용성과 서부선 추진 여부가 관악 교통 약점을 얼마나 줄이는지 봅니다.',
    phase: '도시철도 접근성 개선',
    nextMilestone: '다음 확인: 서부선 사업 일정, 신림선 역세권 거래, 환승 편의',
    priceImpact: '교통 호재가 확정될수록 서울대입구·봉천권 정비사업 가치가 커집니다.',
    affectedDongs: ['신림동', '봉천동', '낙성대동'],
    relatedApartments: ['e편한세상서울대입구', '관악드림타운', '관악파크푸르지오'],
    keywords: ['신림선', '서부선', '서울대입구'],
    sourceName: '서울시 도시철도망 자료 확인',
    sourceUrl: 'https://news.seoul.go.kr/traffic/',
  },
  서초구: {
    title: '양재·서초 R&D 업무축',
    area: '양재·우면·서초',
    buzzScore: 86,
    progress: 50,
    activeStageIndex: 2,
    expectedYear: '2026~2029 계획 확인',
    plainBrief: '양재 R&D·업무축과 강남대로 상권 변화가 주거 선호를 받치는지 봅니다.',
    phase: '업무지·상권 계획',
    nextMilestone: '다음 확인: 양재 R&D 계획, 우면·양재 교통 개선, 오피스 수요',
    priceImpact: '서초는 재건축 외에도 업무지 확장과 학군 수요가 가격 방어력을 만듭니다.',
    affectedDongs: ['양재동', '우면동', '서초동'],
    relatedApartments: ['서초그랑자이', '래미안서초에스티지', '우면서초네이처힐'],
    keywords: ['양재R&D', '강남대로', '업무축'],
    sourceName: '서울시 도시계획 확인',
    sourceUrl: 'https://urban.seoul.go.kr/',
  },
  강남구: {
    title: '영동대로 복합환승·GTX',
    area: '삼성·대치·청담',
    buzzScore: 99,
    progress: 68,
    activeStageIndex: 3,
    expectedYear: '2026~2030 공정 확인',
    plainBrief: '영동대로 복합환승센터와 GTX-A/C가 삼성역 일대 가치를 어떻게 바꾸는지 봅니다.',
    phase: '광역환승·업무지 공사',
    nextMilestone: '다음 확인: 환승센터 공정, GTX 운행 일정, 현대차GBC 주변 변화',
    priceImpact: '삼성·대치·청담권은 교통·업무지 호재가 재건축 기대와 동시에 작동합니다.',
    affectedDongs: ['삼성동', '대치동', '청담동'],
    relatedApartments: ['은마아파트', '래미안대치팰리스', '청담자이'],
    keywords: ['영동대로', 'GTX-A', '복합환승센터'],
    sourceName: '서울시·국토부 교통자료 확인',
    sourceUrl: 'https://www.molit.go.kr/',
  },
  송파구: {
    title: '잠실 MICE·수서 광역교통',
    area: '잠실·문정·수서 인접',
    buzzScore: 94,
    progress: 48,
    activeStageIndex: 1,
    expectedYear: '2027~2031 계획 확인',
    plainBrief: '잠실 MICE와 수서 광역교통 영향이 송파 동부·남부까지 퍼지는지 봅니다.',
    phase: 'MICE·광역교통 계획',
    nextMilestone: '다음 확인: 잠실 MICE 개발계획, 위례신사선·수서역 교통 일정',
    priceImpact: '잠실권은 업무·상권 호재, 거여·마천은 정비사업 확정성이 중요합니다.',
    affectedDongs: ['잠실동', '문정동', '거여동'],
    relatedApartments: ['엘스', '리센츠', '헬리오시티'],
    keywords: ['잠실MICE', '수서역', '위례신사선'],
    sourceName: '서울시·국토부 발표 확인',
    sourceUrl: 'https://www.molit.go.kr/',
  },
  강동구: {
    title: '9호선 4단계·고덕비즈밸리',
    area: '고덕·강일·둔촌',
    buzzScore: 91,
    progress: 70,
    activeStageIndex: 3,
    expectedYear: '2026~2028 교통·업무 반영',
    plainBrief: '9호선 연장과 고덕비즈밸리 입주가 강동 주거수요를 얼마나 받치는지 봅니다.',
    phase: '철도 공사·업무지 입주',
    nextMilestone: '다음 확인: 9호선 공정, 업무시설 입주, 전세수요 변화',
    priceImpact: '고덕·강일권은 교통 개선과 업무지 수요가 전세가율 회복에 중요합니다.',
    affectedDongs: ['고덕동', '강일동', '둔촌동'],
    relatedApartments: ['고덕그라시움', '고덕아르테온', '올림픽파크포레온'],
    keywords: ['9호선 4단계', '고덕비즈밸리', '강일'],
    sourceName: '서울시 교통·도시계획 확인',
    sourceUrl: 'https://news.seoul.go.kr/traffic/',
  },
}

const buildSeoulDevelopmentNews = (region: string): DevelopmentIssue[] => {
  const district = region.replace('서울 ', '')
  const seededIssues = seoulIssueSeedsByDistrict[district]

  if (seededIssues?.length) {
    const infraIssue = seoulInfraIssueSeedsByDistrict[district]
    const allSeeds = infraIssue ? [...seededIssues, { ...infraIssue, stageLabels: developmentStageLabels }] : seededIssues

    return allSeeds.map((seed, index) => toSeoulIssue(seed, index + 1, district))
  }

  return [
    toSeoulIssue(
      {
      title: `${district} 정비사업`,
      area: district,
      buzzScore: 82,
      progress: 48,
      activeStageIndex: 2,
      expectedYear: '2027~2030 관찰',
      plainBrief: `${district} 주요 정비구역의 인허가와 이주 일정이 핵심입니다.`,
      phase: '정비사업 일정 확인',
      nextMilestone: '다음 확인: 구역별 조합 일정, 이주·철거 계획, 일반분양 시점',
      priceImpact: '정비사업 인접 단지는 신축 기대와 전세 이주 수요를 함께 확인해야 합니다.',
      affectedDongs: [district],
      relatedApartments: [`${district} 주요 구축 단지`, `${district} 역세권 단지`, `${district} 신축 단지`],
      keywords: ['재건축', '재개발', '일반분양'],
      },
      1,
      district,
    ),
    {
      rank: 2,
      title: `${district} 교통·상권 변화`,
      area: district,
      buzzScore: 74,
      progress: 38,
      activeStageIndex: 1,
      expectedYear: '2026~2029 확인',
      plainBrief: `${district} 역세권과 상권 변화가 거래 회복에 영향을 주는지 봅니다.`,
      phase: '생활권 변화 관찰',
      nextMilestone: '다음 확인: 역세권 개발, 상권 공실률, 신규 공급 일정',
      priceImpact: '역세권·학군·상권이 겹치는 단지는 거래 회전율을 함께 봐야 합니다.',
      affectedDongs: [district],
      relatedApartments: [`${district} 역세권 단지`, `${district} 학군지 단지`, `${district} 대단지`],
      keywords: ['역세권', '상권', '학군'],
      body: `${district}의 교통과 상권 변화는 매수 선호도와 전세 수요에 직접 연결됩니다.`,
      sourceName: '서울시·국토부 발표 확인',
      sourceUrl: 'https://news.seoul.go.kr/traffic/',
      sourcePriority: ['서울시·국토부 발표', '자치구 고시·공고', '사업자 공지'],
      timeline: [
        { label: '생활권 변화 감지', status: 'done' },
        { label: '거래 반응 확인', status: 'active' },
        { label: '가격 반영 관찰', status: 'watch' },
      ],
    },
  ]
}

const getReportDevelopmentNews = (region: string) =>
  reportDevelopmentNewsByRegion[region]?.length
    ? reportDevelopmentNewsByRegion[region]
    : region.startsWith('서울 ')
      ? buildSeoulDevelopmentNews(region)
      : anyangDevelopmentNews

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

const mortgageAssumptions = {
  baseRatePercent: 4.8,
  stressAddRatePercent: 3,
  dsrCapPercent: 40,
  termYears: 30,
  existingDebtAnnualRepaymentRatio: 0.12,
}

const calculateMonthlyPaymentManwon = (loanEok: number, annualRatePercent: number, termYears: number) => {
  if (loanEok <= 0) return 0

  const principalManwon = loanEok * 10000
  const monthlyRate = annualRatePercent / 100 / 12
  const months = termYears * 12

  if (monthlyRate <= 0) return principalManwon / months

  return principalManwon * (monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1)
}

const calculateLoanLimitEokFromMonthlyPayment = (
  monthlyPaymentManwon: number,
  annualRatePercent: number,
  termYears: number,
) => {
  if (monthlyPaymentManwon <= 0) return 0

  const monthlyRate = annualRatePercent / 100 / 12
  const months = termYears * 12

  if (monthlyRate <= 0) return (monthlyPaymentManwon * months) / 10000

  return (monthlyPaymentManwon * (1 - (1 + monthlyRate) ** -months) / monthlyRate) / 10000
}

const getMortgageRuleProfile = (regionText: string, priceEok: number): MortgageRuleProfile => {
  const normalized = normalizeSearchText(regionText)
  const isRegulatedArea = ['강남구', '서초구', '송파구', '용산구'].some((district) =>
    normalized.includes(normalizeSearchText(district)),
  )

  return {
    ltvRatio: isRegulatedArea ? 0.4 : 0.7,
    priceCapEok: priceEok <= 15 ? 6 : priceEok <= 25 ? 4 : 2,
    isRegulatedArea,
  }
}

const calculateCandidateMortgagePlan = (
  priceEok: number,
  regionText: string,
  financingPlan: Pick<
    FinancingPlan,
    | 'assetsManwon'
    | 'annualIncomeManwon'
    | 'estimatedExistingAnnualDebtManwon'
    | 'dsrLimitLoanEok'
    | 'baseRatePercent'
    | 'stressRatePercent'
    | 'termYears'
  >,
): CandidateMortgagePlan => {
  const rule = getMortgageRuleProfile(regionText, priceEok)
  const assetsEok = financingPlan.assetsManwon / 10000
  const ltvLimitEok = priceEok * rule.ltvRatio
  const loanEok = Math.max(0, Math.min(priceEok, financingPlan.dsrLimitLoanEok, ltvLimitEok, rule.priceCapEok))
  const cashNeededEok = Math.max(0, priceEok - loanEok)
  const cashBufferEok = assetsEok - cashNeededEok
  const monthlyPaymentManwon = calculateMonthlyPaymentManwon(
    loanEok,
    financingPlan.baseRatePercent,
    financingPlan.termYears,
  )
  const stressMonthlyPaymentManwon = calculateMonthlyPaymentManwon(
    loanEok,
    financingPlan.stressRatePercent,
    financingPlan.termYears,
  )
  const dsrPercent =
    financingPlan.annualIncomeManwon > 0
      ? ((stressMonthlyPaymentManwon * 12 + financingPlan.estimatedExistingAnnualDebtManwon) /
          financingPlan.annualIncomeManwon) *
        100
      : 0

  return {
    isAffordable: cashBufferEok >= -0.02,
    loanEok,
    cashNeededEok,
    cashBufferEok,
    monthlyPaymentManwon,
    stressMonthlyPaymentManwon,
    dsrPercent,
    ltvPercent: rule.ltvRatio * 100,
    rule,
  }
}

const calculateDisplayMaxPurchaseEok = (
  plan: Pick<
    FinancingPlan,
    | 'assetsManwon'
    | 'annualIncomeManwon'
    | 'estimatedExistingAnnualDebtManwon'
    | 'dsrLimitLoanEok'
    | 'baseRatePercent'
    | 'stressRatePercent'
    | 'termYears'
  >,
) => {
  let low = 0
  let high = 80

  for (let index = 0; index < 32; index += 1) {
    const mid = (low + high) / 2
    const mortgage = calculateCandidateMortgagePlan(mid, '수도권 비규제', plan)

    if (mortgage.isAffordable) {
      low = mid
    } else {
      high = mid
    }
  }

  return Math.max(0, low)
}

const calculateFinancingPlan = ({
  incomeManwon,
  assetsManwon,
  debtManwon,
}: {
  incomeManwon: number
  assetsManwon: number
  debtManwon: number
}): FinancingPlan => {
  const baseRatePercent = mortgageAssumptions.baseRatePercent
  const stressRatePercent = mortgageAssumptions.baseRatePercent + mortgageAssumptions.stressAddRatePercent
  const estimatedExistingAnnualDebtManwon = Math.max(
    0,
    debtManwon * mortgageAssumptions.existingDebtAnnualRepaymentRatio,
  )
  const dsrRoomAnnualManwon = Math.max(
    0,
    incomeManwon * (mortgageAssumptions.dsrCapPercent / 100) - estimatedExistingAnnualDebtManwon,
  )
  const dsrLimitLoanEok = calculateLoanLimitEokFromMonthlyPayment(
    dsrRoomAnnualManwon / 12,
    stressRatePercent,
    mortgageAssumptions.termYears,
  )
  const planBase = {
    assetsManwon,
    annualIncomeManwon: incomeManwon,
    estimatedExistingAnnualDebtManwon,
    dsrLimitLoanEok,
    baseRatePercent,
    stressRatePercent,
    termYears: mortgageAssumptions.termYears,
  }
  const displayMaxPurchaseEok = calculateDisplayMaxPurchaseEok(planBase)
  const assumedRule = getMortgageRuleProfile('수도권 비규제', displayMaxPurchaseEok)
  const displayLoanEok = Math.min(
    dsrLimitLoanEok,
    assumedRule.priceCapEok,
    displayMaxPurchaseEok * assumedRule.ltvRatio,
  )

  return {
    ...planBase,
    existingDebtManwon: debtManwon,
    dsrRoomAnnualManwon,
    displayMaxPurchaseEok,
    dsrCapPercent: mortgageAssumptions.dsrCapPercent,
    assumedRegionLabel: '수도권 비규제·무주택/처분조건부 1주택 기준',
    assumedRule,
    baseMonthlyPaymentManwon: calculateMonthlyPaymentManwon(
      displayLoanEok,
      baseRatePercent,
      mortgageAssumptions.termYears,
    ),
    stressMonthlyPaymentManwon: calculateMonthlyPaymentManwon(
      displayLoanEok,
      stressRatePercent,
      mortgageAssumptions.termYears,
    ),
  }
}

const uniqueAiPreferenceRanks = (ranks: AiPreferenceKey[]) => {
  const fallback: AiPreferenceKey[] = ['growth', 'commute', 'subway', 'pyeong']
  const uniqueRanks = ranks.filter((rank, index) => ranks.indexOf(rank) === index)

  fallback.forEach((rank) => {
    if (uniqueRanks.length < 4 && !uniqueRanks.includes(rank)) {
      uniqueRanks.push(rank)
    }
  })

  aiPreferenceOptions.forEach((option) => {
    if (uniqueRanks.length < 4 && !uniqueRanks.includes(option.value)) {
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

const estimateTransitMinutesFromDistance = (meters: number) => {
  const kilometers = meters / 1000
  const transferBuffer = kilometers > 16 ? 16 : kilometers > 8 ? 11 : 7
  return Math.round(Math.min(115, Math.max(8, 10 + kilometers * 3.15 + transferBuffer)))
}

const estimateCommuteMinutesToWorkplace = ({
  origin,
  workplaceLocation,
  fallbackMinutes,
}: {
  origin?: { lat?: number; lng?: number }
  workplaceLocation: WorkplaceLocation | null
  fallbackMinutes: number
}) => {
  if (
    workplaceLocation &&
    typeof origin?.lat === 'number' &&
    typeof origin.lng === 'number'
  ) {
    return estimateTransitMinutesFromDistance(
      calculateDistanceMeters({ lat: origin.lat, lng: origin.lng }, workplaceLocation),
    )
  }

  return fallbackMinutes
}

const scoreRecommendationPreference = (
  preference: AiPreferenceKey,
  context: {
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
  workplaceLocation,
}: {
  originName: string
  lat?: number
  lng?: number
  officeArea: OfficeArea
  workplaceLocation?: WorkplaceLocation | null
}) => {
  const destination = workplaceLocation ?? officeAreaDestinations[officeArea]
  const destinationName = workplaceLocation?.label || officeAreaDestinations[officeArea].name

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return `https://m.map.kakao.com/scheme/search?q=${encodeURIComponent(`${originName} ${destinationName} 대중교통`)}`
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
  financingPlan,
  minPriceEok,
  maxPriceEok,
  preferredPyeong,
  maxSubwayMinutes,
  officeArea,
  workplaceLocation,
  maxCommuteMinutes,
}: {
  deals: LiveRtmsDeal[]
  preferenceRanks: AiPreferenceKey[]
  financingPlan: FinancingPlan
  minPriceEok: number
  maxPriceEok: number
  preferredPyeong: number
  maxSubwayMinutes: number
  officeArea: OfficeArea
  workplaceLocation: WorkplaceLocation | null
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

      const regionText = `${latestDeal.district} ${latestDeal.legalDong} ${latestDeal.address}`
      const mortgage = calculateCandidateMortgagePlan(latestDeal.priceEok, regionText, financingPlan)

      if (!mortgage.isAffordable) return null

      const oneYearGrowthRate = getOneYearGrowth(preferredHistory)
      const subwayMinutes = estimateRtmsSubwayMinutes(latestDeal)
      const commuteToOffice = estimateCommuteMinutesToWorkplace({
        origin: { lat: latestDeal.lat, lng: latestDeal.lng },
        workplaceLocation,
        fallbackMinutes: estimateRtmsCommuteMinutes(latestDeal, officeArea),
      })
      const budgetDistance = Math.abs(mortgage.cashBufferEok)
      const directDealCount = preferredHistory.filter((deal) => deal.tradeType === 'direct').length
      const upside = calculateUpsideScore(
        preferredHistory,
        `${latestDeal.aptName} ${latestDeal.district} ${latestDeal.legalDong} ${latestDeal.address}`,
        { lat: latestDeal.lat, lng: latestDeal.lng },
      )
      const regionPremium = getRegionPreferenceBonus(`${latestDeal.district} ${latestDeal.legalDong} ${latestDeal.address}`)
      const context = {
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
        scoreRecommendationPreference('pyeong', context) * 0.01 +
        Math.min(preferredHistory.length, 12) * 0.35
      const recommendationScore = Math.round(
        Math.min(99, preferenceScore * 0.58 + upside.score * 0.28 + baseFitScore + regionPremium.score + 10),
      )
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
          workplaceLocation,
        }),
        commuteSource:
          workplaceLocation && typeof latestDeal.lat === 'number' && typeof latestDeal.lng === 'number'
            ? 'address-geocoded'
            : typeof latestDeal.lat === 'number' && typeof latestDeal.lng === 'number'
              ? 'kakao-route-link'
              : 'estimated',
        upsideScore: upside.score,
        developmentSignals: upside.signals,
        source: 'rtms' as const,
        oneYearGrowthRate,
        latestDealDate: latestDeal.dealDate,
        dealCount: preferredHistory.length,
        mortgage,
        fitReasons: [
          `${rankedPreferences.map((rank, index) => `${index + 1}순위 ${aiPreferenceLabelByKey[rank]}`).join(' · ')}`,
          regionPremium.label || `입지 ${getRtmsStationHint(latestDeal, subwayMinutes)}`,
          `최근 실거래 ${formatShortDate(latestDeal.dealDate)} · ${Math.round(latestDeal.pyeong)}평 · ${formatEok(latestDeal.priceEok)}`,
          `1년 상승률 ${formatGrowth(oneYearGrowthRate)}`,
          upside.signals[0] ? `호재 ${upside.signals[0]}` : `상승여력 ${upside.score}점`,
          `대출추정 ${formatEok(mortgage.loanEok)} · 월 ${formatManwon(mortgage.monthlyPaymentManwon)}`,
          `${workplaceLocation?.label || officeArea} 대중교통 약 ${commuteToOffice}분`,
          directDealCount > 0 ? `직거래 ${directDealCount}건 포함` : `동일 평형권 ${preferredHistory.length}건 분석`,
        ],
      }
    })
    .filter((candidate): candidate is RecommendedApartment => candidate !== null)
}

const buildCuratedRecommendationCandidates = ({
  preferenceRanks,
  financingPlan,
  minPriceEok,
  maxPriceEok,
  preferredPyeong,
  maxSubwayMinutes,
  officeArea,
  workplaceLocation,
  maxCommuteMinutes,
}: {
  preferenceRanks: AiPreferenceKey[]
  financingPlan: FinancingPlan
  minPriceEok: number
  maxPriceEok: number
  preferredPyeong: number
  maxSubwayMinutes: number
  officeArea: OfficeArea
  workplaceLocation: WorkplaceLocation | null
  maxCommuteMinutes: number
}) =>
  apartments
    .filter((apartment) => {
      const mortgage = calculateCandidateMortgagePlan(apartment.priceEok, apartment.region, financingPlan)
      return apartment.priceEok >= minPriceEok && apartment.priceEok <= maxPriceEok && mortgage.isAffordable
    })
    .map((apartment): RecommendedApartment => {
      const mortgage = calculateCandidateMortgagePlan(apartment.priceEok, apartment.region, financingPlan)
      const rankedPreferences = uniqueAiPreferenceRanks(preferenceRanks)
      const apartmentPyeong = Number(apartment.pyeong.replace('평', ''))
      const oneYearGrowthRate =
        apartment.previousEok > 0 ? ((apartment.priceEok - apartment.previousEok) / apartment.previousEok) * 100 : null
      const commuteToOffice = estimateCommuteMinutesToWorkplace({
        origin: { lat: apartment.lat, lng: apartment.lng },
        workplaceLocation,
        fallbackMinutes: apartment.commuteMinutes[officeArea],
      })
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
      const budgetDistance = Math.abs(mortgage.cashBufferEok)
      const recommendationScore = Math.round(
        Math.min(99, preferenceScore * 0.58 + upside.score * 0.28 + regionPremium.score + 10),
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
          workplaceLocation,
        }),
        commuteSource: workplaceLocation ? 'address-geocoded' : 'kakao-route-link',
        upsideScore: upside.score,
        developmentSignals: upside.signals,
        fitReasons: [
          `${rankedPreferences.map((rank, index) => `${index + 1}순위 ${aiPreferenceLabelByKey[rank]}`).join(' · ')}`,
          regionPremium.label || `입지 ${apartment.station}`,
          `최근 실거래 ${apartment.recentDeals[0]?.date ?? '업데이트 예정'} · ${apartment.pyeong} · ${formatEok(apartment.priceEok)}`,
          `1년 상승률 ${formatGrowth(oneYearGrowthRate)}`,
          upside.signals[0] ? `호재 ${upside.signals[0]}` : `상승여력 ${upside.score}점`,
          `대출추정 ${formatEok(mortgage.loanEok)} · 월 ${formatManwon(mortgage.monthlyPaymentManwon)}`,
          `${workplaceLocation?.label || officeArea} 대중교통 약 ${commuteToOffice}분`,
        ],
        source: 'curated',
        oneYearGrowthRate,
        latestDealDate: apartment.recentDeals[0]?.date ?? '',
        dealCount: apartment.recentDeals.length,
        mortgage,
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
  const [workplaceAddress, setWorkplaceAddress] = useState('')
  const [workplaceLocation, setWorkplaceLocation] = useState<WorkplaceLocation | null>(null)
  const [maxCommuteMinutes, setMaxCommuteMinutes] = useState(40)
  const [minTradePriceEok, setMinTradePriceEok] = useState(0)
  const [maxTradePriceEok, setMaxTradePriceEok] = useState(80)
  const [aiPreferenceRanks, setAiPreferenceRanks] = useState<AiPreferenceKey[]>(['growth', 'commute', 'subway', 'pyeong'])
  const [userListings, setUserListings] = useState<UserListing[]>([])
  const [listingFormIntent, setListingFormIntent] = useState<UserListing['intent']>('sell')
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
  const deferredQuery = useDeferredValue(query)
  const contentPanelRef = useRef<HTMLElement | null>(null)
  const modeRef = useRef<Mode>(mode)
  const historyReadyRef = useRef(false)
  const restoringHistoryRef = useRef(false)
  const lastHistoryModeRef = useRef<Mode | null>(null)
  const unreadNotificationCount = appNotifications.filter((notification) => !notification.read).length

  useEffect(() => {
    let disposed = false

    void fetch('/api/listings', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: ListingsResponse | null) => {
        if (disposed || !payload?.ok || !Array.isArray(payload.listings)) return

        setUserListings(
          payload.listings
            .filter((listing) => listing && listing.id && listing.aptName && listing.address)
            .slice(0, 300),
        )
      })
      .catch(() => undefined)

    return () => {
      disposed = true
    }
  }, [])

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

      return dedupeDeals(Array.from(mergedDeals.values())).slice(0, MAX_BROWSER_LIVE_DEALS)
    })
  }, [])

  const handleSearchFilterOpen = useCallback(() => {
    if (mode !== 'prices') {
      setMode('prices')
    }
    setFilterOpenRequest((request) => request + 1)
  }, [mode])

  const handleOpenListingRegistration = useCallback((intent: UserListing['intent'] = 'sell') => {
    setListingFormIntent(intent)
    setMode('directListings')
  }, [])

  const regionApartments = useMemo(() => {
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

      return regionMatch
    })
  }, [selectedRegion])

  const liveDealSuggestionIndex = useMemo<LiveDealSuggestionEntry[]>(() => {
    const latestByApartment = new Map<string, LiveRtmsDeal>()

    capitalLiveDeals.forEach((deal) => {
      const key = deal.aptSeq || `${deal.aptName}-${deal.address}`
      const current = latestByApartment.get(key)
      if (!current || dealTimestamp(deal) > dealTimestamp(current)) {
        latestByApartment.set(key, deal)
      }
    })

    return Array.from(latestByApartment.values())
      .sort((a, b) => dealTimestamp(b) - dealTimestamp(a))
      .slice(0, MAX_SEARCH_INDEX_DEALS)
      .map((deal) => ({
        deal,
        searchText: normalizeSearchText(`${deal.aptName} ${deal.address} ${deal.legalDong} ${deal.district}`),
      }))
  }, [capitalLiveDeals])

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
    const normalized = deferredQuery.trim()

    if (normalized.length < 2) return []

    const apartmentSuggestions = regionApartments
      .filter((apartment) => matchesApartmentQuery(apartment, normalized))
      .slice(0, 3)
      .map((apartment) => ({
        id: `sample-${apartment.name}`,
        title: apartment.name,
        subtitle: `${apartment.region} · ${apartment.pyeong}`,
        apartment,
        deal: null as LiveRtmsDeal | null,
      }))
    const liveDealSuggestions = liveDealSuggestionIndex
      .filter(({ searchText }) => {
        const normalizedQuery = normalizeSearchText(normalized)
        return searchText.includes(normalizedQuery) || fuzzyIncludes(searchText, normalizedQuery)
      })
      .slice(0, 5 - apartmentSuggestions.length)
      .map(({ deal }) => ({
        id: `live-${deal.aptSeq || deal.id}`,
        title: deal.aptName,
        subtitle: `${deal.address} · ${deal.pyeong}평 · ${formatShortDate(deal.dealDate)}`,
        apartment: null as Apartment | null,
        deal,
      }))

    return [...apartmentSuggestions, ...liveDealSuggestions]
  }, [deferredQuery, liveDealSuggestionIndex, regionApartments])

  const defaultSearchSuggestions = useMemo<SearchSuggestion[]>(() => {
    const latestLiveSuggestions = liveDealSuggestionIndex
      .slice(0, 3)
      .map(({ deal }) => ({
        id: `popular-live-${deal.aptSeq || deal.id}`,
        title: deal.aptName,
        subtitle: `${deal.address} · 최근 ${formatEok(deal.priceEok)}`,
        apartment: null,
        deal,
      }))

    const fallbackSuggestions = regionApartments
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
  }, [liveDealSuggestionIndex, regionApartments])

  const visibleSearchSuggestions = query.trim().length < 2 ? defaultSearchSuggestions : searchSuggestions
  const searchHasNoResults = searchFocused && query.trim().length >= 2 && searchSuggestions.length === 0

  const listingApartmentCandidates = useMemo<ListingApartmentCandidate[]>(() => {
    const candidates = new Map<string, ListingApartmentCandidate>()
    liveDealSuggestionIndex.forEach(({ deal }) => {
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
  }, [liveDealSuggestionIndex])

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
    blurActiveTextInput()
    setQuery(suggestion.title)
    setFocusApartment(suggestion.apartment)
    setFocusLiveDeal(suggestion.deal)
    setFocusListing(null)
    setMode('prices')
    setAppToast(`${suggestion.title} 실거래 상세를 열었습니다.`)
    setSearchFocused(false)

    window.requestAnimationFrame(() => {
      contentPanelRef.current?.scrollTo({ top: 0, behavior: 'auto' })
      window.scrollTo({ top: 0, behavior: 'auto' })
    })
  }

  const handleOpenReportDeal = (deal: LiveRtmsDeal) => {
    setQuery(deal.aptName)
    setFocusApartment(null)
    setFocusLiveDeal(deal)
    setFocusListing(null)
    setMode('prices')
    setPriceHeaderMinimized(false)
    setSearchFocused(false)
    setAppToast(`${deal.aptName} 실거래 상세를 열었습니다.`)

    window.requestAnimationFrame(() => {
      contentPanelRef.current?.scrollTo({ top: 0, behavior: 'auto' })
      window.scrollTo({ top: 0, behavior: 'auto' })
    })
  }

  const handleListingCreate = (listing: UserListing) => {
    const normalizedListing = {
      ...listing,
      id: listing.id || `${Date.now()}`,
      createdAt: listing.createdAt || new Date().toISOString(),
      photos: listing.photos.slice(0, 5),
    }

    setUserListings((currentListings) => [
      normalizedListing,
      ...currentListings.filter((currentListing) => currentListing.id !== normalizedListing.id),
    ])
    setFocusListing(normalizedListing)
    setFocusApartment(null)
    setFocusLiveDeal(null)
    setMode('prices')
    setAppToast(
      listing.intent === 'want'
        ? '매물 원해요 등록 완료. 직거래 화면에서 함께 볼 수 있습니다.'
        : '매물 등록 접수 완료. 지도에 노란 매물 박스로 반영했습니다.',
    )
    void fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing: normalizedListing }),
    }).catch(() => undefined)
    void sendTelegramLead(normalizedListing.intent === 'want' ? '매수 희망 등록' : 'listing', {
      유형: normalizedListing.intent === 'want' ? '매물 원해요' : '매도 매물',
      아파트: normalizedListing.aptName,
      주소: normalizedListing.address,
      동호수: normalizedListing.detailAddress,
      희망가: formatEok(normalizedListing.priceEok),
      평형: `${normalizedListing.pyeong}평`,
      층: `${normalizedListing.floor}층`,
      소유자: normalizedListing.intent === 'want' ? '매수희망자' : normalizedListing.ownerName || '미입력',
      연락처: normalizedListing.ownerPhone || '미입력',
      사진수: `${normalizedListing.photos.length}장`,
      설명: normalizedListing.memo || '미입력',
      접수시각: new Date(normalizedListing.createdAt).toLocaleString('ko-KR'),
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

  const financingPlan = useMemo(
    () =>
      calculateFinancingPlan({
        incomeManwon: Math.max(0, income),
        assetsManwon: Math.max(0, assets),
        debtManwon: Math.max(0, debt),
      }),
    [assets, debt, income],
  )
  const recommendationBudgetEok = Math.max(0, financingPlan.displayMaxPurchaseEok)
  const recommendationStretchEok = recommendationBudgetEok
  const normalizedMinTradePriceEok = Math.min(Math.max(0, minTradePriceEok), Math.max(0, maxTradePriceEok))
  const normalizedMaxTradePriceEok = Math.max(Math.max(0, minTradePriceEok), Math.max(0, maxTradePriceEok))
  const recommendedApartments = useMemo<RecommendedApartment[]>(() => {
    const rtmsCandidates = buildRtmsRecommendationCandidates({
      deals: capitalLiveDeals,
      preferenceRanks: aiPreferenceRanks,
      financingPlan,
      minPriceEok: normalizedMinTradePriceEok,
      maxPriceEok: normalizedMaxTradePriceEok,
      preferredPyeong,
      maxSubwayMinutes,
      officeArea,
      workplaceLocation,
      maxCommuteMinutes,
    })
    const curatedCandidates = buildCuratedRecommendationCandidates({
      preferenceRanks: aiPreferenceRanks,
      financingPlan,
      minPriceEok: normalizedMinTradePriceEok,
      maxPriceEok: normalizedMaxTradePriceEok,
      preferredPyeong,
      maxSubwayMinutes,
      officeArea,
      workplaceLocation,
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
      financingPlan,
      workplaceLocation,
    ],
  )

  return (
    <main className="app">
      <section
        className={`mobile-stage mode-${mode}${priceHeaderMinimized ? ' map-header-minimized' : ''}${searchFocused ? ' search-active' : ''}`}
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

        {mode !== 'report' && mode !== 'subscription' && (
          <section className="search-hero">
            <div className="search-box">
              <Search size={19} />
              <input
                id="search"
                value={query}
                onChange={(event) => handleSearchChange(event.target.value)}
                onFocus={() => {
                  setSearchFocused(true)
                  window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 0)
                }}
                onBlur={() => window.setTimeout(() => setSearchFocused(false), 140)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  const [firstSuggestion] = visibleSearchSuggestions
                  if (!firstSuggestion) return
                  event.preventDefault()
                  handleSearchSuggestionClick(firstSuggestion)
                }}
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
              apartments={regionApartments}
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
              onOpenDeal={handleOpenReportDeal}
            />
          )}

          {mode === 'notifications' && (
            <NotificationCenterView
              notifications={appNotifications}
              onOpenReport={(region) => handleOpenReport(region)}
              onOpenMap={() => setMode('prices')}
            />
          )}

          {mode === 'subscription' && <SubscriptionView />}

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
              workplaceAddress={workplaceAddress}
              workplaceLocation={workplaceLocation}
              maxCommuteMinutes={maxCommuteMinutes}
              setPreferredPyeong={setPreferredPyeong}
              setMaxSubwayMinutes={setMaxSubwayMinutes}
              setOfficeArea={setOfficeArea}
              setWorkplaceAddress={setWorkplaceAddress}
              setWorkplaceLocation={setWorkplaceLocation}
              setMaxCommuteMinutes={setMaxCommuteMinutes}
              minTradePriceEok={minTradePriceEok}
              maxTradePriceEok={maxTradePriceEok}
              setMinTradePriceEok={setMinTradePriceEok}
              setMaxTradePriceEok={setMaxTradePriceEok}
              aiPreferenceRanks={aiPreferenceRanks}
              setAiPreferenceRanks={setAiPreferenceRanks}
              budget={recommendationBudgetEok}
              stretch={recommendationStretchEok}
              financingPlan={financingPlan}
              apartments={recommendedApartments}
            />
          )}

          {mode === 'listing' && (
            <DirectListingsView
              userListings={userListings}
              liveDeals={capitalLiveDeals}
              onRegister={() => handleOpenListingRegistration('sell')}
              onRegisterWanted={() => handleOpenListingRegistration('want')}
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
              initialIntent={listingFormIntent}
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
  const mapLatestApartmentDeals =
    serverMapMarkers.length > 0 ? EMPTY_LATEST_APARTMENT_DEALS : latestApartmentDeals
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
          const fixedHeaderOffset = window.matchMedia('(max-width: 860px)').matches ? 154 : 6
          const targetTop = scrollContainer.scrollTop + detailRect.top - containerRect.top - fixedHeaderOffset
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
      handleMapMarkerSelect(marker, { scrollToDetail: true })
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [focusApartment, handleMapMarkerSelect, latestApartmentDeals])

  const fetchRtmsDeals = useCallback(async (signal?: AbortSignal) => {
    if (signal?.aborted) return

    setRtmsStatus((current) => (current === 'refreshing' ? 'refreshing' : 'loading'))
    setRtmsError('')
    try {
      const response = await fetch(
        `/api/rtms/apt-trades?scope=${rtmsScope}&dealYmd=${defaultDealYmd}&monthsBack=3&numOfRows=1000&limit=12000`,
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
    }, 4200)

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
          latestApartmentDeals={mapLatestApartmentDeals}
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
          <strong>{rtmsData ? `${filteredLiveDeals.filter((deal) => deal.tradeType === 'direct').length}건` : '0건'}</strong>
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
  onOpenDeal,
}: {
  liveDeals: LiveRtmsDeal[]
  initialRegion: string
  onRegionChange: (region: string) => void
  onOpenDeal: (deal: LiveRtmsDeal) => void
}) {
  const region = initialRegion
  const [reportExpanded, setReportExpanded] = useState(true)
  const [reportSubscribed, setReportSubscribed] = useState(false)
  const [reportRegionQuery, setReportRegionQuery] = useState('')
  const [reportNewsItems, setReportNewsItems] = useState<ReportNewsItem[]>([])
  const [reportNewsUpdatedAt, setReportNewsUpdatedAt] = useState('')
  const reportDetailRef = useRef<HTMLElement | null>(null)
  const reportNewsRequestRef = useRef(0)
  const fallbackReferenceTime = useMemo(() => new Date().getTime(), [])

  const handleRegionSelect = (nextRegion: string) => {
    setReportNewsItems([])
    setReportNewsUpdatedAt('')
    onRegionChange(nextRegion)
    setReportExpanded(true)
  }

  useEffect(() => {
    const controller = new AbortController()
    const requestId = reportNewsRequestRef.current + 1
    reportNewsRequestRef.current = requestId

    void (async () => {
      try {
        const response = await fetch(`/api/report/anyang-news?region=${encodeURIComponent(region)}`, {
          signal: controller.signal,
        })
        const payload = (await response.json()) as {
          region?: string
          items?: ReportNewsItem[]
          updatedAt?: string
        }

        if (!controller.signal.aborted && requestId === reportNewsRequestRef.current) {
          setReportNewsItems(Array.isArray(payload.items) ? payload.items.slice(0, 6) : [])
          setReportNewsUpdatedAt(payload.updatedAt ?? '')
        }
      } catch {
        if (!controller.signal.aborted && requestId === reportNewsRequestRef.current) {
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
    : '실거래 반영 대기'
  const developmentIssues = useMemo(() => getReportDevelopmentNews(region), [region])
  const filteredReportRegionOptions = useMemo(() => {
    const query = normalizeSearchText(reportRegionQuery)

    if (!query) return weeklyReportRegionOptions

    return weeklyReportRegionOptions.filter((option) => {
      const keywords = weeklyReportRegionKeywords[option] ?? []
      return normalizeSearchText(`${option} ${keywords.join(' ')}`).includes(query)
    })
  }, [reportRegionQuery])
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
          latestDeal,
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
  const reportSourcePriority = Array.from(
    new Set(developmentIssues.flatMap((issue) => issue.sourcePriority ?? [])),
  ).slice(0, 3)

  return (
    <div className="view-stack report-view">
      <section className="report-region-tabs" aria-label="보고서 지역 선택">
        <div className="report-region-guide">
          <span>지역 선택</span>
          <strong>{region} 리포트</strong>
        </div>
        <label className="report-region-search">
          <Search size={16} />
          <input
            aria-label="리포트 지역 검색"
            placeholder="구·동·지역명 검색"
            type="search"
            value={reportRegionQuery}
            onChange={(event) => setReportRegionQuery(event.target.value)}
          />
        </label>
        <div className="report-region-chip-row">
          {filteredReportRegionOptions.length > 0 ? (
            filteredReportRegionOptions.map((option) => (
              <button
                className={region === option ? 'active' : ''}
                key={option}
                type="button"
                onClick={() => handleRegionSelect(option)}
              >
                {option}
              </button>
            ))
          ) : (
            <p className="report-region-empty">검색된 지역이 없습니다.</p>
          )}
        </div>
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
                : '이번 주 핵심 개발 이슈를 정리하고 있습니다.'}
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
              <strong>{growthLeaders[0] ? formatSignedRate(growthLeaders[0].growthRate) : '표본 대기'}</strong>
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
                사업별 진행단계
              </span>
              <em>구역별 현재 위치</em>
            </div>
            <div className="development-source-summary">
              <span>공식 자료 기준</span>
              <strong>{reportSourcePriority.join(' → ') || '자치구 고시·공고 → 정비사업 정보몽땅 추진경과'}</strong>
              <a href={seoulCleanupSearchUrl} target="_blank" rel="noreferrer">
                정비사업 정보몽땅
                <ExternalLink size={12} />
              </a>
            </div>
            <div className="development-tracker">
              {developmentIssues
                .slice()
                .sort((a, b) => b.buzzScore - a.buzzScore)
                .map((item) => {
                  const stageLabels = item.stageLabels ?? developmentStageLabels
                  const hasProjectStages = Boolean(item.projects?.length)

                  return (
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
                    {!hasProjectStages && (
                      <div className="development-stage-map" aria-label={`${item.title} 전체 사업 단계`}>
                        {stageLabels.map((stageLabel, index) => (
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
                    )}
                    {item.projects && item.projects.length > 0 && (
                      <div className="development-project-list" aria-label={`${item.title} 구역별 진행단계`}>
                        {item.projects.map((project) => {
                          const projectProgress = getProjectStageProgress(stageLabels, project.currentStage)
                          const projectStageIndex = getProjectStageIndex(stageLabels, project.currentStage)

                          return (
                            <div
                              className={projectStageIndex >= 0 ? 'is-confirmed' : 'is-watch'}
                              key={`${item.title}-${project.name}`}
                            >
                              <span>{project.name}</span>
                              <strong>{project.currentStage}</strong>
                              <em>{getProjectStageMeta(stageLabels, project.currentStage, project.noticeDate)}</em>
                              <i aria-hidden="true">
                                <b style={{ width: `${projectProgress}%` }} />
                              </i>
                              {project.note && <p>{project.note}</p>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {!hasProjectStages && (
                      <div className="development-timeline">
                        {item.timeline.map((step) => (
                          <span className={step.status} key={`${item.title}-${step.label}`}>
                            {step.label}
                          </span>
                        ))}
                      </div>
                    )}
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
                  )
                })}
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
                  <span>업데이트</span>
                  <strong>우리동네 개발·교통 뉴스 정리 대기</strong>
                  <em>서버가 최신 뉴스 목록을 가져오면 이 영역에 자동 반영됩니다.</em>
                </article>
              )}
            </div>
          </div>

          <ReportDealList
            title="최근 일주일 거래"
            deals={weeklyDeals.slice(0, 6)}
            emptyText="최근 일주일 거래가 아직 없습니다."
            onOpenDeal={onOpenDeal}
          />
          <ReportDealList
            title="최근 한달 거래"
            deals={monthlyDeals.slice(0, 8)}
            emptyText="최근 한달 거래가 아직 없습니다."
            onOpenDeal={onOpenDeal}
          />

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
                  <button key={leader.key} type="button" onClick={() => onOpenDeal(leader.latestDeal)}>
                    <strong>{index + 1}</strong>
                    <span>
                      {leader.name}
                      <small>{leader.pyeong}평 · {leader.dealCount}건</small>
                    </span>
                    <em>{formatSignedRate(leader.growthRate)}</em>
                  </button>
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
  onOpenDeal,
}: {
  title: string
  deals: LiveRtmsDeal[]
  emptyText: string
  onOpenDeal: (deal: LiveRtmsDeal) => void
}) {
  return (
    <div className="report-section">
      <div className="detail-section-head">
        <span>
          <FileText size={15} />
          {title}
        </span>
        <em>{deals.length ? `${deals.length}건 보기` : '0건'}</em>
      </div>
      <div className="report-deal-list">
        {deals.length > 0 ? (
          deals.map((deal) => (
            <button key={`weekly-report-deal-${deal.id}`} type="button" onClick={() => onOpenDeal(deal)}>
              <span>
                <strong>{deal.aptName}</strong>
                <small>
                  {formatShortDate(deal.dealDate)} · {Math.round(deal.pyeong)}평 · {deal.floor}층 · {deal.tradeTypeLabel}
                </small>
              </span>
              <em>{formatEok(deal.priceEok)}</em>
            </button>
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
        <h2>회원가입과 알림 설정</h2>
        <p>매물 등록, 관심 단지 알림, 우리동네 리포트를 한 번에 관리하세요.</p>
      </section>

      <MembershipSignupCard />

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

function SubscriptionView() {
  const [selectedTab, setSelectedTab] = useState<SubscriptionNotice['category']>('private')
  const [selectedRegion, setSelectedRegion] = useState<SubscriptionNotice['region']>('전국')
  const [notices, setNotices] = useState<SubscriptionNotice[]>(fallbackSubscriptionNotices)
  const [updatedAt, setUpdatedAt] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    void (async () => {
      try {
        const response = await fetch('/api/subscriptions', { signal: controller.signal })
        const payload = (await response.json()) as {
          items?: SubscriptionNotice[]
          updatedAt?: string
        }

        if (!controller.signal.aborted && Array.isArray(payload.items) && payload.items.length > 0) {
          setNotices(payload.items)
          setUpdatedAt(payload.updatedAt ?? '')
        }
      } catch {
        if (!controller.signal.aborted) {
          setNotices(fallbackSubscriptionNotices)
        }
      }
    })()

    return () => controller.abort()
  }, [])

  const filteredNotices = notices
    .filter((notice) => notice.category === selectedTab)
    .filter((notice) => selectedRegion === '전국' || notice.region === selectedRegion)
    .sort((a, b) => {
      if (a.isPopular !== b.isPopular) return a.isPopular ? -1 : 1
      return b.alerts - a.alerts || b.visitors - a.visitors
    })

  return (
    <div className="view-stack subscription-view">
      <section className="subscription-hero">
        <div className="subscription-hero-copy">
          <div className="subscription-hero-brand">
            <span className="subscription-hero-mark">
              <Home size={16} strokeWidth={2.8} />
            </span>
            <b>집직구 청약</b>
          </div>
          <span className="subscription-hero-kicker">ZIP JIKGU 분양 브리핑</span>
          <h2>청약 일정도 집직구 톤으로 한눈에</h2>
          <p>민간분양, 공공분양, 분양결과를 지역별로 빠르게 확인하세요.</p>
        </div>
        <small>{updatedAt ? `${formatKoreanDateTime(updatedAt)} 갱신` : '공식 출처 연결 중'}</small>
      </section>

      <section className="subscription-tabs" aria-label="청약 유형">
        {subscriptionTabOptions.map((tab) => (
          <button
            className={selectedTab === tab.id ? 'active' : ''}
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </section>

      <section className="subscription-region-tabs" aria-label="청약 지역">
        {subscriptionRegionOptions.map((region) => (
          <button
            className={selectedRegion === region ? 'active' : ''}
            key={region}
            onClick={() => setSelectedRegion(region)}
            type="button"
          >
            {region}
          </button>
        ))}
      </section>

      <section className="subscription-source-strip" aria-label="청약 공식 출처">
        <a href="https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancListView.do" target="_blank" rel="noreferrer">
          청약홈 APT분양정보
          <ExternalLink size={13} />
        </a>
        <a href="https://apply.lh.or.kr/lhapply/main.do" target="_blank" rel="noreferrer">
          LH 청약플러스
          <ExternalLink size={13} />
        </a>
        <a href="https://www.i-sh.co.kr/main/lay2/program/S1T1C220/subMain2.do" target="_blank" rel="noreferrer">
          SH 청약정보
          <ExternalLink size={13} />
        </a>
      </section>

      <section className="subscription-list" aria-label="청약 공고 목록">
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
            <article className="subscription-card" key={notice.id}>
              <div className="subscription-card-main">
                <span>
                  {notice.source}
                  {notice.isPopular && <em>인기</em>}
                </span>
                <strong>{notice.title}</strong>
                <p>{notice.address}</p>
                <b>
                  {notice.status} {notice.deadlineLabel}
                </b>
                <small>
                  {notice.visitors.toLocaleString('ko-KR')}회 방문
                  <i />
                  {notice.alerts.toLocaleString('ko-KR')} 알림받는 중
                </small>
              </div>
              <a className="subscription-alert-button" href={notice.url} target="_blank" rel="noreferrer" aria-label={`${notice.title} 공식 공고 확인`}>
                <Bell size={18} />
              </a>
            </article>
          ))
        ) : (
          <div className="subscription-empty">
            <CalendarDays size={26} />
            <strong>선택한 지역의 신규 공고가 아직 없습니다</strong>
            <p>공식 사이트에 신규 공고가 올라오면 이 화면에 맞춰 연결해둘게요.</p>
          </div>
        )}
      </section>
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
              label: listing.intent === 'want' ? '원해요' : '매물',
              aptName: listing.aptName,
              address: listing.address,
            tradeTypeLabel: listing.intent === 'want' ? '매수 희망' : formatListingStatus(listing.verificationStatus),
            priceEok: listing.priceEok,
            hasPrice: true,
            dateLabel: listing.intent === 'want' ? '희망' : '매물',
            subLabel: listing.intent === 'want' ? `${listing.pyeong}평 희망` : `${listing.pyeong}평`,
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
  const kakaoKey = getKakaoMapKey()
  const fallbackLiveDeals = useMemo(
    () => (serverMarkers.length > 0 ? [] : liveDeals),
    [liveDeals, serverMarkers.length],
  )

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

        const [baseLiveMarkers, focusedDealMarkers, listingMarkers] = await Promise.all([
          serverMarkers.length > 0 ? Promise.resolve(serverMarkers) : geocodeDealMarkers(kakao, fallbackLiveDeals),
          focusLiveDeal ? geocodeDealMarkers(kakao, [focusLiveDeal]) : Promise.resolve([]),
          geocodeListingMarkers(kakao, userListings),
        ])
        if (disposed) return

        const liveMarkers = Array.from(
          [...focusedDealMarkers, ...baseLiveMarkers]
            .reduce((group, marker) => {
              const key = marker.aptSeq || marker.id
              if (!group.has(key)) {
                group.set(key, marker)
              }
              return group
            }, new Map<string, MapValueMarker>())
            .values(),
        )
        const displayLiveMarkers = liveMarkers.filter(hasDisplayableMarkerPrice)
        const displayListingMarkers = listingMarkers.filter(hasDisplayableMarkerPrice)
        const liveMarkerNames = new Set(displayLiveMarkers.map((marker) => normalizeSearchText(marker.aptName)))
        const specMarkers = apartmentMarkers(apartments, latestApartmentDeals).filter(
          (marker) => !liveMarkerNames.has(normalizeSearchText(marker.aptName)) && hasDisplayableMarkerPrice(marker),
        )
        const markers = [...displayListingMarkers, ...displayLiveMarkers, ...specMarkers]

        const markerNodes: HTMLElement[] = []
        const markerOverlayModels = markers.map((marker) => {
          const position = new kakao.maps.LatLng(marker.lat, marker.lng)
          return {
            marker,
            position,
            content: null as HTMLElement | null,
            overlay: null as KakaoOverlay | null,
            visible: false,
          }
        })
        let placeOverlays: KakaoOverlay[] = []
        let placeMarkerNodes: HTMLElement[] = []
        let placeRefreshTimer: number | null = null
        let activePlaceSearchKey = ''
        let mapMovingTimer: number | null = null
        let visibleOverlayRaf: number | null = null

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
          onSelectMarker(focusedMarker, { scrollToDetail: Boolean(focusListing || focusLiveDeal) })
        }

        const ensureMarkerOverlay = (model: (typeof markerOverlayModels)[number]) => {
          if (!model.overlay) {
            const content = createValueMarkerElement(model.marker, () => {
              onSelectMarker(model.marker)
              map.setCenter(model.position)
              map.setLevel(4)
            })
            markerNodes.push(content)
            model.content = content
            model.overlay = new kakao.maps.CustomOverlay({
              position: model.position,
              content,
              xAnchor: 0.5,
              yAnchor: 1,
            })
          }

          return model.overlay
        }

        const setMapMoving = (moving: boolean) => {
          mapNode.current?.classList.toggle('is-moving', moving)
          if (mapMovingTimer) window.clearTimeout(mapMovingTimer)
          if (moving) {
            mapMovingTimer = window.setTimeout(() => {
              mapNode.current?.classList.remove('is-moving')
              mapMovingTimer = null
            }, 900)
          } else {
            mapMovingTimer = null
          }
        }

        const updateDensity = () => {
          const visibleNodeCount = markerNodes.length + placeMarkerNodes.length
          const compact = map.getLevel() >= 6 || (visibleNodeCount > 45 && map.getLevel() >= 4)
          markerNodes.forEach((node) => node.classList.toggle('compact', compact))
          placeMarkerNodes.forEach((node) => node.classList.toggle('compact', compact))
        }

        const updateVisibleMainOverlays = () => {
          const bounds = map.getBounds?.()
          const level = map.getLevel()
          const center = map.getCenter()
          const centerLat = getKakaoLatLngNumber(center, 'getLat')
          const centerLng = getKakaoLatLngNumber(center, 'getLng')
          const isMobile = window.matchMedia('(max-width: 860px)').matches
          const visibleCap = isMobile
            ? level <= 3
              ? 52
              : level <= 4
                ? 68
                : 86
            : level <= 3
              ? 140
              : level <= 4
                ? 180
                : 220
          const selectedId = selectedMarkerRef.current?.id
          const candidates = markerOverlayModels
            .filter((model) => !bounds?.contain || bounds.contain(model.position))
            .sort((a, b) => {
              const aPriority = a.marker.id === selectedId ? -2 : a.marker.listing ? -1 : 0
              const bPriority = b.marker.id === selectedId ? -2 : b.marker.listing ? -1 : 0
              if (aPriority !== bPriority) return aPriority - bPriority

              const aDistance = Math.abs(a.marker.lat - centerLat) + Math.abs(a.marker.lng - centerLng)
              const bDistance = Math.abs(b.marker.lat - centerLat) + Math.abs(b.marker.lng - centerLng)
              return aDistance - bDistance
            })
          const visibleIds = new Set(candidates.slice(0, visibleCap).map((model) => model.marker.id))

          markerOverlayModels.forEach((model) => {
            const shouldShow = visibleIds.has(model.marker.id)
            if (model.visible === shouldShow) return

            if (shouldShow) {
              ensureMarkerOverlay(model).setMap(map)
            } else {
              model.overlay?.setMap(null)
            }
            model.visible = shouldShow
          })

          updateDensity()
        }

        const scheduleVisibleMainOverlayUpdate = () => {
          if (visibleOverlayRaf !== null) return

          visibleOverlayRaf = window.requestAnimationFrame(() => {
            visibleOverlayRaf = null
            updateVisibleMainOverlays()
          })
        }

        const clearPlaceOverlays = () => {
          placeOverlays.forEach((overlay) => overlay.setMap(null))
          placeOverlays = []
          placeMarkerNodes = []
        }

        const refreshPlaceFallbackMarkers = () => {
          if (placeRefreshTimer) window.clearTimeout(placeRefreshTimer)

          placeRefreshTimer = window.setTimeout(() => {
            placeRefreshTimer = null

            if (disposed || map.getLevel() > 4 || markerOverlayModels.length > 90) {
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
              updateDensity()
            })
          }, window.matchMedia('(max-width: 860px)').matches ? 950 : 500)
        }

        const handleMapTouchStart = () => {
          blurActiveTextInput()
          setMapMoving(true)
        }
        mapNode.current?.addEventListener('touchstart', handleMapTouchStart, { passive: true })
        mapNode.current?.addEventListener('pointerdown', handleMapTouchStart, { passive: true })

        updateVisibleMainOverlays()
        kakao.maps.event?.addListener(map, 'dragstart', () => {
          blurActiveTextInput()
          setMapMoving(true)
        })
        kakao.maps.event?.addListener(map, 'zoom_changed', () => {
          setMapMoving(true)
          scheduleVisibleMainOverlayUpdate()
        })
        kakao.maps.event?.addListener(map, 'idle', () => {
          setMapMoving(false)
          scheduleVisibleMainOverlayUpdate()
          refreshPlaceFallbackMarkers()
        })
        refreshPlaceFallbackMarkers()

        setMapReady(true)
        setMapError(false)
        cleanup = () => {
          if (visibleOverlayRaf !== null) window.cancelAnimationFrame(visibleOverlayRaf)
          if (placeRefreshTimer) window.clearTimeout(placeRefreshTimer)
          if (mapMovingTimer) window.clearTimeout(mapMovingTimer)
          mapNode.current?.removeEventListener('touchstart', handleMapTouchStart)
          mapNode.current?.removeEventListener('pointerdown', handleMapTouchStart)
          markerOverlayModels.forEach((model) => model.overlay?.setMap(null))
          clearPlaceOverlays()
        }
      })
      .catch(() => {
        setMapReady(false)
        setMapError(true)
      })

    return () => {
      disposed = true
      kakaoMapRef.current = null
      cleanup?.()
    }
  }, [apartments, fallbackLiveDeals, focusListing, focusLiveDeal, kakaoKey, latestApartmentDeals, onSelectMarker, serverMarkers, userListings])

  const shouldShowMapStatus =
    !mapReady && (mapError || rtmsStatus === 'loading' || rtmsStatus === 'refreshing' || Boolean(mapMarkerNotice))

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
            ? 'Kakao 지도 연결 확인 중'
            : notice
              ? '지도 좌표 캐시 준비 필요'
            : status === 'loading'
              ? '서울·경기·인천 실거래 API 불러오는 중'
              : status === 'refreshing'
                ? '서울·경기·인천 실거래 캐시 갱신 중'
                : '표시할 실제 실거래가 없습니다'}
        </strong>
        <p>
          {mapError
            ? '지도를 준비하는 동안 실거래 캐시를 먼저 불러오고 있습니다. 잠시 후 자동으로 다시 표시됩니다.'
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
            <strong>{roadviewStatus === 'loading' ? '로드뷰 찾는 중' : '로드뷰 연결 대기'}</strong>
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
          {listing.intent === 'want' ? '매물 원해요' : '안심 직거래 매물'}
        </span>
        <em>{listing.intent === 'want' ? '매수 희망' : formatListingStatus(listing.verificationStatus)}</em>
      </div>

      <div className="listing-detail-price">
        <div>
          <span>{listing.intent === 'want' ? '희망 예산' : '희망가'}</span>
          <strong>{formatEok(listing.priceEok)}</strong>
        </div>
        <div>
          <span>{listing.intent === 'want' ? '희망 평형' : '평형·층'}</span>
          <strong>
            {listing.intent === 'want' ? `${listing.pyeong}평` : `${listing.pyeong}평 · ${listing.floor}층`}
          </strong>
        </div>
      </div>

      <p className="listing-detail-address">
        {listing.address} · {listing.detailAddress}
      </p>
      <p className="listing-detail-memo">
        {listing.memo ||
          (listing.intent === 'want'
            ? '매수 희망자가 원하는 조건을 등록했습니다.'
            : '매도인이 사진과 설명을 등록한 직거래 매물입니다.')}
      </p>

      {listing.intent !== 'want' && listing.photos.length > 0 ? (
        <div className="listing-detail-photos" aria-label="매물 사진">
          {listing.photos.map((photo) => (
            <img key={photo.id} src={photo.dataUrl} alt={photo.name} />
          ))}
        </div>
      ) : listing.intent !== 'want' ? (
        <div className="listing-photo-empty">
          <Camera size={18} />
          <span>사진 등록 대기</span>
        </div>
      ) : null}

      <div className="owner-check-card">
        <strong>{listing.intent === 'want' ? '매수 희망 확인 단계' : '실소유자 확인 단계'}</strong>
        <p>
          {listing.intent === 'want'
            ? '연락처와 희망 조건을 확인한 뒤 매도 희망자에게 연결합니다.'
            : '등기부상 소유자, 연락처, 허위매물 여부를 중개사가 확인한 뒤 공개 상태로 전환합니다.'}
        </p>
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
        .join(' / ') || '대장 연동 대기'
    : apartment
      ? `${apartment.households.toLocaleString('ko-KR')}세대`
      : '대장 연동 대기'
  const metrics = [
    ['주용도', ledger?.mainUsage || '공동주택'],
    [
      '승인일',
      ledger?.approvalDate || (latestDeal?.buildYear ? `${latestDeal.buildYear}` : apartment ? `${apartment.approvalYear}` : '대장 연동 대기'),
    ],
    ['층수', ledger ? `${ledger.groundFloors || '-'}F / B${ledger.undergroundFloors || '-'}` : '대장 연동 대기'],
    ['총 세대수/가구수', householdFamilyValue],
    ['용적률', ledger?.floorAreaRatio ? `${ledger.floorAreaRatio}%` : apartment ? `${apartment.floorAreaRatio}%` : '대장 연동 대기'],
    [
      '주차',
      ledger?.parkingCount
        ? `${ledger.parkingCount.toLocaleString('ko-KR')}대`
        : apartment
          ? `${apartment.parkingSpaces.toLocaleString('ko-KR')}대`
          : '대장 연동 대기',
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
              : '건축HUB 대기'}
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
    : '분석 대기'
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
          <strong>{ownTrend ? formatPercent(ownTrend.changeRate) : '표본 부족'}</strong>
        </div>
        <div>
          <span>인근 평균</span>
          <strong>{nearbyTrend !== null ? formatPercent(nearbyTrend) : '표본 부족'}</strong>
        </div>
        <div>
          <span>비교</span>
          <strong>{gap !== null ? `${gap >= 0 ? '+' : ''}${gap.toFixed(1)}%p` : '표본 부족'}</strong>
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
  workplaceAddress,
  workplaceLocation,
  maxCommuteMinutes,
  setIncome,
  setAssets,
  setDebt,
  setPreferredPyeong,
  setMaxSubwayMinutes,
  setOfficeArea,
  setWorkplaceAddress,
  setWorkplaceLocation,
  setMaxCommuteMinutes,
  minTradePriceEok,
  maxTradePriceEok,
  setMinTradePriceEok,
  setMaxTradePriceEok,
  aiPreferenceRanks,
  setAiPreferenceRanks,
  budget,
  financingPlan,
  apartments,
}: {
  income: number
  assets: number
  debt: number
  preferredPyeong: number
  maxSubwayMinutes: number
  officeArea: OfficeArea
  workplaceAddress: string
  workplaceLocation: WorkplaceLocation | null
  maxCommuteMinutes: number
  setIncome: (value: number) => void
  setAssets: (value: number) => void
  setDebt: (value: number) => void
  setPreferredPyeong: (value: number) => void
  setMaxSubwayMinutes: (value: number) => void
  setOfficeArea: (value: OfficeArea) => void
  setWorkplaceAddress: (value: string) => void
  setWorkplaceLocation: (value: WorkplaceLocation | null) => void
  setMaxCommuteMinutes: (value: number) => void
  minTradePriceEok: number
  maxTradePriceEok: number
  setMinTradePriceEok: (value: number) => void
  setMaxTradePriceEok: (value: number) => void
  aiPreferenceRanks: AiPreferenceKey[]
  setAiPreferenceRanks: (value: AiPreferenceKey[] | ((current: AiPreferenceKey[]) => AiPreferenceKey[])) => void
  budget: number
  stretch: number
  financingPlan: FinancingPlan
  apartments: RecommendedApartment[]
}) {
  const [hasSearched, setHasSearched] = useState(false)
  const [isResolvingWorkplace, setIsResolvingWorkplace] = useState(false)
  const [isSearchingWorkplace, setIsSearchingWorkplace] = useState(false)
  const [workplaceMessage, setWorkplaceMessage] = useState('')
  const [workplaceSuggestions, setWorkplaceSuggestions] = useState<WorkplaceAddressSuggestion[]>([])
  const [workplaceSuggestionOpen, setWorkplaceSuggestionOpen] = useState(false)
  const searchResults = useMemo(() => (hasSearched ? apartments.slice(0, 5) : []), [apartments, hasSearched])
  const rankedPreferences = uniqueAiPreferenceRanks(aiPreferenceRanks)

  useEffect(() => {
    const query = workplaceAddress.trim()

    if (query.length < 2) {
      setWorkplaceSuggestions([])
      setIsSearchingWorkplace(false)
      return undefined
    }

    if (
      workplaceLocation &&
      (normalizeSearchText(workplaceLocation.label) === normalizeSearchText(query) ||
        normalizeSearchText(workplaceLocation.address) === normalizeSearchText(query))
    ) {
      setWorkplaceSuggestions([])
      setIsSearchingWorkplace(false)
      return undefined
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setIsSearchingWorkplace(true)
      fetch(`/api/kakao/address-search?query=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((payload: { ok?: boolean; items?: WorkplaceAddressSuggestion[] }) => {
          if (controller.signal.aborted) return
          setWorkplaceSuggestions(payload.ok ? payload.items ?? [] : [])
          setWorkplaceSuggestionOpen(true)
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setWorkplaceSuggestions([])
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsSearchingWorkplace(false)
          }
        })
    }, 260)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [workplaceAddress, workplaceLocation])

  const handleRecommendationSearch = async () => {
    const trimmedWorkplaceAddress = workplaceAddress.trim()

    if (
      trimmedWorkplaceAddress.length >= 3 &&
      workplaceLocation &&
      (normalizeSearchText(workplaceLocation.label) === normalizeSearchText(trimmedWorkplaceAddress) ||
        normalizeSearchText(workplaceLocation.address) === normalizeSearchText(trimmedWorkplaceAddress))
    ) {
      setWorkplaceMessage(`${workplaceLocation.label} 기준으로 통근 시간을 계산합니다.`)
    } else if (trimmedWorkplaceAddress.length >= 3) {
      setIsResolvingWorkplace(true)
      setWorkplaceMessage('직장 주소 기준으로 좌표를 찾는 중입니다.')

      try {
        const response = await fetch(`/api/kakao/geocode?query=${encodeURIComponent(trimmedWorkplaceAddress)}`)
        const payload = (await response.json()) as {
          ok?: boolean
          location?: WorkplaceLocation
          message?: string
        }

        if (payload.ok && payload.location) {
          setWorkplaceLocation(payload.location)
          setWorkplaceMessage(`${payload.location.label} 기준으로 통근 시간을 다시 계산했습니다.`)
        } else {
          setWorkplaceLocation(null)
          setWorkplaceMessage(payload.message || '주소 좌표를 찾지 못해 직장권역 기준으로 계산합니다.')
        }
      } catch {
        setWorkplaceLocation(null)
        setWorkplaceMessage('주소 좌표 변환이 지연되어 직장권역 기준으로 계산합니다.')
      } finally {
        setIsResolvingWorkplace(false)
      }
    } else {
      setWorkplaceLocation(null)
      setWorkplaceMessage('정확한 직장 주소를 넣으면 단지별 통근 시간을 더 세밀하게 비교합니다.')
    }

    setHasSearched(true)
    setWorkplaceSuggestionOpen(false)
  }

  const handleWorkplaceSuggestionSelect = (suggestion: WorkplaceAddressSuggestion) => {
    const nextAddress = suggestion.roadAddress || suggestion.address
    setWorkplaceAddress(nextAddress)
    setWorkplaceLocation({
      address: suggestion.address,
      label: suggestion.label,
      lat: suggestion.lat,
      lng: suggestion.lng,
    })
    setWorkplaceSuggestions([])
    setWorkplaceSuggestionOpen(false)
    setWorkplaceMessage(`${suggestion.label} 기준으로 통근 시간을 계산합니다.`)
  }

  const handleRelaxConditions = (type: 'price' | 'commute' | 'subway') => {
    if (type === 'price') {
      setMaxTradePriceEok(Math.min(120, maxTradePriceEok + 10))
      setWorkplaceMessage('최대 가격을 10억 넓혔습니다. 다시 검색해보세요.')
      return
    }

    if (type === 'commute') {
      setMaxCommuteMinutes(Math.min(120, maxCommuteMinutes + 20))
      setWorkplaceMessage('직장 거리 조건을 20분 넓혔습니다. 다시 검색해보세요.')
      return
    }

    setMaxSubwayMinutes(Math.min(30, maxSubwayMinutes + 10))
    setWorkplaceMessage('역 도보 조건을 10분 넓혔습니다. 다시 검색해보세요.')
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
          예산은 DSR·스트레스 DSR·LTV·수도권 대출한도를 먼저 통과 조건으로 적용합니다. 순위는 상승여력·관심도·직장
          접근성을 중심으로 보고, 점수가 비슷하면 평형별 실거래 추이, 단지 내 상승률, 서울 입지와 교통 호재를 더 반영합니다.
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
        <div className="workplace-address-field">
          <span>직장 주소</span>
          <input
            value={workplaceAddress}
            onChange={(event) => {
              setWorkplaceAddress(event.target.value)
              setWorkplaceLocation(null)
              setWorkplaceMessage('')
              setWorkplaceSuggestionOpen(true)
            }}
            onFocus={() => setWorkplaceSuggestionOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setWorkplaceSuggestionOpen(false), 160)
            }}
            placeholder="예: 서울 강남구 테헤란로 152"
            autoComplete="street-address"
          />
          {workplaceSuggestionOpen && workplaceAddress.trim().length >= 2 && (
            <div className="workplace-address-suggestions" aria-label="직장 주소 추천">
              {isSearchingWorkplace ? (
                <div className="workplace-suggestion-status">주소 후보를 찾는 중입니다.</div>
              ) : workplaceSuggestions.length > 0 ? (
                workplaceSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleWorkplaceSuggestionSelect(suggestion)}
                  >
                    <strong>{suggestion.label}</strong>
                    <span>{suggestion.roadAddress || suggestion.address}</span>
                    {suggestion.jibunAddress && suggestion.jibunAddress !== (suggestion.roadAddress || suggestion.address) && (
                      <em>지번 {suggestion.jibunAddress}</em>
                    )}
                  </button>
                ))
              ) : (
                <div className="workplace-suggestion-status">
                  주소 후보가 없습니다. 도로명과 건물번호를 같이 입력해보세요.
                </div>
              )}
            </div>
          )}
          <small>
            {workplaceLocation
              ? `${workplaceLocation.label} 좌표 기준`
              : '정확한 주소를 입력하면 단지별 통근 시간을 주소 기준으로 계산합니다.'}
          </small>
        </div>
        <div className="preference-grid">
          <SelectField
            label="직장권역 보조"
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
        {isResolvingWorkplace ? '직장 주소 계산 중' : '조건으로 검색하기'}
        <ChevronRight size={18} />
      </button>
      {workplaceMessage && <p className="ai-workplace-message">{workplaceMessage}</p>}

      <section className="budget-band">
        <div>
          <span>실질 가용가</span>
          <strong>{formatEok(budget)}</strong>
        </div>
        <div>
          <span>DSR 대출한도</span>
          <strong>{formatEok(financingPlan.dsrLimitLoanEok)}</strong>
        </div>
        <div>
          <span>예상 월 원리금</span>
          <strong>{formatManwon(financingPlan.baseMonthlyPaymentManwon)}</strong>
        </div>
        <div>
          <span>스트레스 DSR</span>
          <strong>{formatRate(financingPlan.dsrCapPercent)} 이내</strong>
        </div>
      </section>
      <p className="loan-assumption-note">
        {financingPlan.assumedRegionLabel} · {financingPlan.termYears}년 원리금균등 · 금리 {formatRate(financingPlan.baseRatePercent)}
        · 스트레스 {formatRate(financingPlan.stressRatePercent)}로 보수 계산
      </p>

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
            <div className="recommend-empty-actions">
              <button type="button" onClick={() => handleRelaxConditions('price')}>
                가격 +10억
              </button>
              <button type="button" onClick={() => handleRelaxConditions('commute')}>
                직장거리 +20분
              </button>
              <button type="button" onClick={() => handleRelaxConditions('subway')}>
                역도보 +10분
              </button>
            </div>
            <button className="primary-action compact" type="button" onClick={handleRecommendationSearch}>
              조건 다시 검색
              <ChevronRight size={16} />
            </button>
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
                {apartment.region} · {apartment.station} · {workplaceLocation?.label || officeArea} 대중교통 약 {apartment.commuteToOffice}분
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
              <div className="mortgage-strip" aria-label={`${apartment.name} 대출 추정`}>
                <span>대출 추정</span>
                <strong>{formatEok(apartment.mortgage.loanEok)}</strong>
                <em>
                  월 {formatManwon(apartment.mortgage.monthlyPaymentManwon)} · 현금필요{' '}
                  {formatEok(apartment.mortgage.cashNeededEok)} · DSR {formatRate(apartment.mortgage.dsrPercent)}
                </em>
              </div>
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
                  aria-label={`${apartment.name}에서 ${workplaceLocation?.label || officeArea}까지 카카오맵 대중교통 경로 확인`}
                >
                  <BusFront size={12} />
                  {apartment.commuteSource === 'address-geocoded' ? '주소 기준 경로' : '카카오맵 대중교통 확인'}
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
        추천은 입력값과 공개 실거래가 기반의 참고 정보입니다. 대출 가능액은 금융위·금감원 DSR/스트레스 DSR 구조를 단순화한
        추정치이며, 실제 한도와 금리는 은행 심사, KB시세, 보유주택, 신용도, 지역 규제에 따라 달라집니다.
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
  initialIntent,
  onCreateListing,
}: {
  salePrice: number
  setSalePrice: (value: number) => void
  brokerage: { legalCapBothSides: number; jipjigguFee: number; savings: number }
  listingCandidates: ListingApartmentCandidate[]
  initialIntent?: UserListing['intent']
  onCreateListing: (listing: UserListing) => void
}) {
  const [registrationOpen, setRegistrationOpen] = useState(false)
  const [listingIntent, setListingIntent] = useState<UserListing['intent']>(initialIntent ?? 'sell')
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
  useEffect(() => {
    if (!initialIntent) return
    setListingIntent(initialIntent)
    setRegistrationOpen(true)
  }, [initialIntent])

  useEffect(() => {
    setMemo((currentMemo) => {
      const saleDefault = '실거주 관리 상태 양호, 잔금일 협의 가능합니다.'
      const wantDefault = '입주 가능한 매물을 찾고 있습니다. 가격과 잔금일은 협의 가능합니다.'
      if (listingIntent === 'want' && currentMemo === saleDefault) return wantDefault
      if (listingIntent === 'sell' && currentMemo === wantDefault) return saleDefault
      return currentMemo
    })
  }, [listingIntent])
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
      intent: listingIntent,
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
        <button
          className="primary-action"
          type="button"
          onClick={() => {
            setListingIntent('sell')
            setRegistrationOpen(true)
          }}
        >
          매물 등록 시작
          <ChevronRight size={18} />
        </button>
        <button
          className="secondary-action listing-want-action"
          type="button"
          onClick={() => {
            setListingIntent('want')
            setRegistrationOpen(true)
          }}
        >
          매물 원해요 등록
          <Plus size={16} />
        </button>
      </section>

      {registrationOpen && (
        <section className="listing-registration" aria-label="직거래 매물 등록">
          <div className="listing-registration-head">
            <div>
              <span>매물등록</span>
              <h3>{listingIntent === 'want' ? '원하는 단지와 예산을 등록합니다' : '매물 정보 입력 후 실소유자 확인으로 넘어갑니다'}</h3>
            </div>
            <strong>{listingIntent === 'want' ? '매수희망' : '허위매물 차단'}</strong>
          </div>
          <div className="listing-intent-tabs" aria-label="등록 유형">
            <button
              className={listingIntent === 'sell' ? 'active' : ''}
              type="button"
              onClick={() => setListingIntent('sell')}
            >
              매물 등록
            </button>
            <button
              className={listingIntent === 'want' ? 'active' : ''}
              type="button"
              onClick={() => setListingIntent('want')}
            >
              매물 원해요
            </button>
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
              <span>{listingIntent === 'want' ? '희망 예산' : '희망가'}</span>
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
              <span>{listingIntent === 'want' ? '선호 층' : '층'}</span>
                <input
                  type="number"
                  value={listingFloor}
                  onChange={(event) => setListingFloor(Number(event.target.value))}
                />
                <em>층</em>
              </label>
            </div>
            <label>
              <span>{listingIntent === 'want' ? '이름' : '소유자 성명'}</span>
              <input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} placeholder={listingIntent === 'want' ? '연락 받을 이름' : '검증용'} />
            </label>
            <label>
              <span>연락처</span>
              <input value={ownerPhone} onChange={(event) => setOwnerPhone(event.target.value)} placeholder="검증용" />
            </label>
            <label>
              <span>{listingIntent === 'want' ? '원하는 조건' : '매물 설명'}</span>
              <textarea value={memo} onChange={(event) => setMemo(event.target.value)} rows={3} />
            </label>
          </div>

          {listingIntent === 'sell' && (
            <label className="photo-uploader">
              <Camera size={18} />
              <span>사진 업로드</span>
              <input type="file" accept="image/*" multiple onChange={(event) => void handlePhotoChange(event.target.files)} />
            </label>
          )}

          {listingIntent === 'sell' && photos.length > 0 && (
            <div className="listing-photo-preview" aria-label="업로드 사진 미리보기">
              {photos.map((photo) => (
                <img key={photo.id} src={photo.dataUrl} alt={photo.name} />
              ))}
            </div>
          )}

          <div className="owner-verification-flow">
            <div className="active">
              <strong>1</strong>
              <span>{listingIntent === 'want' ? '희망조건 입력' : '매물정보 입력'}</span>
            </div>
            <div className="active">
              <strong>2</strong>
              <span>{listingIntent === 'want' ? '연락처 확인' : '등기·실소유자 확인'}</span>
            </div>
            <div>
              <strong>3</strong>
              <span>{listingIntent === 'want' ? '원해요 노출' : '지도 매물 노출'}</span>
            </div>
          </div>

          <p className="listing-register-note">
            {listingIntent === 'want'
              ? '등록된 매수 희망 조건은 직거래 화면의 매물 원해요 목록에 함께 표시됩니다. 실제 운영에서는 연락처 확인 후 공개합니다.'
              : '등록 즉시 지도에는 노란 매물 박스로 반영하고, 실제 운영에서는 등기부·신분확인·소유자 일치 검증을 통과한 매물만 공개합니다.'}
          </p>

          <button
            className="primary-action"
            type="button"
            disabled={!canSubmitListing}
            onClick={handleSubmitListing}
          >
            {listingIntent === 'want' ? '매물 원해요 등록' : '실소유자 확인 단계로 이동'}
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

function ComplexListingsPanel({
  group,
  onBack,
  onRegister,
  onOpenListing,
}: {
  group: ListingComplexGroup
  onBack: () => void
  onRegister: () => void
  onOpenListing: (listing: UserListing) => void
}) {
  const sortedListings = [...group.listings].sort((a, b) => Number(b.priceEok) - Number(a.priceEok))
  const hasPhotos = sortedListings.some((listing) => listing.photos.length > 0)

  return (
    <div className="view-stack complex-listings-view">
      <header className="complex-listings-header">
        <button type="button" onClick={onBack} aria-label="직거래 목록으로 돌아가기">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2>{group.aptName}</h2>
          <span>{group.address}</span>
        </div>
        <em>{sortedListings.length}건</em>
      </header>

      <div className="complex-filter-row" aria-label="단지 매물 필터">
        <button type="button">
          거래 유형 · 가격
          <ChevronRight size={16} />
        </button>
        <button type="button">
          면적(공급)
          <ChevronRight size={16} />
        </button>
      </div>

      <p className="complex-listings-caption">
        단지 안에 접수된 직거래 매물입니다. 실소유자 관계와 허위매물 여부를 확인한 뒤 계약 전 중개사가 함께 점검합니다.
      </p>

      <div className="complex-listing-list">
        {sortedListings.map((listing) => {
          const thumbnail = listing.photos[0]?.dataUrl

          return (
            <button key={listing.id} className="complex-listing-card" type="button" onClick={() => onOpenListing(listing)}>
              <div>
                <strong>{listing.intent === 'want' ? `매수희망 ${formatEok(listing.priceEok)} 이하` : `매매 ${formatEok(listing.priceEok)}`}</strong>
                <span>
                  {formatListingArea(listing)}, {listing.buildingDong || '-'}동 {formatListingFloor(listing.floor)}
                </span>
                <em>{summarizeListingMemo(listing)}</em>
              </div>
              <figure className={thumbnail ? 'complex-listing-thumb' : 'complex-listing-thumb empty'}>
                {thumbnail ? <img src={thumbnail} alt={`${listing.aptName} 매물 사진`} /> : <Camera size={28} />}
              </figure>
            </button>
          )
        })}
      </div>

      {!hasPhotos && (
        <p className="complex-photo-note">사진이 없는 매물도 등록 후 실소유자 확인을 거쳐 공개됩니다. 사진을 추가하면 노출 신뢰도가 올라갑니다.</p>
      )}

      <button className="complex-floating-cta" type="button" onClick={onRegister}>
        <Plus size={20} />
        집 내놓기
      </button>

      <button className="complex-contact-button" type="button" onClick={onRegister}>
        중개사에게 문의하기
      </button>
    </div>
  )
}

function DirectListingsView({
  userListings,
  liveDeals,
  onRegister,
  onRegisterWanted,
  onOpenListing,
  onOpenDeal,
}: {
  userListings: UserListing[]
  liveDeals: LiveRtmsDeal[]
  onRegister: () => void
  onRegisterWanted: () => void
  onOpenListing: (listing: UserListing) => void
  onOpenDeal: (deal: LiveRtmsDeal) => void
}) {
  const [selectedComplexKey, setSelectedComplexKey] = useState<string | null>(null)
  const saleListings = useMemo(
    () => userListings.filter((listing) => (listing.intent ?? 'sell') === 'sell'),
    [userListings],
  )
  const wantedListings = useMemo(
    () => userListings.filter((listing) => listing.intent === 'want'),
    [userListings],
  )
  const listingGroups = useMemo(() => {
    const groups = new Map<string, ListingComplexGroup>()

    saleListings.forEach((listing) => {
      const key = getListingComplexKey(listing)
      const currentGroup = groups.get(key)
      if (currentGroup) {
        currentGroup.listings.push(listing)
        return
      }

      groups.set(key, {
        key,
        aptName: listing.aptName,
        address: listing.address,
        listings: [listing],
      })
    })

    return [...groups.values()]
      .map((group) => ({
        ...group,
        listings: [...group.listings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      }))
      .sort((a, b) => new Date(b.listings[0]?.createdAt ?? 0).getTime() - new Date(a.listings[0]?.createdAt ?? 0).getTime())
  }, [saleListings])
  const selectedComplexGroup = selectedComplexKey
    ? listingGroups.find((group) => group.key === selectedComplexKey) ?? null
    : null
  const directDeals = useMemo(
    () =>
      liveDeals
        .filter((deal) => deal.tradeType === 'direct' && deal.status === 'active')
        .sort((a, b) => dealTimestamp(b) - dealTimestamp(a))
        .slice(0, 6),
    [liveDeals],
  )

  if (selectedComplexGroup) {
    return (
      <ComplexListingsPanel
        group={selectedComplexGroup}
        onBack={() => setSelectedComplexKey(null)}
        onRegister={onRegister}
        onOpenListing={onOpenListing}
      />
    )
  }

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
            <em>{saleListings.length ? `${saleListings.length}건` : '모집중'}</em>
            <button className="round-add-button" type="button" onClick={onRegister} aria-label="매물 등록하기">
              <Plus size={18} />
            </button>
          </div>
        </div>

        {listingGroups.length > 0 ? (
          <div className="listing-market-list">
            {listingGroups.map((group) => {
              const latestListing = group.listings[0]
              const minPrice = Math.min(...group.listings.map((listing) => listing.priceEok))
              const maxPrice = Math.max(...group.listings.map((listing) => listing.priceEok))

              return (
              <button key={group.key} type="button" onClick={() => setSelectedComplexKey(group.key)}>
                <div>
                  <strong>{group.aptName}</strong>
                  <span>
                    {group.address} · 매물 {group.listings.length}건 · 최근 {latestListing.pyeong}평
                  </span>
                  <em>{formatListingStatus(latestListing.verificationStatus)}</em>
                </div>
                <b>{minPrice === maxPrice ? formatEok(minPrice) : `${formatEok(minPrice)}~`}</b>
              </button>
              )
            })}
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

      <section className="listing-market-section wanted-market-section" aria-label="매물 원해요">
        <div className="detail-section-head listing-market-head">
          <span>
            <Search size={15} />
            매물 원해요
          </span>
          <div>
            <em>{wantedListings.length ? `${wantedListings.length}건` : '등록 가능'}</em>
            <button className="round-add-button wanted" type="button" onClick={onRegisterWanted} aria-label="매물 원해요 등록하기">
              <Plus size={18} />
            </button>
          </div>
        </div>

        {wantedListings.length > 0 ? (
          <div className="listing-market-list compact">
            {wantedListings.map((listing) => (
              <button className="wanted-listing" key={listing.id} type="button" onClick={() => onOpenListing(listing)}>
                <div>
                  <strong>{listing.aptName}</strong>
                  <span>
                    {listing.address} · {listing.pyeong}평 희망 · {formatEok(listing.priceEok)} 이하
                  </span>
                  <em>{listing.memo || '매수 희망 조건을 등록했습니다.'}</em>
                </div>
                <b>원해요</b>
              </button>
            ))}
          </div>
        ) : (
          <div className="listing-market-empty">
            <strong>찾는 매물이 있다면 먼저 등록해보세요</strong>
            <span>원하는 단지와 예산을 올리면 매도 희망자와 연결할 수 있습니다.</span>
            <button className="secondary-action" type="button" onClick={onRegisterWanted}>
              원하는 매물 등록하기
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
              <strong>최근 직거래 신고 사례를 모으고 있습니다</strong>
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
