document.addEventListener('DOMContentLoaded', () => {

    const CONFIG = {
        SPIN_DURATION: 8000, 
        MIN_SPINS: 5,        
        MAX_SPINS: 9,        
        STORAGE_KEY: 'ruleta_aventuras_premio_v2' 
    };

    // CAMBIO: Nueva paleta de colores más vibrante y saturada
    const premios = [
        { text: 'Bono 50%', subtext: 'en tiquetes aéreos', color: '#ff4d4d', code: 'BONO50', winnable: true }, // Rojo vibrante
        { text: 'Descuento', subtext: '$500.000 COP', color: '#1a75ff', code: 'DESC500', winnable: true }, // Azul intenso
        { text: 'Bono', subtext: 'Orlando, Florida', color: '#ffab00', textColor: '#000', code: 'ORLANDO', winnable: true }, // Naranja
        { text: 'Descuento', subtext: '$400.000 COP', color: '#9d00ff', code: 'DESC400', winnable: true }, // Púrpura
        { text: '¡Viaje TODO PAGO!', subtext: 'Premio Mayor', color: 'gold', code: 'VIATODO', winnable: false }, // Dorado se mantiene
        { text: 'Descuento', subtext: '$300.000 COP', color: '#ff6f00', code: 'DESC300', winnable: true }, // Naranja oscuro
        { text: 'Bono', subtext: 'Las Vegas', color: '#00c853', code: 'LASVEGAS', winnable: true }, // Verde esmeralda
        { text: 'Descuento', subtext: '$200.000 COP', color: '#00b8d4', code: 'DESC200', winnable: true }, // Cyan
        { text: 'Inténtalo', subtext: 'de Nuevo', color: '#455a64', winnable: false }, // Gris oscuro azulado
        { text: 'Descuento', subtext: '$100.000 COP', color: '#d500f9', code: 'DESC100', winnable: true }, // Fucsia
    ];

    // --- Selectores del DOM ---
    const container = document.querySelector('.container');
    const canvas = document.getElementById('roulette-canvas');
    const spinBtn = document.getElementById('spin-btn');
    const spinMessage = document.getElementById('spin-message');
    // CAMBIO: ya no necesitamos la variable 'gear'
    const modal = document.getElementById('winner-modal');
    const closeBtn = document.querySelector('.close-btn');
    const winnerText = document.getElementById('winner-text');
    const winnerCodeEl = document.getElementById('winner-code');
    const previousWinnerContainer = document.getElementById('previous-winner-container');
    const previousWinnerCodeEl = document.getElementById('previous-winner-code');
    const tickSound = document.getElementById('tick-sound');
    const winSound = document.getElementById('win-sound');
    const ctx = canvas.getContext('2d');
    
    // --- (Estado de la aplicación sin cambios) ---
    let currentRotation = 0;
    let isSpinning = false;
    const totalPrizes = premios.length;
    let canvasSize = 0;
    
    // --- (Lógica de persistencia sin cambios) ---
    function checkAlreadySpun() {
        const storedPrize = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (storedPrize) {
            const { code } = JSON.parse(storedPrize);
            spinBtn.classList.add('hidden');
            spinMessage.textContent = '';
            previousWinnerContainer.classList.remove('hidden');
            previousWinnerCodeEl.textContent = code;
            return true;
        }
        return false;
    }

    function savePrize(prize, code) {
        const data = { prize, code };
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
    }
    
    function setupAndDrawCanvas() {
        const containerWidth = container.clientWidth;
        canvasSize = containerWidth;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvasSize * dpr;
        canvas.height = canvasSize * dpr;
        canvas.style.width = `${canvasSize}px`;
        canvas.style.height = `${canvasSize}px`;
        ctx.scale(dpr, dpr);
        drawRoulette();
    }

    function drawRoulette() {
        const arcSize = (2 * Math.PI) / totalPrizes;
        // CAMBIO: Se reduce el radio para dejar un margen para el resplandor
        const margin = canvasSize / 30;
        const radius = (canvasSize / 2) - margin;
        const center = canvasSize / 2;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        premios.forEach((premio, i) => {
            const angle = i * arcSize;
            
            ctx.save();
            ctx.beginPath();
            
            if (premio.color === 'gold') {
                const goldGradient = ctx.createRadialGradient(center, center, 10, center, center, radius);
                goldGradient.addColorStop(0, '#FFF7B2');
                goldGradient.addColorStop(0.5, '#DAA520');
                goldGradient.addColorStop(1, '#A87C00');
                ctx.fillStyle = goldGradient;
            } else {
                ctx.fillStyle = premio.color;
            }
            
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, angle, angle + arcSize);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, angle, angle + arcSize);
            ctx.closePath();
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = margin; // Usar el margen como valor del resplandor
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = canvasSize / 100; // Borde más grueso
            ctx.stroke();
            ctx.restore();
            
            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(angle + arcSize / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = premio.textColor || '#fff';
            
            const baseFontSize = canvasSize / 28;
            const subtextFontSize = canvasSize / 38;
            const textRadius = radius * 0.65; // Distancia del texto desde el centro

            // CAMBIO: Lógica de centrado de texto mejorada
            if (premio.subtext) {
                // Si hay dos líneas, dibujar una arriba y otra abajo del punto central
                ctx.font = `900 ${baseFontSize}px ${getComputedStyle(document.body).fontFamily}`;
                ctx.fillText(premio.text, textRadius, -(baseFontSize * 0.6));
                
                ctx.font = `500 ${subtextFontSize}px ${getComputedStyle(document.body).fontFamily}`;
                ctx.fillText(premio.subtext, textRadius, subtextFontSize * 0.8);
            } else {
                // Si solo hay una línea, centrarla verticalmente
                ctx.font = `900 ${baseFontSize}px ${getComputedStyle(document.body).fontFamily}`;
                ctx.fillText(premio.text, textRadius, 0);
            }
            ctx.restore();
        });
    }

    // --- (Lógica de giro sin cambios, excepto por la eliminación de la rotación del engranaje) ---
    function generateWinnerCode(prizeCode) {
        // ... (código sin cambios)
        const date=new Date(),year=date.getFullYear().toString().slice(-2),month=(date.getMonth()+1).toString().padStart(2,"0"),day=date.getDate().toString().padStart(2,"0"),dateString=`${year}${month}${day}`,randomChars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";let randomString="";for(let i=0;i<4;i++)randomString+=randomChars.charAt(Math.floor(Math.random()*randomChars.length));return`${prizeCode}-${dateString}-${randomString}`
    }

    function spin() {
        if (isSpinning || checkAlreadySpun()) return;
        isSpinning = true;
        spinBtn.disabled = true;
        spinBtn.textContent = 'GIRANDO...';
        const winnablePrizes = premios.map((p, i) => (p.winnable) ? i : -1).filter(i => i !== -1);
        const winnerIndex = winnablePrizes[Math.floor(Math.random() * winnablePrizes.length)];
        const winner = premios[winnerIndex];
        const prizeAngle = (winnerIndex * 360) / totalPrizes;
        const randomOffset = (360 / totalPrizes) * (Math.random() * 0.6 + 0.2);
        const targetAngle = prizeAngle + randomOffset;
        const randomSpins = Math.floor(Math.random() * (CONFIG.MAX_SPINS - CONFIG.MIN_SPINS + 1)) + CONFIG.MIN_SPINS;
        const finalRotation = (randomSpins * 360) + (360 - targetAngle) - 90;
        const startRotation = currentRotation;
        let startTime = null;
        playAudio(tickSound);
        function animationLoop(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / CONFIG.SPIN_DURATION, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 5);
            const rotation = startRotation + (finalRotation - startRotation) * easedProgress;
            const rotationStyle = `rotate(${rotation}deg)`;
            canvas.style.transform = rotationStyle;
            // CAMBIO: Se elimina la rotación del engranaje/emoji
            // gear.style.transform = rotationStyle; 
            if (progress < 1) {
                requestAnimationFrame(animationLoop);
            } else {
                currentRotation = finalRotation % 360;
                isSpinning = false;
                tickSound.pause();
                playAudio(winSound);
                const generatedCode = generateWinnerCode(winner.code);
                savePrize(winner, generatedCode); 
                document.querySelector('.roulette-container').classList.add('winner-pulse');
                setTimeout(() => {
                    document.querySelector('.roulette-container').classList.remove('winner-pulse');
                    launchFireworks();
                    showWinnerModal(winner, generatedCode);
                }, 1500);
            }
        }
        requestAnimationFrame(animationLoop);
    }
    
    function showWinnerModal(winner, code) {
        let htmlContent = `${winner.text}<br><small style="font-size: 1.2rem; color: #ccc;">${winner.subtext}</small>`;
        winnerText.innerHTML = htmlContent;
        winnerCodeEl.textContent = code;
        modal.classList.add('visible');
    }

    function hideWinnerModal() {
        modal.classList.remove('visible');
        checkAlreadySpun();
    }

    function playAudio(audioElement) {
        audioElement.currentTime = 0;
        const promise = audioElement.play();
        if (promise !== undefined) {
            promise.catch(error => console.error("Error al reproducir audio:", error));
        }
    }
    
    function launchFireworks() {
        const duration=5*1000,animationEnd=Date.now()+duration,defaults={startVelocity:30,spread:360,ticks:60,zIndex:1001};function randomInRange(min,max){return Math.random()*(max-min)+min}const interval=setInterval(()=>{const timeLeft=animationEnd-Date.now();if(timeLeft<=0)return clearInterval(interval);const particleCount=50*(timeLeft/duration);confetti({...defaults,particleCount,origin:{x:randomInRange(0.1,0.3),y:Math.random()-0.2}});confetti({...defaults,particleCount,origin:{x:randomInRange(0.7,0.9),y:Math.random()-0.2}})},250);
    }

    function setupEventListeners() {
        spinBtn.addEventListener('click', spin);
        closeBtn.addEventListener('click', hideWinnerModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideWinnerModal();
        });
        window.addEventListener('resize', setupAndDrawCanvas);
    }

    function init() {
        setupAndDrawCanvas();
        setupEventListeners();
        checkAlreadySpun();
    }

    init();
});