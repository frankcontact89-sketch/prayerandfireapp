import React from "react";
import { X, ShieldCheck, Flag, Ban, Mail, Trash2 } from "lucide-react";

const SUPPORT_EMAIL = "prayerandfireglobal@gmail.com";

export default function SafetyRulesModal({ lang, onClose }: { lang: string; onClose: () => void }) {
  const L = (en: string, es: string, pt: string) => (lang === "es" ? es : lang === "pt" ? pt : en);

  const rules = [
    L("Treat every member with respect. No harassment, threats, hate or impersonation.",
      "Trata a cada miembro con respeto. Sin acoso, amenazas, odio ni suplantación.",
      "Trate cada membro com respeito. Sem assédio, ameaças, ódio ou falsidade ideológica."),
    L("No sexual, violent, illegal or exploitative content. No spam or scams.",
      "Nada de contenido sexual, violento, ilegal o de explotación. Sin spam ni estafas.",
      "Nada de conteúdo sexual, violento, ilegal ou de exploração. Sem spam ou golpes."),
    L("Do not share other people's private information without permission.",
      "No compartas información privada de otras personas sin permiso.",
      "Não compartilhe informações privadas de outras pessoas sem permissão."),
    L("Only share photos, videos, audio or files you have the right to share.",
      "Comparte solo fotos, videos, audios o archivos que tengas derecho a compartir.",
      "Compartilhe apenas fotos, vídeos, áudios ou arquivos que você tem direito de compartilhar."),
    L("Objectionable content and abusive members are removed. We review reports within 24 hours.",
      "El contenido inapropiado y los miembros abusivos son eliminados. Revisamos los reportes en 24 horas.",
      "Conteúdo inadequado e membros abusivos são removidos. Analisamos denúncias em 24 horas."),
  ];

  return (
    <div className="fixed inset-0 z-[80] bg-black/85 flex items-end" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-h-[85vh] overflow-y-auto rounded-t-3xl bg-zinc-950 border-t border-white/10 p-5 pb-[max(24px,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between mb-4">
          <b className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-orange-400" />
            {L("Community rules & safety", "Reglas y seguridad de la Comunidad", "Regras e segurança da Comunidade")}
          </b>
          <button onClick={onClose} aria-label={L("Close", "Cerrar", "Fechar")}><X /></button>
        </div>

        <ul className="space-y-2.5 text-sm text-zinc-300 list-disc list-inside">
          {rules.map(r => <li key={r}>{r}</li>)}
        </ul>

        <div className="mt-5 space-y-3 text-sm text-zinc-300">
          <p className="flex gap-3">
            <Flag className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <span>{L(
              "Report: open the menu on any message (long-press or the ⋯ button) and choose Report content.",
              "Reportar: abre el menú de cualquier mensaje (mantén pulsado o el botón ⋯) y elige Reportar contenido.",
              "Denunciar: abra o menu de qualquer mensagem (toque longo ou o botão ⋯) e escolha Denunciar conteúdo.")}
            </span>
          </p>
          <p className="flex gap-3">
            <Ban className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{L(
              "Block: the same menu, or the member list, lets you block someone. Their messages are hidden from you.",
              "Bloquear: el mismo menú, o la lista de miembros, te permite bloquear a alguien. Sus mensajes quedan ocultos para ti.",
              "Bloquear: o mesmo menu, ou a lista de membros, permite bloquear alguém. As mensagens dessa pessoa ficam ocultas para você.")}
            </span>
          </p>
          <p className="flex gap-3">
            <Trash2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <span>{L(
              "You can permanently delete your account and your content in Settings → Delete Account.",
              "Puedes eliminar tu cuenta y tu contenido de forma permanente en Ajustes → Eliminar cuenta.",
              "Você pode excluir sua conta e seu conteúdo permanentemente em Ajustes → Excluir conta.")}
            </span>
          </p>
          <p className="flex gap-3">
            <Mail className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-orange-300 underline break-all">{SUPPORT_EMAIL}</a>
          </p>
        </div>

        <button onClick={onClose} className="mt-6 w-full h-12 rounded-2xl bg-orange-500 text-black font-black">
          {L("I understand", "Entendido", "Entendi")}
        </button>
      </div>
    </div>
  );
}
