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
  const [year, month, day] = selectedDate.split('-').map(Number);

  for (let minutes = 5; minutes < 24 * 60; minutes += 35) {
    const utcDate = new Date(Date.UTC(year, month - 1, day, 0, minutes - 480));
    schedule.push(formatTimeInZone(utcDate, timeZone));
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

  const formattedDate = new Date(`${selectedDateValue}T00:00:00`).toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
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

  scheduleNote.textContent = `Converted from Philippine Time (UTC+8) to ${timezoneInput.options[timezoneInput.selectedIndex].textContent}.`;
}

function initDatePicker() {
  const scheduleDateInput = document.getElementById('scheduleDate');
  const timezoneInput = document.getElementById('timezone');
  const today = new Date();
  scheduleDateInput.value = today.toISOString().slice(0, 10);
  timezoneInput.addEventListener('change', renderSchedule);
  renderSchedule();
}

document.getElementById('scheduleDate').addEventListener('input', renderSchedule);
initDatePicker();
