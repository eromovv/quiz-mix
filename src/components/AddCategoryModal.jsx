import { createTranslator, getCategoryMeta } from "../lib/i18n";

/**
 * @param {object} props
 * @param {("music"|"movies"|"facts")[]} props.availableCategories
 * @param {"ru"|"en"} props.language
 * @param {() => void} props.onClose
 * @param {(category: "music"|"movies"|"facts") => void} props.onSelect
 */
export function AddCategoryModal({ availableCategories, language, onClose, onSelect }) {
  const t = createTranslator(language);

  return (
    <div className="modal-root add-category-modal-root" onClick={onClose}>
      <div
        className="modal-card add-category-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-category-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header add-card-form-header">
          <h2 id="add-category-title">{t("addQuestCategoryTitle")}</h2>
          <button className="control-button secondary" onClick={onClose} type="button">
            {t("close")}
          </button>
        </div>
        <p className="modal-copy">{t("addQuestCategoryHint")}</p>
        <div className="add-category-options">
          {availableCategories.map((category) => {
            const meta = getCategoryMeta(language, category);
            return (
              <button
                className="add-category-option"
                data-theme={category}
                key={category}
                onClick={() => onSelect(category)}
                type="button"
              >
                <span className="add-category-option-title">{meta.title}</span>
                <span className="add-category-option-desc">{meta.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
