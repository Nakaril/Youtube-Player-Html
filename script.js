
// Variables globales
let player; // Variable para el reproductor de video de YouTube
let loopEnabled = false;
let history = []; 

// Configurar la API de YouTube
function init() {
  gapi.client.init({
    apiKey: '',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'],
  }).then(() => {
    // Llamar a una función para cargar la lista de reproducción desde YouTube
    loadPlaylist();
  }).catch(err => {
    console.error('Error al inicializar la API de YouTube:', err);
  });
 loadHistory();
}



function loadHistory() {
  const storedHistory = localStorage.getItem('history');
  if (storedHistory) {
    history = JSON.parse(storedHistory);
  }

  // Mostrar el historial en el menú
  renderHistory();
}




// Cargar la lista de reproducción desde YouTube
function loadPlaylist() {
  gapi.client.youtube.playlistItems.list({
    part: 'snippet',
    playlistId: 'TU_ID_DE_LISTA_DE_REPRODUCCION'
  }).then(response => {
    const playlistItems = response.result.items;

    // Iterar a través de los elementos de la lista de reproducción y mostrarlos en la página
    playlistItems.forEach(item => {
      const videoId = item.snippet.resourceId.videoId;
      const title = item.snippet.title;
      const thumbnailUrl = item.snippet.thumbnails.default.url;

      const videoElement = document.createElement('div');
videoElement.innerHTML = `
  <a href="javascript:void(0);" onclick="playVideo('${videoId}', '${title}')">
    <img src="${thumbnailUrl}" alt="${title}">
    <div class="video-info">
      <h3>${title}</h3>
    </div>
  </a>
`;


      document.getElementById('playlist-container').appendChild(videoElement);
    });
  }).catch(err => {
    console.error('Error al cargar la lista de reproducción de YouTube:', err);
  });
}

// Buscar videos en YouTube
function searchVideos() {
  const query = document.getElementById('search-input').value;

  gapi.client.youtube.search.list({
    part: 'snippet',
    maxResults: 20,
    q: query
  }).then(response => {
    const searchResults = response.result.items;

    // Limpiar el contenedor de la lista de reproducción
    document.getElementById('playlist-container').innerHTML = '';

    // Iterar a través de los resultados de búsqueda y mostrarlos en la página
    searchResults.forEach(item => {
      if (item.id.kind === 'youtube#video') {
        const videoId = item.id.videoId;
        const title = item.snippet.title;
        const thumbnailUrl = item.snippet.thumbnails.default.url;

        const videoElement = document.createElement('div');
        videoElement.innerHTML = `
          <a href="javascript:void(0);" onclick="playVideo('${videoId}', '${title}')">
            <img src="${thumbnailUrl}" alt="${title}">
            <h3>${title}</h3>
          </a>
        `;

        document.getElementById('playlist-container').appendChild(videoElement);
      }
    });
  }).catch(err => {
    console.error('Error al buscar videos en YouTube:', err);
  });
}

// Reproducir el video seleccionado
function playVideo(videoId, title) {
  if (player) {
    player.loadVideoById(videoId);
    player.playVideo(); // Agregar esta línea para iniciar la reproducción automáticamente
  } else {
    // Crear el reproductor de YouTube con el bucle deshabilitado inicialmente
    player = new YT.Player('player-container', {
      height: '360',
      width: '640',
      videoId: videoId,
      playerVars: {
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        iv_load_policy: 3,
        loop: 0,
        rel: 0,
        autoplay: 1, // Habilitar la reproducción automática
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      }
    });
  }

  // Resto del código...


  // Actualizar los detalles del video
  document.getElementById('video-title').textContent = title;

  // Agregar la canción al historial
  addToHistory(videoId, title);

  // Mostrar el historial actualizado en el menú
  renderHistory();

  // Actualizar los detalles del video
  document.getElementById('video-title').textContent = title;
}


// Reproducir/pausar el video
function togglePlayPause() {
  if (player.getPlayerState() === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
}

// Agregar un evento al botón de reproducción/pausa
document.getElementById('play-button').addEventListener('click', togglePlayPause);


// Función de devolución de llamada cuando el reproductor de YouTube está listo
function onPlayerReady(event) {
  event.target.playVideo();
  document.getElementById('play-button').classList.remove('fa-play');
}

// Función de devolución de llamada cuando el estado del reproductor de YouTube cambia
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    // El video ha terminado de reproducirse
    if (loopEnabled) {
      // Repetir el video si el bucle está habilitado
      event.target.playVideo();
    } else {
      // Mostrar el siguiente video de la lista de reproducción si está disponible
      const playlistItems = document.getElementsByClassName('playlist-item');
      const currentIndex = Array.from(playlistItems).findIndex(item => item.classList.contains('active'));

      if (currentIndex >= 0 && currentIndex < playlistItems.length - 1) {
        const nextItem = playlistItems[currentIndex + 1];
        nextItem.click();
      }
    }
  }
}

// Alternar el bucle de reproducción
function toggleLoop() {
  loopEnabled = !loopEnabled;
  const loopButton = document.getElementById('loop-button');
  loopButton.classList.toggle('active');
}


// Cargar la biblioteca de la API de YouTube
function loadYouTubeAPI() {
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Llamar a la función para cargar la biblioteca de la API de YouTube
loadYouTubeAPI();

// Cargar la biblioteca de la API de Google y llamar a la función de configuración
gapi.load('client', init);

// Agregar un evento al botón de búsqueda
document.getElementById('search-button').addEventListener('click', searchVideos);

// Resto del código...
// Agregar un evento al botón de bucle
document.getElementById('loop-button').addEventListener('click', toggleLoop);


function addToHistory(videoId, title) {
  // Verificar si la canción ya está en el historial
  const songIndex = history.findIndex(song => song.videoId === videoId);
  if (songIndex !== -1) {
    // Si la canción ya está en el historial, moverla al principio
    history.splice(songIndex, 1);
  }

  // Agregar la nueva canción al inicio del historial
  history.unshift({ videoId, title });

  // Limitar el historial a las últimas 20 canciones
  if (history.length > 20) {
    history.pop();
  }

  // Guardar el historial en el almacenamiento local
  localStorage.setItem('history', JSON.stringify(history));
}


// Limpiar el historial
function clearHistory() {
  history = []; // Vaciar el historial

  // Guardar el historial vacío en el almacenamiento local
  localStorage.setItem('history', JSON.stringify(history));

  // Mostrar el historial vacío en el menú
  renderHistory();
}



function toggleDiv() {
  var div = document.getElementById("history-container");
  var botonAdicional = document.getElementById("botonAdicional");
  
  if (div.style.display === "none") {
    div.style.display = "block";
    botonAdicional.style.display = "block";
  } else {
    div.style.display = "none";
    botonAdicional.style.display = "none";
  }
}

// Función de devolución de llamada cuando el estado del reproductor de YouTube cambia
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    // El video ha terminado de reproducirse
    if (loopEnabled) {
      // Repetir el video si el bucle está habilitado
      event.target.playVideo();
    } else {
      // Mostrar el siguiente video de la lista de reproducción si está disponible
      const playlistItems = document.getElementsByClassName('playlist-item');
      const currentIndex = Array.from(playlistItems).findIndex(item => item.classList.contains('active'));

      if (currentIndex >= 0 && currentIndex < playlistItems.length - 1) {
        const nextItem = playlistItems[currentIndex + 1];
        nextItem.click();
      }
    }
  } else if (event.data === YT.PlayerState.PAUSED) {
    // El video está en pausa
    document.getElementById('play-button').classList.add('paused');
  } else if (event.data === YT.PlayerState.PLAYING) {
    // El video está reproduciéndose
    document.getElementById('play-button').classList.remove('paused');
  }
}



function renderHistory() {
  const historyContainer = document.getElementById('history-container');
  historyContainer.innerHTML = '';

  history.forEach(song => {
    const historyItem = document.createElement('div');
    historyItem.innerHTML = `
      <a href="javascript:void(0);" onclick="playVideo('${song.videoId}', '${song.title}')">
        <h3>${song.title}</h3>
      </a>
    `;

    historyContainer.appendChild(historyItem);
  });
}








///F






// Agregar un evento al botón de retroceso
document.getElementById('previous-button').addEventListener('click', backwardVideo);

// Agregar un evento al botón de avance
document.getElementById('next-button').addEventListener('click', forwardVideo);

// Retroceder el video en 15 segundos
function backwardVideo() {
  const currentTime = player.getCurrentTime();
  player.seekTo(currentTime - 15, true);
}

// Adelantar el video en 15 segundos
function forwardVideo() {
  const currentTime = player.getCurrentTime();
  player.seekTo(currentTime + 15, true);
}

