import { useNavigate, useOutletContext } from "react-router-dom";
import { useLanguage } from "../../lib/LanguageContext";
import { translatedName } from "../../lib/translated";
import StorefrontLangToggle from "../../components/StorefrontLangToggle";
import type { StorefrontResponse } from "../../../shared/types";

// The headline is short brand copy translated here rather than sourced from
// the restaurant, unlike menu content — flag for their review before launch.
const HEADLINE: Record<string, [string, string]> = {
  en: ["Food that", "remembers you."],
  es: ["Comida que", "te recuerda."],
};

export default function LandingScreen() {
  const storefront = useOutletContext<StorefrontResponse>();
  const navigate = useNavigate();
  const { locale, t } = useLanguage();
  const [line1, line2] = HEADLINE[locale];

  return (
    <div className="st-landing">
      <StorefrontLangToggle className="st-landing-top" />

      <div className="st-landing-rings">
        <img src="/iyanus-logo.png" alt={storefront.restaurant.name} className="st-landing-logo" />
      </div>

      <h1 className="st-landing-headline">
        {line1}
        <br />
        <em>{line2}</em>
      </h1>

      {storefront.restaurant.description && <p className="st-landing-sub">{storefront.restaurant.description}</p>}

      <button
        type="button"
        className="st-pill st-pill-gold"
        style={{ padding: "15px 40px", fontSize: 14 }}
        onClick={() => navigate(`/r/${storefront.restaurant.slug}/menu`)}
      >
        {t("viewMenu")}
      </button>

      <div className="st-landing-chips">
        {storefront.categories.map((category) => (
          <span className="st-chip" key={category.id}>
            {translatedName(category.name, category.translations, locale)}
          </span>
        ))}
      </div>
    </div>
  );
}
