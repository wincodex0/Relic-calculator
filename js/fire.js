const ALARM_LEAD_MINUTES = 1;
let alarmTimer = null;
let lastAlarmTimestamp = null;

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
      schedule.push({
        time: formatTimeInZone(spawnDate, timeZone),
        spawnDate: new Date(spawnDate.getTime())
      });
    }

    spawnDate = new Date(spawnDate.getTime() + cycleStep);
  }

  return schedule;
}

function playAlarmSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }

    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.value = 0.15;

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.5);

    oscillator.onended = () => {
      context.close();
    };
  } catch (error) {
    console.warn('Alarm sound could not play:', error);
  }
}

function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function showAlarmNotification(message) {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification('Fire Dungeon Alarm', {
      body: message,
      silent: true
    });
  }
}

function clearAlarmTimer() {
  if (alarmTimer) {
    clearTimeout(alarmTimer);
    alarmTimer = null;
  }
}

function triggerAlarm(entry) {
  if (!entry || lastAlarmTimestamp === entry.spawnDate.getTime()) {
    return;
  }

  lastAlarmTimestamp = entry.spawnDate.getTime();
  const message = `Dungeon opens at ${entry.time} — 1 minute remaining.`;
  const nextAlarmInfo = document.getElementById('nextAlarmInfo');

  playAlarmSound();
  showAlarmNotification(message);

  if (nextAlarmInfo) {
    nextAlarmInfo.textContent = message;
  }
}

function scheduleNextAlarm(schedule) {
  clearAlarmTimer();

  const enabled = document.getElementById('alarmEnabled')?.checked;
  const nextAlarmInfo = document.getElementById('nextAlarmInfo');

  if (!enabled) {
    if (nextAlarmInfo) {
      nextAlarmInfo.textContent = 'Alarm is disabled.';
    }
    return;
  }

  const now = Date.now();
  const leadMs = ALARM_LEAD_MINUTES * 60 * 1000;
  const upcoming = schedule.find((entry) => entry.spawnDate.getTime() > now);

  if (!upcoming) {
    if (nextAlarmInfo) {
      nextAlarmInfo.textContent = 'No more dungeon spawns today.';
    }
    return;
  }

  const alarmAt = upcoming.spawnDate.getTime() - leadMs;
  const timeUntilAlarm = alarmAt - now;

  if (nextAlarmInfo) {
    nextAlarmInfo.textContent = `Next alarm scheduled for ${upcoming.time} (${ALARM_LEAD_MINUTES} minute before spawn).`;
  }

  if (timeUntilAlarm <= 0) {
    triggerAlarm(upcoming);
    scheduleNextAlarm(schedule);
    return;
  }

  alarmTimer = setTimeout(() => {
    triggerAlarm(upcoming);
    scheduleNextAlarm(schedule);
  }, timeUntilAlarm);
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
  schedule.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'schedule-item';
    item.textContent = entry.time;
    scheduleList.appendChild(item);
  });

  scheduleNote.textContent = `The schedule follows a continuous 35-minute cycle in Philippine Time, with each selected date showing the exact spawns that fall on that calendar day. Times are converted to ${timezoneInput.options[timezoneInput.selectedIndex].textContent}.`;
  scheduleNextAlarm(schedule);

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
document.getElementById('alarmEnabled').addEventListener('change', () => {
  requestNotificationPermission();
  renderSchedule();
});
initDatePicker();
