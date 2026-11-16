import type { Country } from '../types/country.js';

export interface UIElements {
    input: HTMLInputElement;
    historyContainer: HTMLElement;
    statusContainer: HTMLElement;
    gridContainer: HTMLElement;
    modalOverlay: HTMLElement;
    modalContent: HTMLElement;
}

function createEl<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className?: string,
    text?: string,
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
}

export function createAppLayout(root: HTMLElement): UIElements {
    const container = createEl('main', 'container');
    const header = createEl('header', 'header');
    const title = createEl('h1', 'title', 'Поиск стран');
    const subtitle = createEl(
        'p',
        'subtitle',
        'Введите название страны на английском (например: Spain, Japan, Belarus)',
    );

    const searchBox = createEl('div', 'search-box');
    const input = createEl('input', 'search-input');
    input.type = 'search';
    input.placeholder = 'Начните вводить название страны...';
    input.setAttribute('aria-label', 'Поиск страны');

    const historyContainer = createEl('div', 'history-bar');
    const statusContainer = createEl('div', 'status-area');
    const gridContainer = createEl('section', 'countries-grid');

    const modalOverlay = createEl('div', 'modal-overlay hidden');
    const modalWindow = createEl('div', 'modal-window');
    const closeBtn = createEl('button', 'modal-close', '✕');
    closeBtn.type = 'button';
    const modalContent = createEl('div', 'modal-body');

    closeBtn.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
    });
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.add('hidden');
        }
    });

    modalWindow.append(closeBtn, modalContent);
    modalOverlay.append(modalWindow);

    searchBox.append(input);
    header.append(title, subtitle, searchBox, historyContainer);
    container.append(header, statusContainer, gridContainer);
    root.append(container, modalOverlay);

    return {
        input,
        historyContainer,
        statusContainer,
        gridContainer,
        modalOverlay,
        modalContent,
    };
}

export function renderHistory(
    container: HTMLElement,
    items: string[],
    onSelect: (query: string) => void,
): void {
    container.replaceChildren();
    if (items.length === 0) return;

    const label = createEl('span', 'history-label', 'Недавние:');
    container.append(label);

    items.forEach((item) => {
        const chip = createEl('button', 'history-chip', item);
        chip.type = 'button';
        chip.addEventListener('click', () => onSelect(item));
        container.append(chip);
    });
}

export function renderLoading(container: HTMLElement): void {
    container.replaceChildren();
    const loader = createEl('div', 'status-box loading');
    const spinner = createEl('div', 'spinner');
    const text = createEl('span', undefined, 'Загрузка данных...');
    loader.append(spinner, text);
    container.append(loader);
}

export function renderEmpty(container: HTMLElement, query: string): void {
    container.replaceChildren();
    const emptyBox = createEl('div', 'status-box empty');
    const title = createEl(
        'p',
        'empty-title',
        `По запросу «${query}» ничего не найдено`,
    );
    const hint = createEl(
        'p',
        'empty-hint',
        'Попробуйте изменить запрос или проверить написание на английском языке.',
    );
    emptyBox.append(title, hint);
    container.append(emptyBox);
}

export function renderError(
    container: HTMLElement,
    message: string,
    onRetry: () => void,
): void {
    container.replaceChildren();
    const errorBox = createEl('div', 'status-box error');
    const text = createEl('p', 'error-text', message);
    const retryBtn = createEl('button', 'retry-btn', 'Повторить');
    retryBtn.type = 'button';
    retryBtn.addEventListener('click', onRetry);
    errorBox.append(text, retryBtn);
    container.append(errorBox);
}

export function renderCountries(
    container: HTMLElement,
    countries: Country[],
    onCardClick: (country: Country) => void,
): void {
    container.replaceChildren();

    countries.forEach((country) => {
        const card = createEl('article', 'country-card');
        card.tabIndex = 0;

        const flagWrapper = createEl('div', 'card-flag');
        if (country.flag.startsWith('http')) {
            const img = createEl('img');
            img.src = country.flag;
            img.alt = `Флаг ${country.name}`;
            img.loading = 'lazy';
            flagWrapper.append(img);
        } else {
            flagWrapper.textContent = country.flag || '🏳️';
            flagWrapper.classList.add('emoji-flag');
        }

        const body = createEl('div', 'card-body');
        const name = createEl('h2', 'card-title', country.name);
        const capital = createEl(
            'p',
            'card-info',
            `Столица: ${country.capital}`,
        );
        const region = createEl('p', 'card-info', `Регион: ${country.region}`);
        const population = createEl(
            'p',
            'card-info',
            `Население: ${country.population.toLocaleString('ru-RU')}`,
        );

        body.append(name, capital, region, population);
        card.append(flagWrapper, body);

        card.addEventListener('click', () => onCardClick(country));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCardClick(country);
            }
        });

        container.append(card);
    });
}

export function renderCountryModal(
    overlay: HTMLElement,
    content: HTMLElement,
    country: Country,
): void {
    content.replaceChildren();

    const title = createEl('h2', 'modal-title', country.name);

    if (country.flag.startsWith('http')) {
        const img = createEl('img', 'modal-flag');
        img.src = country.flag;
        img.alt = `Флаг ${country.name}`;
        content.append(img);
    }

    const details = createEl('div', 'modal-details');
    const rows: Array<[string, string]> = [
        ['Столица', country.capital],
        ['Регион', country.region],
        ['Население', `${country.population.toLocaleString('ru-RU')} чел.`],
        ['Площадь', `${country.area.toLocaleString('ru-RU')} км²`],
        [
            'Языки',
            country.languages.length > 0
                ? country.languages.join(', ')
                : 'Нет данных',
        ],
        [
            'Валюты',
            country.currencies.length > 0
                ? country.currencies.join(', ')
                : 'Нет данных',
        ],
        [
            'Границы',
            country.borders.length > 0
                ? country.borders.join(', ')
                : 'Нет сухопутных границ',
        ],
    ];

    rows.forEach(([label, val]) => {
        const row = createEl('p', 'detail-row');
        const strong = createEl('strong', undefined, `${label}: `);
        row.append(strong, document.createTextNode(val));
        details.append(row);
    });

    content.append(title, details);
    overlay.classList.remove('hidden');
}
