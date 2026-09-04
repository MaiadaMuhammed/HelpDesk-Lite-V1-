// Sample valid attachments with realistic data URLs for previews, direct downloads, and mime-type icons

export const SAMPLE_VPN_LOG = `2026-09-04 07:45:12.102 [INFO] Cisco AnyConnect Secure Mobility Client v4.10.05085 initialized
2026-09-04 07:45:13.441 [DEBUG] Interface en0 detected: IP 192.168.1.145/24, Gateway 192.168.1.1
2026-09-04 07:45:14.892 [INFO] Contacting gateway: vpn.corporate.local:443
2026-09-04 07:45:15.110 [DEBUG] TLS 1.3 handshake established with server cert cn=gateway.corporate.local
2026-09-04 07:45:15.890 [INFO] User authentication successful (SAML 2.0 via Okta IdP)
2026-09-04 07:45:16.002 [INFO] Tunnel interface utun3 assigned virtual IP: 10.240.18.42
2026-09-04 08:00:16.450 [WARN] Keepalive heartbeat ping #60 failed on socket fd=14
2026-09-04 08:00:21.890 [WARN] TCP RST received from remote gateway peer (10.240.0.1)
2026-09-04 08:00:22.012 [ERROR] DTLS cipher state mismatch: code 0x8003402 (MAC_VERIFY_FAILURE)
2026-09-04 08:00:22.105 [ERROR] Tunnel terminated abnormally. Reason: DISCONNECT_BY_PEER_TIMEOUT
2026-09-04 08:00:22.106 [INFO] Reconnect attempt 1 of 5 scheduled in 3000ms...`;

export const SAMPLE_SAML_LOG = `[2026-09-04 06:12:00] [IDP-SSO] Processing SAMLResponse from https://auth.workday.com/saml2
[2026-09-04 06:12:01] [IDP-SSO] Validating signature: SignatureMethod=RSA-SHA256
[2026-09-04 06:12:01] [IDP-SSO] Signature verified successfully with cert X509-Corp-2025
[2026-09-04 06:12:01] [ERROR] Conditions check failed: NotOnOrAfter condition breached
[2026-09-04 06:12:01] [ERROR] Assertion expired at 2026-09-04T05:59:59Z. Current server clock is 2026-09-04T06:12:01Z.
[2026-09-04 06:12:01] [FATAL] SAML_STATUS_INVALID_TOKEN: Clock skew or expired token (delta 722s > 300s tolerance)`;

// SVG encoded as Data URLs for crisp, beautiful image thumbnails without external network dependencies
export const SAMPLE_VPN_SCREENSHOT_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260">
  <rect width="400" height="260" fill="#0f172a" rx="8"/>
  <rect x="0" y="0" width="400" height="34" fill="#1e293b" rx="8"/>
  <circle cx="20" cy="17" r="5" fill="#ef4444"/>
  <circle cx="36" cy="17" r="5" fill="#f59e0b"/>
  <circle cx="52" cy="17" r="5" fill="#10b981"/>
  <text x="200" y="22" fill="#94a3b8" font-family="sans-serif" font-size="12" text-anchor="middle" font-weight="600">Cisco AnyConnect Secure Mobility Client</text>
  <rect x="24" y="54" width="352" height="182" fill="#1e293b" rx="6" stroke="#334155" stroke-width="1"/>
  <circle cx="64" cy="94" r="20" fill="#fee2e2"/>
  <path d="M64 84 L64 96 M64 102 L64 104" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/>
  <text x="100" y="90" fill="#f1f5f9" font-family="sans-serif" font-size="14" font-weight="bold">Connection Terminated</text>
  <text x="100" y="110" fill="#94a3b8" font-family="sans-serif" font-size="11">The secure gateway has terminated the connection.</text>
  <text x="100" y="126" fill="#ef4444" font-family="monospace" font-size="11">Error 0x8003402: DISCONNECT_BY_PEER</text>
  <rect x="280" y="186" width="80" height="30" fill="#4f46e5" rx="4"/>
  <text x="320" y="205" fill="#ffffff" font-family="sans-serif" font-size="12" text-anchor="middle" font-weight="600">Reconnect</text>
</svg>`);

export const SAMPLE_BADGE_PHOTO_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#f8fafc" rx="8"/>
  <rect x="16" y="16" width="268" height="268" fill="#e2e8f0" rx="8" stroke="#cbd5e1" stroke-width="2"/>
  <rect x="40" y="32" width="220" height="40" fill="#3b82f6" rx="4"/>
  <text x="150" y="58" fill="#ffffff" font-family="sans-serif" font-size="14" text-anchor="middle" font-weight="bold">ACME CORP ACCESS PASS</text>
  <circle cx="150" cy="140" r="45" fill="#94a3b8"/>
  <circle cx="150" cy="125" r="20" fill="#475569"/>
  <path d="M120 170 Q150 148 180 170 Z" fill="#475569"/>
  <text x="150" y="215" fill="#0f172a" font-family="sans-serif" font-size="14" text-anchor="middle" font-weight="bold">David Chen</text>
  <text x="150" y="235" fill="#64748b" font-family="sans-serif" font-size="11" text-anchor="middle">Site Reliability Engineer</text>
  <rect x="70" y="250" width="160" height="12" fill="#0f172a"/>
</svg>`);

export const SAMPLE_PDF_DATA_URL =
  'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA2NQo+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjEwMCA3MDAgVGROCihCdWlsZGluZyAmIFNlcnZlciBSb29tIEFjY2VzcyBSZXF1ZXN0IEZvcm0pIFRqCkUKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTggMDAwMDAgbiAKMDAwMDAwMDA2OCAwMDAwMCBuIAowMDAwMDAwMTI1IDAwMDAwIG4gCjAwMDAwMDAyMTQgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA1Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgozMjYKJSVFT0Y=';

export const SAMPLE_CONFIG_JSON = `{
  "vpn_profile": "Corporate-Primary",
  "gateway_host": "vpn.corporate.local",
  "port": 443,
  "dtls_enabled": true,
  "mtu": 1390,
  "session_timeout_seconds": 28800,
  "dns_search_domains": ["corporate.local", "internal.net"],
  "split_tunneling": {
    "enabled": true,
    "included_subnets": ["10.0.0.0/8", "172.16.0.0/12"]
  }
}`;

export const SAMPLE_METRICS_CSV = `timestamp,latency_ms,packet_loss_pct,jitter_ms,throughput_mbps
2026-09-04 07:45:00,18.4,0.0,1.2,142.5
2026-09-04 07:50:00,19.1,0.0,1.4,138.2
2026-09-04 07:55:00,42.8,2.1,6.8,84.1
2026-09-04 08:00:00,128.5,14.5,22.4,12.0
2026-09-04 08:00:22,999.0,100.0,0.0,0.0`;
