import React from "react";
import { ArrowLeft, Flame, Info, CreditCard, RefreshCw, Shield, FileText, Mail } from "lucide-react";
import alineRamiro from "@/assets/aline-ramiro.jpg";
import franciscoRivera from "@/assets/francisco-rivera.jpg";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PublicLegalCenterProps {
  onBack: () => void;
  defaultOpen?: string;
}

export function PublicLegalCenter({ onBack, defaultOpen }: PublicLegalCenterProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Legal & Policies</h1>
          <p className="text-sm text-muted-foreground">Last updated: December 2025</p>
        </div>

        <Accordion type="single" collapsible defaultValue={defaultOpen} className="space-y-4">
          {/* About Prayer & Fire */}
          <AccordionItem value="about" className="bg-card border border-border rounded-xl overflow-hidden">
            <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-primary" />
                </div>
                <span className="font-semibold text-foreground">About Prayer & Fire</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5">
              <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
                <p>Prayer & Fire is a global movement dedicated to prayer, faith, and spiritual growth through Jesus Christ.</p>
                <p><strong className="text-foreground">Mission:</strong> To ignite hearts with the fire of the Holy Spirit, strengthen believers through prayer, and build a global community rooted in faith, unity, and love.</p>
                <p><strong className="text-foreground">Vision:</strong> Prayer & Fire exists to inspire transformation, raise leaders, and encourage people around the world to live a life guided by prayer, purpose, and the power of God.</p>
                
                {/* Leadership Section */}
                <div className="pt-4 mt-4 border-t border-border/30">
                  <h3 className="text-center font-semibold mt-4 mb-4">
                    Founders
                  </h3>
                  <div className="flex flex-col gap-6 items-center">
                    <div className="flex flex-col items-center">
                      <img
                        src={alineRamiro}
                        alt="Aline Ramiro"
                        className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-primary/30 shadow-lg"
                      />
                      <strong className="text-primary text-xs">Founder</strong>
                      <p className="text-foreground font-medium text-sm">Aline Ramiro</p>
                    </div>

                    {/* President */}
                    <div className="flex flex-col items-center">
                      <img
                        src={franciscoRivera}
                        alt="Francisco Rivera"
                        className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-primary/30 shadow-lg"
                      />
                      <strong className="text-primary text-xs">President</strong>
                      <p className="text-foreground font-medium text-sm">Francisco Rivera</p>
                    </div>
                  </div>
                </div>
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
                <span className="font-semibold text-foreground">Payments & Subscriptions</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5">
              <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed list-disc list-inside">
                <li>Payments are processed securely through Stripe.</li>
                <li>Prayer & Fire does NOT store credit card or banking information.</li>
                <li>Donations are voluntary.</li>
                <li>Subscriptions renew automatically unless canceled.</li>
                <li>Users can cancel subscriptions at any time.</li>
                <li>If Apple In-App Purchases are used in the future, users must manage subscriptions through Apple.</li>
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
                <span className="font-semibold text-foreground">Refund & Cancellation Policy</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5">
              <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed list-disc list-inside">
                <li>Donations are non-refundable.</li>
                <li>Subscriptions can be canceled at any time to stop future charges.</li>
                <li>Refund requests are reviewed case-by-case if required by law.</li>
                <li>Support contact: <a href="mailto:prayerandfireglobal@gmail.com" className="text-primary hover:underline">prayerandfireglobal@gmail.com</a></li>
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
                <span className="font-semibold text-foreground">Privacy Policy</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5">
              <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed list-disc list-inside">
                <li><strong className="text-foreground">Data collected:</strong> Name, email, username, optional profile photo, subscription status.</li>
                <li>Payments are handled by Stripe only.</li>
                <li>We do not sell personal data.</li>
                <li>Data is used only to operate and improve the app.</li>
                <li>Users may request data deletion.</li>
                <li>App not intended for children under 13.</li>
                <li>Contact: <a href="mailto:prayerandfireglobal@gmail.com" className="text-primary hover:underline">prayerandfireglobal@gmail.com</a></li>
                <li>Website: <a href="https://prayerandfire.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://prayerandfire.app</a></li>
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
                <span className="font-semibold text-foreground">Terms of Service</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5">
              <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed list-disc list-inside">
                <li>App is for personal, non-commercial use.</li>
                <li>Users are responsible for their accounts.</li>
                <li>No misuse, abuse, or illegal activity.</li>
                <li>Content is faith-based and not medical or legal advice.</li>
                <li>Prayer & Fire is not liable for indirect damages.</li>
                <li>Accounts may be suspended for violations.</li>
                <li>Terms may be updated.</li>
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
                <span className="font-semibold text-foreground">Support & Contact</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5">
              <div className="space-y-3 text-muted-foreground text-sm leading-relaxed">
                <p>If you need help or have any questions, please contact us:</p>
                <p><strong className="text-foreground">Email:</strong> <a href="mailto:prayerandfireglobal@gmail.com" className="text-primary hover:underline">prayerandfireglobal@gmail.com</a></p>
                <p><strong className="text-foreground">Website:</strong> <a href="https://prayerandfire.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://prayerandfire.app</a></p>
                <p><strong className="text-foreground">Response time:</strong> 24–48 business hours</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8 border-t border-border mt-8">
          <p>© {new Date().getFullYear()} Prayer & Fire App</p>
          <p className="mt-2">
            <a href="mailto:prayerandfireglobal@gmail.com" className="text-primary hover:underline">prayerandfireglobal@gmail.com</a>
            {" • "}
            <a href="https://prayerandfire.app" className="text-primary hover:underline">prayerandfire.app</a>
          </p>
        </div>
      </div>
    </div>
  );
}
