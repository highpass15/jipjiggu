import { XMLParser } from 'fast-xml-parser'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

type Metro = 'seoul' | 'gyeonggi' | 'incheon'
type TargetDistrict = {
  code: string
  name: string
  metro: Metro
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
const districtNameByLawdCd = Object.fromEntries(
  capitalAreaDistricts.map((district) => [district.code, district.name]),
)
const targetGroups: Record<string, { label: string; districts: TargetDistrict[] }> = {
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

const runInBatches = async <T, R>(
  items: T[],
  batchSize: number,
  handler: (item: T) => Promise<R>,
) => {
  const results: R[] = []

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize)
    results.push(...(await Promise.all(batch.map(handler))))
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

const normalizeBuildingLedger = (
  titleItem: BuildingApiItem | undefined,
  recapItem: BuildingApiItem | undefined,
  fallback: {
    aptName: string
    address: string
    buildYear: number
  },
) => {
  const item = titleItem ?? recapItem ?? {}
  const parking =
    numberValue(item.totPkngCnt) ||
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
    structure: textValue(item.strctCdNm) || '확인중',
    roof: textValue(item.roofCdNm) || '확인중',
    householdCount: numberValue(item.hhldCnt) || numberValue(item.hoCnt),
    familyCount: numberValue(item.fmlyCnt),
    parkingCount: parking,
    floorAreaRatio: numberValue(item.vlRat),
    buildingCoverageRatio: numberValue(item.bcRat),
    totalAreaM2: numberValue(item.totArea),
    groundFloors: numberValue(item.grndFlrCnt),
    undergroundFloors: numberValue(item.ugrndFlrCnt),
    approvalDate:
      useApprovalDate && useApprovalDate.length >= 8
        ? `${useApprovalDate.slice(0, 4)}-${useApprovalDate.slice(4, 6)}-${useApprovalDate.slice(6, 8)}`
        : fallback.buildYear
          ? `${fallback.buildYear}`
          : '확인중',
  }
}

const fetchDistrictTrades = async (
  district: TargetDistrict,
  serviceKey: string,
  dealYmd: string,
  numOfRows: string,
) => {
  const params = new URLSearchParams({
    serviceKey,
    LAWD_CD: district.code,
    DEAL_YMD: dealYmd,
    numOfRows,
    pageNo: '1',
  })
  const apiResponse = await fetch(
    `https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev?${params.toString()}`,
  )
  const xml = await apiResponse.text()

  if (!apiResponse.ok) {
    return {
      district,
      totalCount: 0,
      rawDeals: [] as ReturnType<typeof normalizeRtmsItem>[],
      error: xml || apiResponse.statusText,
    }
  }

  const parsed = parser.parse(xml) as RtmsParsedResponse
  const body = parsed.response?.body
  const rawItems = asArray<RtmsApiItem>(body?.items?.item)

  return {
    district,
    totalCount: numberValue(body?.totalCount),
    rawDeals: rawItems.map((item) => normalizeRtmsItem(item, district)),
    error: '',
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

const getDefaultDealYmd = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
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

const buildRtmsPayload = async (query: RtmsQuery, serviceKey: string) => {
  const group = targetGroups[query.scope] ?? targetGroups.capital
  const dealYmds = getRecentDealYmds(query.dealYmd, query.monthsBack)
  const districts = query.lawdCd
    ? [
        {
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
  const districtResults = await runInBatches(fetchTargets, 8, ({ district, dealYmd }) =>
    fetchDistrictTrades(district, serviceKey, dealYmd, query.numOfRows),
  )
  const rawDeals = districtResults.flatMap((result) => result.rawDeals)
  const activeDeals = rawDeals.filter((deal) => deal.status === 'active')
  const deals = activeDeals
    .sort((a, b) => b.dealDate.localeCompare(a.dealDate) || b.priceEok - a.priceEok)
    .slice(0, query.limit)

  return {
    meta: {
      source: '국토교통부 RTMS 아파트 매매 실거래가 상세 자료',
      lawdCd: query.lawdCd || '',
      scope: query.scope,
      district: query.lawdCd ? districts[0].name : group.label,
      dealYmd: query.dealYmd,
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
      failedDistricts: districtResults.filter((result) => result.error).length,
      cachePolicy: 'daily-02:00',
      updatedAt: new Date().toISOString(),
    },
    deals,
  }
}

const rtmsProxyPlugin = (): Plugin => ({
  name: 'jipjiggu-rtms-proxy',
  configureServer(server) {
    const rtmsCache = new Map<string, string>()
    const rtmsQueries = new Map<string, RtmsQuery>()
    let dailyRefreshTimer: NodeJS.Timeout | undefined

    const refreshRtmsCache = async () => {
      const env = loadEnv('', process.cwd(), '')
      const serviceKey = env.MOLIT_APT_TRADE_SERVICE_KEY
      if (!serviceKey) return

      const queries =
        rtmsQueries.size > 0
          ? [...rtmsQueries.entries()]
          : [
              [
                rtmsCacheKey({
                  lawdCd: '',
                  scope: 'capital',
                  dealYmd: getDefaultDealYmd(),
                  monthsBack: 36,
                  numOfRows: '10',
                  limit: 2000,
                }),
                {
                  lawdCd: '',
                  scope: 'capital',
                  dealYmd: getDefaultDealYmd(),
                  monthsBack: 36,
                  numOfRows: '10',
                  limit: 2000,
                },
              ] as const,
            ]

      await Promise.all(
        queries.map(async ([key, query]) => {
          const payload = await buildRtmsPayload(query, serviceKey)
          rtmsCache.set(key, JSON.stringify(payload))
        }),
      )
    }

    const scheduleDailyRefresh = () => {
      dailyRefreshTimer = setTimeout(() => {
        void refreshRtmsCache().finally(scheduleDailyRefresh)
      }, getMsUntilNextDailyRefresh(2))
    }

    scheduleDailyRefresh()
    server.httpServer?.once('close', () => {
      if (dailyRefreshTimer) clearTimeout(dailyRefreshTimer)
    })

    server.middlewares.use('/api/rtms/apt-trades', async (request, response) => {
      const env = loadEnv('', process.cwd(), '')
      const serviceKey = env.MOLIT_APT_TRADE_SERVICE_KEY

      response.setHeader('Content-Type', 'application/json; charset=utf-8')

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
        numOfRows: String(Math.min(Number(incomingUrl.searchParams.get('numOfRows')) || 10, 20)),
        limit: Math.min(Number(incomingUrl.searchParams.get('limit')) || 240, 2000),
      }
      const cacheKey = rtmsCacheKey(query)
      rtmsQueries.set(cacheKey, query)

      try {
        const cachedPayload = rtmsCache.get(cacheKey)
        if (cachedPayload) {
          response.statusCode = 200
          response.end(cachedPayload)
          return
        }

        const payload = await buildRtmsPayload(query, serviceKey)
        const serializedPayload = JSON.stringify(payload)
        rtmsCache.set(cacheKey, serializedPayload)
        response.statusCode = 200
        response.end(serializedPayload)
      } catch (error) {
        response.statusCode = 500
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
      }
    })

    server.middlewares.use('/api/building/ledger', async (request, response) => {
      const env = loadEnv('', process.cwd(), '')
      const serviceKey = env.MOLIT_BUILDING_LEDGER_SERVICE_KEY

      response.setHeader('Content-Type', 'application/json; charset=utf-8')

      if (!serviceKey) {
        response.statusCode = 500
        response.end(JSON.stringify({ error: 'MOLIT_BUILDING_LEDGER_SERVICE_KEY is missing' }))
        return
      }

      const incomingUrl = new URL(request.url ?? '/', 'http://localhost')
      const lawdCd = incomingUrl.searchParams.get('lawdCd') || ''
      const umdCd = incomingUrl.searchParams.get('umdCd') || ''
      const bonbun = incomingUrl.searchParams.get('bonbun') || '0000'
      const bubun = incomingUrl.searchParams.get('bubun') || '0000'
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
        numOfRows: '10',
        pageNo: '1',
        _type: 'json',
      }

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
        const [title, recap] = await Promise.all([
          fetchBuildingItems('getBrTitleInfo'),
          fetchBuildingItems('getBrRecapTitleInfo'),
        ])
        const ledger = normalizeBuildingLedger(title.items[0], recap.items[0], { aptName, address, buildYear })

        response.statusCode = 200
        response.end(
          JSON.stringify({
            meta: {
              source: '국토교통부 건축HUB 건축물대장정보 서비스',
              resultCode: title.resultCode || recap.resultCode || '000',
              resultMessage: title.resultMessage || recap.resultMessage || 'OK',
              totalCount: title.totalCount + recap.totalCount,
              isFallback: title.items.length + recap.items.length === 0,
              updatedAt: new Date().toISOString(),
            },
            ledger,
          }),
        )
      } catch (error) {
        response.statusCode = 500
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: ['jipjiggu.onrender.com', '.onrender.com'],
  },
  plugins: [rtmsProxyPlugin(), react()],
})
