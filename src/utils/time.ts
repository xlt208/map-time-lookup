export const formatTime = (timeZone: string, date: Date) => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
      timeZone,
    }).format(date);
  } catch (error) {
    console.error("Time format error:", error);
    return "Time zone unavailable";
  }
};
