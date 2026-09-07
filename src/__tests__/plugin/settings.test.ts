import { App } from 'obsidian';
import { ContactSyncSettingTab } from '../../plugin/settings';
import { DEFAULT_SETTINGS } from '../../config';
import { IPlugin } from '../../types/IPlugin';
import {
  SettingDefinitionGroup,
  SettingDefinitionControl,
  SettingDefinitionRender,
} from 'obsidian';

describe('ContactSyncSettingTab', () => {
  let mockPlugin: IPlugin;
  let tab: ContactSyncSettingTab;

  beforeEach(() => {
    mockPlugin = {
      settings: { ...DEFAULT_SETTINGS },
      auth: {
        updateSettings: jest.fn(),
        exchangeCode: jest.fn().mockResolvedValue(undefined),
        getSettingsUpdate: jest.fn().mockReturnValue({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        }),
      } as unknown as IPlugin['auth'],
      saveSettings: jest.fn().mockResolvedValue(undefined),
      setupAutoSync: jest.fn(),
    } as unknown as IPlugin;

    tab = new ContactSyncSettingTab(new App(), mockPlugin);
    tab.refreshDomState = jest.fn();
  });

  describe('getSettingDefinitions', () => {
    it('should return definitions including all basic settings and Google auth group', () => {
      const defs = tab.getSettingDefinitions();

      const authGroup = defs.find(
        (def): def is SettingDefinitionGroup =>
          'type' in def && def.type === 'group' && def.heading === 'Google auth'
      );

      expect(authGroup).toBeDefined();
      expect(authGroup?.items).toHaveLength(4);

      const [clientIdDef, clientSecretDef, loginDef, authCodeDef] =
        authGroup?.items as [
          SettingDefinitionControl,
          SettingDefinitionControl,
          SettingDefinitionRender,
          SettingDefinitionRender,
        ];

      expect(clientIdDef.name).toBe('Google client ID');
      expect(clientIdDef.control.key).toBe('clientId');

      expect(clientSecretDef.name).toBe('Google client secret');
      expect(clientSecretDef.control.key).toBe('clientSecret');

      expect(loginDef.name).toBe('Login with Google');
      expect(typeof loginDef.render).toBe('function');

      expect(authCodeDef.name).toBe('Authorization code');
      expect(typeof authCodeDef.render).toBe('function');
    });

    it('should include useContactTypes and website in definitions', () => {
      const defs = tab.getSettingDefinitions();
      const keys = defs
        .filter(
          (d): d is SettingDefinitionControl =>
            'control' in d && d.control !== undefined
        )
        .map((d) => d.control.key);

      expect(keys).toContain('useContactTypes');
      expect(keys).toContain('website');
      expect(keys).toContain('skipNamelessContacts');
    });

    it('should evaluate visible predicate on authorization code correctly', () => {
      const defs = tab.getSettingDefinitions();
      const authGroup = defs.find(
        (def): def is SettingDefinitionGroup =>
          'type' in def && def.type === 'group' && def.heading === 'Google auth'
      );
      const authCodeDef = authGroup?.items?.[3] as SettingDefinitionRender;

      expect(typeof authCodeDef.visible).toBe('function');
      const isVisible = authCodeDef.visible as () => boolean;

      mockPlugin.settings.clientId = '';
      mockPlugin.settings.clientSecret = '';
      expect(isVisible()).toBe(false);

      mockPlugin.settings.clientId = 'client-id';
      mockPlugin.settings.clientSecret = '';
      expect(isVisible()).toBe(false);

      mockPlugin.settings.clientId = 'client-id';
      mockPlugin.settings.clientSecret = 'client-secret';
      expect(isVisible()).toBe(true);
    });
  });

  describe('getControlValue and setControlValue', () => {
    it('should get control values from plugin settings', () => {
      mockPlugin.settings.contactsFolder = 'MyContacts';
      expect(tab.getControlValue('contactsFolder')).toBe('MyContacts');

      mockPlugin.settings.syncIntervalMinutes = 30;
      expect(tab.getControlValue('syncIntervalMinutes')).toBe(30);
    });

    it('should set contactsFolder with trim fallback', async () => {
      await tab.setControlValue('contactsFolder', '   ');
      expect(mockPlugin.settings.contactsFolder).toBe('Contacts');
      expect(mockPlugin.saveSettings).toHaveBeenCalled();

      await tab.setControlValue('contactsFolder', '  CustomFolder  ');
      expect(mockPlugin.settings.contactsFolder).toBe('CustomFolder');
    });

    it('should set syncIntervalMinutes and call setupAutoSync', async () => {
      await tab.setControlValue('syncIntervalMinutes', 15);
      expect(mockPlugin.settings.syncIntervalMinutes).toBe(15);
      expect(mockPlugin.setupAutoSync).toHaveBeenCalled();
      expect(mockPlugin.saveSettings).toHaveBeenCalled();

      await tab.setControlValue('syncIntervalMinutes', -5);
      expect(mockPlugin.settings.syncIntervalMinutes).toBe(0);
    });

    it('should update auth settings and refresh dom state when clientId or clientSecret is set', async () => {
      await tab.setControlValue('clientId', 'new-client-id');
      expect(mockPlugin.settings.clientId).toBe('new-client-id');
      expect(mockPlugin.auth?.updateSettings).toHaveBeenCalledWith(
        mockPlugin.settings
      );
      expect(tab.refreshDomState).toHaveBeenCalled();
      expect(mockPlugin.saveSettings).toHaveBeenCalled();

      await tab.setControlValue('clientSecret', 'new-secret');
      expect(mockPlugin.settings.clientSecret).toBe('new-secret');
      expect(mockPlugin.auth?.updateSettings).toHaveBeenCalledWith(
        mockPlugin.settings
      );
    });
  });

  describe('auth controls render', () => {
    it('should render login button and handle click', () => {
      const defs = tab.getSettingDefinitions();
      const authGroup = defs.find(
        (def): def is SettingDefinitionGroup =>
          'type' in def && def.type === 'group' && def.heading === 'Google auth'
      );
      const loginDef = authGroup?.items?.[2] as SettingDefinitionRender;

      let clickHandler: (() => void) | undefined;
      const mockSetting = {
        addButton: jest.fn().mockImplementation((cb) => {
          cb({
            setButtonText: jest.fn().mockReturnThis(),
            onClick: jest.fn().mockImplementation((fn) => {
              clickHandler = fn;
            }),
          });
          return mockSetting;
        }),
      };

      loginDef.render(
        mockSetting as unknown as import('obsidian').Setting,
        {} as import('obsidian').SettingGroup
      );
      expect(mockSetting.addButton).toHaveBeenCalled();

      // Test click when clientId is missing
      const originalWindow = global.window;
      const openMock = jest.fn();
      global.window = { open: openMock } as unknown as Window &
        typeof globalThis;

      mockPlugin.settings.clientId = '';
      clickHandler?.();
      expect(openMock).not.toHaveBeenCalled();

      // Test click when clientId is present
      mockPlugin.settings.clientId = 'test-client-id';
      clickHandler?.();
      expect(openMock).toHaveBeenCalledWith(
        expect.stringContaining('test-client-id'),
        '_blank'
      );

      global.window = originalWindow;
    });

    it('should render authorization code input and handle valid code exchange', async () => {
      const defs = tab.getSettingDefinitions();
      const authGroup = defs.find(
        (def): def is SettingDefinitionGroup =>
          'type' in def && def.type === 'group' && def.heading === 'Google auth'
      );
      const authCodeDef = authGroup?.items?.[3] as SettingDefinitionRender;

      let changeHandler: ((code: string) => Promise<void>) | undefined;
      const mockSetting = {
        addText: jest.fn().mockImplementation((cb) => {
          cb({
            setPlaceholder: jest.fn().mockReturnThis(),
            onChange: jest.fn().mockImplementation((fn) => {
              changeHandler = fn;
            }),
          });
          return mockSetting;
        }),
      };

      authCodeDef.render(
        mockSetting as unknown as import('obsidian').Setting,
        {} as import('obsidian').SettingGroup
      );
      expect(mockSetting.addText).toHaveBeenCalled();

      // Empty code
      await changeHandler?.('');
      expect(mockPlugin.auth?.exchangeCode).not.toHaveBeenCalled();

      // Valid exchange
      mockPlugin.settings.clientId = 'client-id';
      mockPlugin.settings.clientSecret = 'client-secret';
      await changeHandler?.('test-auth-code');

      expect(mockPlugin.auth?.exchangeCode).toHaveBeenCalledWith(
        'test-auth-code'
      );
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
      expect(mockPlugin.settings.accessToken).toBe('new-access-token');
    });

    it('should handle code exchange error gracefully', async () => {
      const defs = tab.getSettingDefinitions();
      const authGroup = defs.find(
        (def): def is SettingDefinitionGroup =>
          'type' in def && def.type === 'group' && def.heading === 'Google auth'
      );
      const authCodeDef = authGroup?.items?.[3] as SettingDefinitionRender;

      let changeHandler: ((code: string) => Promise<void>) | undefined;
      const mockSetting = {
        addText: jest.fn().mockImplementation((cb) => {
          cb({
            setPlaceholder: jest.fn().mockReturnThis(),
            onChange: jest.fn().mockImplementation((fn) => {
              changeHandler = fn;
            }),
          });
          return mockSetting;
        }),
      };

      authCodeDef.render(
        mockSetting as unknown as import('obsidian').Setting,
        {} as import('obsidian').SettingGroup
      );

      mockPlugin.settings.clientId = 'client-id';
      mockPlugin.settings.clientSecret = 'client-secret';
      (mockPlugin.auth?.exchangeCode as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid code')
      );

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      await changeHandler?.('invalid-auth-code');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('display() method (legacy Obsidian support)', () => {
    it('should render legacy settings tab without error', () => {
      expect(() => tab.display()).not.toThrow();
      expect(tab.containerEl.empty).toHaveBeenCalled();
    });
  });
});
