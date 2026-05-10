export type RtmsRawDeal = {
  aptNm: string
  sggNm: string
  umdNm: string
  jibun: string
  dealYear: string
  dealMonth: string
  dealDay: string
  dealAmount: string
  excluUseAr: string
  floor: string
  dealingGbn?: string
  cdealType?: string
  buyerGbn?: string
  sellerGbn?: string
}

export type BuildingLedgerInfo = {
  complexName: string
  totalHouseholds: number
  parkingSpaces: number
  floorAreaRatio: number
  approvalYear: number
}

export type Coordinate = {
  lat: number
  lng: number
}

export type EnrichedDeal = {
  id: string
  complexName: string
  address: string
  legalDong: string
  jibun: string
  dealDate: string
  priceEok: number
  areaM2: number
  floor: number
  tradeType: 'direct' | 'brokered' | 'unknown'
  buyerType: string
  sellerType: string
  status: 'active' | 'cancelled'
  coordinate?: Coordinate
  building?: BuildingLedgerInfo
}

export const DATA_PIPELINE_STEPS = [
  {
    title: 'RTMS 실거래 수집',
    detail: '법정동코드 5자리와 계약월 기준으로 매매 신고 데이터를 가져옵니다.',
    badge: '국토부',
  },
  {
    title: '법정동·지번 좌표화',
    detail: '시군구, 법정동, 지번을 주소로 합쳐 Kakao 좌표 검색으로 위경도를 붙입니다.',
    badge: '지도',
  },
  {
    title: '단지 정보 결합',
    detail: '건축물대장 표제부·총괄표제부에서 세대수, 주차대수, 용적률을 결합합니다.',
    badge: '대장',
  },
  {
    title: '신뢰 필터링',
    detail: '취소 거래는 제외하고 직거래, 법인 거래, 중개 거래를 구분해 표시합니다.',
    badge: '검증',
  },
]

export const SOURCE_SUMMARY = [
  ['최종 출처', '국토교통부 RTMS 부동산거래관리시스템'],
  ['수집 경로', '공공데이터포털 Open API, 건축물대장 API, Kakao 좌표 검색'],
  ['데이터 종류', '매매·전월세·분양권 실거래가, 개인·법인 거래 주체, 단지 기본 정보'],
  ['업데이트 주기', '신고 후 시스템 반영 시점에 맞춰 실시간 또는 일 단위 수집'],
] as const

const normalizeNumber = (value: string) => Number(value.replaceAll(',', '').trim())

export const formatRtmsAddress = (deal: Pick<RtmsRawDeal, 'sggNm' | 'umdNm' | 'jibun'>) =>
  `${deal.sggNm} ${deal.umdNm} ${deal.jibun}`.replace(/\s+/g, ' ').trim()

export const normalizeRtmsDeal = (
  deal: RtmsRawDeal,
  coordinateByAddress: Record<string, Coordinate>,
  ledgerByComplex: Record<string, BuildingLedgerInfo>,
): EnrichedDeal => {
  const address = formatRtmsAddress(deal)
  const dealDate = [
    deal.dealYear,
    deal.dealMonth.padStart(2, '0'),
    deal.dealDay.padStart(2, '0'),
  ].join('-')

  return {
    id: `${deal.aptNm}-${dealDate}-${deal.floor}-${deal.excluUseAr}`,
    complexName: deal.aptNm,
    address,
    legalDong: deal.umdNm,
    jibun: deal.jibun,
    dealDate,
    priceEok: normalizeNumber(deal.dealAmount) / 10000,
    areaM2: Number(deal.excluUseAr),
    floor: Number(deal.floor),
    tradeType:
      deal.dealingGbn === '직거래' ? 'direct' : deal.dealingGbn === '중개거래' ? 'brokered' : 'unknown',
    buyerType: deal.buyerGbn || '미공개',
    sellerType: deal.sellerGbn || '미공개',
    status: deal.cdealType === 'O' ? 'cancelled' : 'active',
    coordinate: coordinateByAddress[address],
    building: ledgerByComplex[deal.aptNm],
  }
}

export const filterTrustedDeals = (deals: EnrichedDeal[]) =>
  deals.filter((deal) => deal.status === 'active' && Boolean(deal.coordinate))

const sampleRtmsDeals: RtmsRawDeal[] = [
  {
    aptNm: '래미안 원베일리',
    sggNm: '서울 서초구',
    umdNm: '반포동',
    jibun: '1-1',
    dealYear: '2025',
    dealMonth: '04',
    dealDay: '21',
    dealAmount: '516,000',
    excluUseAr: '84.95',
    floor: '18',
    dealingGbn: '중개거래',
    buyerGbn: '개인',
    sellerGbn: '개인',
  },
  {
    aptNm: '헬리오시티',
    sggNm: '서울 송파구',
    umdNm: '가락동',
    jibun: '913',
    dealYear: '2025',
    dealMonth: '04',
    dealDay: '12',
    dealAmount: '207,000',
    excluUseAr: '59.98',
    floor: '11',
    dealingGbn: '직거래',
    buyerGbn: '개인',
    sellerGbn: '법인',
  },
  {
    aptNm: '취소 샘플 단지',
    sggNm: '서울 송파구',
    umdNm: '잠실동',
    jibun: '19',
    dealYear: '2025',
    dealMonth: '04',
    dealDay: '02',
    dealAmount: '310,000',
    excluUseAr: '84.8',
    floor: '7',
    dealingGbn: '중개거래',
    cdealType: 'O',
  },
]

const sampleCoordinates: Record<string, Coordinate> = {
  '서울 서초구 반포동 1-1': { lat: 37.5075, lng: 127.0046 },
  '서울 송파구 가락동 913': { lat: 37.4974, lng: 127.1073 },
  '서울 송파구 잠실동 19': { lat: 37.5145, lng: 127.1043 },
}

const sampleLedger: Record<string, BuildingLedgerInfo> = {
  '래미안 원베일리': {
    complexName: '래미안 원베일리',
    totalHouseholds: 2990,
    parkingSpaces: 5385,
    floorAreaRatio: 299,
    approvalYear: 2023,
  },
  헬리오시티: {
    complexName: '헬리오시티',
    totalHouseholds: 9510,
    parkingSpaces: 12210,
    floorAreaRatio: 284,
    approvalYear: 2018,
  },
}

export const pipelinePreviewDeals = filterTrustedDeals(
  sampleRtmsDeals.map((deal) => normalizeRtmsDeal(deal, sampleCoordinates, sampleLedger)),
)
