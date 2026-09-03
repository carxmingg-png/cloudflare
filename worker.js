// Cloudflare Worker for CarX License Keys & Database (Cloudflare KV Native)
// Generates, stores, and validates keys with 0ms latency directly on Cloudflare Edge

const DEFAULT_FEATURES = [
  "cash_gold",
  "level_xp",
  "unlock_clubs",
  "get_all_cars",
  "safe_repair",
  "battlepass",
  "streetpass_ep",
  "bulk_generate",
  "premium"
];

const MASTER_KEYS = ["admin-mingfu", "CARX_OWNER_KEY", "RMX_CARX_RYOMEN_ADD", "backupkey2026"];

const ALL_CAR_MODELS = [
  "toyotasupra2020","bmwm3e46","bmwm3e30","bmwm3e36","bmwe30","bmw340i",
  "bmwm240i","bmw2002","bmw1m","bmwm4","bmwm2","bmwm5e60","bmwm5e34",
  "bmwm6","bmw760li","bmwe46","bmw3series","bmw5series","toyotaae86",
  "toyotacelica","toyotamr2","toyotamarkii","toyotalandcruiser200",
  "toyotaav4","toyotatundra","toyotacamry","toyotacorolla","toyotacorollagts",
  "toyotagr86","toyotagrb","toyotasupraa70","toyotasupraa80","toyotayaris",
  "nissangtr","nissangtr35","nissan240sx","nissan350z","nissan370z",
  "nissansilvia","nissan180sx","nissanskyline","nissanskylinegtr",
  "nissangtrs15","nissangtrs14","nissanpatrol","nissanfrontier",
  "nissanfairladyz31","nissanfairladyz32","nissanfairladyz33",
  "hondacivic","hondaaccord","hondacrx","hondaintegra","hondnsx",
  "hondas2000","hondacr-v","hondafit","hondaprelude",
  "mazdamiata","mazdamx5","mazdamx6","mazdarx7","mazdarx8",
  "mazda6","mazda3","mazdaatenza","mazdabt50",
  "mitsubishieclipse","mitsubishievo9","mitsubishievo10","mitsubishigto",
  "mitsubishilancer","mitsubishimontero","mitsubishioutlander","mitsubishil200",
  "subaruimpreza","subaruimprezawrxsti","subarulegacy","subaruoutback",
  "subaruforester","subarubrz","subarutribeca",
  "audiа4","audi80","audirs4","audirs6","audirs7","auditt","audis3",
  "audis4","audis5","audis6","audis8","audia3","audia6","audia8",
  "audiq7","audiq8","audiR8",
  "mercedesbenzc63","mercedesbenzcla","mercedesbenzclk","mercedesbenzcls",
  "mercedesbenzsl","mercedesbenzsls","mercedesbenzsslk","mercedesbenzamg",
  "mercedesbenze55","mercedesbenze63","mercedesbenzeclass",
  "porsche911","porsche911gt3","porsche911turbo","porsche918","porscheboxter",
  "porschecayman","porschepanamera","porschecarreragts",
  "chevroletcamaro","chevroletcorvette","chevroletcorvettezo6",
  "chevroletcorvettezt1","chevroletsilverado","chevroleteq",
  "fordmustang","fordmustanggt500","fordgt","fordf150","fordf250",
  "fordfusion","fordtaurus",
  "dodgechallenger","dodgechargersrt","dodgecharger","dodgeviper",
  "dodgedurango","dodgeram1500",
  "jeepwrangler","jeepgrandcherokee","jeeprenegade",
  "lamborghiniavantador","lamborghinihuracan","lamborghiniuruss",
  "lamborghinimurcielago","lamborghinijalpa",
  "ferrariroma","ferrari488","ferrari458","ferrari430","ferrari360",
  "ferrari812","ferrariportofino","ferrarif8","ferrarif40","ferrarif50",
  "mclarensenna","mclaren720s","mclaren570s","mclaren600lt",
  "paganihuayra","paganizonda",
  "bugattichironss","bugattichiron","bugattichiropureblee","bugattiveyron",
  "koenigseggone1","koenigseggageras","koenigseggccr",
  "rollsroycephantom","rollsroycecullinan","rollsroyceghost",
  "bentleycontinentalgt","bentleybentayga",
  "astonmartindb11","astonmartinvantage","astonmartindbs",
  "maseratigranturismo","maseratileventegts",
  "alfaaguilajuliet","alfastelvio","alfa156","alfa159",
  "volkswagengolf4","volkswagenpassat","volkswagenscirocco",
  "volkswagentiguan","volkswagenid4",
  "renaultsportmegane","renaultsportclio","renaultkoleos",
  "peugeot207","peugeot206","peugeot508","peugeot3008",
  "citroenax","citroenc4","citroenxsara",
  "seatleoncupra","seatibiza","seatleon",
  "skodaoctaviars","skodakodiaq",
  "hyundaiveloster","hyundaigenesis","hyundaicoupetib","hyundaicelantra",
  "kiagts","kiastinger","kiaoptima","kiasorento",
  "lexusisf","lexusis300","lexusis200","lexuslc500","lexuslx",
  "infinitiq50","infinitifx","infinitg35",
  "acuratsx","acuransx","acurardx"
];

const CARX_API_BASE = "https://carx-id-prod.carx-online.com/api/auth";
const CARX_DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 12; Pixel 6 Build/SD1A.210817.036)",
  "Accept-Encoding": "gzip",
  "Connection": "Keep-Alive"
};

// In-memory cache to guarantee sub-millisecond responses
let _cachedDb = null;
let _cachedDbTime = 0;
const DB_CACHE_TTL_MS = 2000;

function getKv(env) {
  return env.KEYS_KV || env.CARX_KV || env.KV || env.DATABASE_KV || env.KEYS || null;
}

function getDefaultDb() {
  return {
    keys: {
      "admin-mingfu": {
        type: "admin",
        credits: -1,
        created_at: Math.floor(Date.now() / 1000),
        expires_at: null,
        claimed_users: [],
        claimed_by: null,
        max_claims: 999,
        duration: "lifetime",
        enabled_features: DEFAULT_FEATURES
      }
    },
    authorized_users: {},
    admins: ["admin-mingfu"],
    owners: ["admin-mingfu"],
    total_credits_used: 0,
    total_accounts_generated: 0
  };
}

async function loadKeysDb(env) {
  const now = Date.now();
  if (_cachedDb && (now - _cachedDbTime) < DB_CACHE_TTL_MS) {
    return _cachedDb;
  }

  const kv = getKv(env);
  if (kv) {
    try {
      const data = await kv.get("rymenbot_keys_db", { type: "json" });
      if (data && data.keys) {
        // Ensure master admin key is always present
        if (!data.keys["admin-mingfu"]) {
          data.keys["admin-mingfu"] = {
            type: "admin",
            credits: -1,
            created_at: Math.floor(Date.now() / 1000),
            expires_at: null,
            claimed_users: [],
            claimed_by: null,
            max_claims: 999,
            duration: "lifetime",
            enabled_features: DEFAULT_FEATURES
          };
        }
        _cachedDb = data;
        _cachedDbTime = now;
        return data;
      }
    } catch (err) {
      console.error("[KV ERROR] Failed to read keys from KV:", err);
    }
  }

  // Fallback to default in-memory database
  if (!_cachedDb) {
    _cachedDb = getDefaultDb();
    if (kv) {
      try {
        await kv.put("rymenbot_keys_db", JSON.stringify(_cachedDb));
      } catch (e) {
        console.error("[KV INIT ERROR]", e);
      }
    }
  }
  _cachedDbTime = now;
  return _cachedDb;
}

async function saveKeysDb(env, db) {
  _cachedDb = db;
  _cachedDbTime = Date.now();

  const kv = getKv(env);
  if (kv) {
    try {
      await kv.put("rymenbot_keys_db", JSON.stringify(db));
    } catch (err) {
      console.error("[KV ERROR] Failed to save keys to KV:", err);
    }
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
    }
  });
}

function generateLicenseKey(prefix = "CARXMING") {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (len = 4) => {
    let s = "";
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < len; i++) {
      s += chars[bytes[i] % chars.length];
    }
    return s;
  };
  const cleanPrefix = (prefix || "CARXMING").trim().toUpperCase().replace(/[-_]+$/, "");
  return `${cleanPrefix}-${part()}-${part()}-${part()}`;
}

function extractToken(request, body, url) {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      return parts[1].trim();
    }
    return authHeader.trim();
  }

  const queryToken = url.searchParams.get("adminToken") || url.searchParams.get("userToken") || url.searchParams.get("token");
  if (queryToken) return queryToken.trim();

  if (body) {
    const bToken = body.adminToken || body.userToken || body.token || body.sessionToken;
    if (bToken) return String(bToken).trim();
  }

  return null;
}

function isMasterAdmin(token, env) {
  if (!token) return false;
  const clean = token.trim();
  if (clean.toLowerCase() === "admin-mingfu") return true;
  if (MASTER_KEYS.includes(clean)) return true;
  if (env.OWNER_KEY && clean === env.OWNER_KEY.trim()) return true;
  return false;
}

async function verifyAuth(token, env, db) {
  if (!token) return { ok: false, role: null, key: null };
  const clean = token.trim();

  if (isMasterAdmin(clean, env)) {
    return { ok: true, role: "admin", key: clean, isOwner: true };
  }

  // Check if session token exists in active authorized users
  const session = db.authorized_users ? db.authorized_users[clean] : null;
  if (session) {
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && now > session.expires_at) {
      delete db.authorized_users[clean];
      await saveKeysDb(env, db);
      return { ok: false, role: null, key: null, expired: true };
    }
    const keyData = db.keys[session.key];
    const role = (keyData && keyData.type) || "user";
    return { ok: true, role, key: session.key, session };
  }

  // Check if raw token is an admin key in db.keys
  if (db.keys && db.keys[clean]) {
    const keyData = db.keys[clean];
    if (keyData.type === "admin" || keyData.type === "owner") {
      return { ok: true, role: "admin", key: clean };
    }
  }

  return { ok: false, role: null, key: null };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight options
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    // =========================================================================
    // API ROUTES (Powered natively by Cloudflare KV with zero external latency)
    // =========================================================================
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/") || url.pathname.startsWith("/verify-license") || url.pathname.startsWith("/cars")) {
      let body = {};
      if (request.method !== "GET" && request.method !== "HEAD") {
        try {
          body = await request.json();
        } catch {
          body = {};
        }
      }

      const db = await loadKeysDb(env);

      // -----------------------------------------------------------------------
      // 1. Verify License Key (Lock Screen & Auth)
      // -----------------------------------------------------------------------
      if (
        url.pathname === "/api/verify-license" ||
        url.pathname === "/verify-license" ||
        url.pathname === "/api/auth/verify" ||
        url.pathname === "/auth/verify"
      ) {
        const rawKey = body.key || body.licenseKey;
        if (!rawKey) {
          return jsonResponse({ success: false, error: "License key is required.", message: "License key is required." }, 400);
        }

        const cleanKey = String(rawKey).trim();

        // Master owner / admin bypass
        if (isMasterAdmin(cleanKey, env)) {
          return jsonResponse({
            success: true,
            role: "admin",
            token: cleanKey,
            sessionToken: cleanKey,
            message: "Owner access granted.",
            expiry: "Unlimited/Lifetime",
            expires_at: null,
            credits: -1,
            out_of_credits: false,
            enabled_features: DEFAULT_FEATURES
          });
        }

        // Validate key against Cloudflare KV database
        const keyData = db.keys ? db.keys[cleanKey] : null;
        if (!keyData) {
          return jsonResponse({ success: false, error: "Invalid key", message: "Invalid license key." }, 401);
        }

        const now = Math.floor(Date.now() / 1000);
        if (keyData.expires_at && now > keyData.expires_at) {
          return jsonResponse({ success: false, error: "Key expired", message: "This key has expired." }, 401);
        }

        const maxClaims = keyData.max_claims || 1;
        let claimedUsers = Array.isArray(keyData.claimed_users) ? [...keyData.claimed_users] : [];

        // Prune expired sessions
        let activeClaims = [];
        for (const t of claimedUsers) {
          const sess = db.authorized_users ? db.authorized_users[t] : null;
          if (sess) {
            if (sess.expires_at && now > sess.expires_at) {
              delete db.authorized_users[t];
            } else {
              activeClaims.push(t);
            }
          }
        }

        // Evict oldest session if maxClaims is reached
        while (activeClaims.length >= maxClaims) {
          const oldest = activeClaims.shift();
          if (oldest && db.authorized_users) {
            delete db.authorized_users[oldest];
          }
        }

        // Generate new secure session token
        const sessionToken = crypto.randomUUID();
        activeClaims.push(sessionToken);

        keyData.claimed_users = activeClaims;
        keyData.claimed_by = activeClaims[0] || null;

        if (!db.authorized_users) db.authorized_users = {};
        db.authorized_users[sessionToken] = {
          key: cleanKey,
          expires_at: keyData.expires_at || null
        };

        await saveKeysDb(env, db);

        const credits = keyData.credits !== undefined ? keyData.credits : 10;
        return jsonResponse({
          success: true,
          role: keyData.type || "user",
          token: sessionToken,
          sessionToken,
          credits,
          enabled_features: keyData.enabled_features || DEFAULT_FEATURES,
          message: "Access granted successfully.",
          expiry: keyData.expires_at ? new Date(keyData.expires_at * 1000).toLocaleString() : "Unlimited/Lifetime",
          expires_at: keyData.expires_at || null,
          out_of_credits: Boolean(keyData.out_of_credits || (credits !== -1 && credits <= 0))
        });
      }

      // -----------------------------------------------------------------------
      // 2. Auth Session Check & Balance
      // -----------------------------------------------------------------------
      if (url.pathname === "/api/auth/session" || url.pathname === "/auth/session") {
        const token = extractToken(request, body, url);
        if (!token) {
          return jsonResponse({ success: false, message: "Unauthorized. Session token missing." }, 401);
        }

        if (isMasterAdmin(token, env)) {
          return jsonResponse({
            success: true,
            role: "admin",
            valid: true,
            credits: -1,
            expires_at: null,
            enabled_features: DEFAULT_FEATURES
          });
        }

        const session = db.authorized_users ? db.authorized_users[token] : null;
        if (!session) {
          return jsonResponse({ success: false, message: "Session invalid or expired." }, 401);
        }

        const keyData = db.keys ? db.keys[session.key] : null;
        const credits = keyData && keyData.credits !== undefined ? keyData.credits : 10;
        return jsonResponse({
          success: true,
          role: (keyData && keyData.type) || "user",
          valid: true,
          token,
          credits,
          expires_at: session.expires_at || null,
          enabled_features: (keyData && keyData.enabled_features) || DEFAULT_FEATURES
        });
      }

      if (url.pathname === "/api/session/balance" || url.pathname === "/session/balance") {
        const token = extractToken(request, body, url);
        if (isMasterAdmin(token, env)) {
          return jsonResponse({
            success: true,
            credits: -1,
            role: "admin",
            out_of_credits: false,
            enabled_features: DEFAULT_FEATURES
          });
        }

        const session = db.authorized_users ? db.authorized_users[token] : null;
        if (!session) {
          return jsonResponse({ success: false, message: "Unauthorized" }, 401);
        }

        const keyData = db.keys ? db.keys[session.key] : null;
        const credits = keyData && keyData.credits !== undefined ? keyData.credits : 10;
        return jsonResponse({
          success: true,
          credits,
          role: (keyData && keyData.type) || "user",
          out_of_credits: Boolean(keyData && keyData.out_of_credits),
          enabled_features: (keyData && keyData.enabled_features) || DEFAULT_FEATURES
        });
      }

      // -----------------------------------------------------------------------
      // 3. Cars Catalog
      // -----------------------------------------------------------------------
      if (url.pathname === "/api/cars" || url.pathname === "/cars") {
        return jsonResponse({
          success: true,
          total: ALL_CAR_MODELS.length,
          cars: ALL_CAR_MODELS
        });
      }

      if (url.pathname === "/api/admin/cars-json") {
        return jsonResponse({
          success: true,
          total: ALL_CAR_MODELS.length,
          cars: ALL_CAR_MODELS
        });
      }

      if (url.pathname === "/api/admin/update-car-json") {
        return jsonResponse({ success: true, message: "Car catalog is up to date." });
      }

      // -----------------------------------------------------------------------
      // 4. Admin Key Management (Cloudflare KV direct operations)
      // -----------------------------------------------------------------------
      if (url.pathname === "/api/admin/keys" || url.pathname === "/admin/keys") {
        const token = extractToken(request, body, url);
        const auth = await verifyAuth(token, env, db);
        if (!auth.ok || auth.role !== "admin") {
          return jsonResponse({ success: false, message: "Forbidden. Admin access required." }, 403);
        }

        return jsonResponse({
          success: true,
          keys: db.keys || {},
          total_credits_used: db.total_credits_used || 0,
          total_accounts_generated: db.total_accounts_generated || 0
        });
      }

      if (url.pathname === "/api/admin/generate-key" || url.pathname === "/admin/generate-key") {
        const token = extractToken(request, body, url);
        const auth = await verifyAuth(token, env, db);
        if (!auth.ok || auth.role !== "admin") {
          return jsonResponse({ success: false, message: "Forbidden. Admin access required." }, 403);
        }

        const {
          type,
          duration_val,
          duration_unit,
          max_claims,
          maxClaims,
          enabled_features,
          features,
          custom_key,
          customKey,
          prefix
        } = body;

        const keyType = type || "user";
        let creditAmount = 10;
        if (body.credits !== undefined) creditAmount = parseInt(String(body.credits), 10);
        else if (body.tokens !== undefined) creditAmount = parseInt(String(body.tokens), 10);

        if (
          body.isUnlimited ||
          body.infiniteCredits ||
          body.unlimited ||
          creditAmount === -1 ||
          body.credits === "inf" ||
          body.credits === "unlimited"
        ) {
          creditAmount = -1;
        }

        // Parse duration
        let durationSeconds = null;
        let unit = duration_unit || "unlim";
        let val = duration_val ? parseInt(duration_val, 10) : 0;

        if (body.days !== undefined && body.days !== "") {
          val = parseInt(String(body.days), 10) || 0;
          unit = "d";
        }

        const rawDuration = body.duration || body.expiry;
        if (rawDuration && typeof rawDuration === "string") {
          const dLower = rawDuration.trim().toLowerCase();
          if (["lifetime", "unlimited", "unlim", "inf", "forever"].includes(dLower)) {
            unit = "unlim";
            val = 0;
          } else {
            const match = dLower.match(/^(\d+)\s*(h|hr|hrs|hours?|d|day|days?|m|min|mins|minutes?|mo|mon|months?|w|weeks?|y|years?)$/i);
            if (match) {
              val = parseInt(match[1], 10);
              const u = match[2].toLowerCase();
              if (u.startsWith("h")) unit = "h";
              else if (u.startsWith("d")) unit = "d";
              else if (u.startsWith("w")) { unit = "d"; val = val * 7; }
              else if (u.startsWith("mo")) unit = "mo";
              else if (u.startsWith("y")) { unit = "d"; val = val * 365; }
              else if (u.startsWith("m")) unit = "m";
            }
          }
        }

        if (unit === "m") durationSeconds = val * 60;
        else if (unit === "h") durationSeconds = val * 3600;
        else if (unit === "d") durationSeconds = val * 86400;
        else if (unit === "mo") durationSeconds = val * 30 * 86400;

        const keyPrefix = prefix || body.key_prefix || body.keyPrefix || "CARXMING";
        const rawKeyName = custom_key || customKey;
        let key = generateLicenseKey(keyPrefix);

        if (rawKeyName && String(rawKeyName).trim()) {
          const trimmed = String(rawKeyName).trim();
          if (db.keys && db.keys[trimmed]) {
            return jsonResponse({ success: false, message: `License key '${trimmed}' already exists.` }, 400);
          }
          key = trimmed;
        }

        const now = Math.floor(Date.now() / 1000);
        const expiresAt = durationSeconds ? now + durationSeconds : null;
        const featuresList = Array.isArray(enabled_features) ? enabled_features : (Array.isArray(features) ? features : DEFAULT_FEATURES);
        const claimsLimit = max_claims ? parseInt(max_claims, 10) : (maxClaims ? parseInt(maxClaims, 10) : 1);
        const durationLabel = unit === "unlim" ? "lifetime" : (unit === "d" ? `${val}d` : `${val}${unit}`);

        if (!db.keys) db.keys = {};
        db.keys[key] = {
          type: keyType,
          created_at: now,
          expires_at: expiresAt,
          claimed_users: [],
          claimed_by: null,
          max_claims: claimsLimit,
          duration: durationLabel,
          duration_unit: unit,
          duration_val: val || null,
          credits: creditAmount,
          out_of_credits: false,
          enabled_features: featuresList
        };

        await saveKeysDb(env, db);

        return jsonResponse({
          success: true,
          key,
          keys: [key],
          data: db.keys[key],
          created_at: now,
          expires_at: expiresAt,
          duration: durationLabel
        });
      }

      if (url.pathname === "/api/admin/delete-key" || url.pathname === "/admin/delete-key") {
        const token = extractToken(request, body, url);
        const auth = await verifyAuth(token, env, db);
        if (!auth.ok || auth.role !== "admin") {
          return jsonResponse({ success: false, message: "Forbidden. Admin access required." }, 403);
        }

        const { key } = body;
        if (!key) return jsonResponse({ success: false, message: "Key parameter is required." }, 400);
        if (isMasterAdmin(key, env)) return jsonResponse({ success: false, message: "Cannot delete master owner key." }, 403);

        if (db.keys && db.keys[key]) {
          const claimed = db.keys[key].claimed_users || [];
          for (const u of claimed) {
            if (db.authorized_users) delete db.authorized_users[u];
          }
          delete db.keys[key];
          await saveKeysDb(env, db);
        }

        return jsonResponse({ success: true, message: "Key successfully deleted." });
      }

      if (url.pathname === "/api/admin/bulk-delete-keys" || url.pathname === "/admin/bulk-delete-keys") {
        const token = extractToken(request, body, url);
        const auth = await verifyAuth(token, env, db);
        if (!auth.ok || auth.role !== "admin") {
          return jsonResponse({ success: false, message: "Forbidden. Admin access required." }, 403);
        }

        const { keys } = body;
        if (!keys || !Array.isArray(keys)) {
          return jsonResponse({ success: false, message: "Keys array is required." }, 400);
        }

        let deletedCount = 0;
        for (const k of keys) {
          if (!isMasterAdmin(k, env) && db.keys && db.keys[k]) {
            const claimed = db.keys[k].claimed_users || [];
            for (const u of claimed) {
              if (db.authorized_users) delete db.authorized_users[u];
            }
            delete db.keys[k];
            deletedCount++;
          }
        }

        await saveKeysDb(env, db);
        return jsonResponse({ success: true, message: `Successfully deleted ${deletedCount} keys.` });
      }

      if (url.pathname === "/api/admin/update-key" || url.pathname === "/admin/update-key") {
        const token = extractToken(request, body, url);
        const auth = await verifyAuth(token, env, db);
        if (!auth.ok || auth.role !== "admin") {
          return jsonResponse({ success: false, message: "Forbidden. Admin access required." }, 403);
        }

        const { key, enabled_features, features, max_claims, maxClaims, expires_at } = body;
        if (!key) return jsonResponse({ success: false, message: "Key parameter is required." }, 400);
        if (isMasterAdmin(key, env)) return jsonResponse({ success: false, message: "Cannot modify master owner key." }, 403);

        const keyData = db.keys ? db.keys[key] : null;
        if (!keyData) return jsonResponse({ success: false, message: "Key not found." }, 404);

        if (body.credits !== undefined) {
          keyData.credits = parseInt(String(body.credits), 10);
          if (keyData.credits === -1 || keyData.credits > 0) keyData.out_of_credits = false;
        }

        const featList = enabled_features ?? features;
        if (Array.isArray(featList)) keyData.enabled_features = featList;

        const claims = max_claims ?? maxClaims;
        if (claims !== undefined) keyData.max_claims = parseInt(String(claims), 10);

        if (expires_at !== undefined) {
          keyData.expires_at = expires_at === null ? null : parseInt(String(expires_at), 10);
        }

        db.keys[key] = keyData;
        await saveKeysDb(env, db);
        return jsonResponse({ success: true, message: "Key successfully updated.", data: keyData });
      }

      if (url.pathname === "/api/admin/strings" || url.pathname === "/admin/strings") {
        const kv = getKv(env);
        if (request.method === "GET") {
          let strings = {};
          if (kv) {
            try {
              strings = (await kv.get("admin_strings", { type: "json" })) || {};
            } catch {
              strings = {};
            }
          }
          return jsonResponse({ success: true, strings });
        } else {
          const token = extractToken(request, body, url);
          const auth = await verifyAuth(token, env, db);
          if (!auth.ok || auth.role !== "admin") {
            return jsonResponse({ success: false, message: "Forbidden. Admin access required." }, 403);
          }
          if (kv) {
            await kv.put("admin_strings", JSON.stringify(body.strings || body));
          }
          return jsonResponse({ success: true, message: "Strings updated successfully." });
        }
      }

      // -----------------------------------------------------------------------
      // 5. CarX Online API Proxy / Pass-Through
      // -----------------------------------------------------------------------
      if (url.pathname.startsWith("/api/carx/")) {
        // If a separate backend server is explicitly configured, forward CarX operations to it
        if (env.BACKEND_URL) {
          const targetUrl = new URL(url.pathname + url.search, env.BACKEND_URL);
          const headers = new Headers(request.headers);
          headers.set("Host", new URL(env.BACKEND_URL).host);

          try {
            return await fetch(targetUrl.toString(), {
              method: request.method,
              headers,
              body: request.method !== "GET" && request.method !== "HEAD" ? JSON.stringify(body) : undefined
            });
          } catch (err) {
            console.error("[BACKEND PROXY ERROR] Falling back to direct CarX ID API:", err);
          }
        }

        // Direct CarX Online API Handler (Serverless Edge execution)
        const subAction = url.pathname.replace("/api/carx/", "").replace("carx/", "");

        if (subAction === "login" || subAction === "register") {
          const { email, password, deviceId, uniqueId } = body;
          if (!email || !password) {
            return jsonResponse({ success: false, message: "Email and password are required." }, 400);
          }

          const devId = deviceId || Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');
          const uId = uniqueId || crypto.randomUUID().replace(/-/g, '');

          // Register device
          fetch(`${CARX_API_BASE}/register_device`, {
            method: "POST",
            headers: CARX_DEFAULT_HEADERS,
            body: JSON.stringify({ deviceId: devId, platform: "android", project: 4 })
          }).catch(() => {});

          const carxPayload = {
            username: email,
            password,
            deviceId: devId,
            uniqueId: uId,
            unipId: uId,
            unip_id: uId,
            platform: "android",
            project: 4
          };
          if (subAction === "register") {
            carxPayload.name = email.split("@")[0];
          }

          try {
            const res = await fetch(`${CARX_API_BASE}/${subAction}`, {
              method: "POST",
              headers: CARX_DEFAULT_HEADERS,
              body: JSON.stringify(carxPayload)
            });
            const data = await res.json().catch(() => ({}));
            return jsonResponse(data, res.status);
          } catch (e) {
            return jsonResponse({ success: false, message: "Could not connect to CarX servers.", error: e.message }, 502);
          }
        }

        if (subAction === "verify") {
          const { email, password, code, deviceId, uniqueId } = body;
          const devId = deviceId || Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');
          const uId = uniqueId || crypto.randomUUID().replace(/-/g, '');

          try {
            const res = await fetch(`${CARX_API_BASE}/verify_code`, {
              method: "POST",
              headers: CARX_DEFAULT_HEADERS,
              body: JSON.stringify({
                username: email,
                password,
                code,
                deviceId: devId,
                uniqueId: uId,
                platform: "android",
                project: 4
              })
            });
            const data = await res.json().catch(() => ({}));
            return jsonResponse(data, res.status);
          } catch (e) {
            return jsonResponse({ success: false, message: "CarX verification failed.", error: e.message }, 502);
          }
        }

        if (subAction === "profile") {
          const { token, userId, deviceId, uniqueId } = body;
          try {
            const res = await fetch(`${CARX_API_BASE}/profile`, {
              method: "POST",
              headers: {
                ...CARX_DEFAULT_HEADERS,
                authorization: token ? `Bearer ${token}` : ""
              },
              body: JSON.stringify({
                userId,
                deviceId: deviceId || "",
                uniqueId: uniqueId || "",
                platform: "android",
                project: 4
              })
            });
            const data = await res.json().catch(() => ({}));
            return jsonResponse(data, res.status);
          } catch (e) {
            return jsonResponse({ success: false, message: "Failed to fetch CarX profile.", error: e.message }, 502);
          }
        }

        if (subAction === "delete") {
          const { token, email, password } = body;
          try {
            const res = await fetch(`${CARX_API_BASE}/delete_account`, {
              method: "POST",
              headers: {
                ...CARX_DEFAULT_HEADERS,
                authorization: token ? `Bearer ${token}` : ""
              },
              body: JSON.stringify({ username: email, password, platform: "android", project: 4 })
            });
            const data = await res.json().catch(() => ({}));
            return jsonResponse(data, res.status);
          } catch (e) {
            return jsonResponse({ success: false, message: "CarX account deletion failed.", error: e.message }, 502);
          }
        }

        // Generic fallback for any other CarX endpoints
        return jsonResponse({
          success: false,
          message: "Operation completed or requires external backend."
        }, 200);
      }

      // Default 404 for unknown API endpoints
      return jsonResponse({ success: false, message: `Endpoint ${url.pathname} not found.` }, 404);
    }

    // =========================================================================
    // FRONTEND SINGLE PAGE APPLICATION (Static Assets)
    // =========================================================================
    return env.ASSETS.fetch(request);
  }
};
