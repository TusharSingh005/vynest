export function calculateBookingFee(propertyType, roomType) {
  const normalizedPropertyType = (propertyType || "").toLowerCase();
  const normalizedRoomType = (roomType || "").toLowerCase();

  if (normalizedPropertyType === "hostel") {
    return 7000;
  }

  if (normalizedPropertyType === "pg_no_food") {
    return 1000;
  }

  if (normalizedPropertyType === "pg_with_food") {
    return 2000;
  }

  if (normalizedPropertyType === "flat") {
    if (normalizedRoomType.includes("1")) return 3000;
    if (normalizedRoomType.includes("2")) return 4000;
    if (normalizedRoomType.includes("3")) return 5000;
    if (normalizedRoomType.includes("4")) return 5000;
  }

  return null;
}

export function isValidDateInput(value) {
  if (typeof value !== "string") {
    return false;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function toPositiveNumber(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

function getFirstAmountFromKeys(source, keys) {
  if (!source || typeof source !== "object") {
    return null;
  }

  for (const key of keys) {
    const parsed = toPositiveNumber(source[key]);

    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function parseJsonEnvMap(rawValue) {
  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.error("Invalid JSON env map", error);
    return {};
  }
}

function getCashfreeMappedAmount(env, formCode) {
  if (!formCode || typeof formCode !== "string") {
    return null;
  }

  const map = parseJsonEnvMap(env.CASHFREE_FORM_AMOUNT_MAP_JSON);
  return toPositiveNumber(map[formCode]);
}

export function resolveBookingAmount({ room, selectedRoom, env }) {
  const testAmount = toPositiveNumber(env.PAYMENT_TEST_AMOUNT);

  if (testAmount) {
    return { amount: testAmount, source: "PAYMENT_TEST_AMOUNT" };
  }

  const formCode =
    (selectedRoom && typeof selectedRoom.formCode === "string" && selectedRoom.formCode.trim()) ||
    (room && typeof room.formCode === "string" && room.formCode.trim()) ||
    null;

  const mappedAmount = getCashfreeMappedAmount(env, formCode);

  if (mappedAmount) {
    return {
      amount: mappedAmount,
      source: "CASHFREE_FORM_AMOUNT_MAP_JSON",
      formCode
    };
  }

  const adminAmount =
    getFirstAmountFromKeys(selectedRoom, ["bookingFee", "bookingAmount", "paymentAmount", "amount"]) ||
    getFirstAmountFromKeys(room, ["bookingFee", "bookingAmount", "paymentAmount", "amount"]);

  if (adminAmount) {
    return { amount: adminAmount, source: "ROOM_ADMIN_CONFIG" };
  }

  const fallbackAmount = calculateBookingFee(room?.propertyType, selectedRoom?.type);

  if (fallbackAmount) {
    return { amount: fallbackAmount, source: "RULE_BASED_FALLBACK" };
  }

  return { amount: null, source: "UNRESOLVED" };
}
