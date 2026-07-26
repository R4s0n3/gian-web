export const STUDIO_TIME_ZONE = "Europe/Berlin";
export const STUDIO_TIME_ZONE_LABEL = "Berlin time (CET/CEST)";

function wallTimeParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value);

  return {
    year: part("year"),
    month: part("month"),
    day: part("day"),
    hour: part("hour"),
    minute: part("minute"),
    second: part("second"),
  };
}

function offsetAt(date: Date, timeZone: string) {
  const wallTime = wallTimeParts(date, timeZone);

  return (
    Date.UTC(
      wallTime.year,
      wallTime.month - 1,
      wallTime.day,
      wallTime.hour,
      wallTime.minute,
      wallTime.second,
    ) - date.getTime()
  );
}

/**
 * Interpret an HTML date/time pair as studio wall time, independent of the
 * visitor's browser timezone, then return the corresponding UTC instant.
 */
export function studioLocalTimeToIso(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error("Choose a valid studio date and time");
  }

  const wallClockAsUtc = new Date(`${date}T${time}:00.000Z`);
  if (Number.isNaN(wallClockAsUtc.getTime())) {
    throw new Error("Choose a valid studio date and time");
  }

  const firstOffset = offsetAt(wallClockAsUtc, STUDIO_TIME_ZONE);
  let instant = new Date(wallClockAsUtc.getTime() - firstOffset);
  const resolvedOffset = offsetAt(instant, STUDIO_TIME_ZONE);

  if (resolvedOffset !== firstOffset) {
    instant = new Date(wallClockAsUtc.getTime() - resolvedOffset);
  }

  const roundTrip = wallTimeParts(instant, STUDIO_TIME_ZONE);
  const roundTripDate = [
    roundTrip.year,
    String(roundTrip.month).padStart(2, "0"),
    String(roundTrip.day).padStart(2, "0"),
  ].join("-");
  const roundTripTime = [
    String(roundTrip.hour).padStart(2, "0"),
    String(roundTrip.minute).padStart(2, "0"),
  ].join(":");

  if (roundTripDate !== date || roundTripTime !== time) {
    throw new Error(
      `That wall time does not exist in ${STUDIO_TIME_ZONE_LABEL}; choose another time`,
    );
  }

  return instant.toISOString();
}
