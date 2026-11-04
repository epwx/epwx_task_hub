# EPWX Public Supply APIs for CoinMarketCap (CMC)

This document describes the public API endpoints provided by EPWX for supply data, as required by CoinMarketCap and other aggregators.

## Base URL
```
https://api.epowex.com/api
```

---

## Endpoints

### 1. Get Total Supply
- **Endpoint:** `GET /api/supply`
- **Description:** Returns the EPWX contract total supply minus tokens held by the verified burn address.
- **Example Response:**
```json
31636112613662.907941756
```

---

### 2. Get Circulating Supply
- **Endpoint:** `GET /api/circulating`
- **Description:** Returns the circulating supply (total supply minus burned and treasury-locked tokens).
- **Example Response:**
```json
31534662490294.9022976
```

---

### 3. Get Burned Supply
- **Endpoint:** `GET /api/burned`
- **Description:** Returns the total amount of EPWX sent to the burn (dead) address.
- **Example Response:**
```json
468363887386337.092058244
```

---

## API Documentation (Swagger UI)

Interactive API docs are available at:
```
https://api.epowex.com/api/docs
```

---

## Notes
- All endpoints are public and require no authentication.
- Successful responses contain only the numerical JSON value, matching the CoinMarketCap Annex C sample API format.
- Total supply is the contract supply minus the verifiably burned dead-wallet balance.
- Circulating supply is the contract supply minus burned and treasury-locked balances.
- Values use the token's 9-decimal on-chain precision without converting through JavaScript `Number`.
- Data is fetched directly from the EPWX token contract on Base.
- Treasury-locked addresses are disclosed in project documentation.
- For questions, contact: [your contact email or support link]

---

## Example Usage

**cURL:**
```sh
curl https://api.epowex.com/api/supply
curl https://api.epowex.com/api/circulating
curl https://api.epowex.com/api/burned
```

**Browser:**
- Visit the endpoints directly in your browser for a JSON response.

---

## Changelog
- 2026-11-03: Aligned response bodies and net total-supply calculation with CoinMarketCap Annex C.
- 2026-01-02: Initial release of public supply APIs for CMC compliance.
