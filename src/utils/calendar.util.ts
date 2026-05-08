
/**
 * Generates a Google Calendar Link for an event
 * @param title Event Title
 * @param date Event Date (Date object or ISO string)
 * @param description Event Description
 * @param location Event Location (URL or physical address)
 * @param durationMinutes Optional duration in minutes (default 60)
 */
export const generateGoogleCalendarLink = (
  title: string,
  date: Date | string,
  description: string,
  location: string,
  durationMinutes: number = 60
): string => {
  const startDate = new Date(date);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

  const formatToGCal = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: description,
    location: location,
    dates: `${formatToGCal(startDate)}/${formatToGCal(endDate)}`,
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
};
