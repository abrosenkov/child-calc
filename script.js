const schedule = [
  {
    procedure: "HEXA 1",
    vaccines: "Diftéria, tetanus, čierny kašeľ, hepatitída B, hemofilové infekcie, poliomyelitída",
    interval: "3 mesiace",
    type: "months",
    value: 3,
  },
  {
    procedure: "HEXA 2",
    vaccines: "Diftéria, tetanus, čierny kašeľ, hepatitída B, hemofilové infekcie, poliomyelitída",
    interval: "presne cez 2 mesiace od 1. dávky",
    type: "months",
    value: 5,
  },
  {
    procedure: "HEXA 3",
    vaccines: "Diftéria, tetanus, čierny kašeľ, hepatitída B, hemofilové infekcie, poliomyelitída",
    interval: "presne cez 6 mesiacov od 2. dávky",
    type: "months",
    value: 11,
  },
  {
    procedure: "Pneumo 1",
    vaccines: "Pneumokok",
    interval: "3 mesiace",
    type: "months",
    value: 3,
  },
  {
    procedure: "Pneumo 2",
    vaccines: "Pneumokok",
    interval: "5 mesiacov",
    type: "months",
    value: 5,
  },
  {
    procedure: "Pneumo 3",
    vaccines: "Pneumokok",
    interval: "od 11. do 12. mesiaca života",
    type: "months",
    value: 11,
    endValue: 12,
  },
  {
    procedure: "Infanrix polio",
    vaccines: "Diftéria, tetanus, poliomyelitída",
    interval: "od 5 rokov do dovŕšenia 8 rokov",
    type: "years",
    value: 5,
    endValue: 8,
  },
  {
    procedure: "Boostrix polio",
    vaccines: "Diftéria, tetanus, poliomyelitída",
    interval: "od 12 rokov do dovŕšenia 14 rokov",
    type: "years",
    value: 12,
    endValue: 14,
  },
  {
    procedure: "MMR 1",
    vaccines: "Osýpky, mumps, ružienka",
    interval: "od 15. do 18. mesiaca života",
    type: "months",
    value: 15,
    endValue: 18,
  },
  {
    procedure: "MMR 2",
    vaccines: "Osýpky, mumps, ružienka",
    interval: "od 4 rokov do dovŕšenia 6 rokov",
    type: "years",
    value: 4,
    endValue: 6,
  },
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

const dateFormatter = new Intl.DateTimeFormat("sk-SK", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("sk-SK", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("sk-SK", {
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
  nearestPreview.textContent = "Zadajte dátum";
  nearestDate.textContent = "Výsledok sa zobrazí po výpočte";
});

function calculate() {
  const birthDate = getBirthDate();

  if (!birthDate) {
    return;
  }

  const rows = schedule.map((item) => {
    const startDate = addInterval(birthDate, item.type, item.value);
    const endDate = item.endValue
      ? addInterval(birthDate, item.type, item.endValue)
      : startDate;

    return {
      ...item,
      date: startDate,
      endDate,
      status: getStatus(startDate, endDate),
    };
  });

  const nearest = getNearestRow(rows);

  renderResults(rows, nearest, birthDate);
  resultSection.classList.add("active");
}

function getNearestRow(rows) {
  const activeOrFutureRows = rows.filter((item) => item.endDate >= today);

  if (activeOrFutureRows.length === 0) {
    return rows[rows.length - 1];
  }

  return activeOrFutureRows.reduce((nearest, item) => {
    if (item.date < today && nearest.date >= today) {
      return item;
    }

    if (nearest.date < today && item.date >= today) {
      return nearest;
    }

    return item.date < nearest.date ? item : nearest;
  });
}

function getBirthDate() {
  if (!birthDateInput.value) {
    setError("Vyberte dátum narodenia.");
    return null;
  }

  const date = stripTime(new Date(`${birthDateInput.value}T00:00:00`));

  if (Number.isNaN(date.getTime())) {
    setError("Dátum nie je zadaný správne.");
    return null;
  }

  if (date > today) {
    setError("Dátum narodenia nemôže byť v budúcnosti.");
    return null;
  }

  if (date.getFullYear() < 1900) {
    setError("Skontrolujte rok narodenia.");
    return null;
  }

  clearError();
  return date;
}

function renderResults(rows, nearest, birthDate) {
  resultBody.innerHTML = rows
    .map((item) => {
      const isNearest = item === nearest && item.endDate >= today;
      const statusClass = isNearest ? "nearest" : item.status.type;
      const rowClass = isNearest ? " class=\"nearest\"" : "";
      const statusLabel = isNearest && item.status.type === "future"
        ? "Najbližšie"
        : item.status.label;

      return `
        <tr${rowClass}>
          <td data-label="Procedúra">${item.procedure}</td>
          <td data-label="Proti čomu">${item.vaccines}</td>
          <td data-label="Vek / interval">${item.interval}</td>
          <td data-label="Dátum">${formatDateRange(item.date, item.endDate)}</td>
          <td data-label="Stav">
            <span class="status status--${statusClass}">${statusLabel}</span>
          </td>
        </tr>
      `;
    })
    .join("");

  childAge.textContent = `Vek dieťaťa: ${formatAge(birthDate, today)}`;
  nearestPreview.textContent = nearest.procedure;
  nearestDate.innerHTML = `${nearest.interval}: ${formatDateRange(nearest.date, nearest.endDate, true)}`;
}

function getStatus(startDate, endDate = startDate) {
  const daysToStart = Math.round((startDate - today) / 86400000);

  if (startDate <= today && today <= endDate) {
    return startDate.getTime() === endDate.getTime() && daysToStart === 0
      ? { type: "today", label: "Dnes" }
      : { type: "current", label: "Prebieha" };
  }

  if (endDate < today) {
    return { type: "past", label: "Uplynulo" };
  }

  return { type: "future", label: `O ${formatDays(daysToStart)}` };
}

function addInterval(date, type, value) {
  if (type === "months") {
    return addMonths(date, value);
  }

  if (type === "years") {
    return addMonths(date, value * 12);
  }

  return stripTime(new Date(date));
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

function formatDateRange(startDate, endDate, short = false) {
  const formatter = short ? shortDateFormatter : dateFormatter;
  const start = formatter.format(startDate);
  const startWithWeekday = `${start}, ${formatWeekday(startDate)}`;

  if (!endDate || startDate.getTime() === endDate.getTime()) {
    return startWithWeekday;
  }

  return `
    <span class="date-range">
      <span class="date-range__item">
        <span class="date-range__label">od</span>
        <span>${startWithWeekday}</span>
      </span>
      <span class="date-range__item">
        <span class="date-range__label">do</span>
        <span>${formatter.format(endDate)}, ${formatWeekday(endDate)}</span>
      </span>
    </span>
  `;
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
    parts.push(`${years} ${plural(years, ["rok", "roky", "rokov"])}`);
  }

  if (months > 0) {
    parts.push(`${months} ${plural(months, ["mesiac", "mesiace", "mesiacov"])}`);
  }

  if (days > 0 || parts.length === 0) {
    parts.push(`${days} ${plural(days, ["deň", "dni", "dní"])}`);
  }

  return parts.join(" ");
}

function formatDays(days) {
  return `${days} ${plural(days, ["deň", "dni", "dní"])}`;
}

function formatWeekday(date) {
  const weekday = weekdayFormatter.format(date);

  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

function plural(value, forms) {
  const absolute = Math.abs(value) % 100;

  if (absolute === 1) {
    return forms[0];
  }

  if (absolute > 1 && absolute < 5) {
    return forms[1];
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
