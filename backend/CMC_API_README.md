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
- **Description:** Returns the total supply of EPWX.
- **Example Response:**
```json
{
  "totalSupply": "500000000000000.0"
}
```

---

### 2. Get Circulating Supply
- **Endpoint:** `GET /api/circulating`
- **Description:** Returns the circulating supply (total supply minus burned and treasury-locked tokens).
- **Example Response:**
```json
{
  "circulatingSupply": "47735101557879.49916245"
}
```

---

### 3. Get Burned Supply
- **Endpoint:** `GET /api/burned`
- **Description:** Returns the total amount of EPWX sent to the burn (dead) address.
- **Example Response:**
```json
{
  "burnedSupply": "452219794766432.065945108"
}
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
- All values are formatted with 9 decimals.
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
- 2026-01-02: Initial release of public supply APIs for CMC compliance.
