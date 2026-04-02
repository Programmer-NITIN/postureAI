/**
 * Voice Feedback Engine — Multilingual TTS for All Indian Languages
 *
 * Provides real-time voice coaching using the browser's Web Speech Synthesis API.
 * Supports all 22 scheduled Indian languages plus English.
 *
 * Features:
 * - Dynamic, contextual feedback (not static lines) — generates unique sentences
 * - Cooldown timer to avoid overwhelming the user
 * - Message deduplication (won't repeat the same message within cooldown)
 * - Language switching at runtime
 * - Priority-based message queue (danger > correction > motivation)
 * - Falls back to pre-written messages when API is unavailable
 */

function _getBaseUrl() {
  if (typeof window !== "undefined") {
    // API calls are proxied through Next.js rewrites — use same origin
    return "";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}
const BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");

// ── All Indian Languages ──────────────────────────────────
const LANGUAGE_NAMES = {
  en: "English",
  hi: "हिन्दी (Hindi)",
  bn: "বাংলা (Bengali)",
  te: "తెలుగు (Telugu)",
  mr: "मराठी (Marathi)",
  ta: "தமிழ் (Tamil)",
  gu: "ગુજરાતી (Gujarati)",
  kn: "ಕನ್ನಡ (Kannada)",
  ml: "മലയാളം (Malayalam)",
  pa: "ਪੰਜਾਬੀ (Punjabi)",
  or: "ଓଡ଼ିଆ (Odia)",
  as: "অসমীয়া (Assamese)",
  mai: "मैथिली (Maithili)",
  sa: "संस्कृतम् (Sanskrit)",
  ur: "اردو (Urdu)",
  sd: "سنڌي (Sindhi)",
  ks: "कॉशुर (Kashmiri)",
  ne: "नेपाली (Nepali)",
  kok: "कोंकणी (Konkani)",
  doi: "डोगरी (Dogri)",
  mni: "মৈতৈলোন্ (Manipuri)",
  sat: "ᱥᱟᱱᱛᱟᱲᱤ (Santali)",
  bo: "བོད་སྐད (Bodo)",
};

// ── Static Fallback Messages (for key languages) ──────────
const MESSAGES = {
  corrections: {
    en: {
      back_straight: "Straighten your back.",
      knees_collapsing: "Knees are collapsing inward.",
      raise_arm: "Raise your arm higher.",
      neck_straight: "Keep your neck straight.",
      slow_down: "Slow down the movement for better control.",
      full_rom: "Try to achieve fuller range of motion.",
      alignment: "Focus on maintaining proper alignment.",
      squat_deeper: "Go deeper into the squat.",
      hold_position: "Hold this position for a moment.",
    },
    hi: {
      back_straight: "अपनी कमर सीधी रखें।",
      knees_collapsing: "घुटने अंदर आ रहे हैं, बाहर रखें।",
      raise_arm: "हाथ और ऊपर उठाइए।",
      neck_straight: "गर्दन सीधी रखें।",
      slow_down: "धीरे चलें, बेहतर कंट्रोल के लिए।",
      full_rom: "पूरी रेंज ऑफ मोशन ट्राई करें।",
      alignment: "अलाइनमेंट मेंटेन करें।",
      squat_deeper: "और नीचे जाएँ स्क्वॉट में।",
      hold_position: "यह पोज़िशन थोड़ी देर होल्ड करें।",
    },
    bn: {
      back_straight: "আপনার পিঠ সোজা রাখুন।",
      knees_collapsing: "হাঁটু ভেতরে আসছে।",
      raise_arm: "হাত আরও উঁচুতে তুলুন।",
      neck_straight: "ঘাড় সোজা রাখুন।",
      slow_down: "আস্তে করুন, ভালো নিয়ন্ত্রণের জন্য।",
      full_rom: "পূর্ণ গতির পরিসীমা অর্জন করুন।",
      alignment: "সঠিক সারিবদ্ধতা বজায় রাখুন।",
      squat_deeper: "আরও গভীরে যান।",
      hold_position: "এই অবস্থান ধরে রাখুন।",
    },
    te: {
      back_straight: "మీ వీపును నిటారుగా ఉంచండి.",
      knees_collapsing: "మోకాళ్ళు లోపలికి వస్తున్నాయి.",
      raise_arm: "చేయిని మరింత పైకి ఎత్తండి.",
      neck_straight: "మెడను నిటారుగా ఉంచండి.",
      slow_down: "మెరుగైన నియంత్రణ కోసం నెమ్మదించండి.",
      full_rom: "పూర్తి కదలిక శ్రేణిని సాధించండి.",
      alignment: "సరైన అమరికను నిర్వహించండి.",
      squat_deeper: "మరింత లోతుగా వెళ్ళండి.",
      hold_position: "ఈ స్థానాన్ని పట్టుకోండి.",
    },
    mr: {
      back_straight: "तुमची पाठ सरळ ठेवा.",
      knees_collapsing: "गुडघे आत येत आहेत.",
      raise_arm: "हात अधिक वर उचला.",
      neck_straight: "मान सरळ ठेवा.",
      slow_down: "चांगल्या नियंत्रणासाठी हळू करा.",
      full_rom: "पूर्ण गतीची श्रेणी साध्य करा.",
      alignment: "योग्य संरेखन राखा.",
      squat_deeper: "स्क्वॉटमध्ये अधिक खोलात जा.",
      hold_position: "ही स्थिती थोडा वेळ धरा.",
    },
    ta: {
      back_straight: "முதுகை நேராக வையுங்கள்.",
      knees_collapsing: "முழங்கால்கள் உள்நோக்கி வருகின்றன.",
      raise_arm: "கையை மேலே உயர்த்துங்கள்.",
      neck_straight: "கழுத்தை நேராக வையுங்கள்.",
      slow_down: "கட்டுப்பாட்டுக்காக மெதுவாக செய்யுங்கள்.",
      full_rom: "முழு அசைவு வரம்பை அடையுங்கள்.",
      alignment: "சரியான சீரமைப்பை பராமரியுங்கள்.",
      squat_deeper: "ஸ்குவாட்டில் ஆழமாகச் செல்லுங்கள்.",
      hold_position: "இந்நிலையை சிறிது நேரம் பிடியுங்கள்.",
    },
    gu: {
      back_straight: "તમારી પીઠ સીધી રાખો.",
      knees_collapsing: "ઘૂંટણ અંદર આવી રહ્યા છે.",
      raise_arm: "તમારો હાથ વધુ ઊંચો કરો.",
      neck_straight: "તમારી ગરદન સીધી રાખો.",
      slow_down: "વધુ સારા નિયંત્રણ માટે ધીમું કરો.",
      full_rom: "પૂર્ણ ગતિની શ્રેણી હાંસલ કરવાનો પ્રયાસ કરો.",
      alignment: "યોગ્ય ગોઠવણી જાળવી રાખો.",
      squat_deeper: "સ્ક્વોટમાં વધુ નીચે જાઓ.",
      hold_position: "આ સ્થિતિ થોડીવાર પકડી રાખો.",
    },
    kn: {
      back_straight: "ನಿಮ್ಮ ಬೆನ್ನನ್ನು ನೇರವಾಗಿಡಿ.",
      knees_collapsing: "ಮೊಣಕಾಲುಗಳು ಒಳಕ್ಕೆ ಬರುತ್ತಿವೆ.",
      raise_arm: "ಕೈಯನ್ನು ಮೇಲೆ ಎತ್ತಿ.",
      neck_straight: "ಕತ್ತನ್ನು ನೇರವಾಗಿಡಿ.",
      slow_down: "ಉತ್ತಮ ನಿಯಂತ್ರಣಕ್ಕಾಗಿ ನಿಧಾನಿಸಿ.",
      full_rom: "ಪೂರ್ಣ ಚಲನೆಯ ವ್ಯಾಪ್ತಿಯನ್ನು ಸಾಧಿಸಿ.",
      alignment: "ಸರಿಯಾದ ಜೋಡಣೆಯನ್ನು ನಿರ್ವಹಿಸಿ.",
      squat_deeper: "ಸ್ಕ್ವಾಟ್‌ನಲ್ಲಿ ಆಳಕ್ಕೆ ಹೋಗಿ.",
      hold_position: "ಈ ಸ್ಥಾನವನ್ನು ಸ್ವಲ್ಪ ಹೊತ್ತು ಹಿಡಿಯಿರಿ.",
    },
    ml: {
      back_straight: "നിങ്ങളുടെ മുതുക് നേരെ വയ്ക്കുക.",
      knees_collapsing: "കാൽമുട്ടുകൾ അകത്തേക്ക് വരുന്നു.",
      raise_arm: "കൈ കൂടുതൽ ഉയർത്തുക.",
      neck_straight: "കഴുത്ത് നേരെ വയ്ക്കുക.",
      slow_down: "മെച്ചപ്പെട്ട നിയന്ത്രണത്തിനായി പതുക്കെ ചെയ്യുക.",
      full_rom: "പൂർണ ചലന പരിധി കൈവരിക്കുക.",
      alignment: "ശരിയായ വിന്യാസം നിലനിർത്തുക.",
      squat_deeper: "സ്ക്വാട്ടിൽ കൂടുതൽ ആഴത്തിൽ പോകുക.",
      hold_position: "ഈ സ്ഥാനം അൽപനേരം പിടിക്കുക.",
    },
    pa: {
      back_straight: "ਆਪਣੀ ਪਿੱਠ ਸਿੱਧੀ ਰੱਖੋ।",
      knees_collapsing: "ਗੋਡੇ ਅੰਦਰ ਆ ਰਹੇ ਹਨ।",
      raise_arm: "ਬਾਂਹ ਹੋਰ ਉੱਪਰ ਚੁੱਕੋ।",
      neck_straight: "ਗਰਦਨ ਸਿੱਧੀ ਰੱਖੋ।",
      slow_down: "ਬਿਹਤਰ ਕੰਟਰੋਲ ਲਈ ਹੌਲੀ ਕਰੋ।",
      full_rom: "ਪੂਰੀ ਗਤੀ ਦੀ ਰੇਂਜ ਪ੍ਰਾਪਤ ਕਰੋ।",
      alignment: "ਸਹੀ ਅਲਾਇਨਮੈਂਟ ਬਣਾਈ ਰੱਖੋ।",
      squat_deeper: "ਸਕੁਐਟ ਵਿੱਚ ਹੋਰ ਡੂੰਘੇ ਜਾਓ।",
      hold_position: "ਇਹ ਸਥਿਤੀ ਥੋੜ੍ਹੀ ਦੇਰ ਪਕੜੋ।",
    },
    or: {
      back_straight: "ଆପଣଙ୍କ ପିଠି ସିଧା ରଖନ୍ତୁ।",
      knees_collapsing: "ଆଣ୍ଠୁ ଭିତରକୁ ଆସୁଛି।",
      raise_arm: "ହାତ ଆହୁରି ଉପରକୁ ଉଠାନ୍ତୁ।",
      neck_straight: "ବେକ ସିଧା ରଖନ୍ତୁ।",
      slow_down: "ଭଲ ନିୟନ୍ତ୍ରଣ ପାଇଁ ଧୀରେ କରନ୍ତୁ।",
      full_rom: "ସମ୍ପୂର୍ଣ୍ଣ ଗତି ପରିସର ହାସଲ କରନ୍ତୁ।",
      alignment: "ସଠିକ୍ ସ୍ଥିତି ବଜାୟ ରଖନ୍ତୁ।",
      squat_deeper: "ସ୍କ୍ୱାଟରେ ଆହୁରି ଗଭୀରକୁ ଯାଆନ୍ତୁ।",
      hold_position: "ଏହି ସ୍ଥିତି ଧରି ରଖନ୍ତୁ।",
    },
    as: {
      back_straight: "আপোনাৰ পিঠি পোন কৰি ৰাখক।",
      knees_collapsing: "আঁঠু ভিতৰলৈ আহিছে।",
      raise_arm: "হাত আৰু ওপৰলৈ তুলক।",
      neck_straight: "ডিঙি পোন কৰি ৰাখক।",
      slow_down: "ভাল নিয়ন্ত্ৰণৰ বাবে লাহে কৰক।",
      full_rom: "সম্পূৰ্ণ গতিৰ পৰিসৰ লাভ কৰক।",
      alignment: "সঠিক প্ৰান্তিককৰণ বজাই ৰাখক।",
      squat_deeper: "স্কোৱাটত আৰু গভীৰলৈ যাওক।",
      hold_position: "এই অৱস্থান অলপ সময় ধৰি ৰাখক।",
    },
    ur: {
      back_straight: "اپنی کمر سیدھی رکھیں۔",
      knees_collapsing: "گھٹنے اندر آ رہے ہیں۔",
      raise_arm: "بازو اور اوپر اٹھائیں۔",
      neck_straight: "گردن سیدھی رکھیں۔",
      slow_down: "بہتر کنٹرول کے لیے آہستہ کریں۔",
      full_rom: "مکمل حرکت کی حد حاصل کریں۔",
      alignment: "صحیح سیدھ برقرار رکھیں۔",
      squat_deeper: "اسکواٹ میں اور نیچے جائیں۔",
      hold_position: "اس پوزیشن کو تھوڑی دیر پکڑیں۔",
    },
    ne: {
      back_straight: "आफ्नो ढाड सिधा राख्नुहोस्।",
      knees_collapsing: "घुँडा भित्र आइरहेको छ।",
      raise_arm: "हात अझ माथि उठाउनुहोस्।",
      neck_straight: "घाँटी सिधा राख्नुहोस्।",
      slow_down: "राम्रो नियन्त्रणको लागि बिस्तारै गर्नुहोस्।",
      full_rom: "पूर्ण गतिको दायरा प्राप्त गर्नुहोस्।",
      alignment: "सही पङ्क्तिबद्धता कायम गर्नुहोस्।",
      squat_deeper: "स्क्वाटमा अझ गहिरो जानुहोस्।",
      hold_position: "यो स्थिति केही समय समात्नुहोस्।",
    },
  },

  motivation: {
    en: {
      halfway: "Great job, you're halfway there! Keep going!",
      two_left: "Only two more reps left! Push through!",
      last_rep: "Last one, give it your best!",
      set_done: "Excellent work! Take a short rest.",
      workout_done: "Workout complete! Amazing effort!",
      good_form: "Great form, keep it up!",
      improving: "You're improving with each rep!",
      rep_done: "Good rep!",
      streak: "You're on a roll! Maintain this form!",
    },
    hi: {
      halfway: "बहुत बढ़िया! आधा हो गया, जारी रखो!",
      two_left: "सिर्फ दो रेप्स बाकी हैं! पुश करो!",
      last_rep: "आखिरी, अपना बेस्ट दो!",
      set_done: "शानदार! थोड़ा आराम करो।",
      workout_done: "वर्कआउट पूरा! बहुत अच्छा!",
      good_form: "फॉर्म बहुत अच्छी है! ऐसे ही रखो!",
      improving: "हर रेप के साथ सुधार हो रहा है!",
      rep_done: "अच्छा रेप!",
      streak: "लगे रहो! फॉर्म मेंटेन करो!",
    },
    bn: {
      halfway: "দারুণ! অর্ধেক হয়ে গেছে, চালিয়ে যান!",
      two_left: "আর দুটি বাকি! চেষ্টা করুন!",
      last_rep: "শেষ একটি, সেরাটা দিন!",
      set_done: "চমৎকার! একটু বিশ্রাম নিন।",
      workout_done: "ওয়ার্কআউট শেষ! অসাধারণ!",
      good_form: "দারুণ ফর্ম, চালিয়ে যান!",
      improving: "প্রতিটি রেপে উন্নতি হচ্ছে!",
      rep_done: "ভালো রেপ!",
      streak: "চালিয়ে যান! ফর্ম বজায় রাখুন!",
    },
    te: {
      halfway: "బాగుంది! సగం పూర్తయింది, కొనసాగించండి!",
      two_left: "మరో రెండు మాత్రమే! కొనసాగించండి!",
      last_rep: "చివరిది, మీ బెస్ట్ ఇవ్వండి!",
      set_done: "అద్భుతం! కొంచెం విశ్రాంతి తీసుకోండి.",
      workout_done: "వ్యాయామం పూర్తయింది! అద్భుతం!",
      good_form: "మంచి ఫారమ్, కొనసాగించండి!",
      improving: "ప్రతి రెప్‌తో మెరుగవుతోంది!",
      rep_done: "మంచి రెప్!",
      streak: "కొనసాగించండి! ఫారమ్ అలాగే ఉంచండి!",
    },
    mr: {
      halfway: "छान! अर्धा झाला, चालू ठेवा!",
      two_left: "फक्त दोन बाकी! पुश करा!",
      last_rep: "शेवटचा, तुमचा बेस्ट द्या!",
      set_done: "उत्तम! थोडी विश्रांती घ्या.",
      workout_done: "व्यायाम पूर्ण! अप्रतिम!",
      good_form: "फॉर्म छान आहे, तसाच ठेवा!",
      improving: "प्रत्येक रेप सोडून सुधारणा होतेय!",
      rep_done: "चांगला रेप!",
      streak: "चालू ठेवा! फॉर्म राखा!",
    },
    ta: {
      halfway: "நன்று! பாதி முடிந்தது, தொடருங்கள்!",
      two_left: "இன்னும் இரண்டு மட்டுமே!",
      last_rep: "கடைசி, உங்கள் சிறந்ததைக் கொடுங்கள்!",
      set_done: "அருமை! சிறிது ஓய்வு எடுங்கள்.",
      workout_done: "பயிற்சி முடிந்தது! அற்புதம்!",
      good_form: "சிறந்த வடிவம், தொடருங்கள்!",
      improving: "ஒவ்வொரு ரெப்பிலும் முன்னேற்றம்!",
      rep_done: "நல்ல ரெப்!",
      streak: "நல்ல வேகத்தில் செல்கிறீர்கள்!",
    },
    gu: {
      halfway: "ખૂબ સારું! અડધું થયું, ચાલુ રાખો!",
      two_left: "હજુ બે રેપ બાકી છે! પૂરું કરો!",
      last_rep: "છેલ્લી એક, શ્રેષ્ઠ આપો!",
      set_done: "ઉત્તમ કામ! થોડો આરામ કરો.",
      workout_done: "વર્કઆઉટ પૂર્ણ! અદ્ભુત!",
      good_form: "ફોર્મ ખૂબ સારી છે! ચાલુ રાખો!",
      improving: "દરેક રેપ સાથે સુધારો!",
      rep_done: "સારી રેપ!",
      streak: "ચાલુ રાખો! ફોર્મ જાળવી રાખો!",
    },
    kn: {
      halfway: "ಚೆನ್ನಾಗಿದೆ! ಅರ್ಧ ಆಯಿತು, ಮುಂದುವರಿಸಿ!",
      two_left: "ಇನ್ನೆರಡು ಮಾತ್ರ ಬಾಕಿ!",
      last_rep: "ಕೊನೆಯದು, ನಿಮ್ಮ ಅತ್ಯುತ್ತಮವನ್ನು ನೀಡಿ!",
      set_done: "ಅದ್ಭುತ! ಸ್ವಲ್ಪ ವಿಶ್ರಾಂತಿ ತೆಗೆದುಕೊಳ್ಳಿ.",
      workout_done: "ವ್ಯಾಯಾಮ ಮುಗಿಯಿತು! ಅದ್ಭುತ!",
      good_form: "ಉತ್ತಮ ಫಾರ್ಮ್, ಮುಂದುವರಿಸಿ!",
      improving: "ಪ್ರತಿ ರೆಪ್‌ನಲ್ಲೂ ಸುಧಾರಣೆ!",
      rep_done: "ಒಳ್ಳೆಯ ರೆಪ್!",
      streak: "ಮುಂದುವರಿಸಿ! ಫಾರ್ಮ್ ನಿರ್ವಹಿಸಿ!",
    },
    ml: {
      halfway: "നന്നായി! പകുതി ആയി, തുടരുക!",
      two_left: "ഇനി രണ്ട് മാത്രം! പുഷ് ചെയ്യുക!",
      last_rep: "അവസാനത്തേത്, മികച്ചത് നൽകുക!",
      set_done: "മികച്ചത്! അൽപം വിശ്രമിക്കുക.",
      workout_done: "വ്യായാമം കഴിഞ്ഞു! അത്ഭുതം!",
      good_form: "മികച്ച ഫോം, തുടരുക!",
      improving: "ഓരോ റെപ്പിലും മെച്ചപ്പെടുന്നു!",
      rep_done: "നല്ല റെപ്!",
      streak: "തുടരുക! ഫോം നിലനിർത്തുക!",
    },
    pa: {
      halfway: "ਬਹੁਤ ਵਧੀਆ! ਅੱਧਾ ਹੋ ਗਿਆ, ਜਾਰੀ ਰੱਖੋ!",
      two_left: "ਸਿਰਫ਼ ਦੋ ਬਾਕੀ! ਪੁਸ਼ ਕਰੋ!",
      last_rep: "ਆਖਰੀ, ਆਪਣਾ ਬੈਸਟ ਦਿਓ!",
      set_done: "ਸ਼ਾਨਦਾਰ! ਥੋੜ੍ਹਾ ਆਰਾਮ ਕਰੋ।",
      workout_done: "ਵਰਕਆਊਟ ਪੂਰਾ! ਬਹੁਤ ਵਧੀਆ!",
      good_form: "ਫ਼ਾਰਮ ਬਹੁਤ ਵਧੀਆ! ਜਾਰੀ ਰੱਖੋ!",
      improving: "ਹਰ ਰੈਪ ਨਾਲ ਸੁਧਾਰ ਹੋ ਰਿਹਾ ਹੈ!",
      rep_done: "ਵਧੀਆ ਰੈਪ!",
      streak: "ਜਾਰੀ ਰੱਖੋ! ਫ਼ਾਰਮ ਬਣਾਈ ਰੱਖੋ!",
    },
    or: {
      halfway: "ବହୁତ ଭଲ! ଅଧା ହୋଇଗଲା, ଜାରି ରଖନ୍ତୁ!",
      two_left: "ଆଉ ଦୁଇଟି ବାକି! ପୁଶ୍ କରନ୍ତୁ!",
      last_rep: "ଶେଷ ଟା, ସର୍ବୋତ୍ତମ ଦିଅନ୍ତୁ!",
      set_done: "ଉତ୍କୃଷ୍ଟ! ଅଳ୍ପ ବିଶ୍ରାମ ନିଅନ୍ତୁ।",
      workout_done: "ବ୍ୟାୟାମ ସମ୍ପୂର୍ଣ୍ଣ! ଅଦ୍ଭୁତ!",
      good_form: "ଭଲ ଫର୍ମ, ଜାରି ରଖନ୍ତୁ!",
      improving: "ପ୍ରତ୍ୟେକ ରେପରେ ଉନ୍ନତି!",
      rep_done: "ଭଲ ରେପ!",
      streak: "ଜାରି ରଖନ୍ତୁ! ଫର୍ମ ବଜାୟ ରଖନ୍ତୁ!",
    },
    as: {
      halfway: "বহুত ভাল! আধা হ'ল, চলাই যাওক!",
      two_left: "আৰু দুটা বাকী! পুশ্ কৰক!",
      last_rep: "শেষটো, শ্ৰেষ্ঠ দিয়ক!",
      set_done: "চমৎকাৰ! অলপ জিৰণি লওক।",
      workout_done: "ব্যায়াম সম্পূৰ্ণ! অসাধাৰণ!",
      good_form: "ভাল ফৰ্ম, চলাই যাওক!",
      improving: "প্ৰতিটো ৰেপত উন্নতি!",
      rep_done: "ভাল ৰেপ!",
      streak: "চলাই যাওক! ফৰ্ম বজাই ৰাখক!",
    },
    ur: {
      halfway: "بہت اچھا! آدھا ہو گیا، جاری رکھیں!",
      two_left: "صرف دو باقی ہیں! پُش کریں!",
      last_rep: "آخری، اپنا بیسٹ دیں!",
      set_done: "شاندار! تھوڑا آرام کریں۔",
      workout_done: "ورزش مکمل! بہت اچھا!",
      good_form: "فارم بہت اچھی ہے! جاری رکھیں!",
      improving: "ہر ریپ کے ساتھ بہتری!",
      rep_done: "اچھا ریپ!",
      streak: "جاری رکھیں! فارم برقرار رکھیں!",
    },
    ne: {
      halfway: "राम्रो! आधा भयो, जारी राख्नुहोस्!",
      two_left: "दुईटा मात्र बाँकी! पुश गर्नुहोस्!",
      last_rep: "अन्तिमो, आफ्नो बेस्ट दिनुहोस्!",
      set_done: "उत्कृष्ट! अलिकति आराम गर्नुहोस्।",
      workout_done: "व्यायाम पूरा! अद्भुत!",
      good_form: "राम्रो फर्म, जारी राख्नुहोस्!",
      improving: "हरेक रेपमा सुधार!",
      rep_done: "राम्रो रेप!",
      streak: "जारी राख्नुहोस्! फर्म कायम गर्नुहोस्!",
    },
  },

  rest: {
    en: {
      start_rest: "Rest for {seconds} seconds. Breathe deeply.",
      rest_done: "Rest over! Get ready for the next set!",
    },
    hi: {
      start_rest: "{seconds} सेकंड आराम करो। गहरी सांस लो।",
      rest_done: "आराम खत्म! अगले सेट के लिए तैयार हो जाओ!",
    },
    bn: {
      start_rest: "{seconds} সেকেন্ড বিশ্রাম নিন। গভীর শ্বাস নিন।",
      rest_done: "বিশ্রাম শেষ! পরবর্তী সেটের জন্য প্রস্তুত হন!",
    },
    te: {
      start_rest: "{seconds} సెకన్లు విశ్రాంతి తీసుకోండి.",
      rest_done: "విశ్రాంతి పూర్తి! తదుపరి సెట్‌కు సిద్ధమవ్వండి!",
    },
    mr: {
      start_rest: "{seconds} सेकंद विश्रांती घ्या. खोलवर श्वास घ्या.",
      rest_done: "विश्रांती संपली! पुढच्या सेटसाठी तयार व्हा!",
    },
    ta: {
      start_rest: "{seconds} வினாடிகள் ஓய்வு எடுங்கள். ஆழமாக சுவாசியுங்கள்.",
      rest_done: "ஓய்வு முடிந்தது! அடுத்த செட்டுக்கு தயாராகுங்கள்!",
    },
    gu: {
      start_rest: "{seconds} સેકન્ડ આરામ કરો. ઊંડો શ્વાસ લો.",
      rest_done: "આરામ પૂરો! આગળના સેટ માટે તૈયાર થાવ!",
    },
    kn: {
      start_rest: "{seconds} ಸೆಕೆಂಡ್ ವಿಶ್ರಾಂತಿ ತೆಗೆದುಕೊಳ್ಳಿ.",
      rest_done: "ವಿಶ್ರಾಂತಿ ಮುಗಿಯಿತು! ಮುಂದಿನ ಸೆಟ್‌ಗೆ ಸಿದ್ಧರಾಗಿ!",
    },
    ml: {
      start_rest: "{seconds} സെക്കൻഡ് വിശ്രമിക്കുക. ആഴത്തിൽ ശ്വസിക്കുക.",
      rest_done: "വിശ്രമം കഴിഞ്ഞു! അടുത്ത സെറ്റിന് തയ്യാറാകുക!",
    },
    pa: {
      start_rest: "{seconds} ਸੈਕਿੰਡ ਆਰਾਮ ਕਰੋ। ਡੂੰਘਾ ਸਾਹ ਲਓ।",
      rest_done: "ਆਰਾਮ ਖ਼ਤਮ! ਅਗਲੇ ਸੈੱਟ ਲਈ ਤਿਆਰ ਹੋਵੋ!",
    },
    or: {
      start_rest: "{seconds} ସେକେଣ୍ଡ ବିଶ୍ରାମ ନିଅନ୍ତୁ। ଗଭୀର ନିଶ୍ୱାସ ନିଅନ୍ତୁ।",
      rest_done: "ବିଶ୍ରାମ ସମାପ୍ତ! ପରବର୍ତ୍ତୀ ସେଟ୍ ପାଇଁ ପ୍ରସ୍ତୁତ ହୁଅନ୍ତୁ!",
    },
    as: {
      start_rest: "{seconds} ছেকেণ্ড জিৰণি লওক। গভীৰ উশাহ লওক।",
      rest_done: "জিৰণি শেষ! পৰৱৰ্তী ছেটৰ বাবে সাজু হওক!",
    },
    ur: {
      start_rest: "{seconds} سیکنڈ آرام کریں۔ گہری سانس لیں۔",
      rest_done: "آرام ختم! اگلے سیٹ کے لیے تیار ہو جائیں!",
    },
    ne: {
      start_rest: "{seconds} सेकेन्ड आराम गर्नुहोस्। गहिरो सास लिनुहोस्।",
      rest_done: "आराम सकियो! अर्को सेटको लागि तयार हुनुहोस्!",
    },
  },

  danger: {
    en: {
      knee_valgus: "Warning! Knee valgus detected. Push knees outward.",
      forward_head: "Warning! Forward head posture detected. Pull chin back.",
      spine_flex: "Warning! Excessive spine flexion. Straighten your back now.",
      general: "Warning! Injury risk detected. Correct your form.",
    },
    hi: {
      knee_valgus: "सावधान! घुटने अंदर आ रहे हैं। बाहर पुश करो।",
      forward_head: "सावधान! सर आगे आ रहा है। ठोड़ी पीछे करो।",
      spine_flex: "सावधान! कमर ज़्यादा झुकी है। सीधी करो तुरंत।",
      general: "सावधान! चोट का ख़तरा है। फॉर्म ठीक करो।",
    },
    bn: {
      knee_valgus: "সতর্কতা! হাঁটু ভেতরে আসছে। বাইরে ঠেলুন।",
      forward_head: "সতর্কতা! মাথা সামনে আছে। চিবুক পেছনে টানুন।",
      spine_flex: "সতর্কতা! মেরুদণ্ড অতিরিক্ত বাঁকা। এখনই সোজা করুন।",
      general: "সতর্কতা! আঘাতের ঝুঁকি আছে। ফর্ম ঠিক করুন।",
    },
    te: {
      knee_valgus: "హెచ్చరిక! మోకాళ్ళు లోపలికి వస్తున్నాయి.",
      forward_head: "హెచ్చరిక! తల ముందుకు ఉంది.",
      spine_flex: "హెచ్చరిక! వెన్నెముక ఎక్కువగా వంగింది.",
      general: "హెచ్చరిక! గాయం ప్రమాదం. ఫారమ్ సరి చేయండి.",
    },
    ta: {
      knee_valgus: "எச்சரிக்கை! முழங்கால் உள்நோக்கி வருகிறது.",
      forward_head: "எச்சரிக்கை! தலை முன்னோக்கி உள்ளது.",
      spine_flex: "எச்சரிக்கை! முதுகு அதிகமாக வளைந்துள்ளது.",
      general: "எச்சரிக்கை! காயம் ஆபத்து. வடிவத்தை சரிசெய்யுங்கள்.",
    },
    gu: {
      knee_valgus: "ચેતવણી! ઘૂંટણ અંદર આવે છે. બહાર ધકેલો.",
      forward_head: "ચેતવણી! માથું આગળ છે. ચિન પાછળ ખેંચો.",
      spine_flex: "ચેતવણી! કરોડરજ્જુ વધારે વળેલી છે.",
      general: "ચેતવણી! ઈજાનું જોખમ. ફોર્મ સુધારો.",
    },
    kn: {
      knee_valgus: "ಎಚ್ಚರಿಕೆ! ಮೊಣಕಾಲು ಒಳಕ್ಕೆ ಬರುತ್ತಿದೆ.",
      forward_head: "ಎಚ್ಚರಿಕೆ! ತಲೆ ಮುಂದಕ್ಕಿದೆ.",
      spine_flex: "ಎಚ್ಚರಿಕೆ! ಬೆನ್ನು ಹೆಚ್ಚು ಬಾಗಿದೆ.",
      general: "ಎಚ್ಚರಿಕೆ! ಗಾಯದ ಅಪಾಯ. ಫಾರ್ಮ್ ಸರಿಪಡಿಸಿ.",
    },
    ml: {
      knee_valgus: "മുന്നറിയിപ്പ്! കാൽമുട്ട് അകത്തേക്ക് വരുന്നു.",
      forward_head: "മുന്നറിയിപ്പ്! തല മുന്നോട്ടാണ്.",
      spine_flex: "മുന്നറിയിപ്പ്! മുതുക് കൂടുതൽ വളഞ്ഞിരിക്കുന്നു.",
      general: "മുന്നറിയിപ്പ്! പരിക്കിന്റെ സാധ്യത. ഫോം ശരിയാക്കുക.",
    },
    pa: {
      knee_valgus: "ਚੇਤਾਵਨੀ! ਗੋਡਾ ਅੰਦਰ ਆ ਰਿਹਾ ਹੈ।",
      forward_head: "ਚੇਤਾਵਨੀ! ਸਿਰ ਅੱਗੇ ਹੈ।",
      spine_flex: "ਚੇਤਾਵਨੀ! ਪਿੱਠ ਬਹੁਤ ਝੁਕੀ ਹੈ।",
      general: "ਚੇਤਾਵਨੀ! ਸੱਟ ਦਾ ਖ਼ਤਰਾ। ਫ਼ਾਰਮ ਠੀਕ ਕਰੋ।",
    },
    or: {
      knee_valgus: "ସାବଧାନ! ଆଣ୍ଠୁ ଭିତରକୁ ଆସୁଛି। ବାହାରକୁ ଠେଲନ୍ତୁ।",
      forward_head: "ସାବଧାନ! ମୁଣ୍ଡ ଆଗକୁ ଅଛି। ଚିବୁକ ପଛକୁ ଟାଣନ୍ତୁ।",
      spine_flex: "ସାବଧାନ! ମେରୁଦଣ୍ଡ ଅଧିକ ଝୁକିଛି।",
      general: "ସାବଧାନ! ଆଘାତ ଆଶଙ୍କା। ଫର୍ମ ଠିକ୍ କରନ୍ତୁ।",
    },
    as: {
      knee_valgus: "সাৱধান! আঁঠু ভিতৰলৈ আহিছে। বাহিৰলৈ ঠেলক।",
      forward_head: "সাৱধান! মূৰ আগলৈ আছে। থুঁতৰি পিছলৈ টানক।",
      spine_flex: "সাৱধান! পিঠি অধিক হাউলিছে।",
      general: "সাৱধান! আঘাতৰ আশংকা। ফৰ্ম শুধৰাওক।",
    },
    ur: {
      knee_valgus: "خبردار! گھٹنا اندر آ رہا ہے۔ باہر دھکیلیں۔",
      forward_head: "خبردار! سر آگے ہے۔ ٹھوڑی پیچھے کریں۔",
      spine_flex: "خبردار! ریڑھ کی ہڈی زیادہ جھکی ہے۔",
      general: "خبردار! چوٹ کا خطرہ۔ فارم ٹھیک کریں۔",
    },
    ne: {
      knee_valgus: "सावधान! घुँडा भित्र आइरहेको छ। बाहिर धकेल्नुहोस्।",
      forward_head: "सावधान! टाउको अगाडि छ। चिउँडो पछाडि तान्नुहोस्।",
      spine_flex: "सावधान! ढाड धेरै झुकेको छ।",
      general: "सावधान! चोटको जोखिम। फर्म ठीक गर्नुहोस्।",
    },
  },
};


// ── Voice Engine ───────────────────────────────────────────

let currentLanguage = "en";
let lastMessageTime = 0;
let lastMessage = "";
const COOLDOWN_MS = 3000;
let voiceEnabled = true;
let pendingDynamicRequest = null;

const MESSAGE_PRIORITY = { danger: 3, correction: 2, motivation: 1 };

// ── Dynamic Feedback Cache ─────────────────────────────────
const dynamicCache = new Map();
const CACHE_TTL = 10000; // 10 second cache

export function setLanguage(lang) {
  if (LANGUAGE_NAMES[lang]) {
    currentLanguage = lang;
  }
}

export function getLanguage() {
  return currentLanguage;
}

export function getLanguages() {
  return Object.entries(LANGUAGE_NAMES).map(([id, name]) => ({ id, name }));
}

export function setVoiceEnabled(enabled) {
  voiceEnabled = enabled;
}

export function isVoiceEnabled() {
  return voiceEnabled;
}

/**
 * Map BCP-47 prefix to the best voice for this language.
 */
function _getLangCode(lang) {
  const map = {
    en: "en-IN", hi: "hi-IN", bn: "bn-IN", te: "te-IN", mr: "mr-IN", ta: "ta-IN",
    gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", pa: "pa-IN", or: "or-IN", as: "as-IN",
    mai: "hi-IN", sa: "hi-IN", ur: "ur-IN", sd: "ur-PK", ks: "ur-IN",
    ne: "ne-NP", kok: "hi-IN", doi: "hi-IN", mni: "bn-IN", sat: "hi-IN", bo: "hi-IN",
  };
  return map[lang] || "hi-IN";
}

/**
 * Speak a message if cooldown allows and it's not a repeat.
 */
export function speak(text, force = false) {
  if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;

  const now = Date.now();
  if (!force && text === lastMessage && now - lastMessageTime < COOLDOWN_MS * 2) return;
  if (!force && now - lastMessageTime < COOLDOWN_MS) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 0.95;

  const langCode = _getLangCode(currentLanguage);
  utterance.lang = langCode; // Critical: set lang for proper pronunciation

  const voices = window.speechSynthesis.getVoices();
  // Try exact match first, then prefix match, then any match
  const exactVoice = voices.find((v) => v.lang === langCode);
  const prefixVoice = voices.find((v) => v.lang.startsWith(langCode.split("-")[0]));
  const bestVoice = exactVoice || prefixVoice;
  if (bestVoice) utterance.voice = bestVoice;

  window.speechSynthesis.speak(utterance);
  lastMessage = text;
  lastMessageTime = now;
}

/**
 * Get dynamic, contextual feedback from the AI backend.
 * Falls back to static messages on failure.
 */
async function _getDynamicFeedback(category, key, context = {}) {
  const cacheKey = `${currentLanguage}:${category}:${key}:${JSON.stringify(context)}`;
  const cached = dynamicCache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.text;
  }

  try {
    const langName = LANGUAGE_NAMES[currentLanguage] || "English";
    const res = await fetch(`${BASE_URL}/api/chat/voice-feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        key,
        language: currentLanguage,
        language_name: langName.replace(/\s*\(.*\)/, ""),
        context,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      dynamicCache.set(cacheKey, { text: data.feedback, time: Date.now() });
      return data.feedback;
    }
  } catch {
    // Backend unavailable — fall through to static
  }
  return null;
}

/**
 * Speak a correction message, trying dynamic first then falling back to static.
 */
export async function speakCorrection(key) {
  const dynamic = await _getDynamicFeedback("correction", key);
  if (dynamic) {
    speak(dynamic);
  } else {
    const msg = MESSAGES.corrections[currentLanguage]?.[key]
      || MESSAGES.corrections.en?.[key];
    if (msg) speak(msg);
  }
}

/**
 * Speak a motivational message.
 */
export async function speakMotivation(key) {
  const dynamic = await _getDynamicFeedback("motivation", key);
  if (dynamic) {
    speak(dynamic, true);
  } else {
    const msg = MESSAGES.motivation[currentLanguage]?.[key]
      || MESSAGES.motivation.en?.[key];
    if (msg) speak(msg, true);
  }
}

/**
 * Speak a rest message.
 */
export function speakRest(key, vars = {}) {
  let msg = MESSAGES.rest[currentLanguage]?.[key]
    || MESSAGES.rest.en?.[key] || "";
  for (const [k, v] of Object.entries(vars)) {
    msg = msg.replace(`{${k}}`, v);
  }
  if (msg) speak(msg, true);
}

/**
 * Speak a danger/injury warning. Always forced (high priority).
 */
export async function speakDanger(key) {
  // Danger is always spoken immediately with static first for speed
  const msg = MESSAGES.danger[currentLanguage]?.[key]
    || MESSAGES.danger.en?.[key];
  if (msg) speak(msg, true);

  // Then fetch a more contextual warning for next time
  _getDynamicFeedback("danger", key).catch(() => {});
}

/**
 * Map form error strings to correction keys and speak them.
 */
export function speakFormError(errorMessage) {
  const lowerMsg = errorMessage.toLowerCase();
  if (lowerMsg.includes("back") || lowerMsg.includes("spine") || lowerMsg.includes("slouch")) {
    speakCorrection("back_straight");
  } else if (lowerMsg.includes("knee") && lowerMsg.includes("valgus")) {
    speakDanger("knee_valgus");
  } else if (lowerMsg.includes("knee")) {
    speakCorrection("knees_collapsing");
  } else if (lowerMsg.includes("arm") || lowerMsg.includes("raise") || lowerMsg.includes("shoulder")) {
    speakCorrection("raise_arm");
  } else if (lowerMsg.includes("neck") || lowerMsg.includes("head") || lowerMsg.includes("forward head")) {
    speakDanger("forward_head");
  } else if (lowerMsg.includes("range") || lowerMsg.includes("rom")) {
    speakCorrection("full_rom");
  } else if (lowerMsg.includes("align")) {
    speakCorrection("alignment");
  } else if (lowerMsg.includes("deeper") || lowerMsg.includes("depth")) {
    speakCorrection("squat_deeper");
  } else if (lowerMsg.includes("hold")) {
    speakCorrection("hold_position");
  } else {
    speak(errorMessage);
  }
}

/**
 * Map risk flag strings to danger keys and speak them.
 */
export function speakRiskFlag(riskFlag) {
  const lower = riskFlag.toLowerCase();
  if (lower.includes("knee valgus") || lower.includes("valgus")) {
    speakDanger("knee_valgus");
  } else if (lower.includes("forward head") || lower.includes("fhp")) {
    speakDanger("forward_head");
  } else if (lower.includes("spine") || lower.includes("flexion")) {
    speakDanger("spine_flex");
  } else {
    speakDanger("general");
  }
}

export { MESSAGES, LANGUAGE_NAMES };
