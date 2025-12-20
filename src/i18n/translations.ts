/**
 * Language dictionaries for Russian translations.
 */
export const ru = {
  'Here is the manual about creating your own client:':
    'Инструкция по созданию собственного клиента:',
  manual: 'инструкция',
  'Google client ID': 'ID клиента Google',
  'Enter your client ID': 'Введите ваш ID клиента',
  'Google client secret': 'Секрет клиента Google',
  'Enter your client secret': 'Введите ваш секрет клиента',
  'Login with Google': 'Войти через Google',
  "Open Google's auth page in your browser":
    'Откройте страницу авторизации Google в вашем браузере',
  Login: 'Вход',
  'Please enter your client ID first.':
    'Пожалуйста, сначала введите ID клиента.',
  'Authorization code': 'Код авторизации',
  'Paste the code from Google after login':
    'Вставьте код, полученный после входа в Google',
  'Paste code here': 'Вставьте код сюда',
  'Client ID and secret required.': 'Требуются ID клиента и секрет.',
  'Tokens saved!': 'Токены сохранены!',
  'Contacts folder': 'Папка с контактами',
  'Vault folder where contact notes will be stored':
    'Папка хранилища, где будут сохраняться заметки контактов',
  'e.g. Contacts': 'например, Контакты',
  'Note template': 'Шаблон заметки',
  'Template to insert below the metadata block for new contact notes':
    'Шаблон, вставляемый под метаданные новой заметки контакта',
  'e.g. # Notes\n\nWrite something here...':
    'например, # Заметки\n\nНапишите что-нибудь...',
  'File name prefix': 'Префикс имени файла',
  'Prefix to add to the beginning of each contact file name':
    'Префикс, добавляемый к имени файла контакта',
  'e.g. p ': 'например, p ',
  'Property name prefix': 'Префикс имени свойства',
  'Prefix to add to the beginning of each contact property name':
    'Префикс, добавляемый к имени свойства контакта (игнорируется в стратегии VCF)',
  'Naming strategy': 'Стратегия именования',
  'Strategy to generate frontmatter keys from contact data':
    'Стратегия генерации ключей frontmatter из данных контакта',
  Default: 'Стандартная',
  'VCF (vCard)': 'VCF (vCard)',
  'Organization as link': 'Организация как ссылка',
  'Organization name will be stored as a obsidian link [[...]] instead of plain text':
    'Название организации будет сохранено как ссылка Obsidian [[...]] вместо обычного текста (игнорируется в стратегии VCF)',
  'Label to sync': 'Лейблы для синхронизации',
  'If not empty, then only contacts with this label will synced':
    'Если указана, синхронизируются только контакты с этим лейблом',
  'e.g. obsidian': 'например, obsidian',
  'Auto sync period': 'Период автосинхронизации',
  'Period in minutes. If 0, then never. 1 day = 1440':
    'Период в минутах. Если 0, то никогда. 1 день = 1440',
  'e.g. 1440': 'например, 1440',
  'Sync on startup': 'Синхронизация при запуске',
  'Automatically sync contacts when the plugin is loaded.':
    'Автоматически синхронизировать контакты при загрузке плагина.',
  'e.g. s_': 'например, s_',
  'Google auth': 'Google авторизация',
  'Google contacts synced!': 'Google контакты синхронизированы!',
  'Failed to obtain access token. Please re-authenticate.':
    'Не удалось получить токен доступа. Пожалуйста, повторите аутентификацию.',
  'Track last sync time in notes':
    'Отслеживать время последней синхронизации в заметках',
  'If enabled, the plugin will update the synced property in each note with the last synchronization time. This may cause performance issues with very large contact lists.':
    'Если включено, плагин будет обновлять свойство синхронизации в каждой заметке с временем последней синхронизации. Это может вызвать проблемы с производительностью при очень больших списках контактов. (игнорируется в стратегии VCF)',
  'Rename files if name changed': 'Переименовывать файлы, если имя изменилось',
  'If enabled, existing contact files will be renamed if the contact name changes. All links in vault will be updated accordingly.':
    'Если включено, существующие файлы контактов будут переименованы, если изменится имя контакта. Все ссылки в хранилище будут обновлены соответственно.',
  'Starting contact audit...': 'Запуск аудита контактов...',
  'Contacts folder not found': 'Папка контактов не найдена',
  'Contact Audit Report': 'Отчет аудита контактов',
  Date: 'Дата',
  'Checked Folder': 'Проверенная папка',
  'Sync Label': 'Лейбл синхронизации',
  None: 'Нет',
  'No orphaned contacts found.': 'Удалённых контактов не найдено.',
  'All contact notes in the folder match existing Google Contacts.':
    'Все заметки контактов в папке соответствуют существующим контактам Google.',
  Found: 'Найдено',
  'orphaned contact notes': 'удалённых заметок',
  'These notes have a contact ID that was not found in your Google Contacts (filtered by label).':
    'Эти заметки имеют ID контакта, который не был найден в ваших контактах Google (с фильтром по лейблу).',
  File: 'Файл',
  'Contact ID': 'ID контакта',
  'Audit complete. Report saved to': 'Аудит завершен. Отчет сохранен в',
};

/**
 * Language dictionaries for Latvian translations.
 */
export const lv = {
  'Here is the manual about creating your own client:':
    'Šeit ir rokasgrāmata klienta izveidei:',
  manual: 'rokasgrāmata',
  'Google client ID': 'Google klienta ID',
  'Enter your client ID': 'Ievadiet savu klienta ID',
  'Google client secret': 'Google klienta slepenais atslēga',
  'Enter your client secret': 'Ievadiet savu slepeno atslēgu',
  'Login with Google': 'Pieslēgties ar Google',
  "Open Google's auth page in your browser":
    'Atveriet Google OAuth lapu pārlūkprogrammā',
  Login: 'Pieteikties',
  'Please enter your client ID first.': 'Lūdzu, vispirms ievadiet klienta ID.',
  'Authorization code': 'Autorizācijas kods',
  'Paste the code from Google after login':
    'Ielīmējiet kodu no Google pēc pieteikšanās',
  'Paste code here': 'Ielīmējiet kodu šeit',
  'Client ID and secret required.':
    'Nepieciešams klienta ID un slepenais atslēga.',
  'Tokens saved!': 'Žetoni saglabāti!',
  'Contacts folder': 'Kontaktpersonu mape',
  'Vault folder where contact notes will be stored':
    'Mape, kurā tiks saglabātas kontaktpersonu piezīmes',
  'e.g. Contacts': 'piem., Contacts',
  'Note template': 'Piezīmes veidne',
  'Template to insert below the metadata block for new contact notes':
    'Veidne, ko ievietot zem metadatu bloka jaunām kontaktu piezīmēm',
  'e.g. # Notes\n\nWrite something here...':
    'piem., # Piezīmes\n\nRakstiet šeit...',
  'File name prefix': 'Faila nosaukuma prefikss',
  'Prefix to add to the beginning of each contact file name':
    'Prefikss, ko pievienot kontaktu faila nosaukuma sākumā',
  'e.g. p ': 'piem., p ',
  'Property name prefix': 'Īpašības nosaukuma prefikss',
  'Prefix to add to the beginning of each contact property name':
    'Prefikss, ko pievienot katras kontaktpersonas īpašības nosaukumam (tiek ignorēts VCF stratēģijā)',
  'Naming strategy': 'Nosaukšanas stratēģija',
  'Strategy to generate frontmatter keys from contact data':
    'Stratēģija frontmatter atslēgu ģenerēšanai no kontakta datiem',
  Default: 'Noklusējuma',
  'VCF (vCard)': 'VCF (vCard)',
  'Organization as link': 'Organizācija kā saite',
  'Organization name will be stored as a obsidian link [[...]] instead of plain text':
    'Organizācijas nosaukums tiks saglabāts kā Obsidian saite [[...]], nevis parasts teksts (tiek ignorēts VCF stratēģijā)',
  'Label to sync': 'Etiķete sinhronizēšanai',
  'If not empty, then only contacts with this label will synced':
    'Ja nav tukšs, tiks sinhronizēti tikai šīs etiķetes kontakti',
  'e.g. obsidian': 'piem., obsidian',
  'Auto sync period': 'Automātiskās sinhronizācijas periods',
  'Period in minutes. If 0, then never. 1 day = 1440':
    'Periods minūtēs. Ja 0, tad nekad. 1 diena = 1440',
  'e.g. 1440': 'piem., 1440',
  'Sync on startup': 'Sinhronizēt startējot',
  'Automatically sync contacts when the plugin is loaded.':
    'Automātiski sinhronizēt kontaktus, kad spraudnis tiek ielādēts.',
  'e.g. s_': 'piem., s_',
  'Google auth': 'Google autentifikācija',
  'Google contacts synced!': 'Google kontakti sinhronizēti!',
  'Failed to obtain access token. Please re-authenticate.':
    'Neizdevās iegūt piekļuves tokenu. Lūdzu, atkārtoti autentificējieties.',
  'Track last sync time in notes':
    'Sekot pēdējās sinhronizācijas laikam piezīmēs',
  'If enabled, the plugin will update the synced property in each note with the last synchronization time. This may cause performance issues with very large contact lists.':
    'Ja iespējots, spraudnis atjauninās synced rekvizītu katrā piezīmē ar pēdējās sinhronizācijas laiku. Tas var radīt veiktspējas problēmas, ja kontaktu skaits ir ļoti liels. (tiek ignorēts VCF stratēģijā)',
  'Rename files if name changed': 'Pārdēvēt failus, ja nosaukums ir mainīts',
  'If enabled, existing contact files will be renamed if the contact name changes. All links in vault will be updated accordingly.':
    'Ja iespējots, esošie kontaktu faili tiks pārdēvēti, ja mainīsies kontakta nosaukums. Visi saites glabātavā tiks atjauninātas atbilstoši.',
  'Starting contact audit...': 'Sākas kontaktu audits...',
  'Contacts folder not found': 'Kontaktu mape nav atrasta',
  'Contact Audit Report': 'Kontaktu audita pārskats',
  Date: 'Datums',
  'Checked Folder': 'Pārbaudītā mape',
  'Sync Label': 'Sinhronizācijas lēbels',
  None: 'Nav',
  'No orphaned contacts found.': 'Bāreņu kontakti nav atrasti.',
  'All contact notes in the folder match existing Google Contacts.':
    'Visas kontaktu piezīmes mapē atbilst esošajiem Google kontaktiem.',
  Found: 'Atrasts',
  'orphaned contact notes': 'bāreņu kontaktu piezīmes',
  'These notes have a contact ID that was not found in your Google Contacts (filtered by label).':
    'Šīm piezīmēm ir kontakta ID, kas netika atrasts jūsu Google kontaktos (filtrēts pēc lēbela).',
  File: 'Fails',
  'Contact ID': 'Kontakta ID',
  'Audit complete. Report saved to': 'Audits pabeigts. Pārskats saglabāts',
};

/**
 * Language dictionaries for English translations.
 */
export const en = {
  'Here is the manual about creating your own client:':
    'Here is the manual about creating your own client:',
  manual: 'manual',
  'Google client ID': 'Google client ID',
  'Enter your client ID': 'Enter your client ID',
  'Google client secret': 'Google client secret',
  'Enter your client secret': 'Enter your client secret',
  'Login with Google': 'Login with Google',
  "Open Google's auth page in your browser":
    "Open Google's auth page in your browser",
  Login: 'Login',
  'Please enter your client ID first.': 'Please enter your client ID first.',
  'Authorization code': 'Authorization code',
  'Paste the code from Google after login':
    'Paste the code from Google after login',
  'Paste code here': 'Paste code here',
  'Client ID and secret required.': 'Client ID and secret required.',
  'Tokens saved!': 'Tokens saved!',
  'Contacts folder': 'Contacts folder',
  'Vault folder where contact notes will be stored':
    'Vault folder where contact notes will be stored',
  'e.g. Contacts': 'e.g. Contacts',
  'Note template': 'Note template',
  'Template to insert below the metadata block for new contact notes':
    'Template to insert below the metadata block for new contact notes',
  'e.g. # Notes\n\nWrite something here...':
    'e.g. # Notes\n\nWrite something here...',
  'File name prefix': 'File name prefix',
  'Prefix to add to the beginning of each contact file name':
    'Prefix to add to the beginning of each contact file name',
  'e.g. p ': 'e.g. p ',
  'Property name prefix': 'Property name prefix',
  'Prefix to add to the beginning of each contact property name':
    'Prefix to add to the beginning of each contact property name (ignored in VCF strategy)',
  'Naming strategy': 'Naming strategy',
  'Strategy to generate frontmatter keys from contact data':
    'Strategy to generate frontmatter keys from contact data',
  Default: 'Default',
  'VCF (vCard)': 'VCF (vCard)',
  'Organization as link': 'Organization as link',
  'Organization name will be stored as a obsidian link [[...]] instead of plain text':
    'Organization name will be stored as a obsidian link [[...]] instead of plain text (ignored in VCF strategy)',
  'Label to sync': 'Label to sync',
  'If not empty, then only contacts with this label will synced':
    'If not empty, then only contacts with this label will synced',
  'e.g. obsidian': 'e.g. obsidian',
  'Auto sync period': 'Auto sync period',
  'Period in minutes. If 0, then never. 1 day = 1440':
    'Period in minutes. If 0, then never. 1 day = 1440',
  'e.g. 1440': 'e.g. 1440',
  'Sync on startup': 'Sync on startup',
  'Automatically sync contacts when the plugin is loaded.':
    'Automatically sync contacts when the plugin is loaded.',
  'Fallback to English': 'Fallback to English',
  'e.g. s_': 'e.g. s_',
  'Google auth': 'Google auth',
  'Google contacts synced!': 'Google contacts synced!',
  'Failed to obtain access token. Please re-authenticate.':
    'Failed to obtain access token. Please re-authenticate.',
  'Track last sync time in notes': 'Track last sync time in notes',
  'If enabled, the plugin will update the synced property in each note with the last synchronization time. This may cause performance issues with very large contact lists.':
    'If enabled, the plugin will update the synced property in each note with the last synchronization time. This may cause performance issues with very large contact lists. (ignored in VCF strategy)',
  'Rename files if name changed': 'Rename files if name changed',
  'If enabled, existing contact files will be renamed if the contact name changes. All links in vault will be updated accordingly.':
    'If enabled, existing contact files will be renamed if the contact name changes. All links in vault will be updated accordingly.',
  'Starting contact audit...': 'Starting contact audit...',
  'Contacts folder not found': 'Contacts folder not found',
  'Contact Audit Report': 'Contact Audit Report',
  Date: 'Date',
  'Checked Folder': 'Checked Folder',
  'Sync Label': 'Sync Label',
  None: 'None',
  'No orphaned contacts found.': 'No orphaned contacts found.',
  'All contact notes in the folder match existing Google Contacts.':
    'All contact notes in the folder match existing Google Contacts.',
  Found: 'Found',
  'orphaned contact notes': 'orphaned contact notes',
  'These notes have a contact ID that was not found in your Google Contacts (filtered by label).':
    'These notes have a contact ID that was not found in your Google Contacts (filtered by label).',
  File: 'File',
  'Contact ID': 'Contact ID',
  'Audit complete. Report saved to': 'Audit complete. Report saved to',
};
