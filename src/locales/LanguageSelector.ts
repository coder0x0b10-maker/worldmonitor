import { I18N_CONFIG, i18n } from './types';

export class LanguageSelector {
  private container: HTMLElement | null = null;
  private selectElement: HTMLSelectElement | null = null;

  public render(): HTMLElement {
    this.container = document.createElement('div');
    this.container.className = 'language-selector';

    const label = document.createElement('label');
    label.textContent = i18n.t('language.title');
    label.className = 'language-label';

    this.selectElement = document.createElement('select');
    this.selectElement.className = 'language-select';

    I18N_CONFIG.availableLocales.forEach(locale => {
      const option = document.createElement('option');
      option.value = locale;
      option.textContent = I18N_CONFIG.localeNames[locale];
      option.selected = i18n.getLocale() === locale;
      this.selectElement?.appendChild(option);
    });

    this.selectElement.addEventListener('change', () => {
      const newLocale = this.selectElement?.value as typeof I18N_CONFIG.availableLocales[number];
      if (newLocale) {
        i18n.setLocale(newLocale);
        this.reloadPage();
      }
    });

    this.container.appendChild(label);
    this.container.appendChild(this.selectElement);

    return this.container;
  }

  public mount(parent: HTMLElement): void {
    const selector = this.render();
    parent.appendChild(selector);
  }

  public getCurrentLocale(): string {
    return i18n.getLocale();
  }

  public setLocale(locale: string): void {
    i18n.setLocale(locale as any);
    this.reloadPage();
  }

  private reloadPage(): void {
    // Update URL with locale param
    const url = new URL(window.location.href);
    url.searchParams.set('lang', i18n.getLocale());
    window.history.replaceState({}, '', url.toString());
    window.location.reload();
  }
}

// Export singleton
export const languageSelector = new LanguageSelector();
