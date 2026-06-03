const schedule = [
  { title: "Процедура через 72 часа", label: "72 часа", days: 3 },
  { title: "Процедура на 5-й неделе", label: "5 недель", weeks: 5 },
  { title: "Процедура на 8-й неделе", label: "8 недель", weeks: 8 },
  { title: "Процедура на 3-м месяце", label: "3 месяца", months: 3 },
  { title: "Процедура на 5-м месяце", label: "5 месяцев", months: 5 },
  { title: "Процедура на 7-м месяце", label: "7 месяцев", months: 7 },
  { title: "Процедура на 10-м месяце", label: "10 месяцев", months: 10 },
  { title: "Процедура на 12-м месяце", label: "12 месяцев", months: 12 },
  { title: "Процедура в 1.5 года", label: "1.5 года", months: 18 },
  { title: "Процедура в 2 года", label: "2 года", months: 24 },
  { title: "Процедура в 2.5 года", label: "2.5 года", months: 30 },
  { title: "Процедура в 3 года", label: "3 года", months: 36 },
  { title: "Процедура в 4 года", label: "4 года", months: 48 },
  { title: "Процедура в 4.5 года", label: "4.5 года", months: 54 },
  { title: "Процедура в 5 лет", label: "5 лет", months: 60 },
  { title: "Процедура в 5.5 лет", label: "5.5 лет", months: 66 },
  { title: "Процедура в 6.5 лет", label: "6.5 лет", months: 78 },
  { title: "Процедура в 7.5 лет", label: "7.5 лет", months: 90 },
];

const form = document.querySelector("#dateForm");
const birthDateInput = document.querySelector("#birthDate");
const dateError = document.querySelector("#dateError");
const clearButton = document.querySelector("#clearBtn");
const resultSection = document.querySelector("#resultSection");
const resultBody = document.querySelector("#resultBody");
const childAge = document.querySelector("#childAge");
const nearestPreview = document.querySelector("#nearestPreview");
const nearestDate = document.querySelector("#nearestDate");

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", {
  weekday: "long",
});

const today = stripTime(new Date());
birthDateInput.max = toInputDate(today);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculate();
});

birthDateInput.addEventListener("input", () => {
  clearError();

  if (birthDateInput.value) {
    calculate();
  }
});

clearButton.addEventListener("click", () => {
  form.reset();
  clearError();
  resultSection.classList.remove("active");
  resultBody.innerHTML = "";
  childAge.textContent = "";
  nearestPreview.textContent = "Укажите дату";
  nearestDate.textContent = "Результат появится после расчета";
  birthDateInput.focus();
});

function calculate() {
  const birthDate = getBirthDate();

  if (!birthDate) {
    return;
  }

  const rows = schedule.map((item) => {
    const date = getScheduleDate(birthDate, item);

    return {
      ...item,
      date,
      status: getStatus(date),
    };
  });

  const nearest = rows.find((item) => item.date >= today) ?? rows[rows.length - 1];

  renderResults(rows, nearest);
  resultSection.classList.add("active");
}

function getBirthDate() {
  if (!birthDateInput.value) {
    setError("Выберите дату рождения.");
    return null;
  }

  const date = stripTime(new Date(`${birthDateInput.value}T00:00:00`));

  if (Number.isNaN(date.getTime())) {
    setError("Дата указана некорректно.");
    return null;
  }

  if (date > today) {
    setError("Дата рождения не может быть в будущем.");
    return null;
  }

  if (date.getFullYear() < 1900) {
    setError("Проверьте год рождения.");
    return null;
  }

  clearError();
  return date;
}

function renderResults(rows, nearest) {
  resultBody.innerHTML = rows
    .map((item) => {
      const isNearest = item === nearest && item.date >= today;
      const statusClass = isNearest ? "nearest" : item.status.type;
      const rowClass = isNearest ? " class=\"nearest\"" : "";

      return `
        <tr${rowClass}>
          <td data-label="Этап">${item.title}</td>
          <td data-label="Возраст">${item.label}</td>
          <td data-label="Дата">${dateFormatter.format(item.date)}</td>
          <td data-label="День недели">${formatWeekday(item.date)}</td>
          <td data-label="Статус">
            <span class="status status--${statusClass}">${isNearest ? "Ближайшая" : item.status.label}</span>
          </td>
        </tr>
      `;
    })
    .join("");

  childAge.textContent = `Возраст ребенка: ${formatAge(getBirthDate(), today)}`;
  nearestPreview.textContent = nearest.title;
  nearestDate.textContent = `${nearest.label}: ${shortDateFormatter.format(nearest.date)}, ${formatWeekday(nearest.date)}`;
}

function getStatus(date) {
  const daysDiff = Math.round((date - today) / 86400000);

  if (daysDiff === 0) {
    return { type: "today", label: "Сегодня" };
  }

  if (daysDiff < 0) {
    return { type: "past", label: "Прошло" };
  }

  return { type: "future", label: `Через ${formatDays(daysDiff)}` };
}

function getScheduleDate(birthDate, item) {
  if (item.days) {
    return addDays(birthDate, item.days);
  }

  if (item.weeks) {
    return addDays(birthDate, item.weeks * 7);
  }

  return addMonths(birthDate, item.months);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return stripTime(result);
}

function addMonths(date, months) {
  const result = new Date(date);
  const originalDay = result.getDate();

  result.setMonth(result.getMonth() + months);

  if (result.getDate() !== originalDay) {
    result.setDate(0);
  }

  return stripTime(result);
}

function formatAge(from, to) {
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts = [];

  if (years > 0) {
    parts.push(`${years} ${plural(years, ["год", "года", "лет"])}`);
  }

  if (months > 0) {
    parts.push(`${months} ${plural(months, ["месяц", "месяца", "месяцев"])}`);
  }

  if (days > 0 || parts.length === 0) {
    parts.push(`${days} ${plural(days, ["день", "дня", "дней"])}`);
  }

  return parts.join(" ");
}

function formatDays(days) {
  return `${days} ${plural(days, ["день", "дня", "дней"])}`;
}

function formatWeekday(date) {
  const weekday = weekdayFormatter.format(date);

  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

function plural(value, forms) {
  const absolute = Math.abs(value) % 100;
  const last = absolute % 10;

  if (absolute > 10 && absolute < 20) {
    return forms[2];
  }

  if (last > 1 && last < 5) {
    return forms[1];
  }

  if (last === 1) {
    return forms[0];
  }

  return forms[2];
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function setError(message) {
  dateError.textContent = message;
  birthDateInput.setAttribute("aria-invalid", "true");
  resultSection.classList.remove("active");
}

function clearError() {
  dateError.textContent = "";
  birthDateInput.removeAttribute("aria-invalid");
}
