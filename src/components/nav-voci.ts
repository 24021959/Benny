import { FileText, FlaskConical, HeartPulse, Home, Lightbulb, PencilLine, Settings, UtensilsCrossed } from "lucide-react";

export const principali = [
  { href: "/", label: "Home", icon: Home },
  { href: "/oggi", label: "Oggi", icon: PencilLine },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/salute", label: "Salute", icon: HeartPulse },
];
export const altre = [
  { href: "/esami", label: "Esami del sangue", icon: FlaskConical },
  { href: "/consigli", label: "Consigli e avvisi", icon: Lightbulb },
  { href: "/report", label: "Report per il medico", icon: FileText },
  { href: "/impostazioni", label: "Impostazioni", icon: Settings },
];

