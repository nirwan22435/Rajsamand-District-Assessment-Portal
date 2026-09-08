/**
 * Utility for DevLys 010 / Kruti Dev 010 Remington Font conversion & keyboard helpers
 */

// Mapping of DevLys 010 / Kruti Dev 010 legacy ASCII to Unicode Devanagari
export function convertDevlysToUnicode(devlysText: string): string {
  if (!devlysText) return '';

  let text = devlysText;

  // Replace compound special characters & conjuncts
  const compoundReplacements: [string | RegExp, string][] = [
    // Alt Codes and special conjunct glyphs in DevLys 010 / Kruti Dev
    [/ç/g, 'प्र'],     // Alt+0231 (Crucial for Remington words like 'प्रतिदिन' - çfrfnu)
    [/Á/g, 'प्र'],     // Alt+0193
    [/Ø/g, 'क्र'],     // Alt+0216
    [/Ð/g, 'क्र'],     // Alt+0208
    [/Ý/g, 'फ्र'],     // Alt+0221
    [/æ/g, 'द्र'],     // Alt+0230
    [/\|/g, 'द्य'],    // Alt+0124 (Crucial for words like 'विद्यालय' - fo|ky;)
    [/}/g, 'द्व'],     // Alt+0125
    [/\)/g, 'द्ध'],    // Alt+0041
    [/Ùk/g, 'त्त'],
    [/Ù/g, 'त्त्'],
    [/ä/g, 'क्त'],     // Alt+0228
    [/–/g, 'दृ'],     // Alt+0150
    [/—/g, 'कृ'],     // Alt+0151
    [/Ñ/g, 'कृ'],     // Alt+0209
    [/é/g, 'न्न'],     // Alt+0233
    [/™/g, 'न्न्'],    // Alt+0153
    [/à/g, 'ह्न'],     // Alt+0224
    [/á/g, 'ह्य'],     // Alt+0225
    [/â/g, 'हृ'],     // Alt+0226
    [/ã/g, 'ह्म'],     // Alt+0227
    [/í/g, 'द्द'],     // Alt+0237
    [/ì/g, 'ड्ड'],     // Alt+0236
    [/ï/g, 'ड्ढ'],     // Alt+0239
    [/ê/g, 'ट्ट'],     // Alt+0234
    [/ë/g, 'ट्ठ'],     // Alt+0235
    [/ô/g, 'क्क'],     // Alt+0244
    [/÷/g, 'झ्'],
    [/Ì/g, 'द्द'],
    [/Í/g, 'ट्ट'],
    [/Î/g, 'ट्ठ'],
    [/Ï/g, 'ड्ड'],
    [/Ô/g, 'ड्ढ'],
    [/Ö/g, 'झ्'],
    [/Ük/g, 'श'],
    [/Ü/g, 'श्'],
    [/Ë/g, 'ध्'],
    [/è/g, 'ध'],
    [/¶/g, 'फ्'],
    [/¸/g, 'य्'],
    [/Vª/g, 'ट्र'],
    [/Mª/g, 'ड्र'],
    [/Nª/g, 'छ्र'],
    [/<ªª/g, 'ढ्र'],
    [/<ª/g, 'ढ्र'],
    [/ª/g, '्र'],
    [/xz/g, 'ग्र'],
    [/nzZ/g, 'र्द्र'],
    [/~j/g, '्र'],
    [/#/g, 'रु'],
    [/:/g, 'रू'],
    [/Œ/g, '॰'],
    [/ñ/g, '॰'],
    [/,s/g, 'ऐ'],
    [/,/g, 'ए'],      // Comma key in Remington layout gives 'ए' (e.g. 'fy,' -> 'लिए')
    [/vksSa/g, 'ॐ'],
    [/AA/g, '॥'],
    [/A/g, '।'],
    [/n~;/g, 'द्य'],
    [/n~\?k/g, 'द्घ'],
    [/n~e/g, 'द्ध'],
    [/n~o/g, 'द्व'],
    [/n~Hk/g, 'द्भ'],
    [/r~r/g, 'त्त'],
    [/Dr/g, 'क्त'],
    [/g~u/g, 'ह्न'],
    [/g~;/g, 'ह्य'],
    [/g~z/g, 'ह्र'],
    [/g~y/g, 'ह्ल'],
    [/g~o/g, 'ह्व'],
    [/vkW/g, 'ऑ'],
    [/vkS/g, 'औ'],
    [/vks/g, 'ओ'],
    [/vk/g, 'आ'],
    [/v/g, 'अ'],
    [/bZ/g, 'ई'],
    [/b/g, 'इ'],
    [/Å/g, 'ऊ'],
    [/m/g, 'उ'],
    [/C\+/g, 'ॠ'],
    [/C/g, 'ऋ'],
    [/W/g, 'ऍ'],
    [/\{k/g, 'क्ष'],
    [/\{/g, 'क्ष्'],
    [/\[k/g, 'ख'],
    [/\[/g, 'ख्'],
    [/\?k/g, 'घ'],
    [/\?/g, 'घ्'],
    [/³/g, 'ङ'],
    [/p/g, 'च'],
    [/T/g, 'झ'],
    [/¥/g, 'ञ'],
    [/V/g, 'ट'],
    [/B/g, 'ठ'],
    [/M/g, 'ड'],
    [/</g, 'ढ'],
    [/\.k/g, 'ण'],
    [/Fk/g, 'थ'],
    [/F/g, 'थ्'],
    [/\/k/g, 'ध'],
    [/\//g, 'ध्'],
    [/Q/g, 'फ'],
    [/Hk/g, 'भ'],
    [/H/g, 'भ्'],
    [/'k/g, 'श'],
    [/'/g, 'श्'],
    [/"k/g, 'ष'],
    [/"/g, 'ष्'],
    [/d/g, 'क'],
    [/x/g, 'ग'],
    [/t/g, 'ज'],
    [/r/g, 'त'],
    [/n/g, 'द'],
    [/u/g, 'न'],
    [/i/g, 'प'],
    [/c/g, 'ब'],
    [/e/g, 'म'],
    [/;/g, 'य'],
    [/j/g, 'र'],
    [/y/g, 'ल'],
    [/G/g, 'ळ'],
    [/o/g, 'व'],
    [/l/g, 'स'],
    [/g/g, 'ह'],
    [/K/g, 'ज्ञ'],
    [/=/g, 'त्र'],
    [/J/g, 'श्र'],
    [/N/g, 'छ'],
    [/kS/g, 'ौ'],
    [/ks/g, 'ो'],
    [/k/g, 'ा'],
    [/h/g, 'ी'],
    [/q/g, 'ु'],
    [/w/g, 'ू'],
    [/`/g, 'ृ'],
    [/s/g, 'े'],
    [/S/g, 'ै'],
    [/a/g, 'ं'],
    [/¡/g, 'ँ'],
    [/%/g, 'ः'],
    [/\+/g, '़'],
    [/~/g, '्'],
    [/z/g, '्र'],
    // Half consonants
    [/D/g, 'क्'],
    [/X/g, 'ग्'],
    [/P/g, 'च्'],
    [/Y/g, 'ल्'],
    [/U/g, 'न्'],
    [/I/g, 'प्'],
    [/O/g, 'व्'],
    [/L/g, 'स्'],
    [/E/g, 'म्'],
    [/R/g, 'त्'],
  ];

  // Reorder 'f' (matra 'ि') which is placed before consonant in DevLys
  text = text.replace(/f([d\[x\?pNtTVBM<.\/rFnduipcHe;jyGolgh'"{çÁØÝæäéàáâãíìïêëô÷|}=KJ]k?(?:~[d\[x\?pNtTVBM<.\/rFnduipcHe;jyGolgh'"{çÁØÝæäéàáâãíìïêëô÷|}=KJ]k?)?|(?:[DXPTURFICEHYOL]{1,2}[d\[x\?pNtTVBM<.\/rFnduipcHe;jyGolgh'"{çÁØÝæäéàáâãíìïêëô÷|}=KJ]k?))/g, '$1f');

  // Convert compounds
  for (const [regex, rep] of compoundReplacements) {
    text = text.replace(regex, rep);
  }

  // Handle reph 'Z' -> 'र्' before consonant
  text = text.replace(/([क-ह](?:्[क-ह])*(?:[ा-ौ])?)Z/g, 'र्$1');

  // Final cleanup of any standalone 'f' converted to 'ि'
  text = text.replace(/f/g, 'ि');

  // Convert initial/isolated 'े' and 'ै' to independent vowels 'ए' and 'ऐ'
  text = text.replace(/(^|[\s«»“”"‘’'()\[\]{}<>\/\\।|.,;:!?\-+=_*~^%#@`])े/gu, '$1ए');
  text = text.replace(/(^|[\s«»“”"‘’'()\[\]{}<>\/\\।|.,;:!?\-+=_*~^%#@`])ै/gu, '$1ऐ');
  text = text.replace(/([अआइईउऊऋएऐओऔ])े/gu, '$1ए');
  text = text.replace(/([अआइईउऊऋएऐओऔ])ै/gu, '$1ऐ');

  return text.normalize('NFC');
}

// Mapping of Unicode Devanagari to DevLys 010 / Kruti Dev 010
export function convertUnicodeToDevlys(unicodeText: string): string {
  if (!unicodeText) return '';

  let modifiedText = unicodeText.normalize('NFC');

  // Substitute common complex conjuncts & matras
  const replacements: [RegExp, string][] = [
    [/ॐ/g, 'vksSa'],
    [/।/g, 'A'],
    [/॥/g, 'AA'],
    [/०/g, '0'],
    [/१/g, '1'],
    [/२/g, '2'],
    [/३/g, '3'],
    [/४/g, '4'],
    [/५/g, '5'],
    [/६/g, '6'],
    [/७/g, '7'],
    [/८/g, '8'],
    [/९/g, '9'],
    [/्र/g, 'z'],
    [/र्/g, 'Z'],
    [/त्र/g, '='],
    [/ज्ञ/g, 'K'],
    [/श्र/g, 'J'],
    [/क्ष/g, '{k'],
    [/क्ष्/g, '{'],
    [/द्य/g, 'n~;'],
    [/द्घ/g, 'n~?k'],
    [/द्ध/g, 'n~e'],
    [/द्व/g, 'n~o'],
    [/द्भ/g, 'n~Hk'],
    [/द्म/g, 'n~e'],
    [/त्त/g, 'r~r'],
    [/क्त/g, 'Dr'],
    [/ह्न/g, 'g~u'],
    [/ह्य/g, 'g~;'],
    [/ह्र/g, 'g~z'],
    [/ह्ल/g, 'g~y'],
    [/ह्व/g, 'g~o'],
    [/ऋ/g, 'C'],
    [/ॠ/g, 'C+'],
    [/ऌ/g, ''],
    [/ऍ/g, 'W'],
    [/ऎ/g, ''],
    [/ए/g, 's'],
    [/ऐ/g, 'S'],
    [/ऑ/g, 'vkW'],
    [/ऒ/g, ''],
    [/ओ/g, 'vks'],
    [/औ/g, 'vkS'],
    [/अ/g, 'v'],
    [/आ/g, 'vk'],
    [/इ/g, 'b'],
    [/ई/g, 'bZ'],
    [/उ/g, 'm'],
    [/ऊ/g, 'Å'],
    [/क/g, 'd'],
    [/ख/g, '[k'],
    [/ग/g, 'x'],
    [/घ/g, '?k'],
    [/ङ/g, '³'],
    [/च/g, 'p'],
    [/छ/g, 'N'],
    [/ज/g, 't'],
    [/झ/g, 'T'],
    [/ञ/g, '¥'],
    [/ट/g, 'V'],
    [/ठ/g, 'B'],
    [/ड/g, 'M'],
    [/ढ/g, '<'],
    [/ण/g, '.k'],
    [/त/g, 'r'],
    [/थ/g, 'Fk'],
    [/द/g, 'n'],
    [/ध/g, '/k'],
    [/न/g, 'u'],
    [/प/g, 'i'],
    [/फ/g, 'Q'],
    [/ब/g, 'c'],
    [/भ/g, 'Hk'],
    [/म/g, 'e'],
    [/य/g, ';'],
    [/र/g, 'j'],
    [/ल/g, 'y'],
    [/ळ/g, 'G'],
    [/व/g, 'o'],
    [/श/g, "'k"],
    [/ष/g, '"k'],
    [/स/g, 'l'],
    [/ह/g, 'g'],
    [/ा/g, 'k'],
    [/ि/g, 'f'],
    [/ी/g, 'h'],
    [/ु/g, 'q'],
    [/ू/g, 'w'],
    [/ृ/g, '`'],
    [/े/g, 's'],
    [/ै/g, 'S'],
    [/ो/g, 'ks'],
    [/ौ/g, 'kS'],
    [/ं/g, 'a'],
    [/ँ/g, '¡'],
    [/ः/g, '%'],
    [/़/g, '+'],
    [/्/g, '~'],
  ];

  // Handle 'i' matra position (in Unicode it comes after consonant, in DevLys it comes before)
  const matraPattern = /([क-ह](?:्[क-ह])*)(ि)/g;
  modifiedText = modifiedText.replace(matraPattern, 'f$1');

  // Handle 'reph' (र्) which comes at the end in DevLys
  const rephPattern = /(र्)([क-ह](?:[ा-ौ]?))/g;
  modifiedText = modifiedText.replace(rephPattern, '$2Z');

  for (const [regex, rep] of replacements) {
    modifiedText = modifiedText.replace(regex, rep);
  }

  return modifiedText;
}

// DevLys 010 Key Reference Map for On-Screen Remington Layout Helper
export const DEVLYS_KEYBOARD_LAYOUT = [
  { key: 'Q', shift: 'फ (Q)', normal: 'ु (q)', char: 'q' },
  { key: 'W', shift: 'ऑ (W)', normal: 'ू (w)', char: 'w' },
  { key: 'E', shift: 'म् (E)', normal: 'म (e)', char: 'e' },
  { key: 'R', shift: 'त् (R)', normal: 'त (r)', char: 'r' },
  { key: 'T', shift: 'ज् (T)', normal: 'ज (t)', char: 't' },
  { key: 'Y', shift: 'ल् (Y)', normal: 'ल (y)', char: 'y' },
  { key: 'U', shift: 'न् (U)', normal: 'न (u)', char: 'u' },
  { key: 'I', shift: 'प् (I)', normal: 'प (i)', char: 'i' },
  { key: 'O', shift: 'व् (O)', normal: 'व (o)', char: 'o' },
  { key: 'P', shift: 'च् (P)', normal: 'च (p)', char: 'p' },
  { key: 'A', shift: 'ं (A)', normal: 'ं (a)', char: 'a' },
  { key: 'S', shift: 'ै (S)', normal: 'े (s)', char: 's' },
  { key: 'D', shift: 'क् (D)', normal: 'क (d)', char: 'd' },
  { key: 'F', shift: 'थ् (F)', normal: 'ि (f)', char: 'f' },
  { key: 'G', shift: 'ळ (G)', normal: 'ह (g)', char: 'g' },
  { key: 'H', shift: 'भ् (H)', normal: 'ी (h)', char: 'h' },
  { key: 'J', shift: 'श्र (J)', normal: 'र (j)', char: 'j' },
  { key: 'K', shift: 'ज्ञ (K)', normal: 'ा (k)', char: 'k' },
  { key: 'L', shift: 'स् (L)', normal: 'स (l)', char: 'l' },
  { key: 'Z', shift: 'र् (Z / Shift+Z)', normal: '्र (Z - प्र)', char: 'z' },
  { key: 'X', shift: 'ग् (X)', normal: 'ग (x)', char: 'x' },
  { key: 'C', shift: 'ऋ (C)', normal: 'ब (c)', char: 'c' },
  { key: 'V', shift: 'अ (V)', normal: 'ट (v)', char: 'v' },
  { key: 'B', shift: 'इ (B)', normal: 'ठ (b)', char: 'b' },
  { key: 'N', shift: 'छ (N)', normal: 'द (n)', char: 'n' },
  { key: 'M', shift: 'ड (M)', normal: 'उ (m)', char: 'm' },
];
