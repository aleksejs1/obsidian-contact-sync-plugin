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
  Array: 'Массив',
  'Organization as link': 'Организация как ссылка',
  'Organization name will be stored as a obsidian link [[...]] instead of plain text':
    'Название организации будет сохранено как ссылка Obsidian [[...]] вместо обычного текста (игнорируется в стратегии VCF)',
  'Relations as links': 'Связи как ссылки',
  'Related people names will be stored as a obsidian link [[...]] instead of plain text':
    'Имена связанных людей будут сохранены как ссылка Obsidian [[...]] вместо обычного текста',
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
  'Format file names as Last First':
    'Форматировать имена файлов как Фамилия Имя',
  'If enabled, contact file names will be formatted as Last First instead of First Last':
    'Если включено, имена файлов контактов будут форматироваться как Фамилия Имя вместо Имя Фамилия',
  'Skip nameless contacts': 'Пропускать контакты без имени',
  'If enabled, contacts without a name (where the file would be named by ID) will be skipped during sync':
    'Если включено, контакты без имени (у которых файл называется по ID) будут пропускаться при синхронизации',
  'Use contact types for emails, phones and addresses':
    'Использовать типы для e-mail, телефонов и адресов',
  'If enabled, emails, phones and addresses will be formatted with their specific types (e.g. email_work, phone_mobile, address_home) instead of generic indexes. This is ignored in the Array naming strategy.':
    'Если включено, электронные адреса, телефоны и адреса будут отформатированы с учетом их типов (например, email_work, phone_mobile, address_home) вместо индексов. Игнорируется в стратегии "Массив".',
  'Sync website URLs': 'Синхронизировать веб-сайты',
  'If enabled, website URLs from contacts will be synced to the website frontmatter property':
    'Если включено, ссылки на веб-сайты из контактов будут синхронизированы в свойство website frontmatter',
  'Sync contact notes to note body':
    'Синхронизировать примечания контакта в текст заметки',
  'If enabled, the Notes field from Google Contacts is written to a managed section of the note body instead of the bio frontmatter property. Text outside that section is never changed.':
    'Если включено, поле «Примечания» из Google Contacts записывается в отдельный блок в тексте заметки вместо свойства bio во frontmatter. Текст за пределами блока не изменяется.',
  'VCF (vCard compatible)': 'VCF (совместимый с vCard)',
  'Custom prefix': 'Префикс свойств',
  'Prefix to use for properties when Default naming strategy is selected':
    'Префикс, используемый для свойств при выборе стандартной стратегии именования',
  'Save organizations as links': 'Сохранять организации как ссылки',
  'If enabled, organizations will be saved as Obsidian links (e.g. [[Organization]])':
    'Если включено, организации будут сохранены как ссылки Obsidian (например, [[Организация]])',
  'Save relations as links': 'Сохранять связи как ссылки',
  'If enabled, relations will be saved as Obsidian links (e.g. [[Jane Doe|Jane Doe (spouse)]])':
    'Если включено, связи будут сохранены как ссылки Obsidian (например, [[Иван Иванов|Иван Иванов (супруг)]])',
  'Track last sync time': 'Отслеживать время последней синхронизации',
  'If enabled, adds or updates a synced field with the last sync timestamp in UTC':
    'Если включено, добавляет или обновляет поле synced с отметкой времени последней синхронизации в UTC',
  'Sync interval (minutes)': 'Интервал синхронизации (минуты)',
  'Set the interval for automatic contact synchronization. Set to 0 to disable':
    'Период автоматической синхронизации контактов в минутах. Установите 0 для отключения',
  'Google contact label': 'Лейбл контактов Google',
  'Synchronize only contacts that have this specific Google Contacts label. Leave empty to sync all contacts':
    'Синхронизировать только контакты с этим лейблом Google Contacts. Оставьте пустым для синхронизации всех контактов',
  'Rename files': 'Переименовывать файлы',
  'Rename existing contact notes when their contact name changes':
    'Переименовывать существующие заметки контактов при изменении их имени',
  'Skip contacts that do not have a name': 'Пропускать контакты без имени',
  'Select naming strategy for frontmatter keys':
    'Выберите стратегию именования ключей frontmatter',
  'Send note edits back to Google Contacts':
    'Отправлять правки примечаний обратно в Google Contacts',
  'Experimental. Edits made inside the notes section are sent to the Notes field in Google Contacts during sync. Requires logging in with Google again to grant write access. If notes were changed both in Obsidian and in Google, neither side is changed and you are notified.':
    'Экспериментально. Правки внутри блока примечаний при синхронизации отправляются в поле «Примечания» в Google Contacts. Нужно заново войти через Google, чтобы выдать доступ на запись. Если примечания изменились и в Obsidian, и в Google, ни одна сторона не меняется, и вы получите уведомление.',
  'Log in with Google again to grant write access to your contacts.':
    'Войдите через Google ещё раз, чтобы выдать доступ на запись к контактам.',
  'Write access to Google Contacts is not granted. Log in with Google again in the plugin settings to send notes to Google.':
    'Нет доступа на запись в Google Contacts. Войдите через Google ещё раз в настройках плагина, чтобы отправлять примечания в Google.',
  'Sending notes to Google Contacts was cancelled.':
    'Отправка примечаний в Google Contacts отменена.',
  'Notes sent to Google Contacts: {count}':
    'Примечаний отправлено в Google Contacts: {count}',
  'Failed to send notes to Google Contacts for: {names}. Check console for details.':
    'Не удалось отправить примечания в Google Contacts для: {names}. Подробности в консоли.',
  'Notes were changed both in Obsidian and in Google Contacts, nothing was changed for: {names}. Make the notes match on one side to resolve.':
    'Примечания изменились и в Obsidian, и в Google Contacts, ничего не изменено для: {names}. Сделайте их одинаковыми на одной из сторон, чтобы разрешить конфликт.',
  'Edits to these notes were not sent: Google Contacts only allows reading them (other contacts or formatted notes): {names}':
    'Правки этих примечаний не отправлены: Google Contacts позволяет только читать их (другие контакты или примечания с форматированием): {names}',
  'Send notes to Google Contacts?': 'Отправить примечания в Google Contacts?',
  'Notes of {count} contacts were changed in Obsidian. They will replace the Notes field of these contacts in Google Contacts:':
    'Примечания {count} контактов изменены в Obsidian. Они заменят поле «Примечания» этих контактов в Google Contacts:',
  Send: 'Отправить',
  Cancel: 'Отмена',
  'Sync is already in progress.': 'Синхронизация уже выполняется.',
  'The notes section markers are damaged, these notes were not changed: {names}. Restore both marker lines or delete them.':
    'Маркеры блока примечаний повреждены, эти заметки не изменены: {names}. Восстановите обе строки маркеров или удалите их.',
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
  Array: 'Masīvs',
  'Organization as link': 'Organizācija kā saite',
  'Organization name will be stored as a obsidian link [[...]] instead of plain text':
    'Organizācijas nosaukums tiks saglabāts kā Obsidian saite [[...]], nevis parasts teksts (tiek ignorēts VCF stratēģijā)',
  'Relations as links': 'Attiecības kā saites',
  'Related people names will be stored as a obsidian link [[...]] instead of plain text':
    'Saistīto personu vārdi tiks saglabāti kā Obsidian saite [[...]], nevis parasts teksts',
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
  'Format file names as Last First':
    'Formatēt failu nosaukumus kā Uzvārds Vārds',
  'If enabled, contact file names will be formatted as Last First instead of First Last':
    'Ja iespējots, kontaktu failu nosaukumi tiks formatēti kā Uzvārds Vārds, nevis Vārds Uzvārds',
  'Skip nameless contacts': 'Izlaist kontaktus bez vārda',
  'If enabled, contacts without a name (where the file would be named by ID) will be skipped during sync':
    'Ja iespējots, kontakti bez vārda (kuru fails tiktu nosaukts pēc ID) tiks izlaisti sinhronizācijas laikā',
  'Use contact types for emails, phones and addresses':
    'Izmantot e-pasta, tālruņa un adrešu tipus',
  'If enabled, emails, phones and addresses will be formatted with their specific types (e.g. email_work, phone_mobile, address_home) instead of generic indexes. This is ignored in the Array naming strategy.':
    'Ja iespējots, e-pasti, tālruņi un adreses tiks formatēti ar to specifiskajiem tipiem (piem., email_work, phone_mobile, address_home), nevis vispārīgiem rādītājiem. Tas tiek ignorēts Array nosaukšanas stratēģijā.',
  'Sync website URLs': 'Sinhronizēt tīmekļa vietņu adreses',
  'If enabled, website URLs from contacts will be synced to the website frontmatter property':
    'Ja iespējots, tīmekļa vietņu adreses no kontaktiem tiks sinhronizētas website metadatu rekvizītā',
  'Sync contact notes to note body':
    'Sinhronizēt kontakta piezīmes piezīmes tekstā',
  'If enabled, the Notes field from Google Contacts is written to a managed section of the note body instead of the bio frontmatter property. Text outside that section is never changed.':
    'Ja iespējots, Google Contacts lauks “Piezīmes” tiek ierakstīts atsevišķā blokā piezīmes tekstā, nevis bio metadatu rekvizītā. Teksts ārpus bloka netiek mainīts.',
  'VCF (vCard compatible)': 'VCF (vCard saderīgs)',
  'Custom prefix': 'Pielāgots prefikss',
  'Prefix to use for properties when Default naming strategy is selected':
    'Prefikss, ko izmantot rekvizītiem, kad ir atlasīta noklusējuma nosaukšanas stratēģija',
  'Save organizations as links': 'Saglabāt organizācijas kā saites',
  'If enabled, organizations will be saved as Obsidian links (e.g. [[Organization]])':
    'Ja iespējots, organizācijas tiks saglabātas kā Obsidian saites (piem., [[Organizācija]])',
  'Save relations as links': 'Saglabāt attiecības kā saites',
  'If enabled, relations will be saved as Obsidian links (e.g. [[Jane Doe|Jane Doe (spouse)]])':
    'Ja iespējots, attiecības tiks saglabātas kā Obsidian saites (piem., [[Jane Doe|Jane Doe (laulātais)]])',
  'Track last sync time': 'Sekot pēdējās sinhronizācijas laikam',
  'If enabled, adds or updates a synced field with the last sync timestamp in UTC':
    'Ja iespējots, pievieno vai atjaunina lauku synced ar pēdējās sinhronizācijas laika zīmogu UTC',
  'Sync interval (minutes)': 'Sinhronizācijas intervāls (minūtēs)',
  'Set the interval for automatic contact synchronization. Set to 0 to disable':
    'Iestatiet automātiskās kontaktu sinhronizācijas intervālu. Iestatiet 0, lai atspējotu',
  'Google contact label': 'Google kontaktu etiķete',
  'Synchronize only contacts that have this specific Google Contacts label. Leave empty to sync all contacts':
    'Sinhronizēt tikai tos kontaktus, kuriem ir šī konkrētā Google Contacts etiķete. Atstājiet tukšu, lai sinhronizētu visus kontaktus',
  'Rename files': 'Pārdēvēt failus',
  'Rename existing contact notes when their contact name changes':
    'Pārdēvēt esošās kontaktu piezīmes, ja mainās to kontakta nosaukums',
  'Skip contacts that do not have a name': 'Izlaist kontaktus bez vārda',
  'Select naming strategy for frontmatter keys':
    'Atlasiet metadatu atslēgu nosaukšanas stratēģiju',
  'Send note edits back to Google Contacts':
    'Sūtīt piezīmju labojumus atpakaļ uz Google Contacts',
  'Experimental. Edits made inside the notes section are sent to the Notes field in Google Contacts during sync. Requires logging in with Google again to grant write access. If notes were changed both in Obsidian and in Google, neither side is changed and you are notified.':
    'Eksperimentāli. Labojumi piezīmju blokā sinhronizācijas laikā tiek nosūtīti uz Google Contacts lauku “Piezīmes”. Nepieciešams atkārtoti pieteikties ar Google, lai piešķirtu rakstīšanas piekļuvi. Ja piezīmes ir mainītas gan Obsidian, gan Google, neviena puse netiek mainīta un jūs saņemsiet paziņojumu.',
  'Log in with Google again to grant write access to your contacts.':
    'Piesakieties ar Google vēlreiz, lai piešķirtu rakstīšanas piekļuvi kontaktiem.',
  'Write access to Google Contacts is not granted. Log in with Google again in the plugin settings to send notes to Google.':
    'Nav rakstīšanas piekļuves Google Contacts. Piesakieties ar Google vēlreiz spraudņa iestatījumos, lai sūtītu piezīmes uz Google.',
  'Sending notes to Google Contacts was cancelled.':
    'Piezīmju sūtīšana uz Google Contacts atcelta.',
  'Notes sent to Google Contacts: {count}':
    'Uz Google Contacts nosūtītās piezīmes: {count}',
  'Failed to send notes to Google Contacts for: {names}. Check console for details.':
    'Neizdevās nosūtīt piezīmes uz Google Contacts: {names}. Sīkāka informācija konsolē.',
  'Notes were changed both in Obsidian and in Google Contacts, nothing was changed for: {names}. Make the notes match on one side to resolve.':
    'Piezīmes ir mainītas gan Obsidian, gan Google Contacts, nekas netika mainīts: {names}. Lai atrisinātu, padariet piezīmes vienādas vienā pusē.',
  'Edits to these notes were not sent: Google Contacts only allows reading them (other contacts or formatted notes): {names}':
    'Šo piezīmju labojumi netika nosūtīti: Google Contacts ļauj tās tikai lasīt (citi kontakti vai formatētas piezīmes): {names}',
  'Send notes to Google Contacts?': 'Sūtīt piezīmes uz Google Contacts?',
  'Notes of {count} contacts were changed in Obsidian. They will replace the Notes field of these contacts in Google Contacts:':
    '{count} kontaktu piezīmes ir mainītas Obsidian. Tās aizstās šo kontaktu lauku “Piezīmes” Google Contacts:',
  Send: 'Sūtīt',
  Cancel: 'Atcelt',
  'Sync is already in progress.': 'Sinhronizācija jau notiek.',
  'The notes section markers are damaged, these notes were not changed: {names}. Restore both marker lines or delete them.':
    'Piezīmju bloka marķieri ir bojāti, šīs piezīmes netika mainītas: {names}. Atjaunojiet abas marķieru rindas vai izdzēsiet tās.',
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
  Array: 'Array',
  'Organization as link': 'Organization as link',
  'Organization name will be stored as a obsidian link [[...]] instead of plain text':
    'Organization name will be stored as a obsidian link [[...]] instead of plain text (ignored in VCF strategy)',
  'Relations as links': 'Relations as links',
  'Related people names will be stored as a obsidian link [[...]] instead of plain text':
    'Related people names will be stored as a obsidian link [[...]] instead of plain text',
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
  'Format file names as Last First': 'Format file names as Last First',
  'If enabled, contact file names will be formatted as Last First instead of First Last':
    'If enabled, contact file names will be formatted as Last First instead of First Last',
  'Skip nameless contacts': 'Skip nameless contacts',
  'If enabled, contacts without a name (where the file would be named by ID) will be skipped during sync':
    'If enabled, contacts without a name (where the file would be named by ID) will be skipped during sync',
  'Use contact types for emails, phones and addresses':
    'Use contact types for emails, phones and addresses',
  'If enabled, emails, phones and addresses will be formatted with their specific types (e.g. email_work, phone_mobile, address_home) instead of generic indexes. This is ignored in the Array naming strategy.':
    'If enabled, emails, phones and addresses will be formatted with their specific types (e.g. email_work, phone_mobile, address_home) instead of generic indexes. This is ignored in the Array naming strategy.',
  'Sync website URLs': 'Sync website URLs',
  'If enabled, website URLs from contacts will be synced to the website frontmatter property':
    'If enabled, website URLs from contacts will be synced to the website frontmatter property',
  'Sync contact notes to note body': 'Sync contact notes to note body',
  'If enabled, the Notes field from Google Contacts is written to a managed section of the note body instead of the bio frontmatter property. Text outside that section is never changed.':
    'If enabled, the Notes field from Google Contacts is written to a managed section of the note body instead of the bio frontmatter property. Text outside that section is never changed.',
  'VCF (vCard compatible)': 'VCF (vCard compatible)',
  'Custom prefix': 'Custom prefix',
  'Prefix to use for properties when Default naming strategy is selected':
    'Prefix to use for properties when Default naming strategy is selected',
  'Save organizations as links': 'Save organizations as links',
  'If enabled, organizations will be saved as Obsidian links (e.g. [[Organization]])':
    'If enabled, organizations will be saved as Obsidian links (e.g. [[Organization]])',
  'Save relations as links': 'Save relations as links',
  'If enabled, relations will be saved as Obsidian links (e.g. [[Jane Doe|Jane Doe (spouse)]])':
    'If enabled, relations will be saved as Obsidian links (e.g. [[Jane Doe|Jane Doe (spouse)]])',
  'Track last sync time': 'Track last sync time',
  'If enabled, adds or updates a synced field with the last sync timestamp in UTC':
    'If enabled, adds or updates a synced field with the last sync timestamp in UTC',
  'Sync interval (minutes)': 'Sync interval (minutes)',
  'Set the interval for automatic contact synchronization. Set to 0 to disable':
    'Set the interval for automatic contact synchronization. Set to 0 to disable',
  'Google contact label': 'Google contact label',
  'Synchronize only contacts that have this specific Google Contacts label. Leave empty to sync all contacts':
    'Synchronize only contacts that have this specific Google Contacts label. Leave empty to sync all contacts',
  'Rename files': 'Rename files',
  'Rename existing contact notes when their contact name changes':
    'Rename existing contact notes when their contact name changes',
  'Skip contacts that do not have a name':
    'Skip contacts that do not have a name',
  'Select naming strategy for frontmatter keys':
    'Select naming strategy for frontmatter keys',
  'Send note edits back to Google Contacts':
    'Send note edits back to Google Contacts',
  'Experimental. Edits made inside the notes section are sent to the Notes field in Google Contacts during sync. Requires logging in with Google again to grant write access. If notes were changed both in Obsidian and in Google, neither side is changed and you are notified.':
    'Experimental. Edits made inside the notes section are sent to the Notes field in Google Contacts during sync. Requires logging in with Google again to grant write access. If notes were changed both in Obsidian and in Google, neither side is changed and you are notified.',
  'Log in with Google again to grant write access to your contacts.':
    'Log in with Google again to grant write access to your contacts.',
  'Write access to Google Contacts is not granted. Log in with Google again in the plugin settings to send notes to Google.':
    'Write access to Google Contacts is not granted. Log in with Google again in the plugin settings to send notes to Google.',
  'Sending notes to Google Contacts was cancelled.':
    'Sending notes to Google Contacts was cancelled.',
  'Notes sent to Google Contacts: {count}':
    'Notes sent to Google Contacts: {count}',
  'Failed to send notes to Google Contacts for: {names}. Check console for details.':
    'Failed to send notes to Google Contacts for: {names}. Check console for details.',
  'Notes were changed both in Obsidian and in Google Contacts, nothing was changed for: {names}. Make the notes match on one side to resolve.':
    'Notes were changed both in Obsidian and in Google Contacts, nothing was changed for: {names}. Make the notes match on one side to resolve.',
  'Edits to these notes were not sent: Google Contacts only allows reading them (other contacts or formatted notes): {names}':
    'Edits to these notes were not sent: Google Contacts only allows reading them (other contacts or formatted notes): {names}',
  'Send notes to Google Contacts?': 'Send notes to Google Contacts?',
  'Notes of {count} contacts were changed in Obsidian. They will replace the Notes field of these contacts in Google Contacts:':
    'Notes of {count} contacts were changed in Obsidian. They will replace the Notes field of these contacts in Google Contacts:',
  Send: 'Send',
  Cancel: 'Cancel',
  'Sync is already in progress.': 'Sync is already in progress.',
  'The notes section markers are damaged, these notes were not changed: {names}. Restore both marker lines or delete them.':
    'The notes section markers are damaged, these notes were not changed: {names}. Restore both marker lines or delete them.',
};
