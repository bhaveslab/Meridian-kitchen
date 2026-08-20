import { useLanguage } from "../lib/LanguageContext";
import type { FulfillmentType, OrderStatus } from "../../shared/types";
import type { UiStringKey } from "../../shared/i18n";

const PICKUP_STEPS: { status: OrderStatus; labelKey: UiStringKey }[] = [
  { status: "received", labelKey: "stepReceived" },
  { status: "preparing", labelKey: "stepPreparing" },
  { status: "ready", labelKey: "stepReady" },
  { status: "completed", labelKey: "stepCompleted" },
];

const DELIVERY_STEPS: { status: OrderStatus; labelKey: UiStringKey }[] = [
  { status: "received", labelKey: "stepReceived" },
  { status: "preparing", labelKey: "stepPreparing" },
  { status: "ready", labelKey: "stepReady" },
  { status: "out_for_delivery", labelKey: "stepOutForDelivery" },
  { status: "completed", labelKey: "stepCompleted" },
];

export default function OrderProgressStepper({
  status,
  fulfillmentType,
}: {
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
}) {
  const { t } = useLanguage();

  // Cancelled has no position in a forward sequence — the existing ✕ icon
  // and cancelled copy already cover that state.
  if (status === "cancelled") return null;

  const steps = fulfillmentType === "delivery" ? DELIVERY_STEPS : PICKUP_STEPS;
  const foundIndex = steps.findIndex((s) => s.status === status);
  // A status that isn't in this fulfillment type's sequence shouldn't happen
  // (e.g. a pickup order never gets set to out_for_delivery), but treat it as
  // fully progressed rather than rendering every step as still upcoming.
  const activeIndex = foundIndex === -1 ? steps.length - 1 : foundIndex;

  return (
    <div className="st-stepper-track" role="list">
      {steps.map((step, i) => {
        const state = i < activeIndex ? "done" : i === activeIndex ? "active" : "upcoming";
        return (
          <div className={`st-stepper-step ${state}`} key={step.status} role="listitem">
            <span className="st-stepper-dot">{state === "done" ? "✓" : ""}</span>
            <span className="st-stepper-label">{t(step.labelKey)}</span>
          </div>
        );
      })}
    </div>
  );
}
