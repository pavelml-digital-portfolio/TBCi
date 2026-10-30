export type Network = {
  id: string;
  name: string;
  feeAsset: string;
  fee: number;
  minimum: number;
  confirmations: number;
  format: "evm" | "btc" | "xrp" | "stellar" | "account";
  memo?: string;
};
const eth: Network = {
  id: "ethereum-sepolia",
  name: "Ethereum Sepolia · testnet",
  feeAsset: "ETH",
  fee: 0.0003,
  minimum: 0.001,
  confirmations: 3,
  format: "evm",
};
export function networksFor(symbol: string): Network[] {
  const native: Record<string, Network[]> = {
    BTC: [
      {
        id: "bitcoin-testnet",
        name: "Bitcoin · testnet",
        feeAsset: "BTC",
        fee: 0.00005,
        minimum: 0.0001,
        confirmations: 3,
        format: "btc",
      },
    ],
    ETH: [eth],
    BCH: [
      {
        id: "bch-testnet",
        name: "Bitcoin Cash · testnet",
        feeAsset: "BCH",
        fee: 0.00001,
        minimum: 0.0001,
        confirmations: 3,
        format: "btc",
      },
    ],
    LTC: [
      {
        id: "litecoin-testnet",
        name: "Litecoin · testnet",
        feeAsset: "LTC",
        fee: 0.0001,
        minimum: 0.001,
        confirmations: 3,
        format: "btc",
      },
    ],
    XRP: [
      {
        id: "xrp-testnet",
        name: "XRP Ledger · testnet",
        feeAsset: "XRP",
        fee: 0.01,
        minimum: 1,
        confirmations: 1,
        format: "xrp",
        memo: "Destination tag",
      },
    ],
    XLM: [
      {
        id: "stellar-testnet",
        name: "Stellar · testnet",
        feeAsset: "XLM",
        fee: 0.00001,
        minimum: 1,
        confirmations: 2,
        format: "stellar",
        memo: "Memo",
      },
    ],
    EOS: [
      {
        id: "eos-jungle",
        name: "EOS Jungle · testnet",
        feeAsset: "EOS",
        fee: 0.001,
        minimum: 0.01,
        confirmations: 2,
        format: "account",
        memo: "Memo",
      },
    ],
    USDT: [
      { ...eth, minimum: 1 },
      {
        id: "tron-nile",
        name: "TRON Nile · testnet",
        feeAsset: "TRX",
        fee: 1,
        minimum: 1,
        confirmations: 3,
        format: "account",
      },
    ],
    USD: [
      {
        id: "demo-bank",
        name: "Demo USD account",
        feeAsset: "USD",
        fee: 0,
        minimum: 1,
        confirmations: 1,
        format: "account",
      },
    ],
  };
  const extra: Record<
    string,
    [string, string, number, number, Network["format"]]
  > = {
    ADA: ["cardano-preprod", "Cardano preprod", 0.17, 1, "account"],
    XMR: ["monero-stagenet", "Monero stagenet", 0.0001, 0.001, "account"],
    TRX: ["tron-nile", "TRON Nile", 1, 1, "account"],
    NEO: ["neo-testnet", "NEO testnet", 0, 1, "account"],
    DASH: ["dash-testnet", "Dash testnet", 0.0001, 0.001, "account"],
    ZEC: ["zcash-testnet", "Zcash testnet", 0.0001, 0.001, "account"],
    ETC: ["etc-mordor", "Ethereum Classic Mordor", 0.0001, 0.001, "evm"],
    QTUM: ["qtum-testnet", "Qtum testnet", 0.001, 0.01, "account"],
    IOTA: ["iota-testnet", "IOTA testnet", 0.001, 0.01, "account"],
    ZIL: ["zilliqa-testnet", "Zilliqa testnet", 0.1, 1, "account"],
    BNB: ["bnb-testnet", "BNB testnet", 0.0005, 0.001, "evm"],
  };
  if (extra[symbol]) {
    const [id, name, fee, minimum, format] = extra[symbol];
    return [
      {
        id,
        name: name + " · demo",
        feeAsset: symbol,
        fee,
        minimum,
        format,
        confirmations: 3,
      },
    ];
  }
  return native[symbol] ?? [{ ...eth, minimum: 0.001 }];
}
export type TransferStatus = "confirming" | "completed" | "failed";
export type Transfer = {
  id: string;
  requestId: string;
  kind: "deposit" | "withdraw";
  symbol: string;
  network: string;
  address: string;
  memo: string;
  amount: number;
  fee: number;
  feeAsset: string;
  status: TransferStatus;
  confirmations: number;
  requiredConfirmations: number;
  createdAt: string;
  updatedAt: string;
  txHash: string;
  applied: boolean;
  origin: "sample" | "local";
  failure?: string;
};
export type TrustedAddress = {
  id: string;
  label: string;
  symbol: string;
  network: string;
  address: string;
  memo: string;
  createdAt: string;
};
export type AuditEvent = {
  id: string;
  date: string;
  category:
    | "wallet"
    | "security"
    | "profile"
    | "preferences"
    | "trading"
    | "session"
    | "verification";
  action: string;
  details: string;
  origin: "sample" | "local";
};
export type DemoSecurity = {
  twoFactorEnabled: boolean;
  totpSecret: string;
  recoveryHashes: string[];
  whitelistOnly: boolean;
  withdrawalsLocked: boolean;
  dailyLimitUsd: number;
};
export type Preferences = {
  currency: string;
  timezone: string;
  hideSmallBalances: boolean;
  notifications: {
    deposit: boolean;
    withdraw: boolean;
    trades: boolean;
    security: boolean;
    newsletter: boolean;
  };
};
export type DemoSession = {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
  revoked: boolean;
};
export const defaultSecurity: DemoSecurity = {
  twoFactorEnabled: false,
  totpSecret: "",
  recoveryHashes: [],
  whitelistOnly: false,
  withdrawalsLocked: false,
  dailyLimitUsd: 50000,
};
export const defaultPreferences: Preferences = {
  currency: "USD",
  timezone: "UTC",
  hideSmallBalances: false,
  notifications: {
    deposit: true,
    withdraw: true,
    trades: true,
    security: true,
    newsletter: false,
  },
};
export const defaultSessions: DemoSession[] = [
  {
    id: "current-browser",
    device: "This browser",
    location: "Local demo session",
    lastActive: "",
    current: true,
    revoked: false,
  },
  {
    id: "sample-laptop",
    device: "Chrome · sample laptop",
    location: "Example device",
    lastActive: "2018-12-27T14:02:00Z",
    current: false,
    revoked: false,
  },
  {
    id: "sample-phone",
    device: "Safari · sample phone",
    location: "Example device",
    lastActive: "2018-12-19T10:45:00Z",
    current: false,
    revoked: false,
  },
];
export function sampleTransfers(): Transfer[] {
  return [
    "2018-01-12",
    "2018-02-20",
    "2018-04-08",
    "2018-05-23",
    "2018-07-11",
    "2018-09-19",
    "2018-11-02",
    "2018-12-20",
  ].map((date, i) => ({
    id: "sample-transfer-" + i,
    requestId: "sample-transfer-" + i,
    kind: i % 3 === 0 ? "withdraw" : "deposit",
    symbol: i % 2 ? "ETH" : "BTC",
    network: i % 2 ? "ethereum-sepolia" : "bitcoin-testnet",
    address:
      i % 2
        ? "0x00000000000000000000000000000000000000dE"
        : "tb1qdemohistoricaladdress00000000000000000000",
    memo: "",
    amount: i % 2 ? 0.5 + i * 0.12 : 0.02 + i * 0.008,
    fee: i % 3 === 0 ? (i % 2 ? 0.0003 : 0.00005) : 0,
    feeAsset: i % 2 ? "ETH" : "BTC",
    status: "completed",
    confirmations: 3,
    requiredConfirmations: 3,
    createdAt: date + "T12:00:00Z",
    updatedAt: date + "T12:04:00Z",
    txHash: "demo_archive_" + i,
    applied: true,
    origin: "sample",
  }));
}
export function sampleAudit(): AuditEvent[] {
  return sampleTransfers()
    .slice(-4)
    .map((t) => ({
      id: "audit-" + t.id,
      date: t.updatedAt,
      category: "wallet",
      action:
        t.kind === "deposit" ? "Deposit confirmed" : "Withdrawal confirmed",
      details: t.amount + " " + t.symbol + " · archived example",
      origin: "sample",
    }));
}
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function createSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  let bits = 0,
    value = 0,
    out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}
export async function totp(secret: string, now = Date.now()) {
  let bits = 0,
    value = 0;
  const bytes: number[] = [];
  for (const c of secret.toUpperCase().replaceAll(" ", "")) {
    const index = alphabet.indexOf(c);
    if (index < 0) throw new Error("Invalid demo secret");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  const counter = Math.floor(now / 30000);
  const data = new Uint8Array(8);
  new DataView(data.buffer).setBigUint64(0, BigInt(counter));
  const key = await crypto.subtle.importKey(
    "raw",
    Uint8Array.from(bytes),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
  const offset = mac.at(-1)! & 15;
  const n =
    ((mac[offset] & 127) << 24) |
    (mac[offset + 1] << 16) |
    (mac[offset + 2] << 8) |
    mac[offset + 3];
  return String(n % 1000000).padStart(6, "0");
}
export async function verifyTotp(
  secret: string,
  code: string,
  now = Date.now(),
) {
  if (!/^\d{6}$/.test(code)) return false;
  for (const shift of [-1, 0, 1])
    if ((await totp(secret, now + shift * 30000)) === code) return true;
  return false;
}
export async function hashCode(code: string) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(code.trim().toUpperCase()),
      ),
    ),
  ]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export function createRecoveryCodes() {
  return Array.from({ length: 8 }, () =>
    [...crypto.getRandomValues(new Uint8Array(8))]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase(),
  );
}
export function mockAddress(network: Network, seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const bytes = Array.from({ length: 40 }, (_, i) => {
    h = Math.imul(h ^ (i + 1), 16777619);
    return Math.abs(h) % 16;
  });
  const hex = bytes.map((b) => b.toString(16)).join("");
  if (network.format === "evm") return "0x" + hex;
  if (network.format === "btc")
    return "tb1q" + hex.replaceAll("1", "p").replaceAll("b", "q") + "demo";
  if (network.format === "xrp") return "rDemo" + hex.slice(0, 28);
  if (network.format === "stellar")
    return "GDEMO" + hex.toUpperCase() + hex.slice(0, 11).toUpperCase();
  return "demo_" + network.id.replaceAll("-", "_") + "_" + hex.slice(0, 16);
}
export function validateAddress(network: Network, address: string) {
  const a = address.trim();
  if (network.format === "evm") return /^0x[0-9a-fA-F]{40}$/.test(a);
  if (network.format === "btc")
    return /^(tb1|m|n|2)[a-zA-Z0-9]{20,80}$/.test(a);
  if (network.format === "xrp") return /^r[a-zA-Z0-9]{20,40}$/.test(a);
  if (network.format === "stellar") return /^G[A-Z0-9]{40,60}$/.test(a);
  return /^[a-zA-Z0-9_.-]{6,80}$/.test(a);
}
export const sameAddress = (a: string, b: string) =>
  a.startsWith("0x") && b.startsWith("0x")
    ? a.toLowerCase() === b.toLowerCase()
    : a === b;
export function qrPayload(
  symbol: string,
  network: string,
  address: string,
  memo = "",
) {
  return (
    "tbci-demo://deposit?" +
    new URLSearchParams({
      asset: symbol,
      network,
      address,
      ...(memo ? { memo } : {}),
    }).toString()
  );
}
export function downloadData(name: string, body: string, mime = "text/plain") {
  const url = URL.createObjectURL(new Blob([body], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
