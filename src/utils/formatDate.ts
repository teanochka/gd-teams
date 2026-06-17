const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const dateTimeWithYearFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
});

const startOfDay = (date: Date) => {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
};

export const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const now = new Date();
  const dayDifference = Math.round(
    (startOfDay(now) - startOfDay(date)) / 86_400_000,
  );
  const time = timeFormatter.format(date);

  if (dayDifference === 0) {
    return `Сегодня, ${time}`;
  }

  if (dayDifference === 1) {
    return `Вчера, ${time}`;
  }

  if (date.getFullYear() === now.getFullYear()) {
    return dateTimeFormatter.format(date);
  }

  return dateTimeWithYearFormatter.format(date);
};
