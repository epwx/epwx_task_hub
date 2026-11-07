# Design

## Decisions

### Reuse durable signed authorization

Administrative requests sign the wallet, HTTP method, exact request path, body hash, issuance time, and nonce. The backend reconstructs the message, verifies the recovered signer against `ADMIN_WALLETS`, and consumes the signature identity in the existing durable authorization table.

### Require referral consent

Referral registration uses a separate message binding both wallets. The referred wallet must sign it, preventing third parties from pre-registering victims.

### Trust only the configured reverse proxy

Nginx overwrites `X-Forwarded-For` with `$remote_addr`. Express uses `req.ip` with its existing single-proxy trust configuration. Financial controls no longer parse client-provided forwarding headers.

### Serve evidence through expiring URLs

The public static upload mount is removed. Authorized claim and partner APIs replace stored paths with five-minute HMAC URLs. The evidence route validates signature, expiry, and containment under the uploads directory before sending a file.

### Use server-issued wallet login challenges

Login begins with a random, wallet-bound, expiring challenge stored in the database. JWT issuance requires a signature over the server-provided domain, chain, timestamps, wallet, and nonce, followed by atomic challenge consumption.
