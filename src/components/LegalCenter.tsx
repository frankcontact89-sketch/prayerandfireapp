import React from "react";
import { ArrowLeft, Flame, Info, CreditCard, RefreshCw, Shield, FileText, Mail } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface LegalCenterProps {
  t: (key: string) => string;
  onBack: () => void;
}

export function LegalCenter({ t, onBack }: LegalCenterProps) {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{t("back")}</span>
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">{t("legalPolicies")}</h1>
        <p className="text-sm text-muted-foreground">{t("lastUpdated")}: December 2025</p>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        {/* About Prayer & Fire */}
        <AccordionItem value="about" className="bg-card border border-border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-secondary/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Flame className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">{t("aboutPrayerFire")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
              <p>{t("aboutDescription1")}</p>
              <p><strong className="text-foreground">{t("mission")}:</strong> {t("aboutMission")}</p>
              <p><strong className="text-foreground">{t("features")}:</strong> {t("aboutFeatures")}</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Payments & Subscriptions */}
        <AccordionItem value="payments" className="bg-card border border-border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-secondary/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">{t("paymentsSubscriptions")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed list-disc list-inside">
              <li>{t("paymentSecure")}</li>
              <li>{t("paymentNoStore")}</li>
              <li>{t("paymentVoluntary")}</li>
              <li>{t("paymentAutoRenew")}</li>
              <li>{t("paymentCancelAnytime")}</li>
              <li>{t("paymentApple")}</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Refund & Cancellation Policy */}
        <AccordionItem value="refunds" className="bg-card border border-border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-secondary/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">{t("refundPolicy")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed list-disc list-inside">
              <li>{t("refundNonRefundable")}</li>
              <li>{t("refundCancelAnytime")}</li>
              <li>{t("refundCaseByCase")}</li>
              <li>{t("refundContact")}: <a href="mailto:support@prayerandfire.app" className="text-primary hover:underline">support@prayerandfire.app</a></li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Privacy Policy */}
        <AccordionItem value="privacy" className="bg-card border border-border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-secondary/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">{t("privacyPolicy")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed list-disc list-inside">
              <li><strong className="text-foreground">{t("dataCollected")}:</strong> {t("privacyDataCollected")}</li>
              <li>{t("privacyStripe")}</li>
              <li>{t("privacyNoSelling")}</li>
              <li>{t("privacyDataUse")}</li>
              <li>{t("privacyDeletion")}</li>
              <li>{t("privacyChildren")}</li>
              <li>{t("contact")}: <a href="mailto:support@prayerandfire.app" className="text-primary hover:underline">support@prayerandfire.app</a></li>
              <li>{t("website")}: <a href="https://prayerandfire.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://prayerandfire.app</a></li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Terms of Service */}
        <AccordionItem value="terms" className="bg-card border border-border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-secondary/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">{t("termsOfService")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed list-disc list-inside">
              <li>{t("termsPersonalUse")}</li>
              <li>{t("termsAccountResponsibility")}</li>
              <li>{t("termsNoMisuse")}</li>
              <li>{t("termsFaithBased")}</li>
              <li>{t("termsNoLiability")}</li>
              <li>{t("termsSuspension")}</li>
              <li>{t("termsUpdates")}</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Support & Contact */}
        <AccordionItem value="support" className="bg-card border border-border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-secondary/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">{t("supportContact")}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="space-y-3 text-muted-foreground text-sm leading-relaxed">
              <p><strong className="text-foreground">Email:</strong> <a href="mailto:support@prayerandfire.app" className="text-primary hover:underline">support@prayerandfire.app</a></p>
              <p><strong className="text-foreground">{t("website")}:</strong> <a href="https://prayerandfire.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://prayerandfire.app</a></p>
              <p><strong className="text-foreground">{t("responseTime")}:</strong> {t("responseTimeValue")}</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
