/**
 * NIRDHOOM Sathi: Telegram bot copy in Punjabi, Hindi and English, plus the
 * helpers that pick a language and route free-text messages to an action.
 *
 * Kept separate from the webhook so the conversation can be reviewed and
 * translated without touching request handling.
 */

export type BotLang = 'pa' | 'hi' | 'en';
export type BotAction = 'fields' | 'book' | 'track' | 'verify' | 'market' | 'status' | 'help' | 'language';

export const BOT_LANGS: BotLang[] = ['pa', 'hi', 'en'];

/** Telegram language_code, or the script the farmer typed in, decides the reply language. */
export function detectLang(languageCode?: string | null, text?: string | null): BotLang {
  if (text && /[਀-੿]/.test(text)) return 'pa';
  if (text && /[ऀ-ॿ]/.test(text)) return 'hi';
  const code = String(languageCode || '').toLowerCase();
  if (code.startsWith('pa')) return 'pa';
  if (code.startsWith('hi')) return 'hi';
  return 'en';
}

export function isLang(value: unknown): value is BotLang {
  return value === 'pa' || value === 'hi' || value === 'en';
}

/** Free-text routing: farmers rarely type slash commands. */
const KEYWORDS: Array<[BotAction, RegExp]> = [
  ['book', /\b(book|booking|pickup|pick up|clear|clearance|baler)\b|ਬੁੱ?ਕ|ਬੁਕਿੰਗ|ਚੁਕ|बुक|बुकिंग|उठवा|पराली उठा/i],
  ['track', /\b(track|machine|tractor|where|gps|location)\b|ਮਸ਼ੀਨ|ਟ੍ਰੈਕ|ਕਿੱਥੇ|मशीन|ट्रैक|कहाँ|कहां/i],
  ['fields', /\b(field|fields|farm|khasra)\b|ਖੇਤ|ਖਸਰਾ|खेत|खसरा/i],
  ['verify', /\b(proof|verify|verification|evidence|satellite|fire)\b|ਸਬੂਤ|ਤਸਦੀਕ|ਅੱਗ|सबूत|सत्यापन|आग/i],
  ['market', /\b(market|buyer|sell|price|residue|parali)\b|ਮੰਡੀ|ਖਰੀਦ|ਵੇਚ|ਪਰਾਲੀ|मंडी|खरीद|बेच|पराली/i],
  ['status', /\b(status|update)\b|ਸਟੇਟਸ|ਹਾਲ|स्टेटस|हाल/i],
  ['language', /\b(language|lang)\b|ਭਾਸ਼ਾ|भाषा/i],
  ['help', /\b(help|menu|hi|hello|start)\b|ਮਦਦ|ਸਤ ਸ੍ਰੀ ਅਕਾਲ|मदद|नमस्ते/i],
];

export function routeText(text: string): BotAction | null {
  const command = text.match(/^\/(status|fields|book|track|verify|market|help|menu|language|lang)\b/i)?.[1]?.toLowerCase();
  if (command) {
    if (command === 'menu') return 'help';
    if (command === 'lang') return 'language';
    return command as BotAction;
  }
  for (const [action, pattern] of KEYWORDS) if (pattern.test(text)) return action;
  return null;
}

/** Website routes that each action opens (hash routes of the NIRDHOOM web app). */
export const ACTION_VIEW: Record<string, { view: string; hash: string }> = {
  fields: { view: 'fields', hash: '#/field-jobs' },
  book: { view: 'booking', hash: '#/farmer-onboarding' },
  track: { view: 'tracking', hash: '#/ops-console' },
  verify: { view: 'verification', hash: '#/satellite-audit' },
  market: { view: 'market', hash: '#/residue-pools' },
  status: { view: '', hash: '' },
};

type Copy = {
  welcome: (name: string) => string;
  menuTitle: string;
  languagePrompt: string;
  languageSet: string;
  unknown: string;
  buttons: Record<'fields' | 'book' | 'track' | 'verify' | 'market' | 'status' | 'open', string>;
  open: Record<'fields' | 'book' | 'track' | 'verify' | 'market' | 'status', string>;
  linkFirst: string;
  linked: string;
  linkInvalid: string;
  fields: (s: { fieldCount: number; activeCount: number; verifiedCount: number; latest?: string }) => string;
  fieldsUnlinked: string;
  book: (linked: boolean) => string;
  track: (linked: boolean) => string;
  verify: string;
  market: string;
  status: (s: { fieldCount: number; activeCount: number; verifiedCount: number }) => string;
  statusUnlinked: string;
  help: string;
  photo: (linked: boolean) => string;
  basicMode: string;
};

export const COPY: Record<BotLang, Copy> = {
  en: {
    welcome: (name) => `ਸਤ ਸ੍ਰੀ ਅਕਾਲ / नमस्ते ${name}! 🌾\n\nI’m NIRDHOOM Sathi. Use the buttons below for fields, clearance, tracking, verification and residue pathways. Live capacity and operational status are only reported from authenticated NIRDHOOM records.\n\nYou can also just type: book, machine, field, proof or market.`,
    menuTitle: 'NIRDHOOM Sathi menu:',
    languagePrompt: 'Choose your language / ਭਾਸ਼ਾ ਚੁਣੋ / भाषा चुनें',
    languageSet: 'Language set to English.',
    unknown: 'I can help with NIRDHOOM field operations. Choose an action below.',
    buttons: { fields: '🌾 My fields', book: '🚜 Book clearance', track: '📍 Track machine', verify: '🧾 Verification', market: '🌱 Residue market', status: '📊 My status', open: '📱 Open NIRDHOOM' },
    open: { fields: 'Open My Fields', book: 'Book clearance', track: 'Track operation', verify: 'Review evidence', market: 'Open residue market', status: 'Open NIRDHOOM' },
    linkFirst: 'Link your NIRDHOOM account first. Open NIRDHOOM on the web, go to Telegram Help and tap “Connect my NIRDHOOM account”.',
    linked: '✅ Telegram is securely linked to your NIRDHOOM farmer profile. Your private field status can now be shown here.',
    linkInvalid: 'This linking link is invalid or expired. Start a new link from your authenticated NIRDHOOM account.',
    fields: (s) => `🌾 Your NIRDHOOM fields\n\nRegistered: ${s.fieldCount}\nActive operations: ${s.activeCount}\nVerified fields: ${s.verifiedCount}${s.latest ? `\nLatest field: ${s.latest}` : ''}`,
    fieldsUnlinked: '🌾 Link your NIRDHOOM account first to see your private field status.',
    book: (linked) => linked ? '🚜 Start a clearance request from your linked NIRDHOOM account. The booking screen will show only the fields and capacity checks available to your account.' : '🚜 Link your NIRDHOOM account first, then start a clearance request.',
    track: (linked) => linked ? '📍 Machine tracking uses authenticated operator telemetry. A stale reading is shown as stale rather than treated as current.' : '📍 Link your NIRDHOOM account first to see field-scoped tracking.',
    verify: '🧾 Verification combines field provenance, operator evidence and supporting remote-sensing observations. A missing satellite detection is not proof that no burning occurred.',
    market: '🌱 Only residue that passes the required verification and pooling gates should enter a buyer pathway. A buyer need is not a contract.',
    status: (s) => `📊 NIRDHOOM status\n\nFields: ${s.fieldCount}\nActive operations: ${s.activeCount}\nVerified fields: ${s.verifiedCount}`,
    statusUnlinked: '📊 No linked farmer account was found. Use NIRDHOOM on the web to securely connect Telegram.',
    help: 'NIRDHOOM Sathi can help with:\n\n🌾 /fields — your fields\n🚜 /book — book a parali pickup\n📍 /track — where is the machine\n🧾 /verify — field proof\n🌱 /market — where residue can go\n📊 /status — summary\n🌐 /language — ਪੰਜਾਬੀ / हिंदी / English\n\nOr just type a word like “machine” or “book”.',
    photo: (linked) => linked ? '📷 Photo received. It is not treated as verification evidence until NIRDHOOM can associate it with an authenticated job/operator record.' : '📷 Photo received. Link your NIRDHOOM account first so evidence can be tied to your field.',
    basicMode: 'ℹ️ Account features are temporarily unavailable. General help still works.',
  },
  hi: {
    welcome: (name) => `नमस्ते ${name}! 🌾\n\nमैं NIRDHOOM साथी हूँ। नीचे दिए बटन से अपने खेत, पराली उठवाने की बुकिंग, मशीन ट्रैकिंग, सबूत और पराली बाज़ार देखें। लाइव क्षमता और स्टेटस केवल प्रमाणित NIRDHOOM रिकॉर्ड से दिखाए जाते हैं।\n\nआप सीधे लिख भी सकते हैं: बुक, मशीन, खेत, सबूत या मंडी।`,
    menuTitle: 'NIRDHOOM साथी मेनू:',
    languagePrompt: 'अपनी भाषा चुनें / ਭਾਸ਼ਾ ਚੁਣੋ / Choose your language',
    languageSet: 'भाषा हिंदी कर दी गई है।',
    unknown: 'मैं NIRDHOOM खेत के कामों में मदद कर सकता हूँ। नीचे से कोई विकल्प चुनें।',
    buttons: { fields: '🌾 मेरे खेत', book: '🚜 पराली उठवाएँ', track: '📍 मशीन ट्रैक करें', verify: '🧾 सबूत', market: '🌱 पराली मंडी', status: '📊 मेरा स्टेटस', open: '📱 NIRDHOOM खोलें' },
    open: { fields: 'मेरे खेत खोलें', book: 'बुकिंग करें', track: 'मशीन देखें', verify: 'सबूत देखें', market: 'पराली मंडी खोलें', status: 'NIRDHOOM खोलें' },
    linkFirst: 'पहले अपना NIRDHOOM खाता जोड़ें। वेबसाइट पर NIRDHOOM खोलें, Telegram Help में जाएँ और “Connect my NIRDHOOM account” दबाएँ।',
    linked: '✅ Telegram आपके NIRDHOOM किसान प्रोफ़ाइल से सुरक्षित रूप से जुड़ गया है। अब आपके खेत का स्टेटस यहाँ दिखेगा।',
    linkInvalid: 'यह लिंक अमान्य है या इसकी समय-सीमा खत्म हो गई है। अपने NIRDHOOM खाते से नया लिंक बनाएँ।',
    fields: (s) => `🌾 आपके NIRDHOOM खेत\n\nपंजीकृत: ${s.fieldCount}\nचालू काम: ${s.activeCount}\nसत्यापित खेत: ${s.verifiedCount}${s.latest ? `\nताज़ा खेत: ${s.latest}` : ''}`,
    fieldsUnlinked: '🌾 अपने खेत का स्टेटस देखने के लिए पहले NIRDHOOM खाता जोड़ें।',
    book: (linked) => linked ? '🚜 अपने जुड़े हुए NIRDHOOM खाते से पराली उठवाने का अनुरोध शुरू करें। बुकिंग स्क्रीन पर सिर्फ़ आपके खेत और उपलब्ध क्षमता दिखेगी।' : '🚜 पहले अपना NIRDHOOM खाता जोड़ें, फिर बुकिंग शुरू करें।',
    track: (linked) => linked ? '📍 मशीन की लोकेशन प्रमाणित ऑपरेटर GPS से आती है। पुरानी लोकेशन को पुरानी ही दिखाया जाता है।' : '📍 मशीन ट्रैकिंग देखने के लिए पहले NIRDHOOM खाता जोड़ें।',
    verify: '🧾 सत्यापन में खेत का रिकॉर्ड, ऑपरेटर के सबूत और सैटेलाइट जानकारी मिलाई जाती है। सैटेलाइट पर आग न दिखना, आग न लगने का पक्का सबूत नहीं है।',
    market: '🌱 केवल सत्यापित पराली ही खरीदार तक जानी चाहिए। खरीदार की माँग कोई पक्का सौदा नहीं है।',
    status: (s) => `📊 NIRDHOOM स्टेटस\n\nखेत: ${s.fieldCount}\nचालू काम: ${s.activeCount}\nसत्यापित खेत: ${s.verifiedCount}`,
    statusUnlinked: '📊 कोई जुड़ा हुआ किसान खाता नहीं मिला। Telegram जोड़ने के लिए वेबसाइट पर NIRDHOOM खोलें।',
    help: 'NIRDHOOM साथी इनमें मदद करता है:\n\n🌾 /fields — आपके खेत\n🚜 /book — पराली उठवाने की बुकिंग\n📍 /track — मशीन कहाँ है\n🧾 /verify — खेत का सबूत\n🌱 /market — पराली कहाँ जा सकती है\n📊 /status — सारांश\n🌐 /language — ਪੰਜਾਬੀ / हिंदी / English\n\nया सीधे “मशीन” या “बुक” लिखें।',
    photo: (linked) => linked ? '📷 फ़ोटो मिल गई। जब तक यह किसी प्रमाणित काम से नहीं जुड़ती, इसे सत्यापन का सबूत नहीं माना जाएगा।' : '📷 फ़ोटो मिल गई। पहले NIRDHOOM खाता जोड़ें ताकि सबूत आपके खेत से जुड़ सके।',
    basicMode: 'ℹ️ खाते से जुड़ी सुविधाएँ अभी उपलब्ध नहीं हैं। सामान्य मदद चालू है।',
  },
  pa: {
    welcome: (name) => `ਸਤ ਸ੍ਰੀ ਅਕਾਲ ${name}! 🌾\n\nਮੈਂ NIRDHOOM ਸਾਥੀ ਹਾਂ। ਹੇਠਾਂ ਦਿੱਤੇ ਬਟਨਾਂ ਨਾਲ ਆਪਣੇ ਖੇਤ, ਪਰਾਲੀ ਚੁਕਵਾਉਣ ਦੀ ਬੁਕਿੰਗ, ਮਸ਼ੀਨ ਟ੍ਰੈਕਿੰਗ, ਸਬੂਤ ਅਤੇ ਪਰਾਲੀ ਮੰਡੀ ਵੇਖੋ। ਲਾਈਵ ਸਮਰੱਥਾ ਅਤੇ ਸਟੇਟਸ ਸਿਰਫ਼ ਪ੍ਰਮਾਣਿਤ NIRDHOOM ਰਿਕਾਰਡ ਤੋਂ ਦਿਖਾਇਆ ਜਾਂਦਾ ਹੈ।\n\nਤੁਸੀਂ ਸਿੱਧਾ ਲਿਖ ਵੀ ਸਕਦੇ ਹੋ: ਬੁਕ, ਮਸ਼ੀਨ, ਖੇਤ, ਸਬੂਤ ਜਾਂ ਮੰਡੀ।`,
    menuTitle: 'NIRDHOOM ਸਾਥੀ ਮੀਨੂ:',
    languagePrompt: 'ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ / भाषा चुनें / Choose your language',
    languageSet: 'ਭਾਸ਼ਾ ਪੰਜਾਬੀ ਕਰ ਦਿੱਤੀ ਗਈ ਹੈ।',
    unknown: 'ਮੈਂ NIRDHOOM ਖੇਤ ਦੇ ਕੰਮਾਂ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਹੇਠਾਂ ਤੋਂ ਕੋਈ ਚੋਣ ਕਰੋ।',
    buttons: { fields: '🌾 ਮੇਰੇ ਖੇਤ', book: '🚜 ਪਰਾਲੀ ਚੁਕਵਾਓ', track: '📍 ਮਸ਼ੀਨ ਟ੍ਰੈਕ ਕਰੋ', verify: '🧾 ਸਬੂਤ', market: '🌱 ਪਰਾਲੀ ਮੰਡੀ', status: '📊 ਮੇਰਾ ਸਟੇਟਸ', open: '📱 NIRDHOOM ਖੋਲ੍ਹੋ' },
    open: { fields: 'ਮੇਰੇ ਖੇਤ ਖੋਲ੍ਹੋ', book: 'ਬੁਕਿੰਗ ਕਰੋ', track: 'ਮਸ਼ੀਨ ਵੇਖੋ', verify: 'ਸਬੂਤ ਵੇਖੋ', market: 'ਪਰਾਲੀ ਮੰਡੀ ਖੋਲ੍ਹੋ', status: 'NIRDHOOM ਖੋਲ੍ਹੋ' },
    linkFirst: 'ਪਹਿਲਾਂ ਆਪਣਾ NIRDHOOM ਖਾਤਾ ਜੋੜੋ। ਵੈੱਬਸਾਈਟ ’ਤੇ NIRDHOOM ਖੋਲ੍ਹੋ, Telegram Help ਵਿੱਚ ਜਾਓ ਅਤੇ “Connect my NIRDHOOM account” ਦਬਾਓ।',
    linked: '✅ Telegram ਤੁਹਾਡੇ NIRDHOOM ਕਿਸਾਨ ਪ੍ਰੋਫ਼ਾਈਲ ਨਾਲ ਸੁਰੱਖਿਅਤ ਤਰੀਕੇ ਨਾਲ ਜੁੜ ਗਿਆ ਹੈ। ਹੁਣ ਤੁਹਾਡੇ ਖੇਤ ਦਾ ਸਟੇਟਸ ਇੱਥੇ ਦਿਖੇਗਾ।',
    linkInvalid: 'ਇਹ ਲਿੰਕ ਗਲਤ ਹੈ ਜਾਂ ਇਸਦਾ ਸਮਾਂ ਖਤਮ ਹੋ ਗਿਆ ਹੈ। ਆਪਣੇ NIRDHOOM ਖਾਤੇ ਤੋਂ ਨਵਾਂ ਲਿੰਕ ਬਣਾਓ।',
    fields: (s) => `🌾 ਤੁਹਾਡੇ NIRDHOOM ਖੇਤ\n\nਰਜਿਸਟਰਡ: ${s.fieldCount}\nਚੱਲ ਰਹੇ ਕੰਮ: ${s.activeCount}\nਤਸਦੀਕ ਹੋਏ ਖੇਤ: ${s.verifiedCount}${s.latest ? `\nਤਾਜ਼ਾ ਖੇਤ: ${s.latest}` : ''}`,
    fieldsUnlinked: '🌾 ਆਪਣੇ ਖੇਤ ਦਾ ਸਟੇਟਸ ਵੇਖਣ ਲਈ ਪਹਿਲਾਂ NIRDHOOM ਖਾਤਾ ਜੋੜੋ।',
    book: (linked) => linked ? '🚜 ਆਪਣੇ ਜੁੜੇ ਹੋਏ NIRDHOOM ਖਾਤੇ ਤੋਂ ਪਰਾਲੀ ਚੁਕਵਾਉਣ ਦੀ ਬੇਨਤੀ ਸ਼ੁਰੂ ਕਰੋ। ਬੁਕਿੰਗ ਸਕ੍ਰੀਨ ’ਤੇ ਸਿਰਫ਼ ਤੁਹਾਡੇ ਖੇਤ ਅਤੇ ਉਪਲਬਧ ਸਮਰੱਥਾ ਦਿਖੇਗੀ।' : '🚜 ਪਹਿਲਾਂ ਆਪਣਾ NIRDHOOM ਖਾਤਾ ਜੋੜੋ, ਫਿਰ ਬੁਕਿੰਗ ਸ਼ੁਰੂ ਕਰੋ।',
    track: (linked) => linked ? '📍 ਮਸ਼ੀਨ ਦੀ ਲੋਕੇਸ਼ਨ ਪ੍ਰਮਾਣਿਤ ਆਪਰੇਟਰ GPS ਤੋਂ ਆਉਂਦੀ ਹੈ। ਪੁਰਾਣੀ ਲੋਕੇਸ਼ਨ ਨੂੰ ਪੁਰਾਣੀ ਹੀ ਦਿਖਾਇਆ ਜਾਂਦਾ ਹੈ।' : '📍 ਮਸ਼ੀਨ ਟ੍ਰੈਕਿੰਗ ਵੇਖਣ ਲਈ ਪਹਿਲਾਂ NIRDHOOM ਖਾਤਾ ਜੋੜੋ।',
    verify: '🧾 ਤਸਦੀਕ ਵਿੱਚ ਖੇਤ ਦਾ ਰਿਕਾਰਡ, ਆਪਰੇਟਰ ਦੇ ਸਬੂਤ ਅਤੇ ਸੈਟੇਲਾਈਟ ਜਾਣਕਾਰੀ ਮਿਲਾਈ ਜਾਂਦੀ ਹੈ। ਸੈਟੇਲਾਈਟ ’ਤੇ ਅੱਗ ਨਾ ਦਿਖਣਾ, ਅੱਗ ਨਾ ਲੱਗਣ ਦਾ ਪੱਕਾ ਸਬੂਤ ਨਹੀਂ ਹੈ।',
    market: '🌱 ਸਿਰਫ਼ ਤਸਦੀਕ ਹੋਈ ਪਰਾਲੀ ਹੀ ਖਰੀਦਦਾਰ ਤੱਕ ਜਾਣੀ ਚਾਹੀਦੀ ਹੈ। ਖਰੀਦਦਾਰ ਦੀ ਮੰਗ ਕੋਈ ਪੱਕਾ ਸੌਦਾ ਨਹੀਂ ਹੈ।',
    status: (s) => `📊 NIRDHOOM ਸਟੇਟਸ\n\nਖੇਤ: ${s.fieldCount}\nਚੱਲ ਰਹੇ ਕੰਮ: ${s.activeCount}\nਤਸਦੀਕ ਹੋਏ ਖੇਤ: ${s.verifiedCount}`,
    statusUnlinked: '📊 ਕੋਈ ਜੁੜਿਆ ਹੋਇਆ ਕਿਸਾਨ ਖਾਤਾ ਨਹੀਂ ਮਿਲਿਆ। Telegram ਜੋੜਨ ਲਈ ਵੈੱਬਸਾਈਟ ’ਤੇ NIRDHOOM ਖੋਲ੍ਹੋ।',
    help: 'NIRDHOOM ਸਾਥੀ ਇਹਨਾਂ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ:\n\n🌾 /fields — ਤੁਹਾਡੇ ਖੇਤ\n🚜 /book — ਪਰਾਲੀ ਚੁਕਵਾਉਣ ਦੀ ਬੁਕਿੰਗ\n📍 /track — ਮਸ਼ੀਨ ਕਿੱਥੇ ਹੈ\n🧾 /verify — ਖੇਤ ਦਾ ਸਬੂਤ\n🌱 /market — ਪਰਾਲੀ ਕਿੱਥੇ ਜਾ ਸਕਦੀ ਹੈ\n📊 /status — ਸਾਰ\n🌐 /language — ਪੰਜਾਬੀ / हिंदी / English\n\nਜਾਂ ਸਿੱਧਾ “ਮਸ਼ੀਨ” ਜਾਂ “ਬੁਕ” ਲਿਖੋ।',
    photo: (linked) => linked ? '📷 ਫ਼ੋਟੋ ਮਿਲ ਗਈ। ਜਦੋਂ ਤੱਕ ਇਹ ਕਿਸੇ ਪ੍ਰਮਾਣਿਤ ਕੰਮ ਨਾਲ ਨਹੀਂ ਜੁੜਦੀ, ਇਸਨੂੰ ਤਸਦੀਕ ਦਾ ਸਬੂਤ ਨਹੀਂ ਮੰਨਿਆ ਜਾਵੇਗਾ।' : '📷 ਫ਼ੋਟੋ ਮਿਲ ਗਈ। ਪਹਿਲਾਂ NIRDHOOM ਖਾਤਾ ਜੋੜੋ ਤਾਂ ਜੋ ਸਬੂਤ ਤੁਹਾਡੇ ਖੇਤ ਨਾਲ ਜੁੜ ਸਕੇ।',
    basicMode: 'ℹ️ ਖਾਤੇ ਵਾਲੀਆਂ ਸੁਵਿਧਾਵਾਂ ਹਾਲੇ ਉਪਲਬਧ ਨਹੀਂ ਹਨ। ਆਮ ਮਦਦ ਚਾਲੂ ਹੈ।',
  },
};

/** Commands registered with BotFather-equivalent setMyCommands, per language. */
export const COMMANDS: Record<BotLang, Array<{ command: string; description: string }>> = {
  en: [
    { command: 'start', description: 'Start NIRDHOOM Sathi' },
    { command: 'fields', description: 'My fields' },
    { command: 'book', description: 'Book a parali pickup' },
    { command: 'track', description: 'Where is the machine' },
    { command: 'verify', description: 'Field proof and verification' },
    { command: 'market', description: 'Where residue can go' },
    { command: 'status', description: 'My summary' },
    { command: 'language', description: 'ਪੰਜਾਬੀ / हिंदी / English' },
    { command: 'help', description: 'Help' },
  ],
  hi: [
    { command: 'start', description: 'NIRDHOOM साथी शुरू करें' },
    { command: 'fields', description: 'मेरे खेत' },
    { command: 'book', description: 'पराली उठवाने की बुकिंग' },
    { command: 'track', description: 'मशीन कहाँ है' },
    { command: 'verify', description: 'खेत का सबूत' },
    { command: 'market', description: 'पराली मंडी' },
    { command: 'status', description: 'मेरा स्टेटस' },
    { command: 'language', description: 'भाषा बदलें' },
    { command: 'help', description: 'मदद' },
  ],
  pa: [
    { command: 'start', description: 'NIRDHOOM ਸਾਥੀ ਸ਼ੁਰੂ ਕਰੋ' },
    { command: 'fields', description: 'ਮੇਰੇ ਖੇਤ' },
    { command: 'book', description: 'ਪਰਾਲੀ ਚੁਕਵਾਉਣ ਦੀ ਬੁਕਿੰਗ' },
    { command: 'track', description: 'ਮਸ਼ੀਨ ਕਿੱਥੇ ਹੈ' },
    { command: 'verify', description: 'ਖੇਤ ਦਾ ਸਬੂਤ' },
    { command: 'market', description: 'ਪਰਾਲੀ ਮੰਡੀ' },
    { command: 'status', description: 'ਮੇਰਾ ਸਟੇਟਸ' },
    { command: 'language', description: 'ਭਾਸ਼ਾ ਬਦਲੋ' },
    { command: 'help', description: 'ਮਦਦ' },
  ],
};
