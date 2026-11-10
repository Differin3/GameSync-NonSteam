/**
 * Пресеты провайдеров хранилищ — единственный источник правды для UI.
 *
 * Порядок в списках важен: сначала то, что проще всего настроить
 * русскоязычному пользователю, «свои серверы» — посередине,
 * международные сервисы и произвольный WebDAV — в конце.
 *
 * Провайдеры и их условия меняются (Box выключил WebDAV в 2023,
 * Яндекс с 22.06.2026 требует подписку 360 для WebDAV), поэтому
 * описания должны обновляться вместе с реальностью, а не жить в TSX.
 */

export type StorageKind = "webdav" | "s3" | "ftp" | "sftp";

export type PresetRegion = "ru" | "self" | "intl";

export interface WebDAVPreset {
  id: string;
  name: string;
  /** URL, который подставляется при выборе провайдера (может быть шаблоном). */
  url: string;
  /** Короткий статус для списка: «бесплатно», «нужна подписка» и т.п. */
  status: string;
  region: PresetRegion;
  description: string;
  /** Что вводить в поля логин/пароль. */
  credentials: string;
  /** Важное предупреждение (показывается отдельным блоком). */
  warning?: string;
}

export const WEBDAV_PRESETS: WebDAVPreset[] = [
  {
    id: "mail",
    name: "Облако Mail.ru",
    url: "https://webdav.cloud.mail.ru",
    status: "есть бесплатный тариф",
    region: "ru",
    description:
      "Облако Mail.ru: WebDAV включён в сервисе, отдельная регистрация не нужна — подойдёт обычный почтовый аккаунт.",
    credentials:
      "Логин — полный адрес почты (name@mail.ru). Пароль — пароль аккаунта или пароль для внешних приложений, если включена двухфакторная защита.",
  },
  {
    id: "yandex",
    name: "Яндекс Диск",
    url: "https://webdav.yandex.ru",
    status: "нужна подписка 360",
    region: "ru",
    description: "Яндекс Диск по WebDAV: одна папка GameSync в вашем облаке.",
    credentials:
      "Логин — имя пользователя без @yandex.ru. Пароль — пароль приложения «WebDAV» (Яндекс ID → Безопасность → Пароли приложений).",
    warning:
      "С 22 июня 2026 доступ по WebDAV требует подписку Яндекс 360. Если подписки нет — используйте Облако Mail.ru.",
  },
  {
    id: "nextcloud",
    name: "Nextcloud",
    url: "https://cloud.example.com/remote.php/dav/files/USERNAME/",
    status: "свой сервер",
    region: "self",
    description:
      "Свой или корпоративный Nextcloud. Подойдёт любой хостинг, включая домашний сервер и NAS.",
    credentials:
      "Замените cloud.example.com и USERNAME на свои. Логин и пароль — от Nextcloud; при двухфакторной защите создайте пароль приложения.",
  },
  {
    id: "owncloud",
    name: "ownCloud",
    url: "https://cloud.example.com/remote.php/dav/files/USERNAME/",
    status: "свой сервер",
    region: "self",
    description: "Свой сервер ownCloud (или совместимый WebDAV-хостинг).",
    credentials:
      "Замените cloud.example.com и USERNAME на свои. Логин и пароль — от ownCloud.",
  },
  {
    id: "fastmail",
    name: "Fastmail Files",
    url: "https://myfiles.fastmail.com",
    status: "подписка Fastmail",
    region: "intl",
    description: "Файловое хранилище Fastmail, доступное по WebDAV.",
    credentials:
      "Логин — полный логин Fastmail. Пароль — пароль приложения с доступом к файлам (Files).",
  },
  {
    id: "custom",
    name: "Другой WebDAV",
    url: "",
    status: "любой сервер",
    region: "intl",
    description:
      "Любой сервер с WebDAV: NAS, VPS, корпоративное облако. Google Drive, OneDrive, Dropbox и MEGA не поддерживают WebDAV напрямую — для них нужен S3-совместимый сервис или свой сервер.",
    credentials: "URL сервера, логин и пароль — в документации вашего сервиса.",
  },
];

export interface S3Preset {
  name: string;
  endpoint: string;
  region: string;
  pathStyle: boolean;
  status: string;
}

export const S3_PROVIDERS: Record<string, S3Preset> = {
  custom: { name: "Другой S3", endpoint: "", region: "us-east-1", pathStyle: false, status: "любой S3" },
  yandex: { name: "Yandex Object Storage", endpoint: "https://storage.yandexcloud.net", region: "ru-central1", pathStyle: false, status: "платно" },
  vk: { name: "VK Cloud", endpoint: "https://s3.mcs.mail.ru", region: "ru-1", pathStyle: true, status: "платно" },
  cloudru: { name: "Cloud.ru", endpoint: "https://s3.cloud.ru", region: "ru-central1", pathStyle: true, status: "платно" },
  aws: { name: "AWS S3", endpoint: "https://s3.amazonaws.com", region: "us-east-1", pathStyle: false, status: "платно" },
  backblaze: { name: "Backblaze B2", endpoint: "https://s3.us-west-004.backblazeb2.com", region: "us-west-004", pathStyle: true, status: "10 ГБ бесплатно" },
  wasabi: { name: "Wasabi", endpoint: "https://s3.wasabisys.com", region: "us-east-1", pathStyle: true, status: "платно" },
  digitalocean: { name: "DigitalOcean Spaces", endpoint: "https://nyc3.digitaloceanspaces.com", region: "nyc3", pathStyle: true, status: "платно" },
};

const CUSTOM_PRESET = WEBDAV_PRESETS[WEBDAV_PRESETS.length - 1];

/** Приводит сохранённое значение (в т.ч. устаревшее, например box) к известному id. */
export function normalizeWebDAVProviderId(value: unknown): string {
  if (typeof value === "string" && WEBDAV_PRESETS.some((preset) => preset.id === value)) {
    return value;
  }
  return "custom";
}

export function getWebDAVPreset(id: string | undefined | null): WebDAVPreset {
  return WEBDAV_PRESETS.find((preset) => preset.id === id) || CUSTOM_PRESET;
}

/**
 * Определяет провайдера по URL, чтобы пользователю не приходилось
 * выбирать его вручную, если он вставил адрес.
 */
export function detectWebDAVProvider(url: string): string | null {
  const value = (url || "").trim().toLowerCase();
  if (!value) return null;
  if (/webdav\.yandex\.ru/.test(value)) return "yandex";
  if (/webdav\.cloud\.mail\.ru/.test(value)) return "mail";
  if (/fastmail\.com/.test(value)) return "fastmail";
  if (/\/remote\.php\/dav\//.test(value)) return "nextcloud";
  return null;
}
