import { debounce } from './utils/debounce.js';
import { searchCountries } from './api/searchCountries.js';
import { CountrySearchController } from './api/CountrySearchController.js';
import { getSearchHistory, saveSearchHistory } from './utils/storage.js';
import { createAppLayout, renderCountries, renderCountryModal, renderEmpty, renderError, renderHistory, renderLoading, } from './ui/render.js';
const DEBOUNCE_DELAY_MS = 350;
function initApp() {
    const ui = createAppLayout(document.body);
    let lastQuery = '';
    const updateHistoryUI = (items) => {
        renderHistory(ui.historyContainer, items, (selectedQuery) => {
            ui.input.value = selectedQuery;
            lastQuery = selectedQuery;
            void searchController.search(selectedQuery);
        });
    };
    const searchController = new CountrySearchController(searchCountries, {
        onLoading: (isLoading) => {
            if (isLoading) {
                ui.gridContainer.replaceChildren();
                renderLoading(ui.statusContainer);
            }
        },
        onSuccess: (countries, query) => {
            ui.statusContainer.replaceChildren();
            if (!query) {
                ui.gridContainer.replaceChildren();
                return;
            }
            const updatedHistory = saveSearchHistory(query);
            updateHistoryUI(updatedHistory);
            if (countries.length === 0) {
                ui.gridContainer.replaceChildren();
                renderEmpty(ui.statusContainer, query);
                return;
            }
            renderCountries(ui.gridContainer, countries, (country) => {
                renderCountryModal(ui.modalOverlay, ui.modalContent, country);
            });
        },
        onError: (message) => {
            ui.gridContainer.replaceChildren();
            renderError(ui.statusContainer, message, () => {
                void searchController.search(lastQuery);
            });
        },
    });
    const debouncedSearch = debounce((query) => {
        void searchController.search(query);
    }, DEBOUNCE_DELAY_MS);
    ui.input.addEventListener('input', () => {
        const value = ui.input.value;
        lastQuery = value;
        searchController.abortCurrent();
        if (!value.trim()) {
            ui.statusContainer.replaceChildren();
            ui.gridContainer.replaceChildren();
            return;
        }
        debouncedSearch(value);
    });
    updateHistoryUI(getSearchHistory());
}
initApp();
//# sourceMappingURL=main.js.map