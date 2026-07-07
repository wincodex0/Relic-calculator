function formatTimeInZone(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

function buildFullDaySchedule(timeZone, selectedDate) {
  const schedule = [];
  const cycleStart = new Date('2026-07-07T00:05:00+08:00');
  const selectedDateStart = new Date(`${selectedDate}T00:00:00+08:00`);
  const selectedDateEnd = new Date(selectedDateStart.getTime() + 24 * 60 * 60 * 1000);
  const cycleStep = 35 * 60 * 1000;

  let spawnDate = new Date(cycleStart.getTime());

  while (spawnDate < selectedDateStart) {
    spawnDate = new Date(spawnDate.getTime() + cycleStep);
  }

  while (spawnDate < selectedDateEnd) {
    if (spawnDate >= selectedDateStart) {
      schedule.push(formatTimeInZone(spawnDate, timeZone));
    }

    spawnDate = new Date(spawnDate.getTime() + cycleStep);
  }

  return schedule;
}

function renderSchedule() {
  const scheduleList = document.getElementById('scheduleList');
  const scheduleDateInput = document.getElementById('scheduleDate');
  const timezoneInput = document.getElementById('timezone');
  const dayLabel = document.getElementById('dayLabel');
  const scheduleNote = document.getElementById('scheduleNote');

  const selectedDateValue = scheduleDateInput.value;
  if (!selectedDateValue) {
    return;
  }

  const formattedDate = new Date(`${selectedDateValue}T00:00:00+08:00`).toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Manila'
  });

  dayLabel.textContent = formattedDate;
  scheduleList.innerHTML = '';

  const schedule = buildFullDaySchedule(timezoneInput.value, selectedDateValue);
  schedule.forEach((time) => {
    const item = document.createElement('div');
    item.className = 'schedule-item';
    item.textContent = time;
    scheduleList.appendChild(item);
  });

  scheduleNote.textContent = `The schedule follows a continuous 35-minute cycle in Philippine Time, with each selected date showing the exact spawns that fall on that calendar day. Times are converted to ${timezoneInput.options[timezoneInput.selectedIndex].textContent}.`;
}

function initDatePicker() {
  const scheduleDateInput = document.getElementById('scheduleDate');
  const timezoneInput = document.getElementById('timezone');
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  scheduleDateInput.value = `${year}-${month}-${day}`;
  timezoneInput.addEventListener('change', renderSchedule);
  renderSchedule();
}

document.getElementById('scheduleDate').addEventListener('input', renderSchedule);
initDatePicker();
