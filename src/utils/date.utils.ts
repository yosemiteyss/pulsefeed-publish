export function parseRelativeDate(dateStr: string): Date | undefined {
  const now = new Date();
  const trimmed = dateStr.replace(/\s/g, '');

  let match = trimmed.match(/(\d+)(秒|分鐘|小時|日)前/);
  if (match) {
    const quantity = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case '秒':
        now.setSeconds(now.getSeconds() - quantity);
        return now;
      case '分鐘':
        now.setMinutes(now.getMinutes() - quantity);
        return now;
      case '小時':
        now.setHours(now.getHours() - quantity);
        return now;
      case '日':
        now.setUTCDate(now.getUTCDate() - quantity);
        return now;
    }
  }

  // Parse chinese date format: '2024年5月11日  17:19'.
  match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日\s+(\d{1,2}):(\d{1,2})/);
  if (match) {
    const [, year, month, day, hour, minute] = match;
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
    );
  }

  return undefined;
}
