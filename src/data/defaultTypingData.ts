import { TypingTest, TypingAttempt } from '../types';

export const INITIAL_TYPING_TESTS: TypingTest[] = [
  {
    id: 'tt-english-01',
    title: 'Rajasthan Administrative Services Speed Assessment (English)',
    language: 'ENGLISH',
    durationMinutes: 10,
    minPassingWpm: 30,
    targetBlock: 'District-Wide',
    instructions: 'Type the passage exactly as displayed. Punctuation, capitalization, and spacing will be strictly evaluated. The assessment will automatically finish after 10 minutes.',
    status: 'PUBLISHED',
    createdBy: 'District Administration',
    createdAt: new Date().toISOString(),
    totalWords: 312,
    passageText:
      'The District Administration of Rajsamand is committed to ensuring prompt, transparent, and accountable delivery of public services to all citizens. Under the visionary governance model of the Government of Rajasthan, various administrative reforms and e-governance initiatives have been successfully implemented across all seven tehsils, including Nathdwara, Kumbhalgarh, Bhim, Rajsamand, Amet, Deogarh, and Railmagra. The objective of this official speed assessment is to evaluate the computer typing proficiency, accuracy, and operational agility of candidate personnel. Efficient document drafting and rapid data entry play a vital role in government offices, particularly in citizen-centric portals such as e-Mitra, Jan Soochna Portal, and the Rajasthan Sampark grievance redressal portal. All participating candidates must maintain consistent rhythm, sharp concentration, and strict adherence to orthographic rules throughout the allotted duration of ten minutes. Errors in spelling, punctuation marks, or omissions will impact the net speed calculation according to state evaluation guidelines. Candidates are advised to review each paragraph diligently and manage their time effectively to secure qualifying merit.',
  },
  {
    id: 'tt-hindi-devlys-01',
    title: 'jktLFkku ftyk iz\'kklu fgUnh xfr ewY;kadu & DevLys 010 (Set A)',
    language: 'HINDI_DEVLYS_010',
    durationMinutes: 10,
    minPassingWpm: 25,
    targetBlock: 'District-Wide',
    instructions: 'दिए गए गद्यांश को DevLys 010 फॉन्ट (Remington लेआउट) में टाइप करें। 10 मिनट की समयावधि पूर्ण होते ही टेस्ट स्वतः सबमिट हो जाएगा।',
    status: 'PUBLISHED',
    createdBy: 'District Administration',
    createdAt: new Date().toISOString(),
    totalWords: 245,
    passageText:
      'jktLFkku ljdkj ds ftyk iz\'kklu jktlean }kjk lHkh ukxfjdksa dks le;c) ,oa ikjn\'khZ lsok,a miyC/k djkus gsrq fujUrj iz;kl fd, tk jgs gSaA ftyk dysDVj dk;kZy; esa bZ&fe=] tu lwpuk iksVZy ,oa tu vHkko vfHk;ksx fujkdj.k gsrq fo\'ks"k O;oLFkk dh xbZ gSA ftyk iz\'kklu }kjk fofHkUu fodkl ;kstukvksa dk fØ;kUo;u xzkeh.k ,oa \'kgjh {ks=ksa esa izHkkoh <ax ls fd;k tk jgk gSA bl n{krk ewY;kadu ijh{kk esa lHkh vH;fFkZ;ksa dh xfr ,oa \'kq)rk dk ewY;kadu jkT; ljdkj ds ekudksa ds vuqlkj fd;k tk,xkA vH;FkhZ /;kuiwoZd Vkbi djsa rFkk le; lhek dk fo\'ks"k /;ku j[ksaA fdlh Hkh izdkj dh =qfV gksus ij ' +
      'vH;FkhZ cSdLisl dk iz;ksx dj \'kq)rk lqfuf\'pr dj ldrs gSaA nloha feuV dh vof/k iwjh gksrs gh ijh{kk Lor% lekIr gks tk,xhA',
  },
];

export const INITIAL_TYPING_ATTEMPTS: TypingAttempt[] = [];
