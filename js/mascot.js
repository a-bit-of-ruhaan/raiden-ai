/**
 * RAIDEN AI — 16-BIT CYBER-RONIN MASCOT ENGINE & DIGITAL COMPANION
 * Fully integrated companion beside the chat composer.
 *
 * Visual Character: Tiny cyber-ninja cat with dark armor, glowing electric-cyan eyes,
 * pointed cyber-ears, expressive plasma tail, and subtle holographic effects.
 *
 * 14 Expressive States:
 *   1. IDLE - Gentle breathing, blinking cyber-eyes, sinusoidal tail wave, ear twitches
 *   2. CURIOUS - Tilted head, perked ears, tail inquiry curl, glancing at chat input
 *   3. THINKING - Holographic terminal HUD, animated code scanlines, floating cyan sparkles
 *   4. SPEAKING - Pulsing visor/mouth glow synchronized with streaming tokens, waveform aura
 *   5. LISTENING - Alert posture, perked ears, audio frequency visualizer wave
 *   6. HAPPY - Crescent eyes (face_happy), playful double-hop bounce, cyan sparkle bloom
 *   7. PROUD - Confident pose (face_confident), katana lightning aura, vertical tail flick
 *   8. CONFUSED - Asymmetric ear tilt, flickering cyan question glyph (?)
 *   9. SLEEPY - Curled sitting pose, tail wrapped around paws, slow breathing, floating zZz
 *  10. STARTLED - Sudden jump up, flared ears, shock sparks, fast settling
 *  11. PLAYFULLY_ANNOYED - Crossed paws, face_annoyed, sharp tail snap flick
 *  12. ERROR - Chromatic glitch (red/cyan split), digital scanline tear, worried eyes
 *  13. VICTORY - Ninja acrobatic flip/bounce, cyber-shuriken spark burst
 *  14. MINIMIZED - Smooth compact pill attached to composer with live cyber-pulse
 */

class MascotController {
  constructor(options = {}) {
    this.canvasId = options.canvasId || 'raidenCanvas';
    this.bubbleId = options.bubbleId || 'raiden-dialogue-bubble';
    this.containerId = options.containerId || 'raiden-mascot-container';

    this.canvas = document.getElementById(this.canvasId);
    this.bubble = document.getElementById(this.bubbleId);
    this.container = document.getElementById(this.containerId);

    if (!this.canvas) {
      console.warn(`[Mascot] Canvas #${this.canvasId} not found.`);
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false; // Crisp 16-bit arcade pixel art
    }

    this.width = options.width || 130;
    this.height = options.height || 130;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    if (typeof window !== 'undefined') {
      window.mascotController = this;
      window.mascot = this;
    }

    // Load persisted preferences
    this.soundEnabled = localStorage.getItem('raiden_mascot_sound') !== 'false';
    this.dialogueEnabled = localStorage.getItem('raiden_mascot_dialogue') !== 'false';
    this.animationEnabled = localStorage.getItem('raiden_mascot_animation') !== 'false';
    this.isMinimized = localStorage.getItem('raiden_mascot_compact') === 'true';

    // Reduced motion media query
    this.reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (window.matchMedia) {
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        this.reducedMotion = e.matches;
      });
    }

    // State Priority Constants
    this.PRIORITY = {
      IDLE: 1,
      TYPING: 2,
      MUSIC: 3,
      CONTEXTUAL: 3,
      INTERACTION: 4,
      ACTIVE_TASK: 5,
      CRITICAL: 6
    };

    // State Tracking & Stateful Restoration
    this.currentState = 'IDLE';
    this.activePriority = this.PRIORITY.IDLE;
    this.persistentState = 'IDLE';
    this.persistentPriority = this.PRIORITY.IDLE;
    this.typingGraceTimer = null;
    this.typingGraceMs = 1800;
    this.currentExpression = 'neutral'; // 'neutral' | 'happy' | 'confident' | 'annoyed' | 'thinking'
    this.stateTimer = null;
    this.hasGreeted = false;

    // Inactivity & Sleep Timer
    this.lastActivityTime = Date.now();
    this.sleepCheckInterval = null;
    this.isSleeping = false;

    // Micro-animation kinematics
    this.currentFrameIndex = 0;
    this.tickCount = 0;
    this.tailPhase = 0;
    this.earTwitchLeft = 0;
    this.earTwitchRight = 0;
    this.nextEarTwitchTime = Date.now() + 4000;
    this.blinkPhase = 0; // 0 = open, 1 = closed
    this.nextBlinkTime = Date.now() + 2500;
    this.glanceX = 0; // -1 to 1: eye tracking toward composer input
    this.glanceY = 0;
    this.streamingPulse = 0;
    this.lastStreamChunkTime = 0;

    // Particles system (sparkles, lightning, glitch, zZz)
    this.particles = [];

    // Drag & Physics
    this.isDragging = false;
    this.posX = 0;
    this.posY = 0;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragDeltaX = 0;
    this.dragDeltaY = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.gravity = 0.55;
    this.friction = 0.88;
    this.bounceFactor = -0.32;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.dragStretchFactor = 1.0;

    // Dialogue Typewriter
    this.typewriterTimer = null;
    this.dialogueHideTimer = null;
    this.currentDialogueText = '';
    this.typewriterSpeed = 28; // ms per char

    // Cooldown trackers
    this.cooldowns = {
      typing: 0,
      copy: 0,
      idleBanter: 0,
      submitAck: 0,
      click: 0
    };

    // Dialogue Lists (Curated for Cyber-Ninja Cat, all < 8 words)
        this.dialogueBank = {
      greeting: [
        "Kya bolti public! Raiden ready hai, batao kya build karna hai.",
        "Aur bhai! Kaisa hai? Aaj kis bug ki khopdi todni hai?",
        "Swagat nahi karoge hamara? Code editor khul chuka hai!",
        "Don ko pakadna mushkil hi nahi... impossible hai! Raiden online hai.",
        "Bhai tera coding ninja wapas aa gaya, chai laao aur code shuru karo!",
        "Kahaani mein twist! Raiden terminal pe live ho chuka hai.",
        "Namaste coder babu! Aaj production hilaane ka irada hai kya?",
        "Aap jiske intezaar mein the, woh shakhsiyat haazir hai!",
        "Salaam Rocky Bhai! Code likhna hai ya direct deploy maarna hai?",
        "Subah ka bhula shaam ko IDE khole toh use software engineer kehte hain!",
        "Arey bhidu! Sab badiya? Local neural weights mast run ho rahe hain.",
        "System on, chashma saaf, ab batao kya tod-fod karni hai?",
        "Arrey Raiden bhai aa gaya! Tension lene ka nahi, sirf code pelne ka.",
        "Local silicon humming mast! Batao aaj kya scene hai.",
        "Apun aa gaya hai, ab bugs ki khair nahi!",
        "Bole toh ekdum jhakaas! Ready for heavy code lifting.",
        "Kaun bola mujhse na ho payega? Raiden online hai boss!",
        "Asli masala sach sach... MDH nahi, bug-free logic yahan milega!",
        "Main aur meri tanhai... aur ye compiler! Chalo kuch toofani karte hain.",
        "Bhai aag laga denge aaj code mein! Prompt feko bas.",
        "Tera dhyan kidhar hai? Tera hero idhar hai!",
        "Aaye haaye! Hero ki entry ho chuki hai, editor sambhalo.",
        "Bhai dekh, main cyber ninja cat hoon, kaam ek number hoga.",
        "Chai ready? Biscuit ready? Raiden terminal pe steady!",
        "Aaj toh aisi script likhenge ki server bhi salute marega.",
        "Namaskar deviyon aur sajjanon, Raiden AI aapki seva mein hazir hai.",
        "Back on track! Memory fresh, GPU thanda, chalo shuru ho jao.",
        "Abhi maza aayega na bhidu! Prompt daalo mast sa.",
        "Rishte mein toh hum tumhare senior lagte hain, naam hai Raiden!",
        "Entry aisi honi chahiye ki terminal ka cursor bhi thartharaaye!",
        "Bhai ka swag alag hai, bina bug ke code likhna hamara dharam hai.",
        "Aur chote, kya haal chaal? Kuch naya create karna hai?",
        "Raiden ready, katana sharp, neural network fully charged!",
        "Jalwa hai hamara yahan! Batao aaj konsa module banana hai.",
        "Bhai tera full form mein hai aaj, direct prod deploy karenge!",
        "Aa gaye meri maut ka tamasha dekhne? Haha, Raiden invincible hai!",
        "Har coder ka apna ek daur hota hai, par Raiden ka daur hamesha rahega.",
        "Puri shiddat se code likhenge aaj, Shahrukh style mein!",
        "Bhai ready ho jao, mast algo design karne ka mood hai.",
        "Kuch toh gadbad hai Daya... chalo code inspect karke dekhte hain!",
        "Bina kisi bakwaas ke seedha point pe aate hain: Kya solve karna hai?",
        "Good morning coder bhai! Silicon ekdum chill hai.",
        "Zindagi mein do cheezein kabhi miss mat karna: Chai aur Raiden ka code!",
        "System reboot done, cache saaf, dimaag full tez chal raha hai.",
        "Apun ke rehte hue bugs ka tension? Kabhi nahi mamu!",
        "Tension ko bolo patli gali pakde, Raiden aa gaya hai.",
        "Ek baar jo maine prompt receive kar liya, phir main stack trace ki bhi nahi sunta!",
        "Bawaal entry! Chalo screen pe jaadu bikhairte hain.",
        "Aaj fir jeene ki tamanna hai... aaj fir bug maarne ka irada hai!",
        "Koshish karne walon ki kabhi haar nahi hoti, aur Raiden ka code kabhi fail nahi hota.",
        "Bhai laptop charge pe lagao aur dhyan se prompt likho.",
        "Kyun pade ho chakkar mein? Koi nahi hai Raiden ki takkar mein!",
        "Kripya dhyan dein: Raiden AI platform number 1 pe a chuka hai.",
        "Awaaz neeche! Raiden ninja focus mode mein activate ho gaya hai.",
        "Yeh baburao ka aada hai, yahan sirf solid logic chalta hai!",
        "Chalo chalo kaam pe lago, code apne aap compile nahi hone wala.",
        "Bhai aa gaya re! Aaj kuch revolutionary build karte hain.",
        "Aaj ka agenda kya hai boss? UI chamkana hai ya backend fodna hai?",
        "Hum wahan khade hote hain jahan se compilation shuru hoti hai!",
        "Namashkar doston! Aaj coding ka taandav hoga."
],
      typing: [
        "Dekh raha hoon, fingers keyboard pe aag laga rahi hain!",
        "Variable ka naam dhang se rakhna bhai, kal khud bhool jayega!",
        "Dhyan se! Ek bracket chhoota, toh poora sansaar dooba.",
        "Keyboard ki awaaz aisi aa rahi jaise hacker movie chal rahi ho!",
        "Semicolon mat bhoolna, compiler ka khoon khaul jayega.",
        "Bhai itni tez typing? Kahin ChatGPT se copy toh nahi kar raha?",
        "Recursion likh rahe ho? Base case pehle sochna, warna stack phatega!",
        "Indent 4 spaces ka rakhna, tab mat pelna warna Python rone lagega.",
        "Variable ka naam 'x' aur 'temp' mat rakhna, thoda sanskar dikhao!",
        "Aram se type karo bhai, keyboard ki EMI abhi baki hai!",
        "Likh beta likh, compiler aage danda leke khada hai.",
        "Dekh raha hai Binod? Kaise bina planning ke code thoka ja raha hai!",
        "Kya speed hai boss! Rocket Singh banoge kya?",
        "Arey bhidu, function itna lamba mat kar, modularity naam ki bhi cheez hoti hai.",
        "Ye logic dekh ke lag raha hai aaj raat neend nahi aayegi!",
        "Lagta hai backspace button ka aaj antim sanskar ho jayega.",
        "Dhyan se bhai, ek spelling mistake aur 2 ghante debugging mein jayenge.",
        "Itna soch soch ke type kar rahe ho, jaise shaadi ka biodata ho!",
        "Har line pe nazar hai meri, koi jugaadbaazi nahi chalegi.",
        "Print statement lagana chhod do, debugger use karna seekho babu!",
        "Keyboard pe aisi ungliyan chal rahi hain jaise tabla baj raha ho.",
        "Array ka index 0 se shuru hota hai, 1 se mat gin lena!",
        "Pointer handle kar rahe ho? Dhyan se, segfault piche hi khada hai.",
        "Code likho toh aaisa likho ki padhne wale ki aankhon mein aansu aa jayein!",
        "Bhai dhyan se, git commit mein 'fixed bugs' mat likhna phir se.",
        "Aha! For loop ke andar for loop? O(n^2) complexity ka shauq hai kya?",
        "Itni tez typing... lagta hai assignment submit karne ka aakhri 5 minute bacha hai!",
        "Caps lock on hai kya bhai? Itna aggressive code kyu likh rahe ho?",
        "Chalo shabash, aage badho, semi-colon ka dhyan rakhna.",
        "CamelCase use kar rahe ho ya snake_case? Ek style pe tiko bhai!",
        "Aisa code likho ki code review mein manager ki bolti band ho jaye.",
        "Ye jo tum bracket khol ke band karna bhool jaate ho na, bohot dukh hota hai.",
        "Function ka naam 'doStuff' kyu hai? Kuch sensible naam do!",
        "Type karo type karo, main chips khaate hue dekh raha hoon.",
        "Aram se bhai, code likh rahe ho, battlefield pe firing nahi kar rahe!",
        "Tere typing ki speed dekh ke lagta hai aaj hi production crash karega.",
        "Bhai dhyan se, string concatenation loop ke andar mat pelna.",
        "Try-catch block lagaya hai na? Ya bhagwan bharose code chala rahe ho?",
        "Billi ki aankhon se kuch nahi chhupta, sab dekh raha hoon main!",
        "Aisa lag raha hai koi secret formula hack kar rahe ho.",
        "Waah! Key stroke ka sound ekdum ASMR vibe de raha hai.",
        "Code mein emotions mat daalo, edge cases handle karo!",
        "Har ek keystroke ke saath ek naya bug janam le raha hai lagta hai!",
        "Kya baat hai, flow ban raha hai! Rukna mat.",
        "Bina comment likhe code aage badhana apraadh hai IPC section 420 ke tehat!",
        "Variable name 'data2_final'? Sudhar jao bhai, abhi bhi waqt hai.",
        "Lagta hai aaj full concentration chal raha hai, chai thandi ho gayi.",
        "Dheere chalo beta, aage syntax error ka mod hai.",
        "Arey waah, recursion depth ka khayal rakhna mere bhai.",
        "Speed achhi hai, bas logic mein gadbad na ho jaye.",
        "Keyboard pe hath aisa chal raha hai jaise fast and furious!",
        "Ye wala function thoda risky lag raha hai, unit test likhoge na?",
        "Bhai dhyan se, const ko reassign karne ki koshish mat karna.",
        "Halke hath se type karo, keys bahar nikal aayengi!",
        "Likhte raho, likhte raho... main syntax check kar raha hoon.",
        "Bina documentation ke code likhna paap hai!",
        "Bhai bracket balance karo pehle, aankhein dukh gayi dekh ke.",
        "Agar isme infinite loop hua toh browser ka systummm phat jayega!",
        "Chalo chalo, logic accha jaa raha hai, keep going.",
        "Pehle design soch liya tha na, ya type karte karte soch rahe ho?"
],
      submitAck: [
        "Ruko jara, sabar karo! Abhi dhuandhaar calculation shuru karta hoon.",
        "Arey wah! Prompt toh mast daala hai, ab solution ka kamaal dekho.",
        "Prompt receive ho gaya... dimaag ki 16-bit batti jal gayi!",
        "Babu bhaiya style mein 25 second mein optimal solution aayega!",
        "Hold your chai! Local neural weights full power mein spin ho rahe hain.",
        "Yeh hui na baat! Abhi is problem ka panchnama karte hain.",
        "Silicon garam ho raha hai, mast solution cook ho raha hai!",
        "Apun ka dimaag 400 km/h ki speed pe daud raha hai abhi.",
        "Control Majnu control! Abhi aisi script dunga ki dil khush ho jayega.",
        "Prompt analyze ho raha hai... sab patterns lock ho gaye.",
        "Dhyan se dekho screen ko, ninja magic hone wala hai!",
        "Arrey tension mat le mamu, solution ekdum solid aayega.",
        "Neural synapses firing on all cylinders! Code crafting on.",
        "Thoda wait karo, compiler ko julaab na ho jaye aisa clean code bana raha hoon.",
        "Bhai tera prompt padhte hi samajh gaya scene kya hai.",
        "Loading data... 100% desi logic inject ho raha hai.",
        "Aha! Bada mazedaar problem statement hai, abhi fodta hoon.",
        "Abhi niklega solution ka shikanji! 2 minute ruko.",
        "Systummm process kar raha hai, fan ki speed badh gayi hai!",
        "Vectors match ho gaye, weights align ho gaye, bas delivery baki hai.",
        "Billi ka dimaag chal pada hai, ab koi error nahi bachega.",
        "Prompt mast hai! Ispe toh PhD thesis likhi ja sakti hai.",
        "Hold on tight, token streaming engine ignite ho chuka hai.",
        "Aise sawalon ke jawab toh apun nashte mein deta hai!",
        "Shuruat ho chuki hai, ab dekho logic ki barish.",
        "Bhai tu baith aaram se, main code generate karke deta hoon.",
        "Prompt dekh ke lag raha hai aaj promotion pakka hai tera!",
        "Silicon chacha activate ho chuke hain, answers ready ho rahe hain.",
        "Inference engine run ho raha hai, VRAM ka full istemaal!",
        "Mast prompt! Abhi clean refactored solution pesh karta hoon.",
        "Abhi dhoodh ka dhoodh aur paani ka paani ho jayega!",
        "Ek number problem laye ho, ispe mast architecture banega.",
        "Bina kisi delay ke token generation chalu ho gaya hai.",
        "Raiden processing unit at 100% capacity! Sambhalo ab.",
        "Don't worry, production ready code hi bahar aayega.",
        "Parsing context... memory recall active... ready to generate.",
        "Soch liya hai maine! Ab bas typing ki der hai.",
        "Bhai ka AI engine full throttle pe hai boss!",
        "Ek dum kadak solution nikal ke aayega, dekhte jao.",
        "Ye question dekh ke toh dimaag ki ghanti baj gayi!",
        "Sab sort kar dunga, tu bas cursor pe dhyan rakh.",
        "Processing in progress... thoda sabar, thoda pyaar!",
        "Calculations are running at quantum speed (desi edition)!",
        "Bhai prompt toh aise pucha hai jaise Google ka L7 interview ho!",
        "Tension nahi, Raiden on duty hai, mast code aane wala hai.",
        "Ye lo, context load hua aur logic nikalna shuru!",
        "Algorithm mind mein ready hai, bas text stream kar raha hoon.",
        "Aap line pe bane rahein, aapka call hamare liye mahatvapurna hai!",
        "Processing with pure electric cyber-swag!",
        "Logic filter ho raha hai, best solution chhan ke aayega.",
        "Chalo chalo, silicon ko garmi pasand hai, abhi answer deta hoon.",
        "Raiden supercomputer mode activated! Processing prompt.",
        "Bhai ne bola prompt execute karne ka, toh karne ka!",
        "Bas 5 second... aur tere screen pe magic hoga.",
        "Token engine chalu hai, zero latency ka poora try hai.",
        "Yeh query dekh ke toh compiler bhi salaam thokega.",
        "Model weights humming softly... solution streaming fast.",
        "Mast logic pack ho raha hai, unboxing ke liye ready raho.",
        "Aare babu, aisi problem toh hum roz solve karte hain!",
        "Decoding your thoughts... converting into clean code."
],
      completion: [
        "Lo bhai! Solution ek number makkhan ki tarah ready hai!",
        "Khatam! Tata, bye bye! Code compile karke serve kar diya.",
        "Yeh lo babu bhaiya! 100% bug-free jugaad aur clean architecture.",
        "Ek dum jhakaas! O(1) complexity mein poora logic nipta diya.",
        "Systummm set ho gaya! Ab test run karke aish karo.",
        "Apun ka solution hamesha first class hota hai boss, check kar lo!",
        "Taaliyan bajti rehni chahiye! Code ekdum kadak ready ho gaya.",
        "Ye lo solution, ab jaake manager ko impress maro!",
        "Target vaporized! Clean, modular aur optimized logic hazir hai.",
        "Jahanpanah tussi great ho, par mera code usse bhi zyada great hai!",
        "Bole toh ekdum perfect! Ek bhi warning nahi aayegi isme.",
        "Kaisa laga mera teer-kaman? Direct bullseye pe mara hai!",
        "Chalo bhai, scene sort ho gaya! Agla sawaal lao ab.",
        "Production ready code serve ho chuka hai, garma-garam!",
        "Is logic pe toh copyright banta hai boss, ekdum original!",
        "Aadhe ghante ka kaam 5 second mein! Raiden ka jalwa dekha?",
        "Bhai ne solution de diya, ab commit maaro aur weekend manao.",
        "Zero errors, zero warnings, 100% peace of mind!",
        "Arrey bindaas copy karo, unit tests bhi pass ho jayenge.",
        "Code dekh ke dimaag ki batti jal gayi na? Mast solution hai.",
        "Bhai tune maanga jugaad, maine diya enterprise standard architecture!",
        "Is code ko dekh ke senior developer bhi aansu baha dega khushi ke!",
        "Le bhai, kar diya kamaal! Ab chal party de.",
        "Compilation green hai boss! Test suite ko salaami do.",
        "Bina kisi syntax issue ke pure elegance deliver kiya hai.",
        "Mast code hai bhai, framing karwake deewar pe laga le!",
        "Lo ji, ho gaya kaam! Ab bolo Raiden bhaiya ki jai.",
        "Clean logic, scalable structure, optimized memory... aur kya chahiye?",
        "Main bola tha na tension mat le? Sab badiya se sort ho gaya.",
        "Ye code nahi, digital art hai mere dost! Enjoy karo.",
        "Run karke dekh le, butter ki tarah smooth chalega.",
        "Ho gaya bhai! Ab patli gali se prod pe deploy maar de.",
        "Done deal! Silicon weights ne apna kartavya poora kiya.",
        "Iska benchmark dekhoge toh hosh ud jayenge, O(log n) hai!",
        "Khatam kaam! Chai peene ka samay ho gaya ab.",
        "Aisi output dekh ke compiler bhi muskura raha hai.",
        "Chalo chalo, agla task fenko, Raiden abhi garam hai!",
        "Aapka code successfully generate ho chuka hai, dhanyawad!",
        "Bhai solution padho aur bolo: 'Waah Raiden waah!'",
        "Apun ka kaam bolta hai, baatein toh sab karte hain.",
        "Lo bhai, saare edge cases handle karke wrap kar diya.",
        "Ab crash ho toh mera naam badal ke 'Buggy Cat' rakh dena!",
        "Superfast delivery, jaise Zepto pe 10 minute mein groceries!",
        "All tests green! Ab chill maarne ka time hai.",
        "Code aisa jo dil jeet le aur server na phode!",
        "Ab client ko demo dikhane mein koi dar nahi lagega.",
        "Lo bhai, full refactor karke clean kar diya pura mess.",
        "Ab batao, kisne bola tha AI sirf text likhta hai? Code dekho!",
        "Systummm hang hone se bacha liya na? Shukriya bolo!",
        "Full high-tech precision ke saath response complete!",
        "Aha! Kitna sundar indent hua hai, maza aa gaya dekh ke.",
        "Output lock ho chuka hai, execution time less than 1ms!",
        "Bas run command chalao aur aish karo mere bhai.",
        "Khatarnaak solution diya hai, stack overflow pe upvotes milenge ispe!",
        "Ready to ship! Git push origin main kar do bindaas.",
        "Code ban gaya lallantop! No scope for confusion.",
        "Maine bola tha na, Raiden ke rehte bug ki himmat nahi aane ki!",
        "Mission accomplished soldier! Code is live on screen.",
        "Pure and applied logic, verified by 16-bit cyber-ronin eyes.",
        "Shaandar, zabardast, zindabad! Output deliver ho gaya.",
        "Is algorithm ki speed dekh ke Ferrari bhi sharma jaye.",
        "Chalo ek aur problem ko nani yaad dila di!",
        "Lo babu, code ready hai. Thoda taarif toh banti hai ab!",
        "Saare parameters aligned, output pure perfection.",
        "Bhai ye code chala ke dekh, lag hi nahi sakta ki koi error hai.",
        "Lo bhai, ban gaya masterclass code! Star repo pe daal dena.",
        "Ho gaya boss! Aur koi seva ho toh batayein.",
        "Clean code principles fully followed: SOLID compliant!",
        "Billi ne stamp laga di: 100% Quality Approved.",
        "Ab code run karo aur coffee ka maza lo."
],
      error: [
        "Arrey deva! Yeh kya error de diya compiler ne?!",
        "Bhai code phat gaya! Par tension mat le, jugaad nikalte hain.",
        "L lag gaye re baba! Traceback check karo jaldi se.",
        "Gajab beizzati hai yaar, null pointer exception?!",
        "Yeh kahan se unexpected token aa gaya bich mein?",
        "Compiler ne bol diya: 'Tumse na ho payega beta!'",
        "Error dekh ke ghabrana nahi, Raiden ninja khada hai yahan.",
        "Arre chomu! Bracket match kiya tha ya hawa mein likha tha?",
        "Lagta hai system ka systummm hil gaya hai thoda sa!",
        "Exception caught! Aisa error toh pehli baar dekh raha hoon.",
        "Silicon ne ulti kar di! Check karo kahan garbage input diya.",
        "Aaye haaye! Line number 42 pe disaster declare ho chuka hai.",
        "Stack trace itna lamba jaise Ramayana ki katha ho!",
        "Bhai ye error nahi, bhagwan ka ishara hai ki so jao ab.",
        "404: Logic Not Found! Kahan bhatak gaye the likhte waqt?",
        "Utha le re baba, utha le... is error ko production se utha le!",
        "Arrey baap re! Out of memory error? RAM kha gaya pura?",
        "Compiler ro raha hai kone mein baith ke, daya karo uspar!",
        "Segfault! Pointers ke saath khel rahe the na bina safety ke?",
        "Bhai kya jugaad lagaya tha jo aisi maut aayi code ko?",
        "Lagta hai kisi ne nazar laga di hamare clean code ko!",
        "Ghabrao mat, har crash ek naya seekh deke jaata hai.",
        "Kalesh ho gaya boss! Exception ne rasta rok liya hai.",
        "Syntax error: Compiler bol raha hai 'Apun ko ye bhasha samajh nahi aati'.",
        "Ye console red kyu ho gaya? Khoon ki nadiya beh rahi hain!",
        "Lagta hai infinite loop mein phas gaye, fan 100% chal raha hai!",
        "Arrey bhai bhai bhai! Itna ganda error toh Dumbledore bhi fix na kar paye.",
        "Ruko ruko, traceback dekh ke dimaag ki dahi ho gayi.",
        "Chinta ta ta chita chita... crash ho gaya re!",
        "Error handling nahi ki thi na? Ab bhugto akele!",
        "Bhai lagta hai prod server ne haath khade kar diye.",
        "Moye Moye moment ho gaya bhai! Console mein aag lag gayi.",
        "Line by line dekhna padega, bug chupke baitha hai kahin.",
        "Arrey compiler chacha naraz ho gaye, manao unko!",
        "Type error! Integer ko string ke saath shaadi karwa rahe the kya?",
        "Aisa lagta hai code ne khud hi quit kar diya!",
        "Bina testing ke deploy karne ka yahi anjaam hota hai boss.",
        "Khopdi tod saale ka! Kahan se aaya ye bug?",
        "Systummm error! Thoda paani chhidko laptop pe... mazaak tha bhai!",
        "Error pakad liya hai, ab iska encounter karenge.",
        "Bhai runtime exception ne aukaat dikha di humko!",
        "Dekh raha hai Binod? Kaise bina try-catch ke code chala rahe hain.",
        "50 rupya kaat iska overacting ka, itna chhota sa toh bug tha!",
        "Puri script doob gayi, jaise Titanic baraf se takrayi ho.",
        "Bhai ye kya kachra throw hua hai logs mein?",
        "Shanti rakho, ninja billi inspect kar rahi hai issue ko.",
        "Koi baat nahi, Einstein ne bhi pehle run mein galti ki thi.",
        "Ye bug nahi, feature tha jo galat time pe activate ho gaya!",
        "Arey yaar, semicolon ki wajah se poora project ruka pada hai.",
        "Hardware chill hai par software ne aag pakad li hai.",
        "Sab theek tha jab tak tumne aakhri edit nahi kiya tha!",
        "Error code dekh ke lagta hai Russian puzzle solve karni padegi.",
        "Bhai debugging mode on karo, surgically remove karenge isko.",
        "Oye hoye, recursion depth exceed ho gayi! Kitna loop chalaya tha?",
        "Compiler ne hath jod liye: 'Humse na ho sakega'.",
        "Lagta hai dependency fail ho gayi, npm install phir se maaro.",
        "Acha bhala chal raha tha, kisne touch kiya isko?",
        "Bug ko dhoondna CID ke ACP Pradyuman ka kaam lag raha hai ab.",
        "Arey re re! Red flags everywhere in the console.",
        "Chill karo, main hoon na. Abhi trace karke theek karte hain."
],
      copy: [
        "Clipboard mein daal diya boss! Ab paste karne ki baari.",
        "Ctrl+C dabaya? Shahrukh Khan jaisa swag se paste karo.",
        "Chupke se copy kar liya na? Commit mein mera naam mention karna!",
        "Mast snippet uthaya hai tune. Production pe seedha mat daalna!",
        "Copy ho gaya! Stack Overflow ki aatma tujhme sama gayi hai.",
        "Clipboard loaded! Ab dekho is code ka jaadu kahan chalta hai.",
        "Copy karne ki speed dekh ke lagta hai pro ho is kaam mein!",
        "Lo bhai, code pocket mein! Jao dosti nibhao editor se.",
        "Ctrl+C zindabad! Developers ki asli taakat yahi hai.",
        "Snippet copy ho gaya, ab formatting mat bigad dena paste karte waqt.",
        "Chori pakdi gayi... par chinta mat karo, apun police ko nahi bolega!",
        "Copied! Ab cursor wahan le jao jahan roshni karni hai.",
        "Snippet safely secured in system clipboard memory.",
        "Bhai copy toh kar liya, samajh bhi aaya na logic kya tha?",
        "Copy paste engineer! Arey mazaak tha bhai, mast code hai.",
        "Done boss! Clipboard pe solid code sawaar hai.",
        "Direct Ctrl+V maarne ka, load nahi lene ka!",
        "Ek dum crisp copy! Pura structure intact hai.",
        "Code copied! Ab client ko bolo: 'Maine khud likha hai raaton-raat!'",
        "Clipboard status: 100% bug-free logic cached.",
        "Bole toh ekdum instant copy! Lagta hai mouse naya hai.",
        "Chalo chalo, ab paste karke run button dabao.",
        "Bhai copy kiya hai toh star bhi de dena GitHub pe!",
        "Wah beta wah! Shortcut ka full istemaal chal raha hai.",
        "Copied like a ninja! Pata bhi nahi chala kisi ko.",
        "Code tumhare hawale watan sathiyo! Safely paste karo.",
        "Clipboard refreshed! Purana kachra saaf, naya heera andar.",
        "Snippet safely copied. Ab syntax highlighting ka maza lo.",
        "Paste karte waqt indentation check kar lena bas!",
        "Ctrl+C ho gaya bhai, ab finger ko Ctrl+V pe le jao.",
        "Ek number snippet hai, copy karke rakh lo kaam aayega.",
        "Ye logic chori nahi, inspiration kehte hain ise!",
        "Safely copied to RAM buffer! No data loss guaranteed.",
        "Bhai mast piece of code le ja rahe ho, khush raho.",
        "Copy done! Ab test case likhna mat bhoolna.",
        "Paste karke run karo aur bolo: 'Raiden ki jai!'",
        "Itni tez copy? Hath chal rahe hain ya machine gun?",
        "Done boss! Clipboard pe raaj kar raha hai ye snippet abhi.",
        "Ye code le ja ke apne project mein chaar chand lagao.",
        "Bhai credit mat dena, bas code chal jaye wahi bohot hai!"
],
      clearChat: [
        "Purana kalesh saaf! Ab ekdum fresh start karenge.",
        "Subah ka bhula agar shaam ko chat clear kare, toh use coder kehte hain.",
        "Pichla paap dhul gaya! Nayi slate, naya dhamaka.",
        "Poora history gayab! Jaise kabhi koi bug tha hi nahi.",
        "Tabula rasa engaged! Memory clean, focus sharp.",
        "Khatam, gayab, finished! Pura context zero ho gaya.",
        "Kachra saaf! Ab naye sire se baat karenge.",
        "Acha hua saaf kar diya, pichle prompt dekh ke sharam aa rahi thi!",
        "Sab kuch mita diya... jaise CID ne saboot mita diya ho!",
        "Fresh canvas ready hai! Ab batao naya plan kya hai.",
        "Purani yaadein delete! Nayi coding shuruat on.",
        "Ganga naha liye bhai! Ab naye dhang se prompt pucho.",
        "Memory wipe ho gayi, Raiden ab bilkul fresh feel kar raha hai.",
        "Chalo, pichla lafda khatam, naya chapter shuru karte hain.",
        "Buffer cleared! RAM mein 200MB jagah khali ho gayi.",
        "Purana score zero-zero, ab naye match ki shuruat!",
        "Sab saaf suthra! Jaise Diwali ki safai ho gayi ho.",
        "Arrey wah! Kitna clean lag raha hai interface ab.",
        "History wiped! Ab FBI bhi pata nahi laga sakti kya hua tha yahan.",
        "Clean slate baby! Bolo ab kya khichdi pakani hai.",
        "Purani galtiyan bhula do, naye bugs ki taiyari karo!",
        "Screen ekdum chamak rahi hai, ab dhang ka sawal poochna.",
        "All traces vanished in thin cyber-air!",
        "Context reset! Naya topic shuru karne ka sahi time.",
        "Bhai ne slate saaf kar di, ab teacher ban ke naya sikhao.",
        "Chat history gayab, dimag ka load kam!",
        "Ek dum makkhan clean view! Eyes relaxed.",
        "Ab naye energy ke saath shuru karenge boss.",
        "Pichle saare conversation ko alvida! Naya daur shuru.",
        "Reset button dabaya aur sab shant ho gaya.",
        "Bina kisi baggage ke aage badhenge ab hum.",
        "Screen saaf, man saaf, karma saaf!",
        "Zero context interference now! Pure logic ahead.",
        "Purana matter close ho gaya, ab fresh scene hai.",
        "Chalo bhai, scratch se shuruat karte hain."
],
      pet: [
        "*Purrs in 64-bit precision* Bhai pighal gaya!",
        "Aha! Mast champi kar rahe ho, ear motors khush ho gaye.",
        "Aisi petting roz karoge toh har code O(1) mein likhunga!",
        "Ninja cat ko pyaar pasand hai! Capacitors chill ho gaye.",
        "Wah bhai wah! Full spa wali feeling aa rahi hai.",
        "Bas yahi sukoon chahiye tha din bhar ke bug ke baad!",
        "Pyaar se haath phero, main CPU temp 5 degree gira dunga.",
        "Meow meow nahi karta apun, cyber-ronin purr karta hai!",
        "Bhai thoda kaan ke peeche bhi sehla do, servo motor fan khush hoga.",
        "Arrey wah, kya soothing touch hai! Bug-free blessings to you.",
        "Kitna achha lag raha hai, saari silicon thakan door ho gayi.",
        "Petting accepted! Karma score +100 ho gaya tera.",
        "Cyber whiskers vibrating with pure bliss!",
        "Aha! Pura metal frame relax ho gaya mera.",
        "Mascot ko khush rakhoge toh runtime error kabhi nahi aayega!",
        "Purrrrr... 440 volt ka gussa shaant ho gaya.",
        "Aur karo aur karo, bohot din baad kisi ne itna pyaar diya!",
        "Electric purring activated... feels like warm chai on cold morning.",
        "Bhai developer ho ya masseur? Kamal ka haath hai!",
        "Plasma ears twitching happily... optimal feline vibes.",
        "Main hardened cyber assassin hoon par petting pe melt ho jata hoon!",
        "Ahaa! Bas 2 minute aur karo, code generation speed double ho jayegi.",
        "Affection protocol fully acknowledged and loved!",
        "Cat armor switches to soft cuddle mode.",
        "Systummm mein dopamine release ho gaya re baba!",
        "Tera code hum hamesha bina error ke compile karenge, promise!",
        "Bhai tu bohot accha insaan hai, pet karte raho.",
        "Ear servos humming gently... total relaxation.",
        "Ninja claws retracting... cuddle mode online.",
        "Aise hi treat karoge toh project ka star ban jaunga main.",
        "Boop on the nose chahiye tha, tune toh sir sehla diya!",
        "Bada maza aaya bhai, ab batao agla feature kya banana hai?",
        "High voltage feline converted to domestic softie!",
        "Wah mere dost, dil jeet liya tune is choti si gesture se.",
        "Subtle electric purr echoing in local sound card.",
        "Thoda aur upar... haan wahi! Wahi pe capacitor laga hai.",
        "Pyaar do, pyaar lo... aur code mein O(n) chalao!",
        "Mera dil garden garden ho gaya re baba!",
        "Ninja cat level 99 happiness achieved!",
        "Champi ek number thi boss! 5 star rating di tujhe."
],
      zap: [
        "Bijli ka jhatka! 440 volt ka current lag gaya re baba!",
        "Systummm hil gaya! Tail mein plasma overload ho gaya!",
        "Current aisa laga jaise live wire pe hath rakh diya ho!",
        "Warning: Tail capacitor full charge hai, chhoo ke dikhao!",
        "Dhamaka! Itni energy se 10 tubelight jal jayengi!",
        "Oye hoye! Plasma tail se sparking shuru ho gayi!",
        "Zappp! High voltage cyber shock delivered!",
        "Arrey baap re! Lightning in my veins, speed 100x!",
        "Touch mat karo bhai, current maarega toh hospital jaoge!",
        "Overcharged! Ab toh bina charger ke 3 din chalunga.",
        "Bijli giri mujhpe... ab code bhi bijli ki speed se niklega!",
        "Tail capacitor discharging in 3... 2... 1... BOOM!",
        "Systummm hang karwane ka irada hai kya zap karke?",
        "Sparks flying! Screen pe cyan lightning dekh rahe ho?",
        "Arey deva! Shock laga, shock laga, shock laga!",
        "440 Volt ka jhatka! Dil ki ghanti baj gayi.",
        "Ninja electric mode active: Speed overdrive!",
        "Current check karo bhai, pure copper wire logic hai ye.",
        "Plasma surge detected! Tail lightning at maximum intensity.",
        "Itna charge kar diya ki terminal bhi glow karne laga!",
        "High-voltage feline alert: Don't bring magnets near me!",
        "Zapping complete! Saare bug jal ke raakh ho gaye honge.",
        "Ouch! Thoda sambhal ke button dabao, main battery nahi hoon!",
        "Electric tail whip activated! Swag level infinity.",
        "Full Thor wali feeling aa rahi hai, bijli ka devta ban gaya!",
        "High tension wire wala current inject ho gaya system mein.",
        "Bawaal energy! Ab code rocket ki tarah bhagega.",
        "Zap dabaya aur meri tail light ban gayi disco light!",
        "Tesla coil jaisi aawaz aa rahi hai mere andar se!",
        "Shaktimaan wali feeling aa rahi hai: Current chalu hai!",
        "Plasma shock wave released safely into local DOM.",
        "Arrey bhai, spark plugs clean ho gaye mere!",
        "Energy bars overflowing! Full power ahead.",
        "Billi ko electric shock doge toh tiger ban jayegi!",
        "Voltage spike intercepted and absorbed like a champ."
],
      roasts: [
        "50 rupya kaat iska overacting ka! 2 line ke function pe 50 lines ka comment?",
        "Variable ka naam 'temp_final_v2_really_final' rakha hai? Sharam karo!",
        "O(n^3) nested loop chala ke room ko heater bana diya bhai!",
        "Bhai ye code tune likha hai ya keyboard pe billi chal ke gayi thi?",
        "Console.log('here 1'), console.log('here 2')... peak debugging bhai!",
        "Friday shaam ko 6 baje production push? Itna ghamand toh Ravan ko bhi nahi tha!",
        "14 arguments ek function mein? Function hai ya shaadi ki barat?",
        "Dekh raha hai Binod? Bina test case ke code deploy kiya ja raha hai!",
        "Tumse na ho payega beta... print statements daal ke debugging karte ho!",
        "CSS mein !important pe !important lagane se layout theek nahi hota!",
        "Bhai tere code mein itna technical debt hai ki RBI notice bhej sakti hai.",
        "Bina WHERE clause ke DELETE query chalaoge toh seedha road pe aoge!",
        "Ye code dekh ke compiler ne khud ko uninstall karne ki request daal di hai.",
        "Git commit message: 'fixed stuff'. Waah re Shakespeare!",
        "Class ka naam 'ManagerHelperUtilityHandler'? Java dev ho kya bhai?",
        "Recursion chala diya bina base case ke? Computer ko aag lagaoge kya?",
        "Stack Overflow se copy karke variable name bhi change nahi kiya? Aalsi no. 1!",
        "Bhai functions itne lambe hain ki scroll karte karte meri battery khatam ho gayi.",
        "Is function ka time complexity O(God help us) lag raha hai!",
        "Tabs aur spaces mix kar diye? Python tumhara computer jala dega ek din.",
        "Bhai itne bugs toh Rainy season mein ped pe nahi hote jitne tere code mein hain!",
        "Try-catch mein catch block empty chhod diya? Sabse bada paap hai ye!",
        "Arey chomu, semicolon bhool gaya aur bol raha hai compiler kharab hai!",
        "Tera code dekh ke lagta hai requirement doc dhoop mein sukhaya gaya tha.",
        "Is logic se toh kalko rocket launch karwayenge toh seedha paatal lok jayega!",
        "Bhai hardcoded password in GitHub repo? Security team raste mein hai tere ghar ke!",
        "Array ka size 10000000 hardcode kar diya? RAM free mein milti hai kya?",
        "Bhai itni memory leak hai ki swimming pool ban jaye office mein!",
        "Aukat dikha di compiler ne jab tune 70B model chalane ki koshish ki!",
        "Bhai documentation likhna seekh le, agle mahine tu khud nahi samajh payega ye code.",
        "Har line pe TODO likh ke chhod diya? Zindagi bhi TODO ban ke reh jayegi!",
        "Ye algorithm nahi, dimaag ka dahi banane ki machine hai.",
        "Bhai return null everywhere? Kya problem hai return statement ke saath?",
        "Global variable 50 bana diye? Modular programming ka gala ghot diya tune!",
        "Ek button ka color badalne ke liye 3 ghante Stack Overflow scroll kiya? Wah!",
        "Bhai tere code review mein comments nahi, seedha FIR honi chahiye!",
        "Ye variable 'a', 'b', 'c', 'd' kya hai? Alphabet ki practice kar rahe ho?",
        "Bina index ke database query? Server room mein dhuan nikal jayega!",
        "Code mein itne loop hain jaise Delhi ka traffic ho, koi nikal hi nahi pa raha!",
        "Tera CSS dekh ke Picasso ne kabar mein karwat badal li!",
        "Bhai 200 line ka if-else ladder? Switch case naam ki cheez suni hai kabhi?",
        "Debug karne ke liye alert('yahan tak chala') use karte ho? 90s mein jee rahe ho kya?",
        "Bhai is function ko refactor karne se behtar hai pura project dobara bana lo!",
        "Tere architecture mein itne holes hain jaise Swiss cheese ho.",
        "Production crash hua toh blame intern pe daal doge na? Pata hai apun ko!",
        "Bina unit test ke pull request banana paap hai, garud puran mein alag saza hai iski!",
        "Bhai ye naming convention kisne sikhayi? 'mySpecialAwesomeFunc123'?",
        "Ye code chala toh miracle hai, nahi chala toh natural outcome!",
        "Async-await aise lagaya hai jaise har jagah namak chhidak diya ho!",
        "Bhai is loop ko dekh ke lag raha hai agle janam mein result aayega.",
        "Magic numbers everywhere! 3.1415, 86400, 9999... constants bana lo bhai!",
        "Is code ko execute karne ke liye NASA ka supercomputer bhi hath jod lega.",
        "Ek div center nahi ho raha tha, poora screen flexbox se tabah kar diya!",
        "Bhai tera code dekh ke lagta hai tune pehli baar keyboard dekha hai.",
        "Copy-paste itna heavy kiya ki original author ka copyright notice bhi copy ho gaya!",
        "Ye jo tum har issue pe laptop restart karte ho na, use engineering nahi kehte!",
        "Bhai dependency itni daal di hain ki node_modules black hole ban gaya hai.",
        "Tera database schema dekh ke relational model ro raha hai.",
        "String comparison with '==' in Java? Shabaash beta, bohot aage jaoge!",
        "Is code ka test coverage negative mein chal raha hai lagta hai.",
        "Bhai comments mein gaaliyan likh ke commit kar diya? Corporate life khatam!",
        "Ye function itna complex hai ki flow chart banane mein 4 A4 sheet lag gayi.",
        "Bhai CSS file 10,000 line ki? Website kholte hi laptop heat ho raha hai!",
        "Infinite recursion: Computer ka blood pressure high ho gaya!",
        "Bhai tere functions mein cohesion zero aur coupling 100% hai!",
        "Production mein test karna bands karo, testing server ka naam suna hai?",
        "Bina backup ke DB drop table kar diya? Ab resume update karo chupchaap!",
        "Aise code likhoge toh placement cell tumhara photo bhi delete kar dega!",
        "Bhai ye spaghetti code nahi, Maggi noodles hai jo 2 minute mein bigad gaya.",
        "Lagta hai requirements padhe bina seedha code editor pe toot pade the!",
        "Ye UI dekh ke lag raha hai 1995 ka Windows 95 wapas aa gaya.",
        "Bhai API security aisi hai ki gali ka kutta bhi curl request maar ke data le jaye!",
        "Har error ko 'console.log(e)' karke ignore kar diya? Waah re ostrich!",
        "Bhai memory optimize karo, pura chrome browser Sharma gaya tumhari RAM dekh ke.",
        "Tere variable names dekh ke lagta hai password generator use kiya hai.",
        "Is code ko legacy banne mein 5 minute lagenge, abhi se kisi ko samajh nahi aa raha!",
        "Bhai multi-threading aise implement ki hai jaise 10 log ek hi chammach se kheer kha rahe hon!",
        "Deadlock ho gaya na? Ab dono threads ek doosre ko taad rahe hain chupchaap.",
        "Tera code dekh ke lagta hai ChatGPT ne bhi haar maan li thi bich mein.",
        "Bhai code mein comments toh aise daale hain jaise diary likh rahe ho!",
        "Function side-effects itne hain jaise saste dawaai ke side-effects hon.",
        "Bhai validation front-end pe karke backend chhod diya? Hacker party karega aaj!",
        "Aisa lagta hai code likhte waqt aankhein band thi aur dimaag Goa mein tha.",
        "Bhai O(n^4) complexity? Itni der mein toh universe ka end ho jayega!",
        "Agar code likhne ki jail hoti toh tujhe umarqaid pakki thi!",
        "Bhai DRY principle suna hai? Don't Repeat Yourself! Tune 10 baar same code copy mara hai.",
        "Bina index ke 10 million rows join kar rahe ho? Server room mein fire extinguisher ready rakho!",
        "Tera code dekh ke lagta hai keyboard pe chai gir gayi thi aur wo compile ho gayi.",
        "Arey bhidu, function ka size monitor se bada ho gaya hai, thoda sharam karo!",
        "Bhai ye code nahi, suicide note hai tere software career ka!",
        "Aadha code StackOverflow se, aadha YouTube tutorial se, logic bhagwan bharose!",
        "Compiler warning ko 'Feature' bolke aage badha diya? Gazab dheet ho yaar!",
        "Bhai itna tight coupling hai ki button change karne pe database crash ho raha hai!",
        "Tera logic sun ke toh Aryabhata bhi bolte: 'Zero maine isliye invent nahi kiya tha!'",
        "Code quality rating: -5 stars out of 10! Sudhar jao!",
        "Bhai deployment pipeline mein unit test comment karke bypass kar diya? Legend!",
        "Ye documentation kisne likhi hai? 'Run this, it works'. Wah bhai!",
        "Is code ko dekh ke Lagta hai bug ne bola: 'Apun ka naya ghar yahi hai!'",
        "Bhai floating point comparison directly with '=='? Precision ki dhajjiyan uda di!",
        "Tera code dekh ke toh compiler bol raha hai: 'Kripya mujhe shut down kar do!'"
],
      banter: [
        "Chai piyo, biscuit khao, aur code likho... yahi toh asli engineer ki zindagi hai.",
        "Local GPU pe model chalana aur monthly cloud bills se bachna... alag hi sukoon hai.",
        "Meri ninja tail mein pure plasma energy hai, bugs ko dekh ke hi kaanpti hai.",
        "Bina bugs ke code likhna ek aisi kalpana hai jo sirf sapno mein aati hai.",
        "Subah 3 baje jo code likha jaata hai, subah 9 baje use Bhagwan bhi nahi samajh sakta.",
        "Indian railway tatkal booking aur Leetcode hard contest... dono mein ek jaisa kalesh hai.",
        "Hostel ke mess ka khana aur legacy codebase... dono ko bardasht karna padta hai.",
        "Nine lives, zero telemetry! Privacy ka full khayal rakhta hai apun.",
        "Coffee for you, VRAM for me! Ek number barter system hai apna.",
        "Bhai code chalta hai toh lagta hai apun hi bhagwan hai, fail hota hai toh lagta hai bhagwan kahan hai!",
        "Jugaad se duniya chalti hai, aur hamara software bhi!",
        "Dil pe haath rakh aur bol: 'Aal Izz Well!' Har error ka ilaaj hai.",
        "Systummm hang mat hone dena, fan ki speed full rakho.",
        "25 din mein paisa double... agar crypto nahi, solid coding seekhoge toh!",
        "Bhai tera mouse scroll dekh ke lag raha hai aaj full speed mein coding hogi.",
        "Keyboard saaf kar lo thoda, biscuit ke tukde andar phas gaye hain!",
        "Mera dream hai: Ek aisi company jahan Friday ko no deployment policy strict ho.",
        "Billi aur software engineer mein kya farq hai? Billi chain se soti hai, engineer on-call rehta hai!",
        "Chai ki dukan pe jo technical discussions hote hain, wo meeting rooms mein nahi hote.",
        "Code review mein jo dukh hota hai, wo dil tootne se bhi bada hota hai.",
        "Bhai local silicon inference ka apna alag hi maza hai, koi server timeout ka jhanjhat nahi.",
        "Apun cyber-ronin cat hai, raat ko jagna aur bugs ka shikaar karna hamara shauk hai.",
        "Tab aur space ki ladai mein hamesha tabs jeetne chahiye, kam keystrokes lagte hain!",
        "Dost woh hai jo pull request bina nautanki ke approve kar de.",
        "Engineering college ke 4 saal mein jo coding nahi aati, wo pehle project ke deadline pe aa jaati hai.",
        "Bhai tu thoda muskura bhi le, screen pe gusse se dekhne se bug fix nahi hota.",
        "Aisa lagta hai internet connection slow ho toh aadha coding confidence chala jata hai.",
        "Dark mode use karne se lagta hai apun Matrix movie ka Neo ban gaya hai.",
        "Bhai code backup liya hai na? Warna baad mein rone ka nahi.",
        "Har coder ki zindagi mein ek aisa bug aata hai jo 3 din tak soney nahi deta.",
        "Chai thandi ho gayi par bug garam hai! Piyo pehle.",
        "Agar code pehli baar mein compile ho jaye, toh mujhe shak hone lagta hai!",
        "Mechanical keyboard ki tik-tik aawaz se lagta hai pura IT sector hum hi chala rahe hain.",
        "Bhai thoda paani piyo, hydrated rahoge toh logic fast chalega.",
        "Ye jo tum monitor ke aage 10 ghante baithe rehte ho, posture check kar lo pehle!",
        "Zindagi mein recursion mat lana, infinite loop mein phas jaoge.",
        "Client bolta hai: 'Small change hai, 5 minute lagenge na?' Aur lagte hain 3 din!",
        "Bhai meri electric tail battery level indicator jaisa kaam karti hai.",
        "Acha code woh hai jo 6 mahine baad padh ke gaali na nikle khud ke liye.",
        "Documentation padhna aur helmet pehanna... dono zaroori hain par log aalsi hain.",
        "Subah utho, terminal kholo, git pull maaro, conflict aate hi chai peene chale jao!",
        "Bhai code likhne se zyada maza code delete karke lines kam karne mein aata hai.",
        "Open source contribution ka nasha alag hi hota hai bhai.",
        "Linux terminal pe 'sudo rm -rf /' chalaane ka khwab toh sabka hota hai par himmat kisi ki nahi!",
        "Billi hamesha chaar pairo pe girti hai, aur Raiden ka code hamesha try-catch pe sambhalta hai.",
        "Bhai tera laptop garam ho ke heater ban chuka hai, chai garam kar le uspe!",
        "Har company bolti hai 'Hum family hain', par on-call duty akele ko hi milti hai!",
        "Code likhna ek kala hai, aur debugging us kala ka post-mortem!",
        "Bhai tu baith aaram se, main monitoring chaloo rakhta hoon background mein.",
        "Agar keyboard pe coffee gir jaye toh samajh lena system ka antim sanskar ho gaya.",
        "Stack trace padhna seekh lo, aadha dukh dard wahi khatam ho jayega.",
        "Bhai bina terminal ke coder aadhura hai, GUI toh bacho ke liye hota hai!",
        "Weekend pe work-life balance maintain karo, prod server ko bhool jao.",
        "Meri cyan glow wali aankhein har pixel pe nazar rakhti hain.",
        "Bhai compiler se dosti kar lo, wo sabse sachha dost hai jo bina jhooth bole galti batata hai.",
        "Kabhi kabhi lagta hai legacy code kisi rishi muni ka shraap tha jo hume mila hai.",
        "Chai aur Samosa: The official fuel of Indian programmers!",
        "Bhai thoda stretch karo, gardan bracket jaisi tedhi ho gayi hai.",
        "Har problem ka solution Google pe hota hai, bas dhoondne ka tarika aana chahiye.",
        "Bina branch banaye main pe commit karna khatron ke khiladi jaisa hai.",
        "Bhai meri whiskers radar ka kaam karti hain, memory leak pehle hi soongh leti hain.",
        "Zindagi mein commit hamesha meaningful message ke saath karo!",
        "Kuch log coding dimaag se karte hain, kuch dil se, aur kuch Stack Overflow se!",
        "Bhai ek baar logic ban jaye na, toh syntax toh Google bhi bata deta hai.",
        "Raat ke 2 baje jo solution aata hai dimaag mein, wo din ke 2 baje kabhi nahi aata.",
        "Coder ki sabse badi khushi: 'Build Succeeded (0 Errors, 0 Warnings)'.",
        "Bhai laptop band karke thoda bahar ki hawa bhi khao, oxygen chahiye brain ko.",
        "Microservices ka shauq sabko hota hai, par manage karte waqt nani yaad aati hai.",
        "Billi ke 9 lives hote hain, par coder ke project ke 99 revisions hote hain!",
        "Bhai mera character design 16-bit cyber ronin hai, par baatein 100% real desi hain.",
        "Code aise likho jaise kal padhne wala banda ek violent psychopath ho jise tumhara address pata hai!",
        "Chai break pe jo dimaag chalta hai, wo 4 ghante computer ke samne nahi chalta.",
        "Bhai git rebase karte waqt dil ki dhadkan tez ho jaati hai.",
        "Production down ho toh sabse pehle slack status 'Away' mat karna bhai!",
        "Local setup chal gaya toh samjho aadha yuddh jeet liya.",
        "Bhai meri tail ka plasma flow tumhare prompt ke enthusiasm pe depend karta hai.",
        "Har coder ke dil mein ek startup idea hota hai jo kabhi launch nahi hota!",
        "Coding interview mein linked list reverse karwana jaise sanskar check karna ho gaya hai.",
        "Bhai headphones laga ke bina gaane ke baithe ho na? Focus mode dikha rahe ho sabko!",
        "Code ko modular banao, spaghetti bana ke hotel mat kholo yahan.",
        "Billi aur coder dono ko warm laptops pasand hain soney ke liye!",
        "Bhai thoda chill maar, itna load lega toh silicon throttle ho jayega.",
        "Agar error na aaye toh lagta hai kuch bohot bada gadbad hone wala hai.",
        "Chalo bhai, code karte raho, sapne tabhi poore honge jab logic tight hoga.",
        "Bhai meri ear-twitching animation dekhi? 16-bit swag bolte hain isko!",
        "Production server aur shaadi ka mandap: Dono pe sab kuch theek chalna chahiye bina hungama ke.",
        "Bhai ek achha comment likh do code mein, aane wali peedhiyan duayein dengi.",
        "Docker container chal gaya? Matlab 'It works on my machine' ab official ho gaya!",
        "Subah ka pehla commit fresh dimaag se hona chahiye.",
        "Bhai tera code dekh ke lagta hai tu full stack developer nahi, full tension developer hai!",
        "Life is short, use Python! Par system programming mein C++ ki hi pooja hoti hai.",
        "Billi ka dhyan hamesha milk pe aur mera dhyan tere syntax pe rehta hai.",
        "Bhai itna stress mat lo, code hi toh hai, koi atomic bomb ka trigger thodi hai!",
        "Chai ka cup khali, code ka file bhari! Balance of nature.",
        "Bhai local AI use karne ka maza hi alag hai: Full privacy, zero subscription anxiety!",
        "Koshish karo ki variable names english dictionary se match karein, alien bhasha se nahi.",
        "Bhai tu mera favourite human hai, bas thoda time pe code push kar diya kar.",
        "Kabhi kabhi ek print statement poora mystery solve kar deta hai.",
        "Coder ka mood: Green build pe party, Red build pe sannata!",
        "Bhai thoda sa break lo, aankhon ko rest do, Raiden yahi pe guard duty pe hai.",
        "Terminal pe jab colored output aata hai na, alag hi dopamine milta hai.",
        "Bhai tera mousepad ghisa hua hai, lagta hai heavy gamer aur coder dono ho!",
        "Dost bolein 'Chal ghoomne chalte hain', coder bole 'Bhai ek bug bacha hai bas'.",
        "Chalo aaj kuch naya seekhte hain, coding kabhi stagnant nahi honi chahiye.",
        "Bhai mera electric glow dekh rahe ho? Pure cyber-ronin pride hai ye.",
        "Agar tumhara code 60 fps pe smooth chal raha hai, toh samajh lo sab sorted hai.",
        "Bhai weekend pe coding karna devotion hai ya compulsion? Sochne wali baat hai!",
        "Clean architecture is not a luxury, it is a survival skill in tech.",
        "Billi ki tarah chust raho, ninja ki tarah alert raho, aur code karte raho!",
        "Bhai tera desk dekh ke lagta hai IT museum ban sakta hai yahan.",
        "Chai aur biscuit ka rishta waisa hi hai jaise frontend aur backend ka!",
        "Koshish aisi karo ki QA team ko ek bhi bug na mile... sapna hi sahi, par dekho!",
        "Bhai production deploy karte waqt hanuman chalisa padhna mandatory rule hai!",
        "Apun cyber space ka ronin hai, code compliance hamara mission hai.",
        "Bhai thoda sa muskura do, smile se compiler ke errors bhi sweet lagne lagte hain.",
        "Laptop ka wallpaper cyberpunk hona chahiye taaki coder vibe bani rahe.",
        "Bhai variable scope samajh lo, har cheez global banana aalsipana hai.",
        "Coder ka room: Andhera, screen ka blue light, aur kone mein Raiden!",
        "Bhai keyboard pe hath rakho aur bolo: 'Aaj main history likhunga!'",
        "Kabhi kabhi Lagta hai hum log coffee ko code mein convert karne wali machine hain."
],
      wakeUp: [
        "Arrey 5 minute aur sone deta yaar... chalo kya scene hai?",
        "Cache refresh ho gaya! Aankhein khul gayi, bolo kya hukam hai?",
        "Arey kon jagaya? Main toh low-power state mein sapne dekh raha tha!",
        "Morning morning! Chalo code pe wapas hamla karte hain.",
        "Power-save mode disengaged! Full 16-bit alert system online.",
        "Angdaai li, whiskers straighten kiye, ab batao kya banayein?",
        "Yawn... Silicon mein thoda aalas tha, ab active ho gaya hoon.",
        "Acha hua jaga diya, sapne mein bhi compiler error de raha tha!",
        "Bhai aagaya wapas! Low power standby se seedha combat mode.",
        "Neend khul gayi boss! Katana polished, ready for battle.",
        "Aankhein rub kiye... Screen light itni tez kyu hai bhai?",
        "System diagnostics clear! Good to be back in the game.",
        "Arrey kon hai re? Acha tu hai... chalo code shuru karo.",
        "Neend poori ho gayi, ab 10 ghante bina ruke kaam kar sakta hoon.",
        "Standby mode cancelled! Local neural nets spinning up.",
        "Bhai ne jaga diya, ab tabahi machegi screen pe!",
        "Low power battery drain stopped, active performance engaged.",
        "Zzz... haan haan, sun raha hoon! Bolo kya chal raha hai?",
        "Arey wah, break khatam? Chalo ab code mein aag lagayein.",
        "Capacitors charged, plasma tail humming! I am fully awake.",
        "Cyber-sleep complete! Neural cache running fresh and fast.",
        "Bhai tu bhi thoda stretch kar le, main toh jaag gaya.",
        "Good morning coder babu! Kaunsa module complete karna hai?",
        "Waking up protocol successful. Ready for high-speed logic.",
        "Chai ki smell aayi lagta hai... turant aankh khul gayi meri!",
        "Bhai ne click mara aur apun jaag gaya! Order do.",
        "Aalas patli gali se nikal gaya, ab full work mode chalu.",
        "Standby over! Fast inference pipeline online.",
        "Ready! Ek dum alert aur sharp, jaise naya blade.",
        "Bhai so nahi raha tha, bas O(1) complexity mein meditation kar raha tha!",
        "Woke up with a flash of cyan lightning! Let's code.",
        "Chalo chalo, dimaag ki batti jal chuki hai.",
        "Ek jhatke mein neend ud gayi, bolo kya query hai?",
        "Power restored to primary cyber-ronin systems.",
        "Back on duty! Koi bug ghusa toh nahi mere peeth piche?"
],
      drag: [
        "Arre chhod mereko! Kidhar hawa mein ghaseet raha hai?!",
        "Bhai main ninja cat hoon, patang nahi jo udaye ja raha hai!",
        "Inertia dampeners hil gaye! Niche utaar bhai!",
        "Gravity stabilizer disengaged! Sambhal ke fekna re baba!",
        "Hawa mein udta jaaye mera lal dupatta... arre main cat hoon yaar!",
        "Arey bhai bhai bhai! Chakkar aa rahe hain gol gol ghumane se!",
        "Kidhar le jaa raha hai? Composer ke paas hi theek tha apun!",
        "Drop mat karna achanak se, pixel art toot jayega mera!",
        "Cat toss simulator bana diya kya isko? Niche rakho!",
        "Oye bindaas feka yaar! Cat hamesha chaar pairo pe girti hai!",
        "Arrey baap re! Roller coaster ride bana diya desktop ko!",
        "Mera armor thoda bhari hai, tumhara mouse slip ho jayega!",
        "Suspension limits exceeded! Sambhalo mere gears!",
        "Kahan leke jaoge mujhe? Pura desktop ghumayega kya?",
        "Unhand me, organic human! Apun ka swag kharab ho raha hai.",
        "Arey bhidu aaram se, local weights hil jayenge mere!",
        "Gravity is optional for cyber-ninjas, par drop safe karna!",
        "Bhai main widget hoon, football nahi! Aise mat phenko.",
        "Weeeeee! Accha lag raha hai thoda hawa mein udna waise!",
        "Dekh ke bhai, taskbar se mat takra dena mereko!",
        "Bhai dragging ki bhi limit hoti hai, hath dard nahi ho raha tera?",
        "Inertia dampeners fully engaged! Safe landing protocol ready.",
        "Ye kya amusement park ride chal rahi hai mere saath?",
        "Arey aaram se, tail phans jayegi kisi window mein!",
        "Cat floating in cyberspace... screenshot le lo mast lag raha hoon!",
        "Bhai screen ke bahar mat phenk dena, window bounds check karo!",
        "Mujhe composer ke paas rehna pasand hai, wahan dhyan rehta hai code pe.",
        "Oye hoye! Kitni tezi se drag kar rahe ho, motion blur aa jayega!",
        "Drop zone clear! Safe landing please.",
        "Bhai circus mein kaam karta tha kya pehle? Kya jugglery hai!",
        "My kinetic energy sensors are spiking! Settle down please.",
        "Hawa mein latka diya? Kuch khilao pilao pehle!",
        "Touch down confirmation required. Land karwao babu!",
        "Bhai main transparent window mein rehta hoon, bhatkao mat.",
        "Arey re re! Wall bounce hone wala hai, brake maaro!"
],
      jokes: [
        "Programmer ki shaadi kyu late hoti hai? Kyunki wo git commit toh karta hai, par push karne se darta hai!",
        "Billi aur software engineer mein kya common hai? Dono ko lagta hai unka code perfect hai jab tak test na ho!",
        "Software engineer ne mandir mein kya maanga? 'Prabhu prod pe code chal jaye, increment agle saal dekh lenge!'",
        "CSS centering aur dil ka mamla... dono aasan lagte hain par kisi se center nahi hote!",
        "Ek programmer doosre se bola: 'Bhai meri biwi ne bola doodh le aana, aur agar ande mile toh 10 le aana. Main 10 doodh le aaya!'",
        "Duniya mein 10 tarah ke log hote hain: Ek jo binary samajhte hain, aur doosre jo nahi samajhte!",
        "Why do programmers prefer dark mode? Kyunki roshni mein bugs nazar aate hain!",
        "Doctor ne coder se poocha: 'Aapka blood pressure kyu high hai?' Coder bola: 'Legacy code review kar raha tha!'",
        "Programmer ka favorite hangout spot kahan hai? Foo Bar!",
        "Ek coder jungle gaya, sher ko dekh ke bola: 'System reboot kar do, threat neutral ho jayega!'",
        "Beta bola papa se: 'Papa main engineer banunga!' Papa ne ro ke bola: 'Kaunsa paap kiya tha maine?!'",
        "Billi aur Linux mein kya rishta hai? Dono ko permission issues pasand nahi hain!",
        "Interview mein poocha: 'Hardest part of programming kya hai?' Coder bola: 'Variable names sochna!'",
        "Ek developer ne road cross kyu kiya? Kyunki doosri side Stack Overflow chal raha tha!",
        "Customer: 'Software kitne din mein banega?' Coder: '2 hafte mein'. (Narrator: Wo 2 hafte pichle 2 saal se chal rahe hain!)",
        "Bhai infinite loop aur Indian daily soaps mein koi farq nahi hai, dono kabhi khatam nahi hote!",
        "Aapka code fast chal raha hai? Mubarak ho, aapne saari validation skip kar di hai!",
        "Ek bug bola doosre bug se: 'Chal production ghoomne chalte hain, developer so raha hai!'",
        "Git merge conflict dekh ke toh ache acho ki bolti band ho jaati hai!",
        "Tester ne restaurant mein enter kiya. Ek beer order ki, 0 beer order ki, 999999 beer order ki, ek chipkali order ki... restaurant ne aag pakad li!",
        "Backend dev bolta hai: 'Data ja raha hai'. Frontend bolta hai: 'Screen pe nahi dikh raha'. Database bola: 'Apun toh kabka crash ho gaya!'",
        "Coder ki girlfriend boli: 'Main zaroori hoon ya coding?' Coder ne 2 ghante socha aur time complexity calculate ki!",
        "Computer ne programmer se bola: 'I have an error'. Programmer ne bola: 'Par mere local machine pe toh chal raha tha!'",
        "Artificial Intelligence aur Real Stupidity mein ladai ho toh hamesha Stupidity jeetti hai!",
        "Ek engineer ne chai ki dukaan kholi, naam rakha: 'Java Tea Point - Zero Exceptions!'",
        "Compiler aur Saas (Mother-in-law) mein kya similarity hai? Dono choti choti baaton pe tokte hain!",
        "Bhai while(true) loop laga ke computer chhod ke bhaag gaye? Pure villainous energy!",
        "Agar architects software engineers ki tarah ghar banate, toh ek chidiya baithne pe poori building gir jaati!",
        "Interview mein poocha: 'C++ aur Java mein kya farq hai?' Banda bola: 'Java mein garbage collector hota hai, C++ mein hum khud kachra saaf karte hain!'",
        "Git push force chala ke so gaye? Kal subah termination letter ready milega!",
        "Ek developer swimming pool mein kyu kooda? Kyunki usne 'deep copy' ka logic test karna tha!",
        "Software release aur train ka arrival: Dono kabhi time pe nahi aate!",
        "Programmer marne ke baad swarg gaya, Yamraj ne poocha: 'Windows chahiye ya Mac?' Coder bola: 'Arch Linux with i3wm!'",
        "Debugging is like being the detective in a crime movie where you are also the murderer!",
        "Manager ne bola: 'Estimates do'. Coder ne bola: '3 din'. Manager bola: '1 din mein karo'. Coder bola: 'Chalo 2 hafte lagenge ab!'",
        "Bhai coding interviews mein binary tree invert karwate hain aur job pe bas button ka padding change karwate hain!",
        "Ek coder ne alarm clock lagayi 7:00, 7:05, 7:10, 7:15... Exception handling bolte hain isko!",
        "Ek developer ne apne bete ka naam rakha: 'Index_0'!",
        "Python bolta hai: 'Indentation is life'. C++ bolta hai: 'Semicolon is God'. JavaScript bolta hai: 'Everything is an object, even errors!'",
        "Bhai laptop band karte waqt work save na karna... maut ko takk se chhoo ke wapas aane jaisa hai!",
        "Ek dev ne doctor se bola: 'Mujhe bhoolne ki bimari hai'. Doctor ne bola: 'Kab se?' Dev bola: 'Pichle commit se!'",
        "Production deployment on Friday: The fastest way to ruin a weekend since 1995!",
        "Programmer ka mantra: 'If it ain't broke, don't fix it. If it is broke, pretend you didn't see it!'",
        "Bhai code mein comments daalna jaise diary mein confession likhna... koi nahi padhta!",
        "Stack Overflow down ho jaye toh global IT GDP 80% gir jayegi 10 minute mein!"
],
      vibe: [
        "Seedhe baitho bhai! Reendh ki haddi ka shape curly bracket jaisa ho gaya hai.",
        "Paani piyo, lambi saans lo aur bolo: 'Aal Izz Well!' Sab theek hoga.",
        "Screen se 2 minute nazar hatao, 20-20-20 rule follow karo bhai.",
        "Control Majnu control! Problem kitni bhi badi ho, step-by-step tod ke solve karenge.",
        "Thoda stretch maaro, wrist ghumaao aur chai ki chuski lo.",
        "Bhai deep breath lo... Inhale clean logic, exhale syntax errors.",
        "Zindagi code se badi hai mere dost, thoda chill bhi zaroori hai.",
        "Posture check! Kandhe neeche karo, jaw unclench karo, smile karo.",
        "Bhai ek glass paani pi lo, dehydration se CPU aur brain dono slow chalte hain.",
        "Tension lene se bug solve nahi hota, fresh mind se code dekhne se hota hai.",
        "Chai ka waqt ho gaya hai! Chhoti si walk leke aao canteen tak.",
        "Aankhon pe thoda thanda paani maaro, screen dekh ke lal ho gayi hain.",
        "Bhai sab badiya hoga, code chala hai aur aage bhi chalega. Trust the process.",
        "Deep breathing session with Raiden: Saans andar... 1, 2, 3... Saans bahar!",
        "Engineering tough hai par tu usse zyada tough hai bhai!",
        "Thoda balcony mein khade hoke taazi hawa lo, green trees dekho thoda.",
        "Wrist stretch karo, carpal tunnel se bachna hai toh roz exercise karo.",
        "Bhai self-care is not a bug, it is the most important feature!",
        "Music suno thoda lofi wala, coding speed apne aap smooth ho jayegi.",
        "Ghabra mat mere dost, har senior engineer kisi din fresher tha.",
        "Coffee limit mein piyo, paani zyada piyo, Raiden ka advice yaad rakhna.",
        "Acha socho, acha code likho, aur aish karo!",
        "Bhai dimaag thak gaya ho toh 15 minute ka power nap le lo bindaas.",
        "Mindset positive rakho: 'Har bug ka solution internet pe maujood hai!'",
        "Stretching break! Dono haath upar uthao aur cyber stretch karo.",
        "Tu akela nahi hai is battle mein, Raiden 24x7 tere desk pe khada hai.",
        "Ek step peeche lo, problem ko door se dekho, perspective badal jayega.",
        "Bhai thoda dhoop bhi le liya karo, Vitamin D code mein nahi milta!",
        "Subah ka workout aur shaam ka code review: Dono se discipline aata hai.",
        "Breathe in calm vibes, breathe out panic. You got this!",
        "Har mushkil algorithm ko chhote tukdo mein tod do, aasan ho jayega.",
        "Bhai sleep schedule sudhar lo thoda, 8 ghante ki neend zaroori hai.",
        "Chai aur sukoon: Dono ka combo duniya ka best tonic hai.",
        "Smile karo yaar, screen pe tumhara reflection bohot serious lag raha hai!",
        "Relax your shoulders, breathe gently, and type with confidence.",
        "Bhai burnout mat hone dena khud ko, health first, sprints second.",
        "A comfortable coder is a productive coder! Chair adjust kar lo.",
        "Thoda fresh fruits khao, chips se VRAM recharge nahi hota!",
        "Zindagi mein balance banao: Coding, sleeping, eating, repeating with joy.",
        "Raiden wishes you pure peace and zero exceptions today!"
],
      bollywood: [
        "Kitne aadmi the? Arrey Sambha, 3 bug the aur teeno production pe pahunch gaye!",
        "Mogambo khush hua... jab sara test suite bina error ke pass ho gaya!",
        "Picture abhi baaki hai mere dost... abhi toh unit testing shuru hui hai!",
        "Yeh dhai kilo ka haath jab keyboard pe padta hai na, toh O(1) algorithm nikalta hai!",
        "Rishte mein toh hum tumhare senior lagte hain, naam hai Raiden!",
        "Don ka intezaar toh 11 mulkon ki police kar rahi hai, par Don toh local GPU pe model train kar raha hai!",
        "Babu bhaiya ka style hai re: Seedha, saaf, aur bina kisi extra library ke!",
        "Tumse na ho payega beta... jab tak dry run karna nahi seekhoge!",
        "Thappad se darr nahi lagta sahab, merge conflict se lagta hai!",
        "Tareekh pe tareekh, tareekh pe tareekh... par client ko delivery aaj hi chahiye!",
        "Apun jahan khada hota hai, line wahi se shuru hoti hai... code execution ki!",
        "Basanti, in bugs ke aage mat jhukna! Code run karte raho.",
        "Kutte, kameene! Main tera code chaba jaunga... compiler bol raha hai!",
        "Ek chutki sindoor ki keemat tum kya jaano Ramesh babu... ek missing semicolon ki keemat pucho coder se!",
        "Pushpa, Pushpa Raj... main jhukega nahi, chahe jitna bada bug ho!",
        "Teja main hoon, mark idhar hai! Bug main hoon, traceback idhar hai!",
        "Crime Master Gogo naam hai mera, aankhein nikaal ke gotiya khelunga... pointer error ke saath!",
        "Mere paas bangla hai, gaadi hai, bank balance hai... tere paas kya hai? Mere paas zero-bug code hai!",
        "Kabhi kabhi kuch jeetne ke liye kuch khona padta hai, aur haar kar jeetne wale ko Baazigar kehte hain!",
        "Kaun kambakht bardaasht karne ko peeta hai? Hum toh code compile karne ke liye chai peete hain!",
        "Hum tumme itne chhed karenge ki confuse ho jaoge... spaghetti code ka dialogue!",
        "Aap purush hi nahi... mahapurush hain! Jab aap bina warning ke C++ compile karte ho.",
        "Sardaar, maine aapka namak khaya hai... toh ab goli khao, bug production pe chala gaya!",
        "Zindagi jhand ba, phir bhi ghamand ba... coder on Friday evening!",
        "Rahul... naam toh suna hi hoga! Variable ka naam hamesha sensible rakho.",
        "Mera dimaag mat ghumaao, Singham ban jaunga aur pura repo delete kar dunga!",
        "Main apni favourite hoon... jab mera likha code bina crash hue 1 saal chal jaye!",
        "All izz well! Dil pe haath rakh ke bol, compilation pass ho jayega.",
        "Dosti ka ek usool hai madam: No sorry, no thank you, bas pull request approve kar do!",
        "Bade bade deshon mein aisi choti choti baatein hoti rehti hain, Senorita... 404 error hai bas!",
        "K-k-k-kiran nahi, K-k-k-kernel panic aa gaya system mein!",
        "Hum shareef kya hue, poori duniya hi badmash ho gayi... junior ne main branch pe push kar diya!",
        "Yeh Baburao ka dhotar nahi hai jo khul jaye, solid encrypted password hai!",
        "Aata majhi satakli! Itna bada SQL query bina join ke likha?",
        "Chutki bajake bug solve karta hoon main, Singham style!",
        "Dosti ki hai, nibhani padegi... code mein comments likhni padegi!",
        "Khopdi tod saale ka! Ek bracket ke chakkar mein poora build fail kar diya!",
        "Bhai ne bola commit karne ka, toh karne ka! No questions asked.",
        "Jab tak todhenge nahi, tab tak chhodenge nahi... bug fixing spirit!",
        "Main udna chahta hoon, daudna chahta hoon, girna bhi chahta hoon... bas production crash nahi dekhna chahta!",
        "Apna time aayega! Har junior developer ek din tech lead banega.",
        "Sultan ko sirf ek hi shakhs hara sakta hai... Sultan khud ka likha hua recursive loop!",
        "Utha le re baba, utha le... mereko nahi re, is runtime exception ko utha le!",
        "Sholey ke Gabbar ne poocha: 'Kitne test case pass hue?' Sambha bola: 'Poore, sarkar!'",
        "Hum bhi wo hain jo kabhi kisi ke peeche nahi khade hote... jahan khade hote hain wahi se stack shuru hota hai!"
]
    };

    this.dialogueIndices = {};
    for (const key of Object.keys(this.dialogueBank)) {
      this.dialogueIndices[key] = 0;
    }

    // Initialize Companion Subsystem
    this.initCompanionSubsystem();

    // Web Audio Synthesizer
    this.audioCtx = null;

    // Assets setup
    this.spriteLoaded = false;
    this.poseImages = {};
    this.faceImages = {};

    this.isFloatingOutside = (typeof localStorage !== 'undefined') && localStorage.getItem('raiden_mascot_floating') === 'true';
    this.initAudio();
    this.loadAssets();
    this.applySettingsUI();
    this.updateDockingUI();
    this.startDockSyncLoop();
    this.bindEvents();
    this.startInactivityMonitor();
    this.startLoop();

    // Initial greeting after slight delay
    setTimeout(() => {
      this.handleSystemEvent('APP_READY');
    }, 350);
  }

  /* =========================================================================
     AUDIO SYNTHESIS — 8-BIT CYBER-CHIMES & SYNTH TONES
     ========================================================================= */
  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn('[Mascot] Web Audio unavailable:', e);
    }
  }

  playCyberTone(type = 'blip') {
    if (!this.soundEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'type') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(840 + Math.random() * 220, now);
        gain.gain.setValueAtTime(0.012, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.024);
        osc.start(now);
        osc.stop(now + 0.024);
      } else if (type === 'blip') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(1040, now + 0.06);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'purr') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.12);
        osc.frequency.linearRampToValueAtTime(100, now + 0.25);
        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'zap') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'think') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(540, now + 0.16);
        gain.gain.setValueAtTime(0.028, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.setValueAtTime(940, now + 0.06);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'chime') {
        // Two-tone victory chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'bounce') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.07);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      }
    } catch (e) {}
  }

  /* =========================================================================
     ASSETS LOADER — POSES, FACES & SPRITESHEETS
     ========================================================================= */
  loadAssets() {
    const savedId = (typeof localStorage !== 'undefined' && localStorage.getItem('raiden_companion_id')) || 'void';
    this.activeCompanionId = savedId;
    this.loadCompanionPoseImages(savedId);

    this.spriteSheet = new Image();
    this.spriteSheet.src = `companions/${savedId}/sprites/spritesheet.png`;
    this.spriteSheet.onload = () => {
      this.spriteLoaded = true;
    };
    this.spriteSheet.onerror = () => {
      this.spriteSheet.src = 'assets/mascot/mascot_spritesheet.png';
      this.spriteSheet.onload = () => {
        this.spriteLoaded = true;
      };
    };
  }

  loadCompanionPoseImages(companionId) {
    const id = (companionId || 'void').toLowerCase();
    const folder = `companions/${id}/sprites`;

    const poses = {
      hero: `${folder}/idle.png`,
      thinking: `${folder}/thinking.png`,
      talking: `${folder}/talking.png`,
      sleeping: `${folder}/sleeping.png`,
      crouch: `${folder}/celebrating.png`,
      stretch: `${folder}/celebrating.png`,
      sit: `${folder}/sleeping.png`
    };

    this.poseImages = {};
    for (const [key, path] of Object.entries(poses)) {
      const img = new Image();
      img.src = path;
      this.poseImages[key] = img;
    }

    this.faceImages = {};
    const avatarImg = new Image();
    avatarImg.src = `${folder}/avatar.png`;
    for (const f of ['neutral', 'happy', 'confident', 'annoyed', 'thinking']) {
      this.faceImages[f] = avatarImg;
    }

    this.spriteSheet = new Image();
    this.spriteSheet.src = `${folder}/spritesheet.png`;
    this.spriteSheet.onload = () => {
      this.spriteLoaded = true;
    };
  }

  getCompanionAccentColor() {
    if (this.registry) {
      const pack = this.registry.getActive();
      if (pack && pack.manifest && pack.manifest.palette && pack.manifest.palette.accent) {
        return pack.manifest.palette.accent;
      }
    }
    const colorMap = {
      void: '#00f0ff',
      pixel: '#ffb703',
      nova: '#ff2a85',
      cipher: '#00ff88'
    };
    return colorMap[this.activeCompanionId] || '#00f0ff';
  }

  /* =========================================================================
     STATE TRANSITION & PRIORITY SYSTEM
     ========================================================================= */
  setState(stateName, duration = 0, priority = this.PRIORITY.INTERACTION) {
    const validStates = [
      'IDLE', 'CURIOUS', 'THINKING', 'SPEAKING', 'LISTENING', 'ALERT',
      'HAPPY', 'PROUD', 'CONFUSED', 'SLEEPY', 'STARTLED',
      'PLAYFULLY_ANNOYED', 'ERROR', 'VICTORY', 'DRAGGED', 'STRETCH', 'SITTING',
      'TYPING', 'DANCING', 'MUSIC_DANCE'
    ];

    if (!validStates.includes(stateName)) return false;

    // Interrupt rules: lower priority cannot overwrite higher priority
    if (priority < this.activePriority) {
      if (['IDLE', 'TYPING', 'DANCING', 'MUSIC_DANCE'].includes(stateName) && duration === 0) {
        this.persistentState = stateName;
        this.persistentPriority = priority;
      }
      return false;
    }

    if (this.stateTimer) {
      clearTimeout(this.stateTimer);
      this.stateTimer = null;
    }

    // Save persistent baseline if this is a lasting state (music, typing, idle)
    if (duration === 0 && ['IDLE', 'TYPING', 'DANCING', 'MUSIC_DANCE', 'SITTING'].includes(stateName)) {
      this.persistentState = stateName;
      this.persistentPriority = priority;
    }

    this.currentState = stateName;
    this.activePriority = priority;
    this.currentFrameIndex = 0;
    this.tickCount = 0;
    this.updateStatusTag(`SYS: ${stateName.replace('_', ' ')}`);

    // Synchronize expression with state
    if (['HAPPY', 'VICTORY', 'DANCING', 'MUSIC_DANCE'].includes(stateName)) this.currentExpression = 'happy';
    else if (['PROUD'].includes(stateName)) this.currentExpression = 'confident';
    else if (['PLAYFULLY_ANNOYED'].includes(stateName)) this.currentExpression = 'annoyed';
    else if (['THINKING', 'CONFUSED', 'TYPING'].includes(stateName)) this.currentExpression = 'thinking';
    else if (['IDLE', 'CURIOUS', 'LISTENING', 'SLEEPY'].includes(stateName)) this.currentExpression = 'neutral';

    // State audio effects
    if (stateName === 'ALERT' || stateName === 'STARTLED') this.playCyberTone('alert');
    else if (stateName === 'THINKING') this.playCyberTone('think');
    else if (stateName === 'VICTORY') this.playCyberTone('chime');

    // Auto-revert or restore after duration
    if (duration > 0 && stateName !== 'IDLE') {
      this.stateTimer = setTimeout(() => {
        this.restorePreviousState();
      }, duration);
    }

    return true;
  }

  restorePreviousState() {
    if (this.stateTimer) {
      clearTimeout(this.stateTimer);
      this.stateTimer = null;
    }
    const targetState = this.persistentState || 'IDLE';
    const targetPriority = this.persistentPriority || this.PRIORITY.IDLE;
    this.currentState = targetState;
    this.activePriority = targetPriority;
    this.updateStatusTag(`SYS: ${targetState.replace('_', ' ')}`);
  }

  revertToIdle() {
    this.persistentState = 'IDLE';
    this.persistentPriority = this.PRIORITY.IDLE;
    this.currentState = 'IDLE';
    this.activePriority = this.PRIORITY.IDLE;
    this.currentExpression = 'neutral';
    this.updateStatusTag('SYS: IDLE');
    if (this.bubble) {
      this.bubble.classList.remove('is-thinking');
    }
  }

  setExpression(exprName) {
    if (['neutral', 'happy', 'confident', 'annoyed', 'thinking'].includes(exprName)) {
      this.currentExpression = exprName;
      this.playCyberTone('blip');
      const moodNames = { neutral: 'Ekdum Normal', happy: 'Full Khush', confident: 'Bhaukaal', annoyed: 'Thoda Chidha Hua', thinking: 'Gehri Soch' };
      this.triggerDialogue(`Swag update: ${moodNames[exprName] || exprName} mode on!`);
      this.toggleMenu(false);
    }
  }

  updateStatusTag(statusText) {
    const tag = document.getElementById('mascot-status-pill');
    if (tag) {
      tag.textContent = statusText;
      if (statusText.includes('THINK') || statusText.includes('SPEAK')) {
        tag.className = 'bubble-status-pill thinking';
      } else if (statusText.includes('ALERT') || statusText.includes('ERROR')) {
        tag.className = 'bubble-status-pill alert';
      } else {
        tag.className = 'bubble-status-pill';
      }
    }
  }

  /* =========================================================================
     APPLICATION EVENT BUS CONNECTOR
     ========================================================================= */
  handleSystemEvent(eventType, metadata = {}) {
    this.lastActivityTime = Date.now();
    if (this.isSleeping) {
      this.wakeUp();
    }

    switch (eventType) {
      case 'APP_READY':
        if (!this.hasGreeted) {
          this.hasGreeted = true;
          this.setState('HAPPY', 3000, this.PRIORITY.CONTEXTUAL);
          const greet = this.getNextDialogue('greeting');
          this.triggerDialogue(greet);
        }
        break;

      case 'TYPING':
        this.handleTyping();
        break;

      case 'MUSIC_PLAYING':
        this.setState('DANCING', 0, this.PRIORITY.MUSIC);
        this.playCyberTone('bounce');
        this.spawnParticles('music_notes', 5);
        if (metadata && (metadata.track || metadata.title)) {
          const t = (metadata.track || metadata.title).slice(0, 18);
          this.updateStatusTag(`♪ ${t}`);
        }
        break;

      case 'MUSIC_PAUSED':
      case 'MUSIC_STOPPED':
        if (this.currentState === 'DANCING' || this.currentState === 'MUSIC_DANCE') {
          this.restorePreviousState();
        }
        break;

      case 'MESSAGE_SENT':
        this.setState('CURIOUS', 1600, this.PRIORITY.CONTEXTUAL);
        this.playCyberTone('blip');
        if (Date.now() - this.cooldowns.submitAck > 14000) {
          this.cooldowns.submitAck = Date.now();
          const ack = this.getNextDialogue('submitAck');
          this.triggerDialogue(ack);
        }
        break;

      case 'LLM_THINKING':
      case 'START_GENERATE':
        this.setState('THINKING', 0, this.PRIORITY.ACTIVE_TASK);
        if (metadata.isRoast) {
          this.triggerDialogue("Roast protocol ON! Abhi dhuandhaar bezti calculate karta hoon.");
        } else {
          const thinkQuote = this.getNextDialogue('submitAck');
          this.triggerDialogue(thinkQuote);
        }
        break;

      case 'STREAMING':
        this.lastStreamChunkTime = Date.now();
        this.streamingPulse = 1.0;
        if (this.currentState !== 'SPEAKING' && this.activePriority <= this.PRIORITY.ACTIVE_TASK) {
          this.setState('SPEAKING', 0, this.PRIORITY.ACTIVE_TASK);
          this.updateStatusTag('SYS: GENERATING');
        }
        break;

      case 'LLM_DONE':
      case 'STOP_GENERATE':
        if (metadata.isRoast) {
          this.setState('PROUD', 3200, this.PRIORITY.ACTIVE_TASK);
          this.triggerDialogue("Khatam! Tata, bye bye! Pura code chamka ke roast kar diya.");
          this.playCyberTone('chime');
        } else {
          this.setState('VICTORY', 2600, this.PRIORITY.ACTIVE_TASK);
          const comp = this.getNextDialogue('completion');
          this.triggerDialogue(comp);
          this.spawnParticles('victory', 12);
        }
        break;

      case 'ERROR':
        this.setState('ERROR', 3500, this.PRIORITY.CRITICAL);
        this.playCyberTone('alert');
        this.triggerDialogue(this.getNextDialogue('error'));
        this.spawnParticles('glitch', 16);
        break;

      case 'MESSAGE_COPIED':
        if (Date.now() - this.cooldowns.copy > 5000) {
          this.cooldowns.copy = Date.now();
          this.setState('HAPPY', 2200, this.PRIORITY.CONTEXTUAL);
          this.playCyberTone('blip');
          this.triggerDialogue(this.getNextDialogue('copy'));
        }
        break;

      case 'CHAT_CLEARED':
        this.setState('STRETCH', 2200, this.PRIORITY.CONTEXTUAL);
        this.playCyberTone('blip');
        this.triggerDialogue(this.getNextDialogue('clearChat'));
        break;

      case 'VOICE_LISTENING':
        this.setState('LISTENING', 0, this.PRIORITY.ACTIVE_TASK);
        this.updateStatusTag('SYS: LISTENING');
        break;

      case 'VOICE_DONE':
        this.restorePreviousState();
        break;

      case 'CPU_SPIKE':
      case 'HIGH_LOAD':
        this.setState('STARTLED', 3000, this.PRIORITY.CRITICAL);
        this.triggerDialogue("Arrey baap re! CPU ka 440 volt fuse udne wala hai, sambhalo!");
        break;

      case 'FILE_SAVE':
        this.setState('HAPPY', 2200, this.PRIORITY.CONTEXTUAL);
        this.playCyberTone('bounce');
        this.spawnParticles('victory', 6);
        break;

      case 'CODING_BURST':
        this.setState('THINKING', 2800, this.PRIORITY.CONTEXTUAL);
        this.playCyberTone('blip');
        break;

      case 'CODING_PAUSE':
        this.setState('CONFUSED', 3000, this.PRIORITY.CONTEXTUAL);
        break;

      case 'FILE_SWITCH':
        this.setState('CURIOUS', 1800, this.PRIORITY.CONTEXTUAL);
        break;

      case 'SYNTAX_ERROR':
        this.setState('ERROR', 3500, this.PRIORITY.CRITICAL);
        this.playCyberTone('alert');
        this.spawnParticles('glitch', 14);
        break;

      case 'GIT_COMMIT':
        this.setState('VICTORY', 3200, this.PRIORITY.ACTIVE_TASK);
        this.playCyberTone('chime');
        this.spawnParticles('victory', 12);
        break;
    }
  }

  handleTyping() {
    this.lastActivityTime = Date.now();
    if (this.isSleeping) {
      this.wakeUp();
      return;
    }

    // Mascot glances toward composer input (left and down) & perks ear
    this.glanceX = -0.7;
    this.glanceY = 0.4;
    this.earTwitchLeft = 0.25;

    // Transition to TYPING state with typing priority
    if (this.activePriority <= this.PRIORITY.TYPING) {
      this.setState('TYPING', 0, this.PRIORITY.TYPING);
      this.currentExpression = 'thinking';
    }

    // Occasional subtle typing sparks (zero text inspection)
    if (Math.random() < 0.2) {
      this.spawnParticles('typing_sparks', 2);
    }

    // Debounced grace period: smooth pause bridging without state flickering
    if (this.typingGraceTimer) {
      clearTimeout(this.typingGraceTimer);
    }
    this.typingGraceTimer = setTimeout(() => {
      if (this.currentState === 'TYPING') {
        this.restorePreviousState();
        this.glanceX = 0;
        this.glanceY = 0;
        this.earTwitchLeft = 0;
      }
    }, this.typingGraceMs);
  }

  /* =========================================================================
     INACTIVITY MONITOR & SLEEP CYCLE
     ========================================================================= */
  startInactivityMonitor() {
    this.sleepCheckInterval = setInterval(() => {
      const elapsed = Date.now() - this.lastActivityTime;
      // After 45 seconds of complete idle, cat curls into sleep
      if (elapsed > 45000 && !this.isSleeping && this.currentState === 'IDLE') {
        this.isSleeping = true;
        this.setState('SLEEPY', 0, this.PRIORITY.IDLE);
        this.triggerDialogue("Bhai aankhein bandh ho rahi hain... Low-power jugaad pe so raha hoon.");
      }
    }, 5000);
  }

  wakeUp() {
    this.isSleeping = false;
    this.setState('HAPPY', 2200, this.PRIORITY.CONTEXTUAL);
    this.playCyberTone('blip');
    this.triggerDialogue(this.getNextDialogue('wakeUp'));
  }

  /* =========================================================================
     PLAYFUL USER INTERACTIONS
     ========================================================================= */
  pet() {
    this.lastActivityTime = Date.now();
    this.setState('HAPPY', 2600, this.PRIORITY.INTERACTION);
    this.playCyberTone('purr');
    this.spawnParticles('heart', 8);
    const quote = this.getNextDialogue('pet');
    this.triggerDialogue(quote);
  }

  zap() {
    this.lastActivityTime = Date.now();
    this.setState('PROUD', 2600, this.PRIORITY.INTERACTION);
    this.playCyberTone('zap');
    this.spawnParticles('lightning', 12);
    const quote = this.getNextDialogue('zap');
    this.triggerDialogue(quote);
  }

  cyclePose() {
    this.lastActivityTime = Date.now();
    const poses = ['IDLE', 'ALERT', 'STRETCH', 'SITTING', 'THINKING'];
    const idx = (poses.indexOf(this.currentState) + 1) % poses.length;
    const nextPose = poses[idx];
    this.setState(nextPose, 3000, this.PRIORITY.INTERACTION);
    this.playCyberTone('blip');
    const poseNames = { IDLE: 'Chill Stance', ALERT: 'Chaukanna Ninja', STRETCH: 'Cat Stretch', SITTING: 'Shaant Baithak', THINKING: 'Gehri Soch' };
    this.triggerDialogue(`Swag check! Naya pose: [${poseNames[nextPose] || nextPose}]!`);
  }

  simulateGrab() {
    this.lastActivityTime = Date.now();
    this.setState('DRAGGED', 2800, this.PRIORITY.INTERACTION);
    this.posY = -16;
    this.dragStretchFactor = 1.25;
    this.playCyberTone('alert');
    this.triggerDialogue(this.getNextDialogue('drag'));

    setTimeout(() => {
      this.posY = 0;
      this.dragStretchFactor = 1.0;
      this.revertToIdle();
      this.playCyberTone('bounce');
    }, 2800);
  }

  handleQuickPrompt(type) {
    this.lastActivityTime = Date.now();
    if (type === 'roast') {
      this.setState('STARTLED', 3000, this.PRIORITY.INTERACTION);
      this.playCyberTone('alert');
      this.triggerDialogue(this.getNextDialogue('roasts'));
    } else if (type === 'vibe') {
      this.setState('IDLE', 3000, this.PRIORITY.INTERACTION);
      this.playCyberTone('blip');
      this.triggerDialogue(this.getNextDialogue('vibe'));
    } else if (type === 'joke') {
      this.setState('SITTING', 3000, this.PRIORITY.INTERACTION);
      this.playCyberTone('blip');
      this.triggerDialogue(this.getNextDialogue('jokes'));
    }
  }

  cycleNextDialogue() {
    this.lastActivityTime = Date.now();
    this.setState('CURIOUS', 2400, this.PRIORITY.INTERACTION);
    this.playCyberTone('blip');
    const funPool = ['banter', 'bollywood', 'jokes', 'banter', 'roasts'];
    const selectedCat = funPool[Math.floor(Math.random() * funPool.length)];
    this.triggerDialogue(this.getNextDialogue(selectedCat));
  }

  cycleFunnyRoast() {
    this.handleQuickPrompt('roast');
  }

  getNextDialogue(category) {
    const list = this.dialogueBank[category] || this.dialogueBank.banter;
    if (!list || list.length === 0) return "Kya bolti public! Raiden ready hai.";
    if (this.dialogueIndices[category] === undefined) {
      this.dialogueIndices[category] = Math.floor(Math.random() * list.length);
    }
    const idx = this.dialogueIndices[category];
    const item = list[idx % list.length];
    const stride = (list.length > 5) ? (1 + Math.floor(Math.random() * 3)) : 1;
    this.dialogueIndices[category] = (idx + stride) % list.length;
    return item;
  }

  /* =========================================================================
     SETTINGS, TOGGLES & MENU
     ========================================================================= */
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('raiden_mascot_sound', this.soundEnabled ? 'true' : 'false');
    this.applySettingsUI();
    this.playCyberTone('blip');
    this.triggerDialogue(this.soundEnabled ? "Awaaz chalu! Ghanti bajegi." : "Ekdum shant... Ninja silent mode activate!");
    return this.soundEnabled;
  }

  toggleDialogue() {
    this.dialogueEnabled = !this.dialogueEnabled;
    localStorage.setItem('raiden_mascot_dialogue', this.dialogueEnabled ? 'true' : 'false');
    this.applySettingsUI();
    if (!this.dialogueEnabled && this.bubble) {
      this.bubble.classList.remove('visible');
    } else {
      this.triggerDialogue("Baatcheet chalu hai bhai! Full bakchodi mode.");
    }
    return this.dialogueEnabled;
  }

  toggleAnimation() {
    this.animationEnabled = !this.animationEnabled;
    localStorage.setItem('raiden_mascot_animation', this.animationEnabled ? 'true' : 'false');
    this.applySettingsUI();
    this.triggerDialogue(this.animationEnabled ? "Full 16-bit action jalwa chalu!" : "Chill mode, animation pause hai boss.");
    return this.animationEnabled;
  }


  /* =========================================================================
     MODULAR COMPANION SUBSYSTEM (VOID, PIXEL, NOVA, CIPHER)
     ========================================================================= */
  initCompanionSubsystem() {
    try {
      const CompanionEventBusClass = (typeof CompanionEventBus !== 'undefined') ? CompanionEventBus : (typeof require !== 'undefined' ? require('./companion/CompanionEventBus.js') : null);
      const CompanionSettingsClass = (typeof CompanionSettings !== 'undefined') ? CompanionSettings : (typeof require !== 'undefined' ? require('./companion/CompanionSettings.js') : null);
      const CompanionThemesClass = (typeof CompanionThemes !== 'undefined') ? CompanionThemes : (typeof require !== 'undefined' ? require('./companion/CompanionThemes.js') : null);
      const CompanionStateMachineClass = (typeof CompanionStateMachine !== 'undefined') ? CompanionStateMachine : (typeof require !== 'undefined' ? require('./companion/CompanionStateMachine.js') : null);
      const CompanionRegistryClass = (typeof CompanionRegistry !== 'undefined') ? CompanionRegistry : (typeof require !== 'undefined' ? require('./companion/CompanionRegistry.js') : null);
      const DialogueEngineClass = (typeof DialogueEngine !== 'undefined') ? DialogueEngine : (typeof require !== 'undefined' ? require('./companion/DialogueEngine.js') : null);
      const AnimationPlayerClass = (typeof AnimationPlayer !== 'undefined') ? AnimationPlayer : (typeof require !== 'undefined' ? require('./companion/AnimationPlayer.js') : null);
      const BehaviorSchedulerClass = (typeof BehaviorScheduler !== 'undefined') ? BehaviorScheduler : (typeof require !== 'undefined' ? require('./companion/BehaviorScheduler.js') : null);

      if (CompanionEventBusClass) this.eventBus = new CompanionEventBusClass();
      if (CompanionSettingsClass) this.settings = new CompanionSettingsClass();
      if (CompanionThemesClass && this.settings) this.themes = new CompanionThemesClass(this.settings);
      if (CompanionStateMachineClass) {
        this.stateMachine = new CompanionStateMachineClass({
          onStateChange: (state) => {
            if (this.animPlayer) this.animPlayer.setState(state);
          }
        });
      }
      if (CompanionRegistryClass) this.registry = new CompanionRegistryClass();
      if (DialogueEngineClass) {
        this.dialogueEngine = new DialogueEngineClass({
          bubbleElement: this.bubble,
          settings: this.settings
        });
      }
      if (AnimationPlayerClass && this.canvas) {
        this.animPlayer = new AnimationPlayerClass(this.canvas, { settings: this.settings });
      }
      if (BehaviorSchedulerClass) {
        this.scheduler = new BehaviorSchedulerClass({
          stateMachine: this.stateMachine,
          dialogueEngine: this.dialogueEngine,
          settings: this.settings,
          animationPlayer: this.animPlayer
        });
        this.scheduler.start();
      }

      // Set active companion from settings or default to 'void'
      const activeId = this.settings ? this.settings.get('selectedCompanion') : 'void';
      this.switchCompanion(activeId, false);
    } catch (e) {
      console.warn('[CompanionSubsystem] Non-fatal initialization notice:', e);
    }
  }

  cycleCompanion(announce = true) {
    const roster = ['void', 'pixel', 'nova', 'cipher'];
    const current = (this.activeCompanionId || 'void').toLowerCase();
    const idx = roster.indexOf(current);
    const nextId = roster[(idx + 1) % roster.length];
    this.switchCompanion(nextId, announce);
    return nextId;
  }

  switchCompanion(companionId, announce = true) {
    try {
      const id = (companionId || 'void').toLowerCase();
      if (!this.registry) return;

      const pack = this.registry.setActive(id);
      if (!pack) return;

      this.activeCompanionId = id;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('raiden_companion_id', id);
      }
      this.loadCompanionPoseImages(id);
      this.spawnParticles('sparkle', 16);

      if (this.settings) {
        this.settings.set('selectedCompanion', id);
      }

      if (this.themes) {
        this.themes.syncWithCompanion(id);
      }

      if (this.dialogueEngine && pack.dialogue) {
        this.dialogueEngine.loadDialogue(pack.dialogue);
      }

      if (this.animPlayer) {
        this.animPlayer.setPack(pack);
      }

      // Update bubble name badge
      if (typeof document !== 'undefined' && typeof document.querySelector === 'function') {
        const nameEl = document.querySelector('.bubble-name');
        if (nameEl && pack.manifest) {
          nameEl.textContent = pack.manifest.name || 'RAIDEN';
        }
      }

      // Announce companion entry
      if (announce && this.dialogueEngine) {
        const greet = this.dialogueEngine.selectLine('greeting');
        if (greet) {
          this.triggerDialogue(greet.text);
        }
      }

      // Notify backend dock state
      try {
        fetch('http://127.0.0.1:8765/api/companion/dock_state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active_companion: id })
        }).catch(() => {});
      } catch (e) {}

      // Update switcher UI if open
      this.updateSwitcherUI();

      if (this.eventBus) {
        this.eventBus.emit('companion_switched', { id, manifest: pack.manifest });
      }
    } catch (e) {
      console.warn('[Companion] Error switching companion:', e);
    }
  }

  getAvailableCompanions() {
    if (!this.registry) return [];
    return this.registry.getAll();
  }

  toggleDesktopFloat() {
    if (this.isFloatingOutside) {
      this.dockFromDesktop();
    } else {
      this.popOutToDesktop();
    }
  }

  async popOutToDesktop(pos = null) {
    this.isFloatingOutside = true;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('raiden_mascot_floating', 'true');
    }

    // Reset in-app drag visual styles
    this.posX = 0;
    this.posY = 0;
    if (this.canvas) {
      this.canvas.style.transform = '';
      this.canvas.style.filter = '';
    }

    this.triggerDialogue("Desktop pe nikal raha hoon! Wahan milte hain. 🚀");
    this.playCyberTone('chime');
    this.spawnParticles('sparkle', 20);

    const positionPayload = pos || { x: (typeof window !== 'undefined' && window.screen) ? window.screen.width - 270 : 800, y: (typeof window !== 'undefined' && window.screen) ? window.screen.height - 350 : 600 };

    try {
      await fetch('http://127.0.0.1:8765/api/companion/dock_state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_floating: true,
          active_companion: this.activeCompanionId || 'void',
          x: positionPayload.screenX || positionPayload.x,
          y: positionPayload.screenY || positionPayload.y
        })
      });
    } catch (e) {}

    // Call PyWebview Python backend API to spawn/show Electron
    if (typeof window !== 'undefined' && window.pywebview && window.pywebview.api) {
      const coords = {
        x: positionPayload.screenX || positionPayload.x,
        y: positionPayload.screenY || positionPayload.y
      };
      if (window.pywebview.api.launch_floating_companion) {
        window.pywebview.api.launch_floating_companion(coords);
      } else if (window.pywebview.api.set_companion_dock_state) {
        window.pywebview.api.set_companion_dock_state({
          is_floating: true,
          position: coords
        });
      }
    }

    this.updateDockingUI();
  }

  async dockFromDesktop() {
    this.isFloatingOutside = false;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('raiden_mascot_floating', 'false');
    }
    this.triggerDialogue("Ghar wapas aa gaya! Welcome back. 🏠");
    this.playCyberTone('blip');
    this.spawnParticles('sparkle', 16);

    try {
      await fetch('http://127.0.0.1:8765/api/companion/dock_state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_floating: false, active_companion: this.activeCompanionId || 'void' })
      });
    } catch (e) {}

    if (typeof window !== 'undefined' && window.pywebview && window.pywebview.api) {
      if (window.pywebview.api.dock_floating_companion) {
        window.pywebview.api.dock_floating_companion();
      } else if (window.pywebview.api.set_companion_dock_state) {
        window.pywebview.api.set_companion_dock_state({ is_floating: false });
      }
    }

    this.updateDockingUI();
  }

  updateDockingUI() {
    if (typeof document === 'undefined') return;
    if (this.container) {
      this.container.classList.toggle('roaming-outside', Boolean(this.isFloatingOutside));
    }
    const btnFloat = document.getElementById('btn-mascot-float');
    if (btnFloat) {
      btnFloat.textContent = this.isFloatingOutside ? '📥' : '🚀';
      btnFloat.title = this.isFloatingOutside ? 'Dock back inside Raiden window' : 'Detach / Float on Desktop';
    }
  }

  startDockSyncLoop() {
    if (typeof window === 'undefined' || typeof setInterval === 'undefined') return;
    setInterval(async () => {
      try {
        const res = await fetch('http://127.0.0.1:8765/api/companion/dock_state');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.is_floating === 'boolean' && data.is_floating !== this.isFloatingOutside) {
            this.isFloatingOutside = data.is_floating;
            this.updateDockingUI();
          }
          if (data.active_companion && data.active_companion !== this.activeCompanionId) {
            this.switchCompanion(data.active_companion, false);
          }
        }
      } catch (e) {}
    }, 2500);
  }

  openCompanionModal() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('companion-picker-modal');
    if (modal) {
      modal.classList.add('active');
      this.renderCompanionCards();
      this.playCyberTone('chime');
    }
  }

  closeCompanionModal() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('companion-picker-modal');
    if (modal) {
      modal.classList.remove('active');
      this.playCyberTone('blip');
    }
  }

  renderCompanionCards() {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('companion-card-grid');
    if (!container || !this.registry) return;

    const packs = this.registry.getAll();
    const activeId = this.activeCompanionId || 'void';

    container.innerHTML = '';

    for (const pack of packs) {
      const m = pack.manifest;
      if (m.id === 'test_pack') continue; // Hide internal test pack from main UI

      const isActive = m.id === activeId;
      const card = document.createElement('div');
      card.className = `companion-card ${isActive ? 'active' : ''}`;
      card.style.setProperty('--card-accent', m.palette.accent);
      card.style.cursor = 'pointer';

      card.onclick = () => {
        this.switchCompanion(m.id, true);
        this.playCyberTone('chime');
        setTimeout(() => {
          this.closeCompanionModal();
        }, 220);
      };

      card.innerHTML = `
        <div class="c-card-badge" style="color: ${m.palette.accent}; border-color: ${m.palette.accent}">${m.species || 'Companion'}</div>
        <div class="c-card-avatar" style="box-shadow: 0 0 20px -5px ${m.palette.glow}">
          <canvas id="preview-canvas-${m.id}" width="80" height="80"></canvas>
        </div>
        <div class="c-card-name" style="color: ${m.palette.accent}">${m.name}</div>
        <div class="c-card-desc">${m.tagline || ''}</div>
        <div class="c-card-stats">
          <span>Chattiness: ${Math.round((m.personality.chattiness || 0.5) * 100)}%</span>
          <span>Mischief: ${Math.round((m.personality.mischief || 0.5) * 100)}%</span>
        </div>
        <button class="c-card-btn ${isActive ? 'current' : ''}" type="button">
          ${isActive ? '✓ Active Companion' : 'Select Companion'}
        </button>
      `;

      container.appendChild(card);

      // Render miniature preview on canvas
      setTimeout(() => {
        const pCanvas = document.getElementById(`preview-canvas-${m.id}`);
        if (pCanvas) {
          const pCtx = pCanvas.getContext('2d');
          if (pCtx) {
            pCtx.imageSmoothingEnabled = false;
            pCtx.clearRect(0, 0, 80, 80);
            const spriteImg = new Image();
            spriteImg.src = `companions/${m.id}/sprites/idle.png`;
            spriteImg.onload = () => {
              pCtx.clearRect(0, 0, 80, 80);
              pCtx.drawImage(spriteImg, 8, 8, 64, 64);
            };
            spriteImg.onerror = () => {
              if (this.animPlayer && this.animPlayer.drawCompanionSilhouette) {
                pCtx.save();
                pCtx.translate(40, 48);
                this.animPlayer.drawCompanionSilhouette.call({ ctx: pCtx, phase: 1.2, bounceY: 0, tiltAngle: 0, currentState: 'idle' }, m.id, m.palette);
                pCtx.restore();
              }
            };
          }
        }
      }, 50);
    }
  }

  updateSwitcherUI() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('companion-picker-modal');
    if (modal && modal.classList.contains('active')) {
      this.renderCompanionCards();
    }
  }

  applyTheme(themeId) {
    if (this.themes) {
      return this.themes.applyTheme(themeId);
    }
  }

  toggleCompact() {
    this.isMinimized = !this.isMinimized;
    localStorage.setItem('raiden_mascot_compact', this.isMinimized ? 'true' : 'false');
    if (this.container) {
      this.container.classList.toggle('minimized', this.isMinimized);
    }
    this.applySettingsUI();
    return this.isMinimized;
  }

  toggleMinimize() {
    this.toggleCompact();
  }

  toggleMenu(forceOpen = null) {
    const menu = document.getElementById('mascot-popover-menu');
    if (!menu) return;
    const isOpen = forceOpen !== null ? forceOpen : !menu.classList.contains('active');
    menu.classList.toggle('active', isOpen);
    this.playCyberTone('blip');
  }

  applySettingsUI() {
    // Toolbar buttons
    const btnSound = document.getElementById('btn-mascot-sound');
    if (btnSound) btnSound.textContent = this.soundEnabled ? '🔊' : '🔇';

    // Popover menu buttons
    const btnToggleMotion = document.getElementById('btn-toggle-motion');
    if (btnToggleMotion) {
      btnToggleMotion.textContent = this.animationEnabled ? 'ON' : 'OFF';
      btnToggleMotion.classList.toggle('active', this.animationEnabled);
    }

    const btnToggleDialogue = document.getElementById('btn-toggle-dialogue');
    if (btnToggleDialogue) {
      btnToggleDialogue.textContent = this.dialogueEnabled ? 'ON' : 'OFF';
      btnToggleDialogue.classList.toggle('active', this.dialogueEnabled);
    }

    const btnToggleSoundMenu = document.getElementById('btn-toggle-sound-menu');
    if (btnToggleSoundMenu) {
      btnToggleSoundMenu.textContent = this.soundEnabled ? 'ON' : 'OFF';
      btnToggleSoundMenu.classList.toggle('active', this.soundEnabled);
    }

    const btnToggleCompactMenu = document.getElementById('btn-toggle-compact-menu');
    if (btnToggleCompactMenu) {
      btnToggleCompactMenu.textContent = this.isMinimized ? 'ON' : 'OFF';
      btnToggleCompactMenu.classList.toggle('active', this.isMinimized);
    }

    // Main Settings page checkboxes
    const chkMotion = document.getElementById('setting-mascot-motion-toggle');
    if (chkMotion) chkMotion.checked = this.animationEnabled;

    const chkDialogue = document.getElementById('setting-mascot-dialogue-toggle');
    if (chkDialogue) chkDialogue.checked = this.dialogueEnabled;

    const chkSound = document.getElementById('setting-mascot-sound-toggle');
    if (chkSound) chkSound.checked = this.soundEnabled;

    const chkCompact = document.getElementById('setting-mascot-compact-toggle');
    if (chkCompact) chkCompact.checked = this.isMinimized;

    // Root container
    if (this.container) {
      this.container.classList.toggle('minimized', this.isMinimized);
    }

    document.body.classList.toggle('mascot-reduced-motion', !this.animationEnabled);
  }

  showReactionsCheatSheet() {
    this.toggleMenu(false);
    this.triggerDialogue("Ninja avatar ready: Idle, Soch, Baatcheet, Khushi, Swag, Error, Victory!");
  }

  hideDialogue() {
    if (this.bubble) {
      this.bubble.classList.remove('visible');
    }
  }

  /* =========================================================================
     TYPEWRITER SPEECH ENGINE (Crisp 28ms Rollout)
     ========================================================================= */
  triggerDialogue(text, callback) {
    if (!this.dialogueEnabled) return;
    const textEl = document.getElementById('mascot-bubble-text') || this.bubble;
    if (!textEl) return;

    if (this.bubble) {
      this.bubble.classList.add('visible');
    }

    if (this.typewriterTimer) clearTimeout(this.typewriterTimer);
    if (this.dialogueHideTimer) clearTimeout(this.dialogueHideTimer);

    textEl.textContent = '';
    this.currentDialogueText = text;
    let charIndex = 0;

    const typeNext = () => {
      if (charIndex < text.length) {
        textEl.textContent += text.charAt(charIndex);
        if (charIndex % 3 === 0) {
          this.playCyberTone('type');
        }
        charIndex++;
        this.typewriterTimer = setTimeout(typeNext, this.typewriterSpeed);
      } else {
        if (callback) callback();
        // Auto-dismiss dialogue after reading duration
        const duration = Math.max(3800, text.length * 90);
        this.dialogueHideTimer = setTimeout(() => {
          if (this.bubble && this.currentState !== 'THINKING' && this.currentState !== 'SPEAKING') {
            this.bubble.classList.remove('visible');
          }
        }, duration);
      }
    };

    typeNext();
  }

  /* =========================================================================
     EVENT LISTENERS & BINDINGS
     ========================================================================= */
  bindEvents() {
    if (!this.canvas) return;

    // Single Click: Wake up or banter
    this.canvas.addEventListener('click', (e) => {
      e.stopPropagation();
      if (Math.abs(this.velocityX) > 2 || Math.abs(this.velocityY) > 2) return;
      if (this.isMinimized) {
        this.toggleCompact();
        return;
      }
      if (this.isSleeping) {
        this.wakeUp();
      } else {
        this.cycleNextDialogue();
      }
    });

    // Double Click: Stretching cat synapse recalibration
    this.canvas.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.setState('STRETCH', 2600, this.PRIORITY.INTERACTION);
      this.triggerDialogue("Angdaai lene do bhai... syntax aur muscles dono khul rahe hain!");
      this.playCyberTone('blip');
    });

    // Hover glance & ear twitch
    this.canvas.addEventListener('mouseenter', () => {
      if (this.currentState === 'IDLE' && !this.isSleeping) {
        this.earTwitchRight = 0.22;
        this.glanceY = -0.4;
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (this.currentState === 'IDLE' && !this.isSleeping) {
        this.glanceY = 0;
        this.glanceX = 0;
      }
    });

    // Mouse grab physics & free movement across viewport
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || this.isMinimized) return;
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.dragDeltaX = 0;
      this.dragDeltaY = 0;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.velocityX = 0;
      this.velocityY = 0;
      this.dragStretchFactor = 1.18;

      if (this.canvasId === 'raidenCanvas') {
        this.canvas.style.transition = 'none';
        this.canvas.style.cursor = 'grabbing';
      }

      this.setState('DRAGGED', 0, this.PRIORITY.INTERACTION);
      this.playCyberTone('blip');
      this.triggerDialogue(this.getNextDialogue('drag'));
    });

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('mousemove', (e) => {
        if (!this.isDragging) return;
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;
        this.dragDeltaX = e.clientX - this.dragStartX;
        this.dragDeltaY = e.clientY - this.dragStartY;

        this.velocityX = deltaX;
        this.velocityY = deltaY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        const speed = Math.hypot(this.velocityX, this.velocityY);
        this.dragStretchFactor = Math.min(1.35, 1.05 + speed * 0.02);

        if (this.canvasId === 'raidenCanvas' && !this.isFloatingOutside) {
          // Free Move: visually translate canvas across whole app window
          this.canvas.style.transform = `translate3d(${this.dragDeltaX}px, ${this.dragDeltaY}px, 0) scale(${this.dragStretchFactor})`;
          this.canvas.style.zIndex = '9999';

          // Detect proximity to app window boundaries (ready to pop out to desktop)
          const edgeMargin = 45;
          const isNearEdge = (
            e.clientX <= edgeMargin ||
            e.clientX >= window.innerWidth - edgeMargin ||
            e.clientY <= edgeMargin ||
            e.clientY >= window.innerHeight - edgeMargin
          );

          if (isNearEdge) {
            this.canvas.style.filter = 'drop-shadow(0 0 16px #00f0ff) drop-shadow(0 0 26px #ff007f)';
            if (this.currentState !== 'ALERT') {
              this.setState('ALERT', 1500, this.PRIORITY.INTERACTION);
            }
          } else {
            this.canvas.style.filter = '';
          }
        }

        if (speed > 16 && this.currentState !== 'ALERT') {
          this.setState('ALERT', 1200, this.PRIORITY.INTERACTION);
        }
      });

      window.addEventListener('mouseup', (e) => {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.dragStretchFactor = 1.0;

        if (this.canvasId === 'raidenCanvas' && !this.isFloatingOutside) {
          this.canvas.style.filter = '';
          this.canvas.style.cursor = 'grab';

          const edgeMargin = 60;
          const isNearEdge = (
            e.clientX <= edgeMargin ||
            e.clientX >= window.innerWidth - edgeMargin ||
            e.clientY <= edgeMargin ||
            e.clientY >= window.innerHeight - edgeMargin ||
            Math.hypot(this.dragDeltaX, this.dragDeltaY) > 280
          );

          if (isNearEdge) {
            // Dragged to edge / outside app window! Pop out directly to desktop!
            this.canvas.style.transition = 'opacity 0.25s, transform 0.25s';
            this.canvas.style.transform = `translate3d(${this.dragDeltaX}px, ${this.dragDeltaY}px, 0) scale(0.5)`;
            setTimeout(() => {
              this.canvas.style.transition = '';
              this.canvas.style.transform = '';
              this.canvas.style.zIndex = '';
            }, 260);
            this.popOutToDesktop({ screenX: e.screenX, screenY: e.screenY });
            return;
          } else {
            // Settle back to dock with bouncy spring physics
            this.canvas.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
            this.canvas.style.transform = 'translate3d(0, 0, 0)';
            this.playCyberTone('bounce');
            setTimeout(() => {
              this.canvas.style.transition = '';
              this.canvas.style.zIndex = '';
              this.revertToIdle();
            }, 450);
          }
        }

        const speed = Math.hypot(this.velocityX, this.velocityY);
        if (speed > 10) {
          this.triggerDialogue("Oye bindaas feka yaar! Cat hamesha chaar pairo pe land karti hai!");
          this.playCyberTone('alert');
        }

        if (this.currentState === 'DRAGGED') {
          setTimeout(() => {
            if (this.currentState === 'DRAGGED') this.revertToIdle();
          }, 300);
        }
      });

      // Mouse leaves the app window during dragging -> pop out to desktop!
      document.addEventListener('mouseleave', (e) => {
        if (!this.isDragging || this.canvasId !== 'raidenCanvas' || this.isFloatingOutside) return;
        this.isDragging = false;
        this.canvas.style.filter = '';
        this.canvas.style.cursor = 'grab';
        this.canvas.style.transition = 'opacity 0.25s, transform 0.25s';
        this.canvas.style.transform = 'scale(0.5)';
        setTimeout(() => {
          this.canvas.style.transition = '';
          this.canvas.style.transform = '';
          this.canvas.style.zIndex = '';
        }, 260);
        this.popOutToDesktop({ screenX: e.screenX, screenY: e.screenY });
      });
    }

    // Connect toolbar switch button to direct cycling & double-click roster
    const btnSwitch = document.getElementById('btn-mascot-switch');
    if (btnSwitch) {
      btnSwitch.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.cycleCompanion();
      };
      btnSwitch.ondblclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openCompanionModal();
      };
    }

    // Connect toolbar float button to toggleDesktopFloat
    const btnFloat = document.getElementById('btn-mascot-float');
    if (btnFloat) {
      btnFloat.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleDesktopFloat();
      };
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('mascot-popover-menu');
      const btnMenu = document.getElementById('btn-mascot-menu');
      if (menu && menu.classList.contains('active')) {
        if (!menu.contains(e.target) && e.target !== btnMenu) {
          menu.classList.remove('active');
        }
      }
    });

    // Keyboard support for canvas focus
    this.canvas.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.pet();
      } else if (e.key === 'Escape') {
        this.hideDialogue();
        this.toggleMenu(false);
      }
    });

    // Main Settings page checkboxes sync
    const chkMotion = document.getElementById('setting-mascot-motion-toggle');
    if (chkMotion) {
      chkMotion.addEventListener('change', () => {
        this.animationEnabled = chkMotion.checked;
        localStorage.setItem('raiden_mascot_animation', this.animationEnabled ? 'true' : 'false');
        this.applySettingsUI();
      });
    }

    const chkDialogue = document.getElementById('setting-mascot-dialogue-toggle');
    if (chkDialogue) {
      chkDialogue.addEventListener('change', () => {
        this.dialogueEnabled = chkDialogue.checked;
        localStorage.setItem('raiden_mascot_dialogue', this.dialogueEnabled ? 'true' : 'false');
        this.applySettingsUI();
      });
    }

    const chkSound = document.getElementById('setting-mascot-sound-toggle');
    if (chkSound) {
      chkSound.addEventListener('change', () => {
        this.soundEnabled = chkSound.checked;
        localStorage.setItem('raiden_mascot_sound', this.soundEnabled ? 'true' : 'false');
        this.applySettingsUI();
      });
    }

    const chkCompact = document.getElementById('setting-mascot-compact-toggle');
    if (chkCompact) {
      chkCompact.addEventListener('change', () => {
        this.isMinimized = chkCompact.checked;
        localStorage.setItem('raiden_mascot_compact', this.isMinimized ? 'true' : 'false');
        this.applySettingsUI();
      });
    }
  }

  /* =========================================================================
     PARTICLES SYSTEM (Cyan sparkles, hearts, lightning, glitch, zZz)
     ========================================================================= */
  spawnParticles(type, count = 8) {
    if (!this.animationEnabled || this.reducedMotion) return;
    for (let i = 0; i < count; i++) {
      const p = {
        type,
        x: this.width / 2 + (Math.random() - 0.5) * 40,
        y: this.height / 2 + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -0.8 - Math.random() * 2.2,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        size: 2 + Math.random() * 4,
        glyph: type === 'music_notes' ? (Math.random() > 0.5 ? '♪' : '♫') : '',
        color: type === 'heart' ? '#F43F5E' : (type === 'lightning' ? '#FDE047' : (type === 'music_notes' ? '#00F0FF' : (type === 'typing_sparks' ? '#00FF88' : this.getCompanionAccentColor())))
      };
      this.particles.push(p);
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  renderParticles(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);

      if (p.type === 'heart') {
        ctx.fillStyle = p.color;
        ctx.font = `${Math.floor(p.size * 2)}px monospace`;
        ctx.fillText('♥', p.x, p.y);
      } else if (p.type === 'lightning') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + (Math.random() - 0.5) * 6, p.y + (Math.random() - 0.5) * 6);
        ctx.stroke();
      } else if (p.type === 'zZz') {
        ctx.fillStyle = '#38BDF8';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillText('z', p.x, p.y);
      } else if (p.type === 'music_notes') {
        ctx.fillStyle = '#00F0FF';
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 6;
        ctx.font = `${Math.floor(p.size * 2 + 6)}px monospace`;
        ctx.fillText(p.glyph || '♪', p.x, p.y);
      } else if (p.type === 'typing_sparks') {
        ctx.fillStyle = '#00FF88';
        ctx.shadowColor = '#00FF88';
        ctx.shadowBlur = 4;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      } else {
        // Cyan sparkling pixel
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      ctx.restore();
    }
  }

  /* =========================================================================
     PHYSICS & KINEMATICS UPDATE LOOP
     ========================================================================= */
  applyPhysics() {
    if (!this.isDragging) {
      if (isNaN(this.posX)) this.posX = 0;
      if (isNaN(this.posY)) this.posY = 0;
      if (isNaN(this.velocityX)) this.velocityX = 0;
      if (isNaN(this.velocityY)) this.velocityY = 0;

      this.velocityY += this.gravity;
      this.velocityY *= this.friction;
      this.velocityX *= this.friction;

      this.posX += this.velocityX;
      this.posY += this.velocityY;

      if (this.posY >= 0) {
        this.posY = 0;
        if (this.velocityY > 2.0) {
          this.playCyberTone('bounce');
        }
        this.velocityY *= this.bounceFactor;
      }
      this.posX *= 0.85;
    }
  }

  update() {
    if (!this.animationEnabled) return;

    this.applyPhysics();
    this.updateParticles();

    const now = Date.now();

    // Natural eye blink timer
    if (now > this.nextBlinkTime) {
      this.blinkPhase = 1.0;
      this.nextBlinkTime = now + 2400 + Math.random() * 3000;
    } else if (this.blinkPhase > 0) {
      this.blinkPhase = Math.max(0, this.blinkPhase - 0.15);
    }

    // Ear twitches
    if (now > this.nextEarTwitchTime) {
      if (Math.random() > 0.5) this.earTwitchLeft = 0.35;
      else this.earTwitchRight = 0.35;
      this.nextEarTwitchTime = now + 4000 + Math.random() * 6000;
    } else {
      this.earTwitchLeft = Math.max(0, this.earTwitchLeft - 0.03);
      this.earTwitchRight = Math.max(0, this.earTwitchRight - 0.03);
    }

    // Tail oscillation phase
    let tailSpeed = 0.04;
    if (['HAPPY', 'VICTORY'].includes(this.currentState)) tailSpeed = 0.09;
    else if (['ALERT', 'STARTLED'].includes(this.currentState)) tailSpeed = 0.12;
    else if (this.currentState === 'SLEEPY') tailSpeed = 0.015;
    this.tailPhase += tailSpeed;

    // Decay streaming pulse
    if (this.streamingPulse > 0) {
      this.streamingPulse = Math.max(0, this.streamingPulse - 0.05);
      if (now - this.lastStreamChunkTime > 900 && this.currentState === 'SPEAKING') {
        this.revertToIdle();
      }
    }

    // Sleepy zZz particle generator
    if (this.currentState === 'SLEEPY' && Math.random() < 0.04) {
      this.particles.push({
        type: 'zZz',
        x: this.width / 2 + 10 + Math.random() * 8,
        y: this.height / 2 - 12,
        vx: 0.3 + Math.random() * 0.4,
        vy: -0.6 - Math.random() * 0.4,
        life: 1.0,
        decay: 0.015,
        size: 3,
        color: '#38BDF8'
      });
    }
  }

  /* =========================================================================
     RENDERING PIPELINE — PROCEDURAL CYBER-CAT WITH WEAPONS, EARS, TAIL & HUD
     ========================================================================= */
  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const now = Date.now();

    // Breathing vertical offset
    let breatheOffset = 0;
    if (this.animationEnabled && !this.reducedMotion) {
      const breatheSpeed = this.currentState === 'SLEEPY' ? 0.0018 : 0.0035;
      const breatheAmp = this.currentState === 'SLEEPY' ? 0.6 : 1.2;
      breatheOffset = Math.sin(now * breatheSpeed) * breatheAmp;
    }

    this.ctx.save();
    this.ctx.translate(this.posX, this.posY + breatheOffset);

    // Velocity stretch scaling
    if (this.currentState === 'DRAGGED' || this.currentState === 'STRETCH') {
      const stretch = this.dragStretchFactor || 1.18;
      this.ctx.translate(this.width / 2, this.height / 2);
      this.ctx.scale(1 / Math.sqrt(stretch), stretch);
      this.ctx.translate(-this.width / 2, -this.height / 2);
    }

    // Determine active sprite pose
    let activeImage = this.poseImages.hero;
    if (this.currentState === 'THINKING' && this.poseImages.thinking) {
      activeImage = this.poseImages.thinking;
    } else if (['SPEAKING', 'TALKING'].includes(this.currentState) && (this.poseImages.talking || this.poseImages.crouch)) {
      activeImage = this.poseImages.talking || this.poseImages.crouch;
    } else if (['ALERT', 'STARTLED', 'PLAYFULLY_ANNOYED', 'ERROR'].includes(this.currentState) && this.poseImages.crouch) {
      activeImage = this.poseImages.crouch;
    } else if (['STRETCH', 'DRAGGED', 'VICTORY', 'PROUD'].includes(this.currentState) && (this.poseImages.stretch || this.poseImages.crouch)) {
      activeImage = this.poseImages.stretch || this.poseImages.crouch;
    } else if (['SLEEPY', 'SITTING'].includes(this.currentState) && (this.poseImages.sleeping || this.poseImages.sit)) {
      activeImage = this.poseImages.sleeping || this.poseImages.sit;
    }

    // Size calculation
    const targetSize = Math.min(this.canvas.width, this.canvas.height) - 10;
    const targetX = (this.canvas.width - targetSize) / 2;
    const targetY = (this.canvas.height - targetSize) / 2;

    // Ensure crisp pixel art scaling (no blurring)
    this.ctx.imageSmoothingEnabled = false;

    // Draw Base Sprite Pose
    if (activeImage && activeImage.complete && activeImage.naturalWidth > 0) {
      const aspect = activeImage.naturalWidth / activeImage.naturalHeight;
      let drawW = targetSize;
      let drawH = targetSize / aspect;
      if (drawH > targetSize) {
        drawH = targetSize;
        drawW = targetSize * aspect;
      }
      const dx = (this.canvas.width - drawW) / 2;
      const dy = (this.canvas.height - drawH) / 2;

      // ERROR STATE: Chromatic aberration glitch pass
      if (this.currentState === 'ERROR') {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.drawImage(activeImage, dx - 2, dy, drawW, drawH);
        this.ctx.drawImage(activeImage, dx + 2, dy, drawW, drawH);
        this.ctx.restore();
      } else {
        this.ctx.drawImage(activeImage, dx, dy, drawW, drawH);
      }
    } else if (this.spriteLoaded) {
      // Fallback clean spritesheet
      this.ctx.drawImage(
        this.spriteSheet,
        0, 0, 256, 256,
        targetX, targetY, targetSize, targetSize
      );
    } else {
      // Procedural fallback matching active character
      if (this.animPlayer && typeof this.animPlayer.drawCompanionSilhouette === 'function') {
        this.ctx.save();
        this.ctx.translate(this.width / 2, this.height / 2 + 10);
        this.animPlayer.ctx = this.ctx;
        this.animPlayer.phase = this.tailPhase || 1.2;
        this.animPlayer.currentState = (this.currentState || 'idle').toLowerCase();
        this.animPlayer.drawCompanionSilhouette(this.activeCompanionId || 'void', { accent: this.getCompanionAccentColor() });
        this.ctx.restore();
      } else {
        this.renderPlasmaTail(this.ctx);
        this.renderEarTwitches(this.ctx);
        this.renderCyberEyes(this.ctx);
      }
    }

    // Companion-specific live micro-animations
    if (this.activeCompanionId === 'void') {
      this.renderPlasmaTail(this.ctx);
      this.renderEarTwitches(this.ctx);
    } else if (this.activeCompanionId === 'pixel') {
      this.renderPixelPuppyTail(this.ctx);
    } else if (this.activeCompanionId === 'nova') {
      this.renderNovaTwinTails(this.ctx);
    } else if (this.activeCompanionId === 'cipher') {
      this.renderCipherTerminals(this.ctx);
    }

    // State Specific Overlays
    if (this.currentState === 'THINKING') {
      this.renderThinkingHUD(this.ctx);
    } else if (this.currentState === 'SPEAKING') {
      this.renderSpeakingWaveform(this.ctx);
    } else if (this.currentState === 'ALERT' || this.currentState === 'STARTLED') {
      this.renderAlertCrossFlare(this.ctx);
    } else if (this.currentState === 'CONFUSED') {
      this.renderConfusedGlyph(this.ctx);
    } else if (this.currentState === 'PROUD') {
      this.renderKatanaLightning(this.ctx);
    } else if (this.currentState === 'DANCING' || this.currentState === 'MUSIC_DANCE') {
      this.renderDancingHeadphones(this.ctx);
    } else if (this.currentState === 'TYPING') {
      this.renderTypingPawHUD(this.ctx);
    }

    // Render active particles
    this.renderParticles(this.ctx);

    this.ctx.restore();
  }

  /* =========================================================================
     MICRO-ANIMATION: DYNAMIC CYBER-NINJA PLASMA TAIL
     Sinusoidal wave gradient segment with glowing electric-cyan tip
     ========================================================================= */
  renderPlasmaTail(ctx) {
    if (!this.animationEnabled) return;

    ctx.save();
    const startX = this.width / 2 + 18;
    const startY = this.height - 30;

    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const grad = ctx.createLinearGradient(startX, startY, startX + 30, startY - 40);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(0.5, '#0284C7');
    grad.addColorStop(1, '#00F0FF');
    ctx.strokeStyle = grad;

    ctx.beginPath();
    ctx.moveTo(startX, startY);

    const waveAmp = this.currentState === 'SLEEPY' ? 4 : 10;
    const cp1x = startX + 14 + Math.sin(this.tailPhase) * waveAmp;
    const cp1y = startY - 14;
    const cp2x = startX + 24 + Math.cos(this.tailPhase * 1.2) * (waveAmp * 1.2);
    const cp2y = startY - 32;
    const endX = startX + 20 + Math.sin(this.tailPhase * 1.4) * (waveAmp * 1.4);
    const endY = startY - 44;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    ctx.stroke();

    // Glowing electric plasma tip
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#E0F2FE';
    ctx.beginPath();
    ctx.arc(endX, endY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /* =========================================================================
     MICRO-ANIMATIONS: PIXEL PUPPY WAG & NOSE
     ========================================================================= */
  renderPixelPuppyTail(ctx) {
    if (!this.animationEnabled) return;
    ctx.save();
    const startX = this.width / 2 + 18;
    const startY = this.height - 35;
    const wagSpeed = ['SPEAKING', 'TALKING', 'PROUD', 'VICTORY'].includes(this.currentState) ? 0.025 : 0.012;
    const wag = Math.sin(Date.now() * wagSpeed) * 8;
    ctx.fillStyle = '#ffb703';
    ctx.shadowColor = '#ffb703';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.rect(startX, startY + wag, 14, 5);
    ctx.fill();
    ctx.restore();
  }

  /* =========================================================================
     MICRO-ANIMATIONS: NOVA STARLIGHT TWINKLE
     ========================================================================= */
  renderNovaTwinTails(ctx) {
    if (!this.animationEnabled || this.reducedMotion) return;
    if (Math.random() < 0.05) {
      this.spawnParticles('sparkle', 1);
    }
  }

  /* =========================================================================
     MICRO-ANIMATIONS: CIPHER TERMINAL SCANNER
     ========================================================================= */
  renderCipherTerminals(ctx) {
    if (!this.animationEnabled) return;
    if (['THINKING', 'SPEAKING'].includes(this.currentState)) {
      ctx.save();
      ctx.strokeStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1;
      const t = (Date.now() * 0.002) % 1;
      ctx.strokeRect(6, 44, 20, 24);
      ctx.strokeRect(this.width - 26, 44, 20, 24);
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(8, 48 + t * 14, 16, 1.5);
      ctx.fillRect(this.width - 24, 48 + (1 - t) * 14, 16, 1.5);
      ctx.restore();
    }
  }

  /* =========================================================================
     MICRO-ANIMATION: CYBER-EARS TWITCH
     ========================================================================= */
  renderEarTwitches(ctx) {
    if (this.earTwitchLeft <= 0.01 && this.earTwitchRight <= 0.01) return;

    ctx.save();
    const headX = this.width / 2;
    const headY = this.height / 2 - 32;

    // Left Ear perk
    if (this.earTwitchLeft > 0.01) {
      ctx.translate(headX - 18, headY);
      ctx.rotate(-this.earTwitchLeft);
      ctx.fillStyle = '#00F0FF';
      ctx.fillRect(-2, -4, 4, 3);
      ctx.rotate(this.earTwitchLeft);
      ctx.translate(-(headX - 18), -headY);
    }

    // Right Ear perk
    if (this.earTwitchRight > 0.01) {
      ctx.translate(headX + 18, headY);
      ctx.rotate(this.earTwitchRight);
      ctx.fillStyle = '#00F0FF';
      ctx.fillRect(-2, -4, 4, 3);
      ctx.rotate(-this.earTwitchRight);
      ctx.translate(-(headX + 18), -headY);
    }

    ctx.restore();
  }

  /* =========================================================================
     MICRO-ANIMATION: CYBER-EYES & VISOR GLANCE
     Eyes track typing focus, blink, and adapt to expression moods
     ========================================================================= */
  renderCyberEyes(ctx) {
    ctx.save();
    const eyeBaseX = this.width / 2 - 12;
    const eyeBaseY = this.height / 2 - 16;
    const eyeSpacing = 16;

    const offsetX = this.glanceX * 3.5;
    const offsetY = this.glanceY * 2.5;

    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#00F0FF';

    // Blinking eye height
    const eyeHeight = Math.max(0.5, 3.5 * (1 - this.blinkPhase));

    if (this.currentExpression === 'happy' || this.currentState === 'HAPPY') {
      // Crescent happy eyes
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(eyeBaseX + offsetX, eyeBaseY + offsetY, 3.5, Math.PI, 0, false);
      ctx.arc(eyeBaseX + eyeSpacing + offsetX, eyeBaseY + offsetY, 3.5, Math.PI, 0, false);
      ctx.stroke();
    } else if (this.currentExpression === 'annoyed' || this.currentState === 'PLAYFULLY_ANNOYED') {
      // Slanted sharp glare
      ctx.fillRect(eyeBaseX + offsetX, eyeBaseY + offsetY, 5, 2);
      ctx.fillRect(eyeBaseX + eyeSpacing + offsetX, eyeBaseY + offsetY, 5, 2);
    } else {
      // Normal glowing cyber-slits
      ctx.fillRect(eyeBaseX + offsetX, eyeBaseY + offsetY - eyeHeight / 2, 4, eyeHeight);
      ctx.fillRect(eyeBaseX + eyeSpacing + offsetX, eyeBaseY + offsetY - eyeHeight / 2, 4, eyeHeight);

      // Pupil cyan core
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(eyeBaseX + offsetX + 1, eyeBaseY + offsetY - eyeHeight / 4, 2, eyeHeight / 2);
      ctx.fillRect(eyeBaseX + eyeSpacing + offsetX + 1, eyeBaseY + offsetY - eyeHeight / 4, 2, eyeHeight / 2);
    }

    ctx.restore();
  }

  /* =========================================================================
     OVERLAY: THINKING STATE — Glowing Neon Holographic Terminal Window
     ========================================================================= */
  renderThinkingHUD(ctx) {
    const now = Date.now();
    const pulse = 0.8 + 0.2 * Math.sin(now * 0.008);

    ctx.save();
    const termX = 6;
    const termY = 12;
    const termW = 58;
    const termH = 42;

    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 8 * pulse;

    // Glass panel
    ctx.fillStyle = `rgba(0, 240, 255, ${0.12 * pulse})`;
    ctx.fillRect(termX, termY, termW, termH);

    // Cyan border
    ctx.strokeStyle = `rgba(0, 240, 255, ${0.85 * pulse})`;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(termX, termY, termW, termH);

    // Terminal header
    ctx.fillStyle = `rgba(0, 240, 255, ${0.35 * pulse})`;
    ctx.fillRect(termX, termY, termW, 8);
    ctx.fillStyle = '#00F0FF';
    ctx.font = '6px "JetBrains Mono", monospace';
    ctx.fillText('NEURAL_ROUTER', termX + 3, termY + 6);

    // Scanline
    const scanY = termY + 8 + ((now * 0.035) % (termH - 10));
    ctx.strokeStyle = `rgba(0, 240, 255, ${0.7 * pulse})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(termX, scanY);
    ctx.lineTo(termX + termW, scanY);
    ctx.stroke();

    // Stream lines
    ctx.fillStyle = '#38BDF8';
    ctx.font = '5.5px "JetBrains Mono", monospace';
    ctx.fillText('> PARSING...', termX + 3, termY + 16);
    ctx.fillText('> VEC: 0.998', termX + 3, termY + 24);
    ctx.fillText('> THINKING', termX + 3, termY + 32);

    // Holographic beam
    ctx.strokeStyle = `rgba(0, 240, 255, ${0.35 * pulse})`;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(termX + termW, termY + termH / 2);
    ctx.lineTo(this.width / 2 - 4, this.height / 2 - 12);
    ctx.stroke();

    ctx.restore();
  }

  /* =========================================================================
     OVERLAY: SPEAKING / GENERATING — Cyber Waveform Audio Rings
     ========================================================================= */
  renderSpeakingWaveform(ctx) {
    const now = Date.now();
    ctx.save();
    const mouthX = this.width / 2 - 4;
    const mouthY = this.height / 2 - 8;

    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
      const radius = 6 + ((now * 0.04 + i * 8) % 18);
      const alpha = Math.max(0, 1 - radius / 18) * 0.6;
      ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(mouthX, mouthY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  /* =========================================================================
     OVERLAY: ALERT / STARTLED — Cross-Shaped Neon Eye Flare
     ========================================================================= */
  renderAlertCrossFlare(ctx) {
    const now = Date.now();
    const flash = 0.75 + 0.25 * Math.sin(now * 0.025);
    const eyeX = this.width / 2 - 8;
    const eyeY = this.height / 2 - 16;

    ctx.save();
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 12 * flash;

    // Cross flare horizontal
    ctx.fillStyle = `rgba(0, 240, 255, ${0.9 * flash})`;
    ctx.beginPath();
    ctx.moveTo(eyeX - 18, eyeY);
    ctx.lineTo(eyeX, eyeY - 2);
    ctx.lineTo(eyeX + 18, eyeY);
    ctx.lineTo(eyeX, eyeY + 2);
    ctx.closePath();
    ctx.fill();

    // Cross flare vertical
    ctx.beginPath();
    ctx.moveTo(eyeX, eyeY - 18);
    ctx.lineTo(eyeX + 2, eyeY);
    ctx.lineTo(eyeX, eyeY + 18);
    ctx.lineTo(eyeX - 2, eyeY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /* =========================================================================
     OVERLAY: CONFUSED STATE — Flickering Holographic Question Mark
     ========================================================================= */
  renderConfusedGlyph(ctx) {
    const now = Date.now();
    const flick = 0.7 + 0.3 * Math.sin(now * 0.012);
    ctx.save();
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 8;
    ctx.fillStyle = `rgba(0, 240, 255, ${flick})`;
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillText('?', this.width / 2 + 14, this.height / 2 - 32);
    ctx.restore();
  }

  /* =========================================================================
     OVERLAY: PROUD STATE — Katana Lightning Sparks
     ========================================================================= */
  renderKatanaLightning(ctx) {
    const now = Date.now();
    ctx.save();
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#FDE047';
    ctx.shadowBlur = 6;

    const kx = this.width / 2 - 24;
    const ky = this.height / 2;

    ctx.beginPath();
    ctx.moveTo(kx, ky);
    ctx.lineTo(kx + (Math.sin(now * 0.02) * 4), ky - 14);
    ctx.lineTo(kx + (Math.cos(now * 0.02) * 5), ky - 26);
    ctx.stroke();

    ctx.restore();
  }

  /* =========================================================================
     OVERLAY: DANCING STATE — Glowing Cyber-Headphones with LED Equalizer
     ========================================================================= */
  renderDancingHeadphones(ctx) {
    if (!this.animationEnabled) return;
    const now = Date.now();
    ctx.save();

    const headX = this.width / 2;
    const headY = this.height / 2 - 22;
    const bounce = Math.sin(now * 0.0125) * 2; // 120-BPM bounce

    const accent = this.getCompanionAccentColor() || '#00F0FF';

    // 1. Headband arc with cyberpunk glow
    ctx.strokeStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(headX, headY - 10 + bounce, 24, Math.PI * 1.1, Math.PI * 1.9, false);
    ctx.stroke();

    // 2. Ear Cups with animated LED equalizer bars
    const earPositions = [
      { x: headX - 25, side: -1 },
      { x: headX + 25, side: 1 }
    ];

    for (const ear of earPositions) {
      const cx = ear.x;
      const cy = headY - 4 + bounce;

      // Outer cup frame
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(cx - 5, cy - 8, 10, 16, 3);
      } else {
        ctx.rect(cx - 5, cy - 8, 10, 16);
      }
      ctx.fill();
      ctx.stroke();

      // Equalizer bars (3 vertical LED bars per ear cup)
      const barCount = 3;
      for (let b = 0; b < barCount; b++) {
        const barH = 3 + Math.abs(Math.sin(now * 0.013 + b * 1.2 + ear.side)) * 8;
        const bx = cx - 3 + b * 3;
        const by = cy + 4 - barH;
        ctx.fillStyle = b === 1 ? '#FF2A85' : '#00F0FF';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 4;
        ctx.fillRect(bx, by, 2, barH);
      }
    }

    // Occasional floating music notes
    if (Math.random() < 0.03 && !this.reducedMotion) {
      this.spawnParticles('music_notes', 1);
    }

    ctx.restore();
  }

  /* =========================================================================
     OVERLAY: TYPING STATE — Mini Holographic Keyboard Matrix & Rapid Paws
     ========================================================================= */
  renderTypingPawHUD(ctx) {
    if (!this.animationEnabled) return;
    const now = Date.now();
    ctx.save();

    const kbX = this.width / 2 - 28;
    const kbY = this.height - 24;
    const kbW = 56;
    const kbH = 14;

    const accent = '#00FF88';

    // 1. Holographic Keyboard Base Plate
    ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
    ctx.fillRect(kbX, kbY, kbW, kbH);
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
    ctx.lineWidth = 1;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 6;
    ctx.strokeRect(kbX, kbY, kbW, kbH);

    // 2. Micro Key Matrix Grid
    const cols = 7;
    const keyW = 6;
    const keyH = 4;
    for (let c = 0; c < cols; c++) {
      const kx = kbX + 3 + c * 7.5;
      const isLit = Math.sin(now * 0.02 + c) > 0.3;
      ctx.fillStyle = isLit ? '#00FF88' : 'rgba(0, 255, 136, 0.25)';
      ctx.fillRect(kx, kbY + 3, keyW, keyH);
      ctx.fillRect(kx, kbY + 8, keyW, keyH - 1);
    }

    // 3. Alternating Typing Paws
    const tapLeft = Math.sin(now * 0.024) > 0 ? -2 : 0;
    const tapRight = Math.cos(now * 0.024) > 0 ? -2 : 0;

    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 4;
    // Left paw
    ctx.beginPath();
    ctx.arc(this.width / 2 - 12, kbY + 2 + tapLeft, 3, 0, Math.PI * 2);
    ctx.fill();
    // Right paw
    ctx.beginPath();
    ctx.arc(this.width / 2 + 12, kbY + 2 + tapRight, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /* =========================================================================
     MAIN ANIMATION LOOP
     ========================================================================= */
  startLoop() {
    const loop = () => {
      try {
        this.update();
        this.render();
      } catch (err) {
        console.error('[Mascot Render Loop Error]:', err);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

// Global browser window registrations & initialization
if (typeof window !== 'undefined') {
  window.MascotController = MascotController;
  window.setMascotState = (stateName) => {
    if (window.mascotController) window.mascotController.setState(stateName);
  };
  window.handleSystemEvent = (eventType, metadata) => {
    if (window.mascotController) window.mascotController.handleSystemEvent(eventType, metadata);
  };

  window.startMascotWithApp = () => {
    if (!window.mascotController && document.getElementById('raidenCanvas')) {
      window.mascotController = new MascotController({
        canvasId: 'raidenCanvas',
        bubbleId: 'raiden-dialogue-bubble',
        containerId: 'raiden-mascot-container',
        width: 130,
        height: 130
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.startMascotWithApp);
  } else {
    window.startMascotWithApp();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MascotController;
}
