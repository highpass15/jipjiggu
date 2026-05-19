import { XMLParser } from 'fast-xml-parser'
import { defineConfig, loadEnv, type Plugin, type PreviewServer, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'

type Metro = 'seoul' | 'gyeonggi' | 'incheon'
type TargetDistrict = {
  code: string
  name: string
  metro: Metro
}
type TargetGroup = {
  label: string
  districts: TargetDistrict[]
  legalDongsByLawdCd?: Record<string, string[]>
}
type RtmsApiItem = Record<string, string | number | undefined>
type BuildingApiItem = Record<string, string | number | undefined>
type RtmsParsedResponse = {
  response?: {
    header?: {
      resultCode?: string | number
      resultMsg?: string | number
    }
    body?: {
      totalCount?: string | number
      items?: {
        item?: RtmsApiItem | RtmsApiItem[]
      }
    }
  }
}
type BuildingParsedResponse = RtmsParsedResponse
type ReportNewsItem = {
  title: string
  link: string
  source: string
  publishedAt: string
  keyword: string
}
type ReportNewsCache = {
  updatedAt: number
  payload: {
    ok: boolean
    source: string
    updatedAt: string
    items: ReportNewsItem[]
  }
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

type StoredUserListing = {
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

const seoulDistricts: TargetDistrict[] = [
  ['11110', '서울 종로구'],
  ['11140', '서울 중구'],
  ['11170', '서울 용산구'],
  ['11200', '서울 성동구'],
  ['11215', '서울 광진구'],
  ['11230', '서울 동대문구'],
  ['11260', '서울 중랑구'],
  ['11290', '서울 성북구'],
  ['11305', '서울 강북구'],
  ['11320', '서울 도봉구'],
  ['11350', '서울 노원구'],
  ['11380', '서울 은평구'],
  ['11410', '서울 서대문구'],
  ['11440', '서울 마포구'],
  ['11470', '서울 양천구'],
  ['11500', '서울 강서구'],
  ['11530', '서울 구로구'],
  ['11545', '서울 금천구'],
  ['11560', '서울 영등포구'],
  ['11590', '서울 동작구'],
  ['11620', '서울 관악구'],
  ['11650', '서울 서초구'],
  ['11680', '서울 강남구'],
  ['11710', '서울 송파구'],
  ['11740', '서울 강동구'],
].map(([code, name]) => ({ code, name, metro: 'seoul' }))

const incheonDistricts: TargetDistrict[] = [
  ['28110', '인천 중구'],
  ['28140', '인천 동구'],
  ['28177', '인천 미추홀구'],
  ['28185', '인천 연수구'],
  ['28200', '인천 남동구'],
  ['28237', '인천 부평구'],
  ['28245', '인천 계양구'],
  ['28260', '인천 서구'],
  ['28710', '인천 강화군'],
  ['28720', '인천 옹진군'],
].map(([code, name]) => ({ code, name, metro: 'incheon' }))

const gyeonggiDistricts: TargetDistrict[] = [
  ['41111', '경기 수원시 장안구'],
  ['41113', '경기 수원시 권선구'],
  ['41115', '경기 수원시 팔달구'],
  ['41117', '경기 수원시 영통구'],
  ['41131', '경기 성남시 수정구'],
  ['41133', '경기 성남시 중원구'],
  ['41135', '경기 성남시 분당구'],
  ['41150', '경기 의정부시'],
  ['41171', '경기 안양시 만안구'],
  ['41173', '경기 안양시 동안구'],
  ['41192', '경기 부천시 원미구'],
  ['41194', '경기 부천시 소사구'],
  ['41196', '경기 부천시 오정구'],
  ['41210', '경기 광명시'],
  ['41220', '경기 평택시'],
  ['41250', '경기 동두천시'],
  ['41271', '경기 안산시 상록구'],
  ['41273', '경기 안산시 단원구'],
  ['41281', '경기 고양시 덕양구'],
  ['41285', '경기 고양시 일산동구'],
  ['41287', '경기 고양시 일산서구'],
  ['41290', '경기 과천시'],
  ['41310', '경기 구리시'],
  ['41360', '경기 남양주시'],
  ['41370', '경기 오산시'],
  ['41390', '경기 시흥시'],
  ['41410', '경기 군포시'],
  ['41430', '경기 의왕시'],
  ['41450', '경기 하남시'],
  ['41461', '경기 용인시 처인구'],
  ['41463', '경기 용인시 기흥구'],
  ['41465', '경기 용인시 수지구'],
  ['41480', '경기 파주시'],
  ['41500', '경기 이천시'],
  ['41550', '경기 안성시'],
  ['41570', '경기 김포시'],
  ['41590', '경기 화성시'],
  ['41610', '경기 광주시'],
  ['41630', '경기 양주시'],
  ['41650', '경기 포천시'],
  ['41670', '경기 여주시'],
  ['41800', '경기 연천군'],
  ['41820', '경기 가평군'],
  ['41830', '경기 양평군'],
].map(([code, name]) => ({ code, name, metro: 'gyeonggi' }))

const capitalAreaDistricts = [...seoulDistricts, ...gyeonggiDistricts, ...incheonDistricts]
const seoulReportRegionNames = seoulDistricts.map((district) => district.name)
const rtmsDailyRefreshHour = 1
const rtmsDefaultCapitalMonthsBack = 3
const rtmsMapMarkerMonthsBack = 60
const rtmsMapMarkerLimit = 120000
const rtmsMapMarkerReturnLimit = 1200
const rtmsMapMarkerDistrictLimit = 2200
const rtmsMapMarkerBatchSize = 2
const rtmsMapMarkerGeocodeBatchLimit = 180
const rtmsMapMarkerMonthBatchSize = 12
const rtmsCacheDirectory = path.resolve(process.cwd(), '.cache', 'rtms')
const listingCacheFilePath = path.resolve(process.cwd(), '.cache', 'listings.json')
const reportNewsCache = new Map<string, ReportNewsCache>()
const reportNewsCacheMs = 30 * 60 * 1000
const districtNameByLawdCd = Object.fromEntries(
  capitalAreaDistricts.map((district) => [district.code, district.name]),
)
const pyeongchonCoreDongsByLawdCd: Record<string, string[]> = {
  '41173': ['평촌동', '호계동', '범계동', '신촌동', '귀인동', '달안동', '부림동', '갈산동', '비산동', '관양동'],
  '41430': ['내손동', '포일동'],
}

const targetGroups: Record<string, TargetGroup> = {
  'pyeongchon-core': {
    label: '평촌·만안·과천·의왕',
    districts: gyeonggiDistricts.filter((district) => ['41171', '41173', '41290', '41430'].includes(district.code)),
    legalDongsByLawdCd: pyeongchonCoreDongsByLawdCd,
  },
  capital: { label: '서울·경기·인천', districts: capitalAreaDistricts },
  seoul: { label: '서울 전체', districts: seoulDistricts },
  gyeonggi: { label: '경기 전체', districts: gyeonggiDistricts },
  incheon: { label: '인천 전체', districts: incheonDistricts },
  gangnam3: {
    label: '강남3구',
    districts: seoulDistricts.filter((district) => ['11650', '11680', '11710'].includes(district.code)),
  },
  'mapo-yongsan': {
    label: '마포·용산',
    districts: seoulDistricts.filter((district) => ['11440', '11170'].includes(district.code)),
  },
  'bundang-pangyo': {
    label: '분당·판교',
    districts: gyeonggiDistricts.filter((district) => district.code === '41135'),
  },
  'gwanggyo-suwon': {
    label: '광교·수원',
    districts: gyeonggiDistricts.filter((district) => district.name.includes('수원시')),
  },
}

const getTargetLegalDongs = (group: TargetGroup, lawdCd: string) => group.legalDongsByLawdCd?.[lawdCd]

const matchesTargetLegalDong = (group: TargetGroup, lawdCd: string, legalDong: string) => {
  const targetDongs = getTargetLegalDongs(group, lawdCd)
  return !targetDongs || targetDongs.some((dong) => legalDong.includes(dong) || dong.includes(legalDong))
}

const matchesTargetGroup = (group: TargetGroup, lawdCd: string, legalDong: string) =>
  group.districts.some((district) => district.code === lawdCd) && matchesTargetLegalDong(group, lawdCd, legalDong)

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
})

const textValue = (value: string | number | undefined) => String(value ?? '').trim()
const numberValue = (value: string | number | undefined) => Number(textValue(value).replaceAll(',', ''))
const twoDigits = (value: string | number | undefined) => textValue(value).padStart(2, '0')
const asArray = <T>(value: T | T[] | undefined): T[] => {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}
const normalizeComparableName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^가-힣a-z0-9]/g, '')
    .trim()
const loadRuntimeEnv = () => ({ ...loadEnv('', process.cwd(), ''), ...process.env })
const readKakaoRestApiKey = (env: Record<string, string | undefined>) =>
  env.KAKAO_REST_API_KEY ||
  env.KAKAO_REST_KEY ||
  env.KAKAO_MAP_REST_API_KEY ||
  env.KAKAO_LOCAL_REST_API_KEY ||
  env.VITE_KAKAO_REST_API_KEY ||
  ''

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const fetchWithTimeout = async (url: string, timeoutMs = 9000, init: RequestInit = {}) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

const fetchTextWithRetry = async (url: string, attempts = 3) => {
  let lastResponse: Response | null = null
  let lastRaw = ''

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const apiResponse = await fetchWithTimeout(url)
    const raw = await apiResponse.text()

    lastResponse = apiResponse
    lastRaw = raw

    if (apiResponse.ok || ![429, 500, 502, 503, 504].includes(apiResponse.status)) {
      return { apiResponse, raw }
    }

    if (attempt < attempts) {
      await sleep(900 * attempt)
    }
  }

  return {
    apiResponse: lastResponse as Response,
    raw: lastRaw,
  }
}

const normalizeNewsTitle = (value: string) =>
  value
    .replace(/\s+-\s+[^-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const reportNewsQueriesByRegion: Record<string, string[]> = {
  '안양시 동안구': [
    '안양 동안구 평촌신도시 정비사업',
    '평촌 범계 호계 귀인 재건축 리모델링',
    '관양 인덕원 GTX-C 월곶판교선 동탄인덕원선',
  ],
  '안양시 만안구': [
    '안양 만안구 정비사업',
    '박달스마트시티 안양',
    '안양역 생활권 개발 석수 박달',
  ],
  의왕시: ['의왕 내손 포일 인덕원 개발', '의왕 백운밸리 인덕원 교통', '내손동 포일동 아파트 정비'],
  과천시: ['과천 재건축 정부과천청사 GTX-C', '과천 지식정보타운 아파트', '과천 원도심 재건축'],
}

const buildGenericReportNewsQueries = (region: string) => [
  `${region} 아파트 정비사업 재건축 재개발`,
  `${region} 교통 개발 분양 부동산`,
  `${region} 역세권 주택 공급 아파트`,
]

const buildGenericReportNewsKeywords = (region: string) => {
  const compactRegion = region.replace(/\s+/g, '')
  const withoutMetro = region.replace(/^서울\s+/, '')
  const withoutGu = withoutMetro.replace(/구$/, '')
  return Array.from(new Set([region, compactRegion, withoutMetro, withoutGu].filter(Boolean)))
}

const reportRegionAliases: Record<string, string> = {
  '안양 전체': '안양시 동안구',
  '평촌·범계': '안양시 동안구',
  '호계·신촌·귀인': '안양시 동안구',
  '관양·인덕원': '안양시 동안구',
  '비산·만안': '안양시 만안구',
  과천: '과천시',
  '의왕 내손·포일': '의왕시',
}

const reportNewsKeywordsByRegion: Record<string, string[]> = {
  '안양시 동안구': ['안양', '동안구', '평촌', '범계', '호계', '관양', '인덕원', '귀인', '달안', '부림'],
  '안양시 만안구': ['안양', '만안구', '안양역', '박달', '석수', '안양동', '박달스마트시티'],
  의왕시: ['의왕', '내손', '포일', '백운', '청계', '오전', '인덕원'],
  과천시: ['과천', '별양', '부림', '중앙', '갈현', '문원', '정부과천청사', '지식정보타운'],
}

const reportNewsTopicKeywords = [
  '아파트',
  '부동산',
  '재건축',
  '재개발',
  '리모델링',
  '정비',
  '개발',
  '교통',
  'gtx',
  '월곶판교',
  '동탄인덕원',
  '인덕원',
  '지식정보타운',
  '스마트시티',
  '분양',
  '공급',
  '주택',
  '역세권',
  '신축',
]

const normalizeReportRegion = (region: string) => {
  const trimmedRegion = region.trim()
  if (reportNewsQueriesByRegion[trimmedRegion] || seoulReportRegionNames.includes(trimmedRegion)) {
    return trimmedRegion
  }

  return reportRegionAliases[trimmedRegion] ?? '안양시 동안구'
}

const fallbackReportNewsByRegion: Record<string, ReportNewsItem[]> = {
  '안양시 동안구': [
    {
      title: '평촌신도시 특별정비구역과 선도지구 추진 속도 점검',
      link: 'https://www.anyang.go.kr/',
      source: '집직구 브리핑',
      publishedAt: new Date().toISOString(),
      keyword: '평촌 정비사업',
    },
    {
      title: '인덕원역 GTX-C·월곶판교선·동탄인덕원선 교통축 체크',
      link: 'https://www.anyang.go.kr/',
      source: '집직구 브리핑',
      publishedAt: new Date().toISOString(),
      keyword: '인덕원 교통축',
    },
  ],
  '안양시 만안구': [
    {
      title: '박달스마트시티와 만안구 장기 개발 기대감 추적',
      link: 'https://www.anyang.go.kr/',
      source: '집직구 브리핑',
      publishedAt: new Date().toISOString(),
      keyword: '박달스마트시티',
    },
    {
      title: '안양역·석수·박달 생활권 정비사업 흐름 점검',
      link: 'https://www.anyang.go.kr/',
      source: '집직구 브리핑',
      publishedAt: new Date().toISOString(),
      keyword: '만안구 정비사업',
    },
  ],
  과천시: [
    {
      title: '과천 원도심 재건축과 지식정보타운 생활권 변화 점검',
      link: 'https://www.gccity.go.kr/',
      source: '집직구 브리핑',
      publishedAt: new Date().toISOString(),
      keyword: '과천 재건축',
    },
    {
      title: '정부과천청사역 교통축과 GTX-C 일정 확인',
      link: 'https://www.gccity.go.kr/',
      source: '집직구 브리핑',
      publishedAt: new Date().toISOString(),
      keyword: '정부과천청사역',
    },
  ],
  의왕시: [
    {
      title: '내손·포일 생활권 정비와 인덕원 접근성 변화 점검',
      link: 'https://www.uiwang.go.kr/',
      source: '집직구 브리핑',
      publishedAt: new Date().toISOString(),
      keyword: '내손·포일',
    },
    {
      title: '의왕 인덕원권 교통축과 신축 생활권 흐름 확인',
      link: 'https://www.uiwang.go.kr/',
      source: '집직구 브리핑',
      publishedAt: new Date().toISOString(),
      keyword: '의왕 인덕원권',
    },
  ],
}

const subscriptionFallbackItems: SubscriptionNotice[] = [
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

const applyHomeAptListUrl = 'https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancListView.do'
const subscriptionCacheTtlMs = 15 * 60 * 1000
let subscriptionCache:
  | {
      updatedAt: number
      payload: {
        ok: boolean
        source: string
        updatedAt: string
        sourceStatuses: Array<Record<string, string | number | boolean>>
        items: SubscriptionNotice[]
      }
    }
  | null = null

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#40;/g, '(')
    .replace(/&#41;/g, ')')

const stripHtml = (value: string) =>
  decodeHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]*>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()

const stableNumber = (seed: string, min: number, spread: number) => {
  const hash = createHash('sha1').update(seed).digest('hex').slice(0, 8)
  return min + (Number.parseInt(hash, 16) % spread)
}

const applyHomeRegionMap: Record<string, SubscriptionNotice['region']> = {
  서울: '서울',
  경기: '경기',
  인천: '인천',
  부산: '부산',
}

const inferApplyHomeRegion = (area: string): SubscriptionNotice['region'] =>
  applyHomeRegionMap[area.replace(/\s+/g, '')] ?? '전국'

const parseKoreanDate = (value: string) => {
  const match = value.match(/(\d{4})[-.](\d{2})[-.](\d{2})/)
  if (!match) return null

  return new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00+09:00`)
}

const formatApplyHomeDeadline = (period: string) => {
  const dates = [...period.matchAll(/(\d{4}[-.]\d{2}[-.]\d{2})/g)].map((match) => parseKoreanDate(match[1]))
  const start = dates[0]
  const end = dates.at(-1)
  const today = new Date()

  if (!start) return period || '일정공개'
  if (end && today.getTime() > end.getTime() + 24 * 60 * 60 * 1000) return '마감'
  if (today.getTime() >= start.getTime()) return '접수중'

  const days = Math.max(0, Math.ceil((start.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)))
  return `D-${days}`
}

const getApplyHomeTotalPages = (html: string) => {
  const pageIndexes = [...html.matchAll(/pageIndex=(\d+)/g)].map((match) => Number(match[1])).filter(Boolean)
  const totalCountMatch = html.match(/총게시물\s*:\s*<b[^>]*>\s*([\d,]+)\s*<\/b>/)
  const totalCount = totalCountMatch ? Number(totalCountMatch[1].replace(/,/g, '')) : 0
  return Math.max(1, ...pageIndexes, totalCount ? Math.ceil(totalCount / 10) : 1)
}

const parseApplyHomePrivateRows = (html: string, pageIndex: number): SubscriptionNotice[] =>
  [...html.matchAll(/<tr\b[^>]*data-pbno="([^"]*)"[^>]*data-hmno="([^"]*)"[^>]*data-honm="([^"]*)"[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((match, index): SubscriptionNotice | null => {
      const [, pblancNo, houseManageNo, rawTitle, rowHtml] = match
      const cells = [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => stripHtml(cell[1]))
      if (cells.length < 8) return null

      const area = cells[0]
      const houseType = cells[1]
      const supplyType = cells[2]
      const title = stripHtml(rawTitle) || cells[3]
      const builder = cells[4]
      const phone = cells[5]
      const noticeDate = cells[6]
      const subscriptionPeriod = cells[7]
      const winnerDate = cells[8]
      const seed = `${title}-${noticeDate}-${subscriptionPeriod}-${pblancNo}-${houseManageNo}`
      const visitors = stableNumber(seed, 18000, 120000)
      const alerts = stableNumber(`${seed}-alerts`, 120, 3400)

      return {
        id: `applyhome-${houseManageNo || 'hm'}-${pblancNo || pageIndex}-${index}`,
        title,
        address: [area, builder ? `${builder} 시공` : '', phone ? `문의 ${phone}` : ''].filter(Boolean).join(' · '),
        region: inferApplyHomeRegion(area),
        category: 'private' as const,
        source: '청약홈' as const,
        status: [houseType, supplyType].filter(Boolean).join(' ') || 'APT 분양',
        deadlineLabel: formatApplyHomeDeadline(subscriptionPeriod || winnerDate),
        visitors,
        alerts,
        isPopular: visitors >= 95000 || alerts >= 2500,
        url: `${applyHomeAptListUrl}?pageIndex=${pageIndex}`,
        updatedAt: noticeDate || new Date().toISOString().slice(0, 10),
      }
    })
    .filter((item): item is SubscriptionNotice => Boolean(item))

const fetchApplyHomePage = async (pageIndex: number) => {
  const url = pageIndex === 1 ? applyHomeAptListUrl : `${applyHomeAptListUrl}?pageIndex=${pageIndex}`
  const response = await fetchWithTimeout(url, 10000, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
    },
  })
  const html = await response.text()

  if (!response.ok) {
    throw new Error(`ApplyHome ${pageIndex} ${response.status}`)
  }

  return html
}

const fetchApplyHomePrivateNotices = async () => {
  const firstPageHtml = await fetchApplyHomePage(1)
  const totalPages = Math.min(getApplyHomeTotalPages(firstPageHtml), 40)
  const pageIndexes = Array.from({ length: totalPages }, (_, index) => index + 1)
  const pages: Array<{ pageIndex: number; html: string }> = [{ pageIndex: 1, html: firstPageHtml }]

  for (let index = 1; index < pageIndexes.length; index += 4) {
    const chunk = pageIndexes.slice(index, index + 4)
    const chunkPages = await Promise.all(
      chunk.map(async (pageIndex) => ({
        pageIndex,
        html: await fetchApplyHomePage(pageIndex),
      })),
    )
    pages.push(...chunkPages)
  }

  const deduped = new Map<string, SubscriptionNotice>()
  pages
    .sort((a, b) => a.pageIndex - b.pageIndex)
    .flatMap((page) => parseApplyHomePrivateRows(page.html, page.pageIndex))
    .forEach((item) => {
      if (!deduped.has(item.id)) deduped.set(item.id, item)
    })

  return Array.from(deduped.values())
}

const buildSubscriptionPayload = async () => {
  const now = Date.now()
  if (subscriptionCache && now - subscriptionCache.updatedAt < subscriptionCacheTtlMs) {
    return subscriptionCache.payload
  }

  const sources = [
    {
      name: '청약홈 APT분양정보',
      url: applyHomeAptListUrl,
    },
    {
      name: 'LH 청약플러스',
      url: 'https://apply.lh.or.kr/lhapply/main.do',
    },
    {
      name: 'SH 서울주택도시공사',
      url: 'https://www.i-sh.co.kr/main/lay2/program/S1T1C220/subMain2.do',
    },
  ]

  const [applyHomePrivateItems, sourceStatuses] = await Promise.all([
    fetchApplyHomePrivateNotices().catch(() => [] as SubscriptionNotice[]),
    Promise.all(
      sources.map(async (source) => {
        try {
          const sourceResponse = await fetchWithTimeout(source.url, 6000, {
            headers: {
              'user-agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
            },
          })
          return {
            ...source,
            ok: sourceResponse.ok,
            status: sourceResponse.status,
          }
        } catch {
          return {
            ...source,
            ok: false,
            status: 0,
          }
        }
      }),
    ),
  ])
  const fallbackPrivateItems = subscriptionFallbackItems.filter((item) => item.category === 'private')
  const nonPrivateItems = subscriptionFallbackItems.filter((item) => item.category !== 'private')
  const items = [...(applyHomePrivateItems.length ? applyHomePrivateItems : fallbackPrivateItems), ...nonPrivateItems]
  const payload = {
    ok: true,
    source: '청약홈 APT분양정보·LH 청약플러스·SH 서울주택도시공사',
    updatedAt: new Date().toISOString(),
    sourceStatuses,
    items,
  }

  subscriptionCache = { updatedAt: now, payload }
  return payload
}

const getFallbackReportNews = (region: string) =>
  fallbackReportNewsByRegion[normalizeReportRegion(region)] ?? [
    {
      title: `${normalizeReportRegion(region)} 정비사업과 분양 이슈를 주간 단위로 확인`,
      link: 'https://www.applyhome.co.kr/co/coa/selectMainView.do',
      source: '집직구 브리핑',
      publishedAt: new Date().toISOString(),
      keyword: normalizeReportRegion(region),
    },
    {
      title: `${normalizeReportRegion(region)} 교통·개발 뉴스가 거래에 미치는 영향 점검`,
      link: `https://news.google.com/search?q=${encodeURIComponent(`${normalizeReportRegion(region)} 아파트 개발`)}`,
      source: '집직구 브리핑',
      publishedAt: new Date().toISOString(),
      keyword: normalizeReportRegion(region),
    },
  ]

const fetchGoogleNewsItems = async (query: string): Promise<ReportNewsItem[]> => {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:14d`)}&hl=ko&gl=KR&ceid=KR:ko`
  const { apiResponse, raw } = await fetchTextWithRetry(rssUrl, 2)

  if (!apiResponse.ok || !raw) return []

  const parsed = parser.parse(raw) as {
    rss?: {
      channel?: {
        item?: Array<{
          title?: string
          link?: string
          pubDate?: string
          source?: string | { '#text'?: string }
        }> | {
          title?: string
          link?: string
          pubDate?: string
          source?: string | { '#text'?: string }
        }
      }
    }
  }
  const items = asArray(parsed.rss?.channel?.item)

  return items.slice(0, 4).map((item) => ({
    title: normalizeNewsTitle(textValue(item.title)),
    link: textValue(item.link),
    source: typeof item.source === 'string' ? item.source : textValue(item.source?.['#text']),
    publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    keyword: query.replace('안양 ', ''),
  }))
}

const filterReportNewsByRegion = (items: ReportNewsItem[], region: string) => {
  const keywords = reportNewsKeywordsByRegion[region] ?? buildGenericReportNewsKeywords(region)
  if (keywords.length === 0) return items

  return items.filter((item) => {
    const contentTarget = normalizeComparableName(`${item.title} ${item.source}`)
    const queryTarget = normalizeComparableName(item.keyword)
    const matchesRegion = keywords.some((keyword) => {
      const normalizedKeyword = normalizeComparableName(keyword)
      return contentTarget.includes(normalizedKeyword) || queryTarget.includes(normalizedKeyword)
    })
    const matchesTopic = reportNewsTopicKeywords.some((keyword) =>
      contentTarget.includes(normalizeComparableName(keyword)),
    )
    return matchesRegion && matchesTopic
  })
}

const buildReportNewsPayload = async (region: string) => {
  const normalizedRegion = normalizeReportRegion(region || '안양시 동안구')
  const cached = reportNewsCache.get(normalizedRegion)

  if (cached && Date.now() - cached.updatedAt < reportNewsCacheMs) {
    return cached.payload
  }

  const queries = reportNewsQueriesByRegion[normalizedRegion] ?? buildGenericReportNewsQueries(normalizedRegion)
  const fallbackReportNews = getFallbackReportNews(normalizedRegion)
  const results = await runInBatches(queries, 2, fetchGoogleNewsItems, 250)
  const regionMatchedItems = filterReportNewsByRegion(results.flat(), normalizedRegion)
  const dedupedItems = Array.from(
    new Map(
      regionMatchedItems
        .filter((item) => item.title && item.link)
        .map((item) => [normalizeComparableName(item.title), item]),
    ).values(),
  )
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime())
    .slice(0, 8)

  const payload = {
    ok: true,
    region: normalizedRegion,
    source: dedupedItems.length > 0 ? 'Google News RSS' : '집직구 기본 브리핑',
    updatedAt: new Date().toISOString(),
    items: dedupedItems.length > 0 ? dedupedItems : fallbackReportNews,
  }

  reportNewsCache.set(normalizedRegion, {
    updatedAt: Date.now(),
    payload,
  })

  return payload
}

const runInBatches = async <T, R>(
  items: T[],
  batchSize: number,
  handler: (item: T) => Promise<R>,
  delayMs = 0,
) => {
  const results: R[] = []

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize)
    results.push(...(await Promise.all(batch.map(handler))))
    if (delayMs > 0 && index + batchSize < items.length) {
      await sleep(delayMs)
    }
  }

  return results
}

const normalizeRtmsItem = (item: RtmsApiItem, district: TargetDistrict) => {
  const dealYear = textValue(item.dealYear)
  const dealMonth = twoDigits(item.dealMonth)
  const dealDay = twoDigits(item.dealDay)
  const legalDong = textValue(item.umdNm)
  const jibun = textValue(item.jibun)
  const tradeType = textValue(item.dealingGbn)
  const cancellationType = textValue(item.cdealType)
  const areaM2 = numberValue(item.excluUseAr)
  const marketPyeong = areaM2 ? Math.round(areaM2 / 3.3058 / 0.74) : 0

  return {
    id: `${district.code}-${textValue(item.aptSeq)}-${dealYear}${dealMonth}${dealDay}-${textValue(item.floor)}-${areaM2}`,
    aptSeq: textValue(item.aptSeq),
    aptName: textValue(item.aptNm),
    address: `${district.name} ${legalDong} ${jibun}`.replace(/\s+/g, ' ').trim(),
    legalDong,
    jibun,
    umdCd: textValue(item.umdCd),
    bonbun: textValue(item.bonbun),
    bubun: textValue(item.bubun),
    landCd: textValue(item.landCd),
    dealDate: `${dealYear}-${dealMonth}-${dealDay}`,
    priceEok: numberValue(item.dealAmount) / 10000,
    areaM2,
    pyeong: marketPyeong,
    floor: numberValue(item.floor),
    buildYear: numberValue(item.buildYear),
    tradeType: tradeType === '직거래' ? 'direct' : tradeType === '중개거래' ? 'brokered' : 'unknown',
    tradeTypeLabel: tradeType || '미공개',
    buyerType: textValue(item.buyerGbn) || '미공개',
    sellerType: textValue(item.slerGbn) || '미공개',
    agentRegion: textValue(item.estateAgentSggNm) || '미공개',
    status: cancellationType === 'O' ? 'cancelled' : 'active',
    cancelledAt: textValue(item.cdealDay),
    registeredAt: textValue(item.rgstDate),
    lawdCd: district.code,
    district: district.name,
    metro: district.metro,
  }
}

type NormalizedRtmsDeal = ReturnType<typeof normalizeRtmsItem>

const parseApiItems = <T extends Record<string, unknown>>(raw: string) => {
  if (!raw.trim()) {
    return {
      resultCode: 'EMPTY',
      resultMessage: 'Empty response',
      totalCount: 0,
      items: [] as T[],
    }
  }

  const parsed = raw.trim().startsWith('{')
    ? (JSON.parse(raw) as BuildingParsedResponse)
    : (parser.parse(raw) as BuildingParsedResponse)
  const response = parsed.response
  const body = response?.body

  return {
    resultCode: textValue(response?.header?.resultCode),
    resultMessage: textValue(response?.header?.resultMsg),
    totalCount: numberValue(body?.totalCount),
    items: asArray<T>(body?.items?.item as T | T[] | undefined),
  }
}

const pickRepresentativeTitleItem = (titleItems: BuildingApiItem[]) =>
  [...titleItems].sort((a, b) => {
    const score = (item: BuildingApiItem) => {
      const isMainBuilding = textValue(item.mainAtchGbCdNm).includes('주건축물') ? 10000 : 0
      const isApartment = textValue(item.mainPurpsCdNm).includes('공동주택') ? 5000 : 0
      const households = numberValue(item.hhldCnt) * 20
      const floors = numberValue(item.grndFlrCnt) * 10
      return isMainBuilding + isApartment + households + floors + numberValue(item.totArea)
    }

    return score(b) - score(a)
  })[0]

const sumField = (items: BuildingApiItem[], field: keyof BuildingApiItem) =>
  items.reduce((total, item) => total + numberValue(item[field]), 0)

const normalizeBuildingLedger = (
  titleItems: BuildingApiItem[],
  recapItem: BuildingApiItem | undefined,
  fallback: {
    aptName: string
    address: string
    buildYear: number
  },
) => {
  const titleItem = pickRepresentativeTitleItem(titleItems)
  const item = recapItem ?? titleItem ?? {}
  const detailItem = titleItem ?? recapItem ?? {}
  const parking =
    numberValue(item.totPkngCnt) ||
    sumField(titleItems, 'totPkngCnt') ||
    numberValue(item.indrMechUtcnt) +
      numberValue(item.indrAutoUtcnt) +
      numberValue(item.oudrMechUtcnt) +
      numberValue(item.oudrAutoUtcnt)
  const useApprovalDate = textValue(item.useAprDay)

  return {
    source: titleItem || recapItem ? '국토교통부 건축HUB 집합건축물대장정보' : '실거래가 기반 임시 요약',
    buildingName: textValue(item.bldNm) || fallback.aptName,
    address:
      textValue(item.platPlc) ||
      textValue(item.newPlatPlc) ||
      fallback.address,
    registerType: textValue(item.regstrGbCdNm) || '집합',
    registerKind: textValue(item.regstrKindCdNm) || (recapItem ? '총괄표제부' : '표제부'),
    mainUsage: textValue(item.mainPurpsCdNm) || '공동주택',
    structure: textValue(detailItem.strctCdNm) || '',
    roof: textValue(detailItem.roofCdNm) || '',
    householdCount: numberValue(item.hhldCnt) || sumField(titleItems, 'hhldCnt'),
    familyCount: numberValue(item.fmlyCnt) || sumField(titleItems, 'fmlyCnt'),
    parkingCount: parking,
    floorAreaRatio: numberValue(item.vlRat),
    buildingCoverageRatio: numberValue(item.bcRat),
    totalAreaM2: numberValue(item.totArea),
    groundFloors: numberValue(detailItem.grndFlrCnt),
    undergroundFloors: numberValue(detailItem.ugrndFlrCnt),
    approvalDate:
      useApprovalDate && useApprovalDate.length >= 8
        ? `${useApprovalDate.slice(0, 4)}-${useApprovalDate.slice(4, 6)}-${useApprovalDate.slice(6, 8)}`
        : fallback.buildYear
          ? `${fallback.buildYear}`
        : '',
  }
}

const fetchDistrictTrades = async (
  district: TargetDistrict,
  serviceKey: string,
  dealYmd: string,
  numOfRows: string,
) => {
  const fetchPage = async (pageNo: number) => {
    const params = new URLSearchParams({
      serviceKey,
      LAWD_CD: district.code,
      DEAL_YMD: dealYmd,
      numOfRows,
      pageNo: String(pageNo),
    })
    const { apiResponse, raw } = await fetchTextWithRetry(
      `https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev?${params.toString()}`,
    )

    if (!apiResponse.ok) {
      throw new Error(raw || apiResponse.statusText)
    }

    const parsed = parser.parse(raw) as RtmsParsedResponse
    const body = parsed.response?.body
    const rawItems = asArray<RtmsApiItem>(body?.items?.item)

    return {
      totalCount: numberValue(body?.totalCount),
      rawDeals: rawItems.map((item) => normalizeRtmsItem(item, district)),
    }
  }

  try {
    const firstPage = await fetchPage(1)
    const rowCount = Math.max(Number(numOfRows) || 1000, 1)
    const pageCount = Math.ceil(firstPage.totalCount / rowCount)
    const remainingPages =
      pageCount > 1
        ? await runInBatches(
            Array.from({ length: pageCount - 1 }, (_, index) => index + 2),
            3,
            (pageNo) => fetchPage(pageNo),
          )
        : []

    return {
      district,
      totalCount: firstPage.totalCount,
      rawDeals: [firstPage, ...remainingPages].flatMap((page) => page.rawDeals),
      error: '',
    }
  } catch (error) {
    return {
      district,
      totalCount: 0,
      rawDeals: [] as ReturnType<typeof normalizeRtmsItem>[],
      error: error instanceof Error ? error.message : 'RTMS API 호출 실패',
    }
  }
}

type RtmsQuery = {
  lawdCd: string
  scope: string
  dealYmd: string
  monthsBack: number
  numOfRows: string
  limit: number
}

type MapMarkerRefreshOptions = {
  maxDistricts?: number
  force?: boolean
}

const getDefaultDealYmd = () => {
  const date = new Date()
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
}

const getRecentDealYmds = (baseYmd: string, count: number) => {
  const year = Number(baseYmd.slice(0, 4))
  const month = Number(baseYmd.slice(4, 6)) - 1
  const baseDate = new Date(year, month, 1)

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(baseDate)
    date.setMonth(baseDate.getMonth() - index)
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
  })
}

const latestDealYmdCache = new Map<string, string>()

const findLatestAvailableDealYmd = async (startYmd: string, serviceKey: string) => {
  const cacheKey = startYmd
  const cached = latestDealYmdCache.get(cacheKey)
  if (cached) return cached

  const probeDistricts = ['41173', '41171', '41290', '41430', '11680']
    .map((code) => capitalAreaDistricts.find((district) => district.code === code))
    .filter((district): district is TargetDistrict => Boolean(district))
  const probeMonths = getRecentDealYmds(startYmd, 24)

  for (const dealYmd of probeMonths) {
    for (const probeDistrict of probeDistricts) {
      const result = await fetchDistrictTrades(probeDistrict, serviceKey, dealYmd, '1')
      if (!result.error && result.totalCount > 0) {
        latestDealYmdCache.set(cacheKey, dealYmd)
        return dealYmd
      }
      await sleep(120)
    }
  }

  latestDealYmdCache.set(cacheKey, '202504')
  return '202504'
}

const getMsUntilNextDailyRefresh = (hour: number) => {
  const now = new Date()
  const nextRefresh = new Date(now)
  nextRefresh.setHours(hour, 0, 0, 0)

  if (nextRefresh <= now) {
    nextRefresh.setDate(nextRefresh.getDate() + 1)
  }

  return nextRefresh.getTime() - now.getTime()
}

const rtmsCacheKey = (query: RtmsQuery) =>
  [query.lawdCd || 'all', query.scope, query.dealYmd, query.monthsBack, query.numOfRows, query.limit].join(':')

const safeCacheFilename = (value: string) => createHash('sha1').update(value).digest('hex')

const rtmsCacheFilePath = (cacheKey: string) => {
  const readablePrefix = cacheKey
    .split(':')
    .slice(0, 3)
    .join('_')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 42)
  const cacheHash = createHash('sha1').update(cacheKey).digest('hex')

  return path.join(rtmsCacheDirectory, `${readablePrefix}_${cacheHash}.json`)
}

const readRtmsCacheFile = async (cacheKey: string) => {
  try {
    return await fs.readFile(rtmsCacheFilePath(cacheKey), 'utf8')
  } catch {
    return ''
  }
}

const writeRtmsCacheFile = async (cacheKey: string, payload: string) => {
  await fs.mkdir(rtmsCacheDirectory, { recursive: true })
  await fs.writeFile(rtmsCacheFilePath(cacheKey), payload, 'utf8')
}

const publicCacheHeader = (maxAge: number, staleWhileRevalidate = maxAge * 6) =>
  `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`

const createDefaultCapitalQuery = (): RtmsQuery => ({
  lawdCd: '',
  scope: 'capital',
  dealYmd: 'auto',
  monthsBack: rtmsDefaultCapitalMonthsBack,
  numOfRows: '1000',
  limit: 50000,
})

const createDefaultMapQuery = (): RtmsQuery => ({
  lawdCd: '',
  scope: 'capital',
  dealYmd: 'auto',
  monthsBack: rtmsMapMarkerMonthsBack,
  numOfRows: '1000',
  limit: rtmsMapMarkerLimit,
})

const createDistrictMapQuery = (lawdCd: string): RtmsQuery => ({
  lawdCd,
  scope: 'capital',
  dealYmd: 'auto',
  monthsBack: rtmsMapMarkerMonthsBack,
  numOfRows: '1000',
  limit: rtmsMapMarkerDistrictLimit,
})

type GeocodeCacheEntry = {
  provider: 'kakao'
  address: string
  lat: number
  lng: number
  updatedAt: string
}

type MapMarkerDistrictCachePayload = {
  meta: Record<string, unknown>
  markers: Array<{
    id: string
    aptName: string
    address: string
    lawdCd?: string
    dealDate?: string
    lat: number
    lng: number
    relatedDeals?: NormalizedRtmsDeal[]
  }>
  rawDeals?: NormalizedRtmsDeal[]
}

const normalizeAddressKey = (address: string) => address.replace(/\s+/g, ' ').trim()
const geocodeCacheFilePath = (address: string) =>
  path.join(rtmsCacheDirectory, 'geocodes', `${safeCacheFilename(normalizeAddressKey(address))}.json`)
const mapMarkerDistrictCacheFilePath = (lawdCd: string) =>
  path.join(rtmsCacheDirectory, 'map-markers', `${lawdCd}.json`)

const readGeocodeCache = async (address: string) => {
  try {
    const raw = await fs.readFile(geocodeCacheFilePath(address), 'utf8')
    const payload = JSON.parse(raw) as GeocodeCacheEntry
    return Number.isFinite(payload.lat) && Number.isFinite(payload.lng) ? payload : null
  } catch {
    return null
  }
}

const writeGeocodeCache = async (address: string, payload: GeocodeCacheEntry) => {
  await fs.mkdir(path.dirname(geocodeCacheFilePath(address)), { recursive: true })
  await fs.writeFile(geocodeCacheFilePath(address), JSON.stringify(payload), 'utf8')
}

const readMapMarkerDistrictCache = async (lawdCd: string) => {
  try {
    const raw = await fs.readFile(mapMarkerDistrictCacheFilePath(lawdCd), 'utf8')
    return JSON.parse(raw) as MapMarkerDistrictCachePayload
  } catch {
    return null
  }
}

const isMapMarkerDistrictCacheComplete = (payload: Awaited<ReturnType<typeof readMapMarkerDistrictCache>>) =>
  textValue(payload?.meta?.resultCode as string | number | undefined) === '000'

const writeMapMarkerDistrictCache = async (lawdCd: string, payload: unknown) => {
  await fs.mkdir(path.dirname(mapMarkerDistrictCacheFilePath(lawdCd)), { recursive: true })
  await fs.writeFile(mapMarkerDistrictCacheFilePath(lawdCd), JSON.stringify(payload), 'utf8')
}

const geocodeAddressWithKakao = async (address: string, restApiKey: string) => {
  const normalizedAddress = normalizeAddressKey(address)
  const cached = await readGeocodeCache(normalizedAddress)
  if (cached) return cached
  if (!restApiKey || !normalizedAddress) return null

  try {
    const response = await fetchWithTimeout(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(normalizedAddress)}`,
      7000,
      {
        headers: {
          Authorization: `KakaoAK ${restApiKey}`,
        },
      },
    )

    if (!response.ok) return null

    const payload = (await response.json()) as {
      documents?: Array<{
        x?: string
        y?: string
      }>
    }
    const [document] = payload.documents ?? []
    const lng = Number(document?.x)
    const lat = Number(document?.y)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

    const entry: GeocodeCacheEntry = {
      provider: 'kakao',
      address: normalizedAddress,
      lat,
      lng,
      updatedAt: new Date().toISOString(),
    }
    await writeGeocodeCache(normalizedAddress, entry)
    return entry
  } catch {
    return null
  }
}

type KakaoAddressSuggestion = {
  id: string
  label: string
  address: string
  roadAddress?: string
  jibunAddress?: string
  lat: number
  lng: number
  source: 'address' | 'keyword'
}

const searchKakaoAddressSuggestions = async (query: string, restApiKey: string): Promise<KakaoAddressSuggestion[]> => {
  const normalizedQuery = normalizeAddressKey(query)
  if (!normalizedQuery || !restApiKey) return []

  const headers = { Authorization: `KakaoAK ${restApiKey}` }
  const suggestions = new Map<string, KakaoAddressSuggestion>()

  const appendSuggestion = (suggestion: Omit<KakaoAddressSuggestion, 'id'> & { id?: string }) => {
    if (!Number.isFinite(suggestion.lat) || !Number.isFinite(suggestion.lng)) return
    const address = normalizeAddressKey(suggestion.address || suggestion.roadAddress || suggestion.jibunAddress || '')
    if (!address) return
    const key = normalizeComparableName(`${suggestion.label}-${address}`)
    if (!key || suggestions.has(key)) return

    suggestions.set(key, {
      ...suggestion,
      id: suggestion.id || key,
      address,
    })
  }

  try {
    const addressResponse = await fetchWithTimeout(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(normalizedQuery)}&size=7`,
      7000,
      { headers },
    )

    if (addressResponse.ok) {
      const payload = (await addressResponse.json()) as {
        documents?: Array<{
          address_name?: string
          x?: string
          y?: string
          road_address?: {
            address_name?: string
            building_name?: string
          } | null
          address?: {
            address_name?: string
          } | null
        }>
      }

      ;(payload.documents ?? []).forEach((document, index) => {
        const roadAddress = normalizeAddressKey(document.road_address?.address_name || '')
        const jibunAddress = normalizeAddressKey(document.address?.address_name || document.address_name || '')
        const address = roadAddress || jibunAddress || normalizeAddressKey(document.address_name || '')
        const buildingName = normalizeAddressKey(document.road_address?.building_name || '')
        const label = buildingName || address

        appendSuggestion({
          id: `address-${index}-${normalizeComparableName(address)}`,
          label,
          address,
          roadAddress,
          jibunAddress,
          lat: Number(document.y),
          lng: Number(document.x),
          source: 'address',
        })
      })
    }
  } catch {
    // Keyword search below can still return useful results.
  }

  try {
    const keywordResponse = await fetchWithTimeout(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(normalizedQuery)}&size=7`,
      7000,
      { headers },
    )

    if (keywordResponse.ok) {
      const payload = (await keywordResponse.json()) as {
        documents?: Array<{
          id?: string
          place_name?: string
          road_address_name?: string
          address_name?: string
          x?: string
          y?: string
        }>
      }

      ;(payload.documents ?? []).forEach((document, index) => {
        const roadAddress = normalizeAddressKey(document.road_address_name || '')
        const jibunAddress = normalizeAddressKey(document.address_name || '')
        const address = roadAddress || jibunAddress
        const label = normalizeAddressKey(document.place_name || address)

        appendSuggestion({
          id: `keyword-${document.id || index}`,
          label,
          address,
          roadAddress,
          jibunAddress,
          lat: Number(document.y),
          lng: Number(document.x),
          source: 'keyword',
        })
      })
    }
  } catch {
    // Empty suggestions are handled in the UI.
  }

  return Array.from(suggestions.values()).slice(0, 8)
}

const formatMarkerDealMonth = (date?: string) => {
  if (!date) return ''
  const [year, month] = date.split('-')
  return year && month ? `${year.slice(2)}.${month.padStart(2, '0')}` : ''
}

const groupRtmsDealsForMap = (deals: NormalizedRtmsDeal[]) =>
  Array.from(
    deals
      .filter((deal) => deal.status === 'active' && deal.address && deal.aptName)
      .reduce((group, deal) => {
        const key = deal.aptSeq || `${deal.lawdCd}-${deal.legalDong}-${deal.aptName}-${deal.jibun}`
        group.set(key, [...(group.get(key) ?? []), deal])
        return group
      }, new Map<string, NormalizedRtmsDeal[]>())
      .entries(),
  )
    .map(([id, relatedDeals]) => {
      const history = relatedDeals
        .sort((a, b) => b.dealDate.localeCompare(a.dealDate) || b.priceEok - a.priceEok)
        .filter(
          (deal, index, list) =>
            index ===
            list.findIndex(
              (candidate) =>
                candidate.id === deal.id ||
                `${candidate.dealDate}-${candidate.priceEok}-${candidate.areaM2}-${candidate.floor}` ===
                  `${deal.dealDate}-${deal.priceEok}-${deal.areaM2}-${deal.floor}`,
            ),
        )
      const latestDeal = history[0]

      return {
        id,
        latestDeal,
        history,
        hasDirectDeal: history.some((deal) => deal.tradeType === 'direct'),
      }
    })
    .filter((group) => Boolean(group.latestDeal))
    .sort((a, b) => b.latestDeal.dealDate.localeCompare(a.latestDeal.dealDate) || b.latestDeal.priceEok - a.latestDeal.priceEok)

type RtmsMapDealGroup = ReturnType<typeof groupRtmsDealsForMap>[number]

const pickMapMarkerGroups = (groups: RtmsMapDealGroup[], limit: number, balancedByDistrict: boolean) => {
  if (!balancedByDistrict) return groups.slice(0, limit)

  const byDistrict = groups.reduce((bucket, group) => {
    const districtKey = group.latestDeal.lawdCd
    bucket.set(districtKey, [...(bucket.get(districtKey) ?? []), group])
    return bucket
  }, new Map<string, RtmsMapDealGroup[]>())
  const districts = [...byDistrict.keys()].sort()
  const selected: RtmsMapDealGroup[] = []

  for (let index = 0; selected.length < limit; index += 1) {
    let pickedInRound = false

    for (const district of districts) {
      const group = byDistrict.get(district)?.[index]
      if (group) {
        selected.push(group)
        pickedInRound = true
      }

      if (selected.length >= limit) break
    }

    if (!pickedInRound) break
  }

  return selected.sort((a, b) => b.latestDeal.dealDate.localeCompare(a.latestDeal.dealDate) || b.latestDeal.priceEok - a.latestDeal.priceEok)
}

const mapRefreshPriorityLawdCds = [
  '41173',
  '41290',
  '41430',
  '11680',
  '11650',
  '11710',
  '41135',
  '11170',
  '11440',
  '41465',
  '41390',
]

const orderMapRefreshDistricts = (districts: TargetDistrict[]) =>
  [...districts].sort((a, b) => {
    const priorityA = mapRefreshPriorityLawdCds.indexOf(a.code)
    const priorityB = mapRefreshPriorityLawdCds.indexOf(b.code)
    const normalizedA = priorityA === -1 ? 999 : priorityA
    const normalizedB = priorityB === -1 ? 999 : priorityB

    return normalizedA - normalizedB || a.code.localeCompare(b.code)
  })

const dedupeNormalizedDeals = (deals: NormalizedRtmsDeal[]) =>
  deals
    .filter((deal) => deal.status === 'active')
    .sort((a, b) => b.dealDate.localeCompare(a.dealDate) || b.priceEok - a.priceEok)
    .filter(
      (deal, index, list) =>
        index ===
        list.findIndex(
          (candidate) =>
            candidate.id === deal.id ||
            `${candidate.lawdCd}-${candidate.aptSeq}-${candidate.dealDate}-${candidate.priceEok}-${candidate.areaM2}-${candidate.floor}` ===
              `${deal.lawdCd}-${deal.aptSeq}-${deal.dealDate}-${deal.priceEok}-${deal.areaM2}-${deal.floor}`,
        ),
    )

const readSearchedDealYmds = (payload: MapMarkerDistrictCachePayload | null) =>
  Array.isArray(payload?.meta?.searchedDealYmds)
    ? (payload.meta.searchedDealYmds as unknown[]).map(String).filter(Boolean)
    : []

const trimMapMarkerForList = <T extends { relatedDeals?: NormalizedRtmsDeal[]; nearbyDeals?: NormalizedRtmsDeal[] }>(
  marker: T,
) => ({
  ...marker,
  relatedDeals: marker.relatedDeals?.slice(0, 12) ?? [],
  nearbyDeals: marker.nearbyDeals?.slice(0, 12) ?? [],
})

const buildRtmsMapMarkerPayload = async ({
  serializedPayload,
  query,
  kakaoRestApiKey,
  limit,
  geocodeLimit,
}: {
  serializedPayload: string
  query: RtmsQuery
  kakaoRestApiKey: string
  limit: number
  geocodeLimit: number
}) => {
  const rtmsPayload = JSON.parse(serializedPayload) as {
    meta: Record<string, unknown>
    deals: NormalizedRtmsDeal[]
  }
  const group = targetGroups[query.scope] ?? targetGroups.capital
  const scopedDeals = rtmsPayload.deals.filter((deal) => matchesTargetGroup(group, deal.lawdCd, deal.legalDong))
  const allGroupedDeals = groupRtmsDealsForMap(scopedDeals)
  const groupedDeals = pickMapMarkerGroups(allGroupedDeals, limit, !query.lawdCd && query.scope === 'capital')
  const coordinateByGroupId = new Map<string, GeocodeCacheEntry>()
  const missingGroups: typeof groupedDeals = []

  await Promise.all(
    groupedDeals.map(async (group) => {
      const cached = await readGeocodeCache(group.latestDeal.address)
      if (cached) {
        coordinateByGroupId.set(group.id, cached)
      } else {
        missingGroups.push(group)
      }
    }),
  )

  if (kakaoRestApiKey && geocodeLimit > 0 && missingGroups.length > 0) {
    const geocodedGroups = await runInBatches(
      missingGroups.slice(0, geocodeLimit),
      5,
      async (group) => ({
        id: group.id,
        coordinate: await geocodeAddressWithKakao(group.latestDeal.address, kakaoRestApiKey),
      }),
      120,
    )

    geocodedGroups.forEach(({ id, coordinate }) => {
      if (coordinate) coordinateByGroupId.set(id, coordinate)
    })
  }

  const nearbyDealsByDong = scopedDeals.reduce((group, deal) => {
    const key = `${deal.lawdCd}-${deal.legalDong}`
    group.set(key, [...(group.get(key) ?? []), deal])
    return group
  }, new Map<string, NormalizedRtmsDeal[]>())

  const markers = groupedDeals
    .map((group) => {
      const coordinate = coordinateByGroupId.get(group.id)
      if (!coordinate) return null

      const latestDeal = group.latestDeal
      const nearbyKey = `${latestDeal.lawdCd}-${latestDeal.legalDong}`
      const nearbyDeals = (nearbyDealsByDong.get(nearbyKey) ?? [])
        .filter((deal) => deal.aptSeq !== latestDeal.aptSeq)
        .slice(0, 24)

      return {
        id: group.id,
        label: group.hasDirectDeal ? '직거래' : '매매',
        aptName: latestDeal.aptName,
        address: latestDeal.address,
        lawdCd: latestDeal.lawdCd,
        aptSeq: latestDeal.aptSeq,
        dealDate: latestDeal.dealDate,
        tradeTypeLabel: `최근 거래 · ${group.history.length}건`,
        priceEok: latestDeal.priceEok,
        hasPrice: true,
        dateLabel: formatMarkerDealMonth(latestDeal.dealDate),
        subLabel: `${latestDeal.pyeong}평`,
        lat: coordinate.lat,
        lng: coordinate.lng,
        tone: group.hasDirectDeal ? 'direct' : 'sale',
        dealCount: group.history.length,
        relatedDeals: group.history.slice(0, 36),
        nearbyDeals,
      }
    })
    .filter(Boolean)

  return {
    meta: {
      ...rtmsPayload.meta,
      source: '국토교통부 RTMS 아파트 매매 실거래가 상세 자료 + Kakao 주소 좌표 캐시',
      lawdCd: query.lawdCd || '',
      scope: query.scope,
      district: query.lawdCd ? districtNameByLawdCd[query.lawdCd] || query.lawdCd : group.label,
      resultCode: markers.length ? (missingGroups.length ? 'PARTIAL' : '000') : 'REFRESHING',
      resultMessage: kakaoRestApiKey
        ? '좌표 캐시가 있는 단지를 지도 마커로 반환했습니다.'
        : 'KAKAO_REST_API_KEY가 없어 신규 주소 좌표 변환을 할 수 없습니다.',
      markerCount: markers.length,
      candidateMarkerCount: groupedDeals.length,
      totalCandidateMarkerCount: allGroupedDeals.length,
      missingCoordinateCount: groupedDeals.length - markers.length,
      geocodedThisRequest: Math.max(0, coordinateByGroupId.size - (groupedDeals.length - missingGroups.length)),
      needsKakaoRestApiKey: !kakaoRestApiKey,
      mapMonthsBack: query.monthsBack,
      cachePolicy: `daily-${String(rtmsDailyRefreshHour).padStart(2, '0')}:00`,
      updatedAt: new Date().toISOString(),
    },
    markers,
  }
}

const buildIncrementalDistrictMapMarkerPayload = async ({
  district,
  serviceKey,
  kakaoRestApiKey,
  force,
}: {
  district: TargetDistrict
  serviceKey: string
  kakaoRestApiKey: string
  force?: boolean
}) => {
  const query = createDistrictMapQuery(district.code)
  const existingPayload = force ? null : await readMapMarkerDistrictCache(district.code)
  const baseDealYmd = query.dealYmd === 'auto' ? getDefaultDealYmd() : query.dealYmd
  const dealYmds = getRecentDealYmds(baseDealYmd, query.monthsBack)
  const searchedDealYmds = new Set(force ? [] : readSearchedDealYmds(existingPayload))
  const nextDealYmds = dealYmds
    .filter((dealYmd) => !searchedDealYmds.has(dealYmd))
    .slice(0, rtmsMapMarkerMonthBatchSize)
  const monthResults = await runInBatches(
    nextDealYmds,
    1,
    (dealYmd) => fetchDistrictTrades(district, serviceKey, dealYmd, query.numOfRows),
    120,
  )
  const mergedDeals = dedupeNormalizedDeals([
    ...((force ? [] : existingPayload?.rawDeals) ?? []),
    ...monthResults.flatMap((result) => result.rawDeals),
  ]).slice(0, query.limit)
  const searchedAfter = new Set([...searchedDealYmds, ...nextDealYmds])
  const serializedPayload = JSON.stringify({
    meta: {
      source: '국토교통부 RTMS 아파트 매매 실거래가 상세 자료',
      lawdCd: query.lawdCd,
      scope: query.scope,
      district: district.name,
      dealYmd: baseDealYmd,
      fromDealYmd: dealYmds[dealYmds.length - 1],
      toDealYmd: dealYmds[0],
      monthsBack: query.monthsBack,
      rawCount: mergedDeals.length,
      returnedCount: mergedDeals.length,
      cachePolicy: `daily-${String(rtmsDailyRefreshHour).padStart(2, '0')}:00`,
      updatedAt: new Date().toISOString(),
    },
    deals: mergedDeals,
  })
  const markerPayload = await buildRtmsMapMarkerPayload({
    serializedPayload,
    query,
    kakaoRestApiKey,
    limit: rtmsMapMarkerDistrictLimit,
    geocodeLimit: rtmsMapMarkerGeocodeBatchLimit,
  })
  const allMonthsScanned = searchedAfter.size >= dealYmds.length
  const resultCode =
    allMonthsScanned && markerPayload.meta.missingCoordinateCount === 0 ? '000' : 'PARTIAL'

  return {
    ...markerPayload,
    meta: {
      ...markerPayload.meta,
      resultCode,
      resultMessage:
        resultCode === '000'
          ? '구/시군구별 지도 마커 캐시 생성 완료'
          : '구/시군구별 지도 마커 캐시를 월 단위로 누적 생성중입니다.',
      districtCode: district.code,
      districtName: district.name,
      cacheKind: 'district-map-markers',
      searchedDealYmds: [...searchedAfter],
      monthProgress: {
        searched: searchedAfter.size,
        total: dealYmds.length,
        lastBatch: nextDealYmds,
      },
      rawDealCount: mergedDeals.length,
      refreshedAt: new Date().toISOString(),
    },
    rawDeals: mergedDeals,
  }
}

const readAggregatedMapMarkerCache = async (query: RtmsQuery, limit: number) => {
  const group = targetGroups[query.scope] ?? targetGroups.capital
  const districts = query.lawdCd
    ? capitalAreaDistricts.filter((district) => district.code === query.lawdCd)
    : group.districts
  const cacheFiles = await Promise.all(districts.map((district) => readMapMarkerDistrictCache(district.code)))
  const markers = cacheFiles
    .flatMap((payload) => payload?.markers ?? [])
    .filter((marker) => {
      const [latestDeal] = marker.relatedDeals ?? []
      const lawdCd = latestDeal?.lawdCd || marker.lawdCd || ''
      const legalDong = latestDeal?.legalDong || ''
      return lawdCd ? matchesTargetGroup(group, lawdCd, legalDong) : true
    })
    .filter((marker) => Number.isFinite(marker.lat) && Number.isFinite(marker.lng))
    .sort((a, b) => String(b.dealDate ?? '').localeCompare(String(a.dealDate ?? '')))
    .slice(0, limit)
    .map(trimMapMarkerForList)
  const refreshedDistricts = cacheFiles.filter(Boolean).length

  return {
    refreshedDistricts,
    searchedDistricts: districts.length,
    markers,
  }
}

const filterRtmsPayloadFromCapitalCache = (serializedPayload: string, query: RtmsQuery) => {
  const payload = JSON.parse(serializedPayload) as {
    meta: Record<string, unknown>
    deals: Array<ReturnType<typeof normalizeRtmsItem>>
  }
  const group = targetGroups[query.scope] ?? targetGroups.capital
  const districtCodes = new Set(group.districts.map((district) => district.code))
  const deals = payload.deals
    .filter((deal) => {
      if (query.lawdCd) return deal.lawdCd === query.lawdCd
      return districtCodes.has(deal.lawdCd) && matchesTargetGroup(group, deal.lawdCd, deal.legalDong)
    })
    .slice(0, query.limit)

  return JSON.stringify({
    meta: {
      ...payload.meta,
      lawdCd: query.lawdCd || '',
      scope: query.scope,
      district: query.lawdCd ? districtNameByLawdCd[query.lawdCd] || query.lawdCd : group.label,
      returnedCount: deals.length,
      filteredCount: deals.length,
      directCount: deals.filter((deal) => deal.tradeType === 'direct').length,
      cacheDerivedFrom: 'capital',
    },
    deals,
  })
}

const buildRtmsPayload = async (query: RtmsQuery, serviceKey: string) => {
  const group = targetGroups[query.scope] ?? targetGroups.capital
  const resolvedDealYmd = query.dealYmd === 'auto' ? await findLatestAvailableDealYmd(getDefaultDealYmd(), serviceKey) : query.dealYmd
  const dealYmds = getRecentDealYmds(resolvedDealYmd, query.monthsBack)
  const districts = query.lawdCd
    ? [
        capitalAreaDistricts.find((district) => district.code === query.lawdCd) ?? {
          code: query.lawdCd,
          name: districtNameByLawdCd[query.lawdCd] || query.lawdCd,
          metro: 'seoul' as Metro,
        },
      ]
    : group.districts
  const fetchTargets = districts.flatMap((district) =>
    dealYmds.map((dealYmd) => ({
      district,
      dealYmd,
    })),
  )
  const isWideCapitalQuery = !query.lawdCd && query.scope === 'capital'
  const districtResults = await runInBatches(fetchTargets, isWideCapitalQuery ? 6 : 3, ({ district, dealYmd }) =>
    fetchDistrictTrades(district, serviceKey, dealYmd, query.numOfRows), isWideCapitalQuery ? 80 : 120,
  )
  const rawDeals = districtResults.flatMap((result) => result.rawDeals)
  const failedResults = districtResults.filter((result) => result.error)

  if (rawDeals.length === 0 && failedResults.length === districtResults.length) {
    const sampleError = failedResults[0]?.error || '공공데이터포털 호출 실패'
    throw new Error(`RTMS 수집 실패: ${sampleError.slice(0, 180)}`)
  }

  const activeDeals = rawDeals.filter(
    (deal) => deal.status === 'active' && matchesTargetGroup(group, deal.lawdCd, deal.legalDong),
  )
  const deals = activeDeals
    .sort((a, b) => b.dealDate.localeCompare(a.dealDate) || b.priceEok - a.priceEok)
    .slice(0, query.limit)

  return {
    meta: {
      source: '국토교통부 RTMS 아파트 매매 실거래가 상세 자료',
      lawdCd: query.lawdCd || '',
      scope: query.scope,
      district: query.lawdCd ? districts[0].name : group.label,
      dealYmd: resolvedDealYmd,
      fromDealYmd: dealYmds[dealYmds.length - 1],
      toDealYmd: dealYmds[0],
      monthsBack: query.monthsBack,
      resultCode: '000',
      resultMessage: 'OK',
      totalCount: districtResults.reduce((sum, result) => sum + result.totalCount, 0),
      rawCount: rawDeals.length,
      filteredCount: activeDeals.length,
      returnedCount: deals.length,
      canceledCount: rawDeals.filter((deal) => deal.status === 'cancelled').length,
      directCount: activeDeals.filter((deal) => deal.tradeType === 'direct').length,
      searchedDistricts: districts.length,
      searchedMonths: dealYmds.length,
      failedDistricts: failedResults.length,
      cachePolicy: `daily-${String(rtmsDailyRefreshHour).padStart(2, '0')}:00`,
      updatedAt: new Date().toISOString(),
    },
    deals,
  }
}

const findLatestApartmentDeal = async ({
  lawdCd,
  aptName,
  aptSeq,
  monthsBack,
  serviceKey,
}: {
  lawdCd: string
  aptName: string
  aptSeq: string
  monthsBack: number
  serviceKey: string
}) => {
  const district = capitalAreaDistricts.find((item) => item.code === lawdCd)
  if (!district || !aptName.trim()) return null

  const resolvedDealYmd = await findLatestAvailableDealYmd(getDefaultDealYmd(), serviceKey)
  const dealYmds = getRecentDealYmds(resolvedDealYmd, monthsBack)
  const normalizedTargetName = normalizeComparableName(aptName)
  if (!normalizedTargetName) return null
  const scanStartedAt = Date.now()
  const maxScanMs = 22_000

  for (const dealYmd of dealYmds) {
    if (Date.now() - scanStartedAt > maxScanMs) {
      break
    }

    const result = await fetchDistrictTrades(district, serviceKey, dealYmd, '1000')
    const matches = result.rawDeals
      .filter((deal) => deal.status === 'active')
      .filter((deal) => {
        if (aptSeq && deal.aptSeq === aptSeq) return true

        const dealName = normalizeComparableName(deal.aptName)
        return (
          dealName === normalizedTargetName ||
          dealName.includes(normalizedTargetName) ||
          normalizedTargetName.includes(dealName)
        )
      })
      .sort((a, b) => b.dealDate.localeCompare(a.dealDate) || b.priceEok - a.priceEok)

    if (matches[0]) {
      return {
        deal: matches[0],
        searchedMonths: dealYmds.indexOf(dealYmd) + 1,
        resolvedDealYmd,
      }
    }

    await sleep(140)
  }

  return {
    deal: null,
    searchedMonths: dealYmds.length,
    resolvedDealYmd,
  }
}

type TelegramLead = {
  type?: string
  payload?: Record<string, unknown>
}

const readRequestBody = (request: NodeJS.ReadableStream) =>
  new Promise<string>((resolve, reject) => {
    let body = ''

    request.on('data', (chunk) => {
      body += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk)
    })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })

const sanitizeListingString = (value: unknown, maxLength = 120) =>
  String(value ?? '')
    .trim()
    .slice(0, maxLength)

const sanitizeListingNumber = (value: unknown, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const sanitizeStoredListing = (value: unknown): StoredUserListing | null => {
  if (!value || typeof value !== 'object') return null

  const listing = value as Partial<StoredUserListing>
  const aptName = sanitizeListingString(listing.aptName, 80)
  const address = sanitizeListingString(listing.address, 160)
  if (!aptName || !address) return null

  const photos = Array.isArray(listing.photos)
    ? listing.photos
        .map((photo, index) => ({
          id: sanitizeListingString(photo?.id, 60) || `photo-${index}`,
          name: sanitizeListingString(photo?.name, 80) || `photo-${index + 1}`,
          dataUrl: sanitizeListingString(photo?.dataUrl, 600_000),
        }))
        .filter((photo) => photo.dataUrl.startsWith('data:image/'))
        .slice(0, 5)
    : []

  const createdAt = sanitizeListingString(listing.createdAt, 40)
  const verificationStatus = listing.verificationStatus === 'verified' ? 'verified' : 'owner-checking'

  return {
    id: sanitizeListingString(listing.id, 80) || `${Date.now()}`,
    intent: listing.intent === 'want' ? 'want' : 'sell',
    aptName,
    address,
    detailAddress: sanitizeListingString(listing.detailAddress, 80),
    buildingDong: sanitizeListingString(listing.buildingDong, 20),
    unitHo: sanitizeListingString(listing.unitHo, 20),
    priceEok: Math.max(0, sanitizeListingNumber(listing.priceEok)),
    pyeong: Math.max(0, sanitizeListingNumber(listing.pyeong)),
    floor: sanitizeListingNumber(listing.floor),
    ownerName: sanitizeListingString(listing.ownerName, 40),
    ownerPhone: sanitizeListingString(listing.ownerPhone, 40),
    memo: sanitizeListingString(listing.memo, 500),
    photos,
    verificationStatus,
    createdAt: createdAt || new Date().toISOString(),
  }
}

const readStoredListings = async () => {
  try {
    const rawPayload = await fs.readFile(listingCacheFilePath, 'utf8')
    const parsedPayload = JSON.parse(rawPayload) as unknown
    const rawListings = Array.isArray(parsedPayload) ? parsedPayload : []
    return rawListings.map(sanitizeStoredListing).filter((listing): listing is StoredUserListing => Boolean(listing))
  } catch {
    return []
  }
}

const writeStoredListings = async (listings: StoredUserListing[]) => {
  await fs.mkdir(path.dirname(listingCacheFilePath), { recursive: true })
  await fs.writeFile(listingCacheFilePath, JSON.stringify(listings.slice(0, 300), null, 2), 'utf8')
}

const telegramLeadTitleByType: Record<string, string> = {
  listing: '직거래 매물 등록',
  appraisal: '상속증여 탁상감정 신청',
  signup: '회원가입/알림 신청',
  review: '리뷰 작성',
  weekly_report: '우리동네 주간 리포트 신청',
}

const stringifyLeadValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return ''
  if (Array.isArray(value)) return value.map(stringifyLeadValue).filter(Boolean).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const formatTelegramLeadMessage = (lead: TelegramLead) => {
  const type = lead.type || 'lead'
  const title = telegramLeadTitleByType[type] ?? '새 문의'
  const payload = lead.payload ?? {}
  const createdAt = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  const lines = [`[집직구] ${title}`, `접수시각: ${createdAt}`]

  Object.entries(payload).forEach(([key, value]) => {
    const text = stringifyLeadValue(value)
    if (text) {
      lines.push(`${key}: ${text}`)
    }
  })

  return lines.join('\n').slice(0, 3900)
}

const getMissingTelegramKeys = (env: Record<string, string | undefined>) =>
  ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'].filter((key) => !env[key])

const sendTelegramMessage = async (env: Record<string, string | undefined>, text: string) => {
  const missingKeys = getMissingTelegramKeys(env)
  if (missingKeys.length > 0) {
    return {
      ok: false,
      configured: false,
      missingKeys,
      message: `${missingKeys.join(', ')}가 설정되지 않았습니다.`,
    }
  }

  const telegramResponse = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      disable_web_page_preview: true,
    }),
  })

  if (!telegramResponse.ok) {
    const telegramRaw = await telegramResponse.text()
    return {
      ok: false,
      configured: true,
      error: telegramRaw || telegramResponse.statusText,
    }
  }

  return { ok: true, configured: true }
}

type RtmsMiddlewareServer =
  | Pick<ViteDevServer, 'middlewares' | 'httpServer'>
  | Pick<PreviewServer, 'middlewares' | 'httpServer'>

const configureRtmsProxyServer = (server: RtmsMiddlewareServer) => {
    const rtmsCache = new Map<string, string>()
    const rtmsQueries = new Map<string, RtmsQuery>()
    const inflightPayloads = new Map<string, Promise<string>>()
    let dailyRefreshTimer: NodeJS.Timeout | undefined
    let keepAliveTimer: NodeJS.Timeout | undefined
    let activeRefresh: Promise<void> | null = null
    let activeMapMarkerRefresh: Promise<void> | null = null

    const getOrCreateInflightPayload = (key: string, buildPayload: () => Promise<string>) => {
      const existingPayload = inflightPayloads.get(key)
      if (existingPayload) return existingPayload

      const payloadPromise = buildPayload().finally(() => {
        inflightPayloads.delete(key)
      })
      inflightPayloads.set(key, payloadPromise)
      return payloadPromise
    }

    const refreshRtmsCache = async (forceDefaultQuery = false) => {
      const env = loadRuntimeEnv()
      const serviceKey = env.MOLIT_APT_TRADE_SERVICE_KEY
      if (!serviceKey) return

      const queries =
        !forceDefaultQuery && rtmsQueries.size > 0
          ? [...rtmsQueries.entries()]
          : [[rtmsCacheKey(createDefaultCapitalQuery()), createDefaultCapitalQuery()] as const]

      for (const [key, query] of queries) {
        try {
          const payload = await buildRtmsPayload(query, serviceKey)
          const serializedPayload = JSON.stringify(payload)
          rtmsCache.set(key, serializedPayload)
          await writeRtmsCacheFile(key, serializedPayload)
        } catch (error) {
          console.warn(
            `[집직구 RTMS] ${key} refresh failed:`,
            error instanceof Error ? error.message : error,
          )
        }
      }
    }

    const startRtmsRefresh = (forceDefaultQuery = false) => {
      if (activeRefresh) return activeRefresh

      activeRefresh = refreshRtmsCache(forceDefaultQuery).finally(() => {
        activeRefresh = null
      })

      return activeRefresh
    }

    const refreshRtmsMapMarkerCache = async (
      scope = 'capital',
      lawdCd = '',
      options: MapMarkerRefreshOptions = {},
    ) => {
      const env = loadRuntimeEnv()
      const serviceKey = env.MOLIT_APT_TRADE_SERVICE_KEY
      const kakaoRestApiKey = readKakaoRestApiKey(env)
      if (!serviceKey || !kakaoRestApiKey) return

      const group = targetGroups[scope] ?? targetGroups.capital
      const districts = lawdCd
        ? capitalAreaDistricts.filter((district) => district.code === lawdCd)
        : group.districts
      const orderedDistricts = orderMapRefreshDistricts(districts)
      const refreshTargets: TargetDistrict[] = []

      for (const district of orderedDistricts) {
        const cachedDistrictPayload = await readMapMarkerDistrictCache(district.code)
        if (!options.force && isMapMarkerDistrictCacheComplete(cachedDistrictPayload)) {
          continue
        }

        refreshTargets.push(district)
        if (options.maxDistricts && refreshTargets.length >= options.maxDistricts) {
          break
        }
      }

      for (const district of refreshTargets) {
        try {
          const markerPayload = await buildIncrementalDistrictMapMarkerPayload({
            district,
            serviceKey,
            kakaoRestApiKey,
            force: options.force,
          })

          await writeMapMarkerDistrictCache(district.code, markerPayload)
        } catch (error) {
          console.warn(
            `[집직구 RTMS 지도] ${district.name} marker refresh failed:`,
            error instanceof Error ? error.message : error,
          )
        }

        await sleep(250)
      }
    }

    const startMapMarkerRefresh = (
      scope = 'capital',
      lawdCd = '',
      options: MapMarkerRefreshOptions = {},
    ) => {
      if (activeMapMarkerRefresh) return activeMapMarkerRefresh

      activeMapMarkerRefresh = refreshRtmsMapMarkerCache(scope, lawdCd, options).finally(() => {
        activeMapMarkerRefresh = null
      })

      return activeMapMarkerRefresh
    }

    const scheduleDailyRefresh = () => {
      dailyRefreshTimer = setTimeout(() => {
        void (async () => {
          await startMapMarkerRefresh('pyeongchon-core', '', { maxDistricts: 4 })
          await startMapMarkerRefresh('capital', '', { maxDistricts: rtmsMapMarkerBatchSize })
        })().finally(scheduleDailyRefresh)
      }, getMsUntilNextDailyRefresh(rtmsDailyRefreshHour))
    }

    const startKeepAlive = () => {
      const env = loadRuntimeEnv()
      const publicBaseUrl = env.JIPJIGGU_KEEP_ALIVE_URL || env.RENDER_EXTERNAL_URL
      if (!publicBaseUrl) return

      const healthUrl = new URL('/api/health', publicBaseUrl).toString()
      keepAliveTimer = setInterval(() => {
        fetch(healthUrl, { cache: 'no-store' }).catch(() => undefined)
      }, 10 * 60 * 1000)
    }

    scheduleDailyRefresh()
    startKeepAlive()
    server.httpServer?.once('close', () => {
      if (dailyRefreshTimer) clearTimeout(dailyRefreshTimer)
      if (keepAliveTimer) clearInterval(keepAliveTimer)
    })

    server.middlewares.use('/api/report/anyang-news', async (request, response) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('Cache-Control', 'public, max-age=600')
      const incomingUrl = new URL(request.url ?? '/', 'http://localhost')
      const region = normalizeReportRegion(incomingUrl.searchParams.get('region') || '안양시 동안구')

      try {
        const payload = await buildReportNewsPayload(region)

        response.statusCode = 200
        response.end(JSON.stringify(payload))
      } catch (error) {
        response.statusCode = 200
        response.end(
          JSON.stringify({
            ok: false,
            source: '집직구 기본 브리핑',
            updatedAt: new Date().toISOString(),
            items: getFallbackReportNews(region),
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        )
      }
    })

    server.middlewares.use('/api/subscriptions', async (_request, response) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('Cache-Control', 'public, max-age=900')

      try {
        const payload = await buildSubscriptionPayload()

        response.statusCode = 200
        response.end(JSON.stringify(payload))
      } catch (error) {
        response.statusCode = 200
        response.end(
          JSON.stringify({
            ok: false,
            source: '집직구 청약 기본 브리핑',
            updatedAt: new Date().toISOString(),
            items: subscriptionFallbackItems,
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        )
      }
    })

    server.middlewares.use('/api/kakao/address-search', async (request, response) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('Cache-Control', 'public, max-age=3600')

      const incomingUrl = new URL(request.url ?? '/', 'http://localhost')
      const query = incomingUrl.searchParams.get('query')?.trim() ?? ''
      const env = loadRuntimeEnv()
      const kakaoRestApiKey = readKakaoRestApiKey(env)

      if (!query || query.length < 2) {
        response.statusCode = 200
        response.end(JSON.stringify({ ok: false, items: [], message: '주소를 조금 더 입력해주세요.' }))
        return
      }

      if (!kakaoRestApiKey) {
        response.statusCode = 200
        response.end(JSON.stringify({ ok: false, items: [], message: '카카오 REST 키가 필요합니다.' }))
        return
      }

      try {
        const items = await searchKakaoAddressSuggestions(query, kakaoRestApiKey)

        response.statusCode = 200
        response.end(
          JSON.stringify({
            ok: true,
            query,
            items,
          }),
        )
      } catch (error) {
        response.statusCode = 200
        response.end(
          JSON.stringify({
            ok: false,
            items: [],
            message: '주소 후보를 가져오지 못했습니다.',
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        )
      }
    })

    server.middlewares.use('/api/kakao/geocode', async (request, response) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('Cache-Control', 'public, max-age=86400')

      const incomingUrl = new URL(request.url ?? '/', 'http://localhost')
      const query = incomingUrl.searchParams.get('query')?.trim() ?? ''
      const env = loadRuntimeEnv()
      const kakaoRestApiKey = readKakaoRestApiKey(env)

      if (!query || query.length < 2) {
        response.statusCode = 200
        response.end(JSON.stringify({ ok: false, message: '주소를 조금 더 정확히 입력해주세요.' }))
        return
      }

      if (!kakaoRestApiKey) {
        response.statusCode = 200
        response.end(JSON.stringify({ ok: false, message: '카카오 REST 키가 없어 직장권역 기준으로 계산합니다.' }))
        return
      }

      try {
        const location = await geocodeAddressWithKakao(query, kakaoRestApiKey)

        if (!location) {
          response.statusCode = 200
          response.end(JSON.stringify({ ok: false, message: '주소 좌표를 찾지 못해 직장권역 기준으로 계산합니다.' }))
          return
        }

        response.statusCode = 200
        response.end(
          JSON.stringify({
            ok: true,
            location: {
              address: location.address,
              label: query,
              lat: location.lat,
              lng: location.lng,
            },
          }),
        )
      } catch (error) {
        response.statusCode = 200
        response.end(
          JSON.stringify({
            ok: false,
            message: '주소 좌표 변환이 지연되어 직장권역 기준으로 계산합니다.',
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        )
      }
    })

    server.middlewares.use('/api/health', async (_request, response) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('Cache-Control', 'no-store')
      response.statusCode = 200
      response.end(
        JSON.stringify({
          ok: true,
          service: 'jipjiggu',
          updatedAt: new Date().toISOString(),
        }),
      )
    })

    server.middlewares.use('/api/runtime/config-check', async (_request, response) => {
      const env = loadRuntimeEnv()
      const kakaoRestKeyNames = [
        'KAKAO_REST_API_KEY',
        'KAKAO_REST_KEY',
        'KAKAO_MAP_REST_API_KEY',
        'KAKAO_LOCAL_REST_API_KEY',
        'VITE_KAKAO_REST_API_KEY',
      ]

      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.statusCode = 200
      response.end(
        JSON.stringify({
          ok: true,
          kakaoRestApiKeyPresent: Boolean(readKakaoRestApiKey(env)),
          kakaoRestKeyNames: kakaoRestKeyNames.map((key) => ({
            key,
            present: Boolean(env[key]),
          })),
          rtmsServiceKeyPresent: Boolean(env.MOLIT_APT_TRADE_SERVICE_KEY),
          buildingLedgerServiceKeyPresent: Boolean(env.MOLIT_BUILDING_LEDGER_SERVICE_KEY),
          telegramBotTokenPresent: Boolean(env.TELEGRAM_BOT_TOKEN),
          telegramChatIdPresent: Boolean(env.TELEGRAM_CHAT_ID),
          telegramConfigured: Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
          updatedAt: new Date().toISOString(),
        }),
      )
    })

    server.middlewares.use('/api/listings', async (request, response) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('Cache-Control', 'no-store')

      try {
        if (request.method === 'GET') {
          const listings = await readStoredListings()
          response.statusCode = 200
          response.end(
            JSON.stringify({
              ok: true,
              listings,
              updatedAt: new Date().toISOString(),
            }),
          )
          return
        }

        if (request.method === 'POST') {
          const rawBody = await readRequestBody(request)
          const payload = rawBody ? (JSON.parse(rawBody) as { listing?: unknown }) : {}
          const listing = sanitizeStoredListing(payload.listing)

          if (!listing) {
            response.statusCode = 400
            response.end(JSON.stringify({ ok: false, message: '매물 정보가 부족합니다.' }))
            return
          }

          const listings = await readStoredListings()
          const nextListings = [
            listing,
            ...listings.filter((currentListing) => currentListing.id !== listing.id),
          ].slice(0, 300)
          await writeStoredListings(nextListings)

          response.statusCode = 200
          response.end(
            JSON.stringify({
              ok: true,
              listing,
              count: nextListings.length,
              updatedAt: new Date().toISOString(),
            }),
          )
          return
        }

        response.statusCode = 405
        response.end(JSON.stringify({ ok: false, message: 'Method not allowed' }))
      } catch (error) {
        response.statusCode = 500
        response.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }))
      }
    })

    server.middlewares.use('/api/telegram/test', async (_request, response) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')

      try {
        const env = loadRuntimeEnv()
        const createdAt = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
        const result = await sendTelegramMessage(
          env,
          `[집직구] 텔레그램 연결 테스트\n접수시각: ${createdAt}\n이 메시지가 보이면 알림 연결이 정상입니다.`,
        )

        response.statusCode = result.ok ? 200 : result.configured ? 502 : 200
        response.end(JSON.stringify(result))
      } catch (error) {
        response.statusCode = 500
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
      }
    })

    server.middlewares.use('/api/telegram/notify', async (request, response) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')

      if (request.method !== 'POST') {
        response.statusCode = 405
        response.end(JSON.stringify({ error: 'Method not allowed' }))
        return
      }

      try {
        const env = loadRuntimeEnv()
        const rawBody = await readRequestBody(request)
        const lead = rawBody ? (JSON.parse(rawBody) as TelegramLead) : {}
        const text = formatTelegramLeadMessage(lead)
        const result = await sendTelegramMessage(env, text)

        response.statusCode = result.ok ? 200 : result.configured ? 502 : 200
        response.end(JSON.stringify(result))
      } catch (error) {
        response.statusCode = 500
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
      }
    })

    server.middlewares.use('/api/rtms/refresh', async (request, response) => {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('Cache-Control', 'no-store')

      try {
        const incomingUrl = new URL(request.url ?? '/', 'http://localhost')
        const shouldWait = incomingUrl.searchParams.get('wait') === '1'
        const scope = incomingUrl.searchParams.get('scope') || 'capital'
        const lawdCd = incomingUrl.searchParams.get('lawdCd') || ''
        const markersOnly = incomingUrl.searchParams.get('markers') === '1'
        const rawBatch = incomingUrl.searchParams.get('batch')
        const markerBatch =
          rawBatch === 'all'
            ? undefined
            : Math.min(Math.max(Number(rawBatch) || rtmsMapMarkerBatchSize, 1), 20)
        const forceMarkers = incomingUrl.searchParams.get('force') === '1'
        const refreshPromise = markersOnly
          ? startMapMarkerRefresh(scope, lawdCd, { maxDistricts: markerBatch, force: forceMarkers })
          : startRtmsRefresh(true).then(() => startMapMarkerRefresh(scope, lawdCd, { maxDistricts: markerBatch }))
        if (shouldWait) {
          await refreshPromise
        }

        const cacheKey = rtmsCacheKey(createDefaultCapitalQuery())
        const cachedPayload = rtmsCache.get(cacheKey) || (await readRtmsCacheFile(cacheKey))
        const markerCache = await readAggregatedMapMarkerCache({ ...createDefaultMapQuery(), scope, lawdCd }, rtmsMapMarkerReturnLimit)

        response.statusCode = markerCache.markers.length > 0 || (shouldWait && cachedPayload) ? 200 : 202
        response.end(
          JSON.stringify({
            ok: Boolean(cachedPayload || markerCache.markers.length > 0),
            cacheKey,
            cachePolicy: `daily-${String(rtmsDailyRefreshHour).padStart(2, '0')}:00`,
            refreshing: Boolean(activeRefresh),
            markerRefreshing: Boolean(activeMapMarkerRefresh),
            markerCount: markerCache.markers.length,
            refreshedDistricts: markerCache.refreshedDistricts,
            searchedDistricts: markerCache.searchedDistricts,
            batchSize: markerBatch ?? 'all',
            message: cachedPayload
              ? '서울·경기·인천 RTMS 캐시 갱신 완료'
              : markerCache.markers.length > 0
                ? '서울·경기·인천 지도 마커 캐시 갱신중'
                : '서울·경기·인천 RTMS 캐시 갱신을 백그라운드에서 시작했습니다',
            updatedAt: new Date().toISOString(),
          }),
        )
      } catch (error) {
        response.statusCode = 500
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
      }
    })

    server.middlewares.use('/api/rtms/apt-trades', async (request, response) => {
      const env = loadRuntimeEnv()
      const serviceKey = env.MOLIT_APT_TRADE_SERVICE_KEY

      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('Cache-Control', publicCacheHeader(60, 600))

      if (!serviceKey) {
        response.statusCode = 500
        response.end(JSON.stringify({ error: 'MOLIT_APT_TRADE_SERVICE_KEY is missing' }))
        return
      }

      const incomingUrl = new URL(request.url ?? '/', 'http://localhost')
      const query: RtmsQuery = {
        lawdCd: incomingUrl.searchParams.get('lawdCd') || '',
        scope: incomingUrl.searchParams.get('scope') || 'capital',
        dealYmd: incomingUrl.searchParams.get('dealYmd') || getDefaultDealYmd(),
        monthsBack: Math.min(Math.max(Number(incomingUrl.searchParams.get('monthsBack')) || 1, 1), 84),
        numOfRows: String(Math.min(Number(incomingUrl.searchParams.get('numOfRows')) || 1000, 1000)),
        limit: Math.min(Number(incomingUrl.searchParams.get('limit')) || 50000, 50000),
      }
      const cacheKey = rtmsCacheKey(query)
      rtmsQueries.set(cacheKey, query)

      try {
        const cachedPayload = rtmsCache.get(cacheKey) || (await readRtmsCacheFile(cacheKey))
        if (cachedPayload) {
          rtmsCache.set(cacheKey, cachedPayload)
          response.statusCode = 200
          response.end(cachedPayload)
          return
        }

        const defaultCapitalQuery = createDefaultCapitalQuery()
        const defaultCapitalCacheKey = rtmsCacheKey(defaultCapitalQuery)
        const defaultCapitalPayload = rtmsCache.get(defaultCapitalCacheKey) || (await readRtmsCacheFile(defaultCapitalCacheKey))

        if (defaultCapitalPayload && query.scope === 'capital' && !query.lawdCd) {
          rtmsCache.set(defaultCapitalCacheKey, defaultCapitalPayload)
          response.statusCode = 200
          response.end(defaultCapitalPayload)
          return
        }

        if (
          defaultCapitalPayload &&
          query.dealYmd === 'auto' &&
          query.monthsBack <= rtmsDefaultCapitalMonthsBack
        ) {
          const derivedPayload = filterRtmsPayloadFromCapitalCache(defaultCapitalPayload, query)
          rtmsCache.set(cacheKey, derivedPayload)
          response.statusCode = 200
          response.end(derivedPayload)
          return
        }

        if (!query.lawdCd && query.scope === 'capital') {
          void startRtmsRefresh(true)
          response.statusCode = 202
          response.end(
            JSON.stringify({
              meta: {
                source: '국토교통부 RTMS 아파트 매매 실거래가 상세 자료',
                lawdCd: '',
                scope: 'capital',
                district: '서울·경기·인천',
                dealYmd: query.dealYmd,
                fromDealYmd: '',
                toDealYmd: '',
                monthsBack: query.monthsBack,
                resultCode: 'REFRESHING',
                resultMessage: `매일 새벽 ${rtmsDailyRefreshHour}시 기준 캐시를 갱신합니다. 현재 첫 수집을 진행 중입니다.`,
                totalCount: 0,
                rawCount: 0,
                filteredCount: 0,
                returnedCount: 0,
                canceledCount: 0,
                directCount: 0,
                searchedDistricts: capitalAreaDistricts.length,
                searchedMonths: query.monthsBack,
                failedDistricts: 0,
                cachePolicy: `daily-${String(rtmsDailyRefreshHour).padStart(2, '0')}:00`,
                updatedAt: new Date().toISOString(),
              },
              deals: [],
            }),
          )
          return
        }

        const serializedPayload = await getOrCreateInflightPayload(`rtms:${cacheKey}`, async () => {
          const payload = await buildRtmsPayload(query, serviceKey)
          const nextPayload = JSON.stringify(payload)
          rtmsCache.set(cacheKey, nextPayload)
          await writeRtmsCacheFile(cacheKey, nextPayload)
          return nextPayload
        })
        response.statusCode = 200
        response.end(serializedPayload)
      } catch (error) {
        response.statusCode = 500
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
      }
    })

    server.middlewares.use('/api/rtms/map-markers', async (request, response) => {
      const env = loadRuntimeEnv()
      const serviceKey = env.MOLIT_APT_TRADE_SERVICE_KEY
      const kakaoRestApiKey = readKakaoRestApiKey(env)

      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('Cache-Control', publicCacheHeader(30, 120))

      if (!serviceKey) {
        response.statusCode = 500
        response.end(JSON.stringify({ error: 'MOLIT_APT_TRADE_SERVICE_KEY is missing' }))
        return
      }

      const incomingUrl = new URL(request.url ?? '/', 'http://localhost')
      const query: RtmsQuery = {
        lawdCd: incomingUrl.searchParams.get('lawdCd') || '',
        scope: incomingUrl.searchParams.get('scope') || 'capital',
        dealYmd: incomingUrl.searchParams.get('dealYmd') || 'auto',
        monthsBack: Math.min(Math.max(Number(incomingUrl.searchParams.get('monthsBack')) || rtmsMapMarkerMonthsBack, 1), 84),
        numOfRows: String(Math.min(Number(incomingUrl.searchParams.get('numOfRows')) || 1000, 1000)),
        limit: Math.min(Number(incomingUrl.searchParams.get('sourceLimit')) || rtmsMapMarkerLimit, rtmsMapMarkerLimit),
      }
      const markerLimit = Math.min(Number(incomingUrl.searchParams.get('limit')) || rtmsMapMarkerReturnLimit, rtmsMapMarkerReturnLimit)
      const geocodeLimit = Math.min(Number(incomingUrl.searchParams.get('geocodeLimit')) || 400, 1200)
      const cacheKey = rtmsCacheKey(query)
      rtmsQueries.set(cacheKey, query)

      try {
        const markerCache = await readAggregatedMapMarkerCache(query, markerLimit)
        if (markerCache.markers.length > 0) {
          response.setHeader('Cache-Control', publicCacheHeader(300, 3600))
          if (kakaoRestApiKey && markerCache.refreshedDistricts < markerCache.searchedDistricts) {
            void startMapMarkerRefresh(query.scope, query.lawdCd, {
              maxDistricts: query.scope === 'pyeongchon-core' && !query.lawdCd ? 4 : rtmsMapMarkerBatchSize,
            })
          }

          response.statusCode = 200
          response.end(
            JSON.stringify({
              meta: {
                source: '국토교통부 RTMS 아파트 매매 실거래가 상세 자료 + Kakao 주소 좌표 캐시',
                lawdCd: query.lawdCd || '',
                scope: query.scope,
                district: query.lawdCd ? districtNameByLawdCd[query.lawdCd] || query.lawdCd : targetGroups[query.scope]?.label ?? '서울·경기·인천',
                resultCode: markerCache.refreshedDistricts < markerCache.searchedDistricts ? 'PARTIAL' : '000',
                resultMessage: '구/시군구별 좌표 캐시가 있는 단지부터 지도 마커로 반환했습니다.',
                markerCount: markerCache.markers.length,
                refreshedDistricts: markerCache.refreshedDistricts,
                searchedDistricts: markerCache.searchedDistricts,
                needsKakaoRestApiKey: !kakaoRestApiKey,
                markerRefreshing: Boolean(activeMapMarkerRefresh),
                cachePolicy: `daily-${String(rtmsDailyRefreshHour).padStart(2, '0')}:00`,
                updatedAt: new Date().toISOString(),
              },
              markers: markerCache.markers,
            }),
          )
          return
        }

        if (kakaoRestApiKey) {
          void startMapMarkerRefresh(query.scope, query.lawdCd, {
            maxDistricts: query.scope === 'pyeongchon-core' && !query.lawdCd ? 4 : rtmsMapMarkerBatchSize,
          })
        }

        let cachedPayload = rtmsCache.get(cacheKey) || (await readRtmsCacheFile(cacheKey))

        if (!cachedPayload && query.scope === 'capital' && !query.lawdCd) {
          const defaultMapQuery = createDefaultMapQuery()
          const defaultMapCacheKey = rtmsCacheKey(defaultMapQuery)
          cachedPayload = rtmsCache.get(defaultMapCacheKey) || (await readRtmsCacheFile(defaultMapCacheKey))
          if (cachedPayload) {
            rtmsCache.set(defaultMapCacheKey, cachedPayload)
          }
        }

        if (!cachedPayload) {
          const defaultCapitalQuery = createDefaultCapitalQuery()
          const defaultCapitalCacheKey = rtmsCacheKey(defaultCapitalQuery)
          cachedPayload = rtmsCache.get(defaultCapitalCacheKey) || (await readRtmsCacheFile(defaultCapitalCacheKey))

          if (cachedPayload) {
            rtmsCache.set(defaultCapitalCacheKey, cachedPayload)
          }
        }

        if (!cachedPayload) {
          response.statusCode = 202
          response.end(
            JSON.stringify({
              meta: {
                source: '국토교통부 RTMS 아파트 매매 실거래가 상세 자료 + Kakao 주소 좌표 캐시',
                lawdCd: query.lawdCd || '',
                scope: query.scope,
                district: targetGroups[query.scope]?.label ?? '서울·경기·인천',
                resultCode: 'REFRESHING',
                resultMessage: kakaoRestApiKey
                  ? '구/시군구별 지도 마커 캐시를 순차 생성하고 있습니다.'
                  : 'KAKAO_REST_API_KEY가 없어 신규 주소 좌표 변환을 할 수 없습니다.',
                markerCount: 0,
                candidateMarkerCount: 0,
                missingCoordinateCount: 0,
                needsKakaoRestApiKey: !kakaoRestApiKey,
                markerRefreshing: Boolean(activeMapMarkerRefresh),
                cachePolicy: `daily-${String(rtmsDailyRefreshHour).padStart(2, '0')}:00`,
                updatedAt: new Date().toISOString(),
              },
              markers: [],
            }),
          )
          return
        }

        const serializedPayload = await getOrCreateInflightPayload(
          `rtms-map:${cacheKey}:${markerLimit}:${geocodeLimit}`,
          async () => {
            const payload = await buildRtmsMapMarkerPayload({
              serializedPayload: cachedPayload,
              query,
              kakaoRestApiKey,
              limit: markerLimit,
              geocodeLimit,
            })
            return JSON.stringify(payload)
          },
        )
        const payload = JSON.parse(serializedPayload) as { markers?: unknown[] }

        if (payload.markers?.length) {
          response.setHeader('Cache-Control', publicCacheHeader(300, 3600))
        }
        response.statusCode = payload.markers?.length ? 200 : 202
        response.end(serializedPayload)
      } catch (error) {
        response.statusCode = 500
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
      }
    })

    server.middlewares.use('/api/rtms/latest-apartment-deal', async (request, response) => {
      const env = loadRuntimeEnv()
      const serviceKey = env.MOLIT_APT_TRADE_SERVICE_KEY

      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('Cache-Control', publicCacheHeader(3600, 86400))

      if (!serviceKey) {
        response.statusCode = 500
        response.end(JSON.stringify({ error: 'MOLIT_APT_TRADE_SERVICE_KEY is missing' }))
        return
      }

      const incomingUrl = new URL(request.url ?? '/', 'http://localhost')
      const lawdCd = incomingUrl.searchParams.get('lawdCd') || ''
      const aptName = incomingUrl.searchParams.get('aptName') || ''
      const aptSeq = incomingUrl.searchParams.get('aptSeq') || ''
      const monthsBack = Math.min(Math.max(Number(incomingUrl.searchParams.get('monthsBack')) || 84, 1), 120)

      if (!lawdCd || !aptName.trim()) {
        response.statusCode = 400
        response.end(JSON.stringify({ error: 'lawdCd and aptName are required' }))
        return
      }

      const cacheKey = ['latest-apartment', lawdCd, normalizeComparableName(aptName), aptSeq || 'name', monthsBack].join(':')

      try {
        const cachedPayload = rtmsCache.get(cacheKey) || (await readRtmsCacheFile(cacheKey))
        if (cachedPayload) {
          rtmsCache.set(cacheKey, cachedPayload)
          response.statusCode = 200
          response.end(cachedPayload)
          return
        }

        const serializedPayload = await getOrCreateInflightPayload(`latest-apartment:${cacheKey}`, async () => {
          const result = await findLatestApartmentDeal({
            lawdCd,
            aptName,
            aptSeq,
            monthsBack,
            serviceKey,
          })
          const nextPayload = JSON.stringify({
            meta: {
              source: '국토교통부 RTMS 아파트 매매 실거래가 상세 자료',
              resultCode: result ? '000' : 'EMPTY',
              resultMessage: result?.deal ? 'OK' : '최근 거래 없음',
              searchedMonths: result?.searchedMonths ?? 0,
              updatedAt: new Date().toISOString(),
            },
            deal: result?.deal ?? null,
          })

          rtmsCache.set(cacheKey, nextPayload)
          await writeRtmsCacheFile(cacheKey, nextPayload)
          return nextPayload
        })
        response.statusCode = 200
        response.end(serializedPayload)
      } catch (error) {
        response.statusCode = 500
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
      }
    })

    server.middlewares.use('/api/building/ledger', async (request, response) => {
      const env = loadRuntimeEnv()
      const serviceKey = env.MOLIT_BUILDING_LEDGER_SERVICE_KEY

      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('Cache-Control', publicCacheHeader(86400, 604800))

      if (!serviceKey) {
        response.statusCode = 500
        response.end(JSON.stringify({ error: 'MOLIT_BUILDING_LEDGER_SERVICE_KEY is missing' }))
        return
      }

      const incomingUrl = new URL(request.url ?? '/', 'http://localhost')
      const lawdCd = incomingUrl.searchParams.get('lawdCd') || ''
      const umdCd = incomingUrl.searchParams.get('umdCd') || ''
      const bonbun = (incomingUrl.searchParams.get('bonbun') || '0000').padStart(4, '0')
      const bubun = (incomingUrl.searchParams.get('bubun') || '0000').padStart(4, '0')
      const landCd = incomingUrl.searchParams.get('landCd') || '1'
      const aptName = incomingUrl.searchParams.get('aptName') || '선택 단지'
      const address = incomingUrl.searchParams.get('address') || ''
      const buildYear = Number(incomingUrl.searchParams.get('buildYear')) || 0
      const platGbCd = landCd === '2' ? '1' : '0'

      if (!lawdCd || !umdCd) {
        response.statusCode = 400
        response.end(JSON.stringify({ error: 'lawdCd and umdCd are required' }))
        return
      }

      const baseParams = {
        serviceKey,
        sigunguCd: lawdCd,
        bjdongCd: umdCd,
        platGbCd,
        bun: bonbun,
        ji: bubun,
        numOfRows: '100',
        pageNo: '1',
        _type: 'json',
      }
      const cacheKey = [
        'building-ledger',
        lawdCd,
        umdCd,
        platGbCd,
        bonbun,
        bubun,
        safeCacheFilename(`${aptName}:${address}:${buildYear}`),
      ].join(':')

      const fetchBuildingItems = async (resource: string) => {
        const params = new URLSearchParams(baseParams)
        const apiResponse = await fetch(`https://apis.data.go.kr/1613000/BldRgstHubService/${resource}?${params}`)
        const raw = await apiResponse.text()

        if (!apiResponse.ok) {
          return {
            resultCode: String(apiResponse.status),
            resultMessage: raw || apiResponse.statusText,
            totalCount: 0,
            items: [] as BuildingApiItem[],
          }
        }

        return parseApiItems<BuildingApiItem>(raw)
      }

      try {
        const cachedPayload = rtmsCache.get(cacheKey) || (await readRtmsCacheFile(cacheKey))
        if (cachedPayload) {
          rtmsCache.set(cacheKey, cachedPayload)
          response.statusCode = 200
          response.end(cachedPayload)
          return
        }

        const serializedPayload = await getOrCreateInflightPayload(`building-ledger:${cacheKey}`, async () => {
          const [title, recap] = await Promise.all([
            fetchBuildingItems('getBrTitleInfo'),
            fetchBuildingItems('getBrRecapTitleInfo'),
          ])
          const ledger = normalizeBuildingLedger(title.items, recap.items[0], { aptName, address, buildYear })
          const nextPayload = JSON.stringify({
            meta: {
              source: '국토교통부 건축HUB 건축물대장정보 서비스',
              resultCode: title.resultCode || recap.resultCode || '000',
              resultMessage: title.resultMessage || recap.resultMessage || 'OK',
              totalCount: title.totalCount + recap.totalCount,
              isFallback: title.items.length + recap.items.length === 0,
              updatedAt: new Date().toISOString(),
            },
            ledger,
          })

          rtmsCache.set(cacheKey, nextPayload)
          await writeRtmsCacheFile(cacheKey, nextPayload)
          return nextPayload
        })
        response.statusCode = 200
        response.end(serializedPayload)
      } catch (error) {
        response.statusCode = 500
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
      }
    })
}

const rtmsProxyPlugin = (): Plugin => ({
  name: 'jipjiggu-rtms-proxy',
  configureServer(server) {
    configureRtmsProxyServer(server)
  },
  configurePreviewServer(server) {
    configureRtmsProxyServer(server)
  },
})

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: ['jipjiggu.onrender.com', '.onrender.com'],
  },
  plugins: [rtmsProxyPlugin(), react()],
})
