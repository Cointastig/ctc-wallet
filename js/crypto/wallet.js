// js/crypto/wallet.js - CTC Blockchain-kompatible Wallet Implementation with Enhanced ECDSA

// BIP39 Wordlist (gleiche wie in Go Implementation)
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

// Utility-Funktionen für Kryptografie (identisch mit Go Implementation)
class CryptoUtils {
    // Konvertiere Hex zu Uint8Array
    static hexToBytes(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }

    // Konvertiere Uint8Array zu Hex
    static bytesToHex(bytes) {
        return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // PBKDF2 mit SHA-256 (identisch mit Go Implementation)
    static async pbkdf2(password, salt, iterations, keyLength) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        const saltBuffer = encoder.encode(salt);
        
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: saltBuffer,
                iterations: iterations,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-CTR', length: keyLength * 8 },
            true,
            ['encrypt', 'decrypt']
        );

        const keyBuffer = await crypto.subtle.exportKey('raw', derivedKey);
        return new Uint8Array(keyBuffer);
    }

    // SHA-256 Hash
    static async sha256(data) {
        const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return new Uint8Array(hashBuffer);
    }

    // FIX: Konvertiere BigInt zu 32-Byte Array (mit korrektem Padding wie in Go)
    static bigIntToBytes32(bigInt) {
        const hex = bigInt.toString(16);
        const paddedHex = hex.padStart(64, '0'); // 32 Bytes = 64 Hex-Zeichen
        return this.hexToBytes(paddedHex);
    }

    // FIX: Korrekte ECDSA R,S Padding (identisch mit Go Implementation)
    static padToBytes32(bytes) {
        if (bytes.length === 32) return bytes;
        
        const padded = new Uint8Array(32);
        if (bytes.length < 32) {
            // Links mit Nullen auffüllen
            padded.set(bytes, 32 - bytes.length);
        } else {
            // Schneide ab falls zu lang (sollte nicht passieren)
            padded.set(bytes.slice(-32));
        }
        return padded;
    }
}

// CTC Wallet Klasse (100% kompatibel mit Go Implementation + Enhanced ECDSA)
class CTCWallet {
    constructor() {
        this.mnemonic = null;
        this.privateKeyBigInt = null;
        this.privateKeyBytes = null;
        this.privateKeyHex = null;
        this.publicKeyBytes = null;
        this.publicKeyHex = null;
        this.address = null;
        this._isLocked = true;
        this._cryptoKey = null; // Für erweiterte ECDSA-Operationen
    }

    // Erstelle neues Wallet (identisch mit Go CreateWallet)
    static async create() {
        console.log('🔑 Creating new CTC wallet...');
        
        const wallet = new CTCWallet();
        
        // Generiere 12-Wort Mnemonic (identisch mit Go)
        const words = [];
        for (let i = 0; i < 12; i++) {
            const randomIndex = Math.floor(Math.random() * CTC_WORD_LIST.length);
            words.push(CTC_WORD_LIST[randomIndex]);
        }
        wallet.mnemonic = words.join(' ');
        
        await wallet._generateKeysFromMnemonic();
        wallet._isLocked = false;
        
        console.log('✅ New wallet created successfully');
        return wallet;
    }

    // Stelle Wallet aus Mnemonic wieder her (identisch mit Go RestoreWallet)
    static async restore(mnemonic) {
        console.log('🔄 Restoring wallet from mnemonic...');
        
        if (!mnemonic || mnemonic.trim() === '') {
            throw new Error('Empty mnemonic');
        }
        
        const wallet = new CTCWallet();
        wallet.mnemonic = mnemonic.trim();
        
        // Validiere Mnemonic
        const words = wallet.mnemonic.split(' ');
        if (words.length !== 12) {
            throw new Error('Mnemonic must contain exactly 12 words');
        }
        
        for (const word of words) {
            if (!CTC_WORD_LIST.includes(word.toLowerCase())) {
                throw new Error(`Invalid word in mnemonic: ${word}`);
            }
        }
        
        await wallet._generateKeysFromMnemonic();
        wallet._isLocked = false;
        
        console.log('✅ Wallet restored successfully');
        return wallet;
    }

    // Generiere Schlüssel aus Mnemonic (identisch mit Go Implementation)
    async _generateKeysFromMnemonic() {
        try {
            // PBKDF2 mit identischen Parametern wie Go
            const seed = await CryptoUtils.pbkdf2(this.mnemonic, 'CTC', 2048, 32);
            
            // Konvertiere Seed zu BigInt
            this.privateKeyBigInt = BigInt('0x' + CryptoUtils.bytesToHex(seed));
            
            // Private Key als Bytes und Hex
            this.privateKeyBytes = CryptoUtils.bigIntToBytes32(this.privateKeyBigInt);
            this.privateKeyHex = CryptoUtils.bytesToHex(this.privateKeyBytes);
            
            // Generiere Public Key mit P-256 (identisch mit Go)
            const keyPair = await this._generateP256KeyPair(this.privateKeyBytes);
            this.publicKeyBytes = keyPair.publicKeyBytes;
            this.publicKeyHex = CryptoUtils.bytesToHex(this.publicKeyBytes);
            this._cryptoKey = keyPair.privateKey; // Speichere für erweiterte Operationen
            
            // Generiere CTC-Adresse (identisch mit Go)
            this.address = await this._generateAddress(this.publicKeyBytes);
            
        } catch (error) {
            console.error('❌ Key generation failed:', error);
            throw new Error('Failed to generate wallet keys');
        }
    }

    // P-256 Schlüsselpaar generieren (identisch mit Go elliptic.P256())
    async _generateP256KeyPair(privateKeyBytes) {
        const algorithm = {
            name: 'ECDSA',
            namedCurve: 'P-256'
        };
        
        // Importiere Private Key
        const privateKey = await crypto.subtle.importKey(
            'raw',
            privateKeyBytes,
            algorithm,
            true, // Exportierbar für Signierung
            ['sign']
        );
        
        // Generiere entsprechenden Public Key
        const jwkPrivateKey = await crypto.subtle.exportKey('jwk', privateKey);
        
        // Importiere Public Key
        const publicKey = await crypto.subtle.importKey(
            'jwk',
            {
                kty: jwkPrivateKey.kty,
                crv: jwkPrivateKey.crv,
                x: jwkPrivateKey.x,
                y: jwkPrivateKey.y
            },
            algorithm,
            true,
            ['verify']
        );
        
        // Exportiere Public Key im raw Format
        const publicKeyBuffer = await crypto.subtle.exportKey('raw', publicKey);
        
        // P-256 Public Key ist 65 Bytes (0x04 + 32 Bytes X + 32 Bytes Y)
        // Go erwartet nur die 64 Bytes (X||Y)
        const publicKeyBytes = new Uint8Array(publicKeyBuffer).slice(1); // Entferne 0x04 Prefix
        
        return {
            privateKey: privateKey,
            publicKeyBytes: publicKeyBytes
        };
    }

    // Generiere CTC-Adresse (identisch mit Go generateAddress)
    async _generateAddress(publicKeyBytes) {
        const hash = await CryptoUtils.sha256(publicKeyBytes);
        const addressHex = CryptoUtils.bytesToHex(hash).substring(0, 21); // Erste 21 Hex-Zeichen
        return 'CTC' + addressHex;
    }

    // FIX: Enhanced ECDSA Signierung (identisch mit Go Sign-Funktion + korrektes Padding)
    async sign(data) {
        if (this._isLocked) {
            throw new Error('Wallet is locked');
        }
        
        try {
            // SHA-256 Hash der Daten
            const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
            const hash = await CryptoUtils.sha256(dataBytes);
            
            // Signiere Hash mit dem gespeicherten CryptoKey
            const signature = await crypto.subtle.sign(
                {
                    name: 'ECDSA',
                    hash: 'SHA-256'
                },
                this._cryptoKey,
                hash
            );
            
            // FIX: Korrekte Verarbeitung der DER-encoded Signatur
            const derSignature = new Uint8Array(signature);
            const { r, s } = this._parseDERSignature(derSignature);
            
            // FIX: Padding auf exakt 32 Bytes (identisch mit Go)
            const rPadded = CryptoUtils.padToBytes32(r);
            const sPadded = CryptoUtils.padToBytes32(s);
            
            // Kombiniere zu r||s Format (64 Bytes total)
            const finalSig = new Uint8Array(64);
            finalSig.set(rPadded, 0);
            finalSig.set(sPadded, 32);
            
            return CryptoUtils.bytesToHex(finalSig);
            
        } catch (error) {
            console.error('❌ Signing failed:', error);
            throw new Error('Failed to sign data');
        }
    }

    // FIX: DER-encoded Signatur parsen (für korrekte r,s Extraktion)
    _parseDERSignature(derBytes) {
        try {
            // DER SEQUENCE parsing
            if (derBytes[0] !== 0x30) {
                throw new Error('Invalid DER signature');
            }
            
            let pos = 2; // Skip SEQUENCE tag and length
            
            // Parse r
            if (derBytes[pos] !== 0x02) {
                throw new Error('Invalid r component');
            }
            pos++;
            const rLength = derBytes[pos++];
            let r = derBytes.slice(pos, pos + rLength);
            pos += rLength;
            
            // Remove leading zero if present (DER encoding requirement)
            if (r[0] === 0x00 && r.length > 1) {
                r = r.slice(1);
            }
            
            // Parse s
            if (derBytes[pos] !== 0x02) {
                throw new Error('Invalid s component');
            }
            pos++;
            const sLength = derBytes[pos++];
            let s = derBytes.slice(pos, pos + sLength);
            
            // Remove leading zero if present
            if (s[0] === 0x00 && s.length > 1) {
                s = s.slice(1);
            }
            
            return { r, s };
            
        } catch (error) {
            console.error('❌ DER parsing failed:', error);
            throw new Error('Failed to parse signature');
        }
    }

    // FIX: Enhanced Signatur-Verifikation (identisch mit Go Verify-Funktion)
    static async verify(data, signatureHex, publicKeyHex) {
        try {
            // Konvertiere Inputs
            const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
            const signatureBytes = CryptoUtils.hexToBytes(signatureHex);
            const publicKeyBytes = CryptoUtils.hexToBytes(publicKeyHex);
            
            if (signatureBytes.length !== 64 || publicKeyBytes.length !== 64) {
                return false;
            }
            
            // Hash der Daten
            const hash = await CryptoUtils.sha256(dataBytes);
            
            // Extrahiere r und s (je 32 Bytes)
            const r = signatureBytes.slice(0, 32);
            const s = signatureBytes.slice(32, 64);
            
            // Konvertiere zu DER-Format für Web Crypto API
            const derSignature = this._createDERSignature(r, s);
            
            // Konvertiere Public Key für P-256 (füge 0x04 Prefix hinzu)
            const fullPublicKey = new Uint8Array(65);
            fullPublicKey[0] = 0x04;
            fullPublicKey.set(publicKeyBytes, 1);
            
            // Importiere Public Key
            const publicKey = await crypto.subtle.importKey(
                'raw',
                fullPublicKey,
                {
                    name: 'ECDSA',
                    namedCurve: 'P-256'
                },
                false,
                ['verify']
            );
            
            // Verifiziere Signatur
            const isValid = await crypto.subtle.verify(
                {
                    name: 'ECDSA',
                    hash: 'SHA-256'
                },
                publicKey,
                derSignature,
                hash
            );
            
            return isValid;
            
        } catch (error) {
            console.error('❌ Verification failed:', error);
            return false;
        }
    }

    // FIX: DER-Signatur erstellen (für Verifikation)
    static _createDERSignature(r, s) {
        // Entferne führende Nullen, aber behalte mindestens ein Byte
        function trimLeadingZeros(bytes) {
            let start = 0;
            while (start < bytes.length - 1 && bytes[start] === 0) {
                start++;
            }
            return bytes.slice(start);
        }
        
        // Füge führende Null hinzu wenn höchstes Bit gesetzt (DER Requirement)
        function addLeadingZeroIfNeeded(bytes) {
            if (bytes[0] & 0x80) {
                const padded = new Uint8Array(bytes.length + 1);
                padded[0] = 0x00;
                padded.set(bytes, 1);
                return padded;
            }
            return bytes;
        }
        
        const rTrimmed = addLeadingZeroIfNeeded(trimLeadingZeros(r));
        const sTrimmed = addLeadingZeroIfNeeded(trimLeadingZeros(s));
        
        // Erstelle DER SEQUENCE
        const rEncoded = new Uint8Array([0x02, rTrimmed.length, ...rTrimmed]);
        const sEncoded = new Uint8Array([0x02, sTrimmed.length, ...sTrimmed]);
        
        const contentLength = rEncoded.length + sEncoded.length;
        const der = new Uint8Array([0x30, contentLength, ...rEncoded, ...sEncoded]);
        
        return der;
    }

    // Wallet-Speicher-Interface
    async getSecureData(password) {
        if (!password) {
            throw new Error('Password required for encryption');
        }
        
        return await SecureStorage.encrypt({
            mnemonic: this.mnemonic,
            privateKey: this.privateKeyHex,
            publicKey: this.publicKeyHex,
            address: this.address
        }, password);
    }

    async unlock(encryptedData, password) {
        const decryptedData = await SecureStorage.decrypt(encryptedData, password);
        
        this.mnemonic = decryptedData.mnemonic;
        this.privateKeyHex = decryptedData.privateKey;
        this.publicKeyHex = decryptedData.publicKey;
        this.address = decryptedData.address;
        
        // Rekonstruiere andere Schlüssel-Formate
        this.privateKeyBytes = CryptoUtils.hexToBytes(this.privateKeyHex);
        this.privateKeyBigInt = BigInt('0x' + this.privateKeyHex);
        this.publicKeyBytes = CryptoUtils.hexToBytes(this.publicKeyHex);
        
        // Rekonstruiere CryptoKey für Signierung
        await this._reconstructCryptoKey();
        
        this._isLocked = false;
    }

    // Rekonstruiere CryptoKey aus Private Key Bytes
    async _reconstructCryptoKey() {
        try {
            const algorithm = {
                name: 'ECDSA',
                namedCurve: 'P-256'
            };
            
            this._cryptoKey = await crypto.subtle.importKey(
                'raw',
                this.privateKeyBytes,
                algorithm,
                true,
                ['sign']
            );
        } catch (error) {
            console.error('❌ Failed to reconstruct crypto key:', error);
            throw new Error('Failed to reconstruct cryptographic key');
        }
    }

    lock() {
        // Lösche sensitive Daten aus dem Speicher
        this.mnemonic = null;
        this.privateKeyBigInt = null;
        this.privateKeyBytes = null;
        this.privateKeyHex = null;
        this._cryptoKey = null;
        this._isLocked = true;
    }

    // Getter für sichere Informationen
    isLocked() {
        return this._isLocked;
    }

    getAddress() {
        return this.address;
    }

    getPublicKey() {
        return this.publicKeyHex;
    }

    getMnemonic() {
        if (this._isLocked) {
            throw new Error('Wallet is locked');
        }
        return this.mnemonic;
    }

    // FIX: Für Account Manager - sicherer Zugriff auf Mnemonic
    getMnemonicForDisplay() {
        if (this._isLocked) {
            throw new Error('Wallet is locked - cannot access mnemonic');
        }
        return this.mnemonic;
    }

    // Private Key für Export (nur wenn entsperrt)
    getPrivateKeyHex() {
        if (this._isLocked) {
            throw new Error('Wallet is locked');
        }
        return this.privateKeyHex;
    }

    // Erweiterte Wallet-Funktionen
    
    // Erstelle Wallet aus Private Key (für Import-Funktionalität)
    static async fromPrivateKey(privateKeyHex) {
        try {
            const wallet = new CTCWallet();
            
            // Validiere Private Key Format
            if (!privateKeyHex || privateKeyHex.length !== 64) {
                throw new Error('Invalid private key format');
            }
            
            wallet.privateKeyHex = privateKeyHex;
            wallet.privateKeyBytes = CryptoUtils.hexToBytes(privateKeyHex);
            wallet.privateKeyBigInt = BigInt('0x' + privateKeyHex);
            
            // Generiere Public Key und Adresse
            const keyPair = await wallet._generateP256KeyPair(wallet.privateKeyBytes);
            wallet.publicKeyBytes = keyPair.publicKeyBytes;
            wallet.publicKeyHex = CryptoUtils.bytesToHex(wallet.publicKeyBytes);
            wallet._cryptoKey = keyPair.privateKey;
            wallet.address = await wallet._generateAddress(wallet.publicKeyBytes);
            
            // Kein Mnemonic für importierte Wallets
            wallet.mnemonic = null;
            wallet._isLocked = false;
            
            console.log('✅ Wallet imported from private key');
            return wallet;
            
        } catch (error) {
            console.error('❌ Failed to import wallet:', error);
            throw new Error('Failed to import wallet from private key');
        }
    }

    // Validiere Wallet-Integrität
    async validateIntegrity() {
        try {
            if (this._isLocked) {
                throw new Error('Wallet is locked');
            }
            
            // Teste Signierung und Verifikation
            const testData = 'wallet-integrity-test';
            const signature = await this.sign(testData);
            const isValid = await CTCWallet.verify(testData, signature, this.publicKeyHex);
            
            if (!isValid) {
                throw new Error('Signature verification failed');
            }
            
            // Teste Adress-Generierung
            const expectedAddress = await this._generateAddress(this.publicKeyBytes);
            if (expectedAddress !== this.address) {
                throw new Error('Address generation mismatch');
            }
            
            console.log('✅ Wallet integrity validated');
            return true;
            
        } catch (error) {
            console.error('❌ Wallet integrity check failed:', error);
            return false;
        }
    }

    // Wallet-Info für Debugging
    getWalletInfo() {
        return {
            address: this.address,
            publicKey: this.publicKeyHex,
            isLocked: this._isLocked,
            hasMnemonic: !!this.mnemonic,
            hasPrivateKey: !!this.privateKeyHex && !this._isLocked,
            hasCryptoKey: !!this._cryptoKey
        };
    }

    // Sicher löschen (überschreibe sensitive Daten)
    secureDestroy() {
        // Überschreibe Arrays mit Zufallsdaten
        if (this.privateKeyBytes) {
            crypto.getRandomValues(this.privateKeyBytes);
        }
        
        // Setze alle Referenzen auf null
        this.mnemonic = null;
        this.privateKeyBigInt = null;
        this.privateKeyBytes = null;
        this.privateKeyHex = null;
        this.publicKeyBytes = null;
        this.publicKeyHex = null;
        this.address = null;
        this._cryptoKey = null;
        this._isLocked = true;
        
        console.log('🧹 Wallet securely destroyed');
    }
}

// Export für globale Verwendung
window.CTCWallet = CTCWallet;
window.CryptoUtils = CryptoUtils;
window.CTC_WORD_LIST = CTC_WORD_LIST;
