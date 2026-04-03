setTimeout(() => {
  const carga = document.querySelector('.carga');
  carga.style.display = 'none';
}, 9000); // 2000 = 2 segundos

setTimeout(() => {
  const carga = document.querySelector('.carga');
  carga.classList.add('ocultar');
}, 2000);

document.addEventListener('DOMContentLoaded', () => {
  const btnUnidades = document.querySelector('.alter-unidades');
  const menuUnidades = document.querySelector('.unidades-menu');
  const opcionesUnidades = Array.from(document.querySelectorAll('.unidad-opcion'));
  const listaHoraria = document.getElementById('lista-horaria');
  const btnDiaHoraria = document.getElementById('seleccio-de-prevision-horaria');
  const inputBuscar = document.getElementById('city-input');
  const btnBuscar = document.getElementById('search-button');

  const cardFeels = document.getElementById('feels-like');
  const cardHum = document.getElementById('humidity');
  const cardWind = document.getElementById('wind-speed');
  const cardPrecip = document.getElementById('precipitation');
  const tempMain = document.getElementById('main-temp');
  const placeName = document.getElementById('place-name');

  const state = {
    tempUnit: 'c',
    windUnit: 'Km/h',
    precipUnit: 'mm',
    lat: 52.52,
    lon: 13.41,
    city: 'Berlin',
    country: 'Germany'
  };

  const convertTemp = v => state.tempUnit === 'f' ? (v * 9/5)+32 : v;
  const convertWind = v => state.windUnit === 'mph' ? v * 0.621371 : v;

  const formatUnitText = () => ({
    t: state.tempUnit === 'c' ? '°C' : '°F',
    w: state.windUnit === 'mph' ? 'mph' : 'Km/h',
    p: state.precipUnit === 'in' ? 'in' : 'mm'
  });

  const iconByWeatherCode = {
    0:'icon-sunny.webp',
    1:'icon-partly-cloudy.webp',
    2:'icon-overcast.webp',
    3:'icon-overcast.webp',
    45:'icon-fog.webp',
    48:'icon-fog.webp',
    51:'icon-drizzle.webp',
    61:'icon-rain.webp',
    63:'icon-rain.webp',
    65:'icon-rain.webp',
    80:'icon-rain.webp',
    95:'icon-storm.webp'
  };

  const getWeatherIcon = c => iconByWeatherCode[c] || 'icon-cloudy.webp';
  
  // ||||||||||||||||||||||||||||||||||||||

 if (btnUnidades) {
    btnUnidades.addEventListener('click', e => {
      e.stopPropagation();
      if (menuUnidades) menuUnidades.hidden = !menuUnidades.hidden;
    });
  }

  document.addEventListener('click', event => {
    if (!event.target.closest('.unidades') && menuUnidades) {
      menuUnidades.hidden = true;
    }
  });

  opcionesUnidades.forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.group;
      const value = btn.dataset.value;
      if (group === 'temp') state.tempUnit = value;
      if (group === 'viento') state.windUnit = value;
      if (group === 'precip') state.precipUnit = value;

      opcionesUnidades
        .filter(x => x.dataset.group === group)
        .forEach(x => x.classList.toggle('active', x === btn));

      fetchWeather();
    });
  });


  

  // ||||||||||||||||||||||||||||||||||
  async function fetchCoords(city){
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${city}`;
    const res = await fetch(url);
    const data = await res.json();

    if(!data.results){
      alert("Ciudad no encontrada 😔");
      return null;
    }

    const place = data.results[0];

    return {
      lat: place.latitude,
      lon: place.longitude,
      name: place.name,
      country: place.country
    };
  }

  // ||||||||||||||||||||||||
  const renderHourly = data => {
    listaHoraria.innerHTML = data.map(item => `
      <article class="item-horario">
        <div class="hora-izquierda">
          <img src="/weather-app-main/assets/images/${item.icon}" width="20">
          <span>${item.time}</span>
        </div>
        <span>${item.temp}°</span>
      </article>
    `).join('');
  };

  // ||||||||||||||||||||||||
  const renderDaily = daily => {
    const cont = document.getElementById('daily-forecast');
    const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

    cont.innerHTML = daily.time.map((date,i)=>{
      const dia = new Date(date).getDay();

      return `
        <div class="card-tiemp">
          <div class="dia">${dias[dia]}</div>

          <div class="icono-tiemp">
            <img src="/weather-app-main/assets/images/${getWeatherIcon(daily.weathercode[i])}" width="30">
          </div>

          <div class="temperatura">
            ${Math.round(convertTemp(daily.temperature_2m_max[i]))}° /
            ${Math.round(convertTemp(daily.temperature_2m_min[i]))}°
          </div>
        </div>
      `;
    }).join('');
  };

  // |||||||||||||||||||||||
  async function fetchWeather(){
    const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;

    const res = await fetch(endpoint);
    const data = await res.json();

    const {t,w} = formatUnitText();
    const current = data.current_weather;

    tempMain.textContent = `${Math.round(convertTemp(current.temperature))}${t}`;
    placeName.textContent = `${state.city}, ${state.country}`;

    cardFeels.textContent = `${Math.round(convertTemp(current.temperature))}${t}`;
    cardHum.textContent = `${data.hourly.relative_humidity_2m[0]}%`;
    cardWind.textContent = `${Math.round(convertWind(current.windspeed))} ${w}`;
    cardPrecip.textContent = `0 mm`;

    document.getElementById('current-icon').src =
      `/weather-app-main/assets/images/${getWeatherIcon(current.weathercode)}`;

    // ||||||||||||||||||||||
    const hourlyData = data.hourly.time.slice(0,8).map((t,i)=>({
      time: new Date(t).getHours()+":00",
      temp: Math.round(convertTemp(data.hourly.temperature_2m[i])),
      icon: getWeatherIcon(data.hourly.weathercode[i])
    }));

    renderHourly(hourlyData);

    // ||||||||||||||||||||||||
    renderDaily(data.daily);
  }

  // ||||||||||||||||||||||||||
  btnBuscar.addEventListener('click', async ()=>{
    const city = inputBuscar.value.trim();
    if(!city) return;

    const coords = await fetchCoords(city);
    if(!coords) return;

    state.lat = coords.lat;
    state.lon = coords.lon;
    state.city = coords.name;
    state.country = coords.country;

    fetchWeather();
  });

  fetchWeather();
});