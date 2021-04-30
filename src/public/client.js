let yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const store = Immutable.Map({
  user: { name: "Student" },
  apod: "",
  rovers: ["Curiosity", "Opportunity", "Spirit"],
  roverPhotos: Immutable.Map({
    "Curiosity": "",
    "Opportunity": "",
    "Spirit": "",
  }),
  manifests: Immutable.Map({
    "Curiosity": "",
    "Opportunity": "",
    "Spirit": "",
  }),
  selectedRover: "Curiosity",
  view: "home",
  date: yesterday,
  panel: "apod",
  weather: "",
  action: "",
});

// add our markup to the page
const root = document.getElementById("root");

const updateListeners = (state) => {
  if (state.get("view") === "home") {
    const startApp = document.querySelector(".start-app");
    startApp.addEventListener("click", () => {
      updateStore(state, { view: "loading", action: "start app" });
    });
  } else if (state.get("view") === "loading") {
    updateStore(state, { view: "feed", action: "loading feed" });
  } else if (state.get("view") === "feed") {
    let navItems = document.querySelectorAll(".nav-item");

    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        let rover = item.querySelector("p");
        updateStore(state, {
          view: "feed",
          action: "update rover",
          selectedRover: rover.innerText,
        });
      });
    });

    if (state.get("panel") === "apod") {
      let weatherCheck = document.querySelectorAll(".weather-btn");

      weatherCheck.forEach((btn) =>{
        btn.addEventListener("click", () => {
          updateStore(state, { panel: "weather", action: "open weather" });
        })
      })
    }

    if (state.get("panel") === "weather") {
      let apodCheck = document.querySelectorAll(".apod-btn");

      apodCheck.forEach((btn) => {
        btn.addEventListener("click", () => {
          updateStore(state, { panel: "apod", action: "open apod" });
        })
      })
    }
  }
};

const updateStore = (store, newState) => {
  const updatedStore = store.merge(newState);
  render(root, updatedStore);
};

const render = async (root, state) => {
  App(state, (markup) => {
    root.innerHTML = markup;
  });
};


const App = (state, cb) => {
  const selectedRover = state.get("selectedRover")
  if (state.get("view") === "home") {
    cb(homeView());
    updateListeners(state);
  } else if (state.get("view") === "loading") {
    cb(loadingView());
    setTimeout(() => {
    updateListeners(state);
    }, 1000)
  } else if (state.get("view") === "feed" && state.get("action") === "loading feed") {
    if (state.get("apod") === "") {
        cb(feedView());
        updateNav(state);
        getImageOfTheDay(state);
    } else if (state.get("weather") === "") {
        getWeather(state);
    } else if (state.get("manifests").get(`${selectedRover}`) === ""){
        getManifest(state);
    } else if (state.get("roverPhotos").get(`${selectedRover}`) === "") {
        getPhotos(state);
    } else {
        renderPanel(state);
        updateManifest(state)
        updatePhotos(state)
        updateListeners(state);
    }
  } else if (state.get("view") === "feed" && state.get("action") === "update rover") {
      let selfieLoader = document.querySelector('.selfie-loader')
      let roverPhoto = document.querySelector('.rover-selfie')
      let domFeed = document.querySelector(".photo-feed");
      domFeed.innerHTML = feedLoader()
      selfieLoader.style.display = "block"
      roverPhoto.style.display = "none"
    if (state.get("manifests").get(`${selectedRover}`) === "") {
      getManifest(state);
    }
    else if (state.get("roverPhotos").get(`${selectedRover}`) === "") {
      getPhotos(state);
    }
    else {
      updateNav(state);
      updateManifest(state)
      updatePhotos(state)
      updateListeners(state);
    }
  } else if (
    (state.get("view") === "feed" && state.get("action") === "open apod") ||
    state.get("action") === "open weather"
  ) {
    renderPanel(state);
    updateListeners(state);
  }
};

// listening for load event because page should load before any JS is called
window.addEventListener("load", () => {
  render(root, store);
});

// ------------------------------------------------------  COMPONENTS

const updatePanelToApod = (state) => {
  let apod = state.get("apod");
  let parsedApod = apod.toJS()
  if (parsedApod.image.media_type === "video") {
    // check if the photo of the day is actually type video!
    return `
            <p class="text-regular padding-bottom">See today's featured video <a href="${parsedApod.image.url}">here</a></p>
            <p class="text-large padding-bottom">${parsedApod.image.title}</p>
            <p class="text-small">${parsedApod.image.explanation}</p>
            <button class="weather-btn full-width float-bottom">Check Martian Weather</button>
        `;
  } else
    return `
            <img class="apod-image" src="${parsedApod.image.url}"/>
            <p class="text-regular margin-bottom">Astronomy Pic of The Day</p>
            <div class="underline margin-bottom"></div>
            <p class="text-small">${parsedApod.image.explanation}</p>
            <button class="weather-btn full-width float-bottom">Check The Weather</button>
        `;
};

const updatePanelToWeather = (state) => {
  let weather = state.get("weather");
  let weatherData = weather.toJS()
  let weatherDays = "";
  weatherData.forEach(sol => {
    weatherDays += `<div class="sol-weather-wrapper"><div class="calendar"><p class="text-small dull">Sol</p><p>${sol.name}</p></div><p>${sol["PRE"].av} Pascals</p></div>`;
  })
  let weatherPanel = `
    <div class="weather-section"><p class="text-regular margin-bottom">Mars Atmospheric Pressure</p><div class="underline margin-bottom"></div>${weatherDays}<button class="apod-btn full-width float-bottom">Checkout The Picture of The Day</button></div>
    `;
  return weatherPanel;
};

const homeView = () => {
  return `
    <div class="body-wrapper">
        <div class="home-header">
            <img class="logo" src="/images/logo.svg" alt="">
        </div>
        <div class="main">
            <div class="welcome-wrapper">
                <h1 class="light padding-bottom">Welcome!</h1>
                <p class="text-regular light ctr padding-bottom">MarsDash is your daily source for news from the Red Planet, with updates supplied by yours truly, the Mars rovers.</p>
                <button class="start-app padding-top">Explore The Red Planet</button>
            </div>
        </div>
        <footer>
            <p class="text-regular light ctr">Intermediate JS Udacity NanoDegree Project</p>
        </footer>
    </div>
`;
};

const loadingView = () => {
  return `
    <div class="body-wrapper">
        <div class="home-header">
            <img class="logo" src="/images/logo.svg" alt="">
        </div>
        <div class="main">
            <div class="loading-feed-wrapper">
            <lottie-player class="loader" src="/images/loading.json" background="transparent"  speed="1"  style="width: 300px; height: 300px;" loop autoplay></lottie-player>
            </div>
        </div>
        <footer>
            <p class="text-regular light ctr">Intermediate JS Udacity NanoDegree Project</p>
        </footer>
    </div>
    `;
};

const feedView = () => {
  let loader = feedLoader()
  return `
    <div class="body-wrapper light">
        <div class="home-header light">
            <img class="logo" src="/images/logo-light.svg" alt="">
            <div class="panel-container mobile-view">
                <div class="apod"></div>
            </div>
            <div class="rover-nav">
            </div>
        </div>
        <div class="main feed">
            <div class="panel-container large-view">
                <div class="apod">
                <div class="apod-loader"></div>
                <div class="loader-line1"></div>
                <div class="loader-line2"></div>
                <div class="loader-line3"></div>
                <div class="loader-line4"></div>
                </div>
            </div>
            <div class="feed-container">
                <div class="feed-wrapper">
                    <div class="rover-wrapper">
                    <div class="selfie-loader"></div>
                    <img class="rover-selfie" src=""/>
                    <div class="manifest-wrapper">
                    <div class="rover-data">
                    <div class="loader-line1"></div>
                    <div class="loader-line2"></div>
                    <div class="loader-line3"></div>
                    <div class="loader-line4"></div>
                    </div>
                    </div>
                    </div>
                    <div class="padding-divider"></div>
                    <p class="text-regular margin-bottom">Latest Photos From Your Favourite Rovers</p>
                    <div class="underline margin-bottom"></div>
                    <div class="photo-feed">
                    ${loader}
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
};


const feedLoader = () => {
  return `<div class="loading-feed-wrapper">
  <lottie-player class="loader" src="/images/loading.json" background="transparent"  speed="1"  style="width: 300px; height: 300px;" loop autoplay></lottie-player>
</div>`
}

const updateNav = (state) => {
  let nav = document.querySelector(".rover-nav");
  let roverNav = state.get("rovers")
    .map((roverName) => {
      let status = "inactive";
      if (state.get("selectedRover") === roverName) {
        status = "active";
      }
      return `<div class="nav-item"><p class="text-regular ${status}">${roverName}</p><div class="underline ${status}"></div></div>`;
    })
    .join("");
  nav.innerHTML = roverNav;
};

const renderPanel = (state) => {
  let panel = document.querySelectorAll(".apod");
  panel.innerHTML = ""
  if (state.get("panel") === "weather") {
    panel.forEach((panel) => {
      panel.innerHTML = updatePanelToWeather(state);
    })
  } else if (state.get("panel") === "apod") {
    panel.forEach((panel) =>{
      panel.innerHTML = updatePanelToApod(state);
    })
  }
};

const updateManifest = (state) => {
  let loader = document.querySelector('.selfie-loader')
  let roverPhoto = document.querySelector('.rover-selfie')
  loader.style.display = "none"
  roverPhoto.style.display = "block"
  let selectedRover = state.get("selectedRover");
  let aboutRover = document.querySelector(".manifest-wrapper")
  let selfie;

  if (selectedRover === "Curiosity"){
    selfie = "Curiosity.jpg"
  }
  else if (selectedRover === "Opportunity"){
    selfie = "Opportunity.jpeg"
  }
  else {
    selfie = "Spirit.jpeg"
  }

  roverPhoto.src = `/images/${selfie}`
  aboutRover.innerHTML = ""
    let manifest = state.get("manifests").get(`${selectedRover}`)
    aboutRover.innerHTML = `
    <div class="rover-data">
    <p class= "text-regular bold margin-bottom">Launch Date:</p>
    <p class="large-margin-bottom">${manifest.launch}</p>
    <p class= "text-regular bold margin-bottom">Landing Date:</p>
    <p class="large-margin-bottom">${manifest.landing}</p>
    <p class= "text-regular bold margin-bottom">Mission Status:</p>
    <p class="large-margin-bottom">${manifest.status}</p>
    <p class= "text-regular bold margin-bottom">Most Recent Photo:</p>
    <p class="large-margin-bottom">${manifest.recentPhoto}</p>
    </div>
    `
}

const updatePhotos = (state) => {
  let domFeed = document.querySelector(".photo-feed");
  domFeed.innerHTML = "";
  renderPhotoCollection(domFeed, state);
}

const renderPhotoCollection = (root, state) => {
  let selectedRover = state.get("selectedRover")
  let photoCollection = state.get("roverPhotos").get(`${selectedRover}`)
  photoCollection.photos.forEach((photo) => {
      let card = document.createElement("DIV")
      card.classList.add('card')
      card.innerHTML = `
        <div class="underline margin-bottom float-top"></div>
        <div class="photo-info">
        <p class="text-regular margin-bottom">${photo["rover"]["name"]}'s ${photo["camera"]["full_name"]}</p>
        <p class="text-small dull">Sol ${photo["sol"]}</p>
        </div>
        <div class="underline hidden margin-bottom"></div>
        <img style="min-width: 100%; height: auto; object-fit: cover" src="${photo["img_src"]}"/>`

        root.appendChild(card) })
}


// ------------------------------------------------------  API CALLS

// Gets picture of the day
const getImageOfTheDay = (state) => {
  fetch(`https://marsdash.herokuapp.com/apod`)
    .then((res) => res.json())
    .then((data) => {
      updateStore(state, { apod: data });
    })
    .catch(err => console.log(err))
};

// Gets the weather of the day (atmospheric pressure, no av temperatures, only available at this moment)
const getWeather = async (state) => {
  let weatherData = await fetch(`https://marsdash.herokuapp.com/weather`);
  let parsedWeather = await weatherData.json();
  updateStore(state, { weather: parsedWeather });
};


const getManifest = async (state) => {
  let selectedRover = state.get("selectedRover");
  let aboutRover = document.querySelector(".manifest-wrapper")
  let roverManifests = state.get("manifests") 

  aboutRover.innerHTML = `<div class="rover-data">
  <div class="loader-line1"></div>
  <div class="loader-line2"></div>
  <div class="loader-line3"></div>
  <div class="loader-line4"></div>
  </div>`;

  let newManifestsObject = {}

    roverManifests.mapKeys((key, val) => {
      if (key !== selectedRover){
        newManifestsObject[key] = val
      }
    })

    fetch(`https://marsdash.herokuapp.com/manifests?rover=${selectedRover}`)
    .then(res => res.json())
    .then(manifest => {
      newManifestsObject[selectedRover] = manifest
      updateStore(state, { manifests: Immutable.Map(newManifestsObject) })
    })
    .catch(err => console.log(err))
}


// Renders images of the { selectedRover } and prepares the other feeds
const getPhotos = async (state) => {
  let roverPhotos = state.get("roverPhotos")
  let date = state.get("date");
  let selectedRover = state.get("selectedRover");
  date = date.toLocaleDateString("en-US").split("/");

  // copies any cached data of other rover photos into a new rover photos object
  let newRoverPhotosObject = {};

  roverPhotos.mapKeys((key, val) => {
    if (key !== selectedRover){
      newRoverPhotosObject[key] = val
    }
  })


  fetch(`https://marsdash.herokuapp.com/rovers?rover=${selectedRover}&date=${date[2]}-${date[0]}-${date[1]}`)
  .then(res => res.json())
  .then(photoCollection => {

      // caches the photos for that rover in the new roverphotos object, creates a new store
      newRoverPhotosObject[selectedRover] = photoCollection
      updateStore(state, { roverPhotos: Immutable.Map(newRoverPhotosObject) })
  })
  .catch(err => console.log(err))
}
