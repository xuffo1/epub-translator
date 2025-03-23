export interface BookMetadata {
  title: string;
  creator?: string;
  publisher?: string;
  language?: string;
  cover?: string;
}

export interface BookLocation {
  cfi: string;
  href: string;
  percentage: number;
  location: number;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  coverUrl?: string;
  file?: File;
  addedAt: number;
  lastLocation?: {
    cfi: string;
    percentage: number;
  };
}

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface Bookmark {
  cfi: string;
  href: string;
  text: string;
  chapter?: string;
  createdAt: number;
  pageNumber?: number;
  coverUrl?: string;
}

export interface Highlight {
  cfi: string;
  text: string;
  color: string;
  chapter?: string;
  createdAt: number;
  percentage: number;
}

export interface ReadingProgress {
  cfi: string;
  percentage: number;
  lastRead: number;
  chapter?: string;
  isTranslated?: boolean;
}

export interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  theme: 'light' | 'sepia' | 'dark';
  margin: number;
}

export interface BookConfig {
  settings: ReaderSettings;
  progress: ReadingProgress | null;
  bookmarks: Bookmark[];
  highlights: Highlight[];
  language: string;
  lastAccessed: number;
}

export type LanguageOption = {
  code: string;
  name: string;
};

// Highlight colors
export const HIGHLIGHT_COLORS = [
  { id: 'yellow', value: '#ffeb3b' },
  { id: 'pink', value: '#f8bbd0' },
  { id: 'blue', value: '#90caf9' },
  { id: 'green', value: '#c5e1a5' },
  { id: 'purple', value: '#d1c4e9' }
];

// Comprehensive language list for translation
export const LANGUAGES: LanguageOption[] = [
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Albanian' },
  { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'hy', name: 'Armenian' },
  { code: 'as', name: 'Assamese' },
  { code: 'ay', name: 'Aymara' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'bm', name: 'Bambara' },
  { code: 'eu', name: 'Basque' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bho', name: 'Bhojpuri' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'ceb', name: 'Cebuano' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'zh-TW', name: 'Chinese Traditional' },
  { code: 'co', name: 'Corsican' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'dv', name: 'Dhivehi' },
  { code: 'doi', name: 'Dogri' },
  { code: 'nl', name: 'Dutch (Nederlands)' },
  { code: 'en', name: 'English' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'et', name: 'Estonian' },
  { code: 'ee', name: 'Ewe' },
  { code: 'fil', name: 'Filipino' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'fy', name: 'Frisian' },
  { code: 'gl', name: 'Galician' },
  { code: 'ka', name: 'Georgian' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'el', name: 'Greek' },
  { code: 'gn', name: 'Guarani' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ht', name: 'Haitian Creole' },
  { code: 'ha', name: 'Hausa' },
  { code: 'haw', name: 'Hawaiian' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'hmn', name: 'Hmong' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'ig', name: 'Igbo' },
  { code: 'ilo', name: 'Ilocano' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ga', name: 'Irish' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'jv', name: 'Javanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' },
  { code: 'rw', name: 'Kinyarwanda' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'kri', name: 'Krio' },
  { code: 'ku', name: 'Kurdish' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'lo', name: 'Lao' },
  { code: 'la', name: 'Latin' },
  { code: 'lv', name: 'Latvian' },
  { code: 'ln', name: 'Lingala' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lg', name: 'Luganda' },
  { code: 'lb', name: 'Luxembourgish' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'mai', name: 'Maithili' },
  { code: 'mg', name: 'Malagasy' },
  { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mt', name: 'Maltese' },
  { code: 'mi', name: 'Maori' },
  { code: 'mr', name: 'Marathi' },
  { code: 'mni-Mtei', name: 'Meiteilon (Manipuri)' },
  { code: 'lus', name: 'Mizo' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'my', name: 'Myanmar (Burmese)' },
  { code: 'ne', name: 'Nepali' },
  { code: 'no', name: 'Norwegian' },
  { code: 'ny', name: 'Nyanja (Chichewa)' },
  { code: 'or', name: 'Odia (Oriya)' },
  { code: 'om', name: 'Oromo' },
  { code: 'ps', name: 'Pashto' },
  { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish (Polski)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'qu', name: 'Quechua' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'sm', name: 'Samoan' },
  { code: 'sa', name: 'Sanskrit' },
  { code: 'gd', name: 'Scots Gaelic' },
  { code: 'nso', name: 'Sepedi' },
  { code: 'sr', name: 'Serbian' },
  { code: 'st', name: 'Sesotho' },
  { code: 'sn', name: 'Shona' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'si', name: 'Sinhala (Sinhalese)' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'so', name: 'Somali' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'su', name: 'Sundanese' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish (Svenska)' },
  { code: 'tl', name: 'Tagalog (Filipino)' },
  { code: 'tg', name: 'Tajik' },
  { code: 'ta', name: 'Tamil' },
  { code: 'tt', name: 'Tatar' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai (ไทย)' },
  { code: 'ti', name: 'Tigrinya' },
  { code: 'ts', name: 'Tsonga' },
  { code: 'tr', name: 'Turkish (Türkçe)' },
  { code: 'tk', name: 'Turkmen' },
  { code: 'ak', name: 'Twi (Akan)' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ug', name: 'Uyghur' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'vi', name: 'Vietnamese (Tiếng Việt)' },
  { code: 'cy', name: 'Welsh' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'yi', name: 'Yiddish' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' }
];

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 100,
  fontFamily: 'serif',
  lineHeight: 1.5,
  theme: 'light',
  margin: 20
};