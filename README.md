# 집직구 MVP Prototype

Mobile-first React/Vite prototype for `집직구`, an apartment direct-sale verification platform for Seoul and Gyeonggi.

## Run

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173`.

## Current Screens

- 실거래가: Seoul/Gyeonggi apartment transaction mock feed and filters.
- 복비절약: brokerage-fee savings calculator based on the business plan's 20% fee concept.
- AI추천: income/assets/debt input and mock apartment/size recommendations.
- 직거래: seller listing and verification flow preview.

## API Placeholders

Copy `.env.example` to `.env.local` once credentials are ready. Keep server-only keys out of client code.

For Kakao Maps, create an app in Kakao Developers, add `http://127.0.0.1:5173` and
`http://localhost:5173` as Web platform site domains, then paste the JavaScript key:

```bash
VITE_KAKAO_MAP_JS_KEY=your_kakao_javascript_key
```

Restart the Vite dev server after changing `.env.local`.

See `docs/data-pipeline.md` for the RTMS transaction, legal-dong/jibun geocoding,
building ledger enrichment, and filtering plan.
