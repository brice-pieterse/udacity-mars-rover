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
  if (state.get("view") === "home") {
    cb(homeView());
    updateListeners(state);
  } else if (state.get("view") === "loading") {
    cb(loadingView());
    updateListeners(state);
  } else if (state.get("view") === "feed" && state.get("action") === "loading feed") {
    if (state.get("apod") === "") {
        getImageOfTheDay(state);
    } else if (state.get("weather") === "") {
        getWeather(state);
    } else {
        setTimeout(() => {
            cb(feedView());
            renderPanel(state);
            updateNav(state);
            updateListeners(state);
            getPhotos(state);
      }, 2000);
    }
  } else if (state.get("view") === "feed" && state.get("action") === "update rover" || state.get("action") === "load photos") {
    updateNav(state);
    getPhotos(state);
    updateListeners(state);

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
            <img class="apod-image" src="${parsedApod.image.url}" height="30vh" width="100%"/>
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
  for (let sol of weatherData) {
    weatherDays += `<div class="sol-weather-wrapper"><div class="calendar"><p class="text-small dull">Sol</p><p>${sol.name}</p></div><p>${sol["PRE"].av} Pascals</p></div>`;
  }
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
                <div class="apod"></div>
            </div>
            <div class="feed-container">
                <div class="feed-wrapper">
                    <div class="padding-divider"></div>
                    <p class="text-regular margin-bottom">Latest Photos From Your Favourite Rovers</p>
                    <div class="underline margin-bottom"></div>
                    <div class="photo-feed">
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
};

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


// ------------------------------------------------------  API CALLS

// Gets picture of the day
const getImageOfTheDay = (state) => {
  fetch(`http://localhost:3000/apod`)
    .then((res) => res.json())
    .then((data) => {
      updateStore(state, { apod: data });
    })
    .catch(err => console.log(err))
};

// Gets the weather of the day (atmospheric pressure, no av temperatures, only available at this moment)
const getWeather = async (state) => {
  let weatherData = await fetch(`http://localhost:3000/weather`);
  let parsedWeather = await weatherData.json();
  updateStore(state, { weather: parsedWeather });
};

// Renders images of the { selectedRover } and prepares the other feeds
const getPhotos = async (state) => {

  let roverPhotos = state.get("roverPhotos")
  let date = state.get("date");
  let selectedRover = state.get("selectedRover");
  let domFeed = document.querySelector(".photo-feed");
  domFeed.innerHTML = "";
  date = date.toLocaleDateString("en-US").split("/");

  // copies any cached data of other rover photos into a new rover photos object

  if (roverPhotos.get(`${selectedRover}`) === "") {
    let newRoverPhotosObject = {};

    roverPhotos.mapKeys((key, val) => {
      if (key !== selectedRover){
        newRoverPhotosObject[key] = val
      }
    })

    domFeed.innerHTML = `<div class="loading-feed-wrapper">
    <lottie-player class="loader" src="/images/loading.json" background="transparent"  speed="1"  style="width: 300px; height: 300px;" loop autoplay></lottie-player>
    </div>`;
    fetch(`http://localhost:3000/rovers?rover=${selectedRover}&date=${date[2]}-${date[0]}-${date[1]}`)
    .then(res => res.json())
    .then(photoCollection => {

        // caches the photos for that rover in the new roverphotos object, creates a new store
        newRoverPhotosObject[selectedRover] = photoCollection
        updateStore(state, { roverPhotos: Immutable.Map(newRoverPhotosObject), action: "load photos" })
    })
    .catch(err => console.log(err))

  }
  else {
      domFeed.innerHTML = ""
      renderPhotoCollection(domFeed, state);
  }
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
