// Cloudflare Worker for CarX License Keys, Database (Cloudflare KV Native), and Direct Injection Engine
// Generates, stores, validates keys and executes CarX profile injections directly on Cloudflare Edge

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

const CATALOG_86_CARS = [
  'toyotasupra2020', 'nissan180sx', 'bmw_m3_e36', 'nissan300zx', 'skyliner32',
  'golfgti', 'nissansilvias13', 'toyotasuprarz', 'chevycamaro70', 'dodgechallengerrt',
  'silvias15', 'mazdarx7', 'bmwe31', 'mitsubishievo6', 'toyotamark2_100',
  'lamborghinievo', 'civicek9', 'nissanz31', 'mitsubishievo9', 'toyotagr86',
  'hondas2000', 'mustang350', 'bmwm4g82', 'nissan400z', 'porsche911',
  'bmwm5f90', 'skyliner35', 'bmwm5x5', 'audir8', 'lamborghinidiablo',
  'bmwe46m3', 'porschesinger', 'audirs6avantc7', 'toyotagt86', 'mercedesbenz190evo2',
  'vantage', 'chevroletcamaro2016', 'corvettec7', 'mustang650', 'lexuslfa',
  'maloor82015', 'mclaren720s', 'charger', 'nissanskyline2000gtx', 'porsche911gt3',
  'ae86', 'skyliner34', 'bmwm5e60', 'corvettec6', 'vipersrt10',
  'bmwm4', 'fordgt_mk2', 'mbgelandewagenw463', 'lamborghiniaventadors', 'tesla_s_plaid',
  'bmw_z4_e86', 'nissan350z', 'mazdarx7_fc', 'bmw_i8', 'bmwe30m3',
  'mercedesbenzamggt2019', 'subaruwrxsti', 'mitsubishievox', 'mazdarx8', 'nissanskyliner33vspec',
  'infinity_q60', 'bmwm5e34', 'mustang_hoonigan', 'viper', 'chevroletchevelless1970',
  'jaguar_ftype', 'corvettec3', 'audirs7', 'hotrod', 'toyotayarisgr2020',
  'toyotasupraa70', 'fordfocusst2019', 'lotuselise', 'bmwm2g87', 'dodgecharger2020',
  'alfaromeogiuliagtam', 'mustangs197', 'bmwm6e24', 'lexusrcf', 'mclarenf1',
  'buickgnx'
];

const ALL_CLUBS = [
  "club_speedstar_energy", "club_grip_masters", "club_chimeras", "club_savage",
  "club_hyper_sonic", "club_spitfire", "club_drift_united", "club_falcons_outlaws",
  "club_pitons", "club_pythons", "club_speedline_syndicate", "club_streethunters",
  "club_white_tigers", "club_21_tribe", "club_road_runner", "club_western_sierra",
  "club_wild_juniors", "club_union_underground", "club_kanjo_spirit"
];

const DEFAULT_HOUSES = [
  "apartment_95", "house_01", "house_02", "house_03", "house_04", "house_05", "house_06"
];

const INTRO_QUESTS = [
  "car_choice_intro", "move_to_apartment_intro_quest",
  "move_to_gasstation_intro_quest", "move_to_tuning_intro_quest",
  "move_to_club_intro_quest"
];

const GAME_BASE_URL = "https://street-prod.carx-online.com/str/v1/client";
const CARX_API_BASE = "https://carx-id-prod.carx-online.com/api/auth";

const CARX_DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 12; Pixel 6 Build/SD1A.210817.036)",
  "Accept-Encoding": "gzip",
  "Connection": "Keep-Alive"
};

const STREETPASS_BODY = JSON.stringify({
  gameVersion: "1.20.0",
  purchaseId: "GPA.3304-3406-9941-41674",
  productId: "com.carxtech.sr.bank.event.bp",
  transactionData: "naooopliblhmhlhjphaiblip.AO-J1Owuw7bYU69mo6A_woU7wHx6NDEZPS_Io-HzmDgWudqOLG_3tEEwEqMihq1eHZlasQ97qUvkuma4CCPraosxDFlQEKipqw",
  transactionId: "naooopliblhmhlhjphaiblip.AO-J1Owuw7bYU69mo6A_woU7wHx6NDEZPS_Io-HzmDgWudqOLG_3tEEwEqMihq1eHZlasQ97qUvkuma4CCPraosxDFlQEKipqw",
  subscription: false,
  metaInfo: JSON.stringify({
    json: JSON.stringify({
      packageName: "com.carxtech.sr",
      productId: "com.carxtech.sr.bank.event.bp",
      purchaseTime: 1776223964504,
      purchaseState: 0,
      purchaseToken: "naooopliblhmhlhjphaiblip.AO-J1Owuw7bYU69mo6A_woU7wHx6NDEZPS_Io-HzmDgWudqOLG_3tEEwEqMihq1eHZlasQ97qUvkuma4CCPraosxDFlQEKipqw",
      quantity: 1,
      acknowledged: false,
      orderId: "GPA.3304-3406-9941-41674"
    }),
    signature: "fAlvYHDSE9y+tbPxNYtpI97ompnSrfSkR3AerW5pAatwNtihN6jOb8eXYvLCQxAyc7sK/jU87m9hz6Co4Vig3OvIh74bPm2Z+1y8oGcNNUvyIpQlqV85j4x2PFzbFU0//TCraeAfJOn2mOlHZqMqQ1Fpb2oh1wN6PhMtkQt56Pcg/J6gEpBhhVuU31Om02lW17oj3phKx4KXMbcgvqQ81gLhdos82BKSD7u/VPsnJevKEu5cGC273dh0AmxUUJPRVryeg+ucln6jJLgL+qmH1F71qb7IZ0duAkX3usw/rYY7Luhg0puo9NjW/xt+dblckah5adr/IrL3f1cpfe/xfQ==",
    skuDetails: [
      JSON.stringify({
        productId: "com.carxtech.sr.bank.event.bp",
        type: "inapp",
        title: "Street Pass (CarX Street)",
        name: "Street Pass",
        description: "Street Pass",
        price: "Rp 99.000",
        price_amount_micros: 99000000000,
        price_currency_code: "IDR"
      })
    ]
  }),
  marketType: "GOOGLE",
  productType: 0
});

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
    const bToken = body.userToken || body.adminToken || body.token || body.sessionToken;
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

  if (db.keys && db.keys[clean]) {
    const keyData = db.keys[clean];
    if (keyData.type === "admin" || keyData.type === "owner") {
      return { ok: true, role: "admin", key: clean };
    }
    return { ok: true, role: keyData.type || "user", key: clean };
  }

  return { ok: false, role: null, key: null };
}

function fToken(token) {
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

function calculateLevelFromExp(exp) {
  if (exp <= 0) return 1;
  if (exp >= 93060) return 50;
  const lvl = Math.floor(Math.sqrt(exp / 37.224));
  return Math.max(1, Math.min(50, lvl));
}

// Deep unwrap helper for CarX server response structures
function deepUnwrap(obj, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 4) return null;
  if (obj.resources && typeof obj.resources === "object") {
    const r = obj.resources;
    const hasResourceKeys = Object.keys(r).some(k => r[k] !== undefined && r[k] !== null);
    if (hasResourceKeys) return obj;
  }
  if (obj.cars || obj.clubs || obj.date_time || obj.car_models) return obj;
  for (const key of ["d", "data", "profile", "result", "body", "content"]) {
    if (obj[key] && typeof obj[key] === "object") {
      const found = deepUnwrap(obj[key], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

// Fetch user profile from CarX server
async function getCarXProfile(token, userId, deviceId, uniqueId) {
  const headers = { ...CARX_DEFAULT_HEADERS, "Authorization": fToken(token) };
  if (deviceId) { headers["Device-Id"] = deviceId; headers["X-Device-Id"] = deviceId; }
  if (uniqueId) { headers["Unique-Id"] = uniqueId; headers["X-Unique-Id"] = uniqueId; }

  const tryRequest = async (url, method) => {
    try {
      const body = method === "POST" ? JSON.stringify({}) : undefined;
      const res = await fetch(url, { headers, method, body });
      if (res.status !== 200 && res.status !== 201) return null;
      const data = await res.json().catch(() => null);
      if (!data) return null;

      let isWrappedInD = false;
      let isWrappedInData = false;
      let inner = data;
      if (data.d !== undefined) { inner = data.d; isWrappedInD = true; }
      else if (data.data !== undefined) { inner = data.data; isWrappedInData = true; }

      if (inner && typeof inner === "object") {
        if (inner.resources && typeof inner.resources === "object" && Object.keys(inner.resources).length > 0) {
          return { profile: inner, response: res, isWrappedInD, isWrappedInData };
        }
        const deepInner = deepUnwrap(inner);
        if (deepInner && deepInner.resources) {
          return { profile: deepInner, response: res, isWrappedInD, isWrappedInData };
        }
        return { profile: inner, response: res, isWrappedInD, isWrappedInData };
      }

      const deep = deepUnwrap(data);
      if (deep) return { profile: deep, response: res, isWrappedInD: false, isWrappedInData: false };
      return null;
    } catch {
      return null;
    }
  };

  if (userId) {
    const numericId = typeof userId === "string" ? userId.replace(/\D/g, "") : String(userId);
    const urls = [];
    if (numericId && numericId !== userId) urls.push(`${GAME_BASE_URL}/profiles/${numericId}`);
    urls.push(`${GAME_BASE_URL}/profiles/${userId}`);

    for (const url of urls) {
      const gRes = await tryRequest(url, "GET");
      if (gRes) return gRes;
      const pRes = await tryRequest(url, "POST");
      if (pRes) return pRes;
    }
  }

  const gFallback = await tryRequest(`${GAME_BASE_URL}/profiles`, "GET");
  if (gFallback) return gFallback;
  const pFallback = await tryRequest(`${GAME_BASE_URL}/profiles`, "POST");
  if (pFallback) return pFallback;

  return { profile: null, response: null, isWrappedInD: true, isWrappedInData: false };
}

// Upload modified profile back to CarX server
async function uploadCarXProfile(token, profile, userId, getResponse, isWrappedInD = true, isWrappedInData = false, deviceId, uniqueId) {
  const headers = {
    ...CARX_DEFAULT_HEADERS,
    "Authorization": fToken(token)
  };
  if (deviceId) { headers["Device-Id"] = deviceId; headers["X-Device-Id"] = deviceId; }
  if (uniqueId) { headers["Unique-Id"] = uniqueId; headers["X-Unique-Id"] = uniqueId; }

  if (getResponse && getResponse.headers) {
    const etag = getResponse.headers.get("ETag");
    if (etag) { headers["ETag"] = etag; headers["If-Match"] = etag; }
    const profileVer = getResponse.headers.get("X-Profile-Version");
    if (profileVer) headers["X-Profile-Version"] = profileVer;
    else headers["X-Profile-Version"] = "1";
    const xVer = getResponse.headers.get("X-Version");
    if (xVer) headers["X-Version"] = xVer;
  } else {
    headers["X-Profile-Version"] = "1";
  }

  const bodyStr = JSON.stringify(profile);
  const urls = [`${GAME_BASE_URL}/profiles`];
  if (userId) {
    const numericId = typeof userId === "string" ? userId.replace(/\D/g, "") : String(userId);
    if (numericId && numericId !== userId) urls.push(`${GAME_BASE_URL}/profiles/${numericId}`);
    urls.push(`${GAME_BASE_URL}/profiles/${userId}`);
  }

  for (const url of urls) {
    try {
      const res = await fetch(url, { method: "POST", headers, body: bodyStr });
      if (res.status === 200 || res.status === 201) {
        const text = await res.text().catch(() => "");
        return { success: true, response: text };
      }
    } catch {
      // try next url
    }
  }

  return { success: false, response: null };
}

// Verify StreetPass & EP
async function verifyStreetPass(token, bodyObj, deviceId, uniqueId) {
  try {
    const headers = {
      "Host": "street-prod.carx-online.com",
      "User-Agent": "UnityPlayer/6000.0.64f1 (UnityWebRequest/1.0, libcurl/8.10.1-DEV)",
      "Accept": "*/*",
      "Accept-Encoding": "deflate, gzip",
      "Content-Type": "application/json",
      "Authorization": fToken(token),
      "X-Unity-Version": "6000.0.64f1"
    };
    if (deviceId) { headers["Device-Id"] = deviceId; headers["X-Device-Id"] = deviceId; }
    if (uniqueId) { headers["Unique-Id"] = uniqueId; headers["X-Unique-Id"] = uniqueId; }

    const res = await fetch(`${GAME_BASE_URL}/purchases/verify`, {
      method: "POST",
      headers,
      body: JSON.stringify(bodyObj)
    });
    return res.status === 200 || res.status === 201;
  } catch {
    return false;
  }
}

function ensureCarToRealEstateSlot(profile) {
  profile.car_to_real_estate_slot = profile.car_to_real_estate_slot || {};
  profile.car_to_real_estate_slot.keys = Array.isArray(profile.car_to_real_estate_slot.keys) ? profile.car_to_real_estate_slot.keys : [];
  profile.car_to_real_estate_slot.values = Array.isArray(profile.car_to_real_estate_slot.values) ? profile.car_to_real_estate_slot.values : [];
}

function assignCarToFreeSlot(profile, carId) {
  const typedCarId = typeof profile.current_car_id === "number" ? parseInt(carId, 10) : carId;
  const carStr = carId.toString();

  profile.real_estates = profile.real_estates || {};
  profile.real_estate_slots = profile.real_estate_slots || {};
  ensureCarToRealEstateSlot(profile);

  const existingIdx = profile.car_to_real_estate_slot.keys.findIndex(k => k.toString() === carStr);
  if (existingIdx !== -1) {
    const slot = profile.car_to_real_estate_slot.values[existingIdx];
    if (slot && profile.real_estate_slots[slot]) {
      profile.real_estate_slots[slot].unlocked = true;
      profile.real_estate_slots[slot].car_id = typedCarId;
      return slot;
    }
  }

  let slots = Object.keys(profile.real_estate_slots);
  const slotsInUse = new Set();
  for (const k of (profile.car_to_real_estate_slot.keys || [])) {
    const idx2 = profile.car_to_real_estate_slot.keys.indexOf(k);
    if (idx2 !== -1) slotsInUse.add(profile.car_to_real_estate_slot.values[idx2]);
  }

  let targetSlot = "";
  for (const slot of slots) {
    if (!slotsInUse.has(slot) && !profile.real_estate_slots[slot]?.car_id) {
      targetSlot = slot;
      break;
    }
  }

  if (!targetSlot) {
    profile.real_estates["apartment_95"] = profile.real_estates["apartment_95"] || { is_bought: true };
    profile.real_estates["apartment_95"].is_bought = true;
    profile.real_estate_slots["apartment_95_slot_0"] = profile.real_estate_slots["apartment_95_slot_0"] || { unlocked: true };
    profile.real_estate_slots["apartment_95_slot_0"].unlocked = true;
    targetSlot = "apartment_95_slot_0";
  }

  profile.real_estate_slots[targetSlot] = profile.real_estate_slots[targetSlot] || {};
  profile.real_estate_slots[targetSlot].unlocked = true;
  profile.real_estate_slots[targetSlot].car_id = typedCarId;

  const kIdx = profile.car_to_real_estate_slot.keys.findIndex(k => k.toString() === carStr);
  if (kIdx !== -1) {
    profile.car_to_real_estate_slot.values[kIdx] = targetSlot;
  } else {
    profile.car_to_real_estate_slot.keys.push(typedCarId);
    profile.car_to_real_estate_slot.values.push(targetSlot);
  }

  return targetSlot;
}

// Modify player profile in memory
function modifyProfile(base, mods, userId) {
  let profile = structuredClone(base || {});
  profile.date_time = new Date().toISOString().replace("T", " ").substring(0, 19);

  if (!profile.resources) {
    profile.resources = {
      soft: { amount: 21000 },
      hard: { amount: 0 },
      experience: { award_index: 1, amount: 0 }
    };
  }
  if (!profile.resources.soft) profile.resources.soft = { amount: 21000 };
  if (!profile.resources.hard) profile.resources.hard = { amount: 0 };
  if (!profile.resources.experience) profile.resources.experience = { award_index: 1, amount: 0 };

  // Cash injection
  if (mods.cash !== undefined && mods.cash !== null) {
    let cashVal = Number(mods.cash);
    if (cashVal > 2140000000) cashVal = 2140000000;
    profile.resources.soft.amount = cashVal;
  }

  // Gold injection
  if (mods.gold !== undefined && mods.gold !== null) {
    let goldVal = Number(mods.gold);
    if (goldVal > 2140000000) goldVal = 2140000000;
    profile.resources.hard.amount = goldVal;
  }

  // Level & Exp injection
  if (mods.exp !== undefined && mods.exp !== null) {
    let expVal = Number(mods.exp);
    if (expVal > 93060) expVal = 93060;
    profile.resources.experience.amount = expVal;
  }
  if (mods.level !== undefined && mods.level !== null) {
    let lvlVal = Number(mods.level);
    if (lvlVal > 50) lvlVal = 50;
    profile.resources.experience.award_index = lvlVal;
  }

  // Clubs unlock
  if (mods.unlock_clubs) {
    profile.clubs = profile.clubs || {};
    ALL_CLUBS.forEach(club => {
      profile.clubs[club] = profile.clubs[club] || {};
      profile.clubs[club].cars = profile.clubs[club].cars || {};
      profile.clubs[club].available_races = profile.clubs[club].available_races || {};
      profile.clubs[club].complete_races = profile.clubs[club].complete_races || {};
      profile.clubs[club].car_statistics = profile.clubs[club].car_statistics || {};
      profile.clubs[club].club_completed = true;
      profile.clubs[club].reward_collected = false;
    });
  }

  // Houses unlock
  if (mods.unlock_houses || mods.get_all_cars) {
    profile.real_estates = profile.real_estates || {};
    for (const h of DEFAULT_HOUSES) {
      profile.real_estates[h] = { is_bought: true };
      for (let s = 0; s <= 5; s++) {
        const slotKey = `${h}_slot_${s}`;
        profile.real_estate_slots = profile.real_estate_slots || {};
        profile.real_estate_slots[slotKey] = profile.real_estate_slots[slotKey] || { unlocked: true };
        profile.real_estate_slots[slotKey].unlocked = true;
      }
    }
  }

  // Intro Quests auto-complete
  if (mods.get_all_cars || mods.unlock_houses || mods.safe_repair) {
    profile.quests = profile.quests || {};
    INTRO_QUESTS.forEach(q => {
      profile.quests[q] = profile.quests[q] || {};
      profile.quests[q].completed = true;
      profile.quests[q].rewarded = true;
      profile.quests[q].trigger = profile.quests[q].trigger || {};
    });
  }

  // All Cars injection
  if (mods.get_all_cars) {
    profile.cars = profile.cars || { seed: 0, items: {} };
    profile.cars.items = profile.cars.items || {};

    const existingDescIds = new Set(
      Object.values(profile.cars.items).map(item => item?.__desc_id).filter(Boolean)
    );

    for (let i = 0; i < CATALOG_86_CARS.length; i++) {
      const descId = CATALOG_86_CARS[i];
      if (!existingDescIds.has(descId)) {
        const existingIds = Object.keys(profile.cars.items).map(id => parseInt(id, 10)).filter(id => !isNaN(id));
        const newId = existingIds.length > 0 ? (Math.max(...existingIds) + 1).toString() : (1000 + i).toString();
        profile.cars.items[newId] = {
          __desc_id: descId,
          miles: 0,
          customizations: {},
          is_favorite: false
        };
        existingDescIds.add(descId);
      }
    }

    const carsItems = profile.cars.items;
    const carIds = Object.keys(carsItems).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    for (const carId of carIds) {
      assignCarToFreeSlot(profile, carId);
    }
  }

  // Single Car injection
  if (mods.inject_car) {
    profile.cars = profile.cars || { seed: 0, items: {} };
    profile.cars.items = profile.cars.items || {};
    const existingIds = Object.keys(profile.cars.items).map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    const newId = existingIds.length > 0 ? (Math.max(...existingIds) + 1).toString() : "1000";
    profile.cars.items[newId] = {
      __desc_id: mods.inject_car,
      miles: 0,
      customizations: {},
      is_favorite: false
    };
    assignCarToFreeSlot(profile, newId);
  }

  // Selected Multiple Cars injection
  if (mods.inject_cars && Array.isArray(mods.inject_cars)) {
    profile.cars = profile.cars || { seed: 0, items: {} };
    profile.cars.items = profile.cars.items || {};
    for (let i = 0; i < mods.inject_cars.length; i++) {
      const cId = mods.inject_cars[i];
      const existingIds = Object.keys(profile.cars.items).map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      const newId = existingIds.length > 0 ? (Math.max(...existingIds) + 1).toString() : (1000 + i).toString();
      profile.cars.items[newId] = {
        __desc_id: cId,
        miles: 0,
        customizations: {},
        is_favorite: false
      };
      assignCarToFreeSlot(profile, newId);
    }
  }

  // Random Cars injection
  if (mods.random_cars_count && mods.random_cars_count > 0) {
    profile.cars = profile.cars || { seed: 0, items: {} };
    profile.cars.items = profile.cars.items || {};
    const existingDescIds = new Set(
      Object.values(profile.cars.items).map(item => item?.__desc_id).filter(Boolean)
    );
    const available = CATALOG_86_CARS.filter(c => !existingDescIds.has(c));
    const toInject = available.slice(0, mods.random_cars_count);

    for (let i = 0; i < toInject.length; i++) {
      const cId = toInject[i];
      const existingIds = Object.keys(profile.cars.items).map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      const newId = existingIds.length > 0 ? (Math.max(...existingIds) + 1).toString() : (1000 + i).toString();
      profile.cars.items[newId] = {
        __desc_id: cId,
        miles: 0,
        customizations: {},
        is_favorite: false
      };
      assignCarToFreeSlot(profile, newId);
    }
  }

  // Profile Style (Avatar, Banner, Frame)
  if (mods.unlock_profile_style) {
    if (mods.avatar) profile.avatar = mods.avatar;
    if (mods.banner) profile.banner = mods.banner;
    if (mods.frame) profile.frame = mods.frame;
  }

  return profile;
}

// Extract human-friendly profile stats
function extractProfileStats(profile) {
  let res = profile.resources || null;
  if (!res && profile.profile) res = profile.profile.resources || null;
  if (!res && profile.data) res = profile.data.resources || null;

  let cash = res?.soft?.amount ?? res?.soft ?? profile.cash ?? 21000;
  let gold = res?.hard?.amount ?? res?.hard ?? profile.gold ?? 0;
  let level = res?.experience?.award_index ?? profile.level ?? 1;
  let exp = res?.experience?.amount ?? profile.exp ?? 0;

  return {
    cash: Number(cash) || 0,
    gold: Number(gold) || 0,
    level: Number(level) || 1,
    exp: Number(exp) || 0,
    name: profile.name || profile.nickname || profile.username || "Player",
    lastUpdated: profile.date_time || new Date().toISOString()
  };
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
    if (
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/auth/") ||
      url.pathname.startsWith("/verify-license") ||
      url.pathname.startsWith("/cars")
    ) {
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
      // 5. CarX Online API & Profile Injection Engine
      // -----------------------------------------------------------------------
      if (url.pathname.startsWith("/api/carx/")) {
        const subAction = url.pathname.replace("/api/carx/", "").replace("carx/", "");

        // 5a. Login & Register
        if (subAction === "login" || subAction === "register") {
          const { email, password, deviceId, uniqueId } = body;
          if (!email || !password) {
            return jsonResponse({ success: false, message: "Email and password are required." }, 400);
          }

          const devId = deviceId || Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');
          const uId = uniqueId || crypto.randomUUID().replace(/-/g, '');

          // Register device in background
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

        // 5b. Verify Code
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

        // 5c. Fetch Profile
        if (subAction === "profile") {
          const { token, userId, deviceId, uniqueId } = body;
          const profileResult = await getCarXProfile(token, userId, deviceId, uniqueId);
          if (profileResult && profileResult.profile) {
            const stats = extractProfileStats(profileResult.profile);
            return jsonResponse({ success: true, profile: profileResult.profile, profileStats: stats });
          }
          return jsonResponse({ success: false, message: "Could not fetch profile from CarX servers." }, 404);
        }

        // 5d. Delete Account
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

        // 5e. Extract Account
        if (subAction === "extract-account") {
          const { email, password } = body;
          if (!email || !password) {
            return jsonResponse({ success: false, message: "Email and password required" }, 400);
          }
          try {
            const loginRes = await fetch(`${CARX_API_BASE}/login`, {
              method: "POST",
              headers: CARX_DEFAULT_HEADERS,
              body: JSON.stringify({
                username: email,
                password,
                deviceId: "8473829102938472",
                platform: "android",
                project: 4
              })
            });
            const loginData = await loginRes.json().catch(() => ({}));
            if (!loginData.token) {
              return jsonResponse({ success: false, message: loginData.message || "Invalid credentials" }, 400);
            }
            const prof = await getCarXProfile(loginData.token, loginData.userId);
            return jsonResponse({
              success: true,
              profile: prof.profile,
              nickname: prof.profile?.nickname || email.split("@")[0],
              carx_id: loginData.userId
            });
          } catch (e) {
            return jsonResponse({ success: false, message: e.message }, 500);
          }
        }

        // 5f. Direct Injection Engine (Cash, Gold, EXP, Level, Clubs, Cars, Safe Repair, Styles)
        if (subAction === "inject") {
          const {
            token,
            userId,
            service_type,
            custom_amount,
            deviceId,
            uniqueId,
            unlock_houses = false,
            unlock_clubs = false,
            get_all_cars = false,
            unlock_streetpass = false,
            inject_ep = false,
            unlock_profile_style = false,
            inject_car,
            inject_cars,
            avatar,
            banner,
            frame,
            random_cars_count,
            cash,
            gold,
            exp
          } = body;

          if (!token || !service_type) {
            return jsonResponse({ success: false, message: "Token and service_type are required." }, 400);
          }

          // Check user license authorization and credits
          const userAuthToken = extractToken(request, body, url);
          const isOwner = isMasterAdmin(userAuthToken, env);
          let keyData = null;
          let licenseKeyName = null;

          if (!isOwner) {
            const session = db.authorized_users ? db.authorized_users[userAuthToken] : null;
            if (session) {
              licenseKeyName = session.key;
              keyData = db.keys[session.key];
            } else if (db.keys && db.keys[userAuthToken]) {
              licenseKeyName = userAuthToken;
              keyData = db.keys[userAuthToken];
            }

            if (!keyData) {
              return jsonResponse({ success: false, message: "Unauthorized. Valid license key required for injection." }, 401);
            }
          }

          // Credit cost computation
          const creditCostMap = {
            cash: 2,
            gold: 2,
            custom_resource: 0,
            exp: 1,
            level: 1,
            unlock_clubs: 3,
            get_all_cars: 4,
            safe_repair: 1,
            battlepass: 5,
            custom_ep: 2,
            inject_all: 3,
            inject_everything: 15,
            premium: 5,
            unlock_profile_style: 3,
            inject_car: 1,
            inject_cars: 1,
            inject_random_cars: 2
          };

          let creditCost = creditCostMap[service_type] || 1;
          if (service_type === "inject_cars" && Array.isArray(inject_cars)) {
            creditCost = Math.max(1, inject_cars.length);
          } else if (service_type === "custom_resource") {
            creditCost = 0;
            if (cash !== undefined && cash !== null) creditCost += 1;
            if (gold !== undefined && gold !== null) creditCost += 1;
            if (exp !== undefined && exp !== null) creditCost += 1;
            if (unlock_streetpass) creditCost += 5;
            if (unlock_houses || unlock_clubs) creditCost += 3;
            if (get_all_cars) creditCost += 4;
            if (creditCost === 0) creditCost = 1;
          }

          if (!isOwner && keyData) {
            const currentCredits = keyData.credits !== undefined ? keyData.credits : 10;
            if (currentCredits !== -1 && currentCredits < creditCost) {
              return jsonResponse({
                success: false,
                message: `Insufficient credits. This injection requires ${creditCost} credits, but your key has ${currentCredits}.`
              }, 402);
            }
          }

          // Trigger StreetPass if requested
          if (unlock_streetpass || service_type === "battlepass" || service_type === "custom_ep") {
            await verifyStreetPass(token, JSON.parse(STREETPASS_BODY), deviceId, uniqueId);
          }

          // Fetch profile from CarX server
          const profileResult = await getCarXProfile(token, userId, deviceId, uniqueId);
          let { profile, response, isWrappedInD, isWrappedInData } = profileResult;

          if (!profile && service_type !== "safe_repair") {
            return jsonResponse({ success: false, message: "Could not download player profile from CarX servers. Turn off the game client and try again." }, 400);
          }

          // Build modification options
          let mods = {
            unlock_houses,
            unlock_clubs,
            get_all_cars
          };

          let successMsg = "Injection applied successfully!";

          if (service_type === "cash") {
            const amt = custom_amount ? parseInt(custom_amount, 10) : 99000000;
            mods.cash = amt;
            successMsg = `Successfully injected ${amt.toLocaleString()} Cash!`;
          } else if (service_type === "gold") {
            const amt = custom_amount ? parseInt(custom_amount, 10) : 99000000;
            mods.gold = amt;
            successMsg = `Successfully injected ${amt.toLocaleString()} Gold!`;
          } else if (service_type === "exp" || service_type === "level") {
            const amt = custom_amount ? parseInt(custom_amount, 10) : 93060;
            mods.level = 50;
            mods.exp = amt;
            successMsg = `Successfully boosted Level to 50 (${amt.toLocaleString()} EXP)!`;
          } else if (service_type === "unlock_clubs") {
            mods.unlock_clubs = true;
            successMsg = "Successfully completed all 19 Clubs!";
          } else if (service_type === "get_all_cars") {
            mods.get_all_cars = true;
            mods.unlock_houses = true;
            successMsg = "Successfully added all catalog cars and unlocked all houses!";
          } else if (service_type === "custom_resource") {
            if (cash !== undefined && cash !== null) mods.cash = Number(cash);
            if (gold !== undefined && gold !== null) mods.gold = Number(gold);
            if (exp !== undefined && exp !== null) {
              mods.exp = Number(exp);
              mods.level = calculateLevelFromExp(Number(exp));
            }
            successMsg = "✅ Custom resources injected successfully!";
          } else if (service_type === "safe_repair") {
            mods.cash = 99000000;
            mods.gold = 99000000;
            mods.level = 50;
            mods.exp = 93060;
            mods.unlock_clubs = true;
            mods.unlock_houses = true;
            mods.safe_repair = true;
            successMsg = "✅ Safe Profile Repair completed! Injected 99M Cash, 99M Gold, Level 50 & repaired garage slots.";
          } else if (service_type === "unlock_profile_style") {
            mods.unlock_profile_style = true;
            mods.avatar = avatar;
            mods.banner = banner;
            mods.frame = frame;
            successMsg = "✅ Profile custom styles applied successfully!";
          } else if (service_type === "inject_car") {
            mods.inject_car = inject_car;
            successMsg = `✅ Car "${inject_car}" added to your garage!`;
          } else if (service_type === "inject_cars") {
            mods.inject_cars = inject_cars;
            successMsg = `✅ Successfully injected ${inject_cars.length} cars into your garage!`;
          } else if (service_type === "inject_random_cars") {
            mods.random_cars_count = parseInt(random_cars_count, 10) || 10;
            successMsg = `✅ Injected ${mods.random_cars_count} random cars into your garage!`;
          } else if (service_type === "inject_all" || service_type === "inject_everything") {
            mods.cash = 99000000;
            mods.gold = 99000000;
            mods.level = 50;
            mods.exp = 93060;
            mods.unlock_clubs = true;
            mods.get_all_cars = true;
            mods.unlock_houses = true;
            successMsg = "🌟 Fully injected account! 99M Cash, 99M Gold, Level 50, all cars, all clubs, and all houses unlocked!";
          }

          // Execute modify and upload
          const modified = modifyProfile(profile, mods, userId);
          const upload = await uploadCarXProfile(token, modified, userId, response, isWrappedInD, isWrappedInData, deviceId, uniqueId);

          if (upload.success) {
            // Deduct credits from KV
            if (!isOwner && keyData) {
              if (keyData.credits !== -1) {
                keyData.credits = Math.max(0, keyData.credits - creditCost);
                if (keyData.credits === 0) keyData.out_of_credits = true;
              }
              db.total_credits_used = (db.total_credits_used || 0) + creditCost;
              await saveKeysDb(env, db);
            }

            const remainingCredits = isOwner ? -1 : (keyData ? keyData.credits : 10);
            const stats = extractProfileStats(modified);
            return jsonResponse({
              success: true,
              message: successMsg,
              stats,
              credits: remainingCredits
            });
          }

          return jsonResponse({ success: false, message: "Failed to upload injected profile to CarX server. Please close the game on your device and try again." }, 400);
        }

        return jsonResponse({ success: false, message: `CarX action ${subAction} not recognized.` }, 404);
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
