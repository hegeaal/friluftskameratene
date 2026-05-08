export type WeatherDay = {
  date: string;
  precipitationMm: number;
};

export type PackingItem = {
  name: string;
  reason?: string;
};

const RAIN_THRESHOLD_MM = 0.5;

export function applyWeatherTriggers(
  baseList: PackingItem[],
  forecast: WeatherDay[],
): PackingItem[] {
  const rainyDay = forecast.find((d) => d.precipitationMm >= RAIN_THRESHOLD_MM);
  if (!rainyDay) return baseList;

  const alreadyHasRainGear = baseList.some((item) =>
    item.name.toLowerCase().includes("regntøy"),
  );
  if (alreadyHasRainGear) return baseList;

  return [
    ...baseList,
    { name: "Regntøy", reason: `Regn spådd ${rainyDay.date}` },
  ];
}
