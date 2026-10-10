export function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function validateReservation({ startDate, endDate, renterName } = {}) {
  const isDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if (!isDate(startDate) || !isDate(endDate)) return "Dates must be valid YYYY-MM-DD calendar dates";
  if (startDate >= endDate) return "startDate must be before endDate";
  if (typeof renterName !== "string" || !renterName.trim()) return "A renter name is required";
  return null;
}