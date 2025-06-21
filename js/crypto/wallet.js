// js/crypto/wallet.js - CTC Wallet Crypto Implementation (SECURE VERSION)

// CTC Word List (same as Go code)
const CTC_WORD_LIST = [
    "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse",
    "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act",
    "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit",
    "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
    "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert",
    "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter",
    "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger",
    "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique",
    "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic",
    "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest",
    "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset",
    "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction",
    "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake",
    "aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge",
    "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain",
    "barrel", "base", "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become",
    "beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit",
    "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology",
    "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless",
    "blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body",
    "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss",
    "bottom", "bounce", "box", "boy", "bracket", "brain", "brand", "brass", "brave", "bread",
    "breeze", "brick", "bridge", "brief", "bright", "bring", "brisk", "broccoli", "broken", "bronze",
    "broom", "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb",
    "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy",
    "butter", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call",
    "calm", "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe", "canvas",
    "canyon", "capable", "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry",
    "cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch", "category",
    "cattle", "caught", "cause", "caution", "cave", "ceiling", "celery", "cement", "census", "century",
    "cereal", "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase",
    "chat", "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child",
    "chimney", "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinnamon", "circle",
    "citizen", "city", "civil", "claim", "clap", "clarify", "claw", "clay", "clean", "clerk",
    "clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close",
    "cloth", "cloud", "clown", "club", "clump", "cluster", "clutch", "coach", "coast", "coat",
    "coconut", "code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come",
    "comfort", "comic", "common", "company", "concert", "conduct", "confirm", "congress", "connect", "consider",
    "control", "convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct",
    "cost", "cotton", "couch", "country", "couple", "course", "cousin", "cover", "coyote", "crack",
    "cradle", "craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit",
    "creek", "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd",
    "crucial", "cruel", "cruise", "crumble", "crunch", "crush", "cry", "crystal", "cube", "culture",
    "cup", "cupboard", "curious", "current", "curtain", "curve", "cushion", "custom", "cute", "cycle",
    "dad", "damage", "damp", "dance", "danger", "daring", "dash", "daughter", "dawn", "day",
    "deal", "debate", "debris", "decade", "december", "decide", "decline", "decorate", "decrease", "deer",
    "defense", "define", "defy", "degree", "delay", "deliver", "demand", "demise", "denial", "dentist",
    "deny", "depart", "depend", "deposit", "depth", "deputy", "derive", "describe", "desert", "design",
    "desk", "despair", "destroy", "detail", "detect", "develop", "device", "devote", "diagram", "dial",
    "diamond", "diary", "dice", "diesel", "diet", "differ", "digital", "dignity", "dilemma", "dinner",
    "dinosaur", "direct", "dirt", "disagree", "discover", "disease", "dish", "dismiss", "disorder", "display",
    "distance", "divert", "divide", "divorce", "dizzy", "doctor", "document", "dog", "doll", "dolphin",
    "domain", "donate", "donkey", "donor", "door", "dose", "double", "dove", "draft", "dragon",
    "drama", "drastic", "draw", "dream", "dress", "drift", "drill", "drink", "drip", "drive",
    "drop", "drum", "dry", "duck", "dumb", "dune", "during", "dust", "dutch", "duty",
    "dwarf", "dynamic", "eager", "eagle", "early", "earn", "earth", "easily", "east", "easy",
    "echo", "ecology", "economy", "edge", "edit", "educate", "effort", "egg", "eight", "either",
    "elbow", "elder", "electric", "elegant", "element", "elephant", "elevator", "elite", "else", "embark",
    "embody", "embrace", "emerge", "emotion", "employ", "empower", "empty", "enable", "enact", "end",
    "endless", "endorse", "enemy", "energy", "enforce", "engage", "engine", "enhance", "enjoy", "enlist",
    "enough", "enrich", "enroll", "ensure", "enter", "entire", "entry", "envelope", "episode", "equal",
    "equip", "era", "erase", "erode", "erosion", "error", "erupt", "escape", "essay", "essence",
    "estate", "eternal", "ethics", "evidence", "evil", "evoke", "evolve", "exact", "example", "excess",
    "exchange", "excite", "exclude", "excuse", "execute", "exercise", "exhaust", "exhibit", "exile", "exist",
    "exit", "exotic", "expand", "expect", "expire", "explain", "expose", "express", "extend", "extra",
    "eye", "eyebrow", "fabric", "face", "faculty", "fade", "faint", "faith", "fall", "false",
    "fame", "family", "famous", "fan", "fancy", "fantasy", "farm", "fashion", "fat", "fatal",
    "father", "fatigue", "fault", "favorite", "feature", "february", "federal", "fee", "feed", "feel",
    "female", "fence", "festival", "fetch", "fever", "few", "fiber", "fiction", "field", "figure",
    "file", "film", "filter", "final", "find", "fine", "finger", "finish", "fire", "firm",
    "first", "fiscal", "fish", "fit", "fitness", "fix", "flag", "flame", "flash", "flat",
    "flavor", "flee", "flight", "flip", "float", "flock", "floor", "flower", "fluid", "flush",
    "fly", "foam", "focus", "fog", "foil", "fold", "follow", "food", "foot", "force",
    "forest", "forget", "fork", "fortune", "forum", "forward", "fossil", "foster", "found", "fox",
    "fragile", "frame", "frequent", "fresh", "friend", "fringe", "frog", "front", "frost", "frown",
    "frozen", "fruit", "fuel", "fun", "funny", "furnace", "fury", "future", "gadget", "gain",
    "galaxy", "gallery", "game", "gap", "garage", "garbage", "garden", "garlic", "garment", "gas",
    "gasp", "gate", "gather", "gauge", "gaze", "general", "genius", "genre", "gentle", "genuine",
    "gesture", "ghost", "giant", "gift", "giggle", "ginger", "giraffe", "girl", "give", "glad",
    "glance", "glare", "glass", "glide", "glimpse", "globe", "gloom", "glory", "glove", "glow",
    "glue", "goat", "goddess", "gold", "good", "goose", "gorilla", "gospel", "gossip", "govern",
    "gown", "grab", "grace", "grain", "grant", "grape", "grass", "gravity", "great", "green",
    "grid", "grief", "grit", "grocery", "group", "grow", "grunt", "guard", "guess", "guide",
    "guilt", "guitar", "gun", "gym", "habit", "hair", "half", "hammer", "hamster", "hand",
    "happy", "harbor", "hard", "harsh", "harvest", "hat", "have", "hawk", "hazard", "head",
    "health", "heart", "heavy", "hedgehog", "height", "hello", "helmet", "help", "hen", "hero",
    "hidden", "high", "hill", "hint", "hip", "hire", "history", "hobby", "hockey", "hold",
    "hole", "holiday", "hollow", "home", "honey", "hood", "hope", "horn", "horror", "horse",
    "hospital", "host", "hotel", "hour", "hover", "hub", "huge", "human", "humble", "humor",
    "hundred", "hungry", "hunt", "hurdle", "hurry", "hurt", "husband", "hybrid", "ice", "icon",
    "idea", "identify", "idle", "ignore", "ill", "illegal", "illness", "image", "imitate", "immense",
    "immune", "impact", "impose", "improve", "impulse", "inch", "include", "income", "increase", "index",
    "indicate", "indoor", "industry", "infant", "inflict", "inform", "inhale", "inherit", "initial", "inject",
    "injury", "inmate", "inner", "innocent", "input", "inquiry", "insane", "insect", "inside", "inspire",
    "install", "intact", "interest", "into", "invest", "invite", "involve", "iron", "island", "isolate",
    "issue", "item", "ivory", "jacket", "jaguar", "jar", "jazz", "jealous", "jeans", "jelly",
    "jewel", "job", "join", "joke", "journey", "joy", "judge", "juice", "jump", "jungle",
    "junior", "junk", "just", "kangaroo", "keen", "keep", "ketchup", "key", "kick", "kid",
    "kidney", "kind", "kingdom", "kiss", "kit", "kitchen", "kite", "kitten", "kiwi", "knee",
    "knife", "knock", "know", "lab", "label", "labor", "ladder", "lady", "lake", "lamp",
    "land", "language", "laptop", "large", "later", "latin", "laugh", "laundry", "lava", "law",
    "lawn", "lawsuit", "layer", "lazy", "leader", "leaf", "learn", "leave", "lecture", "left",
    "leg", "legal", "legend", "leisure", "lemon", "lend", "length", "lens", "leopard", "lesson",
    "letter", "level", "liar", "liberty", "library", "license", "life", "lift", "light", "like",
    "limb", "limit", "link", "lion", "liquid", "list", "little", "live", "lizard", "load",
    "loan", "lobster", "local", "lock", "logic", "lonely", "long", "loop", "lottery", "loud",
    "lounge", "love", "loyal", "lucky", "luggage", "lumber", "lunar", "lunch", "luxury", "lyrics",
    "machine", "mad", "magic", "magnet", "maid", "mail", "main", "major", "make", "mammal",
    "man", "manage", "mandate", "mango", "mansion", "manual", "maple", "marble", "march", "margin",
    "marine", "market", "marriage", "mask", "mass", "master", "match", "material", "math", "matrix",
    "matter", "maximum", "maze", "meadow", "mean", "measure", "meat", "mechanic", "medal", "media",
    "melody", "melt", "member", "memory", "mention", "menu", "mercy", "merge", "merit", "merry",
    "mesh", "message", "metal", "method", "middle", "midnight", "milk", "million", "mimic", "mind",
    "minimum", "minor", "minute", "miracle", "mirror", "misery", "miss", "mistake", "mix", "mixed",
    "mixture", "mobile", "model", "modify", "mom", "moment", "monitor", "monkey", "monster", "month",
    "moon", "moral", "more", "morning", "mosquito", "mother", "motion", "motor", "mountain", "mouse",
    "move", "movie", "much", "muffin", "mule", "multiply", "muscle", "museum", "mushroom", "music",
    "must", "mutual", "myself", "mystery", "myth", "naive", "name", "napkin", "narrow", "nasty",
    "nation", "nature", "near", "neck", "need", "negative", "neglect", "neither", "nephew", "nerve",
    "nest", "net", "network", "neutral", "never", "news", "next", "nice", "night", "noble",
    "noise", "nominee", "noodle", "normal", "north", "nose", "notable", "note", "nothing", "notice",
    "novel", "now", "nuclear", "number", "nurse", "nut", "oak", "obey", "object", "oblige",
    "obscure", "observe", "obtain", "obvious", "occur", "ocean", "october", "odor", "off", "offer",
    "office", "often", "oil", "okay", "old", "olive", "olympic", "omit", "once", "one",
    "onion", "online", "only", "open", "opera", "opinion", "oppose", "option", "orange", "orbit",
    "orchard", "order", "ordinary", "organ", "orient", "original", "orphan", "ostrich", "other", "outdoor",
    "outer", "output", "outside", "oval", "oven", "over", "own", "owner", "oxygen", "oyster",
    "ozone", "pact", "paddle", "page", "pair", "palace", "palm", "panda", "panel", "panic",
    "panther", "paper", "parade", "parent", "park", "parrot", "party", "pass", "patch", "path",
    "patient", "patrol", "pattern", "pause", "pave", "payment", "peace", "peanut", "pear", "peasant",
    "pelican", "pen", "penalty", "pencil", "people", "pepper", "perfect", "permit", "person", "pet",
    "phone", "photo", "phrase", "physical", "piano", "picnic", "picture", "piece", "pig", "pigeon",
    "pill", "pilot", "pink", "pioneer", "pipe", "pistol", "pitch", "pizza", "place", "planet",
    "plastic", "plate", "play", "please", "pledge", "pluck", "plug", "plunge", "poem", "poet",
    "point", "polar", "pole", "police", "pond", "pony", "pool", "popular", "portion", "position",
    "possible", "post", "potato", "pottery", "poverty", "powder", "power", "practice", "praise", "predict",
    "prefer", "prepare", "present", "pretty", "prevent", "price", "pride", "primary", "print", "priority",
    "prison", "private", "prize", "problem", "process", "produce", "profit", "program", "project", "promote",
    "proof", "property", "prosper", "protect", "proud", "provide", "public", "pudding", "pull", "pulp",
    "pulse", "pumpkin", "punch", "pupil", "puppy", "purchase", "purity", "purpose", "purse", "push",
    "put", "puzzle", "pyramid", "quality", "quantum", "quarter", "question", "quick", "quit", "quiz",
    "quote", "rabbit", "raccoon", "race", "rack", "radar", "radio", "rail", "rain", "raise",
    "rally", "ramp", "ranch", "random", "range", "rapid", "rare", "rate", "rather", "raven",
    "raw", "razor", "ready", "real", "reason", "rebel", "rebuild", "recall", "receive", "recipe",
    "record", "recycle", "reduce", "reflect", "reform", "refuse", "region", "regret", "regular", "reject",
    "relax", "release", "relief", "rely", "remain", "remember", "remind", "remove", "render", "renew",
    "rent", "reopen", "repair", "repeat", "replace", "report", "require", "rescue", "resemble", "resist",
    "resource", "response", "result", "retire", "retreat", "return", "reunion", "reveal", "review", "reward",
    "rhythm", "rib", "ribbon", "rice", "rich", "ride", "ridge", "rifle", "right", "rigid",
    "ring", "riot", "ripple", "risk", "ritual", "rival", "river", "road", "roast", "robot",
    "robust", "rocket", "romance", "roof", "rookie", "room", "rose", "rotate", "rough", "round",
    "route", "royal", "rubber", "rude", "rug", "rule", "run", "runway", "rural", "sad",
    "saddle", "sadness", "safe", "sail", "salad", "salmon", "salon", "salt", "salute", "same",
    "sample", "sand", "satisfy", "satoshi", "sauce", "sausage", "save", "say", "scale", "scan",
    "scare", "scatter", "scene", "scheme", "school", "science", "scissors", "scorpion", "scout", "scrap",
    "screen", "script", "scrub", "sea", "search", "season", "seat", "second", "secret", "section",
    "security", "seed", "seek", "segment", "select", "sell", "seminar", "senior", "sense", "sentence",
    "series", "service", "session", "settle", "setup", "seven", "shadow", "shaft", "shallow", "share",
    "shed", "shell", "sheriff", "shield", "shift", "shine", "ship", "shiver", "shock", "shoe",
    "shoot", "shop", "short", "shoulder", "shove", "shrimp", "shrug", "shuffle", "shy", "sibling",
    "sick", "side", "siege", "sight", "sign", "silent", "silk", "silly", "silver", "similar",
    "simple", "since", "sing", "siren", "sister", "situate", "six", "size", "skate", "sketch",
    "ski", "skill", "skin", "skirt", "skull", "slab", "slam", "sleep", "slender", "slice",
    "slide", "slight", "slim", "slogan", "slot", "slow", "slush", "small", "smart", "smile",
    "smoke", "smooth", "snack", "snake", "snap", "sniff", "snow", "soap", "soccer", "social",
    "sock", "soda", "soft", "solar", "soldier", "solid", "solution", "solve", "someone", "song",
    "soon", "sorry", "sort", "soul", "sound", "soup", "source", "south", "space", "spare",
    "spatial", "spawn", "speak", "special", "speed", "spell", "spend", "sphere", "spice", "spider",
    "spike", "spin", "spirit", "split", "spoil", "sponsor", "spoon", "sport", "spot", "spray",
    "spread", "spring", "spy", "square", "squeeze", "squirrel", "stable", "stadium", "staff", "stage",
    "stairs", "stamp", "stand", "start", "state", "stay", "steak", "steel", "stem", "step",
    "stereo", "stick", "still", "sting", "stock", "stomach", "stone", "stool", "story", "stove",
    "strategy", "street", "strike", "strong", "struggle", "student", "stuff", "stumble", "style", "subject",
    "submit", "subway", "success", "such", "sudden", "suffer", "sugar", "suggest", "suit", "summer",
    "sun", "sunny", "sunset", "super", "supply", "supreme", "sure", "surface", "surge", "surprise",
    "surround", "survey", "suspect", "sustain", "swallow", "swamp", "swap", "swarm", "swear", "sweet",
    "swift", "swim", "swing", "switch", "sword", "symbol", "symptom", "syrup", "system", "table",
    "tackle", "tag", "tail", "talent", "talk", "tank", "tape", "target", "task", "taste",
    "tattoo", "taxi", "teach", "team", "tell", "ten", "tenant", "tennis", "tent", "term",
    "test", "text", "thank", "that", "theme", "then", "theory", "there", "they", "thing",
    "this", "thought", "three", "thrive", "throw", "thumb", "thunder", "ticket", "tide", "tiger",
    "tilt", "timber", "time", "tiny", "tip", "tired", "tissue", "title", "toast", "tobacco",
    "today", "toddler", "toe", "together", "toilet", "token", "tomato", "tomorrow", "tone", "tongue",
    "tonight", "tool", "tooth", "top", "topic", "topple", "torch", "tornado", "tortoise", "toss",
    "total", "tourist", "toward", "tower", "town", "toy", "track", "trade", "traffic", "tragic",
    "train", "transfer", "trap", "trash", "travel", "tray", "treat", "tree", "trend", "trial",
    "tribe", "trick", "trigger", "trim", "trip", "trophy", "trouble", "truck", "true", "truly",
    "trumpet", "trust", "truth", "try", "tube", "tuition", "tumble", "tuna", "tunnel", "turkey",
    "turn", "turtle", "twelve", "twenty", "twice", "twin", "twist", "two", "type", "typical",
    "ugly", "umbrella", "unable", "unaware", "uncle", "uncover", "under", "undo", "unfair", "unfold",
    "unhappy", "uniform", "unique", "unit", "universe", "unknown", "unlock", "until", "unusual", "unveil",
    "update", "upgrade", "uphold", "upon", "upper", "upset", "urban", "urge", "usage", "use",
    "used", "useful", "useless", "usual", "utility", "vacant", "vacuum", "vague", "valid", "valley",
    "valve", "van", "vanish", "vapor", "various", "vast", "vault", "vehicle", "velvet", "vendor",
    "venture", "venue", "verb", "verify", "version", "very", "vessel", "veteran", "viable", "vibrant",
    "vicious", "victory", "video", "view", "village", "vintage", "violin", "virtual", "virus", "visa",
    "visit", "visual", "vital", "vivid", "vocal", "voice", "void", "volcano", "volume", "vote",
    "voyage", "wage", "wagon", "wait", "walk", "wall", "walnut", "want", "warfare", "warm",
    "warrior", "wash", "wasp", "waste", "water", "wave", "way", "wealth", "weapon", "wear",
    "weasel", "weather", "web", "wedding", "weekend", "weird", "welcome", "west", "wet", "whale",
    "what", "wheat", "wheel", "when", "where", "whip", "whisper", "wide", "width", "wife",
    "wild", "will", "win", "window", "wine", "wing", "wink", "winner", "winter", "wire",
    "wisdom", "wise", "wish", "witness", "wolf", "woman", "wonder", "wood", "wool", "word",
    "work", "world", "worry", "worth", "wrap", "wreck", "wrestle", "wrist", "write", "wrong",
    "yard", "year", "yellow", "you", "young", "youth", "zebra", "zero", "zone", "zoo"
];

// Simple encryption utility using Web Crypto API
class SecureStorage {
    static async generateKey(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        
        // Create key from password
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            data,
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        
        // Derive AES key
        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode('ctc-wallet-salt'),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }
    
    static async encrypt(data, password) {
        const key = await this.generateKey(password);
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            dataBuffer
        );
        
        // Combine IV and encrypted data
        const result = new Uint8Array(iv.length + encrypted.byteLength);
        result.set(iv, 0);
        result.set(new Uint8Array(encrypted), iv.length);
        
        return Array.from(result);
    }
    
    static async decrypt(encryptedArray, password) {
        const key = await this.generateKey(password);
        const encryptedData = new Uint8Array(encryptedArray);
        
        const iv = encryptedData.slice(0, 12);
        const data = encryptedData.slice(12);
        
        try {
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                data
            );
            
            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decrypted));
        } catch (error) {
            throw new Error('Failed to decrypt wallet data - wrong password?');
        }
    }
}

// Go-kompatible CTC Wallet Implementierung (SECURE VERSION)
class CTCWallet {
    constructor() {
        this.privateKeyBigInt = null;
        this.privateKeyBytes = null;
        this.publicKeyBytes = null;
        this.publicKeyHex = null;
        this.address = null;
        this.mnemonic = null;
        this._isLocked = false;
    }

    static async create() {
        const wallet = new CTCWallet();
        
        // Generate 12-word mnemonic exactly like Go
        const words = [];
        for (let i = 0; i < 12; i++) {
            const randomIndex = Math.floor(Math.random() * CTC_WORD_LIST.length);
            words.push(CTC_WORD_LIST[randomIndex]);
        }
        wallet.mnemonic = words.join(' ');

        await wallet.generateKeysFromMnemonic(wallet.mnemonic);
        return wallet;
    }

    static async restore(mnemonic) {
        const wallet = new CTCWallet();
        wallet.mnemonic = mnemonic.trim();
        
        // Validate mnemonic
        const words = wallet.mnemonic.split(' ');
        if (words.length !== 12) {
            throw new Error('Mnemonic must contain exactly 12 words');
        }

        for (const word of words) {
            if (!CTC_WORD_LIST.includes(word.toLowerCase())) {
                throw new Error(`Invalid word in mnemonic: ${word}`);
            }
        }

        await wallet.generateKeysFromMnemonic(wallet.mnemonic);
        return wallet;
    }

    async generateKeysFromMnemonic(mnemonic) {
        try {
            // SECURITY: No logging of sensitive data
            console.log('🔑 Generating wallet keys...');
            
            // Step 1: PBKDF2 exactly like Go
            const seed = await this.pbkdf2(mnemonic, 'CTC', 2048, 32);
            
            // Step 2: Convert to BigInt like Go
            this.privateKeyBigInt = this.bytesToBigInt(seed);
            
            // Step 3: Store private key bytes (32 bytes)
            this.privateKeyBytes = seed;
            
            // Step 4: ECDSA P-256 point multiplication like Go
            const publicPoint = await this.scalarBaseMult(this.privateKeyBigInt);
            
            // Step 5: Create public key bytes X||Y like Go
            this.publicKeyBytes = this.createPublicKeyBytes(publicPoint.x, publicPoint.y);
            this.publicKeyHex = this.bytesToHex(this.publicKeyBytes);
            
            // Step 6: Generate address exactly like Go
            this.address = await this.generateAddress(this.publicKeyBytes);
            
            console.log('✅ Wallet keys generated successfully');
            console.log('🏠 Address:', this.address);
            // SECURITY: No private key or mnemonic logging
            
        } catch (error) {
            console.error('❌ Error generating keys:', error.message);
            throw new Error('Failed to generate wallet keys: ' + error.message);
        }
    }

    // SECURITY: Lock wallet (clear sensitive data from memory)
    lock() {
        this.privateKeyBigInt = null;
        this.privateKeyBytes = null;
        this.mnemonic = null;
        this._isLocked = true;
        console.log('🔒 Wallet locked');
    }

    // SECURITY: Check if wallet is locked
    isLocked() {
        return this._isLocked;
    }

    // SECURITY: Unlock wallet with password
    async unlock(encryptedData, password) {
        try {
            const decryptedData = await SecureStorage.decrypt(encryptedData, password);
            
            this.mnemonic = decryptedData.mnemonic;
            this.address = decryptedData.address;
            this.publicKeyHex = decryptedData.publicKey;
            
            await this.generateKeysFromMnemonic(this.mnemonic);
            this._isLocked = false;
            
            console.log('🔓 Wallet unlocked successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to unlock wallet:', error.message);
            throw error;
        }
    }

    // SECURITY: Get wallet data for secure storage
    async getSecureData(password) {
        if (this.isLocked()) {
            throw new Error('Wallet is locked');
        }
        
        const data = {
            mnemonic: this.mnemonic,
            address: this.address,
            publicKey: this.publicKeyHex,
            createdAt: Date.now()
        };
        
        return await SecureStorage.encrypt(data, password);
    }

    // SECURITY: Safe export for display (no sensitive data)
    getSafeExport() {
        return {
            address: this.address,
            publicKeyHex: this.publicKeyHex,
            isLocked: this._isLocked,
            hasPrivateKey: !!this.privateKeyBytes
        };
    }

    // PBKDF2 exactly like Go: pbkdf2.Key([]byte(mnemonic), []byte("CTC"), 2048, 32, sha256.New)
    async pbkdf2(password, salt, iterations, keyLength) {
        const encoder = new TextEncoder();
        const passwordBytes = encoder.encode(password);
        const saltBytes = encoder.encode(salt);
        
        const baseKey = await crypto.subtle.importKey(
            'raw',
            passwordBytes,
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );
        
        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: saltBytes,
                iterations: iterations,
                hash: 'SHA-256'
            },
            baseKey,
            keyLength * 8
        );
        
        return new Uint8Array(derivedBits);
    }

    // Convert bytes to BigInt exactly like Go
    bytesToBigInt(bytes) {
        let result = 0n;
        for (let i = 0; i < bytes.length; i++) {
            result = (result << 8n) | BigInt(bytes[i]);
        }
        return result;
    }

    // Convert bytes to hex string
    bytesToHex(bytes) {
        return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // ECDSA P-256 scalar multiplication like Go
    async scalarBaseMult(scalar) {
        try {
            // P-256 curve parameters
            const p = BigInt('0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff');
            const a = BigInt('0xffffffff00000001000000000000000000000000fffffffffffffffffffffffc');
            const b = BigInt('0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b');
            const Gx = BigInt('0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296');
            const Gy = BigInt('0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5');
            const n = BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551');

            // Ensure scalar is in valid range
            const k = scalar % n;
            if (k === 0n) {
                throw new Error('Invalid scalar');
            }

            // Point multiplication using double-and-add algorithm
            const result = this.pointMultiply(k, Gx, Gy, p, a);
            
            return {
                x: result.x,
                y: result.y
            };
        } catch (error) {
            console.error('ScalarBaseMult error:', error);
            throw error;
        }
    }

    // Point multiplication on elliptic curve
    pointMultiply(k, px, py, p, a) {
        if (k === 0n) return { x: 0n, y: 0n }; // Point at infinity
        if (k === 1n) return { x: px, y: py };

        // Double-and-add algorithm
        let result = { x: 0n, y: 0n }; // Point at infinity
        let addend = { x: px, y: py };

        while (k > 0n) {
            if (k & 1n) {
                result = this.pointAdd(result, addend, p, a);
            }
            addend = this.pointDouble(addend, p, a);
            k >>= 1n;
        }

        return result;
    }

    // Point addition on elliptic curve
    pointAdd(p1, p2, p, a) {
        if (p1.x === 0n && p1.y === 0n) return p2; // P1 is point at infinity
        if (p2.x === 0n && p2.y === 0n) return p1; // P2 is point at infinity
        
        if (p1.x === p2.x) {
            if (p1.y === p2.y) {
                return this.pointDouble(p1, p, a);
            } else {
                return { x: 0n, y: 0n }; // Point at infinity
            }
        }

        const dx = this.mod(p2.x - p1.x, p);
        const dy = this.mod(p2.y - p1.y, p);
        const s = this.mod(dy * this.modInverse(dx, p), p);
        
        const x3 = this.mod(s * s - p1.x - p2.x, p);
        const y3 = this.mod(s * (p1.x - x3) - p1.y, p);
        
        return { x: x3, y: y3 };
    }

    // Point doubling on elliptic curve
    pointDouble(point, p, a) {
        if (point.x === 0n && point.y === 0n) return point; // Point at infinity
        
        const s = this.mod((3n * point.x * point.x + a) * this.modInverse(2n * point.y, p), p);
        const x3 = this.mod(s * s - 2n * point.x, p);
        const y3 = this.mod(s * (point.x - x3) - point.y, p);
        
        return { x: x3, y: y3 };
    }

    // Modular arithmetic helpers
    mod(a, m) {
        return ((a % m) + m) % m;
    }

    // Extended Euclidean algorithm for modular inverse
    modInverse(a, m) {
        if (a < 0n) a = this.mod(a, m);
        
        let [old_r, r] = [a, m];
        let [old_s, s] = [1n, 0n];
        
        while (r !== 0n) {
            const quotient = old_r / r;
            [old_r, r] = [r, old_r - quotient * r];
            [old_s, s] = [s, old_s - quotient * s];
        }
        
        return this.mod(old_s, m);
    }

    // Convert BigInt to bytes with padding
    bigIntToBytes(bigint, length) {
        const hex = bigint.toString(16).padStart(length * 2, '0');
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return bytes;
    }

    // Create public key bytes X||Y like Go (32 + 32 = 64 bytes)
    createPublicKeyBytes(x, y) {
        const xBytes = this.bigIntToBytes(x, 32);
        const yBytes = this.bigIntToBytes(y, 32);
        const result = new Uint8Array(64);
        result.set(xBytes, 0);
        result.set(yBytes, 32);
        return result;
    }

    // Generate address exactly like Go: "CTC" + first 21 hex chars of SHA256(pubKey)
    async generateAddress(publicKeyBytes) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', publicKeyBytes);
        const hashArray = new Uint8Array(hashBuffer);
        const hashHex = this.bytesToHex(hashArray);
        return 'CTC' + hashHex.substring(0, 21);
    }

    // Sign data with ECDSA exactly like Go
    async sign(data) {
        if (this.isLocked() || !this.privateKeyBytes) {
            throw new Error('Wallet is locked or private key not available');
        }
        
        try {
            const privateKey = await crypto.subtle.importKey(
                'raw',
                this.privateKeyBytes,
                { name: 'ECDSA', namedCurve: 'P-256' },
                false,
                ['sign']
            );

            const signature = await crypto.subtle.sign(
                { name: 'ECDSA', hash: 'SHA-256' },
                privateKey,
                data
            );

            return this.bytesToHex(new Uint8Array(signature));
        } catch (error) {
            console.error('Signing error:', error);
            throw error;
        }
    }

    // Verify signature exactly like Go
    static async verify(data, signatureHex, publicKeyHex) {
        try {
            // Convert hex strings to bytes
            const signatureBytes = new Uint8Array(signatureHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
            const publicKeyBytes = new Uint8Array(publicKeyHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
            
            if (publicKeyBytes.length !== 64) {
                throw new Error('Invalid public key length');
            }

            // Create public key from X||Y coordinates
            const x = publicKeyBytes.slice(0, 32);
            const y = publicKeyBytes.slice(32, 64);
            
            // Import public key for verification
            const spkiKey = await this.createSPKIPublicKey(x, y);
            const publicKey = await crypto.subtle.importKey(
                'spki',
                spkiKey,
                { name: 'ECDSA', namedCurve: 'P-256' },
                false,
                ['verify']
            );

            return await crypto.subtle.verify(
                { name: 'ECDSA', hash: 'SHA-256' },
                publicKey,
                signatureBytes,
                data
            );
        } catch (error) {
            console.error('Verification error:', error);
            return false;
        }
    }

    // Helper to create SPKI format public key
    static async createSPKIPublicKey(x, y) {
        // SPKI header for P-256 public key
        const spkiHeader = new Uint8Array([
            0x30, 0x59, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86,
            0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a,
            0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x03,
            0x42, 0x00, 0x04
        ]);
        
        const result = new Uint8Array(spkiHeader.length + 64);
        result.set(spkiHeader, 0);
        result.set(x, spkiHeader.length);
        result.set(y, spkiHeader.length + 32);
        
        return result;
    }

    // SECURITY: Safe mnemonic display (only for legitimate recovery)
    getMnemonicForDisplay() {
        if (this.isLocked()) {
            throw new Error('Wallet is locked');
        }
        
        // Add warning and require user confirmation
        console.warn('⚠️ SECURITY WARNING: Mnemonic phrase requested for display');
        return this.mnemonic;
    }

    // SECURITY: Clear all sensitive data
    destroy() {
        this.privateKeyBigInt = null;
        this.privateKeyBytes = null;
        this.mnemonic = null;
        this.publicKeyBytes = null;
        this.publicKeyHex = null;
        this.address = null;
        this._isLocked = true;
        
        console.log('🔥 Wallet destroyed - all sensitive data cleared');
    }
}

// Export for use in other modules
window.CTCWallet = CTCWallet;
window.SecureStorage = SecureStorage;
window.CTC_WORD_LIST = CTC_WORD_LIST;
