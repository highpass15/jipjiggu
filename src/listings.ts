export type ListingOwnerRelation = 'self' | 'family' | 'tenant' | 'agent' | 'corporate' | 'other'

export type ListingDocumentType = 'id' | 'delegation' | 'family' | 'lease' | 'registry' | 'corporate' | 'other'

export type ListingLoanAvailability = 'available' | 'unavailable' | 'check'

export type ListingMoveInType = 'immediate' | 'date' | 'negotiable'

export type ListingVerificationMethod = 'resident' | 'lease' | 'owner-request' | 'other'

export type ListingDocument = {
  id: string
  name: string
  type: ListingDocumentType
  dataUrl: string
}

export type ListingNotificationPreferences = {
  similarListing: boolean
  priceChange: boolean
  buyerLead: boolean
  weeklyReport: boolean
}

export type ListingVerificationAgreements = {
  privacy: boolean
  antiFraud: boolean
  gov24: boolean
}

export type UserListing = {
  id: string
  intent?: 'sell'
  aptName: string
  address: string
  lat?: number
  lng?: number
  detailAddress: string
  buildingDong: string
  unitHo: string
  priceEok: number
  pyeong: number
  floor: number
  exclusiveAreaM2?: number
  supplyAreaM2?: number
  rooms?: number
  bathrooms?: number
  maintenanceFeeManwon?: number
  loanAvailability?: ListingLoanAvailability
  moveInType?: ListingMoveInType
  moveInDate?: string
  hasJeonseTenant?: boolean
  jeonseDepositEok?: number
  ownerName: string
  ownerPhone: string
  ownerRelation: ListingOwnerRelation
  ownerRelationDetail: string
  verificationMethod?: ListingVerificationMethod
  ownerVerificationPhone?: string
  verificationRelation?: string
  memo: string
  photos: Array<{
    id: string
    name: string
    dataUrl: string
  }>
  documents: ListingDocument[]
  notificationPreferences: ListingNotificationPreferences
  agreements: ListingVerificationAgreements
  moveInHouseholdCheckRequested: boolean
  registryCheckRequested: boolean
  verificationStatus: 'owner-checking' | 'verified'
  createdAt: string
}

export type ListingsResponse = {
  ok: boolean
  listings: UserListing[]
  updatedAt?: string
}

export type ListingComplexGroup = {
  key: string
  aptName: string
  address: string
  listings: UserListing[]
}

export type ListingComplexTarget = {
  aptName: string
  address: string
}

export type ListingApartmentCandidate = {
  id: string
  name: string
  address: string
  lat?: number
  lng?: number
  region: string
  pyeong?: number
  latestPriceEok?: number
  latestDealDate?: string
  source: 'rtms' | 'curated'
  searchText: string
}

const normalizeListingSearchText = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replaceAll('레미안', '래미안')
    .replaceAll('세트럴', '센트럴')

export const formatListingStatus = (status: UserListing['verificationStatus']) =>
  status === 'verified' ? '실소유자 검증완료' : '실소유자 검증단계'

export const formatListingVerificationBadge = (status: UserListing['verificationStatus']) =>
  status === 'verified' ? '검증완료' : '실소유자 검증단계'

export const formatListingLoanAvailability = (value?: ListingLoanAvailability) => {
  if (value === 'available') return '대출 가능'
  if (value === 'unavailable') return '대출 불가'
  return '대출 확인필요'
}

export const formatListingMoveIn = (listing: Pick<UserListing, 'moveInType' | 'moveInDate'>) => {
  if (listing.moveInType === 'immediate') return '즉시 입주'
  if (listing.moveInType === 'date' && listing.moveInDate) return `${listing.moveInDate} 입주`
  return '입주 협의'
}

export const getListingComplexKey = (listing: UserListing) =>
  normalizeListingSearchText(`${listing.aptName}-${listing.address}`).slice(0, 120)

export const getListingNameKey = (value: string) =>
  normalizeListingSearchText(value)
    .replace(/아파트$/g, '')
    .replace(/단지$/g, '')
    .replace(/[()（）]/g, '')

export const findListingApartmentCandidate = (
  aptName: string,
  address: string,
  candidates: ListingApartmentCandidate[],
) => {
  const aptKey = getListingNameKey(aptName)
  const addressKey = normalizeListingSearchText(address)

  if (!aptKey) return null

  const scoredCandidates = candidates
    .map((candidate) => {
      const candidateName = getListingNameKey(candidate.name)
      const candidateAddress = normalizeListingSearchText(candidate.address)
      let score = 0

      if (candidateName === aptKey) score += 100
      else if (candidateName.includes(aptKey) || aptKey.includes(candidateName)) score += 70
      else if (candidate.searchText.includes(aptKey)) score += 45

      if (addressKey && candidateAddress) {
        if (candidateAddress === addressKey) score += 45
        else if (candidateAddress.includes(addressKey) || addressKey.includes(candidateAddress)) score += 25
      }

      if (candidate.source === 'rtms') score += 20
      if (candidate.latestPriceEok) score += 5

      return { candidate, score }
    })
    .filter(({ score }) => score >= 45)
    .sort((a, b) => b.score - a.score)

  return scoredCandidates[0]?.candidate ?? null
}

export const listingMatchesComplexTarget = (listing: UserListing, target: ListingComplexTarget) => {
  const listingName = getListingNameKey(listing.aptName)
  const targetName = getListingNameKey(target.aptName)
  const listingAddress = normalizeListingSearchText(listing.address)
  const targetAddress = normalizeListingSearchText(target.address)

  const nameMatches =
    listingName.length > 0 &&
    targetName.length > 0 &&
    (listingName === targetName || listingName.includes(targetName) || targetName.includes(listingName))
  const addressMatches =
    listingAddress.length > 0 &&
    targetAddress.length > 0 &&
    (listingAddress.includes(targetAddress) || targetAddress.includes(listingAddress))

  return nameMatches || addressMatches
}

export const formatListingArea = (listing: UserListing) => {
  const supplyArea = listing.supplyAreaM2 ?? Math.round(listing.pyeong * 3.3058 * 10) / 10
  const exclusiveArea = listing.exclusiveAreaM2

  if (exclusiveArea) {
    return `${listing.pyeong}평 / ${Math.round(supplyArea)}m² · 전용 ${exclusiveArea.toFixed(1)}m²`
  }

  return `${listing.pyeong}평 / ${Math.round(supplyArea)}m²`
}

export const formatListingFloor = (floor: number) => {
  if (!Number.isFinite(floor) || floor <= 0) return '층 확인'
  if (floor <= 3) return `${floor}층 · 저층`
  if (floor >= 20) return `${floor}층 · 고층`
  return `${floor}층`
}

export const summarizeListingMemo = (listing: UserListing) => {
  const memo = listing.memo.trim()
  if (memo) {
    return memo
      .split(/[,·\n]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(', ')
  }

  return '입주협의, 검증단계'
}
