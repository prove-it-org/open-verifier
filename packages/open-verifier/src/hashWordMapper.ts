/**
 * Maps SHA-256 hashes to memorable three-word codes.
 *
 * This is the server-side port of the iOS HashWordMapper.swift.
 * IMPORTANT: The word list and algorithm MUST be kept identical to the iOS version
 * to ensure the same hash always produces the same three-word code on both platforms.
 *
 * Word count: 2816 unique words (de-duplicated)
 *
 * Algorithm:
 * - Takes the first 6 bytes (48 bits) of a hex SHA-256 hash
 * - Splits into three 16-bit segments
 * - Each segment indexes into the word dictionary via modular arithmetic
 */

/**
 * Convert a hex SHA-256 hash string into a three-word code
 * @param hash A hex-encoded SHA-256 hash (64 characters)
 * @returns A three-word string like "ocean·bright·summit"
 */
export function threeWordCode(hash: string): string {
  return threeWords(hash).join("·");
}

/**
 * Convert a hex SHA-256 hash string into an array of three words
 */
export function threeWords(hash: string): [string, string, string] {
  return threeWordsAtOffset(hash, 0);
}

/**
 * Generate three words from a specific byte offset within the hash.
 * Useful for generating alternative codes when the primary one collides.
 * SHA-256 has 32 bytes so valid offsets are 0, 6, 12, 18, 24 (5 windows).
 */
export function threeWordsAtOffset(hash: string, byteOffset: number): [string, string, string] {
  const bytes = hexToBytes(hash);
  if (bytes.length < byteOffset + 6) {
    return ["unknown", "hash", "error"];
  }

  const b = byteOffset;
  const index1 = ((bytes[b] << 8) | bytes[b + 1]) % WORD_LIST.length;
  const index2 = ((bytes[b + 2] << 8) | bytes[b + 3]) % WORD_LIST.length;
  const index3 = ((bytes[b + 4] << 8) | bytes[b + 5]) % WORD_LIST.length;

  return [WORD_LIST[index1], WORD_LIST[index2], WORD_LIST[index3]];
}

/**
 * Maximum byte offsets for fallback word-code generation from a SHA-256 hash.
 * Each window is 6 bytes wide; SHA-256 = 32 bytes → 5 non-overlapping windows.
 */
const WORD_CODE_OFFSETS = [0, 6, 12, 18, 24];

/**
 * Generate a unique three-word code for a hash, checking for collisions.
 * Tries up to 5 different byte windows from the SHA-256 hash.
 * @param hash Hex-encoded SHA-256 hash
 * @param existsCheck Async function that returns true if a word code is already taken
 * @returns A unique three-word code string
 */
export async function uniqueThreeWordCode(
  hash: string,
  existsCheck: (code: string) => Promise<boolean>
): Promise<string> {
  for (const offset of WORD_CODE_OFFSETS) {
    const code = threeWordsAtOffset(hash, offset).join("·");
    if (!(await existsCheck(code))) return code;
  }
  // Extremely unlikely: all 5 windows collided. Append a disambiguator.
  const base = threeWordCode(hash);
  let suffix = 2;
  while (await existsCheck(`${base}·${suffix}`)) {
    suffix++;
    if (suffix > 99) break;
  }
  return `${base}·${suffix}`;
}

function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i + 1 < hex.length; i += 2) {
    const byte = parseInt(hex.substring(i, i + 2), 16);
    if (!isNaN(byte)) {
      bytes.push(byte);
    }
  }
  return bytes;
}

/**
 * Curated, easy-to-read English words for watermark codes.
 * 2816 unique words -- MUST be identical to the iOS HashWordMapper.swift wordList.
 */
const WORD_LIST: string[] = [
  "ocean", "river", "stone", "flame", "frost", "coral", "cedar", "maple",
  "birch", "cloud", "storm", "blaze", "creek", "delta", "ember", "flora",
  "grove", "haven", "ivory", "lunar", "marsh", "north", "oasis", "pearl",
  "ridge", "shore", "thorn", "vapor", "wheat", "amber", "bloom", "cliff",
  "dune", "eagle", "fern", "glade", "heron", "inlet", "jade", "kelp",
  "larch", "mist", "nova", "olive", "petal", "quail", "reef", "sage",
  "tide", "vale", "wind", "aspen", "brook", "crane", "drift", "elm",
  "fjord", "glen", "hawk", "isle", "jasper", "lake", "mesa", "nest",
  "oak", "pine", "quartz", "robin", "slate", "tulip", "umber", "vine",
  "wolf", "yarrow", "zinc", "alder", "basil", "crest", "dawn", "echo",
  "finch", "grain", "holly", "iris", "juniper", "knoll", "lotus", "moss",
  "nettle", "orchid", "plume", "rain", "sand", "terra", "urchin", "violet",
  "wren", "acorn", "bay", "cave", "dew", "earth", "fawn", "gust",
  "heath", "ice", "jet", "kite", "lily", "moon", "night", "ore",
  "pond", "quill", "root", "star", "trail", "updraft", "veil", "wave",
  "yew", "zephyr", "arch", "bark", "calm", "dale", "eddy", "fir",
  "gorge", "hill", "iron", "jay", "king", "leaf", "mint", "noon",
  "palm", "quick", "rose", "snow", "twig", "unity", "vast", "wild",
  "axis", "beam", "cone", "dusk", "evergreen", "fog", "gem", "haze",
  "ivy", "jewel", "keen", "lime", "mile", "nectar", "onyx", "peak",
  "quest", "rift", "surf", "torch", "ultra", "vivid", "wisp", "xenon",
  "yield", "zone", "alpine", "breeze", "canyon", "desert", "elk", "flint",
  "granite", "harbor", "island", "jasmine", "kayak", "lagoon", "meadow", "nimbus",
  "osprey", "prairie", "rapids", "summit", "timber", "umbra", "valley", "walnut",
  "xerus", "yucca", "zenith", "arctic", "bison", "copper", "dove", "fossil",
  "glacier", "hemlock", "icicle", "jackal", "koala", "lemon", "magnet", "nutmeg",
  "opal", "pepper", "quince", "raven", "spruce", "tiger", "umbel", "vortex",
  "walrus", "yarns", "zebra", "aurora", "basalt", "cobalt", "dingo", "falcon",
  "garnet", "hazel", "indigo", "jaguar", "kumquat", "laurel", "marble", "obsidian",
  "panther", "quasar", "raptor", "saffron", "tanager", "verdigris", "wisteria", "xylem",
  "zealot", "anchor", "bluff", "citrus", "dapple", "egret", "fallow", "gazer",
  "hybrid", "igloo", "jovial", "karma", "bright", "swift", "noble", "bold",
  "clear", "crisp", "deep", "eager", "fair", "grand", "hale", "just",
  "light", "mild", "neat", "open", "prime", "quiet", "rapid", "safe",
  "true", "valid", "warm", "exact", "young", "agile", "brave", "clever",
  "deft", "elite", "firm", "great", "hardy", "ideal", "jolly", "kind",
  "lively", "merry", "oval", "proud", "ready", "sharp", "tidy", "upper",
  "vital", "wise", "adept", "brisk", "civic", "dense", "epic", "fresh",
  "glad", "honest", "inner", "joint", "lucid", "magic", "novel", "outer",
  "plain", "royal", "solid", "tough", "urban", "vocal", "whole", "active",
  "bliss", "chief", "divine", "equal", "focal", "gentle", "humble", "innate",
  "joyful", "kindred", "lofty", "modest", "neural", "optic", "placid", "radiant",
  "serene", "tender", "unique", "velvet", "worthy", "ample", "binary", "cosmic",
  "daring", "earnest", "fabled", "golden", "hearty", "iconic", "kindly", "linear",
  "mental", "nimble", "orbital", "primal", "quantum", "robust", "scenic", "triple",
  "unified", "vibrant", "woven", "annual", "benign", "candid", "docile", "eternal",
  "finite", "hidden", "immune", "kinetic", "latent", "mobile", "native", "oddly",
  "potent", "quaint", "ritual", "stable", "tactile", "unborn", "verbal", "wintry",
  "avid", "blunt", "cozy", "dry", "even", "flat", "gray", "hot",
  "icy", "jumbo", "key", "lean", "meek", "new", "odd", "pale",
  "raw", "shy", "tan", "apt", "bare", "cool", "dim", "easy",
  "full", "good", "high", "irate", "jam", "lax", "mad", "nil",
  "old", "pure", "rare", "sly", "top", "used", "vain", "wet",
  "zero", "airy", "blue", "cold", "dark", "edgy", "fine", "hard",
  "idle", "juicy", "last", "mini", "nice", "oily", "pink", "rich",
  "slim", "tall", "ugly", "void", "waxy", "zany", "able", "bent",
  "core", "dual", "evil", "hazy", "iffy", "jolt", "lame", "mock",
  "numb", "overt", "past", "quiz", "rude", "sick", "tiny", "weak",
  "bald", "cute", "drab", "fake", "grim", "huge", "jazzy", "lazy",
  "mute", "nosy", "plumb", "rash", "snug", "thin", "vague", "wiry",
  "acid", "bleak", "crude", "dire", "eerie", "frail", "gaunt", "harsh",
  "inert", "jumpy", "prism", "orbit", "nexus", "helix", "atlas", "badge",
  "cipher", "digit", "facet", "gauge", "hinge", "index", "knife", "lever",
  "medal", "notch", "pivot", "quota", "relay", "scale", "token", "valve",
  "wedge", "axiom", "block", "chord", "draft", "frame", "graph", "input",
  "joust", "knack", "logic", "macro", "nerve", "omega", "phase", "query",
  "range", "scope", "theme", "vault", "wheel", "alloy", "blade", "comet",
  "drone", "epoch", "field", "globe", "heart", "image", "lyric", "motif",
  "pixel", "realm", "sigma", "trace", "union", "vigor", "wager", "bonus",
  "cargo", "datum", "ether", "force", "gamma", "honor", "joule", "kappa",
  "laser", "modem", "nadir", "prion", "qubit", "radar", "solar", "tonic",
  "virus", "watch", "youth", "zonal", "album", "bench", "chain", "depot",
  "elbow", "flask", "hatch", "ingot", "joist", "kneel", "latch", "mural",
  "niche", "panel", "quilt", "rivet", "shelf", "usher", "clasp", "dowel",
  "easel", "forge", "gavel", "inlay", "jelly", "mortar", "oxide", "plank",
  "relic", "spool", "track", "ulcer", "wrist", "zippy", "anvil", "brace",
  "clamp", "drill", "fiber", "grout", "hoist", "lance", "mould", "patch",
  "quake", "spoke", "truss", "visor", "wrench", "allot", "bevel", "cleft",
  "dowry", "flute", "grail", "kiosk", "locus", "mocha", "plaza", "resin",
  "shard", "totem", "venom", "whirl", "bound", "craft", "depth", "float",
  "grasp", "haste", "judge", "knelt", "limit", "merit", "onset", "queue",
  "reign", "sweep", "trend", "usage", "wield", "yacht", "audio", "blend",
  "crush", "decal", "exert", "flash", "glint", "hover", "incur", "knead",
  "leapt", "mirth", "nylon", "poise", "quash", "strum", "twirl", "unify",
  "whisk", "zilch", "adapt", "boost", "carve", "diode", "evoke", "flair",
  "glaze", "hydro", "ionic", "jaunt", "micro", "naval", "ruby", "silk",
  "gold", "steel", "plaid", "linen", "suede", "satin", "brass", "azure",
  "blush", "dusty", "ebony", "gleam", "honey", "inked", "khaki", "lilac",
  "mauve", "ochre", "peach", "rouge", "shade", "taupe", "beige", "denim",
  "kraft", "lapis", "navy", "plum", "teal", "white", "aqua", "black",
  "cream", "ecru", "flax", "henna", "nude", "rust", "wine", "ashen",
  "buff", "cocoa", "drape", "gloss", "java", "knit", "laced", "matte",
  "neon", "pastel", "rayon", "sheer", "tweed", "vinyl", "acrylic", "burlap",
  "canvas", "damask", "enamel", "felt", "gauze", "hemp", "ikat", "jersey",
  "kevlar", "lycra", "muslin", "nappa", "organza", "poplin", "serge", "taffeta",
  "voile", "weft", "alpaca", "batik", "chiffon", "eyelet", "fleece", "gingham",
  "hopsack", "jute", "linen", "mohair", "oxford", "percale", "quilted", "ripstop",
  "sateen", "tulle", "viscose", "weave", "agate", "bronze", "chrome", "etch",
  "fleck", "knurl", "lustre", "nickel", "patina", "ridged", "sanded", "tinsel",
  "varnish", "antique", "brushed", "carved", "dimpled", "etched", "forged", "glazed",
  "hewn", "inlaid", "jagged", "knurled", "lacquered", "milled", "notched", "oxidized",
  "polished", "ribbed", "stamped", "tooled", "uncut", "veined", "waxed", "anodized",
  "beaten", "cast", "draped", "enameled", "filed", "ground", "hammered", "incised",
  "joined", "keyed", "lathed", "molded", "nailed", "oiled", "plated", "quenched",
  "riveted", "soldered", "turned", "veneered", "welded", "abraded", "bonded", "coated",
  "dipped", "embossed", "fused", "gilded", "honed", "imprinted", "jigsawed", "knitted",
  "loomed", "machined", "needled", "overlaid", "pressed", "rolled", "sewn", "tacked",
  "upholstered", "vulcanized", "wound", "annealed", "braided", "crimped", "dyed", "engraved",
  "felted", "galvanized", "hardened", "ironed", "jacketed", "knotted", "laminated", "mitered",
  "napped", "plied", "tower", "court", "villa", "lodge", "manor", "cabin",
  "abbey", "dome", "fort", "gate", "hall", "keep", "mill", "park",
  "port", "ramp", "shed", "tent", "ward", "attic", "bower", "camp",
  "foyer", "guild", "inn", "jetty", "loft", "nook", "outlet", "patio",
  "ranch", "salon", "turret", "wharf", "alcove", "bazaar", "cellar", "dungeon",
  "estate", "forum", "gallery", "hamlet", "junction", "kennel", "lounge", "museum",
  "office", "pagoda", "quarry", "resort", "studio", "temple", "utopia", "venue",
  "workshop", "yard", "arena", "bridge", "chapel", "diner", "embassy", "ferry",
  "gazebo", "hostel", "lantern", "market", "nursery", "orchard", "palace", "quay",
  "tavern", "uptown", "arcade", "bistro", "casino", "expo", "farm", "garden",
  "hangar", "library", "marina", "pier", "quarter", "rink", "school", "theater",
  "upland", "veranda", "winery", "annex", "bureau", "canteen", "dock", "enclave",
  "foundry", "grotto", "hearth", "marquee", "outpost", "pavilion", "retreat", "shelter",
  "terrace", "unit", "vestry", "watchtower", "alley", "bank", "cove", "dam",
  "exit", "hut", "jail", "keel", "lane", "maze", "nave", "oast",
  "pen", "span", "trap", "vent", "well", "apse", "barn", "cell",
  "dais", "edge", "grid", "helm", "jib", "loom", "moat", "oven",
  "quad", "rail", "silo", "tomb", "base", "deck", "flue", "gap",
  "hull", "jut", "lock", "mast", "node", "room", "step", "tier",
  "crib", "door", "flap", "gutter", "jamb", "ledge", "sill", "wall",
  "aisle", "cope", "eave", "gable", "hood", "knee", "lintel", "mullion",
  "newel", "ogee", "plinth", "quoin", "soffit", "upstand", "voussoir", "wainscot",
  "belfry", "column", "dormer", "entablature", "frieze", "hip", "impost", "alpha",
  "beta", "theta", "lambda", "nano", "turbo", "vector", "watt", "atom",
  "byte", "flux", "giga", "hertz", "kelvin", "meson", "neutron", "photon",
  "quark", "rotor", "servo", "tesla", "volt", "warp", "xray", "ampere",
  "boson", "codon", "exon", "fermion", "gluon", "hadron", "ion", "kaon",
  "lepton", "muon", "neutrino", "pion", "redox", "scalar", "tachyon", "upsilon",
  "vacuum", "zepto", "anode", "decode", "encode", "filter", "gateway", "invert",
  "kernel", "linked", "matrix", "output", "parse", "router", "syntax", "tensor",
  "unpack", "vertex", "widget", "array", "buffer", "cache", "debug", "error",
  "fetch", "hash", "json", "method", "null", "object", "proxy", "reset",
  "stack", "undo", "value", "write", "async", "build", "class", "drive",
  "event", "group", "host", "loop", "merge", "route", "shell", "task",
  "user", "view", "web", "api", "bit", "cpu", "dns", "edit",
  "file", "git", "html", "icon", "jpeg", "link", "map", "net",
  "os", "ping", "ram", "ssh", "tcp", "url", "vpn", "xml",
  "zip", "app", "bot", "code", "data", "font", "hook", "init",
  "join", "load", "mode", "name", "opt", "path", "run", "scan",
  "tag", "var", "wiki", "yaml", "admin", "batch", "clone", "deploy",
  "exec", "fork", "grant", "jar", "kubectl", "lint", "mount", "nuke",
  "ops", "rebase", "stage", "trunk", "unlock", "xcode", "yarn", "devops",
  "gcp", "istio", "jest", "kafka", "mongo", "nginx", "oracle", "pod",
  "redis", "spark", "trino", "ubuntu", "webpack", "xterm", "zsh", "audit",
  "chart", "embed", "flag", "guard", "issue", "jira", "kanban", "label",
  "note", "owner", "plan", "tempo", "pulse", "cycle", "shift", "surge",
  "swing", "twist", "pause", "march", "glide", "climb", "plunge", "soar",
  "swoop", "dash", "fleet", "hurry", "leap", "nudge", "pace", "roam",
  "sprint", "trek", "voyage", "wander", "ascend", "cruise", "dive", "embark",
  "fly", "gallop", "hike", "inch", "jump", "launch", "motor", "navigate",
  "onrush", "paddle", "race", "sail", "travel", "venture", "wade", "amble",
  "bolt", "chase", "escape", "flee", "gait", "hasten", "jog", "kick",
  "lunge", "mosey", "nip", "outrun", "prance", "quiver", "reel", "skip",
  "trot", "veer", "waltz", "zig", "arise", "bustle", "canter", "dart",
  "elude", "flit", "gambol", "hustle", "jostle", "limp", "meander", "nod",
  "ogle", "plod", "ramble", "sashay", "toddle", "undulate", "wobble", "yawn",
  "amass", "blitz", "clamber", "dodge", "erupt", "flail", "grind", "heave",
  "impact", "jerk", "kink", "lurch", "morph", "nuzzle", "oscillate", "quench",
  "rattle", "stagger", "tumble", "unfurl", "vibrate", "wrangle", "yank", "begin",
  "close", "delay", "end", "fast", "grow", "halt", "ignite", "kindle",
  "linger", "mend", "nourish", "persist", "quell", "renew", "start", "thrive",
  "unfold", "vanish", "wane", "yearn", "change", "decay", "emerge", "fade",
  "gather", "harden", "invoke", "lighten", "mature", "nurse", "occur", "prosper",
  "quicken", "revive", "settle", "taper", "unwind", "vary", "wax", "blink",
  "coil", "drip", "ebb", "fizz", "glow", "hum", "knock", "leak",
  "melt", "ooze", "pop", "ripple", "sway", "tick", "whir", "beat",
  "chime", "flicker", "gurgle", "hiss", "jingle", "lull", "murmur", "natter",
  "patter", "rustle", "sizzle", "thud", "ululate", "whistle", "yelp", "buzz",
  "clang", "ding", "explode", "groan", "honk", "jangle", "lash", "moan",
  "neigh", "oink", "purr", "quack", "roar", "shriek", "thump", "utter",
  "vroom", "wail", "yowl", "zap", "babble", "cackle", "drawl", "exclaim",
  "fuss", "single", "double", "penta", "hexa", "octal", "dozen", "score",
  "gross", "ounce", "pound", "dram", "cubit", "fathom", "league", "knot",
  "acre", "gallon", "pint", "quart", "bushel", "barrel", "ton", "carat",
  "newton", "pascal", "weber", "henry", "lumen", "candela", "mole", "becquerel",
  "sievert", "katal", "radian", "liter", "meter", "gram", "second", "minute",
  "hour", "daily", "weekly", "decade", "century", "first", "next", "prior",
  "final", "major", "minor", "total", "half", "third", "fifth", "sixth",
  "tenth", "mega", "tera", "peta", "exa", "zetta", "yotta", "femto",
  "pico", "milli", "centi", "deci", "hecto", "kilo", "myria", "crore",
  "lakh", "baker", "pair", "solo", "duo", "trio", "quint", "sept",
  "oct", "non", "dec", "square", "cube", "power", "ratio", "mean",
  "phi", "chi", "psi", "epsilon", "zeta", "eta", "iota", "mu",
  "nu", "xi", "omicron", "pi", "rho", "tau", "count", "sum",
  "max", "min", "width", "height", "length", "area", "volume", "mass",
  "speed", "energy", "work", "heat", "sound", "charge", "density", "pressure",
  "tension", "stress", "strain", "torque", "impulse", "moment", "inertia", "thrust",
  "drag", "lift", "weight", "pitch", "roll", "yaw", "spin", "bend",
  "shear", "bulk", "creep", "fatigue", "rupture", "fracture", "shock", "blast",
  "spike", "dip", "drop", "rise", "gain", "loss", "tare", "triad",
  "tetrad", "pentad", "hexad", "heptad", "octad", "ennead", "decad", "monad",
  "dyad", "triune", "ternary", "quaternary", "quinary", "senary", "septenary", "octonary",
  "novenary", "denary", "duodecimal", "vigesimal", "centurial", "millesimal", "googol", "myriad",
  "plethora", "legion", "horde", "swarm", "flock", "herd", "pack", "pride",
  "colony", "troop", "band", "cohort", "brigade", "armada", "convoy", "caravan",
  "cortege", "truth", "faith", "grace", "valor", "peace", "charm", "dream",
  "ethos", "glory", "hope", "mercy", "oath", "soul", "trust", "wisdom",
  "zeal", "aura", "bond", "creed", "duty", "ethic", "guile", "irony",
  "joy", "kinship", "lore", "omen", "rite", "truce", "urge", "verve",
  "will", "boon", "grit", "hue", "idea", "joke", "luck", "mood",
  "norm", "quote", "rule", "sign", "tone", "whim", "zest", "aim",
  "bias", "clue", "dare", "ease", "fact", "hint", "jab", "law",
  "myth", "need", "odds", "plea", "quirk", "risk", "sake", "tact",
  "use", "vow", "way", "awe", "bane", "cost", "debt", "fame",
  "gift", "heed", "irk", "ken", "opus", "pact", "rank", "skill",
  "trait", "verse", "writ", "ardor", "brio", "gusto", "hubris", "intent",
  "jurist", "kudos", "libel", "maxim", "onus", "pathos", "quorum", "rigor",
  "schism", "tenor", "umbrage", "vanity", "whimsy", "xeric", "yonder", "zealous",
  "acumen", "bounty", "candor", "decree", "enigma", "fervor", "gambit", "heresy",
  "impetus", "jargon", "kismet", "legacy", "malice", "nuance", "paradigm", "quarrel",
  "respite", "stigma", "tempest", "utmost", "virtue", "warrant", "anarchy", "brevity",
  "censure", "dogma", "equity", "fallacy", "grandeur", "inquest", "justice", "kinesis",
  "litany", "mandate", "nemesis", "ordeal", "precept", "rancor", "solace", "tenet",
  "vendetta", "wraith", "amnesty", "beacon", "dictum", "edict", "fable", "genesis",
  "idiom", "jubilee", "keystone", "lexicon", "mantra", "proverb", "rubric", "saga",
  "thesis", "veritas", "ballad", "canon", "dirge", "elegy", "gospel", "hymnal",
  "idyll", "koan", "limerick", "memoir", "opera", "psalm", "quatrain", "rhyme",
  "sonnet", "anthem", "chant", "ditty", "fugue", "glee", "haiku", "incantation",
  "jig", "lay", "madrigal", "nocturne", "apple", "bread", "dates", "eggs",
  "fig", "grape", "kale", "mango", "rice", "sugar", "thyme", "umami",
  "vanilla", "yam", "almond", "dill", "elder", "fennel", "ginger", "kiwi",
  "melon", "orange", "papaya", "quinoa", "radish", "soy", "tofu", "vinegar",
  "yeast", "anise", "berry", "clove", "dough", "edamame", "fudge", "guava",
  "icing", "leek", "nori", "oat", "quiche", "rosemary", "taco", "udon",
  "wasabi", "yogurt", "acai", "beet", "carrot", "daikon", "endive", "garlic",
  "herb", "iceberg", "jicama", "lentil", "millet", "naan", "okra", "parsley",
  "raisin", "sesame", "turnip", "ube", "voila", "watercress", "artichoke", "broccoli",
  "chard", "durian", "escarole", "farro", "gouda", "hummus", "injera", "jalapeno",
  "kohlrabi", "lavender", "miso", "nougat", "orzo", "pesto", "ramen", "tempeh",
  "ugli", "vindaloo", "wakame", "ziti", "aioli", "balsamic", "cashew", "espresso",
  "fondue", "granola", "halva", "infusion", "julep", "kimchi", "latte", "matcha",
  "oolong", "praline", "queso", "risotto", "sorbet", "tahini", "ume", "compote",
  "waffle", "yuzu", "arugula", "brioche", "ceviche", "dumpling", "focaccia", "gnocchi",
  "harissa", "idli", "jaggery", "kefir", "linguine", "mochi", "oden", "paneer",
  "quesadilla", "ravioli", "samosa", "tiramisu", "unagi", "vol", "wonton", "xiao",
  "yakitori", "zaatar", "anchovy", "baguette", "calzone", "dolma", "empanada", "falafel",
  "gyoza", "hoisin", "ikan", "katsu", "laksa", "mandu", "nacho", "oyster",
  "pho", "quenelle", "roti", "sushi", "tapenade", "vinaigrette", "wafer", "xacuti",
  "yakisoba", "achar", "baklava", "chutney", "dashi", "empanada", "frangipane", "galette",
  "hollandaise", "jus", "korma", "larb", "marinade", "nuoc", "panna", "ragout",
  "salsa", "teriyaki", "umeboshi", "zabaglione", "aperitif", "broth", "cider", "elixir",
  "frappe", "grappa", "horchata", "juice", "kombucha", "limeade", "mead", "nog",
  "ouzo", "punch", "quaff", "rum", "tisane", "usquebaugh", "vermouth", "whiskey",
  "xeres", "yerba", "zinfandel", "absinthe", "bourbon", "cognac", "daiquiri", "gimlet",
  "highball", "bear", "crow", "deer", "fox", "goat", "ibis", "lynx",
  "moose", "newt", "otter", "puma", "swan", "trout", "viper", "whale",
  "yak", "ant", "bat", "cat", "dog", "eel", "frog", "goose",
  "hare", "iguana", "koi", "lamb", "narwhal", "owl", "parrot", "quetzal",
  "rat", "seal", "toad", "unicorn", "vulture", "wombat", "zebu", "ape",
  "boar", "carp", "ferret", "gecko", "hippo", "impala", "jellyfish", "kingfisher",
  "lemur", "marten", "numbat", "octopus", "panda", "quokka", "sloth", "tapir",
  "umbrellabird", "vicuna", "wallaby", "xenops", "yellowtail", "zorilla", "albatross", "buffalo",
  "condor", "dolphin", "ermine", "flamingo", "gorilla", "ibex", "kestrel", "leopard",
  "macaw", "nightjar", "ocelot", "pelican", "quahog", "raccoon", "stork", "toucan",
  "uakari", "vole", "warbler", "xiphias", "yellowhammer", "zebrafish", "aardvark", "badger",
  "chameleon", "dugong", "echidna", "flounder", "gibbon", "herring", "jackdaw", "kangaroo",
  "lamprey", "manatee", "nautilus", "opossum", "piranha", "rooster", "sardine", "terrapin",
  "upupa", "vervet", "warthog", "yeti", "zander", "anaconda", "barracuda", "cheetah",
  "elephant", "gazelle", "hamster", "jacana", "kudu", "lobster", "mongoose", "nighthawk",
  "orang", "penguin", "reindeer", "scorpion", "tamarin", "weasel", "xenopus", "yellowfin",
  "alligator", "bumblebee", "catfish", "dragonfly", "firefly", "grasshopper", "hornet", "inchworm",
  "junco", "katydid", "ladybug", "mantis", "nuthatch", "porcupine", "roadrunner", "starling",
  "termite", "urial", "viceroy", "woodpecker", "xeme", "yellowjacket", "zooplankton", "aphid",
  "beetle", "cicada", "damselfly", "earwig", "flea", "gnat", "horsefly", "isopod",
  "june", "killdeer", "lacewing", "mayfly", "nymph", "orb", "pill", "queen",
  "roach", "sawfly", "thrip", "urania", "vapourer", "wasp", "xerces", "zigzag",
  "admiral", "bluebottle", "cabbage", "death", "emperor", "fritillary", "grayling", "hairstreak",
  "io", "julia", "karner", "lycaenid", "monarch", "nymphalid", "painted", "ringlet",
  "satyr", "tortoiseshell", "ulysses", "vanessa", "yellow", "brown", "clouded", "dotted",
  "elfin", "forester", "ghost", "iridescent", "jezebel", "long", "question", "red",
  "skipper", "vein", "wood", "drum", "guitar", "harp", "jazz", "keys",
  "lyre", "melody", "oboe", "piano", "quintet", "rhythm", "song", "treble",
  "ukulele", "viola", "xylophone", "yodel", "zither", "aria", "bass", "cello",
  "ensemble", "fiddle", "gong", "horn", "interlude", "kazoo", "lullaby", "polka",
  "quartet", "samba", "tango", "upbeat", "violin", "choir", "duet", "etude",
  "gavotte", "hymn", "improv", "jamming", "keynote", "largo", "minuet", "overture",
  "prelude", "refrain", "sonata", "unison", "vibrato", "accent", "cadence", "encore",
  "forte", "glissando", "harmony", "intro", "jive", "legato", "mezzo", "natural",
  "octave", "pedal", "quaver", "rest", "staccato", "bar", "clef", "eighth",
  "fermata", "interval", "ledger", "measure", "ninth", "ornament", "phrase", "repeat",
  "sixteenth", "tie", "vamp", "brush", "daub", "ink", "kiln", "layer",
  "palette", "sketch", "tint", "wash", "bistre", "charcoal", "drypoint", "fresco",
  "gouache", "hatching", "impasto", "japan", "kolinsky", "linseed", "medium", "nib",
  "oil", "render", "sepia", "tempera", "undercoat", "watercolor", "abstract", "baroque",
  "cubism", "dada", "expressionism", "fauvism", "gothic", "hyperrealism", "impressionism", "jugendstil",
  "luminism", "minimalism", "neoclassical", "op", "renaissance", "surrealism", "tenebrism", "ukiyo",
  "vorticism", "wabi", "collage", "decoupage", "etching", "frottage", "graffiti", "intaglio",
  "jacquard", "kintsugi", "lithograph", "mosaic", "needlework", "origami", "printmaking", "quilting",
  "relief", "sculpture", "tapestry", "vitreography", "woodcut", "xeriscape", "zentangle", "acanthus",
  "brocade", "cameo", "damascene", "filigree", "gilt", "heraldic", "porcelain", "lacquer",
  "marquetry", "netsuke", "ormolu", "pietra", "quatrefoil", "repousse", "scrimshaw", "trompe",
  "urushi", "volute", "wedgwood", "xoanon", "zellige", "intaglio", "bezel", "cabochon",
  "electrotype", "granulation", "hallmark", "japanned", "keum", "lost", "millefiori", "niello",
  "openwork", "parcel", "quilling", "reticello", "sgraffito", "toreutic", "underglaze", "vermeil",
  "cirrus", "drizzle", "eclipse", "gale", "hail", "lightning", "overcast", "powder",
  "rainbow", "sleet", "thunder", "whirlwind", "atoll", "blizzard", "cumulus", "equinox",
  "flurry", "humid", "jetstream", "katabatic", "lee", "monsoon", "norther", "ozone",
  "rime", "squall", "tornado", "ultraviolet", "visibility", "westerly", "altitude", "barometer",
  "chinook", "doldrums", "easterly", "front", "gradient", "inversion", "lapse", "meridian",
  "northerly", "occluded", "polar", "quasi", "solstice", "tropic", "veering", "adiabatic",
  "backing", "divergence", "evaporation", "freezing", "geostrophic", "hydrostatic", "isobar", "mesoscale",
  "nucleation", "orographic", "precipitation", "radiation", "saturation", "thermocline", "unstable", "xerothermic",
  "advection", "boundary", "convection", "dewpoint", "entrainment", "friction", "humidity", "instability",
  "moisture", "nucleus", "oscillation", "relative", "thermal", "upwelling", "anemometer", "barograph",
  "ceilometer", "dropsonde", "evaporimeter", "forecast", "hygrometer", "lidar", "metar", "nephoscope",
  "ombroscope", "pilot", "radiosonde", "satellite", "theodolite", "vane", "weather", "bow",
  "cap", "downdraft", "eye", "funnel", "inflow", "knuckle", "line", "mammatus",
  "outflow", "tail", "arcus", "beaver", "collar", "derecho", "flank", "green",
  "horseshoe", "lenticular", "meso", "nacreous", "pileus", "scud", "tuba", "undulatus",
  "virga", "alto", "billow", "castellanus", "debris", "fibratus", "genitus", "homogenitus",
  "incus", "lacunosus", "mediocris", "nebulosus", "opacus", "pannus", "radiatus", "stratiformis",
  "translucidus", "velum", "accessorius", "calvus", "capillatus", "congestus", "duplicatus", "floccus",
  "fractus", "humilis", "intortus", "lenticularis", "perlucidus", "praecipitatio", "spissatus", "uncinus",
  "vertebratus", "volutus", "acacia", "bamboo", "cactus", "dahlia", "edelweiss", "freesia",
  "gardenia", "hibiscus", "kudzu", "magnolia", "narcissus", "peony", "rhododendron", "sunflower",
  "thistle", "umbrella", "verbena", "xeranthemum", "zinnia", "aster", "begonia", "carnation",
  "daisy", "erica", "foxglove", "geranium", "heather", "impatiens", "jonquil", "kalmia",
  "marigold", "nasturtium", "oleander", "primrose", "ranunculus", "snapdragon", "tuberose", "urtica",
  "wallflower", "xanthium", "zephyranthes", "anemone", "bluebell", "chrysanthemum", "delphinium", "echinacea",
  "fuchsia", "gladiolus", "hyacinth", "iberis", "jessamine", "kniphofia", "lupine", "mimosa",
  "nemophila", "oxalis", "pansy", "salvia", "trillium", "vinca", "wattle", "xerophyte",
  "zamia", "azalea", "bougainvillea", "clematis", "datura", "euphorbia", "forsythia", "genista",
  "hosta", "ipomoea", "jacaranda", "kalanchoe", "lantana", "mandevilla", "nerium", "osmanthus",
  "plumbago", "quercus", "spiraea", "tamarix", "ulmus", "viburnum", "weigela", "xanthoceras",
  "zelkova", "baobab", "cypress", "dogwood", "eucalyptus", "ginkgo", "hornbeam", "ilex",
  "kauri", "linden", "mahogany", "neem", "quaking", "redwood", "sequoia", "tamarind",
  "vetch", "willow", "xylosma", "acer", "betula", "catalpa", "diospyros", "fraxinus",
  "gleditsia", "hackberry", "ironwood", "koelreuteria", "liquidambar", "metasequoia", "nyssa", "ostrya",
  "platanus", "robinia", "sassafras", "tilia", "yellowwood", "ailanthus", "gum", "hawthorn",
  "incense", "kalopanax", "mulberry", "osage", "persimmon", "redbud", "whitebark", "abies",
  "coast", "douglas", "engelmann", "fraser", "idaho", "jack", "knobcone", "lodgepole",
  "monterey", "norway", "oregon", "ponderosa", "scots", "tamarack", "utah", "virginia",
  "balsam", "conifer", "deciduous", "forest", "hardwood", "jungle", "lowland", "montane",
  "needleleaf", "plantation", "rainforest", "savanna", "taiga", "understory", "virgin", "woodland",
  "yearling", "arboretum", "boreal", "canopy", "dell", "ecotone", "fen", "interfluve",
  "lea", "moor", "parkland", "steppe", "thicket", "wetland", "arbor", "copse",
  "enclosure", "hedge", "jardin", "lawn", "parterre", "rosary", "shrubbery", "topiary",
  "vineyard", "walled", "zen", "allotment", "bed", "clump", "edging", "fence",
  "mound", "rockery", "sundial", "trellis", "urn", "vista", "walk", "xyst",
  "border", "cascade", "espalier", "fountain", "ha", "labyrinth", "obelisk", "pergola",
  "rotunda", "statue", "belvedere", "colonnade", "exedra", "folly", "hermitage", "loggia",
  "monument", "summerhouse", "walkway", "camellia", "daphne", "agave", "bonsai", "calla",
  "dianthus", "frangipani", "gerbera", "hellebore", "myrtle", "nerine", "protea", "stephanotis",
];
