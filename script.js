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
        try {
            audio.currentTime = 0
            var promise = audio.play()
            if (promise && typeof promise.catch === 'function') {
                promise.catch(function () { })
            }
        } catch (e) { }
    }
}

let clothesData = {}
let clothesLookupMap = {}

function initClothesLookup() {
    clothesLookupMap = {}
    if (!clothesData) return
    Object.keys(clothesData).forEach(function (key) {
        var item = clothesData[key]
        if (!item) return
        clothesLookupMap[key] = item
        var relativeKey = key.replace(/^.*(?=assets\/)/, '')
        clothesLookupMap[relativeKey] = item
        var filename = key.split('/').pop()
        clothesLookupMap[filename] = item
    })
}
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
        img.setAttribute('data-key', src)
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

let saveStateTimeout = null
function saveState() {
    if (saveStateTimeout) clearTimeout(saveStateTimeout)
    saveStateTimeout = setTimeout(saveStateImmediately, 200)
}

function saveStateImmediately() {
    if (saveStateTimeout) clearTimeout(saveStateTimeout)
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

if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', saveStateImmediately)
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
        initClothesLookup()
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
    var key = img.getAttribute('data-key')
    if (key && clothesLookupMap[key]) return clothesLookupMap[key]
    var src = img.getAttribute('src') || img.src || ''
    if (clothesLookupMap[src]) return clothesLookupMap[src]
    var relativeSrc = src.replace(/^.*(?=assets\/)/, '')
    if (clothesLookupMap[relativeSrc]) return clothesLookupMap[relativeSrc]
    var filename = src.split('/').pop()
    return clothesLookupMap[filename] || null
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

// ==========================================
// Virtual Try-On (IDM-VTON) Compatibility Layer
// Compatible with Chrome, modern browsers, and Safari on iPad iOS 12
// 1. Eliminates all unnecessary custom headers (avoids Safari CORS preflight OPTIONS blocks)
// 2. Supports routing through a public/private CORS proxy for testing and prototyping
// ==========================================

const HF_SPACE_BASE_URL = 'https://yisol-idm-vton.hf.space';
const DEFAULT_PUBLIC_CORS_PROXY = 'https://corsproxy.io/?url=';

let configuredCorsProxy = localStorage.getItem('vton_cors_proxy') || '';
const corsProxyToggleBtn = document.getElementById('corsProxyToggleBtn');

function formatProxiedUrl(targetUrl, proxy) {
    if (!proxy || typeof proxy !== 'string' || !proxy.trim()) {
        return targetUrl;
    }
    const cleanProxy = proxy.trim();
    if (cleanProxy.indexOf('?url=') !== -1) {
        return cleanProxy + encodeURIComponent(targetUrl);
    }
    return cleanProxy.endsWith('/') ? (cleanProxy + targetUrl) : (cleanProxy + '/' + targetUrl);
}

function updateCorsProxyBtnUI() {
    if (!corsProxyToggleBtn) return;
    if (configuredCorsProxy && configuredCorsProxy.trim()) {
        corsProxyToggleBtn.innerText = 'PROXY: ON';
        corsProxyToggleBtn.title = 'Proxy CORS activo: ' + configuredCorsProxy;
        corsProxyToggleBtn.style.color = '#ffff00';
    } else {
        corsProxyToggleBtn.innerText = 'PROXY: OFF';
        corsProxyToggleBtn.title = 'Conexión directa (sin proxy). Haz clic para configurar proxy CORS.';
        corsProxyToggleBtn.style.color = '';
    }
}

if (corsProxyToggleBtn) {
    updateCorsProxyBtnUI();
    corsProxyToggleBtn.addEventListener('click', function () {
        playSound(clickSound);
        const current = configuredCorsProxy || '';
        const defaultPrompt = current || DEFAULT_PUBLIC_CORS_PROXY;
        const choice = prompt(
            'Configuración de Proxy CORS para Safari en iPad / pruebas:\n\n' +
            '• Introduce la URL del proxy (ej: https://corsproxy.io/?url= o https://api.allorigins.win/raw?url=)\n' +
            '• O deja el campo vacío para usar conexión directa sin proxy.',
            defaultPrompt
        );

        if (choice === null) return;

        const trimmed = choice.trim();
        configuredCorsProxy = trimmed;
        if (trimmed) {
            localStorage.setItem('vton_cors_proxy', trimmed);
        } else {
            localStorage.removeItem('vton_cors_proxy');
        }
        updateCorsProxyBtnUI();
    });
}

async function urlToBlob(url) {
    const response = await fetch(url, { credentials: 'same-origin' });
    if (!response.ok) {
        throw new Error('Failed to fetch image blob: ' + url);
    }
    return await response.blob();
}

async function prepareGarmentBlob(topImg, bottomImg) {
    const target = isVestidosMode ? topImg : (topImg || bottomImg);
    if (!target) return null;
    const src = target.getAttribute('src') || target.src;
    return await urlToBlob(src);
}

// 1. Upload files with NO custom headers (Safari iOS 12 CORS safe)
async function vtonUploadFiles(modelBlob, garmentBlob, proxy) {
    const uploadUrl = formatProxiedUrl(HF_SPACE_BASE_URL + '/upload', proxy);
    const formData = new FormData();
    formData.append('files', modelBlob, 'model.png');
    formData.append('files', garmentBlob, 'garment.png');

    // IMPORTANT: Do NOT define headers object!
    // Browser automatically sets Content-Type: multipart/form-data with boundary.
    // Setting credentials: 'omit' prevents strict credential preflight failures in Safari.
    const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        credentials: 'omit'
    });

    if (!response.ok) {
        throw new Error('Upload failed with status ' + response.status);
    }

    const uploaded = await response.json();
    if (!uploaded || !Array.isArray(uploaded) || uploaded.length < 2) {
        throw new Error('Invalid upload response from HF Space');
    }
    return uploaded;
}

// 2. Start prediction with strictly necessary headers only
async function vtonStartPrediction(modelPath, garmentPath, description, proxy) {
    const callUrl = formatProxiedUrl(HF_SPACE_BASE_URL + '/call/tryon', proxy);
    const payload = {
        data: [
            {
                background: {
                    path: modelPath,
                    url: HF_SPACE_BASE_URL + '/file=' + modelPath,
                    orig_name: 'model.png',
                    meta: { _type: 'gradio.FileData' }
                },
                layers: [],
                composite: null
            },
            {
                path: garmentPath,
                url: HF_SPACE_BASE_URL + '/file=' + garmentPath,
                orig_name: 'garment.png',
                meta: { _type: 'gradio.FileData' }
            },
            description || 'fashion outfit garment',
            true,  // is_checked (auto mask)
            false, // is_checked_crop
            30,    // denoise_steps
            42     // seed
        ]
    };

    // ONLY the single standard 'Content-Type' header is sent.
    // No custom headers (no x-gradio-user, no Authorization, no cookies).
    const response = await fetch(callUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        credentials: 'omit'
    });

    if (!response.ok) {
        throw new Error('Prediction call failed with status ' + response.status);
    }

    const data = await response.json();
    if (!data || !data.event_id) {
        throw new Error('Missing event_id in prediction response');
    }
    return data.event_id;
}

// 3. Fallback stream reader using standard fetch
async function vtonListenFetchFallback(streamUrl, onProgress) {
    const response = await fetch(streamUrl, {
        method: 'GET',
        credentials: 'omit'
    });

    if (!response.ok) {
        throw new Error('Stream request failed with status ' + response.status);
    }

    if (response.body && response.body.getReader) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const result = await reader.read();
            if (result.done) break;
            const chunk = decoder.decode(result.value, { stream: true });
            buffer += chunk;

            if (buffer.indexOf('event: heartbeat') !== -1 && onProgress) {
                onProgress('WAITING IN GPU QUEUE...');
            }
            if (buffer.indexOf('event: generating') !== -1 && onProgress) {
                onProgress('GENERATING OUTFIT WITH IDM-VTON...');
            }
            if (buffer.indexOf('event: complete') !== -1) {
                const match = buffer.match(/event:\s*complete\s+data:\s*(\[.*?\])/);
                if (match) {
                    return JSON.parse(match[1]);
                }
            }
            if (buffer.indexOf('event: error') !== -1) {
                throw new Error('HF Space returned event error');
            }
        }
    } else {
        const text = await response.text();
        const match = text.match(/event:\s*complete\s+data:\s*(\[.*?\])/);
        if (match) {
            return JSON.parse(match[1]);
        }
    }

    throw new Error('Stream finished without complete event');
}

// 4. Listen to SSE results stream (native EventSource + streaming fetch fallback)
function vtonListenEventStream(eventId, proxy, onProgress) {
    return new Promise(function (resolve, reject) {
        const directStreamUrl = HF_SPACE_BASE_URL + '/call/tryon/' + eventId;
        const streamUrl = formatProxiedUrl(directStreamUrl, proxy);

        let isCompleted = false;
        let eventSource = null;

        const timer = setTimeout(function () {
            if (!isCompleted) {
                if (eventSource) {
                    try { eventSource.close(); } catch (e) {}
                }
                reject(new Error('Try-on request timed out after 120s'));
            }
        }, 120000);

        function cleanup() {
            clearTimeout(timer);
            if (eventSource) {
                try { eventSource.close(); } catch (e) {}
                eventSource = null;
            }
        }

        try {
            eventSource = new EventSource(streamUrl);

            eventSource.addEventListener('heartbeat', function () {
                if (onProgress) onProgress('WAITING IN GPU QUEUE...');
            });

            eventSource.addEventListener('generating', function () {
                if (onProgress) onProgress('GENERATING OUTFIT WITH IDM-VTON...');
            });

            eventSource.addEventListener('complete', function (e) {
                isCompleted = true;
                cleanup();
                try {
                    const data = JSON.parse(e.data);
                    resolve(data);
                } catch (err) {
                    reject(new Error('Failed to parse complete event: ' + err.message));
                }
            });

            eventSource.addEventListener('error', function () {
                if (isCompleted) return;
                // If EventSource disconnects or proxy buffers SSE, fallback to fetch
                cleanup();
                vtonListenFetchFallback(streamUrl, onProgress)
                    .then(function (data) {
                        isCompleted = true;
                        resolve(data);
                    })
                    .catch(function (fetchErr) {
                        reject(fetchErr);
                    });
            });
        } catch (esError) {
            cleanup();
            vtonListenFetchFallback(streamUrl, onProgress)
                .then(resolve)
                .catch(reject);
        }
    });
}

// Execute complete VTON pipeline
async function executeVtonPipeline(modelBlob, garmentBlob, description, proxy) {
    if (tryOnStatusText) {
        tryOnStatusText.innerText = proxy
            ? 'CONNECTING VIA CORS PROXY...'
            : 'CONNECTING TO IDM-VTON AI...';
    }

    if (tryOnStatusText) tryOnStatusText.innerText = 'UPLOADING GARMENT TO AI...';
    const uploadedPaths = await vtonUploadFiles(modelBlob, garmentBlob, proxy);

    if (tryOnStatusText) tryOnStatusText.innerText = 'QUEUED IN IDM-VTON AI...';
    const eventId = await vtonStartPrediction(uploadedPaths[0], uploadedPaths[1], description, proxy);

    if (tryOnStatusText) tryOnStatusText.innerText = 'GENERATING TRY-ON WITH IDM-VTON...';
    const resultData = await vtonListenEventStream(eventId, proxy, function (msg) {
        if (tryOnStatusText) tryOnStatusText.innerText = msg;
    });

    return resultData;
}

async function runVirtualTryOn() {
    if (!tryOnStatus || !tryOnModelImg) return;

    tryOnStatus.classList.remove('noDisplay');
    if (tryOnStatusText) tryOnStatusText.innerText = "CONNECTING TO IDM-VTON AI...";

    const garmentImg = isVestidosMode ? currentTop : (currentTop || currentBottom);
    if (!garmentImg) {
        if (tryOnStatusText) tryOnStatusText.innerText = "NO GARMENT SELECTED!";
        setTimeout(() => tryOnStatus.classList.add('noDisplay'), 2000);
        return;
    }

    const modelSrc = selectedModelPath;
    const garmentData = getGarmentData(garmentImg);

    let garmentDescription = "fashion outfit garment";
    if (garmentData) {
        garmentDescription = `${garmentData.color || ''} ${garmentData.type || 'garment'}`.trim();
    }

    try {
        if (tryOnStatusText) tryOnStatusText.innerText = "PREPARING IMAGES...";
        const modelBlob = await urlToBlob(modelSrc);
        const garmentBlob = await prepareGarmentBlob(currentTop, currentBottom);

        if (!modelBlob || !garmentBlob) {
            throw new Error("Could not load image blobs for model or garment");
        }

        let resultData = null;
        const initialProxy = configuredCorsProxy;

        try {
            // First attempt: try with current proxy setting (or direct if empty)
            resultData = await executeVtonPipeline(modelBlob, garmentBlob, garmentDescription, initialProxy);
        } catch (firstErr) {
            console.warn("First VTON attempt failed:", firstErr);
            // If direct failed without proxy (e.g. CORS preflight blocked by Safari on iPad), auto-retry through proxy
            if (!initialProxy) {
                console.log("Direct request failed; attempting fallback via public CORS proxy...");
                if (tryOnStatusText) {
                    tryOnStatusText.innerText = "CORS BLOCKED: RETRYING VIA PROXY...";
                }
                resultData = await executeVtonPipeline(modelBlob, garmentBlob, garmentDescription, DEFAULT_PUBLIC_CORS_PROXY);
            } else {
                throw firstErr;
            }
        }

        if (resultData && resultData[0]) {
            const item = resultData[0];
            const resultUrl = typeof item === 'string'
                ? item
                : (item.url || (HF_SPACE_BASE_URL + '/file=' + item.path));

            if (resultUrl) {
                tryOnModelImg.src = resultUrl;
                tryOnStatus.classList.add('noDisplay');
                return;
            }
        }

        throw new Error("No image URL received in completion data");
    } catch (err) {
        console.warn("IDM-VTON API call error:", err);
        if (tryOnStatusText) {
            tryOnStatusText.innerText = "HF QUEUE BUSY OR CORS ERROR. CLICK TO RETRY.";
        }
    }

    setTimeout(() => {
        tryOnStatus.classList.add('noDisplay');
    }, 3500);
}

function setRandomImage(carousel, isTop, prefilteredAvailable) {
    const available = prefilteredAvailable || getAvailableImages(carousel)
    if (!available || available.length === 0) return

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

        const availableTops = getAvailableImages(topCarousel)
        const availableBottoms = !isVestidosMode ? getAvailableImages(bottomCarousel) : []

        let count = 0
        const maxCycles = 8
        const interval = setInterval(() => {
            setRandomImage(topCarousel, true, availableTops)
            if (!isVestidosMode) {
                setRandomImage(bottomCarousel, false, availableBottoms)
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