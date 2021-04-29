require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const path = require('path')

const app = express()
const port = 3000

const api_key = process.env.API_KEY

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/', express.static(path.join(__dirname, '../public')))

// your API calls

// example API call
app.get('/apod', async (req, res) => {
    try {
        let image = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${api_key}`)
            .then(res => res.json())
        res.send({ image })
    } catch (err) {
        console.log('error: ', err);
    }
})

app.use('/rovers', async (req, res) => {
    let rover = req.query.rover.toLowerCase()
    let date = req.query.date
    try {
        let data = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?earth_date=${date}&api_key=${api_key}`)
            .then(res => res.json())
        if (data.photos.length === 0){
            // get most recent date from when photos exist
            let manifest = await fetch(`https://api.nasa.gov/mars-photos/api/v1/manifests/${rover}?api_key=${api_key}`)
                .then(res => res.json())
                .catch(err => console.log(err))

            let recents = manifest.photo_manifest.photos
            /* .slice(manifest.photo_manifest.photos.length-26) */
            let recentsIndex = recents.length-1
            let buffer = []
            while(recentsIndex >= 0 && buffer.length <= 25){
                let newDate = recents[recentsIndex].earth_date
                photos = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?earth_date=${newDate}&api_key=${api_key}`)
                data = await photos.json()
                // get unique photos from that data, check what camera took the photos
                let photosbyCam = []
                let uniquePhotos = []
                for (let photo of data.photos){
                    if (!photosbyCam.includes(photo["camera"]["full_name"])){
                        photosbyCam.push(photo["camera"]["full_name"])
                        uniquePhotos.push(photo)
                    }
                }
                buffer = buffer.concat(uniquePhotos)
                recentsIndex--
            }
            data = {photos: buffer}
            /*
            photos = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?earth_date=${date}&api_key=${api_key}`)
            data = await photos.json()
            console.log("heres your data", data)
            */
        }
        res.send(JSON.stringify(data))
    }
    catch (err) {
        console.log(err)
    }
})

app.use('/weather', async (req, res) => {
    weather = await fetch(`https://api.nasa.gov/insight_weather/?api_key=${api_key}&feedtype=json&ver=1.0`)
    .catch(err => console.log(err))
    data = await weather.json()
    const solBuffer = []
    for (let sol of data.sol_keys){
        data[sol].name = sol
        solBuffer.push(data[sol])
    }
    res.send(JSON.stringify(solBuffer))
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))