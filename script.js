if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('[Service Worker] Registered successfully with scope:', reg.scope))
            .catch(err => console.error('[Service Worker] Registration failed:', err));
    });
}

const topContainer = document.querySelector('#topCarousel .carouselContainer')
const bottomContainer = document.querySelector('#bottomCarousel .carouselContainer')
const topCarousel = topContainer ? topContainer.children : []
const bottomCarousel = bottomContainer ? bottomContainer.children : []

const carouselBtnDiv = document.querySelectorAll('.carouselBtnDiv')
const dressMeBtn = document.getElementById('dressMeBtn')
const browseBtn = document.getElementById('browseBtn')
const popUpDiv = document.getElementById('popUpDiv')
const popUp = document.getElementById('popUp')
const popUpText = document.getElementById('popUpText')
const popUpButtons = document.getElementById('popUpButtons')
const popUpYesBtn = document.getElementById('popUpYesBtn')
const popUpNoBtn = document.getElementById('popUpNoBtn')

const tryOnContainer = document.getElementById('tryOnContainer')
const tryOnModelImg = document.getElementById('tryOnModelImg')
const runTryOnBtn = document.getElementById('runTryOnBtn')
const closeTryOnBtn = document.getElementById('closeTryOnBtn')
const tryOnStatus = document.getElementById('tryOnStatus')
const tryOnStatusText = document.getElementById('tryOnStatusText')

const settingsBtn = document.getElementById('settingsBtn')
const settingsModalDiv = document.getElementById('settingsModalDiv')
const toggleSoundBtn = document.getElementById('toggleSoundBtn')
const toggleTryOnBtn = document.getElementById('toggleTryOnBtn')
const closeSettingsBtn = document.getElementById('closeSettingsBtn')
const settingsModalShadow = document.getElementById('settingsModalShadow')

const selectedModelPath = 'assets/images/models/modelo_isa_1.png'
let popUpTimeout = null

let currentTop = null
let currentBottom = null

const clickSound = new Audio('assets/audio/lclick-13694.mp3')
const wrongSound = new Audio('assets/audio/mixkit-wrong-long-buzzer-954.wav')
const correctSound = new Audio('assets/audio/mixkit-winning-chimes-2015.wav')

let soundEnabled = true
let tryOnEnabled = true

function playSound(audio) {
    if (soundEnabled && audio) {
        audio.currentTime = 0
        audio.play().catch(err => console.warn('Audio play error:', err))
    }
}

let clothesData = {}
let currentSeason = 'winter'
let selectedTopType = null
let selectedBottomType = null
let isVestidosMode = false

const seasonBtn = document.getElementById('seasonBtn')
const seasonDropdown = document.getElementById('seasonDropdown')
const seasonOptions = document.querySelectorAll('.seasonOption')
const typeFilterBtns = document.querySelectorAll('.typeFilter')
const clothesDiv = document.getElementById('clothesDiv')

function buildCarouselsFromData() {
    topContainer.innerHTML = ''
    bottomContainer.innerHTML = ''

    const topTypes = ['top', 'camiseta', 'camisa', 'jersey', 'vestidos']
    const bottomTypes = ['falda', 'shorts', 'pantalones']

    Object.keys(clothesData).forEach(src => {
        const item = clothesData[src]
        if (!item) return

        const img = document.createElement('img')
        img.src = src
        img.classList.add('noDisplay')

        if (topTypes.includes(item.type)) {
            img.classList.add('top')
            topContainer.appendChild(img)
        } else if (bottomTypes.includes(item.type)) {
            img.classList.add('bottom')
            bottomContainer.appendChild(img)
        }
    })
}

function saveState() {
    try {
        const state = {
            currentSeason,
            selectedTopType,
            selectedBottomType,
            isVestidosMode,
            soundEnabled,
            tryOnEnabled,
            currentTopSrc: currentTop ? (currentTop.getAttribute('src') || currentTop.src) : null,
            currentBottomSrc: currentBottom ? (currentBottom.getAttribute('src') || currentBottom.src) : null
        }
        localStorage.setItem('cluelessWardrobeState', JSON.stringify(state))
    } catch (e) {
        console.warn('Could not save state to localStorage:', e)
    }
}

function restoreSavedState() {
    try {
        const saved = localStorage.getItem('cluelessWardrobeState')
        if (!saved) return null
        return JSON.parse(saved)
    } catch (e) {
        return null
    }
}

function updateSettingsUI() {
    if (toggleSoundBtn) {
        toggleSoundBtn.innerText = soundEnabled ? 'ON' : 'OFF'
        if (soundEnabled) {
            toggleSoundBtn.classList.remove('settingOff')
        } else {
            toggleSoundBtn.classList.add('settingOff')
        }
    }
    if (toggleTryOnBtn) {
        toggleTryOnBtn.innerText = tryOnEnabled ? 'ON' : 'OFF'
        if (tryOnEnabled) {
            toggleTryOnBtn.classList.remove('settingOff')
        } else {
            toggleTryOnBtn.classList.add('settingOff')
        }
    }
}

// Initial settings restoration
const initialSavedState = restoreSavedState()
if (initialSavedState) {
    if (initialSavedState.soundEnabled !== undefined) soundEnabled = initialSavedState.soundEnabled
    if (initialSavedState.tryOnEnabled !== undefined) tryOnEnabled = initialSavedState.tryOnEnabled
}
updateSettingsUI()

if (settingsBtn && settingsModalDiv) {
    settingsBtn.addEventListener('click', function (e) {
        e.stopPropagation()
        playSound(clickSound)
        updateSettingsUI()
        settingsModalDiv.classList.remove('noDisplay')
    })
}

if (closeSettingsBtn && settingsModalDiv) {
    closeSettingsBtn.addEventListener('click', function () {
        playSound(clickSound)
        settingsModalDiv.classList.add('noDisplay')
    })
}

if (settingsModalShadow && settingsModalDiv) {
    settingsModalShadow.addEventListener('click', function () {
        playSound(clickSound)
        settingsModalDiv.classList.add('noDisplay')
    })
}

if (toggleSoundBtn) {
    toggleSoundBtn.addEventListener('click', function () {
        soundEnabled = !soundEnabled
        if (soundEnabled) playSound(clickSound)
        updateSettingsUI()
        saveState()
    })
}

if (toggleTryOnBtn) {
    toggleTryOnBtn.addEventListener('click', function () {
        playSound(clickSound)
        tryOnEnabled = !tryOnEnabled
        updateSettingsUI()
        saveState()
    })
}

function updateSeasonDropdownOrder() {
    if (!seasonDropdown || !seasonOptions.length) return
    const optionsArray = Array.from(seasonOptions)
    const activeOption = optionsArray.find(opt => opt.getAttribute('data-season') === currentSeason)
    const otherOptions = optionsArray.filter(opt => opt.getAttribute('data-season') !== currentSeason)

    if (activeOption) {
        seasonDropdown.innerHTML = ''
        seasonDropdown.appendChild(activeOption)
        otherOptions.forEach(opt => seasonDropdown.appendChild(opt))
    }
}

fetch('clothes.json')
    .then(response => response.json())
    .then(data => {
        clothesData = data
        buildCarouselsFromData()

        const savedState = restoreSavedState()
        if (savedState) {
            if (savedState.currentSeason) {
                currentSeason = savedState.currentSeason
                seasonOptions.forEach(opt => {
                    if (opt.getAttribute('data-season') === currentSeason && seasonBtn) {
                        seasonBtn.innerText = opt.innerText
                    }
                })
            }
            if (savedState.selectedTopType !== undefined) {
                selectedTopType = savedState.selectedTopType
            }
            if (savedState.selectedBottomType !== undefined) {
                selectedBottomType = savedState.selectedBottomType
            }
            if (savedState.isVestidosMode !== undefined) {
                isVestidosMode = savedState.isVestidosMode
            }

            typeFilterBtns.forEach(btn => {
                const type = btn.getAttribute('data-type')
                const category = btn.getAttribute('data-category')
                btn.classList.remove('activeFilter')
                if (isVestidosMode && (category === 'dress' || type === 'vestidos')) {
                    btn.classList.add('activeFilter')
                } else if (!isVestidosMode) {
                    if (category === 'top' && type === selectedTopType) {
                        btn.classList.add('activeFilter')
                    }
                    if (category === 'bottom' && type === selectedBottomType) {
                        btn.classList.add('activeFilter')
                    }
                }
            })

            if (isVestidosMode && clothesDiv) {
                clothesDiv.classList.add('vestidosActive')
            } else if (clothesDiv) {
                clothesDiv.classList.remove('vestidosActive')
            }

            updateSeasonDropdownOrder()
            applySeasonFilter(savedState)
        } else {
            updateSeasonDropdownOrder()
            applySeasonFilter()
        }
    })
    .catch(error => console.error('Error loading clothes.json:', error))

if (seasonBtn && seasonDropdown) {
    seasonBtn.addEventListener('click', function (e) {
        e.stopPropagation()
        updateSeasonDropdownOrder()
        seasonDropdown.classList.toggle('noDisplay')
        playSound(clickSound)
    })

    document.addEventListener('click', function () {
        if (!seasonDropdown.classList.contains('noDisplay')) {
            seasonDropdown.classList.add('noDisplay')
        }
    })

    seasonOptions.forEach(option => {
        option.addEventListener('click', function (e) {
            e.stopPropagation()
            const selectedSeason = this.getAttribute('data-season')
            currentSeason = selectedSeason
            seasonBtn.innerText = this.innerText
            updateSeasonDropdownOrder()
            seasonDropdown.classList.add('noDisplay')
            playSound(clickSound)
            applySeasonFilter()
            saveState()
        })
    })
}

typeFilterBtns.forEach(btn => {
    btn.addEventListener('click', function () {
        const type = this.getAttribute('data-type')
        const category = this.getAttribute('data-category')

        playSound(clickSound)

        if (category === 'dress' || type === 'vestidos') {
            if (isVestidosMode) {
                isVestidosMode = false
                this.classList.remove('activeFilter')
                if (clothesDiv) clothesDiv.classList.remove('vestidosActive')
            } else {
                isVestidosMode = true
                selectedTopType = null
                selectedBottomType = null
                typeFilterBtns.forEach(b => b.classList.remove('activeFilter'))
                this.classList.add('activeFilter')
                if (clothesDiv) clothesDiv.classList.add('vestidosActive')
            }
        } else {
            if (isVestidosMode) {
                isVestidosMode = false
                if (clothesDiv) clothesDiv.classList.remove('vestidosActive')
                typeFilterBtns.forEach(b => b.classList.remove('activeFilter'))
            }

            if (category === 'top') {
                if (selectedTopType === type) {
                    selectedTopType = null
                    this.classList.remove('activeFilter')
                } else {
                    selectedTopType = type
                    typeFilterBtns.forEach(b => {
                        if (b.getAttribute('data-category') === 'top') {
                            b.classList.remove('activeFilter')
                        }
                    })
                    this.classList.add('activeFilter')
                }
            } else if (category === 'bottom') {
                if (selectedBottomType === type) {
                    selectedBottomType = null
                    this.classList.remove('activeFilter')
                } else {
                    selectedBottomType = type
                    typeFilterBtns.forEach(b => {
                        if (b.getAttribute('data-category') === 'bottom') {
                            b.classList.remove('activeFilter')
                        }
                    })
                    this.classList.add('activeFilter')
                }
            }
        }

        applySeasonFilter()
        saveState()
    })
})

function getGarmentData(img) {
    if (!img) return null
    const src = img.getAttribute('src') || img.src || ''
    if (clothesData[src]) return clothesData[src]

    const relativeSrc = src.replace(/^.*(?=assets\/)/, '')
    if (clothesData[relativeSrc]) return clothesData[relativeSrc]

    const filename = src.split('/').pop()
    const foundKey = Object.keys(clothesData).find(k => k.endsWith(filename))
    return foundKey ? clothesData[foundKey] : null
}

function getAvailableImages(carousel) {
    const isTop = carousel === topCarousel || (carousel[0] && carousel[0].classList.contains('top'))

    if (isVestidosMode) {
        if (!isTop) return []
        const available = []
        for (let i = 0; i < carousel.length; i++) {
            const img = carousel[i]
            const data = getGarmentData(img)
            if (data && data.type === 'vestidos') {
                available.push(img)
            }
        }
        return available
    }

    const activeType = isTop ? selectedTopType : selectedBottomType

    const available = []
    for (let i = 0; i < carousel.length; i++) {
        const img = carousel[i]
        const data = getGarmentData(img)
        if (data && data.type !== 'vestidos') {
            const matchesSeason = data.season === currentSeason
            const matchesType = !activeType || data.type === activeType
            if (matchesSeason && matchesType) {
                available.push(img)
            }
        }
    }

    return available
}

function applySeasonFilter(savedState) {
    const availableTops = getAvailableImages(topCarousel)
    for (let i = 0; i < topCarousel.length; i++) {
        topCarousel[i].classList.add('noDisplay')
    }

    let restoredTop = null
    if (savedState && savedState.currentTopSrc && availableTops.length > 0) {
        restoredTop = availableTops.find(img => {
            const src = img.getAttribute('src') || img.src
            return src === savedState.currentTopSrc || src.endsWith(savedState.currentTopSrc.split('/').pop())
        })
    }

    if (restoredTop) {
        restoredTop.classList.remove('noDisplay')
        currentTop = restoredTop
    } else if (availableTops.length > 0) {
        availableTops[0].classList.remove('noDisplay')
        currentTop = availableTops[0]
    } else {
        currentTop = null
    }

    if (!isVestidosMode) {
        const availableBottoms = getAvailableImages(bottomCarousel)
        for (let i = 0; i < bottomCarousel.length; i++) {
            bottomCarousel[i].classList.add('noDisplay')
        }

        let restoredBottom = null
        if (savedState && savedState.currentBottomSrc && availableBottoms.length > 0) {
            restoredBottom = availableBottoms.find(img => {
                const src = img.getAttribute('src') || img.src
                return src === savedState.currentBottomSrc || src.endsWith(savedState.currentBottomSrc.split('/').pop())
            })
        }

        if (restoredBottom) {
            restoredBottom.classList.remove('noDisplay')
            currentBottom = restoredBottom
        } else if (availableBottoms.length > 0) {
            availableBottoms[0].classList.remove('noDisplay')
            currentBottom = availableBottoms[0]
        } else {
            currentBottom = null
        }
    }
}

const colorCompatibilityMap = {
    'blanco': ['blanco', 'negro', 'gris', 'beige', 'azul', 'verde', 'amarillo', 'rosa', 'granate'],
    'negro': ['blanco', 'negro', 'gris', 'beige', 'azul', 'verde', 'amarillo', 'rosa', 'granate'],
    'gris': ['blanco', 'negro', 'gris', 'beige', 'azul', 'rosa', 'granate', 'amarillo'],
    'beige': ['blanco', 'negro', 'gris', 'beige', 'azul', 'verde', 'granate', 'amarillo'],
    'azul': ['blanco', 'negro', 'gris', 'beige', 'azul', 'amarillo', 'rosa'],
    'amarillo': ['blanco', 'negro', 'gris', 'beige', 'azul', 'amarillo'],
    'rosa': ['blanco', 'negro', 'gris', 'azul', 'rosa', 'granate'],
    'granate': ['blanco', 'negro', 'gris', 'beige', 'rosa', 'granate'],
    'verde': ['blanco', 'negro', 'beige', 'verde']
}

function areColorsMatching(c1, c2) {
    if (!c1 || !c2) return false
    const color1 = c1.toLowerCase().trim()
    const color2 = c2.toLowerCase().trim()

    if (color1 === color2) return true

    if (colorCompatibilityMap[color1] && colorCompatibilityMap[color1].includes(color2)) {
        return true
    }
    if (colorCompatibilityMap[color2] && colorCompatibilityMap[color2].includes(color1)) {
        return true
    }

    return false
}

function checkOutfitMatch(topImg, bottomImg) {
    if (isVestidosMode) return true
    if (!clothesData || !topImg || !bottomImg) return false

    const topInfo = getGarmentData(topImg)
    const bottomInfo = getGarmentData(bottomImg)

    if (!topInfo || !bottomInfo) return false

    let matches = 0

    if (areColorsMatching(topInfo.color, bottomInfo.color)) {
        matches++
    }

    if (topInfo.material && bottomInfo.material && topInfo.material === bottomInfo.material) {
        matches++
    }

    if (topInfo.fit && bottomInfo.fit && topInfo.fit === bottomInfo.fit) {
        matches++
    }

    if (topInfo.style && bottomInfo.style && topInfo.style === bottomInfo.style) {
        matches++
    }

    return matches >= 2
}


for (const btnDiv of carouselBtnDiv) {
    btnDiv.addEventListener('click', function (e) {
        const btn = e.target.closest('.carouselBtn')
        if (!btn) return

        const isNext = btn.classList.contains('next')

        if (isVestidosMode) {
            if (isNext) {
                nextImg(topCarousel)
            } else {
                prevImg(topCarousel)
            }
        } else {
            const isTop = btn.classList.contains('top')
            if (isTop) {
                if (isNext) {
                    nextImg(topCarousel)
                } else {
                    prevImg(topCarousel)
                }
            } else {
                if (isNext) {
                    nextImg(bottomCarousel)
                } else {
                    prevImg(bottomCarousel)
                }
            }
        }
        playSound(clickSound)
        saveState()
    })
}

if (dressMeBtn) {
    dressMeBtn.addEventListener('click', function (e) {
        playSound(clickSound)

        const isMatch = checkOutfitMatch(currentTop, currentBottom)

        if (popUpTimeout) clearTimeout(popUpTimeout)

        popUpDiv.classList.remove('noDisplay')
        if (popUpButtons) popUpButtons.classList.add('noDisplay')

        if (isMatch) {
            if (popUpText) popUpText.innerText = "IT'S A MATCH!"
            else popUp.innerText = "IT'S A MATCH!"
            playSound(correctSound)

            if (tryOnEnabled) {
                popUpTimeout = setTimeout(() => {
                    if (popUpText) popUpText.innerText = "DO YOU WANT TO SEE HOW IT LOOKS?"
                    if (popUpButtons) popUpButtons.classList.remove('noDisplay')
                }, 1200)
            } else {
                popUpTimeout = setTimeout(() => {
                    closePopUp()
                }, 1500)
            }
        } else {
            if (popUpText) popUpText.innerText = "MIS-MATCH!"
            else popUp.innerText = "MIS-MATCH!"
            playSound(wrongSound)

            popUpTimeout = setTimeout(() => {
                closePopUp()
            }, 1200)
        }
    })
}

if (popUpNoBtn) {
    popUpNoBtn.addEventListener('click', function () {
        playSound(clickSound)
        closePopUp()
    })
}

if (popUpYesBtn) {
    popUpYesBtn.addEventListener('click', function () {
        playSound(clickSound)
        closePopUp()
        openTryOnContainer()
    })
}

function closePopUp() {
    if (popUpTimeout) clearTimeout(popUpTimeout)
    popUpDiv.classList.add('noDisplay')
    if (popUpButtons) popUpButtons.classList.add('noDisplay')
}

function openTryOnContainer() {
    const topCarouselElem = document.getElementById('topCarousel')
    const bottomCarouselElem = document.getElementById('bottomCarousel')

    if (topCarouselElem) topCarouselElem.classList.add('noDisplay')
    if (bottomCarouselElem) bottomCarouselElem.classList.add('noDisplay')
    carouselBtnDiv.forEach(div => div.classList.add('noDisplay'))

    if (tryOnModelImg) {
        tryOnModelImg.src = selectedModelPath
    }

    if (tryOnContainer) {
        tryOnContainer.classList.remove('noDisplay')
    }
}

function closeTryOnContainer() {
    if (tryOnContainer) {
        tryOnContainer.classList.add('noDisplay')
    }

    const topCarouselElem = document.getElementById('topCarousel')
    const bottomCarouselElem = document.getElementById('bottomCarousel')

    if (topCarouselElem) topCarouselElem.classList.remove('noDisplay')
    if (!isVestidosMode && bottomCarouselElem) {
        bottomCarouselElem.classList.remove('noDisplay')
    }

    carouselBtnDiv.forEach((div, index) => {
        if (isVestidosMode && index === 1) {
            div.classList.add('noDisplay')
        } else {
            div.classList.remove('noDisplay')
        }
    })
}

if (closeTryOnBtn) {
    closeTryOnBtn.addEventListener('click', function () {
        playSound(clickSound)
        closeTryOnContainer()
    })
}

if (runTryOnBtn) {
    runTryOnBtn.addEventListener('click', function () {
        playSound(clickSound)
        runVirtualTryOn()
    })
}

async function urlToBlob(url) {
    const response = await fetch(url)
    return await response.blob()
}

async function prepareGarmentBlob(topImg, bottomImg) {
    const target = isVestidosMode ? topImg : (topImg || bottomImg)
    if (!target) return null
    const src = target.getAttribute('src') || target.src
    return await urlToBlob(src)
}

async function runVirtualTryOn() {
    if (!tryOnStatus || !tryOnModelImg) return

    tryOnStatus.classList.remove('noDisplay')
    if (tryOnStatusText) tryOnStatusText.innerText = "CONNECTING TO IDM-VTON AI..."

    const garmentImg = isVestidosMode ? currentTop : (currentTop || currentBottom)
    if (!garmentImg) {
        if (tryOnStatusText) tryOnStatusText.innerText = "NO GARMENT SELECTED!"
        setTimeout(() => tryOnStatus.classList.add('noDisplay'), 2000)
        return
    }

    const modelSrc = selectedModelPath
    const garmentData = getGarmentData(garmentImg)

    let garmentDescription = "fashion outfit garment"
    if (garmentData) {
        garmentDescription = `${garmentData.color || ''} ${garmentData.type || 'garment'}`.trim()
    }

    try {
        const { Client, handle_file } = await import('https://cdn.jsdelivr.net/npm/@gradio/client/+esm')
        if (tryOnStatusText) tryOnStatusText.innerText = "GENERATING TRY-ON WITH IDM-VTON..."

        const modelBlob = await urlToBlob(modelSrc)
        const garmentBlob = await prepareGarmentBlob(currentTop, currentBottom)

        const modelFile = handle_file(modelBlob)
        const garmentFile = handle_file(garmentBlob)

        const client = await Client.connect("yisol/IDM-VTON")

        const result = await client.predict("/tryon", [
            { background: modelFile, layers: [], composite: null },
            garmentFile,
            garmentDescription,
            true,
            false,
            30,
            42
        ])

        if (result && result.data && result.data[0]) {
            const item = result.data[0]
            const resultUrl = typeof item === 'string' ? item : (item.url || item.path)
            if (resultUrl) {
                tryOnModelImg.src = resultUrl
                tryOnStatus.classList.add('noDisplay')
                return
            }
        }
    } catch (err) {
        console.warn("IDM-VTON Space API call error:", err)
    }

    if (tryOnStatusText) {
        tryOnStatusText.innerText = "HF QUEUE BUSY. CLICK 'TRY ON WITH AI' TO RETRY."
    }

    setTimeout(() => {
        tryOnStatus.classList.add('noDisplay')
    }, 3000)
}

function setRandomImage(carousel, isTop) {
    const available = getAvailableImages(carousel)
    if (available.length === 0) return

    for (let i = 0; i < carousel.length; i++) {
        carousel[i].classList.add('noDisplay')
    }

    const randomIndex = Math.floor(Math.random() * available.length)
    available[randomIndex].classList.remove('noDisplay')

    if (isTop) {
        currentTop = available[randomIndex]
    } else {
        currentBottom = available[randomIndex]
    }
}

if (browseBtn) {
    browseBtn.addEventListener('click', function () {
        playSound(clickSound)

        let count = 0
        const maxCycles = 8
        const interval = setInterval(() => {
            setRandomImage(topCarousel, true)
            if (!isVestidosMode) {
                setRandomImage(bottomCarousel, false)
            }
            playSound(clickSound)
            count++
            if (count >= maxCycles) {
                clearInterval(interval)
                saveState()
            }
        }, 100)
    })
}

function nextImg(carousel) {
    const available = getAvailableImages(carousel)
    if (available.length === 0) return

    let currentIndex = available.findIndex(img => !img.classList.contains('noDisplay'))
    if (currentIndex === -1) currentIndex = 0

    available[currentIndex].classList.add('noDisplay')

    const nextIndex = (currentIndex + 1) % available.length
    available[nextIndex].classList.remove('noDisplay')

    const isTop = carousel === topCarousel || (carousel[0] && carousel[0].classList.contains('top'))
    if (isTop) {
        currentTop = available[nextIndex]
    } else {
        currentBottom = available[nextIndex]
    }
    saveState()
}

function prevImg(carousel) {
    const available = getAvailableImages(carousel)
    if (available.length === 0) return

    let currentIndex = available.findIndex(img => !img.classList.contains('noDisplay'))
    if (currentIndex === -1) currentIndex = 0

    available[currentIndex].classList.add('noDisplay')

    const prevIndex = (currentIndex - 1 + available.length) % available.length
    available[prevIndex].classList.remove('noDisplay')

    const isTop = carousel === topCarousel || (carousel[0] && carousel[0].classList.contains('top'))
    if (isTop) {
        currentTop = available[prevIndex]
    } else {
        currentBottom = available[prevIndex]
    }
    saveState()
}